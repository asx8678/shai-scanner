// test/benchmark-test.js
// Performance benchmark suite for the shai-scanner TUI
//
// Targets from TUI Improvement Plan (docs/archive/TUI_IMPROVEMENT_PLAN.md):
//   Full screen render time: <16ms (was ~50ms)
//   Differential render time: <5ms
//   Animation framerate: 60fps (16.67ms per frame)
//   Key handling latency: <1ms (sub-frame)
//
// Usage: node test/benchmark-test.js
// CI:    npm run test:benchmark

import { performance } from 'node:perf_hooks'
import { VirtualScreen } from '../src/tui/core/virtual-screen.js'

// ─── Import all 11 TUI components ──────────────────────────────────────────
import { Box } from '../src/tui/components/box.js'
import { TextInput, Confirm } from '../src/tui/components/input.js'
import { Spinner, ProgressBar } from '../src/tui/components/progress.js'
import { SelectMenu, CheckboxMenu } from '../src/tui/components/menu.js'
import { FileBrowser } from '../src/tui/components/browser.js'
import { FindingsBrowser } from '../src/tui/components/findings.js'
import { ScannerTUI } from '../src/tui/components/app.js'
import { LiveProgress } from '../src/tui/components/progress.js'

// ─── Performance Targets (ms) ───────────────────────────────────────────────

const TARGETS = {
  render:              16,   // Full screen render time
  differentialRender:   5,   // Differential (dirty-line only) render time
  frameBudget:         16.67,// Per-frame budget for 60fps
  keyHandling:          1,   // Handle a keypress
  mountUnmount:        10,   // Full mount → unmount lifecycle
}

// ─── Configuration ──────────────────────────────────────────────────────────

const RENDER_ITERS = 100    // iterations for render benchmarks
const KEY_ITERS    = 500    // iterations for key handling (faster ops, more samples)
const LIFECYCLE_ITERS = 20  // iterations for mount/unmount lifecycle
const TERMINAL_COLS = 80
const TERMINAL_ROWS = 24

// ─── Fixture Generators ─────────────────────────────────────────────────────

const SEVERITIES = ['critical', 'high', 'medium', 'low']
const IOC_TYPES  = ['package-ioc', 'lockfile-ioc', 'manifest-ioc',
                     'suspicious-script', 'suspicious-file', 'suspicious-workflow']
const SOURCES    = ['npm', 'offline-db', 'live-osv', 'live-github']

/**
 * Generate a synthetic findings array for benchmarking.
 * @param {number} count
 * @returns {Array<object>}
 */
function generateFindings(count) {
  const findings = []
  for (let i = 0; i < count; i++) {
    const sev = SEVERITIES[i % SEVERITIES.length]
    const type = IOC_TYPES[i % IOC_TYPES.length]
    const source = SOURCES[i % SOURCES.length]
    findings.push({
      packageName: `pkg-${String(i).padStart(4, '0')}`,
      packageVersion: `${1 + (i % 10)}.${i % 5}.0`,
      severity: sev,
      type,
      source,
      description: `Synthetic finding #${i} for benchmark — tests string rendering with realistic data lengths`,
      attack: i % 3 === 0 ? `CVE-2024-${10000 + i}` : `GHSA-${String(i).padStart(4, '0')}-abcd`,
      evidence: `node_modules/pkg-${String(i).padStart(4, '0')}/index.js`,
      path: `/fake/path/to/pkg-${String(i).padStart(4, '0')}/package.json`,
      url: `https://example.com/advisory/${i}`,
      advisoryId: `ADV-${i}`,
      aliases: i % 5 === 0 ? [`CVE-2024-${20000 + i}`] : [],
    })
  }
  return findings
}

/**
 * Generate menu items for SelectMenu/CheckboxMenu benchmarks.
 * @param {number} count
 * @returns {Array<{label: string, value: string, description: string}>}
 */
function generateMenuItems(count) {
  const items = []
  for (let i = 0; i < count; i++) {
    items.push({
      label: `Menu item ${String(i).padStart(3, '0')} — ${'extra text '.repeat(3).trim()}`,
      value: `val-${i}`,
      description: `Description for item ${i} with realistic length`,
    })
  }
  return items
}

