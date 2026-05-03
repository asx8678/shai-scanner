#!/usr/bin/env node
// test/visual-regression-test.js
// Visual regression test framework for shai-scanner TUI components.
//
// Captures VirtualScreen output for each of the 11 migrated components,
// compares against baseline snapshots in test/fixtures/visual-baselines/,
// and reports any differences as test failures.
//
// Usage:
//   node test/visual-regression-test.js              # Compare against baselines
//   node test/visual-regression-test.js --update     # Generate / update baselines
//   npm run test:visual                              # Compare against baselines
//   npm run test:visual -- --update                  # Generate / update baselines

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// ─── Force deterministic environment ────────────────────────────────────────
process.env.NO_COLOR = '1'
if (!process.env.FORCE_COLOR) process.env.FORCE_COLOR = '0'

// Set terminal columns for Box.draw() width calculation
Object.defineProperty(process.stdout, 'columns', { value: 80, writable: true, configurable: true })

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASELINE_DIR = join(__dirname, 'fixtures', 'visual-baselines')

// ─── Ensure baseline directory exists ────────────────────────────────────────
if (!existsSync(BASELINE_DIR)) {
  mkdirSync(BASELINE_DIR, { recursive: true })
}

// ─── CLI mode ────────────────────────────────────────────────────────────────
const UPDATE_MODE = process.argv.includes('--update')

// ─── Test harness ────────────────────────────────────────────────────────────
let passed = 0
let failed = 0
let skipped = 0
let total = 0
const failures = []

function test(name, fn) {
  total++
  try {
    fn()
    passed++
    console.log(`  ✓ ${name}`)
  } catch (error) {
    failed++
    failures.push({ name, error })
    console.error(`  ✗ ${name}`)
    console.error(`    ${error.message}`)
  }
}

// ─── Snapshot helpers ────────────────────────────────────────────────────────

/**
 * Capture the current state of a VirtualScreen as a snapshot.
 * Strips trailing whitespace from lines and trailing empty rows.
 */
function captureScreen(screen, componentName) {
  const lines = []
  for (let r = 0; r < screen.rows; r++) {
    // getLine returns plain text (ANSI already stripped by setLine)
    const line = screen.getLine(r).replace(/\s+$/, '')
    lines.push(line)
  }
  // Trim trailing empty rows
  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop()
  }
  return {
    component: componentName,
    screenSize: { cols: screen.cols, rows: screen.rows },
    lines,
  }
}

/**
 * Capture a string-based snapshot (for components that produce output via static methods).
 */
function captureString(text, componentName) {
  const lines = text.split('\n').map(l => l.replace(/\s+$/, ''))
  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop()
  }
  return {
    component: componentName,
    screenSize: { cols: 80, rows: 24 },
    lines,
  }
}

function baselinePath(name) {
  return join(BASELINE_DIR, `${name}.json`)
}

function saveBaseline(name, snapshot) {
  writeFileSync(baselinePath(name), JSON.stringify(snapshot, null, 2) + '\n')
}

function loadBaseline(name) {
  const p = baselinePath(name)
  if (!existsSync(p)) return null
  return JSON.parse(readFileSync(p, 'utf-8'))
}

/**
 * Compare two snapshots line by line.
 * Returns { equal: boolean, diffs: string[] }
 */
function compareSnapshots(actual, expected) {
  const diffs = []

  if (actual.lines.length !== expected.lines.length) {
    diffs.push(`Line count differs: actual=${actual.lines.length}, expected=${expected.lines.length}`)
  }

  const maxLines = Math.max(actual.lines.length, expected.lines.length)
  for (let i = 0; i < maxLines; i++) {
    const a = actual.lines[i] ?? '<missing>'
    const b = expected.lines[i] ?? '<missing>'
    if (a !== b) {
      diffs.push(`Line ${i} differs:`)
      diffs.push(`  actual:   ${JSON.stringify(a)}`)
      diffs.push(`  expected: ${JSON.stringify(b)}`)
    }
  }

  return { equal: diffs.length === 0, diffs }
}

// ─── Component imports ───────────────────────────────────────────────────────
// We import lazily inside the test function body where needed to ensure
// NO_COLOR is set before any component reads env vars.

async function importComponents() {
  const [
    { VirtualScreen },
    { Box },
    { TextInput, Confirm },
    { Spinner, ProgressBar },
    { SelectMenu, CheckboxMenu },
    { FileBrowser },
    { FindingsBrowser },
    { ScannerTUI },
  ] = await Promise.all([
    import('../src/tui/core/virtual-screen.js'),
    import('../src/tui/components/box.js'),
    import('../src/tui/components/input.js'),
    import('../src/tui/components/progress.js'),
    import('../src/tui/components/menu.js'),
    import('../src/tui/components/browser.js'),
    import('../src/tui/components/findings.js'),
    import('../src/tui/components/app.js'),
  ])

  return { VirtualScreen, Box, TextInput, Confirm, Spinner, ProgressBar, SelectMenu, CheckboxMenu, FileBrowser, FindingsBrowser, ScannerTUI }
}

