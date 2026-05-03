// src/tui/components/app-config.js
// Scan Configuration screen — both Component-mode render and legacy interactive mode.
//
// Exports:
//   renderScanConfigToScreen(screen, ctx, row, c, scanOptions)
//   runLegacyScanConfig(c, scanOptions, navigateTo)

import { CheckboxMenu, TextInput, confirm, FileBrowser, Box } from '../../tui.js';
import { stdout as processStdout } from 'node:process';

// ─── Component-mode render ───────────────────────────────────────────────────

/**
 * Render the scan configuration summary in Component mode (read-only).
 * @param {import('../core/virtual-screen.js').VirtualScreen} screen
 * @param {object} _ctx
 * @param {number} row
 * @param {object} c - colorize helper
 * @param {object} scanOptions
 * @returns {number} next row
 */
export function renderScanConfigToScreen(screen, _ctx, row, c, scanOptions) {
  const write = (r, text) => {
    if (r >= 0 && r < screen.rows) screen.setLine(r, text);
    return r + 1;
  };

  row = write(row, '');
  row = write(row, c.bold('  📦 Scan Configuration (component mode)'));
  row = write(row, '');
  row = write(row, `  ${c.bold('Paths:')}         ${scanOptions.paths.join(', ')}`);
  row = write(
    row,
    `  ${c.bold('Node modules:')}  ${scanOptions.includeNodeModules ? c.green('yes') : c.dim('no')}`,
  );
  row = write(
    row,
    `  ${c.bold('Lock files:')}    ${scanOptions.includeLockfiles ? c.green('yes') : c.dim('no')}`,
  );
  row = write(
    row,
    `  ${c.bold('Manifests:')}     ${scanOptions.includeManifests ? c.green('yes') : c.dim('no')}`,
  );
  row = write(
    row,
    `  ${c.bold('IOC files:')}     ${scanOptions.includeIocFiles ? c.green('yes') : c.dim('no')}`,
  );
  row = write(
    row,
    `  ${c.bold('Live:')}          ${scanOptions.live ? scanOptions.liveSources.join(', ') : 'disabled'}`,
  );
  row = write(row, `  ${c.bold('Audit:')}         ${scanOptions.audit ? 'enabled' : 'disabled'}`);
  row = write(row, c.dim('  Use legacy mode (run()) for interactive configuration'));
  row = write(row, '');
  return row;
}

// ─── Legacy interactive mode ─────────────────────────────────────────────────

/**
 * Run the full interactive scan-configuration flow (legacy async-loop mode).
 * Mutates `scanOptions` in-place and calls `navigateTo` when complete.
 *
 * @param {object} c - colorize helper
 * @param {object} scanOptions - mutable scan options object
 * @param {function} navigateTo - callback to change screen
 */