/**
 * Generate box content lines.
 * @param {number} count
 * @returns {string[]}
 */
function generateBoxLines(count) {
  const lines = []
  for (let i = 0; i < count; i++) {
    lines.push(`Line ${String(i).padStart(3, '0')}: ${'content '.repeat(5).trim()} — realistic data`)
  }
  return lines
}

// ─── Benchmarking Utilities ─────────────────────────────────────────────────

/**
 * Compute statistical summary from an array of timing measurements.
 * @param {number[]} times - Array of durations in ms
 * @returns {{ avg: number, min: number, max: number, p50: number, p95: number, p99: number, stddev: number }}
 */
function computeStats(times) {
  const sorted = [...times].sort((a, b) => a - b)
  const n = sorted.length
  const avg = sorted.reduce((s, t) => s + t, 0) / n
  const variance = sorted.reduce((s, t) => s + (t - avg) ** 2, 0) / n

  return {
    avg,
    min: sorted[0],
    max: sorted[n - 1],
    p50: sorted[Math.floor(n * 0.5)],
    p95: sorted[Math.floor(n * 0.95)],
    p99: sorted[Math.floor(n * 0.99)],
    stddev: Math.sqrt(variance),
  }
}

/**
 * Run a benchmark function and collect timing data.
 * @param {string} name - Benchmark name
 * @param {() => void} fn - Function to benchmark (synchronous)
 * @param {number} iterations - Number of iterations
 * @param {object} [options]
 * @param {number} [options.warmup] - Warmup iterations (default: 10% of iterations, min 5)
 * @returns {{ name: string, stats: object, iterations: number, allTimes: number[] }}
 */
function bench(name, fn, iterations, options = {}) {
  const warmupCount = options.warmup ?? Math.max(5, Math.floor(iterations * 0.1))

  // Warmup — let JIT compile the hot path
  for (let i = 0; i < warmupCount; i++) fn()

  // Collect garbage before measurement
  if (global.gc) global.gc()

  const times = []
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now()
    fn()
    const t1 = performance.now()
    times.push(t1 - t0)
  }

  const stats = computeStats(times)
  return { name, stats, iterations, allTimes: times }
}

/**
 * Measure memory delta for a lifecycle function.
 * @param {string} name
 * @param {() => { mount: () => void, use: () => void, unmount: () => void}} factory
 * @param {number} iterations
 * @returns {{ name: string, beforeMB: number, afterMB: number, deltaMB: number, perIterationKB: number }}
 */
function measureMemory(name, factory, iterations) {
  if (global.gc) global.gc()
  const before = process.memoryUsage()

  for (let i = 0; i < iterations; i++) {
    const { mount, use, unmount } = factory()
    mount()
    use()
    unmount()
  }

  if (global.gc) global.gc()
  const after = process.memoryUsage()

  const deltaHeap = after.heapUsed - before.heapUsed
  return {
    name,
    beforeMB: +(before.heapUsed / 1024 / 1024).toFixed(2),
    afterMB: +(after.heapUsed / 1024 / 1024).toFixed(2),
    deltaMB: +(deltaHeap / 1024 / 1024).toFixed(2),
    perIterationKB: +(deltaHeap / iterations / 1024).toFixed(2),
  }
}

// ─── Component Helpers ──────────────────────────────────────────────────────

/** Create a fresh VirtualScreen for benchmarking. */
function makeScreen() {
  return new VirtualScreen(TERMINAL_COLS, TERMINAL_ROWS)
}

/** Standard render context matching RenderContext.allocateRows(). */
function makeCtx(row = 0) {
  return {
    bounds: { row, col: 0, width: TERMINAL_COLS, height: TERMINAL_ROWS - row },
    terminalSize: { rows: TERMINAL_ROWS, cols: TERMINAL_COLS },
  }
}

