import { existsSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import {
  CONFIG_FILE_PATTERNS,
  DEFAULTS,
  IOC_DIRECTORY_NAMES,
  IOC_FILE_NAMES,
  LOCK_FILE_NAMES,
  PROJECT_MANIFEST_NAMES,
  SKIP_DIRS,
  SUSPICIOUS_SCRIPT_PATTERNS,
  WORKFLOW_PATTERNS
} from './constants.js';
import { parseLockFile } from './lockfiles.js';
import {
  clampInt,
  packageNameFromNodeModulesPath,
  safeIsDirectory,
  safeReadJson,
  safeReadText,
  safeReaddir,
  safeRealpath,
  safeStat,
  sanitize,
  sha256File,
  uniqueBy
} from './utils.js';

const DEP_FIELDS = Object.freeze([
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
  'bundledDependencies',
  'bundleDependencies',
  'resolutions',
  'overrides'
]);

function severityRank(severity) {
  return { low: 1, medium: 2, high: 3, critical: 4 }[severity] || 0;
}

function isDirectoryEntry(entry, parent, followSymlinks) {
  if (entry.isDirectory()) return true;
  if (!followSymlinks || !entry.isSymbolicLink()) return false;
  return safeIsDirectory(join(parent, entry.name));
}

function shouldSkipDir(name, allowNodeModules = false) {
  if (name === 'node_modules') return !allowNodeModules;
  if (name.startsWith('.') && !['.github', '.vscode', '.claude', '.dev-env', '.pnpm'].includes(name)) return true;
  return SKIP_DIRS.has(name);
}

function mergeInventory(items) {
  const map = new Map();
  for (const item of items) {
    const name = String(item?.name || '').trim();
    const version = String(item?.version || '').trim().replace(/^v/, '');
    if (!name || !version) continue;
    const key = `${name}@${version}`;
    const existing = map.get(key) || { name, version, paths: [], sources: [] };
    if (item.path && !existing.paths.includes(item.path)) existing.paths.push(item.path);
    if (item.source && !existing.sources.includes(item.source)) existing.sources.push(item.source);
    map.set(key, existing);
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));
}

const VULNERABILITY_FINDING_TYPES = new Set(['package-ioc', 'lockfile-ioc', 'manifest-ioc', 'manifest-self-ioc', 'live-osv-advisory', 'live-github-advisory', 'live-github-malware-advisory']);

function makeFinding(fields) {
  return {
    id: `${fields.type}:${fields.packageName || ''}:${fields.packageVersion || ''}:${fields.path || ''}:${fields.evidence || ''}`,
    type: fields.type,
    severity: fields.severity || 'medium',
    path: fields.path || '',
    packageName: fields.packageName,
    packageVersion: fields.packageVersion,
    attack: fields.attack,
    description: fields.description || '',
    evidence: fields.evidence || '',
    source: fields.source || '',
    remediation: fields.remediation || remediationFor(fields.type, fields.packageName, fields.packageVersion)
  };
}

function remediationFor(type, name, version) {
  if (type.includes('package') || type.includes('lockfile') || type.includes('manifest')) {
    return `Remove or pin away from ${name || 'the affected package'}${version ? `@${version}` : ''}; reinstall with lifecycle scripts disabled, then rotate exposed credentials.`;
  }
  if (type.includes('workflow')) return 'Inspect the workflow, remove unauthorized triggers/steps, rotate GitHub tokens and audit Actions logs.';
  if (type.includes('script')) return 'Review install lifecycle scripts; reinstall with --ignore-scripts until trusted.';
  return 'Investigate this indicator and rotate credentials if the package was installed or executed.';
}