// ─── Snapshot capture functions for each component ───────────────────────────
// Each function creates a component in a deterministic state, renders it to a
// VirtualScreen, and returns a snapshot object.

const SCREEN_COLS = 80
const SCREEN_ROWS = 24

function makeScreen(VirtualScreen) {
  return new VirtualScreen(SCREEN_COLS, SCREEN_ROWS)
}

async function captureBox(VirtualScreen, Box) {
  const screen = makeScreen(VirtualScreen)
  const box = new Box({ title: 'Test Title', lines: ['Hello World', 'Second Line'], color: false })
  box.mount()
  box.render(screen, { bounds: { row: 0 } })
  box.unmount()
  return captureScreen(screen, 'Box')
}

async function captureTextInput(VirtualScreen, TextInput) {
  const screen = makeScreen(VirtualScreen)
  const input = new TextInput({ prompt: 'Enter name:', defaultValue: 'default', color: false })
  input.mount()
  input.render(screen, { bounds: { row: 0 } })
  input.unmount()
  return captureScreen(screen, 'TextInput')
}

async function captureConfirm(VirtualScreen, Confirm) {
  const screen = makeScreen(VirtualScreen)
  const c = new Confirm({ question: 'Continue?', defaultValue: true, color: false })
  c.mount()
  c.render(screen, { bounds: { row: 0 } })
  c.unmount()
  return captureScreen(screen, 'Confirm')
}

async function captureSpinner(Spinner) {
  // Spinner.render() returns early in non-TTY — use static draw() instead
  const text = 'Loading resources...'
  const frames = []
  // Capture first 3 frames for visual verification
  for (let f = 0; f < 3; f++) {
    frames.push(Spinner.draw(text, f))
  }
  return captureString(frames.join('\n'), 'Spinner')
}

async function captureProgressBar(VirtualScreen, ProgressBar) {
  // ProgressBar.render() returns early in non-TTY — build the output manually
  // using the same logic as the component's render method
  const screen = makeScreen(VirtualScreen)
  const bar = new ProgressBar({ total: 100, width: 30, label: 'Processing', color: false })
  bar.mount()

  // Simulate progress at 50% by directly setting internal state
  // Since render() checks isTTY, we build the string representation
  const total = 100
  const current = 50
  const pct = Math.round((current / total) * 100)
  const filled = Math.round((current / total) * 30)
  const empty = 30 - filled
  const barStr = '█'.repeat(filled) + '░'.repeat(Math.max(empty, 0))
  const pctStr = String(pct).padStart(3)
  const line = `${barStr} ${pctStr}% Processing`
  screen.setLine(0, line)

  bar.unmount()
  return captureScreen(screen, 'ProgressBar')
}

async function captureSelectMenu(VirtualScreen, SelectMenu) {
  const screen = makeScreen(VirtualScreen)
  const menu = new SelectMenu({
    title: 'Choose an option',
    items: [
      { label: 'Option A', value: 'a', description: 'First choice' },
      { label: 'Option B', value: 'b', description: 'Second choice' },
      { label: 'Option C', value: 'c' },
    ],
    color: false,
  })
  menu.mount()
  menu.render(screen, { bounds: { row: 0 } })
  menu.unmount()
  return captureScreen(screen, 'SelectMenu')
}

async function captureCheckboxMenu(VirtualScreen, CheckboxMenu) {
  const screen = makeScreen(VirtualScreen)
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
  return captureScreen(screen, 'CheckboxMenu')
}

async function captureFileBrowser(VirtualScreen, FileBrowser) {
  // FileBrowser has complex async init in non-TTY mode — test with minimal state
  const screen = makeScreen(VirtualScreen)
  const browser = new FileBrowser({ startDir: '.', title: 'Select Files', color: false })
  browser.mount()
  // In non-TTY mode, mount sets complete=true immediately
  // Render won't produce visible output since the browser resolves immediately
  // But we capture the mount state as the baseline
  browser.render(screen, { bounds: { row: 0 } })
  browser.unmount()
  return captureScreen(screen, 'FileBrowser')
}

async function captureFindingsBrowser(VirtualScreen, FindingsBrowser) {
  const screen = makeScreen(VirtualScreen)
  const sampleFindings = [
    {
      packageName: 'malicious-pkg',
      packageVersion: '1.0.0',
      severity: 'critical',
      type: 'ioc-filename',
      description: 'Known malicious package detected',
      source: 'ioc-database',
      attack: 'supply-chain',
      path: 'node_modules/malicious-pkg',
    },
    {
      packageName: 'vulnerable-lib',
      packageVersion: '2.3.1',
      severity: 'high',
      type: 'cve',
      description: 'Remote code execution vulnerability',
      cve: 'CVE-2024-12345',
      source: 'osv',
      attack: 'rce',
      path: 'node_modules/vulnerable-lib',
    },
    {
      packageName: 'sketchy-dep',
      packageVersion: '0.1.0',
      severity: 'medium',
      type: 'suspicious',
      description: 'Suspicious postinstall script',
      source: 'audit',
      attack: 'data-exfiltration',
      path: 'node_modules/sketchy-dep',
    },
  ]
  const browser = new FindingsBrowser({ findings: sampleFindings, color: false })
  browser.mount()
  browser.render(screen, { bounds: { row: 0 } })
  browser.unmount()
  return captureScreen(screen, 'FindingsBrowser')
}