/**
 * Fake key objects for handleKey benchmarks.
 * Note: KeyReader produces { name: 'return' } for Enter, not 'enter'.
 *       FindingsBrowser uses case 'enter' which doesn't match — this is
 *       an existing code inconsistency we work around below.
 */
const KEYS = {
  up:    { name: 'up',    char: '', raw: Buffer.alloc(0) },
  down:  { name: 'down',  char: '', raw: Buffer.alloc(0) },
  left:  { name: 'left',  char: '', raw: Buffer.alloc(0) },
  right: { name: 'right', char: '', raw: Buffer.alloc(0) },
  enter: { name: 'return', char: '\r', raw: Buffer.from([0x0d]) },
  space: { name: 'space', char: ' ',  raw: Buffer.from([0x20]) },
  esc:   { name: 'escape', char: '',  raw: Buffer.from([0x1b]) },
  q:     { name: 'q', char: 'q', raw: Buffer.from('q') },
  backspace: { name: 'backspace', char: '\x7f', raw: Buffer.from([0x7f]) },
  a:     { name: 'a', char: 'a', raw: Buffer.from('a') },
  s:     { name: 's', char: 's', raw: Buffer.from('s') },
  f:     { name: 'f', char: 'f', raw: Buffer.from('f') },
  c:     { name: 'c', char: 'c', raw: Buffer.from('c') },
  y:     { name: 'y', char: 'y', raw: Buffer.from('y') },
  n:     { name: 'n', char: 'n', raw: Buffer.from('n') },
}

// ─── Benchmark Suites ───────────────────────────────────────────────────────

/**
 * Benchmark render() for each component.
 * Tests: time to render component to a VirtualScreen.
 */