export function getCommonScanPaths() {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const candidates = [];
  if (process.platform === 'win32') {
    if (process.env.APPDATA) candidates.push(join(process.env.APPDATA, 'npm', 'node_modules'));
    if (process.env.LOCALAPPDATA) candidates.push(join(process.env.LOCALAPPDATA, 'Yarn', 'Data', 'global', 'node_modules'));
    if (home) candidates.push(join(home, '.bun', 'install', 'global', 'node_modules'), join(home, 'Projects'), join(home, 'Code'), join(home, 'source'), join(home, 'repos'));
  } else if (process.platform === 'darwin') {
    candidates.push('/usr/local/lib/node_modules', '/opt/homebrew/lib/node_modules');
    if (home) candidates.push(join(home, '.npm-global', 'lib', 'node_modules'), join(home, '.yarn', 'global', 'node_modules'), join(home, '.bun', 'install', 'global', 'node_modules'), join(home, 'Developer'), join(home, 'Projects'), join(home, 'Code'), join(home, 'workspace'));
  } else {
    candidates.push('/usr/lib/node_modules', '/usr/local/lib/node_modules');
    if (home) candidates.push(join(home, '.npm-global', 'lib', 'node_modules'), join(home, '.yarn', 'global', 'node_modules'), join(home, '.bun', 'install', 'global', 'node_modules'), join(home, 'projects'), join(home, 'code'), join(home, 'dev'), join(home, 'workspace'));
  }
  return Array.from(new Set(candidates.filter((p) => p && existsSync(p))));
}

export class Scanner {
  constructor(db, options = {}) {
    this.db = db;
    this.maxSearchDepth = clampInt(options.maxSearchDepth, 0, 50, DEFAULTS.MAX_SEARCH_DEPTH);
    this.maxLockfileDepth = clampInt(options.maxLockfileDepth, 0, 50, DEFAULTS.MAX_LOCKFILE_DEPTH);
    this.maxManifestDepth = clampInt(options.maxManifestDepth, 0, 50, DEFAULTS.MAX_MANIFEST_DEPTH);
    this.maxPackageJsonBytes = clampInt(options.maxPackageJsonBytes, 1024, 10 * 1024 * 1024, DEFAULTS.MAX_PACKAGE_JSON_BYTES);
    this.followSymlinks = options.followSymlinks !== false;
  }

  async scan(paths, options = {}, onProgress) {
    const includeNodeModules = options.includeNodeModules !== false;
    const includeLockfiles = options.includeLockfiles !== false;
    const includeManifests = options.includeManifests !== false;
    const includeIocFiles = options.includeIocFiles !== false;
    const scanPaths = (paths && paths.length ? paths : ['.']).map((p) => resolve(p));
    const start = Date.now();
    const findings = [];
    const warnings = [];
    const inventory = [];
    const stats = {
      scannedPaths: scanPaths,
      nodeModulesFound: 0,
      packagesScanned: 0,
      lockFilesScanned: 0,
      lockfilePackagesScanned: 0,
      manifestsScanned: 0,
      iocFilesScanned: 0,
      workflowsScanned: 0,
      inventoryPackages: 0
    };

    const pushFinding = (finding) => findings.push(makeFinding(finding));

    if (includeLockfiles) {
      const lockFiles = this.findFiles(scanPaths, new Set(LOCK_FILE_NAMES), this.maxLockfileDepth, { allowNodeModules: false });
      for (const file of lockFiles) {
        onProgress?.({ phase: 'lockfiles', path: file, stats });
        const parsed = parseLockFile(file);
        stats.lockFilesScanned++;
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.warning) {
          warnings.push({ path: file, message: parsed.warning });
          continue;
        }
        const packages = Array.isArray(parsed) ? parsed : [];
        stats.lockfilePackagesScanned += packages.length;
        for (const pkg of packages) {
          inventory.push({ name: pkg.name, version: pkg.version, path: file, source: pkg.source || basename(file) });
          const entry = this.db.check(pkg.name, pkg.version);
          if (!entry) continue;
          pushFinding({
            type: 'lockfile-ioc',
            severity: entry.severity,
            path: file,
            packageName: pkg.name,
            packageVersion: pkg.version,
            attack: entry.attack,
            description: entry.description,
            evidence: `${pkg.name}@${pkg.version} in ${basename(file)}`,
            source: entry.sources?.join(',') || pkg.source
          });
        }
      }
    }

    if (includeManifests) {
      const manifests = this.findFiles(scanPaths, new Set(PROJECT_MANIFEST_NAMES), this.maxManifestDepth, { allowNodeModules: false });
      for (const manifest of manifests) {
        onProgress?.({ phase: 'manifests', path: manifest, stats });
        this.scanManifest(manifest, pushFinding);
        stats.manifestsScanned++;
      }
    }

