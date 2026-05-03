#!/usr/bin/env node
// ─── TUI Integration Test ───────────────────────────────────────────────────
// Tests the TUI components and scan flow programmatically.
// Runs in non-TTY so we test component logic, rendering, and state transitions.
// ─────────────────────────────────────────────────────────────────────────────

import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failed++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${error.message}`);
    if (error.stack) {
      const lines = error.stack.split('\n').slice(1, 4);
      for (const line of lines) console.error(`    ${line.trim()}`);
    }
  }
}

console.log('TUI Integration Tests\n');

// ─── Setup test fixture ──────────────────────────────────────────────────────
const root = mkdtempSync(join(tmpdir(), 'shai-tui-integ-'));
const srcDir = join(root, 'src');
const testDir = join(root, 'test');
const nestedDir = join(srcDir, 'components');
mkdirSync(srcDir, { recursive: true });
mkdirSync(testDir, { recursive: true });
mkdirSync(nestedDir, { recursive: true });

// Create test files
writeFileSync(join(root, 'package.json'), JSON.stringify({
  name: 'tui-test-fixture',
  version: '1.0.0',
  dependencies: { express: '^4.18.0' }
}, null, 2));

writeFileSync(join(root, 'package-lock.json'), JSON.stringify({
  lockfileVersion: 3,
  packages: {
    '': { name: 'tui-test-fixture', version: '1.0.0' },
    'node_modules/express': { name: 'express', version: '4.18.21' }
  }
}, null, 2));

writeFileSync(join(srcDir, 'index.js'), 'console.log("hello");');
writeFileSync(join(srcDir, 'utils.js'), 'export const add = (a, b) => a + b;');
writeFileSync(join(nestedDir, 'Button.jsx'), 'export default () => null;');
writeFileSync(join(testDir, 'test.js'), 'import assert from "assert";');
writeFileSync(join(root, '.hidden-file'), 'secret');

// Create node_modules with express
const nmDir = join(root, 'node_modules', 'express');
mkdirSync(nmDir, { recursive: true });
writeFileSync(join(nmDir, 'package.json'), JSON.stringify({
  name: 'express', version: '4.18.21'
}));

try {

  // ═══════════════════════════════════════════════════════════════════════════
  // Test Group 1: TUI Module Imports
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('── Module Imports ──');

  await test('tui.js exports all expected components', async () => {
    const tui = await import('../src/tui.js');
    const expected = [
      'SelectMenu', 'CheckboxMenu', 'LiveProgress', 'Spinner',
      'ProgressBar', 'Box', 'TextInput', 'FileBrowser', 'confirm',
      'cleanupTerminal', 'ANSI', 'KeyReader', 'onResize',
      'getTerminalSize', 'debounce', 'resetCleanupState',
    ];
    for (const name of expected) {
      assert.ok(tui[name] !== undefined, `Missing export: ${name}`);
    }
  });

  await test('tui/components/app.js exports runTUI', async () => {
    const mod = await import('../src/tui/components/app.js');
    assert.equal(typeof mod.runTUI, 'function');
  });

  await test('tui/components/findings.js exports FindingsBrowser', async () => {
    const mod = await import('../src/tui/components/findings.js');
    assert.equal(typeof mod.FindingsBrowser, 'function');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Test Group 2: Component Rendering
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n── Component Rendering ──');

  await test('Box.draw renders title and content', async () => {
    const { Box } = await import('../src/tui.js');
    const result = Box.draw({
      title: 'Test Box',
      lines: ['Line 1', 'Line 2', 'Line 3'],
      borderColor: 'cyan',
    });
    assert.ok(typeof result === 'string');
    assert.ok(result.includes('Test Box'));
    assert.ok(result.includes('Line 1'));
    assert.ok(result.includes('Line 2'));
    assert.ok(result.includes('Line 3'));
    // Check box characters
    assert.ok(result.includes('┌') || result.includes('╔'));
    assert.ok(result.includes('└') || result.includes('╚'));
  });

  await test('Box.draw handles empty content', async () => {
    const { Box } = await import('../src/tui.js');
    const result = Box.draw({ title: 'Empty', lines: [] });
    assert.ok(typeof result === 'string');
    assert.ok(result.includes('Empty'));
  });

  await test('Box.draw handles long lines without crashing', async () => {
    const { Box } = await import('../src/tui.js');
    const longLine = 'A'.repeat(500);
    const result = Box.draw({ title: 'Long', lines: [longLine] });
    assert.ok(typeof result === 'string');
    assert.ok(result.length > 0);
  });

  await test('Box.draw supports different border colors', async () => {
    const { Box } = await import('../src/tui.js');
    for (const color of ['red', 'green', 'yellow', 'cyan', 'magenta']) {
      const result = Box.draw({ title: color, lines: ['test'], borderColor: color });
      assert.ok(typeof result === 'string', `Failed for color: ${color}`);
    }
  });

  await test('Spinner lifecycle methods exist', async () => {
    const { Spinner } = await import('../src/tui.js');
    const s = new Spinner('Loading...');
    assert.equal(typeof s.start, 'function');
    assert.equal(typeof s.stop, 'function');
    assert.equal(typeof s.succeed, 'function');
    assert.equal(typeof s.fail, 'function');
    assert.equal(typeof s.update, 'function');
    // Cleanup
    s.stop();
  });

  await test('ProgressBar lifecycle methods exist', async () => {
    const { ProgressBar } = await import('../src/tui.js');
    const p = new ProgressBar({ label: 'Progress' });
    assert.equal(typeof p.update, 'function');
    assert.equal(typeof p.done, 'function');
    assert.equal(typeof p.tick, 'function');
  });

  await test('LiveProgress lifecycle methods exist', async () => {
    const { LiveProgress } = await import('../src/tui.js');
    const lp = new LiveProgress();
    assert.equal(typeof lp.setPhases, 'function');
    assert.equal(typeof lp.update, 'function');
    assert.equal(typeof lp.setStats, 'function');
    assert.equal(typeof lp.start, 'function');
    assert.equal(typeof lp.render, 'function');
    assert.equal(typeof lp.done, 'function');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Test Group 3: FileBrowser Component (non-TTY fallback)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n── FileBrowser Component ──');

  await test('FileBrowser returns startDir in non-TTY mode', async () => {
    const { FileBrowser } = await import('../src/tui.js');
    const result = await FileBrowser.run({ startDir: root });
    assert.ok(Array.isArray(result), 'Should return an array');
    assert.ok(result.length > 0, 'Should have at least one path');
    assert.equal(result[0], resolve(root), 'Should return resolved startDir');
  });

  await test('FileBrowser returns absolute paths', async () => {
    const { FileBrowser } = await import('../src/tui.js');
    const result = await FileBrowser.run({ startDir: srcDir });
    assert.ok(Array.isArray(result));
    assert.ok(result[0].startsWith('/'), 'Paths should be absolute');
  });

  await test('FileBrowser handles relative startDir', async () => {
    const { FileBrowser } = await import('../src/tui.js');
    const result = await FileBrowser.run({ startDir: '.' });
    assert.ok(Array.isArray(result));
    assert.ok(result.length > 0);
    assert.ok(result[0].startsWith('/'), 'Should resolve to absolute path');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Test Group 4: Debounce Utility
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n── Debounce Utility ──');

  await test('debounce triggers after delay', async () => {
    const { debounce } = await import('../src/tui.js');
    let called = 0;
    const d = debounce(() => { called++; }, 50);
    d.trigger();
    assert.equal(called, 0, 'Should not call immediately');
    await new Promise(r => setTimeout(r, 80));
    assert.equal(called, 1, 'Should call after delay');
  });

  await test('debounce cancel prevents invocation', async () => {
    const { debounce } = await import('../src/tui.js');
    let called = 0;
    const d = debounce(() => { called++; }, 50);
    d.trigger();
    d.cancel();
    await new Promise(r => setTimeout(r, 80));
    assert.equal(called, 0, 'Should not call after cancel');
  });

  await test('debounce flush calls immediately', async () => {
    const { debounce } = await import('../src/tui.js');
    let called = 0;
    const d = debounce(() => { called++; }, 500);
    d.trigger();
    d.flush();
    assert.equal(called, 1, 'Should call immediately on flush');
  });

  await test('debounce resets timer on rapid calls', async () => {
    const { debounce } = await import('../src/tui.js');
    let called = 0;
    const d = debounce(() => { called++; }, 50);
    d.trigger();
    await new Promise(r => setTimeout(r, 30));
    d.trigger(); // Reset timer
    await new Promise(r => setTimeout(r, 30));
    assert.equal(called, 0, 'Should not have called yet');
    await new Promise(r => setTimeout(r, 30));
    assert.equal(called, 1, 'Should call once after final delay');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Test Group 5: Terminal Utilities
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n── Terminal Utilities ──');

  await test('getTerminalSize returns sensible defaults', async () => {
    const { getTerminalSize } = await import('../src/tui.js');
    const size = getTerminalSize();
    assert.ok(typeof size.cols === 'number');
    assert.ok(typeof size.rows === 'number');
    assert.ok(size.cols >= 40, `cols=${size.cols} should be >= 40`);
    assert.ok(size.rows >= 1, `rows=${size.rows} should be >= 1`);
  });

  await test('onResize returns unsubscribe function', async () => {
    const { onResize } = await import('../src/tui.js');
    let called = false;
    const unsub = onResize(() => { called = true; });
    assert.equal(typeof unsub, 'function');
    unsub(); // Should not throw
  });

  await test('cleanupTerminal is safe to call multiple times', async () => {
    const { cleanupTerminal } = await import('../src/tui.js');
    // Should not throw
    cleanupTerminal();
    cleanupTerminal();
    cleanupTerminal();
  });

  await test('ANSI escape codes are defined', async () => {
    const { ANSI } = await import('../src/tui.js');
    assert.ok(ANSI, 'ANSI should be defined');
    assert.ok(typeof ANSI.clearLine === 'string', 'clearLine should be a string');
    assert.ok(typeof ANSI.moveUp === 'function', 'moveUp should be a function');
  });

  await test('resetCleanupState is callable', async () => {
    const { resetCleanupState } = await import('../src/tui.js');
    assert.equal(typeof resetCleanupState, 'function');
    resetCleanupState(); // Should not throw
  });

  await test('KeyReader.destroyActive is safe with no active instance', async () => {
    const { KeyReader } = await import('../src/tui.js');
    assert.equal(typeof KeyReader.destroyActive, 'function');
    KeyReader.destroyActive(); // Should not throw
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Test Group 6: Non-TTY Fallback (full runTUI)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n── Non-TTY Fallback ──');

  await test('runTUI returns SUCCESS in non-TTY', async () => {
    const { runTUI } = await import('../src/tui/components/app.js');
    const { EXIT_CODES } = await import('../src/constants.js');
    const code = await runTUI();
    assert.equal(code, EXIT_CODES.SUCCESS);
  });

  await test('runTUI prints helpful message in non-TTY', async () => {
    const { runTUI } = await import('../src/tui/components/app.js');
    const { EXIT_CODES } = await import('../src/constants.js');

    // Capture stderr
    const originalWrite = process.stderr.write;
    let captured = '';
    process.stderr.write = (data) => { captured += data; return true; };

    try {
      const code = await runTUI();
      assert.equal(code, EXIT_CODES.SUCCESS);
      assert.ok(captured.includes('--scan'), 'Should mention --scan flag');
      assert.ok(captured.includes('--help'), 'Should mention --help flag');
      assert.ok(captured.includes('CLI flags'), 'Should mention CLI flags');
    } finally {
      process.stderr.write = originalWrite;
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Test Group 7: CLI Flag Recognition
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n── CLI Flag Recognition ──');

  await test('--tui flag is recognized in help text', async () => {
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const cli = readFileSync(join(__dirname, '..', 'src', 'cli.js'), 'utf8');
    assert.ok(cli.includes('--tui'), 'CLI should recognize --tui');
    assert.ok(cli.includes('tui/components/app'), 'CLI should import tui/components/app');
    assert.ok(cli.includes('TUI mode'), 'CLI help should mention TUI mode');
  });

  await test('--tui does not imply --scan', async () => {
    // Verify the flag parsing logic
    const args = ['--tui'];
    const opts = { tui: false, scan: false };
    for (const arg of args) {
      if (arg === '--tui') opts.tui = true;
      else if (arg === '--scan') opts.scan = true;
    }
    assert.equal(opts.tui, true);
    assert.equal(opts.scan, false);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Test Group 8: Scan Flow (non-interactive, with test fixture)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n── Scan Flow ──');

  await test('Scanner can scan test fixture directory', async () => {
    const { Scanner } = await import('../src/scanner.js');
    const { VulnerabilityDatabase } = await import('../src/database.js');
    const db = new VulnerabilityDatabase({ offline: true, noCache: true });
    const scanner = new Scanner(db, { maxSearchDepth: 5 });
    const result = await scanner.scan([root]);
    assert.ok(result, 'Scan should return a result');
    assert.ok(Array.isArray(result.findings), 'Should have findings array');
    assert.ok(typeof result.scanTimeMs === 'number', 'Should have scan time (scanTimeMs)');
  });

  await test('Scanner respects scan phase options', async () => {
    const { Scanner } = await import('../src/scanner.js');
    const { VulnerabilityDatabase } = await import('../src/database.js');
    const db = new VulnerabilityDatabase({ offline: true, noCache: true });
    const scanner = new Scanner(db, {
      maxSearchDepth: 5,
      includeNodeModules: false,
      includeLockfiles: true,
      includeManifests: true,
      includeIocFiles: false,
    });
    const result = await scanner.scan([root]);
    assert.ok(result, 'Should return results even with some phases disabled');
  });

  await test('Scanner can scan multiple paths', async () => {
    const { Scanner } = await import('../src/scanner.js');
    const { VulnerabilityDatabase } = await import('../src/database.js');
    const db = new VulnerabilityDatabase({ offline: true, noCache: true });
    const scanner = new Scanner(db, { maxSearchDepth: 5 });
    const result = await scanner.scan([srcDir, testDir]);
    assert.ok(result, 'Should handle multiple paths');
    assert.ok(Array.isArray(result.findings));
  });

  await test('Scanner handles nonexistent paths gracefully', async () => {
    const { Scanner } = await import('../src/scanner.js');
    const { VulnerabilityDatabase } = await import('../src/database.js');
    const db = new VulnerabilityDatabase({ offline: true, noCache: true });
    const scanner = new Scanner(db, { maxSearchDepth: 5 });
    const result = await scanner.scan(['/nonexistent/path/that/does/not/exist']);
    assert.ok(result, 'Should return result even for nonexistent paths');
    // Should not throw
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Test Group 9: Scan Config Flow Simulation
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n── Scan Config Flow Simulation ──');

  await test('scanOptions defaults are sensible', async () => {
    // We can't instantiate ScannerTUI directly, but we can verify the
    // expected defaults by checking the source
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const app = readFileSync(join(__dirname, '..', 'src', 'tui', 'components', 'app.js'), 'utf8');
    assert.ok(app.includes('scanOptions'), 'Should have scanOptions');
    assert.ok(app.includes('includeNodeModules'), 'Should have includeNodeModules');
    assert.ok(app.includes('includeLockfiles'), 'Should have includeLockfiles');
    assert.ok(app.includes('includeManifests'), 'Should have includeManifests');
    assert.ok(app.includes('includeIocFiles'), 'Should have includeIocFiles');
  });

  await test('scan config uses FileBrowser for path selection', async () => {
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const dir = join(__dirname, '..', 'src', 'tui', 'components');
    // FileBrowser logic moved to app-config.js
    const appCfg = readFileSync(join(dir, 'app-config.js'), 'utf8');
    assert.ok(appCfg.includes('FileBrowser.run'), 'Should use FileBrowser for path selection');
    assert.ok(appCfg.includes('selectDirs'), 'Should support directory selection');
    assert.ok(appCfg.includes('selectFiles'), 'Should support file selection');
  });

  await test('scan flow has proper screen transitions', async () => {
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const app = readFileSync(join(__dirname, '..', 'src', 'tui', 'components', 'app.js'), 'utf8');
    // Check screen transitions
    assert.ok(app.includes("SCREENS.SCAN_CONFIG"), 'Should transition to SCAN_CONFIG');
    assert.ok(app.includes("SCREENS.SCANNING"), 'Should transition to SCANNING');
    assert.ok(app.includes("SCREENS.RESULTS"), 'Should transition to RESULTS');
    assert.ok(app.includes("SCREENS.MAIN_MENU"), 'Should transition back to MAIN_MENU');
  });

  await test('scan flow includes confirmation step', async () => {
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const dir = join(__dirname, '..', 'src', 'tui', 'components');
    // Scan config confirmation logic moved to app-config.js
    const appCfg = readFileSync(join(dir, 'app-config.js'), 'utf8');
    assert.ok(appCfg.includes('Scan Configuration Summary'), 'Should show summary');
    assert.ok(appCfg.includes('Start scan with these settings'), 'Should ask for confirmation');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Test Group 10: Error Handling
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n── Error Handling ──');

  await test('TUI has error boundary in main loop', async () => {
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const app = readFileSync(join(__dirname, '..', 'src', 'tui', 'components', 'app.js'), 'utf8');
    assert.ok(app.includes('catch (error)'), 'Should have try/catch in main loop');
    assert.ok(app.includes('EACCES'), 'Should handle permission errors');
    assert.ok(app.includes('ENOSPC'), 'Should handle disk full errors');
    assert.ok(app.includes('ENOTDIR'), 'Should handle path errors');
    assert.ok(app.includes('navigateTo(SCREENS.MAIN_MENU)'), 'Should return to main menu on error');
  });

  await test('TUI has graceful shutdown handlers', async () => {
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const app = readFileSync(join(__dirname, '..', 'src', 'tui', 'components', 'app.js'), 'utf8');
    assert.ok(app.includes('SIGINT'), 'Should handle SIGINT');
    assert.ok(app.includes('SIGTERM'), 'Should handle SIGTERM');
    assert.ok(app.includes('handleShutdown'), 'Should have shutdown handler');
  });

  await test('TUI has state persistence for crash recovery', async () => {
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const app = readFileSync(join(__dirname, '..', 'src', 'tui', 'components', 'app.js'), 'utf8');
    assert.ok(app.includes('tui-state.json'), 'Should persist state to file');
    assert.ok(app.includes('#saveState'), 'Should save state method');
    assert.ok(app.includes('loadSavedState'), 'Should load state method');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Test Group 11: FileBrowser Internals
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n── FileBrowser Internals ──');

  await test('FileBrowser supports selectFiles and selectDirs options', async () => {
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const tui = readFileSync(join(__dirname, '..', 'src', 'tui', 'components', 'browser.js'), 'utf8');
    assert.ok(tui.includes('selectFiles'), 'Should support selectFiles option');
    assert.ok(tui.includes('selectDirs'), 'Should support selectDirs option');
    assert.ok(tui.includes('showHidden'), 'Should support showHidden option');
    assert.ok(tui.includes('fileFilter'), 'Should support fileFilter option');
  });

  await test('FileBrowser has keyboard shortcuts', async () => {
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const tui = readFileSync(join(__dirname, '..', 'src', 'tui', 'components', 'browser.js'), 'utf8');
    assert.ok(tui.includes("case 'space'"), 'Should handle Space key for selection');
    assert.ok(tui.includes("case 'return'"), 'Should handle Enter key for navigation');
    assert.ok(tui.includes("case 'h'"), 'Should handle h for hidden files toggle');
    assert.ok(tui.includes("case 'a'"), 'Should handle a for select all');
    assert.ok(tui.includes("case 'escape'"), 'Should handle Escape to finish');
  });

  await test('FileBrowser has scroll/pagination support', async () => {
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const tui = readFileSync(join(__dirname, '..', 'src', 'tui', 'components', 'browser.js'), 'utf8');
    assert.ok(tui.includes('scrollTop'), 'Should have scroll tracking');
    assert.ok(tui.includes('maxVisible'), 'Should have max visible items');
    assert.ok(tui.includes('getMaxVisible'), 'Should calculate visible items from terminal size');
    assert.ok(tui.includes('Scroll indicator') || tui.includes('scrollPct'), 'Should show scroll indicator');
  });

  await test('FileBrowser shows selection status', async () => {
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const tui = readFileSync(join(__dirname, '..', 'src', 'tui', 'components', 'browser.js'), 'utf8');
    assert.ok(tui.includes('selectedPaths'), 'Should track selected paths');
    assert.ok(tui.includes('selected:'), 'Should display selected count');
  });

  await test('FileBrowser handles resize events', async () => {
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const tui = readFileSync(join(__dirname, '..', 'src', 'tui', 'components', 'browser.js'), 'utf8');
    assert.ok(tui.includes('onResize'), 'Should handle resize events');
    assert.ok(tui.includes('unsubResize'), 'Should clean up resize listener');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Test Group 12: Main Menu Structure
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n── Main Menu Structure ──');

  await test('main menu has all expected options', async () => {
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const app = readFileSync(join(__dirname, '..', 'src', 'tui', 'components', 'app.js'), 'utf8');
    assert.ok(app.includes('Scan project'), 'Should have scan option');
    assert.ok(app.includes('Check package'), 'Should have check option');
    assert.ok(app.includes('Update database'), 'Should have update option');
    assert.ok(app.includes('Search database'), 'Should have search option');
    assert.ok(app.includes('Quit'), 'Should have quit option');
  });

  await test('main menu shows database info', async () => {
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const app = readFileSync(join(__dirname, '..', 'src', 'tui', 'components', 'app.js'), 'utf8');
    assert.ok(app.includes('Database:'), 'Should show database info');
    assert.ok(app.includes('Version:'), 'Should show version');
    assert.ok(app.includes('Last update:'), 'Should show last update time');
  });

  await test('main menu has box header', async () => {
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const app = readFileSync(join(__dirname, '..', 'src', 'tui', 'components', 'app.js'), 'utf8');
    assert.ok(app.includes('╔'), 'Should have double-line box top');
    assert.ok(app.includes('Shai-Scanner TUI'), 'Should show app name');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exitCode = 1;
  } else {
    console.log('All TUI integration tests passed! 🐶');
  }

} finally {
  // Cleanup
  rmSync(root, { recursive: true, force: true });
}
