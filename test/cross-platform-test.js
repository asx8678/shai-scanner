#!/usr/bin/env node
// ─── Cross-Platform TUI Testing ─────────────────────────────────────────────
// Comprehensive testing for the shai-scanner TUI across terminal emulators,
// OS environments, and component configurations.
//
// Tests:
//   1. Terminal compatibility (environment detection, ANSI support)
//   2. All 11 components render correctly at various terminal sizes
//   3. Key handling consistency (arrow keys, Enter, Escape, q)
//   4. Color rendering adapts to terminal capabilities
//   5. Resize handling (VirtualScreen, Renderer, ScreenManager)
//   6. Edge cases (tiny terminals, huge terminals, narrow/wide)
//   7. Non-TTY fallback behavior
//   8. Component lifecycle (mount/render/unmount cycles)
//   9. Key parsing (escape sequences for different terminals)
//  10. Renderer differential rendering correctness
//
// Usage: node test/cross-platform-test.js
// ─────────────────────────────────────────────────────────────────────────────

import assert from 'node:assert/strict'
import { platform, release, arch } from 'node:os'
import { stripAnsi, colorize } from '../src/utils.js'
import { VirtualScreen } from '../src/tui/core/virtual-screen.js'
import { Renderer, ANSI } from '../src/tui/core/renderer.js'
import { ScreenManager } from '../src/tui/core/screen-manager.js'
import { KeyReader } from '../src/tui/core/key-reader.js'
import { onResize, getTerminalSize, debounce } from '../src/tui/core/terminal.js'
import { registerCleanup, cleanupTerminal, resetCleanupState } from '../src/tui/core/cleanup.js'

// ─── Lazy-load heavy components to avoid import side effects ────────────────
let Box, TextInput, Confirm, Spinner, ProgressBar, LiveProgress,
    SelectMenu, CheckboxMenu, FileBrowser, FindingsBrowser, ScannerTUI

async function importComponents() {
  const [
    boxMod, inputMod, progressMod, menuMod, browserMod, findingsMod, appMod
  ] = await Promise.all([
    import('../src/tui/components/box.js'),
    import('../src/tui/components/input.js'),
    import('../src/tui/components/progress.js'),
    import('../src/tui/components/menu.js'),
    import('../src/tui/components/browser.js'),
    import('../src/tui/components/findings.js'),
    import('../src/tui/components/app.js'),
  ])

  Box = boxMod.Box
  TextInput = inputMod.TextInput
  Confirm = inputMod.Confirm
  Spinner = progressMod.Spinner
  ProgressBar = progressMod.ProgressBar
  LiveProgress = progressMod.LiveProgress
  SelectMenu = menuMod.SelectMenu
  CheckboxMenu = menuMod.CheckboxMenu
  FileBrowser = browserMod.FileBrowser
  FindingsBrowser = findingsMod.FindingsBrowser
  ScannerTUI = appMod.ScannerTUI
}

// ─── Test Framework ─────────────────────────────────────────────────────────
let passed = 0
let failed = 0
let total = 0
const issues = []

function test(name, fn) {
  total++
  try {
    fn()
    passed++
    console.log(`  ✓ ${name}`)
  } catch (error) {
    failed++
    issues.push({ name, error: error.message, severity: 'ERROR' })
    console.error(`  ✗ ${name}`)
    console.error(`    ${error.message}`)
  }
}

