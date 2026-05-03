// src/tui/components/app-utils.js
// Utility screens — Check Package, Update Database, Search Database.
// Small standalone screens independent of the scan workflow.
//
// Exports:
//   renderCheckPackageToScreen / runLegacyCheckPackage
//   renderUpdateDbToScreen / runLegacyUpdateDb
//   renderSearchDbToScreen / runLegacySearchDb

import { sanitize, parsePackageSpec } from '../../utils.js';
import { TextInput, confirm, Spinner, Box } from '../../tui.js';
import { stdout as processStdout } from 'node:process';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function writeLine(screen, row, text) {
  if (row >= 0 && row < screen.rows) screen.setLine(row, text);
  return row + 1;
}

// ─── Check Package ───────────────────────────────────────────────────────────

export function renderCheckPackageToScreen(screen, _ctx, row, c) {
  row = writeLine(screen, row, '');
  row = writeLine(screen, row, c.bold('  🔍 Check Package'));
  row = writeLine(screen, row, c.dim('  Use legacy mode (run()) for interactive package checking'));
  row = writeLine(screen, row, '');
  return row;
}

/**
 * Run the interactive check-package flow in legacy mode.
 * @param {object} opts - { db, c, navigateTo }
 */
export async function runLegacyCheckPackage({ db, c, navigateTo }) {
  const spec = await TextInput.run({ prompt: 'Package spec (name@version): ', defaultValue: '' });
  if (spec === null || !spec.trim()) {
    navigateTo('check-package');
    return;
  }

  const parsed = parsePackageSpec(spec.trim());
  if (!parsed) {
    processStdout.write(`\n${c.red('Invalid format.')} Use name@version or @scope/name@version.\n`);
    const retry = await confirm('Try again?', true);
    if (!retry) navigateTo('check-package');
    return;
  }

  const entry = db.check(parsed.name, parsed.version);
  if (entry) {
    processStdout.write(
      `\n${Box.draw({ title: 'IOC Match', lines: [`${c.red('COMPROMISED')} ${parsed.name}@${parsed.version}`, `${c.bold('Severity:')} ${entry.severity}`, `${c.bold('Attack:')} ${entry.attack}`, entry.description], borderColor: 'red' })}\n\n`,
    );
  } else {
    processStdout.write(
      `\n${c.green('✓')} ${c.green('Not listed in IOC database')} — ${parsed.name}@${parsed.version}\n\n`,
    );
  }

  const again = await confirm('Check another package?', false);
  if (!again) navigateTo('check-package');
}

// ─── Update Database ─────────────────────────────────────────────────────────

export function renderUpdateDbToScreen(screen, _ctx, row, c) {
  row = writeLine(screen, row, '');
  row = writeLine(screen, row, c.bold('  🔄 Update Database'));
  row = writeLine(screen, row, c.dim('  Use legacy mode (run()) for database update'));
  row = writeLine(screen, row, '');
  return row;
}

/**
 * Run the interactive update-db flow in legacy mode.
 * @param {object} opts - { db, c, navigateTo }
 */
export async function runLegacyUpdateDb({ db, c, navigateTo }) {
  const spinner = new Spinner('Updating IOC database...');
  spinner.start();

  try {
    const result = await db.update((msg) => spinner.update(sanitize(msg, 80)));
    if (result.success) {
      spinner.succeed(
        `Database updated: ${result.before} → ${result.after} IOCs (${result.added} new)`,
      );
      if (result.errors.length)
        processStdout.write(c.yellow(`  Partial errors: ${result.errors.join('; ')}\n`));
    } else {
      spinner.fail(`Database update failed: ${result.errors.join('; ') || 'unknown error'}`);
    }
  } catch (error) {
    spinner.fail(`Update error: ${sanitize(error?.message || String(error))}`);
  }

  processStdout.write('\n');
  const goBack = await confirm('Return to main menu?', true);
  if (goBack !== null) navigateTo('update-db');
}

// ─── Search Database ─────────────────────────────────────────────────────────

export function renderSearchDbToScreen(screen, _ctx, row, c) {
  row = writeLine(screen, row, '');
  row = writeLine(screen, row, c.bold('  🔎 Search Database'));
  row = writeLine(screen, row, c.dim('  Use legacy mode (run()) for interactive search'));
  row = writeLine(screen, row, '');
  return row;
}

/**
 * Run the interactive search-db flow in legacy mode.
 * @param {object} opts - { db, c, navigateTo }
 */
export async function runLegacySearchDb({ db, c, navigateTo }) {
  const query = await TextInput.run({ prompt: 'Search query: ', defaultValue: '' });
  if (query === null || !query.trim()) {
    navigateTo('search-db');
    return;
  }

  const results = db.search(query.trim());

  if (results.length === 0) {
    processStdout.write(`\n${c.yellow('No results found.')} Try a different query.\n`);
    const again = await confirm('Search again?', true);
    if (!again) navigateTo('search-db');
    return;
  }

  processStdout.write(
    `\n${c.bold(`Found ${results.length} result(s) for "${sanitize(query, 40)}":`)}\n\n`,
  );
  const maxDisplay = Math.min(results.length, 20);
  const sevLabel = { critical: 'CRIT', high: 'HIGH', medium: 'MED', low: 'LOW' };
  for (let i = 0; i < maxDisplay; i++) {
    const entry = results[i];
    const severityColor =
      { critical: 'red', high: 'yellow', medium: 'cyan', low: 'dim' }[entry.severity] || 'dim';
    processStdout.write(
      `  ${c.bold(entry.name)}  ${entry.versions.slice(0, 5).join(', ')}${entry.versions.length > 5 ? '...' : ''}  ${c[severityColor](sevLabel[entry.severity] || '????')}  ${c.dim(entry.attack)}\n`,
    );
  }
  if (results.length > maxDisplay)
    processStdout.write(c.dim(`\n  ... and ${results.length - maxDisplay} more\n`));

  processStdout.write('\n');
  const again = await confirm('Search again?', false);
  if (!again) navigateTo('search-db');
}