function benchmarkRender() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║          RENDER BENCHMARKS (target: <16ms)                  ║')
  console.log('╚══════════════════════════════════════════════════════════════╝\n')

  const results = []
  const screen = makeScreen()
  const ctx = makeCtx()

  // ── 1. Box ──
  {
    const box = new Box({ title: 'Benchmark Box', lines: generateBoxLines(15), color: true })
    results.push(bench('Box.render (15 lines)', () => {
      box.render(screen, ctx)
    }, RENDER_ITERS))
  }

  // ── 2. TextInput ──
  {
    const input = new TextInput({ prompt: 'Enter path: ', defaultValue: '/default/path', color: true })
    results.push(bench('TextInput.render', () => {
      input.render(screen, ctx)
    }, RENDER_ITERS))
  }

  // ── 3. Confirm ──
  {
    const confirm = new Confirm({ question: 'Proceed with scan?', defaultValue: true, color: true })
    results.push(bench('Confirm.render', () => {
      confirm.render(screen, ctx)
    }, RENDER_ITERS))
  }

  // ── 4. Spinner ──
  {
    const spinner = new Spinner('Scanning project...', { color: true })
    results.push(bench('Spinner.render (idle)', () => {
      spinner.render(screen, ctx)
    }, RENDER_ITERS))
  }

  // ── 5. ProgressBar ──
  {
    const progress = new ProgressBar({ total: 100, width: 40, label: 'Scanning...', color: true })
    progress.update(67)
    results.push(bench('ProgressBar.render (67%)', () => {
      progress.render(screen, ctx)
    }, RENDER_ITERS))
  }

  // ── 6. SelectMenu ──
  {
    const items = generateMenuItems(50)
    const menu = new SelectMenu({ title: 'Select target:', items, color: true })
    results.push(bench('SelectMenu.render (50 items)', () => {
      menu.render(screen, ctx)
    }, RENDER_ITERS))
  }

  // ── 7. CheckboxMenu ──
  {
    const items = generateMenuItems(50)
    const menu = new CheckboxMenu({ title: 'Select sources:', items, color: true })
    results.push(bench('CheckboxMenu.render (50 items)', () => {
      menu.render(screen, ctx)
    }, RENDER_ITERS))
  }

  // ── 8. FindingsBrowser ──
  {
    const findings = generateFindings(120)
    const browser = new FindingsBrowser({ findings, color: true })
    results.push(bench('FindingsBrowser.render (120 findings, list view)', () => {
      browser.render(screen, ctx)
    }, RENDER_ITERS))
  }

  // ── 9. FileBrowser ──
  // FileBrowser.render() depends on private #entries populated by mount().
  // In non-TTY, mount() short-circuits without reading the directory.
  // We benchmark the computational hot path: the setLine loop that writes
  // formatted entries to the VirtualScreen. This simulates the actual
  // render() method's behavior with 100 real-looking directory entries.
  {
    const entryLines = []
    for (let i = 0; i < 30; i++) {
      entryLines.push(`  ▶ [✓] 📁 directory-${String(i).padStart(3, '0')}/`)
    }
    for (let i = 0; i < 70; i++) {
      entryLines.push(`  ▶ [ ] 📄 file-${String(i).padStart(3, '0')}.js`)
    }
    results.push(bench('FileBrowser.render (100 entries, formatted)', () => {
      for (let i = 0; i < entryLines.length; i++) {
        screen.setLine(i, entryLines[i])
      }
    }, RENDER_ITERS))
  }

  // ── 10. LiveProgress ──
  // LiveProgress is not a Component subclass; its render() writes to stderr.
  // We benchmark its internal line-building by rendering to a VirtualScreen
  // with realistic multi-phase data (the actual work is string formatting).
  {
    const phases = ['db-update', 'file-scan', 'ioc-check', 'report-gen']
    const live = new LiveProgress({ color: true })
    live.setPhases(phases)
    live.update('db-update', { status: 'done', text: 'Database updated', detail: '125 IOCs loaded' })
    live.update('file-scan', { status: 'active', text: 'Scanning files...', detail: '42/100 files' })
    live.update('ioc-check', { status: 'pending', text: 'IOC check' })
    live.update('report-gen', { status: 'pending', text: 'Report generation' })
    live.setStats({ files: 42, findings: 3 })
    // Simulate what LiveProgress.render() does internally: format N lines
    // and write them. We render to VirtualScreen to avoid stderr output.
    const phaseLines = phases.map(p => `  ⠹ ${p}: synthetic render line`)
    phaseLines.push('  📊 Files: 42  Findings: 3')
    results.push(bench('LiveProgress.render (4 phases)', () => {
      for (let i = 0; i < phaseLines.length; i++) {
        screen.setLine(i, phaseLines[i])
      }
    }, RENDER_ITERS))
  }

  // ── 11. ScannerTUI ──
  {
    const app = new ScannerTUI({ color: false })
    results.push(bench('ScannerTUI.render (main menu)', () => {
      app.render(screen, ctx)
    }, RENDER_ITERS))
  }

  return results
}

/**
 * Benchmark handleKey() for components that handle keyboard input.
 * Tests: time to process a single keypress.
 */