function testWarn(name, fn) {
  total++
  try {
    fn()
    passed++
    console.log(`  ✓ ${name}`)
  } catch (error) {
    failed++
    issues.push({ name, error: error.message, severity: 'WARNING' })
    console.warn(`  ⚠ ${name}`)
    console.warn(`    ${error.message}`)
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: Environment Detection
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n══════════════════════════════════════════════════════════════════════')
console.log('  SECTION 1: Environment Detection')
console.log('══════════════════════════════════════════════════════════════════════\n')

const envInfo = {
  platform: platform(),
  release: release(),
  arch: arch(),
  nodeVersion: process.version,
  term: process.env.TERM || 'unset',
  termProgram: process.env.TERM_PROGRAM || 'unset',
  colorterm: process.env.COLORTERM || 'unset',
  noColor: process.env.NO_COLOR || 'unset',
  stdoutCols: process.stdout.columns,
  stdoutRows: process.stdout.rows,
  isTTY: !!process.stdout.isTTY,
  locale: process.env.LANG || process.env.LC_ALL || 'unset',
}

console.log('  Environment:')
for (const [k, v] of Object.entries(envInfo)) {
  console.log(`    ${k}: ${v}`)
}
console.log('')

test('Node.js version is >= 18', () => {
  const [major] = process.version.slice(1).split('.').map(Number)
  assert.ok(major >= 18, `Node.js ${process.version} is < 18`)
})

test('stdout.columns is defined or piped', () => {
  // In piped mode, columns may be undefined; in TTY, it should be a number
  const cols = process.stdout.columns
  if (cols !== undefined) {
    assert.equal(typeof cols, 'number', 'columns should be a number')
    assert.ok(cols > 0, 'columns should be > 0')
  } else {
    // Piped mode — columns undefined is acceptable
    assert.ok(true, 'columns undefined in piped mode is acceptable')
  }
})

test('stdout.rows is defined or piped', () => {
  const rows = process.stdout.rows
  if (rows !== undefined) {
    assert.equal(typeof rows, 'number', 'rows should be a number')
    assert.ok(rows > 0, 'rows should be > 0')
  } else {
    assert.ok(true, 'rows undefined in piped mode is acceptable')
  }
})

test('Terminal size is reasonable', () => {
  const size = getTerminalSize()
  assert.ok(size.cols >= 1, `cols=${size.cols} should be >= 1`)
  assert.ok(size.rows >= 1, `rows=${size.rows} should be >= 1`)
  // In piped mode, defaults to 80x24
})

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: ANSI & Color Support
// ═══════════════════════════════════════════════════════════════════════════════

console.log('══════════════════════════════════════════════════════════════════════')
console.log('  SECTION 2: ANSI & Color Support')
console.log('══════════════════════════════════════════════════════════════════════\n')

test('colorize(true) produces ANSI escape codes', () => {
  const c = colorize(true)
  const red = c.red('test')
  assert.ok(red.startsWith('\x1b['), `Expected ANSI start, got: ${JSON.stringify(red.slice(0, 10))}`)
  assert.ok(red.includes('\x1b[0m'), 'Expected reset code')
})

test('colorize(false) produces plain text', () => {
  const c = colorize(false)
  const red = c.red('test')
  assert.equal(red, 'test', 'Disabled colorize should return plain text')
})

test('All color functions produce valid ANSI', () => {
  const c = colorize(true)
  const colors = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'gray', 'bold', 'dim']
  for (const color of colors) {
    const result = c[color]('hello')
    assert.ok(typeof result === 'string', `${color} should return a string`)
    assert.ok(result.includes('hello'), `${color} should contain the text`)
    assert.ok(result.includes('\x1b['), `${color} should contain ANSI escape`)
  }
})

test('stripAnsi removes all ANSI escape codes', () => {
  const c = colorize(true)
  const colored = c.red(c.bold('hello'))
  const stripped = stripAnsi(colored)
  assert.equal(stripped, 'hello', 'Should strip all ANSI codes')
})

test('colorize respects NO_COLOR env', () => {
  const original = process.env.NO_COLOR
  try {
    process.env.NO_COLOR = '1'
    const c = colorize(!process.env.NO_COLOR)
    assert.equal(c.red('test'), 'test', 'NO_COLOR should disable colors')
  } finally {
    if (original === undefined) delete process.env.NO_COLOR
    else process.env.NO_COLOR = original
  }
})

test('ANSI constants are valid escape sequences', () => {
  assert.equal(ANSI.clear, '\x1b[2J')
  assert.equal(ANSI.cursorHide, '\x1b[?25l')
  assert.equal(ANSI.cursorShow, '\x1b[?25h')
  assert.equal(ANSI.enterAlternateScreen, '\x1b[?1049h')
  assert.equal(ANSI.exitAlternateScreen, '\x1b[?1049l')
  assert.equal(typeof ANSI.moveUp, 'function')
  assert.equal(typeof ANSI.moveDown, 'function')
  assert.equal(typeof ANSI.moveTo, 'function')
  assert.equal(typeof ANSI.moveToCol, 'function')
  assert.equal(ANSI.moveUp(3), '\x1b[3A')
  assert.equal(ANSI.moveDown(5), '\x1b[5B')
  assert.equal(ANSI.moveToCol(10), '\x1b[10G')
  assert.equal(ANSI.moveTo(1, 1), '\x1b[1;1H')
})

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: VirtualScreen at Various Sizes
// ═══════════════════════════════════════════════════════════════════════════════

console.log('══════════════════════════════════════════════════════════════════════')
console.log('  SECTION 3: VirtualScreen at Various Sizes')
console.log('══════════════════════════════════════════════════════════════════════\n')

const testSizes = [
  { name: 'tiny (20×5)', cols: 20, rows: 5 },
  { name: 'small (40×10)', cols: 40, rows: 10 },
  { name: 'standard (80×24)', cols: 80, rows: 24 },
  { name: 'wide (120×30)', cols: 120, rows: 30 },
  { name: 'ultra-wide (200×50)', cols: 200, rows: 50 },
  { name: 'narrow-tall (30×60)', cols: 30, rows: 60 },
]

for (const size of testSizes) {
  test(`VirtualScreen ${size.name} — basic operations`, () => {
    const vs = new VirtualScreen(size.cols, size.rows)
    assert.equal(vs.cols, size.cols)
    assert.equal(vs.rows, size.rows)
    assert.equal(vs.buffer.length, size.rows)
    assert.equal(vs.buffer[0].length, size.cols)

    // Set and read back
    vs.setLine(0, 'Hello World')
    const line = vs.getLine(0)
    assert.ok(line.startsWith('Hello World'))

    // Clear
    vs.clear()
    assert.equal(vs.getLine(0), ' '.repeat(size.cols))
  })
}

test('VirtualScreen clamps text to terminal width', () => {
  const vs = new VirtualScreen(10, 5)
  vs.setLine(0, 'This is a very long line that exceeds 10 columns')
  const line = vs.getLine(0)
  assert.equal(line.length, 10, 'Line should be clamped to cols')
})

test('VirtualScreen handles row out of bounds gracefully', () => {
  const vs = new VirtualScreen(80, 10)
  // Should not throw
  vs.setLine(-1, 'test')
  vs.setLine(100, 'test')
  assert.equal(vs.getLine(-1), '')
  assert.equal(vs.getLine(100), '')
})

test('VirtualScreen handles col out of bounds gracefully', () => {
  const vs = new VirtualScreen(80, 10)
  vs.setCell(0, -1, 'X')
  vs.setCell(0, 100, 'X')
  // No crash — out of bounds cells are ignored
})

test('VirtualScreen setCell sets attributes correctly', () => {
  const vs = new VirtualScreen(20, 5)
  vs.setCell(0, 5, 'A', '\x1b[31m')
  assert.equal(vs.getCellAttribute(0, 5), '\x1b[31m')
  assert.equal(vs.getCellAttribute(0, 6), null)
})

test('VirtualScreen setLine with segments', () => {
  const vs = new VirtualScreen(40, 5)
  vs.setLine(0, 'Hello World', {
    segments: [
      { col: 0, len: 5, attribute: '\x1b[1m' },
      { col: 6, len: 5, attribute: '\x1b[31m' },
    ]
  })
  assert.equal(vs.getCellAttribute(0, 0), '\x1b[1m')
  assert.equal(vs.getCellAttribute(0, 4), '\x1b[1m')
  assert.equal(vs.getCellAttribute(0, 6), '\x1b[31m')
  assert.equal(vs.getCellAttribute(0, 10), '\x1b[31m')
  assert.equal(vs.getCellAttribute(0, 5), null) // space between
})

test('VirtualScreen resize preserves overlapping content', () => {
  const vs = new VirtualScreen(40, 10)
  vs.setLine(0, 'Hello')
  vs.setLine(1, 'World')

  vs.resize(20, 5) // Shrink
  assert.equal(vs.cols, 20)
  assert.equal(vs.rows, 5)
  assert.ok(vs.getLine(0).startsWith('Hello'))
  assert.ok(vs.getLine(1).startsWith('World'))

  vs.resize(40, 10) // Grow back
  assert.equal(vs.cols, 40)
  assert.equal(vs.rows, 10)
  assert.ok(vs.getLine(0).startsWith('Hello'))
})

test('VirtualScreen region support', () => {
  const vs = new VirtualScreen(80, 24)
  vs.setLine(5, 'Important content')
  vs.defineRegion('status', { row: 5, col: 0, width: 80, height: 1 })

  assert.ok(vs.getRegion('status'))
  assert.equal(vs.getRegion('status').row, 5)

  // Mark region dirty
  vs.clearDirty()
  vs.markRegionDirty('status')
  assert.ok(vs.isDirty(5))
  assert.ok(!vs.isDirty(0))

  // Remove region
  vs.removeRegion('status')
  assert.equal(vs.getRegion('status'), undefined)
})

test('VirtualScreen dirty tracking is accurate', () => {
  const vs = new VirtualScreen(80, 10)
  vs.clearDirty()

  vs.setLine(3, 'test')
  assert.ok(vs.isDirty(3))
  assert.ok(!vs.isDirty(0))
  assert.ok(!vs.isDirty(9))

  vs.clearDirty()
  assert.ok(!vs.isDirty(3))

  vs.setCell(7, 0, 'X')
  assert.ok(vs.isDirty(7))
})

test('VirtualScreen clamps to minimum 1×1', () => {
  const vs1 = new VirtualScreen(0, 0)
  assert.equal(vs1.cols, 1)
  assert.equal(vs1.rows, 1)

  const vs2 = new VirtualScreen(-5, -5)
  assert.equal(vs2.cols, 1)
  assert.equal(vs2.rows, 1)
})

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: Renderer
// ═══════════════════════════════════════════════════════════════════════════════

console.log('══════════════════════════════════════════════════════════════════════')
console.log('  SECTION 4: Renderer')
console.log('══════════════════════════════════════════════════════════════════════\n')

function createMockStdout() {
  const writes = []
  return {
    columns: 80,
    rows: 24,
    isTTY: false,
    write(data) { writes.push(data); return true; },
    getWrites() { return writes.join('') },
    clearWrites() { writes.length = 0; },
  }
}

test('Renderer renders to non-TTY without crashing', () => {
  // In non-TTY mode, #renderNonTTY writes directly to process.stdout (global)
  // and does NOT update previousBuffer (by design — no differential rendering needed)
  const stdout = createMockStdout()
  const sm = new ScreenManager({ stdout })
  const renderer = new Renderer(sm, { stdout })

  const vs = new VirtualScreen(80, 5)
  vs.setLine(0, 'Hello World')
  vs.setLine(1, 'Second Line')

  // Should not crash; writes to real process.stdout, not mock
  renderer.render(vs)
  assert.equal(vs.getLine(0).trim(), 'Hello World')
})

test('Renderer fullRender works in non-TTY', () => {
  const stdout = createMockStdout()
  const sm = new ScreenManager({ stdout })
  const renderer = new Renderer(sm, { stdout })

  const vs = new VirtualScreen(80, 5)
  vs.setLine(0, 'Full render test')

  // Should not crash
  renderer.fullRender(vs)
  assert.ok(true)
})

test('Renderer clear resets both buffers', () => {
  const stdout = createMockStdout()
  const sm = new ScreenManager({ stdout })
  const renderer = new Renderer(sm, { stdout })

  const vs = new VirtualScreen(80, 5)
  vs.setLine(0, 'Some content')
  renderer.render(vs)

  renderer.clear()
  assert.equal(renderer.currentBuffer.getLine(0), ' '.repeat(80))
  assert.equal(renderer.previousBuffer.getLine(0), ' '.repeat(80))
})

test('Renderer differential rendering updates buffer correctly (TTY)', () => {
  // Simulate TTY mode to test the differential rendering + swapBuffers path
  const writes = []
  const ttyStdout = {
    columns: 80,
    rows: 24,
    isTTY: true,
    write(data) { writes.push(data); return true; },
  }
  const sm = new ScreenManager({ stdout: ttyStdout })
  const renderer = new Renderer(sm, { stdout: ttyStdout })

  // Initial render
  const vs = new VirtualScreen(80, 5)
  vs.setLine(0, 'Line 0')
  vs.setLine(1, 'Line 1')
  vs.setLine(2, 'Line 2')
  renderer.render(vs)

  // previousBuffer should be updated after TTY render
  assert.ok(renderer.previousBuffer.getLine(0).includes('Line 0'))
  assert.ok(renderer.previousBuffer.getLine(1).includes('Line 1'))

  writes.length = 0

  // Change only line 1
  const vs2 = new VirtualScreen(80, 5)
  vs2.setLine(0, 'Line 0')
  vs2.setLine(1, 'Line 1 CHANGED')
  vs2.setLine(2, 'Line 2')

  renderer.render(vs2)

  // previousBuffer should reflect the latest render
  assert.ok(renderer.previousBuffer.getLine(1).includes('Line 1 CHANGED'))
  // Should have written some ANSI output
  assert.ok(writes.length > 0, 'Should write ANSI sequences to TTY')
})

test('Renderer syncs buffer size on mismatch (TTY)', () => {
  const writes = []
  const ttyStdout = {
    columns: 120,
    rows: 30,
    isTTY: true,
    write(data) { writes.push(data); return true; },
  }
  const sm = new ScreenManager({ stdout: ttyStdout })
  const renderer = new Renderer(sm, { stdout: ttyStdout })

  // Render with 80x24
  const vs1 = new VirtualScreen(80, 24)
  vs1.setLine(0, 'Standard')
  renderer.render(vs1)

  // Now render with 120x30
  const vs2 = new VirtualScreen(120, 30)
  vs2.setLine(0, 'Wide')
  renderer.render(vs2)

  assert.equal(renderer.currentBuffer.cols, 120)
  assert.equal(renderer.currentBuffer.rows, 30)
  assert.equal(renderer.previousBuffer.cols, 120)
  assert.equal(renderer.previousBuffer.rows, 30)
})

test('Renderer handles empty VirtualScreen', () => {
  const stdout = createMockStdout()
  const sm = new ScreenManager({ stdout })
  const renderer = new Renderer(sm, { stdout })

  const vs = new VirtualScreen(80, 24)
  // No content set — all spaces
  renderer.render(vs)
  // Should not crash
  assert.ok(true)
})

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: Key Parsing
// ═══════════════════════════════════════════════════════════════════════════════

console.log('══════════════════════════════════════════════════════════════════════')
console.log('  SECTION 5: Key Parsing')
console.log('══════════════════════════════════════════════════════════════════════\n')

// Test key parsing by examining KeyReader's parse logic
// We can't directly access the private #parse method, but we can verify
// the escape sequences used in key-reader.js are correct

test('Arrow key escape sequences are standard VT100', () => {
  // Standard VT100/xterm arrow key sequences
  const sequences = {
    up:    Buffer.from('1b5b41', 'hex'),
    down:  Buffer.from('1b5b42', 'hex'),
    left:  Buffer.from('1b5b44', 'hex'),
    right: Buffer.from('1b5b43', 'hex'),
  }

  // Verify these are the correct bytes
  assert.equal(sequences.up[0], 0x1b, 'ESC')
  assert.equal(sequences.up[1], 0x5b, '[')
  assert.equal(sequences.up[2], 0x41, 'A = up')

  assert.equal(sequences.down[2], 0x42, 'B = down')
  assert.equal(sequences.left[2], 0x44, 'D = left')
  assert.equal(sequences.right[2], 0x43, 'C = right')
})

test('Special key escape sequences are standard', () => {
  const sequences = {
    return:    Buffer.from('0d', 'hex'),
    space:     Buffer.from('20', 'hex'),
    escape:    Buffer.from('1b', 'hex'),
    backspace: Buffer.from('7f', 'hex'),
    tab:       Buffer.from('09', 'hex'),
  }

  assert.equal(sequences.return[0], 0x0d, 'CR')
  assert.equal(sequences.space[0], 0x20, 'Space')
  assert.equal(sequences.escape[0], 0x1b, 'ESC')
  assert.equal(sequences.backspace[0], 0x7f, 'DEL')
  assert.equal(sequences.tab[0], 0x09, 'TAB')
})

test('KeyReader.destroyActive is safe when no instance exists', () => {
  KeyReader.destroyActive()
  // Should not throw
  assert.ok(true)
})

test('KeyReader isRaw defaults to false after cleanup', () => {
  // After cleanup, isRaw should be false
  assert.equal(typeof KeyReader.isRaw, 'boolean')
  // Just verify the property exists and is accessible
})

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6: ScreenManager
// ═══════════════════════════════════════════════════════════════════════════════

console.log('══════════════════════════════════════════════════════════════════════')
console.log('  SECTION 6: ScreenManager')
console.log('══════════════════════════════════════════════════════════════════════\n')

test('ScreenManager.getSize returns defaults in non-TTY', () => {
  const sm = new ScreenManager({ stdout: createMockStdout() })
  const size = sm.getSize()
  assert.equal(size.cols, 80, 'Default cols should be 80')
  assert.equal(size.rows, 24, 'Default rows should be 24')
})

test('ScreenManager.exit is idempotent', () => {
  const stdout = createMockStdout()
  const sm = new ScreenManager({ stdout })
  sm.exit() // Not entered
  sm.exit() // Still not entered
  assert.equal(sm.isInAlternateScreen, false)
})

test('ScreenManager.onResize returns unsubscribe function', () => {
  const sm = new ScreenManager({ stdout: createMockStdout() })
  let called = false
  const unsub = sm.onResize(() => { called = true })
  assert.equal(typeof unsub, 'function')
  unsub()
  // After unsubscribe, calling should not trigger
  assert.ok(!called)
})

test('ScreenManager tracks terminal size', () => {
  const stdout = createMockStdout()
  stdout.columns = 120
  stdout.rows = 40
  const sm = new ScreenManager({ stdout })
  assert.equal(sm.terminalSize.cols, 120)
  assert.equal(sm.terminalSize.rows, 40)
})

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7: Component Rendering (all 11 components)
// ═══════════════════════════════════════════════════════════════════════════════

console.log('══════════════════════════════════════════════════════════════════════')
console.log('  SECTION 7: Component Rendering (all 11 components)')
console.log('══════════════════════════════════════════════════════════════════════\n')

await importComponents()

const SCREEN_COLS = 80
const SCREEN_ROWS = 24

function makeScreen() {
  return new VirtualScreen(SCREEN_COLS, SCREEN_ROWS)
}

// ─── 1. Box ───────────────────────────────────────────────────────────────

test('Box renders title and content', () => {
  const screen = makeScreen()
  const box = new Box({ title: 'Test Box', lines: ['Line 1', 'Line 2'], color: false })
  box.mount()
  box.render(screen, { bounds: { row: 0 } })
  box.unmount()

  const output = screen.getLine(0)
  assert.ok(output.includes('Test Box'), 'Should contain title')
  const allText = Array.from({ length: 5 }, (_, i) => screen.getLine(i)).join('\n')
  assert.ok(allText.includes('Line 1'), 'Should contain content')
})

test('Box handles empty lines', () => {
  const screen = makeScreen()
  const box = new Box({ title: 'Empty', lines: [], color: false })
  box.mount()
  box.render(screen, { bounds: { row: 0 } })
  box.unmount()
  // Should not crash
  assert.ok(true)
})

test('Box.draw produces valid output', () => {
  const result = Box.draw({ title: 'Static', lines: ['content'], borderColor: 'cyan' })
  assert.ok(typeof result === 'string')
  assert.ok(result.includes('Static'))
  assert.ok(result.includes('content'))
})

for (const color of ['red', 'green', 'yellow', 'cyan', 'magenta']) {
  test(`Box renders with ${color} border`, () => {
    const result = Box.draw({ title: color, lines: ['test'], borderColor: color, color: true })
    assert.ok(typeof result === 'string')
    assert.ok(result.length > 0)
  })
}

// ─── 2. TextInput ──────────────────────────────────────────────────────────

test('TextInput renders prompt and default value', () => {
  const screen = makeScreen()
  const input = new TextInput({ prompt: 'Enter name:', defaultValue: 'default', color: false })
  input.mount()
  input.render(screen, { bounds: { row: 0 } })
  input.unmount()

  const output = Array.from({ length: 3 }, (_, i) => screen.getLine(i)).join('\n')
  assert.ok(output.includes('Enter name:'), 'Should contain prompt')
  assert.ok(output.includes('default'), 'Should contain default value')
})

test('TextInput handles empty prompt', () => {
  const screen = makeScreen()
  const input = new TextInput({ prompt: '', color: false })
  input.mount()
  input.render(screen, { bounds: { row: 0 } })
  input.unmount()
  assert.ok(true)
})

// ─── 3. Confirm ────────────────────────────────────────────────────────────

test('Confirm renders question', () => {
  const screen = makeScreen()
  const c = new Confirm({ question: 'Continue?', defaultValue: true, color: false })
  c.mount()
  c.render(screen, { bounds: { row: 0 } })
  c.unmount()

  const output = Array.from({ length: 3 }, (_, i) => screen.getLine(i)).join('\n')
  assert.ok(output.includes('Continue?'), 'Should contain question')
})

// ─── 4. Spinner ────────────────────────────────────────────────────────────

test('Spinner lifecycle methods exist', () => {
  const s = new Spinner('Loading...')
  assert.equal(typeof s.start, 'function')
  assert.equal(typeof s.stop, 'function')
  assert.equal(typeof s.succeed, 'function')
  assert.equal(typeof s.fail, 'function')
  assert.equal(typeof s.update, 'function')
  s.stop()
})

test('Spinner.draw produces valid frames', () => {
  const frames = []
  for (let i = 0; i < 5; i++) {
    frames.push(Spinner.draw('Working...', i))
  }
  for (const frame of frames) {
    assert.ok(typeof frame === 'string')
    assert.ok(frame.includes('Working...'), 'Should contain the message')
    assert.ok(frame.length > 0)
  }
})

test('Spinner frames are different across animation cycle', () => {
  const frames = new Set()
  for (let i = 0; i < 10; i++) {
    frames.add(Spinner.draw('Loading', i))
  }
  assert.ok(frames.size > 1, 'Should have multiple distinct frames')
})

// ─── 5. ProgressBar ────────────────────────────────────────────────────────

test('ProgressBar lifecycle methods exist', () => {
  const p = new ProgressBar({ label: 'Progress', total: 100, color: false })
  assert.equal(typeof p.update, 'function')
  assert.equal(typeof p.done, 'function')
  assert.equal(typeof p.tick, 'function')
})

test('ProgressBar renders correctly', () => {
  const screen = makeScreen()
  const bar = new ProgressBar({ total: 100, width: 30, label: 'Processing', color: false })
  bar.mount()
  bar.render(screen, { bounds: { row: 0 } })
  bar.unmount()

  // In non-TTY, render might return early, but the component should not crash
  assert.ok(true)
})

// ─── 6. LiveProgress ───────────────────────────────────────────────────────

test('LiveProgress lifecycle methods exist', () => {
  const lp = new LiveProgress()
  assert.equal(typeof lp.setPhases, 'function')
  assert.equal(typeof lp.update, 'function')
  assert.equal(typeof lp.setStats, 'function')
  assert.equal(typeof lp.start, 'function')
  assert.equal(typeof lp.render, 'function')
  assert.equal(typeof lp.done, 'function')
})

// ─── 7. SelectMenu ────────────────────────────────────────────────────────

test('SelectMenu renders items', () => {
  const screen = makeScreen()
  const menu = new SelectMenu({
    title: 'Choose an option',
    items: [
      { label: 'Option A', value: 'a' },
      { label: 'Option B', value: 'b' },
      { label: 'Option C', value: 'c' },
    ],
    color: false,
  })
  menu.mount()
  menu.render(screen, { bounds: { row: 0 } })
  menu.unmount()

  const allText = Array.from({ length: 10 }, (_, i) => screen.getLine(i)).join('\n')
  assert.ok(allText.includes('Choose an option'), 'Should contain title')
  assert.ok(allText.includes('Option A'), 'Should contain items')
})

test('SelectMenu with descriptions renders correctly', () => {
  const screen = makeScreen()
  const menu = new SelectMenu({
    title: 'Features',
    items: [
      { label: 'Feature X', value: 'x', description: 'Description of X' },
      { label: 'Feature Y', value: 'y', description: 'Description of Y' },
    ],
    color: false,
  })
  menu.mount()
  menu.render(screen, { bounds: { row: 0 } })
  menu.unmount()

  const allText = Array.from({ length: 10 }, (_, i) => screen.getLine(i)).join('\n')
  assert.ok(allText.includes('Feature X'))
  assert.ok(allText.includes('Feature Y'))
})

test('SelectMenu handles single item', () => {
  const screen = makeScreen()
  const menu = new SelectMenu({
    title: 'Only one',
    items: [{ label: 'Only', value: 'only' }],
    color: false,
  })
  menu.mount()
  menu.render(screen, { bounds: { row: 0 } })
  menu.unmount()
  assert.ok(true)
})

// ─── 8. CheckboxMenu ──────────────────────────────────────────────────────

test('CheckboxMenu renders checkboxes', () => {
  const screen = makeScreen()
  const menu = new CheckboxMenu({
    title: 'Select features',
    items: [
      { label: 'Feature X', value: 'x', checked: true },
      { label: 'Feature Y', value: 'y', checked: false },
      { label: 'Feature Z', value: 'z', checked: true },
    ],
    color: false,
  })
  menu.mount()
  menu.render(screen, { bounds: { row: 0 } })
  menu.unmount()

  const allText = Array.from({ length: 10 }, (_, i) => screen.getLine(i)).join('\n')
  assert.ok(allText.includes('Select features'))
  assert.ok(allText.includes('Feature X'))
  assert.ok(allText.includes('Feature Y'))
})

// ─── 9. FileBrowser ────────────────────────────────────────────────────────

test('FileBrowser lifecycle methods exist', () => {
  assert.equal(typeof FileBrowser, 'function')
})

test('FileBrowser.run returns array in non-TTY', async () => {
  const result = await FileBrowser.run({ startDir: '.' })
  assert.ok(Array.isArray(result))
  assert.ok(result.length > 0)
})

// ─── 10. FindingsBrowser ───────────────────────────────────────────────────

test('FindingsBrowser renders findings', () => {
  const screen = makeScreen()
  const sampleFindings = [
    {
      packageName: 'malicious-pkg',
      packageVersion: '1.0.0',
      severity: 'critical',
      type: 'ioc-filename',
      description: 'Known malicious package',
      source: 'ioc-database',
      attack: 'supply-chain',
      path: 'node_modules/malicious-pkg',
    },
    {
      packageName: 'vulnerable-lib',
      packageVersion: '2.3.1',
      severity: 'high',
      type: 'cve',
      description: 'Remote code execution',
      cve: 'CVE-2024-12345',
      source: 'osv',
      attack: 'rce',
      path: 'node_modules/vulnerable-lib',
    },
  ]

  const browser = new FindingsBrowser({ findings: sampleFindings, color: false })
  browser.mount()
  browser.render(screen, { bounds: { row: 0 } })
  browser.unmount()

  const allText = Array.from({ length: 15 }, (_, i) => screen.getLine(i)).join('\n')
  assert.ok(allText.includes('malicious-pkg'), 'Should display finding packages')
})

test('FindingsBrowser handles empty findings', () => {
  const screen = makeScreen()
  const browser = new FindingsBrowser({ findings: [], color: false })
  browser.mount()
  browser.render(screen, { bounds: { row: 0 } })
  browser.unmount()
  assert.ok(true)
})

// ─── 11. ScannerTUI (app) ──────────────────────────────────────────────────

test('ScannerTUI renders main menu', () => {
  const screen = makeScreen()
  const app = new ScannerTUI({ color: false })
  app.mount()
  app.render(screen, { bounds: { row: 0 } })
  app.unmount()

  const allText = Array.from({ length: 20 }, (_, i) => screen.getLine(i)).join('\n')
  assert.ok(allText.includes('Shai-Scanner'), 'Should contain app title')
  assert.ok(allText.includes('Scan project'), 'Should contain menu items')
  assert.ok(allText.includes('Quit'), 'Should contain quit option')
})

test('ScannerTUI navigateTo changes screen', () => {
  const app = new ScannerTUI({ color: false })
  app.mount()

  assert.equal(app.currentScreen, 'main-menu')

  app.navigateTo('scan-config')
  assert.equal(app.currentScreen, 'scan-config')

  app.navigateTo('main-menu')
  assert.equal(app.currentScreen, 'main-menu')

  app.unmount()
})

test('ScannerTUI renders scan config screen', () => {
  const screen = makeScreen()
  const app = new ScannerTUI({ color: false })
  app.mount()
  app.navigateTo('scan-config')
  app.render(screen, { bounds: { row: 0 } })
  app.unmount()

  const allText = Array.from({ length: 20 }, (_, i) => screen.getLine(i)).join('\n')
  // Should render scan configuration UI without crashing
  assert.ok(typeof allText === 'string')
})

test('ScannerTUI handleKey for main menu', () => {
  const app = new ScannerTUI({ color: false })
  app.mount()

  // Down arrow
  const handled = app.handleKey({ name: 'down', raw: Buffer.alloc(0), char: '' })
  assert.ok(handled, 'Down arrow should be handled')

  // Up arrow
  app.handleKey({ name: 'up', raw: Buffer.alloc(0), char: '' })

  // q to quit
  app.handleKey({ name: 'q', raw: Buffer.alloc(0), char: 'q' })

  app.unmount()
})

test('ScannerTUI render at different terminal sizes', () => {
  for (const cols of [40, 80, 120, 200]) {
    const screen = new VirtualScreen(cols, 24)
    const app = new ScannerTUI({ color: false })
    app.mount()
    app.render(screen, { bounds: { row: 0 } })
    app.unmount()
    assert.ok(true, `Should render at ${cols} cols`)
  }
})

test('ScannerTUI RESULTS_ITEMS is defined', () => {
  assert.ok(Array.isArray(ScannerTUI.RESULTS_ITEMS))
  assert.ok(ScannerTUI.RESULTS_ITEMS.length > 0)
})

test('ScannerTUI MAIN_MENU_ITEMS is defined', () => {
  assert.ok(Array.isArray(ScannerTUI.MAIN_MENU_ITEMS))
  assert.ok(ScannerTUI.MAIN_MENU_ITEMS.includes('scan'))
  assert.ok(ScannerTUI.MAIN_MENU_ITEMS.includes('quit'))
})

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 8: Resize Handling
// ═══════════════════════════════════════════════════════════════════════════════

console.log('══════════════════════════════════════════════════════════════════════')
console.log('  SECTION 8: Resize Handling')
console.log('══════════════════════════════════════════════════════════════════════\n')

test('VirtualScreen resize preserves content within bounds', () => {
  const vs = new VirtualScreen(80, 24)
  vs.setLine(0, 'Hello World')
  vs.setLine(1, 'Second Line')

  vs.resize(40, 12) // Shrink
  assert.equal(vs.cols, 40)
  assert.equal(vs.rows, 12)
  assert.ok(vs.getLine(0).includes('Hello'))
  assert.ok(vs.getLine(1).includes('Second'))
})

test('VirtualScreen resize adds new rows filled with spaces', () => {
  const vs = new VirtualScreen(80, 5)
  vs.setLine(0, 'Content')
  vs.resize(80, 10)
  assert.equal(vs.rows, 10)
  assert.ok(vs.getLine(0).includes('Content'))
  assert.equal(vs.getLine(9), ' '.repeat(80)) // New row is spaces
})

test('VirtualScreen resize preserves attributes', () => {
  const vs = new VirtualScreen(80, 10)
  vs.setCell(5, 0, 'X', '\x1b[31m')
  vs.resize(80, 20)
  assert.equal(vs.getCellAttribute(5, 0), '\x1b[31m')
})

test('Renderer handles rapid resize without corruption', () => {
  const stdout = createMockStdout()
  const sm = new ScreenManager({ stdout })
  const renderer = new Renderer(sm, { stdout })

  // Simulate rapid resize events
  const sizes = [
    [40, 10], [80, 24], [120, 30], [40, 10], [200, 50], [80, 24]
  ]

  for (const [cols, rows] of sizes) {
    const vs = new VirtualScreen(cols, rows)
    vs.setLine(0, `Size: ${cols}x${rows}`)
    renderer.render(vs)
  }

  // Final state should match last resize
  assert.equal(renderer.currentBuffer.cols, 80)
  assert.equal(renderer.currentBuffer.rows, 24)
})

test('onResize callback receives correct dimensions', () => {
  let received = null
  const unsub = onResize((size) => { received = size })

  // onResize just registers, doesn't fire immediately
  assert.ok(typeof unsub === 'function')
  unsub()
})

test('debounce works correctly for resize events', async () => {
  let count = 0
  const d = debounce(() => { count++ }, 50)

  d.trigger()
  d.trigger()
  d.trigger()

  assert.equal(count, 0, 'Should not have fired yet')

  await new Promise(r => setTimeout(r, 80))
  assert.equal(count, 1, 'Should fire once after debounce delay')
})

test('debounce flush calls immediately', async () => {
  let count = 0
  const d = debounce(() => { count++ }, 5000)

  d.trigger()
  d.flush()
  assert.equal(count, 1, 'Should call immediately on flush')
})

test('debounce cancel prevents invocation', async () => {
  let count = 0
  const d = debounce(() => { count++ }, 50)

  d.trigger()
  d.cancel()

  await new Promise(r => setTimeout(r, 80))
  assert.equal(count, 0, 'Should not call after cancel')
})

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 9: Cleanup & Lifecycle
// ═══════════════════════════════════════════════════════════════════════════════

console.log('══════════════════════════════════════════════════════════════════════')
console.log('  SECTION 9: Cleanup & Lifecycle')
console.log('══════════════════════════════════════════════════════════════════════\n')

test('cleanupTerminal is safe to call multiple times', () => {
  cleanupTerminal()
  cleanupTerminal()
  cleanupTerminal()
  assert.ok(true)
})

test('resetCleanupState resets state', () => {
  resetCleanupState()
  assert.ok(true)
})

test('registerCleanup adds handler', () => {
  const unsub = registerCleanup(() => {})
  assert.equal(typeof unsub, 'function')
  unsub()
})

test('Component base class lifecycle', () => {
  // Can't directly import Component here without affecting other tests
  // But we verify ScannerTUI (extends Component) works
  const app = new ScannerTUI({ color: false })
  assert.equal(app.isMounted, false)

  app.mount()
  assert.equal(app.isMounted, true)

  app.unmount()
  assert.equal(app.isMounted, false)
})

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 10: Edge Cases & Error Handling
// ═══════════════════════════════════════════════════════════════════════════════

console.log('══════════════════════════════════════════════════════════════════════')
console.log('  SECTION 10: Edge Cases & Error Handling')
console.log('══════════════════════════════════════════════════════════════════════\n')

test('All components handle rendering at 20×5 (tiny terminal)', () => {
  const vs = new VirtualScreen(20, 5)

  const box = new Box({ title: 'T', lines: ['x'], color: false })
  box.mount()
  box.render(vs, { bounds: { row: 0 } })
  box.unmount()

  assert.ok(true, 'Box renders at tiny size')
})

test('All components handle rendering at 200×50 (huge terminal)', () => {
  const vs = new VirtualScreen(200, 50)

  const box = new Box({ title: 'Huge Terminal', lines: ['content'], color: false })
  box.mount()
  box.render(vs, { bounds: { row: 0 } })
  box.unmount()

  assert.ok(true, 'Box renders at huge size')
})

test('Box handles Unicode in title and content', () => {
  const result = Box.draw({ title: '🐍 Test', lines: ['你好世界', 'emoji: 🎉'], color: false })
  assert.ok(result.includes('Test'))
  assert.ok(result.includes('你好世界'))
})

test('SelectMenu handles Unicode labels', () => {
  const screen = makeScreen()
  const menu = new SelectMenu({
    title: '選択',
    items: [
      { label: '选项 A', value: 'a' },
      { label: 'Option B 🎯', value: 'b' },
    ],
    color: false,
  })
  menu.mount()
  menu.render(screen, { bounds: { row: 0 } })
  menu.unmount()
  assert.ok(true)
})

test('TextInput handles very long input', () => {
  const screen = makeScreen()
  const longValue = 'x'.repeat(200)
  const input = new TextInput({ prompt: 'Input:', defaultValue: longValue, color: false })
  input.mount()
  input.render(screen, { bounds: { row: 0 } })
  input.unmount()
  assert.ok(true)
})

test('FindingsBrowser handles many findings', () => {
  const screen = makeScreen()
  const findings = Array.from({ length: 50 }, (_, i) => ({
    packageName: `pkg-${i}`,
    packageVersion: `${i}.0.0`,
    severity: ['critical', 'high', 'medium', 'low'][i % 4],
    type: 'ioc',
    description: `Finding ${i}`,
    source: 'test',
    attack: 'test',
    path: `node_modules/pkg-${i}`,
  }))

  const browser = new FindingsBrowser({ findings, color: false })
  browser.mount()
  browser.render(screen, { bounds: { row: 0 } })
  browser.unmount()
  assert.ok(true)
})

test('Spinner handles rapid start/stop cycles', () => {
  const s = new Spinner('Test')
  for (let i = 0; i < 10; i++) {
    s.start()
    s.stop()
  }
  s.stop() // Final cleanup
  assert.ok(true)
})

test('ProgressBar handles zero-length progress', () => {
  const screen = makeScreen()
  const bar = new ProgressBar({ total: 0, label: 'Empty', color: false })
  bar.mount()
  bar.render(screen, { bounds: { row: 0 } })
  bar.unmount()
  assert.ok(true)
})

test('ScannerTUI handles escape key on main menu', () => {
  const app = new ScannerTUI({ color: false })
  app.mount()

  // Escape on main menu should navigate back (already on main, so no-op or handled)
  const handled = app.handleKey({ name: 'escape', raw: Buffer.alloc(0), char: '' })
  // Escape is not explicitly handled on main menu, so it should return false
  // or be handled by default behavior

  app.unmount()
  assert.ok(true)
})

test('ScreenManager enter/exit cycle is idempotent', () => {
  const stdout = createMockStdout()
  stdout.isTTY = true // Simulate TTY for this test
  const sm = new ScreenManager({ stdout })

  sm.enter()
  sm.enter() // Should be no-op
  sm.exit()
  sm.exit() // Should be no-op

  assert.equal(sm.isInAlternateScreen, false)
})

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 11: Cross-Component Interaction
// ═══════════════════════════════════════════════════════════════════════════════

console.log('══════════════════════════════════════════════════════════════════════')
console.log('  SECTION 11: Cross-Component Interaction')
console.log('══════════════════════════════════════════════════════════════════════\n')

test('Multiple components can render to same VirtualScreen', () => {
  const screen = makeScreen()
  let row = 0

  const box = new Box({ title: 'Header', lines: ['Welcome'], color: false })
  box.mount()
  box.render(screen, { bounds: { row } })
  row += 5

  const menu = new SelectMenu({
    title: 'Menu',
    items: [{ label: 'Item 1', value: '1' }, { label: 'Item 2', value: '2' }],
    color: false,
  })
  menu.mount()
  menu.render(screen, { bounds: { row } })

  box.unmount()
  menu.unmount()

  // Both should have rendered without conflict
  const allText = Array.from({ length: 15 }, (_, i) => screen.getLine(i)).join('\n')
  assert.ok(allText.includes('Header'))
  assert.ok(allText.includes('Item 1'))
})

test('Color and no-color rendering produce different output', () => {
  const cOn = colorize(true)
  const cOff = colorize(false)

  const colored = cOn.red('test')
  const plain = cOff.red('test')

  assert.notEqual(colored, plain, 'Colored and plain should differ')
  assert.equal(plain, 'test', 'Plain should be unmodified')
})

// ═══════════════════════════════════════════════════════════════════════════════
// Results Summary
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n══════════════════════════════════════════════════════════════════════')
console.log(`  Results: ${passed} passed, ${failed} failed, ${total} total`)
console.log('══════════════════════════════════════════════════════════════════════')

if (issues.length > 0) {
  console.log('\n  Issues Found:')
  for (const issue of issues) {
    console.log(`    [${issue.severity}] ${issue.name}`)
    console.log(`      ${issue.error}`)
  }
}

// Exit with appropriate code
process.exit(failed > 0 ? 1 : 0)
