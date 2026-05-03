#!/usr/bin/env node
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { EXIT_CODES } from './constants.js';
import { VulnerabilityDatabase } from './database.js';
import { getCommonScanPaths, Scanner } from './scanner.js';
import { runAudit } from './audit.js';
import { renderJsonReport, renderSarifReport, renderTextReport } from './reporters.js';
import { queryLiveAdvisories } from './live-sources.js';
import { colorize, parsePackageSpec, sanitize, uniqueBy } from './utils.js';

const VERSION = '4.6.0';
const LIVE_VULNERABILITY_TYPES = new Set(['live-osv-advisory', 'live-github-advisory', 'live-github-malware-advisory']);

function parseArgs(argv) {
  const opts = {
    paths: [],
    scan: false,
    scanAll: false,
    check: null,
    update: false,
    json: false,
    sarif: false,
    quiet: false,
    offline: false,
    audit: false,
    live: false,
    liveSources: [],
    liveLimit: undefined,
    failOnAdvisory: false,
    autoUpdate: true,
    nodeModules: true,
    lockfiles: true,
    manifests: true,
    iocFiles: true,
    maxDepth: undefined,
    failOnWarning: false,
    color: process.env.NO_COLOR ? false : true,
    importCsv: [],
    outputFile: null,
    initCi: false,
    listDb: false,
    searchDb: null,
    help: false,
    version: false
  };

  const addLiveSource = (value) => {
    opts.live = true;
    for (const source of String(value || '').split(',')) {
      const s = source.trim().toLowerCase();
      if (!s) continue;
      if (s === 'all') opts.liveSources.push('osv', 'github');
      else if (['osv', 'osv.dev', 'cve', 'cves'].includes(s)) opts.liveSources.push('osv');
      else if (['github', 'ghsa', 'github-advisory', 'github-advisory-database'].includes(s)) opts.liveSources.push('github');
      else throw new Error(`Unknown live source: ${source}`);
    }
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') opts.help = true;
    else if (arg === '--version' || arg === '-v') opts.version = true;
    else if (arg === '--scan') { opts.scan = true; while (argv[i + 1] && !argv[i + 1].startsWith('-')) opts.paths.push(argv[++i]); }
    else if (arg === '--scan-all') { opts.scan = true; opts.scanAll = true; }
    else if (arg === '--check') opts.check = argv[++i];
    else if (arg === '--update') opts.update = true;
    else if (arg === '--json') opts.json = true;
    else if (arg === '--sarif') opts.sarif = true;
    else if (arg === '--quiet') opts.quiet = true;
    else if (arg === '--offline') opts.offline = true;
    else if (arg === '--audit') opts.audit = true;
    else if (arg === '--live' || arg === '--live-advisories') { opts.live = true; }
    else if (arg === '--no-live' || arg === '--no-live-advisories') { opts.live = false; opts.liveSources = []; }
    else if (arg === '--live-source') addLiveSource(argv[++i] || 'all');
    else if (arg === '--live-osv' || arg === '--live-cves' || arg === '--cve') addLiveSource('osv');
    else if (arg === '--live-github' || arg === '--live-ghsa') addLiveSource('github');
    else if (arg === '--live-limit') opts.liveLimit = Number(argv[++i]);
    else if (arg === '--fail-on-advisory' || arg === '--fail-on-cve') opts.failOnAdvisory = true;
    else if (arg === '--no-auto-update') opts.autoUpdate = false;
    else if (arg === '--auto-update') opts.autoUpdate = true;
    else if (arg === '--no-node-modules') opts.nodeModules = false;
    else if (arg === '--no-lockfiles') opts.lockfiles = false;
    else if (arg === '--no-manifests') opts.manifests = false;
    else if (arg === '--no-ioc-files') opts.iocFiles = false;
    else if (arg === '--lockfiles-only') { opts.nodeModules = false; opts.manifests = false; opts.iocFiles = false; opts.lockfiles = true; opts.scan = true; }
    else if (arg === '--manifests-only') { opts.nodeModules = false; opts.lockfiles = false; opts.iocFiles = false; opts.manifests = true; opts.scan = true; }
    else if (arg === '--max-depth') opts.maxDepth = Number(argv[++i]);
    else if (arg === '--fail-on-warning') opts.failOnWarning = true;
    else if (arg === '--no-color') opts.color = false;
    else if (arg === '--import-csv') opts.importCsv.push(argv[++i]);
    else if (arg === '--output' || arg === '-o') opts.outputFile = argv[++i];
    else if (arg === '--init-ci') opts.initCi = true;
    else if (arg === '--list-db') opts.listDb = true;
    else if (arg === '--search-db') opts.searchDb = argv[++i] || '';
    else if (arg === '--') { while (argv[i + 1]) opts.paths.push(argv[++i]); }
    else if (!arg.startsWith('-')) { opts.scan = true; opts.paths.push(arg); }
    else throw new Error(`Unknown option: ${arg}`);
  }

  opts.liveSources = Array.from(new Set(opts.liveSources));
  return opts;
}