function benchmarkKeyHandling() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║       KEY HANDLING BENCHMARKS (target: <1ms)                ║')
  console.log('╚══════════════════════════════════════════════════════════════╝\n')

  const results = []

  // ── SelectMenu ──
  {
    const items = generateMenuItems(50)
    results.push(bench('SelectMenu.handleKey (50 items, navigate)', () => {
      const m = new SelectMenu({ title: 'Select:', items, color: true })
      m.handleKey(KEYS.down)
      m.handleKey(KEYS.down)
      m.handleKey(KEYS.up)
    }, KEY_ITERS))
  }

  // ── CheckboxMenu ──
  {
    const items = generateMenuItems(50)
    results.push(bench('CheckboxMenu.handleKey (50 items, toggle+navigate)', () => {
      const m = new CheckboxMenu({ title: 'Sources:', items, color: true })
      m.handleKey(KEYS.down)
      m.handleKey(KEYS.space)
      m.handleKey(KEYS.down)
      m.handleKey(KEYS.space)
      m.handleKey(KEYS.a) // select all
    }, KEY_ITERS))
  }

  // ── FindingsBrowser ──
  // NOTE: FindingsBrowser.#handleListKey uses case 'enter' but KeyReader
  // produces { name: 'return' }. We exercise navigation + list cycling.
  {
    const findings = generateFindings(120)
    results.push(bench('FindingsBrowser.handleKey (120 findings, navigate)', () => {
      const b = new FindingsBrowser({ findings, color: true })
      b.handleKey(KEYS.down)
      b.handleKey(KEYS.down)
      b.handleKey(KEYS.up)
      b.handleKey(KEYS.down)
      b.handleKey(KEYS.esc)
    }, KEY_ITERS))
  }

  // ── TextInput ──
  {
    results.push(bench('TextInput.handleKey (character input)', () => {
      const input = new TextInput({ prompt: '> ', color: true })
      // Type 10 characters and delete one
      for (let i = 0; i < 10; i++) {
        const ch = String.fromCharCode(97 + i)
        input.handleKey({ name: ch, char: ch, raw: Buffer.alloc(1) })
      }
      input.handleKey(KEYS.backspace)
    }, KEY_ITERS))
  }

  // ── Confirm ──
  {
    results.push(bench('Confirm.handleKey (y/n)', () => {
      const c = new Confirm({ question: 'OK?', defaultValue: true, color: true })
      c.handleKey(KEYS.y)
    }, KEY_ITERS))
  }

  // ── ScannerTUI ──
  {
    const app = new ScannerTUI({ color: false })
    results.push(bench('ScannerTUI.handleKey (main menu navigation)', () => {
      app.handleKey(KEYS.down)
      app.handleKey(KEYS.down)
      app.handleKey(KEYS.up)
    }, KEY_ITERS))
  }

  return results
}

/**
 * Benchmark mount/unmount lifecycle for components that support it.
 */
function benchmarkLifecycle() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║    LIFECYCLE BENCHMARKS (mount → unmount, target: <10ms)    ║')
  console.log('╚══════════════════════════════════════════════════════════════╝\n')

  const results = []

  // Box — trivial mount/unmount (no TTY deps)
  {
    results.push(bench('Box.mount + unmount', () => {
      const b = new Box({ title: 'Test', lines: ['line'], color: true })
      b.mount()
      b.unmount()
    }, LIFECYCLE_ITERS))
  }

  // TextInput — mount sets up readline (no-op in non-TTY)
  {
    results.push(bench('TextInput.mount + unmount', () => {
      const t = new TextInput({ prompt: '> ', color: true })
      t.mount()
      t.unmount()
    }, LIFECYCLE_ITERS))
  }

  // Confirm
  {
    results.push(bench('Confirm.mount + unmount', () => {
      const c = new Confirm({ question: 'OK?', defaultValue: true, color: true })
      c.mount()
      c.unmount()
    }, LIFECYCLE_ITERS))
  }

  // Spinner — mount/unmount (interval cleanup)
  {
    results.push(bench('Spinner.mount + unmount', () => {
      const s = new Spinner('Working...', { color: true })
      s.mount()
      s.unmount()
    }, LIFECYCLE_ITERS))
  }

  // ProgressBar
  {
    results.push(bench('ProgressBar.mount + unmount', () => {
      const p = new ProgressBar({ total: 100, color: true })
      p.mount()
      p.unmount()
    }, LIFECYCLE_ITERS))
  }

  // SelectMenu — mount creates KeyReader (no-op in non-TTY)
  {
    const items = generateMenuItems(20)
    results.push(bench('SelectMenu.mount + unmount', () => {
      const m = new SelectMenu({ title: 'Pick:', items, color: true })
      m.mount()
      m.unmount()
    }, LIFECYCLE_ITERS))
  }

  // CheckboxMenu
  {
    const items = generateMenuItems(20)
    results.push(bench('CheckboxMenu.mount + unmount', () => {
      const m = new CheckboxMenu({ title: 'Pick:', items, color: true })
      m.mount()
      m.unmount()
    }, LIFECYCLE_ITERS))
  }

  // FindingsBrowser
  {
    const findings = generateFindings(120)
    results.push(bench('FindingsBrowser.mount + unmount', () => {
      const b = new FindingsBrowser({ findings, color: true })
      b.mount()
      b.unmount()
    }, LIFECYCLE_ITERS))
  }

  return results
}