export async function runLegacyScanConfig(c, scanOptions, navigateTo) {
  const selectedPhases = await CheckboxMenu.run({
    title: '📦 Scan Phases',
    items: [
      {
        label: 'node_modules',
        description: 'Scan installed packages in node_modules',
        value: 'nodeModules',
        checked: scanOptions.includeNodeModules,
      },
      {
        label: 'Lock files',
        description: 'Scan package-lock.json, yarn.lock, pnpm-lock.yaml',
        value: 'lockfiles',
        checked: scanOptions.includeLockfiles,
      },
      {
        label: 'Manifests',
        description: 'Scan package.json dependency ranges',
        value: 'manifests',
        checked: scanOptions.includeManifests,
      },
      {
        label: 'IOC files',
        description: 'Scan for known malicious filenames & workflows',
        value: 'iocFiles',
        checked: scanOptions.includeIocFiles,
      },
    ],
  });

  if (selectedPhases === null) {
    navigateTo('main-menu');
    return;
  }

  scanOptions.includeNodeModules = selectedPhases.includes('nodeModules');
  scanOptions.includeLockfiles = selectedPhases.includes('lockfiles');
  scanOptions.includeManifests = selectedPhases.includes('manifests');
  scanOptions.includeIocFiles = selectedPhases.includes('iocFiles');

  processStdout.write(`\n${c.bold('📁 Select scan path(s)')}\n`);
  processStdout.write(
    c.dim('  Browse and select files or directories to scan. Press Esc when done.\n\n'),
  );

  const paths = await FileBrowser.run({
    startDir: scanOptions.paths[0] || '.',
    title: 'Select Paths to Scan',
    selectFiles: true,
    selectDirs: true,
    showHidden: false,
  });

  if (paths === null || paths.length === 0) {
    navigateTo('main-menu');
    return;
  }
  scanOptions.paths = paths;

  processStdout.write(`\n${c.green('✓')} ${c.bold('Selected paths:')}\n`);
  for (const p of paths) processStdout.write(`  ${c.cyan('•')} ${p}\n`);
  processStdout.write('\n');

  scanOptions.live = await confirm(
    '🔍 Enable live advisories? (query OSV.dev and GitHub Advisory DB)',
    scanOptions.live,
  );

  if (scanOptions.live) {
    const liveSources = await CheckboxMenu.run({
      title: '📡 Advisory Sources',
      items: [
        {
          label: 'OSV.dev',
          description: 'CVEs and vulnerabilities from osv.dev',
          value: 'osv',
          checked: scanOptions.liveSources.includes('osv') || scanOptions.liveSources.length === 0,
        },
        {
          label: 'GitHub Advisory Database',
          description: 'Security advisories from GitHub',
          value: 'github',
          checked:
            scanOptions.liveSources.includes('github') || scanOptions.liveSources.length === 0,
        },
      ],
    });
    if (liveSources !== null) scanOptions.liveSources = liveSources;

    const liveLimit = await TextInput.run({
      prompt: '🔢 Live query limit: ',
      defaultValue: String(scanOptions.liveLimit),
    });
    if (liveLimit !== null) {
      const parsed = parseInt(liveLimit, 10);
      if (!isNaN(parsed) && parsed > 0) scanOptions.liveLimit = parsed;
    }
  }

  scanOptions.audit = await confirm('📋 Run npm/pnpm/yarn audit?', scanOptions.audit);

  const maxDepth = await TextInput.run({
    prompt: '📊 Max search depth (1-100): ',
    defaultValue: String(scanOptions.maxDepth),
  });
  if (maxDepth !== null) {
    const parsed = parseInt(maxDepth, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 100) scanOptions.maxDepth = parsed;
  }

  scanOptions.failOnAdvisory = await confirm(
    '⚠️  Fail on advisory? (exit 1 when live advisories found)',
    scanOptions.failOnAdvisory,
  );
  scanOptions.failOnWarning = await confirm(
    '🚨 Fail on warning? (exit 1 for suspicious non-package findings)',
    scanOptions.failOnWarning,
  );

  const phases = [
    scanOptions.includeNodeModules && 'node_modules',
    scanOptions.includeLockfiles && 'lockfiles',
    scanOptions.includeManifests && 'manifests',
    scanOptions.includeIocFiles && 'IOC',
  ].filter(Boolean);
  const summaryLines = [
    `${c.bold('Paths:')} ${scanOptions.paths.join(', ')}`,
    `${c.bold('Phases:')} ${phases.join(', ')}`,
    `${c.bold('Live advisories:')} ${scanOptions.live ? scanOptions.liveSources.join(', ') : 'disabled'}`,
    `${c.bold('Audit:')} ${scanOptions.audit ? 'enabled' : 'disabled'}`,
    `${c.bold('Max depth:')} ${scanOptions.maxDepth}`,
    `${c.bold('Fail on advisory:')} ${scanOptions.failOnAdvisory ? 'yes' : 'no'}`,
    `${c.bold('Fail on warning:')} ${scanOptions.failOnWarning ? 'yes' : 'no'}`,
  ];

  processStdout.write(
    `\n${Box.draw({ title: 'Scan Configuration Summary', lines: summaryLines, borderColor: 'cyan' })}\n\n`,
  );

  const proceed = await confirm('Start scan with these settings?', true);
  navigateTo(proceed ? 'scanning' : 'main-menu');
}