function printHelp() {
  console.log(`Shai-Scanner ${VERSION}

Usage:
  shai-scanner [--scan <paths...>] [options]
  shai-scanner --check <package@version> [--live]
  shai-scanner --update

Core options:
  --scan <paths...>       Scan paths (defaults to current directory when no command is given)
  --scan-all              Scan common global npm/yarn/bun/project locations
  --check <pkg@version>   Check one exact package version
  --lockfiles-only        Scan lock files only; safe before npm install
  --manifests-only        Scan package.json dependency ranges only
  --audit                 Also run npm/pnpm/yarn audit for package-manager advisories
  --live                  Query live OSV.dev + GitHub Advisory Database for exact versions
  --live-osv, --live-cves Query only OSV.dev live advisories
  --live-github           Query only GitHub Advisory Database live advisories
  --live-source <sources> Comma list: all, osv, github
  --live-limit <n>        Maximum package versions to query live, default 5000
  --fail-on-advisory      Exit 1 when live CVE/GHSA/malware advisories are found
  --json                  Emit JSON report
  --sarif                 Emit SARIF report for GitHub code scanning
  --output, -o <file>     Write report to file

Database options:
  --update                Fetch latest Datadog IOC feeds and cache locally
  --offline               Disable all network calls, including live advisory queries
  --no-auto-update        Do not auto-refresh the IOC database before scanning
  --import-csv <file>     Merge custom IOC CSV into the local cache
  --list-db               Print known package/version IOCs
  --search-db <query>     Search known IOCs

Scan tuning:
  --no-node-modules       Do not inspect installed node_modules
  --no-lockfiles          Do not inspect lock files
  --no-manifests          Do not inspect package.json dependencies/scripts
  --no-ioc-files          Do not inspect known malicious filenames/workflows
  --max-depth <n>         Directory search depth, default 10
  --fail-on-warning       Exit 1 for suspicious non-package findings too
  --quiet                 Suppress progress text
  --no-color              Disable ANSI colors

Examples:
  shai-scanner --scan .
  shai-scanner --lockfiles-only --scan . --json
  shai-scanner --check intercom-client@7.0.4 --live
  shai-scanner --scan . --live --fail-on-advisory
  shai-scanner --scan . --live-osv --sarif -o shai-scanner.sarif
`);
}

function ciWorkflow() {
  return `name: Shai-Hulud supply-chain scan

on:
  push:
  pull_request:
  workflow_dispatch:

jobs:
  shai-scanner:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies without lifecycle scripts
        run: npm ci --ignore-scripts
      - name: Scan lockfiles, project tree, and live advisories
        run: npx shai-scanner --scan . --live --fail-on-advisory --sarif --output shai-scanner.sarif
      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: shai-scanner.sarif
`;
}

async function interactiveMenu(db, opts) {
  const colors = colorize(opts.color !== false);
  const rl = createInterface({ input, output });
  try {
    console.log(colors.bold(`\nShai-Scanner ${VERSION}`));
    console.log(`Database: ${db.getInfo().versionCount} package-version IOCs\n`);
    console.log('1) Scan current directory');
    console.log('2) Scan lockfiles only');
    console.log('3) Check package@version');
    console.log('4) Update IOC database');
    console.log('5) Search database');
    console.log('q) Quit');
    const choice = (await rl.question('\nSelect: ')).trim().toLowerCase();
    if (choice === '1') return runScan({ ...opts, scan: true, paths: ['.'] }, db);
    if (choice === '2') return runScan({ ...opts, scan: true, paths: ['.'], nodeModules: false, manifests: false, iocFiles: false, lockfiles: true }, db);
    if (choice === '3') {
      const spec = await rl.question('Package spec (name@version): ');
      return runCheck(spec, db, opts);
    }
    if (choice === '4') return runUpdate(db, opts);
    if (choice === '5') {
      const q = await rl.question('Search query: ');
      return runDatabaseList(db.search(q), opts);
    }
    return EXIT_CODES.SUCCESS;
  } finally {
    rl.close();
  }
}