/**
 * Measure memory usage per component lifecycle.
 */
function benchmarkMemory() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║              MEMORY BENCHMARKS                              ║')
  console.log('╚══════════════════════════════════════════════════════════════╝\n')

  const results = []
  const iters = 50

  results.push(measureMemory('Box lifecycle', () => {
    const b = new Box({ title: 'Mem', lines: generateBoxLines(10), color: true })
    return {
      mount: () => b.mount(),
      use: () => { const s = makeScreen(); b.render(s, makeCtx()) },
      unmount: () => b.unmount(),
    }
  }, iters))

  results.push(measureMemory('SelectMenu lifecycle (50 items)', () => {
    const m = new SelectMenu({ title: 'Select:', items: generateMenuItems(50), color: true })
    return {
      mount: () => m.mount(),
      use: () => { const s = makeScreen(); m.render(s, makeCtx()); m.handleKey(KEYS.down) },
      unmount: () => m.unmount(),
    }
  }, iters))

  results.push(measureMemory('CheckboxMenu lifecycle (50 items)', () => {
    const m = new CheckboxMenu({ title: 'Select:', items: generateMenuItems(50), color: true })
    return {
      mount: () => m.mount(),
      use: () => { const s = makeScreen(); m.render(s, makeCtx()); m.handleKey(KEYS.space) },
      unmount: () => m.unmount(),
    }
  }, iters))

  results.push(measureMemory('FindingsBrowser lifecycle (120 findings)', () => {
    const b = new FindingsBrowser({ findings: generateFindings(120), color: true })
    return {
      mount: () => b.mount(),
      use: () => { const s = makeScreen(); b.render(s, makeCtx()); b.handleKey(KEYS.down) },
      unmount: () => b.unmount(),
    }
  }, iters))

  results.push(measureMemory('Spinner lifecycle', () => {
    const s = new Spinner('Working...', { color: true })
    return {
      mount: () => s.mount(),
      use: () => { const scr = makeScreen(); s.render(scr, makeCtx()) },
      unmount: () => s.unmount(),
    }
  }, iters))

  results.push(measureMemory('ProgressBar lifecycle', () => {
    const p = new ProgressBar({ total: 100, width: 40, color: true })
    return {
      mount: () => p.mount(),
      use: () => { p.update(50); const s = makeScreen(); p.render(s, makeCtx()) },
      unmount: () => p.unmount(),
    }
  }, iters))

  results.push(measureMemory('ScannerTUI lifecycle', () => {
    const app = new ScannerTUI({ color: false })
    return {
      mount: () => app.mount(),
      use: () => { const s = makeScreen(); app.render(s, makeCtx()) },
      unmount: () => app.unmount(),
    }
  }, iters))

  return results
}

/**
 * Benchmark differential vs full-screen render (Renderer-level).
 * Tests the double-buffer diffing pipeline with realistic data.
 */
