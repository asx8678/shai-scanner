// src/tui/components/app-scan.js
// Scanning screen — Component-mode render, legacy interactive scan execution,
// live-advisory phase, audit phase, and related helpers.
//
// Exports:
//   renderScanningToScreen(screen, _ctx, row, c)
//   runLegacyScanning({ scanOptions, db, c, navigateTo, onSaveState })
//   mergeFindings(results, newFindings)
//   applyFailConditions({ results, scanOptions, scanStartMs })

import { sanitize } from '../../utils.js';
import { LiveProgress } from '../../tui.js';
import { EXIT_CODES } from '../../constants.js';
import { stdin as processStdin, stdout as processStdout } from 'node:process';

// ─── Lazy-loaded modules ─────────────────────────────────────────────────────
let _scanner, _liveSources, _audit;

async function getScannerModule() {
  return (_scanner ??= await import('../../scanner.js'));
}
async function getLiveSourcesModule() {
  return (_liveSources ??= await import('../../live-sources.js'));
}
async function getAuditModule() {
  return (_audit ??= await import('../../audit.js'));
}

// ─── Component-mode render ───────────────────────────────────────────────────

/**
 * Render the scanning-in-progress placeholder in Component mode.
 * @returns {number} next row
 */
export function renderScanningToScreen(screen, _ctx, row, c) {
  const write = (r, text) => {
    if (r >= 0 && r < screen.rows) screen.setLine(r, text);
    return r + 1;
  };

  row = write(row, '');
  row = write(row, c.cyan('  ⏳ Scanning in progress...'));
  row = write(row, c.dim('  Use legacy mode (run()) for live progress updates'));
  row = write(row, '');
  return row;
}

// ─── Legacy interactive scan ─────────────────────────────────────────────────

const PHASE_LABELS = {
  lockfiles: 'Lock files',
  manifests: 'Manifests',
  node_modules: 'node_modules',
  ioc_files: 'IOC files',
  workflows: 'Workflows',
};

/**
 * Execute the full scan in legacy async-loop mode with live progress.
 *
 * @param {object} opts
 * @param {object}   opts.scanOptions
 * @param {object}   opts.db - VulnerabilityDatabase instance
 * @param {object}   opts.c  - colorize helper
 * @param {function} opts.navigateTo
 * @param {function} [opts.onSaveState] - optional callback to persist state
 * @returns {{ results: object, exitCode: number }}
 */
export async function runLegacyScanning({ scanOptions, db, c, navigateTo, onSaveState }) {
  const { Scanner } = await getScannerModule();
  const scanner = new Scanner(db, {
    maxSearchDepth: scanOptions.maxDepth,
    maxLockfileDepth: scanOptions.maxDepth,
    maxManifestDepth: scanOptions.maxDepth,
  });

  const phases = [];
  if (scanOptions.includeLockfiles) phases.push('Lock files');
  if (scanOptions.includeManifests) phases.push('Manifests');
  if (scanOptions.includeNodeModules) phases.push('node_modules');
  if (scanOptions.includeIocFiles) {
    phases.push('IOC files');
    phases.push('Workflows');
  }
  if (scanOptions.live) phases.push('Live advisories');
  if (scanOptions.audit) phases.push('Audit');

  const progress = new LiveProgress();
  progress.setPhases(phases);
  progress.setStats({ packages: 0, findings: 0 });
  progress.start();

  let activePhase = null;
  const scanStartMs = Date.now();
  let results = null;
  let exitCode = EXIT_CODES.SUCCESS;

  try {
    results = await scanner.scan(
      scanOptions.paths,
      {
        includeNodeModules: scanOptions.includeNodeModules,
        includeLockfiles: scanOptions.includeLockfiles,
        includeManifests: scanOptions.includeManifests,
        includeIocFiles: scanOptions.includeIocFiles,
      },
      (info) => {
        const phaseName = PHASE_LABELS[info.phase] || info.phase;
        if (phaseName !== activePhase) {
          if (activePhase) progress.update(activePhase, { status: 'done' });
          activePhase = phaseName;
        }
        const elapsed = (Date.now() - scanStartMs) / 1000;
        const pkgPerSec = elapsed > 0 ? Math.round(info.stats.packagesScanned / elapsed) : 0;
        progress.update(phaseName, { status: 'active', detail: sanitize(info.path, 60) });
        progress.setStats({
          packages: info.stats.packagesScanned,
          findings: results ? results.findings.length : 0,
          rate: `${pkgPerSec} pkg/s`,
        });
      },
    );

    for (const name of Object.values(PHASE_LABELS)) {
      if (phases.includes(name)) progress.update(name, { status: 'done' });
    }

    if (scanOptions.live) await runLiveAdvisoryPhase({ results, scanOptions, progress });
    if (scanOptions.audit) await runAuditPhase({ results, scanOptions, progress });

    exitCode = applyFailConditions({ results, scanOptions, scanStartMs, progress });
    progress.done();
    if (onSaveState) await onSaveState();
    navigateTo('results');
  } catch (error) {
    progress.done();
    const msg = sanitize(error?.message || String(error));
    processStdout.write(`\n${c.red('Scan failed:')} ${msg}\n`);
    if (msg.includes('permission') || msg.includes('EACCES')) {
      processStdout.write(
        c.yellow('  Tip: Use CLI flags with the right permissions: shai-scanner --scan <path>\n'),
      );
    } else if (msg.includes('memory') || msg.includes('heap')) {
      processStdout.write(
        c.yellow('  Tip: Reduce scope with --no-node-modules --lockfiles-only\n'),
      );
    }
    exitCode = EXIT_CODES.SCAN_ERROR;
    navigateTo('main-menu');
  }

  return { results, exitCode };
}