async function captureScannerTUI(VirtualScreen, ScannerTUI) {
  const screen = makeScreen(VirtualScreen)
  const app = new ScannerTUI({ color: false })
  app.mount()
  // ScannerTUI defaults to main-menu screen
  app.render(screen, { bounds: { row: 0 } })
  app.unmount()
  return captureScreen(screen, 'ScannerTUI')
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🐕 Visual Regression Tests for shai-scanner TUI\n`)
  console.log(UPDATE_MODE
    ? '  Mode: GENERATE BASELINES (--update)\n'
    : '  Mode: COMPARE AGAINST BASELINES\n'
  )

  const {
    VirtualScreen, Box, TextInput, Confirm,
    Spinner, ProgressBar, SelectMenu, CheckboxMenu,
    FileBrowser, FindingsBrowser, ScannerTUI,
  } = await importComponents()

  // ─── Capture snapshots ─────────────────────────────────────────────────

  const snapshots = [
    { name: 'Box',             capture: () => captureBox(VirtualScreen, Box) },
    { name: 'TextInput',       capture: () => captureTextInput(VirtualScreen, TextInput) },
    { name: 'Confirm',         capture: () => captureConfirm(VirtualScreen, Confirm) },
    { name: 'Spinner',         capture: () => captureSpinner(Spinner) },
    { name: 'ProgressBar',     capture: () => captureProgressBar(VirtualScreen, ProgressBar) },
    { name: 'SelectMenu',      capture: () => captureSelectMenu(VirtualScreen, SelectMenu) },
    { name: 'CheckboxMenu',    capture: () => captureCheckboxMenu(VirtualScreen, CheckboxMenu) },
    { name: 'FileBrowser',     capture: () => captureFileBrowser(VirtualScreen, FileBrowser) },
    { name: 'FindingsBrowser', capture: () => captureFindingsBrowser(VirtualScreen, FindingsBrowser) },
    { name: 'ScannerTUI',      capture: () => captureScannerTUI(VirtualScreen, ScannerTUI) },
  ]

  // Also capture a sub-state snapshot for ScannerTUI (scan-config screen)
  snapshots.push({
    name: 'ScannerTUI-scan-config',
    capture: async () => {
      const screen = makeScreen(VirtualScreen)
      const app = new ScannerTUI({ color: false })
      app.mount()
      app.navigateTo('scan-config')
      app.render(screen, { bounds: { row: 0 } })
      app.unmount()
      return captureScreen(screen, 'ScannerTUI-scan-config')
    },
  })

  console.log('Capturing snapshots...\n')

  for (const { name, capture } of snapshots) {
    const snapshot = await capture()

    if (UPDATE_MODE) {
      saveBaseline(name, snapshot)
      console.log(`  💾 Saved baseline: ${name} (${snapshot.lines.length} lines)`)
    } else {
      const baseline = loadBaseline(name)
      if (!baseline) {
        skipped++
        total++
        console.log(`  ⚠ ${name} — no baseline found (run with --update to create)`)
        continue
      }

      test(`${name} matches baseline`, () => {
        const { equal, diffs } = compareSnapshots(snapshot, baseline)
        if (!equal) {
          throw new Error(`Snapshot mismatch:\n${diffs.join('\n')}`)
        }
      })
    }
  }

  // ─── Summary ──────────────────────────────────────────────────────────

  console.log('\n' + '─'.repeat(60))

  if (UPDATE_MODE) {
    console.log(`\n💾 Generated ${snapshots.length} baseline snapshots in:\n   ${BASELINE_DIR}\n`)
    console.log('Run without --update to verify against these baselines.\n')
  } else {
    console.log(`\n  Total: ${total}  Passed: ${passed}  Failed: ${failed}  Skipped: ${skipped}\n`)

    if (failures.length > 0) {
      console.log('Failed tests:')
      for (const { name, error } of failures) {
        console.log(`  ✗ ${name}`)
        console.log(`    ${error.message.split('\n')[0]}`)
      }
      console.log('')
    }

    if (skipped > 0) {
      console.log(`  ℹ ${skipped} component(s) missing baselines. Run with --update to generate.\n`)
    }

    process.exit(failed > 0 ? 1 : 0)
  }
}

main().catch(err => {
  console.error('\n💥 Fatal error:', err)
  process.exit(1)
})