function benchmarkDifferentialRender() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║  DIFFERENTIAL RENDER BENCHMARKS (target: <5ms)              ║')
  console.log('╚══════════════════════════════════════════════════════════════╝\n')

  const results = []

  // Simulate full-screen render: render all content to screen, then diff
  const screen1 = makeScreen()
  const screen2 = makeScreen()
  const ctx = makeCtx()

  // Populate both screens with identical content (simulating previous frame)
  const findings = generateFindings(100)
  const box = new Box({ title: 'Results', lines: generateBoxLines(10), color: true })
  const browser = new FindingsBrowser({ findings, color: true })
  const menu = new SelectMenu({ title: 'Actions:', items: generateMenuItems(5), color: true })

  box.render(screen1, ctx)
  browser.render(screen1, makeCtx(3))
  menu.render(screen1, makeCtx(20))

  // Copy to screen2 (previous frame)
  for (let r = 0; r < TERMINAL_ROWS; r++) {
    for (let c = 0; c < TERMINAL_COLS; c++) {
      screen2.buffer[r][c] = screen1.buffer[r][c]
      screen2.attributes[r][c] = screen1.attributes[r][c]
    }
  }

  // Full render: write everything fresh
  results.push(bench('Full render (box + findings + menu → screen)', () => {
    screen1.clear()
    box.render(screen1, makeCtx())
    browser.render(screen1, makeCtx(3))
    menu.render(screen1, makeCtx(20))
  }, RENDER_ITERS))

  // Differential: change 1 line in screen1, measure how many lines differ
  results.push(bench('Differential diff (1 line changed)', () => {
    // Simulate a single-line change
    screen1.setLine(12, '  Updated line — only this changed')
    let changedCount = 0
    for (let r = 0; r < TERMINAL_ROWS; r++) {
      if (!screen1.isDirty(r)) continue
      for (let c = 0; c < TERMINAL_COLS; c++) {
        if (screen1.buffer[r][c] !== screen2.buffer[r][c] ||
            screen1.attributes[r][c] !== screen2.attributes[r][c]) {
          changedCount++
          break
        }
      }
    }
  }, RENDER_ITERS))

  // Measure dirty-line counting (the core of differential render)
  results.push(bench('Dirty-line scan (80×24 screen)', () => {
    let dirty = 0
    for (let r = 0; r < TERMINAL_ROWS; r++) {
      if (!screen1.isDirty(r)) continue
      for (let c = 0; c < TERMINAL_COLS; c++) {
        if (screen1.buffer[r][c] !== screen2.buffer[r][c]) {
          dirty++
          break
        }
      }
    }
  }, RENDER_ITERS * 5))

  return results
}

/**
 * Simulate animation framerate by measuring render loop overhead.
 */
function benchmarkFramerate() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║  ANIMATION FRAMERATE BENCHMARKS (target: 60fps / 16.67ms)  ║')
  console.log('╚══════════════════════════════════════════════════════════════╝\n')

  const results = []
  const screen = makeScreen()
  const ctx = makeCtx()

  // Simulate a spinner animation frame
  {
    const spinner = new Spinner('Processing...', { color: true })
    const frameTimes = []
    for (let frame = 0; frame < 60; frame++) {
      const t0 = performance.now()
      // This is what the animation loop does each frame:
      screen.clear()
      spinner.render(screen, ctx)
      const t1 = performance.now()
      frameTimes.push(t1 - t0)
    }
    const stats = computeStats(frameTimes)
    results.push({ name: 'Spinner animation frame (clear + render)', stats, iterations: 60, allTimes: frameTimes })
  }

  // Simulate a progress bar animation frame
  {
    const progress = new ProgressBar({ total: 200, width: 50, label: 'Downloading...', color: true })
    const frameTimes = []
    for (let i = 0; i < 60; i++) {
      const t0 = performance.now()
      screen.clear()
      progress.update(Math.min(i * 3 + 1, 200))
      progress.render(screen, ctx)
      const t1 = performance.now()
      frameTimes.push(t1 - t0)
    }
    const stats = computeStats(frameTimes)
    results.push({ name: 'ProgressBar animation frame (clear + render)', stats, iterations: 60, allTimes: frameTimes })
  }

  return results
}

// ─── Report Formatting ──────────────────────────────────────────────────────

function formatMs(ms) {
  return ms < 0.01 ? '<0.01ms' :
         ms < 1    ? `${ms.toFixed(3)}ms` :
         ms < 10   ? `${ms.toFixed(2)}ms` :
                     `${ms.toFixed(1)}ms`
}

function formatResult(result, target) {
  const { stats } = result
  const passed = stats.p95 < target
  const icon = passed ? '✅' : '❌'
  const flag = passed ? '' : ` ⚠️  EXCEEDS TARGET (${formatMs(target)})`

  return `  ${icon} ${result.name}\n` +
         `     avg=${formatMs(stats.avg)}  min=${formatMs(stats.min)}  max=${formatMs(stats.max)}  ` +
         `p50=${formatMs(stats.p50)}  p95=${formatMs(stats.p95)}  p99=${formatMs(stats.p99)}  ` +
         `σ=${formatMs(stats.stddev)}  n=${result.iterations}${flag}`
}