    if (includeNodeModules) {
      const nodeModules = this.findNodeModules(scanPaths);
      stats.nodeModulesFound = nodeModules.length;
      for (const nm of nodeModules) {
        onProgress?.({ phase: 'node_modules', path: nm, stats });
        const packages = this.extractInstalledPackages(nm);
        for (const pkg of packages) {
          stats.packagesScanned++;
          inventory.push({ name: pkg.name, version: pkg.version, path: pkg.path, source: 'node_modules' });
          const entry = this.db.check(pkg.name, pkg.version);
          if (entry) {
            pushFinding({
              type: 'package-ioc',
              severity: entry.severity,
              path: pkg.path,
              packageName: pkg.name,
              packageVersion: pkg.version,
              attack: entry.attack,
              description: entry.description,
              evidence: `${pkg.name}@${pkg.version} installed in node_modules`,
              source: entry.sources?.join(',') || 'database'
            });
          }
          this.scanPackageScripts(pkg.path, pkg.name, pkg.version, pushFinding);
          if (includeIocFiles) this.scanPackageIocFiles(pkg.path, pkg.name, pkg.version, pushFinding, stats);
          if (stats.packagesScanned % 250 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }
    }

    if (includeIocFiles) {
      this.scanProjectIocFiles(scanPaths, pushFinding, stats);
      this.scanWorkflowFiles(scanPaths, pushFinding, stats);
      this.scanConfigPersistenceFiles(scanPaths, pushFinding, stats);
    }

    const uniqueFindings = uniqueBy(findings, (f) => f.id)
      .sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || String(a.path).localeCompare(String(b.path)));
    const packageInventory = mergeInventory(inventory);
    stats.inventoryPackages = packageInventory.length;
    const duration = Date.now() - start;
    return {
      tool: { name: 'shai-scanner', version: '4.5.0' },
      scannedPaths: scanPaths,
      findings: uniqueFindings,
      vulnerabilities: uniqueFindings.filter((f) => VULNERABILITY_FINDING_TYPES.has(f.type)),
      warnings,
      inventory: packageInventory,
      stats,
      database: this.db.getInfo(),
      scanTimeMs: duration
    };
  }

  scanManifest(manifestPath, pushFinding) {
    const manifest = safeReadJson(manifestPath, this.maxPackageJsonBytes);
    if (!manifest || typeof manifest !== 'object') return;
    const manifestDir = dirname(manifestPath);

    if (typeof manifest.name === 'string' && typeof manifest.version === 'string') {
      const entry = this.db.check(manifest.name, manifest.version);
      if (entry) {
        pushFinding({
          type: 'manifest-self-ioc',
          severity: entry.severity,
          path: manifestPath,
          packageName: manifest.name,
          packageVersion: manifest.version,
          attack: entry.attack,
          description: entry.description,
          evidence: `Manifest itself is ${manifest.name}@${manifest.version}`,
          source: entry.sources?.join(',') || 'database'
        });
      }
    }

    for (const field of DEP_FIELDS) {
      const deps = manifest[field];
      if (!deps || typeof deps !== 'object' || Array.isArray(deps)) continue;
      for (const [name, spec] of Object.entries(deps)) {
        const entry = this.db.checkManifestRange(name, String(spec));
        if (!entry) continue;
        pushFinding({
          type: 'manifest-ioc',
          severity: entry.severity === 'critical' ? 'high' : entry.severity,
          path: manifestPath,
          packageName: name,
          packageVersion: String(spec),
          attack: entry.attack,
          description: `${entry.description} Dependency range may resolve to known malicious version(s): ${entry.versions.join(', ')}`,
          evidence: `${field}.${name} = ${spec}`,
          source: entry.sources?.join(',') || 'database'
        });
      }
    }

    this.scanScriptsObject(manifest.scripts, manifestPath, manifest.name, manifest.version, pushFinding);

    // Workspaces can hide package.json files deeper than the generic manifest depth.
    if (Array.isArray(manifest.workspaces)) {
      for (const pattern of manifest.workspaces) {
        if (typeof pattern !== 'string' || !pattern.endsWith('/*')) continue;
        const workspaceRoot = join(manifestDir, pattern.slice(0, -2));
        for (const entry of safeReaddir(workspaceRoot)) {
          const childManifest = join(workspaceRoot, entry.name, 'package.json');
          if (entry.isDirectory() && existsSync(childManifest)) this.scanManifest(childManifest, pushFinding);
        }
      }
    }
  }

