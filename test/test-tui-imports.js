#!/usr/bin/env node
// ─── TUI Import Validation ──────────────────────────────────────────────────
// Verifies all TUI modules are importable and export expected symbols.
// ─────────────────────────────────────────────────────────────────────────────

import assert from 'node:assert/strict';

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
  }
}

console.log('TUI Import Validation\n');

// ─── Core modules ───────────────────────────────────────────────────────────

await test('tui.js imports successfully', async () => {
  const tui = await import('../src/tui.js');
  assert.ok(tui, 'tui module should be importable');
});

await test('tui.js exports expected functions', async () => {
  const tui = await import('../src/tui.js');
  assert.equal(typeof tui.cleanupTerminal, 'function', 'cleanupTerminal should be a function');
  assert.equal(typeof tui.debounce, 'function', 'debounce should be a function');
  assert.equal(typeof tui.onResize, 'function', 'onResize should be a function');
  assert.equal(typeof tui.getTerminalSize, 'function', 'getTerminalSize should be a function');
});

await test('tui.js exports expected classes', async () => {
  const tui = await import('../src/tui.js');
  assert.equal(typeof tui.ScreenManager, 'function', 'ScreenManager should be a class');
  assert.equal(typeof tui.KeyReader, 'function', 'KeyReader should be a class');
});

await test('tui.js exports ANSI constants', async () => {
  const tui = await import('../src/tui.js');
  assert.ok(tui.ANSI, 'ANSI should be defined');
  assert.equal(tui.ANSI.enterAlternateScreen, '\x1b[?1049h', 'enterAlternateScreen escape code');
  assert.equal(tui.ANSI.exitAlternateScreen, '\x1b[?1049l', 'exitAlternateScreen escape code');
});

// ─── Component modules ──────────────────────────────────────────────────────

await test('progress.js imports successfully', async () => {
  const mod = await import('../src/tui/components/progress.js');
  assert.ok(mod.Spinner, 'Spinner should be exported');
  assert.ok(mod.ProgressBar, 'ProgressBar should be exported');
});

await test('menu.js imports successfully', async () => {
  const mod = await import('../src/tui/components/menu.js');
  assert.ok(mod.SelectMenu, 'SelectMenu should be exported');
  assert.ok(mod.CheckboxMenu, 'CheckboxMenu should be exported');
});

await test('input.js imports successfully', async () => {
  const mod = await import('../src/tui/components/input.js');
  assert.ok(mod.TextInput, 'TextInput should be exported');
  assert.equal(typeof mod.confirm, 'function', 'confirm should be a function');
});

await test('browser.js imports successfully', async () => {
  const mod = await import('../src/tui/components/browser.js');
  assert.ok(mod.FileBrowser, 'FileBrowser should be exported');
});

await test('box.js imports successfully', async () => {
  const mod = await import('../src/tui/components/box.js');
  assert.ok(mod.Box, 'Box should be exported');
});

await test('findings.js imports successfully', async () => {
  const mod = await import('../src/tui/components/findings.js');
  assert.ok(mod.FindingsBrowser, 'FindingsBrowser should be exported');
});

await test('app.js imports successfully', async () => {
  const mod = await import('../src/tui/components/app.js');
  assert.equal(typeof mod.runTUI, 'function', 'runTUI should be a function');
});

// ─── Core infrastructure modules ────────────────────────────────────────────

await test('cleanup.js imports successfully', async () => {
  const mod = await import('../src/tui/core/cleanup.js');
  assert.equal(typeof mod.cleanupTerminal, 'function', 'cleanupTerminal should be a function');
  assert.equal(typeof mod.resetCleanupState, 'function', 'resetCleanupState should be a function');
});

await test('terminal.js imports successfully', async () => {
  const mod = await import('../src/tui/core/terminal.js');
  assert.equal(typeof mod.onResize, 'function', 'onResize should be a function');
  assert.equal(typeof mod.getTerminalSize, 'function', 'getTerminalSize should be a function');
  assert.equal(typeof mod.debounce, 'function', 'debounce should be a function');
});

await test('renderer.js imports successfully', async () => {
  const mod = await import('../src/tui/core/renderer.js');
  assert.equal(typeof mod.Renderer, 'function', 'Renderer should be a class');
  assert.ok(mod.ANSI, 'ANSI should be defined');
});

await test('screen-manager.js imports successfully', async () => {
  const mod = await import('../src/tui/core/screen-manager.js');
  assert.equal(typeof mod.ScreenManager, 'function', 'ScreenManager should be a class');
});

await test('key-reader.js imports successfully', async () => {
  const mod = await import('../src/tui/core/key-reader.js');
  assert.equal(typeof mod.KeyReader, 'function', 'KeyReader should be a class');
});

await test('virtual-screen.js imports successfully', async () => {
  const mod = await import('../src/tui/core/virtual-screen.js');
  assert.equal(typeof mod.VirtualScreen, 'function', 'VirtualScreen should be a class');
});

await test('component.js imports successfully', async () => {
  const mod = await import('../src/tui/core/component.js');
  assert.ok(mod, 'component module should be importable');
});

await test('event-bus.js imports successfully', async () => {
  const mod = await import('../src/tui/core/event-bus.js');
  assert.ok(mod, 'event-bus module should be importable');
});

await test('render-coordinator.js imports successfully', async () => {
  const mod = await import('../src/tui/core/render-coordinator.js');
  assert.ok(mod, 'render-coordinator module should be importable');
});

// ─── Summary ────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