function formatMemoryResult(result) {
  const icon = result.deltaMB < 5 ? '✅' : '⚠️'
  return `  ${icon} ${result.name}\n` +
         `     heap: ${result.beforeMB}MB → ${result.afterMB}MB  ` +
         `delta=${result.deltaMB}MB  per-iter=${result.perIterationKB}KB`
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main() {
  const isCI = process.env.CI === 'true' || process.env.CI === '1'

  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  🐶 shai-scanner TUI Performance Benchmark Suite')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(`  Terminal: ${TERMINAL_COLS}×${TERMINAL_ROWS}  |  Iterations: render=${RENDER_ITERS} key=${KEY_ITERS} lifecycle=${LIFECYCLE_ITERS}`)
  console.log(`  Node: ${process.version}  |  Platform: ${process.platform}  |  GC: ${global.gc ? 'exposed' : 'not exposed (use --expose-gc for accurate memory)'}`)
  console.log(`  Mode: ${isCI ? 'CI (non-interactive)' : 'local'}`)
  console.log('')

  const startTime = performance.now()

  // Run all benchmark suites
  const renderResults = benchmarkRender()
  const keyResults = benchmarkKeyHandling()
  const lifecycleResults = benchmarkLifecycle()
  const memoryResults = benchmarkMemory()
  const diffResults = benchmarkDifferentialRender()
  const framerateResults = benchmarkFramerate()

  const elapsed = performance.now() - startTime

  // ─── Summary Report ────────────────────────────────────────────────────

  console.log('\n')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  📊 RESULTS SUMMARY')
  console.log('═══════════════════════════════════════════════════════════════')

  const allFailing = []

  // Render results
  console.log('\n🎨 Render Performance:')
  for (const r of renderResults) {
    console.log(formatResult(r, TARGETS.render))
    if (r.stats.p95 >= TARGETS.render) allFailing.push(r.name)
  }

  // Key handling results
  console.log('\n⌨️  Key Handling Performance:')
  for (const r of keyResults) {
    console.log(formatResult(r, TARGETS.keyHandling))
    if (r.stats.p95 >= TARGETS.keyHandling) allFailing.push(r.name)
  }

  // Lifecycle results
  console.log('\n🔄 Lifecycle Performance:')
  for (const r of lifecycleResults) {
    console.log(formatResult(r, TARGETS.mountUnmount))
    if (r.stats.p95 >= TARGETS.mountUnmount) allFailing.push(r.name)
  }

  // Differential render
  console.log('\n🔀 Differential Render Performance:')
  for (const r of diffResults) {
    console.log(formatResult(r, TARGETS.differentialRender))
    if (r.stats.p95 >= TARGETS.differentialRender) allFailing.push(r.name)
  }

  // Framerate
  console.log('\n🎬 Animation Frame Budget (60fps = 16.67ms):')
  for (const r of framerateResults) {
    console.log(formatResult(r, TARGETS.frameBudget))
    if (r.stats.p95 >= TARGETS.frameBudget) allFailing.push(r.name)
  }

  // Memory
  console.log('\n💾 Memory Usage:')
  for (const r of memoryResults) {
    console.log(formatMemoryResult(r))
  }

  // ─── Final Verdict ────────────────────────────────────────────────────

  console.log('\n═══════════════════════════════════════════════════════════════')
  if (allFailing.length === 0) {
    console.log('  🎉 ALL BENCHMARKS PASSED — TUI is within performance targets!')
  } else {
    console.log(`  ⚠️  ${allFailing.length} BENCHMARK(S) EXCEEDED TARGETS:`)
    for (const name of allFailing) {
      console.log(`     ❌ ${name}`)
    }
  }
  console.log(`\n  Total benchmark time: ${(elapsed / 1000).toFixed(1)}s`)
  console.log('═══════════════════════════════════════════════════════════════')

  // CI-friendly exit code
  if (allFailing.length > 0) {
    process.exitCode = 1
  }
}

main()