  scanPackageScripts(pkgPath, name, version, pushFinding) {
    const manifestPath = join(pkgPath, 'package.json');
    const manifest = safeReadJson(manifestPath, this.maxPackageJsonBytes);
    if (!manifest || typeof manifest !== 'object') return;
    this.scanScriptsObject(manifest.scripts, manifestPath, name, version, pushFinding);
  }

  scanScriptsObject(scripts, manifestPath, packageName, packageVersion, pushFinding) {
    if (!scripts || typeof scripts !== 'object' || Array.isArray(scripts)) return;
    for (const [scriptName, command] of Object.entries(scripts)) {
      if (typeof command !== 'string') continue;
      for (const detector of SUSPICIOUS_SCRIPT_PATTERNS) {
        if (!detector.pattern.test(command)) continue;
        pushFinding({
          type: 'suspicious-script',
          severity: detector.severity,
          path: manifestPath,
          packageName,
          packageVersion,
          description: detector.label,
          evidence: `${scriptName}: ${sanitize(command, 240)}`,
          source: detector.id
        });
      }
    }
  }

  scanPackageIocFiles(pkgPath, name, version, pushFinding, stats) {
    for (const fileName of IOC_FILE_NAMES) {
      const filePath = join(pkgPath, fileName);
      if (!existsSync(filePath)) continue;
      const hash = sha256File(filePath, 25 * 1024 * 1024);
      stats.iocFilesScanned++;
      const severity = 'high';
      pushFinding({
        type: 'suspicious-file',
        severity,
        path: filePath,
        packageName: name,
        packageVersion: version,
        description: `Known Shai-Hulud or Mini Shai-Hulud filename present: ${fileName}`,
        evidence: hash ? `sha256:${hash}` : fileName,
        source: 'filename-ioc'
      });
    }
  }

  scanProjectIocFiles(scanPaths, pushFinding, stats) {
    const names = new Set([...IOC_FILE_NAMES, ...IOC_DIRECTORY_NAMES]);
    const files = this.findFiles(scanPaths, names, this.maxManifestDepth, { allowNodeModules: false, includeDirectories: true });
    for (const file of files) {
      const base = basename(file);
      if (base === 'package.json') continue;
      stats.iocFilesScanned++;
      pushFinding({
        type: IOC_DIRECTORY_NAMES.includes(base) ? 'suspicious-directory' : 'suspicious-file',
        severity: 'high',
        path: file,
        description: `Known Shai-Hulud-related artifact name: ${base}`,
        evidence: base,
        source: 'project-ioc-name'
      });
    }
  }

  scanWorkflowFiles(scanPaths, pushFinding, stats) {
    const workflowFiles = [];
    for (const base of scanPaths) {
      const workflowDir = join(base, '.github', 'workflows');
      for (const entry of safeReaddir(workflowDir)) {
        if (!entry.isFile()) continue;
        if (!/\.(ya?ml)$/i.test(entry.name)) continue;
        workflowFiles.push(join(workflowDir, entry.name));
      }
    }
    for (const file of workflowFiles) {
      const text = safeReadText(file, DEFAULTS.MAX_TEXT_FILE_BYTES);
      if (!text) continue;
      stats.workflowsScanned++;
      for (const detector of WORKFLOW_PATTERNS) {
        if (!detector.pattern.test(text)) continue;
        pushFinding({
          type: 'suspicious-workflow',
          severity: detector.severity,
          path: file,
          description: detector.label,
          evidence: detector.id,
          source: 'workflow-detector'
        });
      }
    }
  }

  scanConfigPersistenceFiles(scanPaths, pushFinding, stats) {
    const targets = new Set(['settings.json', 'tasks.json']);
    const files = this.findFiles(scanPaths, targets, this.maxManifestDepth, { allowNodeModules: false });
    for (const file of files) {
      if (!file.includes(`${'.claude'}`) && !file.includes(`${'.vscode'}`)) continue;
      const text = safeReadText(file, DEFAULTS.MAX_TEXT_FILE_BYTES);
      if (!text) continue;
      for (const detector of CONFIG_FILE_PATTERNS) {
        if (!detector.pattern.test(text)) continue;
        stats.iocFilesScanned++;
        pushFinding({
          type: 'suspicious-config',
          severity: detector.severity,
          path: file,
          description: detector.label,
          evidence: detector.id,
          source: 'config-detector'
        });
      }
    }
  }