async function main() {
  let opts;
  try { opts = parseArgs(process.argv.slice(2)); }
  catch (error) { console.error(`Error: ${error.message}`); printHelp(); process.exitCode = EXIT_CODES.INVALID_ARGS; return; }

  if (opts.help) { printHelp(); return; }
  if (opts.version) { console.log(VERSION); return; }
  if (opts.initCi) { console.log(ciWorkflow()); return; }

  if (opts.offline) process.env.SHAI_SCANNER_OFFLINE = '1';
  if (!opts.autoUpdate) process.env.SHAI_SCANNER_NO_AUTO_UPDATE = '1';

  const db = new VulnerabilityDatabase({ offline: opts.offline });

  for (const file of opts.importCsv) {
    const added = db.importCsvFile(resolve(file));
    if (!opts.quiet && !opts.json && !opts.sarif) console.error(`Imported ${added} IOC rows from ${file}`);
  }

  if (opts.update) { process.exitCode = await runUpdate(db, opts); return; }
  if (opts.listDb) { runDatabaseList(db.getAllEntries(), opts); return; }
  if (opts.searchDb !== null) { runDatabaseList(db.search(opts.searchDb), opts); return; }
  if (opts.check) { process.exitCode = await runCheck(opts.check, db, opts); return; }

  if (!opts.scan && process.stdin.isTTY && process.stdout.isTTY && !opts.json && !opts.sarif) {
    process.exitCode = await interactiveMenu(db, opts);
    return;
  }

  process.exitCode = await runScan({ ...opts, scan: true, paths: opts.paths.length ? opts.paths : ['.'] }, db);
}

async function maybeUpdate(db, opts) {
  if (!opts.autoUpdate || opts.offline || !db.shouldAutoUpdate()) return null;
  if (!opts.quiet && !opts.json && !opts.sarif) console.error('Refreshing IOC database...');
  const result = await db.update((msg) => {
    if (!opts.quiet && !opts.json && !opts.sarif) console.error(`  ${sanitize(msg)}`);
  });
  if (!result.success && !opts.quiet && !opts.json && !opts.sarif) {
    console.error(`Database update failed; using embedded/cache. ${result.errors.join('; ')}`);
  }
  return result;
}

async function runUpdate(db, opts) {
  const result = await db.update((msg) => {
    if (!opts.quiet && !opts.json) console.error(`  ${sanitize(msg)}`);
  });
  if (opts.json) {
    outputResult(JSON.stringify(result, null, 2), opts);
  } else {
    const colors = colorize(opts.color !== false);
    if (result.success) {
      outputResult(colors.green(`Database updated: ${result.before} -> ${result.after} package-version IOCs (${result.added} new)`), opts);
      if (result.errors.length) console.error(colors.yellow(`Partial errors: ${result.errors.join('; ')}`));
    } else {
      outputResult(colors.yellow(`Database update failed: ${result.errors.join('; ') || 'unknown error'}`), opts);
    }
  }
  return result.success ? EXIT_CODES.SUCCESS : EXIT_CODES.UPDATE_ERROR;
}

function liveRequested(opts) {
  return Boolean(opts.live || opts.liveSources.length > 0);
}

function liveSources(opts) {
  return opts.liveSources.length ? opts.liveSources : ['osv', 'github'];
}

function mergeFindings(result, extraFindings) {
  result.findings = uniqueBy([...(result.findings || []), ...(extraFindings || [])], (finding) => finding.id)
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || String(a.path || '').localeCompare(String(b.path || '')));
  result.vulnerabilities = result.findings.filter((finding) => isPackageVulnerability(finding));
  return result;
}

function isPackageVulnerability(finding) {
  return ['package-ioc', 'lockfile-ioc', 'manifest-ioc', 'manifest-self-ioc'].includes(finding.type) || LIVE_VULNERABILITY_TYPES.has(finding.type);
}

function severityRank(severity) {
  return { critical: 4, high: 3, medium: 2, low: 1 }[severity] || 0;
}

async function runLiveForInventory(inventory, opts) {
  return queryLiveAdvisories(inventory, {
    offline: opts.offline,
    sources: liveSources(opts),
    maxPackages: opts.liveLimit,
    timeoutMs: 20000
  }, (msg) => {
    if (!opts.quiet && !opts.json && !opts.sarif) process.stderr.write(`\r${sanitize(msg, 120)}                    `);
  });
}

