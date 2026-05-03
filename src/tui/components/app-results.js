// src/tui/components/app-results.js
// Results screen — Component-mode render, legacy interactive results browser,
// and report export helper.
//
// Exports:
//   renderResultsToScreen(screen, _ctx, row, c, results, resultsIndex, resultsItems)
//   runLegacyResults({ results, scanOptions, db, c, useColor, navigateTo, resultsItems })
//   exportReport({ format, results, c, auditResult, getReportersModule })

import { sanitize } from '../../utils.js';
import { SelectMenu, TextInput, Box } from '../../tui.js';
import { stdout as processStdout } from 'node:process';
import { join } from 'node:path';

// ─── Component-mode render ───────────────────────────────────────────────────

/**
 * Render the results dashboard in Component mode (non-interactive summary).
 * @returns {number} next row
 */
export function renderResultsToScreen(screen, _ctx, row, c, results, resultsIndex, resultsItems) {
  const write = (r, text) => {
    if (r >= 0 && r < screen.rows) screen.setLine(r, text);
    return r + 1;
  };

  if (!results) {
    row = write(row, c.yellow('  No scan results available.'));
    return row;
  }

  const { findings, stats } = results;
  const infectedPackages = new Set(findings.filter((f) => f.packageName).map((f) => f.packageName));
  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of findings) bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;

  row = write(row, '');
  row = write(row, c.bold('  ╔══════════════════════════════════════════════════════════╗'));
  row = write(
    row,
    c.bold('  ║') +
      c.cyan('          Shai-Scanner  —  Scan Results Dashboard        ') +
      c.bold('  ║'),
  );
  row = write(row, c.bold('  ╚══════════════════════════════════════════════════════════╝'));
  row = write(row, '');
  row = write(row, `  ${c.bold('Scanned:')}  ${stats.packagesScanned} packages`);
  row = write(
    row,
    `  ${c.bold('Findings:')} ${findings.length} (${c.red(`${bySeverity.critical} crit`)}, ${c.yellow(`${bySeverity.high} high`)}, ${c.cyan(`${bySeverity.medium} med`)}, ${c.dim(`${bySeverity.low} low`)})`,
  );
  row = write(row, `  ${c.bold('Infected:')} ${infectedPackages.size} packages`);
  row = write(row, '');

  // Actions
  const visibleActions =
    findings.length > 0 ? resultsItems : resultsItems.filter((a) => a !== 'detail');
  const labels = {
    detail: 'View findings',
    'export-json': 'Export JSON',
    'export-sarif': 'Export SARIF',
    'scan-again': 'Scan again',
    'new-scan': 'New scan',
    back: 'Back to menu',
  };

  for (let i = 0; i < visibleActions.length; i++) {
    const prefix = i === resultsIndex ? c.cyan(' ▸ ') : '   ';
    row = write(row, `${prefix}${labels[visibleActions[i]] || visibleActions[i]}`);
  }
  row = write(row, c.dim('  ↑/↓ navigate • Enter select • Esc back'));
  return row;
}

// ─── Legacy interactive mode ─────────────────────────────────────────────────

/**
 * Run the full interactive results flow in legacy async-loop mode.
 *
 * @param {object} opts
 * @param {object}   opts.results     - scan results
 * @param {object}   opts.scanOptions - scan config
 * @param {object}   opts.db          - VulnerabilityDatabase
 * @param {object}   opts.c           - colorize helper
 * @param {boolean}  opts.useColor
 * @param {function} opts.navigateTo
 * @param {string[]} opts.resultsItems
 * @param {function} opts.getFindingsBrowserModule - lazy loader
 */