// ─── Phase helpers ───────────────────────────────────────────────────────────

/**
 * Query live advisory sources and merge results.
 * @param {object} opts
 * @param {object}   opts.results - mutable scan results
 * @param {object}   opts.scanOptions
 * @param {LiveProgress} opts.progress
 */
async function runLiveAdvisoryPhase({ results, scanOptions, progress }) {
  const { queryLiveAdvisories } = await getLiveSourcesModule();
  progress.update('Live advisories', {
    status: 'active',
    detail: `Querying ${scanOptions.liveSources.join(', ')}...`,
  });

  try {
    const liveResult = await queryLiveAdvisories(
      results.inventory,
      { sources: scanOptions.liveSources, maxPackages: scanOptions.liveLimit },
      (msg) =>
        progress.update('Live advisories', { status: 'active', detail: sanitize(String(msg), 60) }),
    );
    mergeFindings(results, liveResult.findings);
    results.liveAdvisories = liveResult;
    if (liveResult.errors.length > 0) results.liveWarnings = liveResult.errors;
  } catch (error) {
    results.liveAdvisories = null;
    results.liveWarnings = [`Live advisory query failed: ${error?.message || String(error)}`];
  }

  progress.update('Live advisories', { status: 'done' });
}

/**
 * Run package-manager audit and merge results.
 * @param {object} opts
 * @param {object}   opts.results - mutable scan results
 * @param {object}   opts.scanOptions
 * @param {LiveProgress} opts.progress
 */
async function runAuditPhase({ results, scanOptions, progress }) {
  const { runAudit } = await getAuditModule();
  progress.update('Audit', { status: 'active', detail: 'Detecting package manager...' });

  try {
    const auditResult = await runAudit(scanOptions.paths[0] || '.', (msg) => {
      progress.update('Audit', { status: 'active', detail: sanitize(String(msg), 60) });
    });

    const auditFindings = (auditResult.vulnerabilities || []).map((vuln) => ({
      id: `audit:${vuln.name}:${vuln.severity}:${vuln.title}`,
      type: 'audit-vulnerability',
      severity: vuln.severity || 'medium',
      path: scanOptions.paths[0] || '.',
      packageName: vuln.name,
      packageVersion: '',
      attack: vuln.url || 'audit',
      description: vuln.title || `${vuln.name} vulnerability`,
      evidence: `${auditResult.packageManager} audit: ${vuln.title || vuln.name}`,
      source: auditResult.packageManager,
      remediation: vuln.fixAvailable
        ? `Run ${auditResult.packageManager} audit fix to resolve.`
        : `Manually update or replace ${vuln.name}.`,
    }));
    mergeFindings(results, auditFindings);
    results.audit = auditResult;
  } catch (error) {
    results.audit = null;
    results.auditWarning = `Audit failed: ${error?.message || String(error)}`;
  }

  progress.update('Audit', { status: 'done' });
}

// ─── Shared utilities ────────────────────────────────────────────────────────

const SEVERITY_RANK = { critical: 4, high: 3, medium: 2, low: 1 };

/**
 * Merge new findings into results, deduplicating by id and sorting by severity.
 * @param {object} results - mutable scan results with `findings` array
 * @param {object[]} newFindings
 */
export function mergeFindings(results, newFindings) {
  if (!newFindings || newFindings.length === 0) return;
  const existingIds = new Set(results.findings.map((f) => f.id));
  for (const finding of newFindings) {
    if (!existingIds.has(finding.id)) {
      results.findings.push(finding);
      existingIds.add(finding.id);
    }
  }
  results.findings.sort(
    (a, b) => (SEVERITY_RANK[b.severity] || 0) - (SEVERITY_RANK[a.severity] || 0),
  );
}

/**
 * Evaluate fail conditions after a scan completes.
 * @param {object} opts
 * @param {object}        opts.results
 * @param {object}        opts.scanOptions
 * @param {number}        opts.scanStartMs
 * @param {LiveProgress}  opts.progress
 * @returns {number} exit code
 */
export function applyFailConditions({ results, scanOptions, scanStartMs, progress }) {
  const totalMs = Date.now() - scanStartMs;
  const liveCount = results.liveAdvisories ? results.liveAdvisories.findings.length : 0;
  const advisoryFindings = results.findings.filter(
    (f) => f.type?.startsWith('live-') || f.type === 'audit-vulnerability',
  ).length;

  progress.setStats({
    packages: results.stats.packagesScanned,
    findings: results.findings.length,
    lockfiles: results.stats.lockFilesScanned,
    live: liveCount,
    duration: `${(totalMs / 1000).toFixed(1)}s`,
  });

  let exitCode = EXIT_CODES.SUCCESS;
  if (scanOptions.failOnAdvisory && advisoryFindings > 0)
    exitCode = EXIT_CODES.VULNERABILITIES_FOUND;
  if (scanOptions.failOnWarning && results.findings.length > 0)
    exitCode = EXIT_CODES.VULNERABILITIES_FOUND;
  return exitCode;
}