async function runCheck(spec, db, opts) {
  await maybeUpdate(db, opts);
  const parsed = parsePackageSpec(spec);
  if (!parsed) {
    console.error('Invalid format. Use name@version or @scope/name@version.');
    return EXIT_CODES.INVALID_ARGS;
  }

  const entry = db.check(parsed.name, parsed.version);
  let live = null;
  if (liveRequested(opts)) {
    live = await runLiveForInventory([{ name: parsed.name, version: parsed.version, source: 'check' }], opts);
    if (!opts.quiet && !opts.json) process.stderr.write('\n');
  }

  if (opts.json) {
    outputResult(JSON.stringify({ package: parsed, compromised: Boolean(entry), entry, live }, null, 2), opts);
  } else {
    const colors = colorize(opts.color !== false);
    const lines = [];
    if (entry) {
      lines.push(`${colors.red('COMPROMISED')} ${parsed.name}@${parsed.version}`);
      lines.push(`Severity: ${entry.severity}`);
      lines.push(`Attack: ${entry.attack}`);
      lines.push(entry.description);
    } else {
      lines.push(`${colors.green('not listed in Shai-Hulud IOC database')} ${parsed.name}@${parsed.version}`);
    }
    if (live) {
      if (live.findings.length) {
        lines.push('');
        lines.push(colors.yellow(`Live advisory matches: ${live.findings.length}`));
        for (const finding of live.findings) {
          lines.push(`- ${finding.source}: ${finding.advisoryId || finding.attack || finding.type} ${finding.severity} — ${finding.description}`);
          if (finding.url) lines.push(`  ${finding.url}`);
        }
      } else if (live.enabled !== false) {
        lines.push('');
        lines.push(colors.green(`No live advisories matched this exact version from ${live.sources.join(', ') || 'selected sources'}.`));
      }
      for (const error of live.errors || []) lines.push(colors.yellow(`Live advisory warning: ${error}`));
    }
    outputResult(lines.join('\n'), opts);
  }

  return entry || live?.findings?.length ? EXIT_CODES.VULNERABILITIES_FOUND : EXIT_CODES.SUCCESS;
}

async function runScan(opts, db) {
  await maybeUpdate(db, opts);
  const paths = opts.scanAll ? getCommonScanPaths() : (opts.paths.length ? opts.paths : ['.']);
  const scanner = new Scanner(db, { maxSearchDepth: opts.maxDepth, maxLockfileDepth: opts.maxDepth, maxManifestDepth: opts.maxDepth });
  const result = await scanner.scan(paths.length ? paths : ['.'], {
    includeNodeModules: opts.nodeModules,
    includeLockfiles: opts.lockfiles,
    includeManifests: opts.manifests,
    includeIocFiles: opts.iocFiles
  }, (progress) => {
    if (!opts.quiet && !opts.json && !opts.sarif) process.stderr.write(`\r${progress.phase}: ${sanitize(progress.path, 100)}                    `);
  });
  if (!opts.quiet && !opts.json && !opts.sarif) process.stderr.write('\n');

  let live = null;
  if (liveRequested(opts)) {
    live = await runLiveForInventory(result.inventory || [], opts);
    result.liveAdvisories = live;
    result.stats.livePackagesQueried = live.packagesQueried || 0;
    result.stats.liveFindings = live.findings.length;
    result.stats.liveSources = live.sources;
    for (const error of live.errors || []) result.warnings.push({ path: 'live-advisories', message: error });
    mergeFindings(result, live.findings);
    if (!opts.quiet && !opts.json && !opts.sarif) process.stderr.write('\n');
  }

  let auditResult = null;
  if (opts.audit) {
    auditResult = await runAudit(resolve(paths[0] || '.'), (msg) => {
      if (!opts.quiet && !opts.json && !opts.sarif) console.error(sanitize(msg));
    });
  }

  let report;
  if (opts.sarif) report = renderSarifReport(result);
  else if (opts.json) report = renderJsonReport(result, { auditResult });
  else report = renderTextReport(result, { auditResult, color: opts.color });
  outputResult(report, opts);

  const hasLocalPackageVuln = result.vulnerabilities.some((finding) => !LIVE_VULNERABILITY_TYPES.has(finding.type));
  const hasLiveAdvisory = (live?.findings?.length || 0) > 0;
  const hasWarning = result.findings.length > 0;
  return hasLocalPackageVuln || (opts.failOnAdvisory && hasLiveAdvisory) || (opts.failOnWarning && hasWarning) ? EXIT_CODES.VULNERABILITIES_FOUND : EXIT_CODES.SUCCESS;
}

function runDatabaseList(entries, opts) {
  if (opts.json) {
    outputResult(JSON.stringify(entries, null, 2), opts);
    return;
  }
  const colors = colorize(opts.color !== false);
  const lines = [];
  for (const entry of entries) {
    lines.push(`${colors.bold(entry.name)} ${entry.versions.join(', ')} ${entry.severity} ${entry.attack}`);
  }
  outputResult(lines.join('\n'), opts);
}

function outputResult(text, opts) {
  if (opts.outputFile) writeFileSync(resolve(opts.outputFile), `${text}\n`);
  else console.log(text);
}

main().catch((error) => {
  console.error(`Error: ${sanitize(error?.message || error)}`);
  process.exitCode = EXIT_CODES.SCAN_ERROR;
});
