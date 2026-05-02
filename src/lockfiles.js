import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { LOCK_FILE_NAMES } from './constants.js';
import { parseNameVersionFromPackageKey, safeReadJson, safeReadText, uniqueBy } from './utils.js';

function addPackage(out, name, version, source) {
  if (!name || !version) return;
  const n = String(name).trim();
  const v = String(version).trim().replace(/^v/, '');
  if (!n || !v || n === '.' || v === 'undefined') return;
  out.push({ name: n, version: v, source });
}

function nameFromPackageLockPath(pkgPath) {
  const parts = String(pkgPath).replace(/\\/g, '/').split('/');
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i] !== 'node_modules') continue;
    const first = parts[i + 1];
    if (!first) continue;
    if (first.startsWith('@')) {
      const second = parts[i + 2];
      return second ? `${first}/${second}` : null;
    }
    return first;
  }
  return null;
}

function parsePackageLockDeps(deps, out) {
  if (!deps || typeof deps !== 'object') return;
  for (const [name, data] of Object.entries(deps)) {
    if (!data || typeof data !== 'object') continue;
    if (data.version) addPackage(out, name, data.version, 'package-lock:dependencies');
    if (data.dependencies) parsePackageLockDeps(data.dependencies, out);
  }
}

export function parsePackageLock(filePath) {
  const data = safeReadJson(filePath, 25 * 1024 * 1024);
  const packages = [];
  if (!data || typeof data !== 'object') return packages;

  if (data.packages && typeof data.packages === 'object') {
    for (const [pkgPath, pkgData] of Object.entries(data.packages)) {
      if (!pkgPath || pkgPath === '' || !pkgData || typeof pkgData !== 'object') continue;
      const version = pkgData.version;
      if (!version) continue;
      const name = pkgData.name || nameFromPackageLockPath(pkgPath);
      addPackage(packages, name, version, 'package-lock:packages');
    }
  }

  if (data.dependencies && typeof data.dependencies === 'object') {
    parsePackageLockDeps(data.dependencies, packages);
  }

  return uniqueBy(packages, (p) => `${p.name}@${p.version}`);
}

function splitYarnHeader(header) {
  const cleaned = header.trim().replace(/:$/, '').replace(/^"|"$/g, '');
  const selectors = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === '"') inQuotes = !inQuotes;
    if (ch === ',' && !inQuotes) {
      selectors.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) selectors.push(current.trim().replace(/^"|"$/g, ''));
  return selectors;
}

function yarnSelectorToName(selector) {
  const s = selector.trim().replace(/^"|"$/g, '');
  if (!s || s.startsWith('__metadata')) return null;
  if (s.startsWith('@')) {
    const slash = s.indexOf('/');
    if (slash < 0) return null;
    const atAfterName = s.indexOf('@', slash + 1);
    if (atAfterName < 0) return s;
    return s.slice(0, atAfterName);
  }
  const at = s.indexOf('@');
  if (at <= 0) return null;
  return s.slice(0, at);
}

export function parseYarnLock(filePath) {
  const text = safeReadText(filePath, 25 * 1024 * 1024);
  const packages = [];
  if (!text) return packages;
  const lines = text.split(/\r?\n/);
  let names = [];

  for (const raw of lines) {
    const line = raw.replace(/\r$/, '');
    if (!line.trim() || line.startsWith('#')) continue;
    if (!/^\s/.test(line) && line.includes('@') && line.trim().endsWith(':')) {
      names = splitYarnHeader(line).map(yarnSelectorToName).filter(Boolean);
      continue;
    }
    const versionMatch = line.match(/^\s+version\s+"?([^"\s]+)"?/);
    if (versionMatch && names.length > 0) {
      for (const name of names) addPackage(packages, name, versionMatch[1], 'yarn.lock');
      names = [];
    }
  }

  return uniqueBy(packages, (p) => `${p.name}@${p.version}`);
}

function parsePnpmPackageKey(rawKey) {
  let key = String(rawKey ?? '').trim().replace(/^['"]|['"]$/g, '').replace(/:$/, '');
  if (!key || key === 'packages') return null;
  key = key.replace(/^\//, '').replace(/\([^)]*\)$/g, '');
  if (key.includes('>')) key = key.split('>').pop();
  return parseNameVersionFromPackageKey(key);
}

export function parsePnpmLock(filePath) {
  const text = safeReadText(filePath, 50 * 1024 * 1024);
  const packages = [];
  if (!text) return packages;
  const lines = text.split(/\r?\n/);
  let inPackages = false;
  let packageIndent = null;

  for (const line of lines) {
    if (/^packages:\s*$/.test(line)) {
      inPackages = true;
      packageIndent = null;
      continue;
    }
    if (inPackages && /^\S/.test(line) && !/^packages:/.test(line)) {
      inPackages = false;
      packageIndent = null;
    }
    if (!inPackages) continue;
    const match = line.match(/^(\s{2,})(['"]?[^'"]+['"]?):\s*$/);
    if (!match) continue;
    if (packageIndent === null) packageIndent = match[1].length;
    if (match[1].length !== packageIndent) continue;
    const parsed = parsePnpmPackageKey(match[2]);
    if (parsed) addPackage(packages, parsed.name, parsed.version, 'pnpm-lock.yaml');
  }

  // Fallback for older pnpm lock formats or if indentation heuristic missed keys.
  if (packages.length === 0) {
    for (const line of lines) {
      const match = line.match(/^\s{2,}['"]?\/?(@?[^:'"]+\/[^@:'"]+|[^@:'"/]+)@([^:'"()]+).*['"]?:\s*$/);
      if (match) addPackage(packages, match[1], match[2], 'pnpm-lock.yaml:fallback');
    }
  }

  return uniqueBy(packages, (p) => `${p.name}@${p.version}`);
}

export function parseBunLock(filePath) {
  const text = safeReadText(filePath, 50 * 1024 * 1024);
  const packages = [];
  if (!text) return packages;
  try {
    const data = JSON.parse(text);
    if (data && typeof data === 'object' && data.packages && typeof data.packages === 'object') {
      for (const [key, value] of Object.entries(data.packages)) {
        const parsed = parseNameVersionFromPackageKey(key);
        if (parsed) addPackage(packages, parsed.name, parsed.version, 'bun.lock:packages');
        if (Array.isArray(value) && typeof value[0] === 'string') {
          const p2 = parseNameVersionFromPackageKey(value[0]);
          if (p2) addPackage(packages, p2.name, p2.version, 'bun.lock:array');
        }
      }
    }
  } catch {
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\s*["']?(@?[^@"':]+(?:\/[^@"':]+)?)@([^"':\s]+)["']?:/);
      if (match) addPackage(packages, match[1], match[2], 'bun.lock:text');
    }
  }
  return uniqueBy(packages, (p) => `${p.name}@${p.version}`);
}

export function parseLockFile(filePath) {
  if (filePath.endsWith('package-lock.json') || filePath.endsWith('npm-shrinkwrap.json')) return parsePackageLock(filePath);
  if (filePath.endsWith('yarn.lock')) return parseYarnLock(filePath);
  if (filePath.endsWith('pnpm-lock.yaml')) return parsePnpmLock(filePath);
  if (filePath.endsWith('bun.lock')) return parseBunLock(filePath);
  if (filePath.endsWith('bun.lockb')) return { packages: [], warning: 'bun.lockb is binary and cannot be parsed; use bun.lock or scan node_modules.' };
  return [];
}

export function findLockFilesInDirectory(dir) {
  return LOCK_FILE_NAMES.map((name) => join(dir, name)).filter((p) => existsSync(p));
}