export async function runLegacyResults({
  results,
  scanOptions,
  db,
  c,
  useColor,
  navigateTo,
  _resultsItems,
  getFindingsBrowserModule,
}) {
  if (!results) {
    processStdout.write(`\n${c.yellow('No scan results available.')}\n`);
    navigateTo('main-menu');
    return;
  }

  const { findings } = results;
  const cveFindings = findings.filter((f) => f.attack?.startsWith('CVE-'));
  const cveCount = new Set(cveFindings.map((f) => f.attack)).size;
  const iocFindings = findings.filter(
    (f) => !f.type?.startsWith('live-') && f.type !== 'audit-vulnerability',
  );
  const liveFindings = findings.filter((f) => f.type?.startsWith('live-'));
  const auditFindings = findings.filter((f) => f.type === 'audit-vulnerability');
  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of findings) bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;

  const durationSec = (results.scanTimeMs / 1000).toFixed(1);
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const dbInfo = db.getInfo();
  const phasesUsed = [
    scanOptions.includeNodeModules && 'node_modules',
    scanOptions.includeLockfiles && 'lockfiles',
    scanOptions.includeManifests && 'manifests',
    scanOptions.includeIocFiles && 'IOC',
  ].filter(Boolean);

  processStdout.write('\n');
  processStdout.write(c.bold('╔══════════════════════════════════════════════════════════╗\n'));
  processStdout.write(
    c.bold('║') +
      c.cyan('          Shai-Scanner  —  Scan Results Dashboard        ') +
      c.bold('║\n'),
  );
  processStdout.write(c.bold('╚══════════════════════════════════════════════════════════╝\n\n'));

  processStdout.write(
    Box.draw({
      title: 'Scan Summary',
      lines: [
        `${c.bold('Paths:')} ${scanOptions.paths.join(', ')}`,
        `${c.bold('Timestamp:')} ${timestamp}`,
        `${c.bold('Duration:')} ${durationSec}s`,
        `${c.bold('Phases:')} ${phasesUsed.join(', ')}`,
        `${c.bold('DB version:')} ${dbInfo.versionCount} package-version IOCs`,
      ],
      borderColor: findings.length > 0 ? 'yellow' : 'green',
    }),
  );
  processStdout.write('\n');

  const sevBar = (count, total, colorFn) => {
    if (total === 0) return c.dim('░░░░░░░░░░  (none)');
    const ratio = Math.min(1, count / total);
    return `${colorFn('█'.repeat(Math.round(ratio * 10)) + '░'.repeat(10 - Math.round(ratio * 10)))}  ${Math.round(ratio * 100)}%`;
  };

  processStdout.write(
    Box.draw({
      title: 'Findings Breakdown',
      lines: [
        `${c.bold('Total findings:')} ${findings.length}`,
        '',
        `${c.red('[CRIT] Critical:')}  ${String(bySeverity.critical).padStart(3)} ${sevBar(bySeverity.critical, findings.length, c.red)}`,
        `${c.yellow('[HIGH] High:')}      ${String(bySeverity.high).padStart(3)} ${sevBar(bySeverity.high, findings.length, c.yellow)}`,
        `${c.cyan('[MED]  Medium:')}    ${String(bySeverity.medium).padStart(3)} ${sevBar(bySeverity.medium, findings.length, c.cyan)}`,
        `${c.dim('[LOW]  Low:')}       ${String(bySeverity.low).padStart(3)} ${sevBar(bySeverity.low, findings.length, c.dim)}`,
        ...(cveCount > 0 ? ['', `${c.bold('CVEs found:')} ${cveCount}`] : []),
      ],
      borderColor: findings.length > 0 ? 'red' : 'green',
    }),
  );
  processStdout.write('\n');

  if (iocFindings.length > 0 || liveFindings.length > 0 || auditFindings.length > 0) {
    const sourceLines = [];
    if (iocFindings.length > 0)
      sourceLines.push(`${c.magenta('[IOC]')} IOC matches: ${iocFindings.length}`);
    if (liveFindings.length > 0)
      sourceLines.push(`${c.cyan('[LIVE]')} Live advisories: ${liveFindings.length}`);
    if (auditFindings.length > 0)
      sourceLines.push(`${c.yellow('[AUDIT]')} Audit vulnerabilities: ${auditFindings.length}`);
    processStdout.write(
      Box.draw({ title: 'Finding Sources', lines: sourceLines, borderColor: 'cyan' }),
    );
    processStdout.write('\n');
  }

  if (findings.length === 0) processStdout.write(`${c.green('✓ No findings — all clear!')}\n\n`);

  const selection = await SelectMenu.run({
    title: `Actions  (${findings.length} finding${findings.length === 1 ? '' : 's'})`,
    items: [
      ...(findings.length > 0
        ? [{ label: 'View findings', description: 'Browse individual findings', value: 'detail' }]
        : []),
      {
        label: 'Export JSON report',
        description: 'Save results as JSON file',
        value: 'export-json',
      },
      {
        label: 'Export SARIF report',
        description: 'Save results as SARIF file',
        value: 'export-sarif',
      },
      { label: 'Scan again', description: 'Re-scan with same settings', value: 'scan-again' },
      { label: 'New scan', description: 'Configure a new scan', value: 'new-scan' },
      { label: 'Back to menu', description: 'Return to main menu', value: 'back' },
    ],
  });

  switch (selection) {
    case 'detail': {
      const { FindingsBrowser } = await getFindingsBrowserModule();
      const browser = new FindingsBrowser(findings, { color: useColor });
      await browser.browse();
      navigateTo('results');
      break;
    }
    case 'export-json':
      await exportReport({ format: 'json', results, c, getReportersModule: null });
      break;
    case 'export-sarif':
      await exportReport({ format: 'sarif', results, c, getReportersModule: null });
      break;
    case 'scan-again':
      navigateTo('scanning');
      break;
    case 'new-scan':
      navigateTo('scan-config');
      break;
    case 'back':
    case null:
    default:
      navigateTo('main-menu');
      break;
  }
}

// ─── Report export helper ────────────────────────────────────────────────────

/**
 * Export scan results as JSON or SARIF.
 *
 * @param {object} opts
 * @param {string}   opts.format  - 'json' | 'sarif'
 * @param {object}   opts.results
 * @param {object}   opts.c       - colorize helper
 * @param {function} opts.getReportersModule - lazy loader for reporters.js
 */
export async function exportReport({ format, results, c, getReportersModule }) {
  const { writeFile } = await import('node:fs/promises');
  const ext = format === 'sarif' ? 'sarif' : 'json';
  const defaultName = `shai-scan-${Date.now()}.${ext}`;
  const filename = await TextInput.run({ prompt: 'Export filename: ', defaultValue: defaultName });

  if (filename === null || !filename.trim()) {
    processStdout.write(`${c.yellow('Export cancelled.')}\n`);
    return;
  }

  try {
    const filePath = join(process.cwd(), filename.trim());
    const { renderJsonReport, renderSarifReport } = await getReportersModule();
    const report =
      format === 'sarif'
        ? renderSarifReport(results)
        : renderJsonReport(results, { auditResult: results.audit });
    await writeFile(filePath, report, 'utf8');
    processStdout.write(`${c.green('✓')} Report exported to ${c.bold(filePath)}\n\n`);
  } catch (error) {
    processStdout.write(
      `${c.red('Export failed:')} ${sanitize(error?.message || String(error))}\n\n`,
    );
  }

  // Note: caller handles navigation after export
}