  findNodeModules(scanPaths) {
    const results = [];
    const visited = new Set();
    for (const base of scanPaths) this.walkForNodeModules(base, 0, visited, results);
    return Array.from(new Set(results.map(safeRealpath))).map((real) => results.find((p) => safeRealpath(p) === real) || real);
  }

  walkForNodeModules(dir, depth, visited, results) {
    if (depth > this.maxSearchDepth || !safeIsDirectory(dir)) return;
    const real = safeRealpath(dir);
    if (visited.has(real)) return;
    visited.add(real);
    for (const entry of safeReaddir(dir)) {
      if (!isDirectoryEntry(entry, dir, this.followSymlinks)) continue;
      if (entry.name === 'node_modules') {
        results.push(join(dir, entry.name));
        continue;
      }
      if (shouldSkipDir(entry.name, false)) continue;
      this.walkForNodeModules(join(dir, entry.name), depth + 1, visited, results);
    }
  }

  extractInstalledPackages(nodeModulesDir) {
    const out = [];
    const seen = new Set();
    const queue = [nodeModulesDir];
    while (queue.length > 0) {
      const nm = queue.shift();
      const nmReal = safeRealpath(nm);
      if (seen.has(`nm:${nmReal}`)) continue;
      seen.add(`nm:${nmReal}`);
      for (const entry of safeReaddir(nm)) {
        if (!isDirectoryEntry(entry, nm, this.followSymlinks)) continue;
        if (entry.name.startsWith('.') && entry.name !== '.pnpm') continue;
        const entryPath = join(nm, entry.name);
        if (entry.name === '.pnpm') {
          for (const pnpmEntry of safeReaddir(entryPath)) {
            const nested = join(entryPath, pnpmEntry.name, 'node_modules');
            if (safeIsDirectory(nested)) queue.push(nested);
          }
          continue;
        }
        if (entry.name.startsWith('@')) {
          for (const scopedEntry of safeReaddir(entryPath)) {
            if (!isDirectoryEntry(scopedEntry, entryPath, this.followSymlinks)) continue;
            const pkgPath = join(entryPath, scopedEntry.name);
            const pkg = this.readInstalledPackage(pkgPath);
            if (pkg) out.push(pkg);
            const nested = join(pkgPath, 'node_modules');
            if (safeIsDirectory(nested)) queue.push(nested);
          }
        } else {
          const pkg = this.readInstalledPackage(entryPath);
          if (pkg) out.push(pkg);
          const nested = join(entryPath, 'node_modules');
          if (safeIsDirectory(nested)) queue.push(nested);
        }
      }
    }
    return uniqueBy(out, (p) => `${safeRealpath(p.path)}:${p.name}@${p.version}`);
  }

  readInstalledPackage(pkgPath) {
    const manifestPath = join(pkgPath, 'package.json');
    const st = safeStat(manifestPath);
    if (!st?.isFile() || st.size > this.maxPackageJsonBytes) return null;
    const manifest = safeReadJson(manifestPath, this.maxPackageJsonBytes);
    if (!manifest || typeof manifest !== 'object') return null;
    const fallbackName = packageNameFromNodeModulesPath(pkgPath);
    const name = typeof manifest.name === 'string' && manifest.name.trim() ? manifest.name.trim() : fallbackName;
    const version = typeof manifest.version === 'string' && manifest.version.trim() ? manifest.version.trim() : null;
    if (!name || !version) return null;
    return { name, version, path: pkgPath };
  }

  findFiles(scanPaths, names, maxDepth, options = {}) {
    const results = [];
    const visited = new Set();
    for (const base of scanPaths) this.walkForFiles(base, names, maxDepth, 0, visited, results, options);
    return Array.from(new Set(results));
  }

  walkForFiles(dir, names, maxDepth, depth, visited, results, options) {
    if (depth > maxDepth || !safeIsDirectory(dir)) return;
    const real = safeRealpath(dir);
    if (visited.has(real)) return;
    visited.add(real);
    for (const entry of safeReaddir(dir)) {
      const path = join(dir, entry.name);
      const dirLike = isDirectoryEntry(entry, dir, this.followSymlinks);
      if (names.has(entry.name) && (entry.isFile?.() || options.includeDirectories || !dirLike)) {
        results.push(path);
      }
      if (!dirLike) continue;
      if (shouldSkipDir(entry.name, options.allowNodeModules)) continue;
      this.walkForFiles(path, names, maxDepth, depth + 1, visited, results, options);
    }
  }
}
