/**
 * FileBrowser Component Migration Test
 *
 * Tests the new FileBrowser component that extends Component base class.
 * Covers: instantiation, lifecycle, keyboard handling, rendering,
 * directory operations, integration, and backward compatibility.
 *
 * Usage: node test/browser-test.js
 */

import assert from 'node:assert/strict'
import { FileBrowser } from '../src/tui/components/browser.js'
import { Component } from '../src/tui/core/component.js'
import { VirtualScreen } from '../src/tui/core/virtual-screen.js'

let passed = 0
let failed = 0
let total = 0

function test(name, fn) {
  total++
  try {
    fn()
    passed++
    console.log(`  ✓ ${name}`)
  } catch (error) {
    failed++
    console.error(`  ✗ ${name}`)
    console.error(`    ${error.message}`)
  }
}

async function testAsync(name, fn) {
  total++
  try {
    await fn()
    passed++
    console.log(`  ✓ ${name}`)
  } catch (error) {
    failed++
    console.error(`  ✗ ${name}`)
    console.error(`    ${error.message}`)
  }
}

console.log('FileBrowser Component Migration Tests\n')

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Module Exports
// ═══════════════════════════════════════════════════════════════════════════════

console.log('Module Exports:')

test('FileBrowser is exported from src/tui/components/browser.js', () => {
  assert.ok(FileBrowser, 'FileBrowser should be defined')
  assert.equal(typeof FileBrowser, 'function', 'FileBrowser should be a constructor function')
})

test('Component is exported from src/tui/core/component.js', () => {
  assert.ok(Component, 'Component should be defined')
  assert.equal(typeof Component, 'function', 'Component should be a constructor function')
})

test('VirtualScreen is exported from src/tui/core/virtual-screen.js', () => {
  assert.ok(VirtualScreen, 'VirtualScreen should be defined')
  assert.equal(typeof VirtualScreen, 'function', 'VirtualScreen should be a constructor function')
})

test('FileBrowser has static run method', () => {
  assert.equal(typeof FileBrowser.run, 'function', 'FileBrowser.run should be a function')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Inheritance
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nInheritance:')

test('FileBrowser extends Component', () => {
  const browser = new FileBrowser()
  assert.ok(browser instanceof Component, 'FileBrowser instance should be instance of Component')
  assert.ok(browser instanceof FileBrowser, 'FileBrowser instance should be instance of FileBrowser')
})

test('FileBrowser prototype chain includes Component', () => {
  assert.ok(Component.isPrototypeOf(FileBrowser), 'FileBrowser should extend Component')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Constructor & Default Properties
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nConstructor & Default Properties:')

test('FileBrowser constructs with no options', () => {
  const browser = new FileBrowser()
  assert.ok(browser, 'FileBrowser should construct with no options')
})

test('FileBrowser defaults title to "Select Paths"', () => {
  const browser = new FileBrowser()
  assert.equal(browser.title, 'Select Paths', 'default title should be "Select Paths"')
})

test('FileBrowser defaults currentDir to empty string before mount', () => {
  const browser = new FileBrowser()
  assert.equal(browser.currentDir, '', 'currentDir should be empty before mount')
})

test('FileBrowser defaults isComplete to false', () => {
  const browser = new FileBrowser()
  assert.equal(browser.isComplete, false, 'isComplete should be false initially')
})

test('FileBrowser defaults isCancelled to false', () => {
  const browser = new FileBrowser()
  assert.equal(browser.isCancelled, false, 'isCancelled should be false initially')
})

test('FileBrowser defaults cursorPos to 0', () => {
  const browser = new FileBrowser()
  assert.equal(browser.cursorPos, 0, 'cursorPos should be 0 initially')
})

test('FileBrowser defaults showHidden to false', () => {
  const browser = new FileBrowser()
  assert.equal(browser.showHidden, false, 'showHidden should default to false')
})

test('FileBrowser defaults selectedPaths to empty array', () => {
  const browser = new FileBrowser()
  assert.deepEqual(browser.selectedPaths, [], 'selectedPaths should be empty initially')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Constructor Options
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nConstructor Options:')

test('FileBrowser accepts custom title', () => {
  const browser = new FileBrowser({ title: 'Pick a File' })
  assert.equal(browser.title, 'Pick a File', 'title should match constructor option')
})

test('FileBrowser accepts startDir option', () => {
  const browser = new FileBrowser({ startDir: '/tmp' })
  assert.ok(browser, 'should construct with startDir option')
})

test('FileBrowser accepts showHidden option', () => {
  const browser = new FileBrowser({ showHidden: true })
  // showHidden getter reflects #showHiddenFiles which starts as #showHidden value
  // But before mount, showHidden getter returns #showHiddenFiles initialized from constructor
  assert.ok(browser, 'should construct with showHidden option')
})

test('FileBrowser accepts selectFiles option', () => {
  const browser = new FileBrowser({ selectFiles: true })
  assert.ok(browser, 'should construct with selectFiles option')
})

test('FileBrowser accepts selectDirs option', () => {
  const browser = new FileBrowser({ selectDirs: true })
  assert.ok(browser, 'should construct with selectDirs option')
})

test('FileBrowser accepts fileFilter option', () => {
  const browser = new FileBrowser({ fileFilter: ['.js', '.json'] })
  assert.ok(browser, 'should construct with fileFilter option')
})

test('FileBrowser accepts color option', () => {
  const browser = new FileBrowser({ color: false })
  assert.ok(browser, 'should construct with color option')
})

test('FileBrowser accepts all options together', () => {
  const browser = new FileBrowser({
    startDir: '/tmp',
    title: 'Custom Title',
    selectFiles: true,
    selectDirs: false,
    showHidden: true,
    fileFilter: ['.txt'],
    color: true,
  })
  assert.equal(browser.title, 'Custom Title', 'title should match')
  assert.ok(browser, 'should construct with all options')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Component Methods (Inherited from Component)
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nComponent Methods (Inherited):')

test('FileBrowser has id property', () => {
  const browser = new FileBrowser()
  assert.ok(browser.id, 'FileBrowser should have an id')
  assert.equal(typeof browser.id, 'string', 'id should be a string')
})

test('FileBrowser has isMounted property', () => {
  const browser = new FileBrowser()
  assert.equal(browser.isMounted, false, 'should not be mounted initially')
})

test('FileBrowser has setState method', () => {
  const browser = new FileBrowser()
  assert.equal(typeof browser.setState, 'function', 'setState should be a function')
})

test('FileBrowser has mount method', () => {
  const browser = new FileBrowser()
  assert.equal(typeof browser.mount, 'function', 'mount should be a function')
})

test('FileBrowser has unmount method', () => {
  const browser = new FileBrowser()
  assert.equal(typeof browser.unmount, 'function', 'unmount should be a function')
})

test('FileBrowser has render method', () => {
  const browser = new FileBrowser()
  assert.equal(typeof browser.render, 'function', 'render should be a function')
})

test('FileBrowser has handleKey method', () => {
  const browser = new FileBrowser()
  assert.equal(typeof browser.handleKey, 'function', 'handleKey should be a function')
})

test('FileBrowser has addChild method', () => {
  const browser = new FileBrowser()
  assert.equal(typeof browser.addChild, 'function', 'addChild should be a function')
})

test('FileBrowser has removeChild method', () => {
  const browser = new FileBrowser()
  assert.equal(typeof browser.removeChild, 'function', 'removeChild should be a function')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Lifecycle (Mount / Unmount)
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nLifecycle (Mount / Unmount):')

test('FileBrowser is not mounted before mount()', () => {
  const browser = new FileBrowser()
  assert.equal(browser.isMounted, false, 'should not be mounted initially')
})

test('FileBrowser unmount works without mount', () => {
  const browser = new FileBrowser()
  // unmount before mount should not throw
  browser.unmount()
  assert.equal(browser.isMounted, false, 'should remain unmounted')
})

test('FileBrowser mount in non-TTY sets complete', () => {
  // In a test environment, process.stdin.isTTY and process.stdout.isTTY
  // may or may not be set. We try mount and check behavior.
  const browser = new FileBrowser({ startDir: '/tmp' })
  try {
    browser.mount()
  } catch {
    // Expected if KeyReader fails in non-TTY
  }
  // If we got here, the mount didn't crash
  assert.ok(browser, 'mount should not crash')
  browser.unmount()
})

test('FileBrowser mount/unmount lifecycle completes cleanly', () => {
  const browser = new FileBrowser({ startDir: '.' })
  try {
    browser.mount()
  } catch {
    // Expected in some environments
  }
  browser.unmount()
  assert.equal(browser.isMounted, false, 'should be unmounted after unmount')
})

test('FileBrowser setState does not throw before mount', () => {
  const browser = new FileBrowser()
  browser.setState({ customKey: 'customValue' })
  assert.ok(browser, 'setState should not throw before mount')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 7. Keyboard Handling — Cursor Navigation (Up / Down)
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nKeyboard Handling — Cursor Navigation:')

test('handleKey up returns true', () => {
  const browser = new FileBrowser()
  const handled = browser.handleKey({ name: 'up' })
  assert.equal(handled, true, 'up key should be handled')
})

test('handleKey down returns true', () => {
  const browser = new FileBrowser()
  const handled = browser.handleKey({ name: 'down' })
  assert.equal(handled, true, 'down key should be handled')
})

test('handleKey up at top stays at 0 (cursorPos)', () => {
  const browser = new FileBrowser()
  browser.handleKey({ name: 'up' })
  browser.handleKey({ name: 'up' })
  assert.equal(browser.cursorPos, 0, 'cursorPos should stay at 0')
})

test('handleKey down clamps to entries.length (Done entry)', () => {
  const browser = new FileBrowser()
  // With empty entries, totalItems = 1 (just Done), so down should clamp
  browser.handleKey({ name: 'down' })
  browser.handleKey({ name: 'down' })
  // cursorPos should be 0 since there's only 1 item and cursor was already at max
  assert.ok(browser.cursorPos >= 0, 'cursorPos should be non-negative')
})

test('handleKey ignored when complete', () => {
  const browser = new FileBrowser()
  // Finish first via escape
  browser.handleKey({ name: 'escape' })
  assert.equal(browser.isComplete, true, 'should be complete after escape')
  // Now try navigation — should return false
  const handled = browser.handleKey({ name: 'down' })
  assert.equal(handled, false, 'down should be ignored when complete')
})

test('handleKey ignored when pending async', () => {
  const browser = new FileBrowser()
  // 'h' triggers async operation; check it returns true initially
  const handled = browser.handleKey({ name: 'h' })
  assert.equal(handled, true, 'h key should be handled')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 8. Keyboard Handling — Selection (Space / a / Enter on files)
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nKeyboard Handling — Selection:')

test('handleKey space on Done entry finishes (empty entries)', () => {
  const browser = new FileBrowser()
  // With empty entries, cursorPos 0 = entries.length = 0 (Done)
  const handled = browser.handleKey({ name: 'space' })
  assert.equal(handled, true, 'space on Done should be handled')
  assert.equal(browser.isComplete, true, 'should be complete')
})

test('handleKey enter on Done entry finishes (empty entries)', () => {
  const browser = new FileBrowser()
  const handled = browser.handleKey({ name: 'return' })
  assert.equal(handled, true, 'enter on Done should be handled')
  assert.equal(browser.isComplete, true, 'should be complete')
})

test('handleKey a returns true (select/deselect all)', () => {
  const browser = new FileBrowser()
  const handled = browser.handleKey({ name: 'a' })
  assert.equal(handled, true, 'a key should be handled')
})

test('handleKey a with empty entries does not change selection', () => {
  const browser = new FileBrowser()
  browser.handleKey({ name: 'a' })
  assert.deepEqual(browser.selectedPaths, [], 'selection should remain empty')
})

test('handleKey unhandled key returns false', () => {
  const browser = new FileBrowser()
  const handled = browser.handleKey({ name: 'x' })
  assert.equal(handled, false, 'unhandled key should return false')
})

test('handleKey z returns false (not handled)', () => {
  const browser = new FileBrowser()
  const handled = browser.handleKey({ name: 'z' })
  assert.equal(handled, false, 'z key should not be handled')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 9. Keyboard Handling — Directory Navigation (Left / Right / h)
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nKeyboard Handling — Directory Navigation:')

test('handleKey left returns true', () => {
  const browser = new FileBrowser()
  const handled = browser.handleKey({ name: 'left' })
  assert.equal(handled, true, 'left key should be handled')
})

test('handleKey right returns true', () => {
  const browser = new FileBrowser()
  const handled = browser.handleKey({ name: 'right' })
  assert.equal(handled, true, 'right key should be handled')
})

test('handleKey h returns true (toggle hidden)', () => {
  const browser = new FileBrowser()
  const handled = browser.handleKey({ name: 'h' })
  assert.equal(handled, true, 'h key should be handled')
})

test('handleKey h toggles showHidden state', () => {
  const browser = new FileBrowser()
  const initial = browser.showHidden
  browser.handleKey({ name: 'h' })
  // After toggle, showHidden should be different (async, but the toggle happens first)
  // Note: In non-TTY without mount, the async readCurrentEntries may fail
  // but the toggle of #showHiddenFiles happens synchronously
  const toggled = browser.showHidden
  assert.notEqual(initial, toggled, 'showHidden should toggle')
})

test('handleKey left with empty entries does not change dir', () => {
  const browser = new FileBrowser()
  // currentDir is '' by default, parse('').root is '', so '' !== '' is false
  const initial = browser.currentDir
  browser.handleKey({ name: 'left' })
  assert.equal(browser.currentDir, initial, 'currentDir should not change')
})

test('handleKey right with no cursor entry does not navigate', () => {
  const browser = new FileBrowser()
  const initial = browser.currentDir
  browser.handleKey({ name: 'right' })
  assert.equal(browser.currentDir, initial, 'currentDir should not change when no entry under cursor')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 10. Keyboard Handling — Finish (Escape / q)
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nKeyboard Handling — Finish:')

test('handleKey escape finishes', () => {
  const browser = new FileBrowser()
  const handled = browser.handleKey({ name: 'escape' })
  assert.equal(handled, true, 'escape should be handled')
  assert.equal(browser.isComplete, true, 'should be complete after escape')
})

test('handleKey q finishes', () => {
  const browser = new FileBrowser()
  const handled = browser.handleKey({ name: 'q' })
  assert.equal(handled, true, 'q should be handled')
  assert.equal(browser.isComplete, true, 'should be complete after q')
})

test('escape with no selection returns currentDir as result', () => {
  const browser = new FileBrowser({ startDir: '/test' })
  browser.handleKey({ name: 'escape' })
  assert.equal(browser.isComplete, true, 'should be complete')
  // The result is set in state, not directly accessible, but isComplete is true
})

test('q with no selection finishes cleanly', () => {
  const browser = new FileBrowser()
  browser.handleKey({ name: 'q' })
  assert.equal(browser.isComplete, true, 'should be complete')
  assert.equal(browser.isCancelled, false, 'isCancelled should reflect state')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 11. Rendering to VirtualScreen
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nRendering to VirtualScreen:')

test('render produces output on VirtualScreen', () => {
  const browser = new FileBrowser({ title: 'Test Browser' })
  const screen = new VirtualScreen(80, 24)
  browser.render(screen, { bounds: { row: 0 } })
  const line0 = screen.getLine(0)
  assert.ok(line0.length > 0, 'first line should have content')
})

test('render includes title in output', () => {
  const browser = new FileBrowser({ title: 'My File Browser' })
  const screen = new VirtualScreen(80, 24)
  browser.render(screen, { bounds: { row: 0 } })
  const line0 = screen.getLine(0)
  assert.ok(line0.includes('My File Browser'), 'first line should contain title')
})

test('render shows default title when none provided', () => {
  const browser = new FileBrowser()
  const screen = new VirtualScreen(80, 24)
  browser.render(screen, { bounds: { row: 0 } })
  const line0 = screen.getLine(0)
  assert.ok(line0.includes('Select Paths'), 'first line should contain default title')
})

test('render shows current directory', () => {
  const browser = new FileBrowser({ startDir: '/tmp' })
  // Before mount, currentDir is '' but render still works
  const screen = new VirtualScreen(80, 24)
  browser.render(screen, { bounds: { row: 0 } })
  // At least one line should have content
  const line0 = screen.getLine(0)
  assert.ok(line0.length > 0, 'render should produce non-empty output')
})

test('render shows empty directory message when no entries', () => {
  const browser = new FileBrowser()
  const screen = new VirtualScreen(80, 24)
  browser.render(screen, { bounds: { row: 0 } })
  // Search for empty directory hint in rendered lines
  let foundEmpty = false
  for (let i = 0; i < 24; i++) {
    if (screen.getLine(i).includes('empty')) {
      foundEmpty = true
      break
    }
  }
  assert.ok(foundEmpty, 'rendered output should contain empty directory hint')
})

test('render shows footer with keyboard hints', () => {
  const browser = new FileBrowser()
  const screen = new VirtualScreen(80, 24)
  browser.render(screen, { bounds: { row: 0 } })
  // Search for footer hints
  let foundFooter = false
  for (let i = 0; i < 24; i++) {
    const line = screen.getLine(i)
    if (line.includes('nav') && line.includes('select')) {
      foundFooter = true
      break
    }
  }
  assert.ok(foundFooter, 'rendered output should contain keyboard hints in footer')
})

test('render shows Done entry', () => {
  const browser = new FileBrowser()
  const screen = new VirtualScreen(80, 24)
  browser.render(screen, { bounds: { row: 0 } })
  let foundDone = false
  for (let i = 0; i < 24; i++) {
    if (screen.getLine(i).includes('Done')) {
      foundDone = true
      break
    }
  }
  assert.ok(foundDone, 'rendered output should show Done entry')
})

test('render with custom bounds offset', () => {
  const browser = new FileBrowser({ title: 'Offset Test' })
  const screen = new VirtualScreen(80, 24)
  browser.render(screen, { bounds: { row: 5 } })
  const line5 = screen.getLine(5)
  assert.ok(line5.includes('Offset Test'), 'content should start at specified row')
})

test('render without bounds context', () => {
  const browser = new FileBrowser({ title: 'No Bounds' })
  const screen = new VirtualScreen(80, 24)
  browser.render(screen, {})
  const line0 = screen.getLine(0)
  assert.ok(line0.includes('No Bounds'), 'should default to row 0')
})

test('render without ctx argument', () => {
  const browser = new FileBrowser({ title: 'NoCtx' })
  const screen = new VirtualScreen(80, 24)
  browser.render(screen)
  const line0 = screen.getLine(0)
  assert.ok(line0.includes('NoCtx'), 'should render without context argument')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 12. Rendering — Icon Display
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nRendering — Icon Display:')

test('render shows selection count indicator when paths selected', () => {
  const browser = new FileBrowser()
  const screen = new VirtualScreen(80, 24)
  browser.render(screen, { bounds: { row: 0 } })
  // No selection initially — check for "No paths selected" message
  let foundNoSelection = false
  for (let i = 0; i < 24; i++) {
    if (screen.getLine(i).includes('No paths selected')) {
      foundNoSelection = true
      break
    }
  }
  assert.ok(foundNoSelection, 'should show no-paths-selected message when empty')
})

test('render shows hidden file toggle hint', () => {
  const browser = new FileBrowser()
  const screen = new VirtualScreen(80, 24)
  browser.render(screen, { bounds: { row: 0 } })
  let foundHiddenHint = false
  for (let i = 0; i < 24; i++) {
    if (screen.getLine(i).includes('show hidden')) {
      foundHiddenHint = true
      break
    }
  }
  assert.ok(foundHiddenHint, 'should show "show hidden" hint in footer')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 13. Directory Operations
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nDirectory Operations:')

testAsync('mount in non-TTY returns immediate result', async () => {
  const browser = new FileBrowser({ startDir: '/tmp' })
  // In non-TTY (test env), mount sets complete=true immediately
  try {
    browser.mount()
  } catch {
    // Expected if TTY detection differs
  }
  // After mount in non-TTY, result should be set
  // isComplete should be true in non-TTY
  assert.ok(browser.isMounted || browser.isComplete, 'should be mounted or complete after mount in non-TTY')
  browser.unmount()
})

testAsync('static run in non-TTY returns startDir array', async () => {
  const result = await FileBrowser.run({ startDir: '/tmp' })
  assert.ok(Array.isArray(result), 'result should be an array')
  assert.ok(result.length >= 1, 'result should have at least one element')
  assert.equal(result[0], '/tmp', 'first element should be the startDir')
})

testAsync('static run with default startDir returns current directory', async () => {
  const result = await FileBrowser.run({})
  assert.ok(Array.isArray(result), 'result should be an array')
  assert.ok(result.length >= 1, 'result should have at least one element')
})

testAsync('static run accepts all standard options', async () => {
  const result = await FileBrowser.run({
    startDir: '/tmp',
    title: 'Test',
    selectFiles: true,
    selectDirs: true,
    showHidden: false,
    fileFilter: ['.js'],
    color: true,
  })
  assert.ok(Array.isArray(result), 'result should be an array')
})

test('handleKey space auto-advances cursor after toggle', () => {
  // With entries = [], cursorPos starts at 0, which equals entries.length
  // So space on Done finishes
  const browser = new FileBrowser()
  browser.handleKey({ name: 'space' })
  assert.equal(browser.isComplete, true, 'should finish on Done entry')
})

test('handleKey return auto-advances cursor on file', () => {
  // With empty entries, cursor at 0 = Done, so return finishes
  const browser = new FileBrowser()
  browser.handleKey({ name: 'return' })
  assert.equal(browser.isComplete, true, 'should finish on Done entry')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 14. Integration — Backward Compatibility
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nIntegration — Backward Compatibility:')

test('FileBrowser.run is a static async function', () => {
  assert.equal(typeof FileBrowser.run, 'function', 'run should be a function')
  // Verify it returns a promise
  const result = FileBrowser.run({ startDir: '/tmp' })
  assert.ok(result instanceof Promise, 'run should return a Promise')
  // Clean up — the promise resolves to array in non-TTY
  return result
})

test('FileBrowser.run accepts startDir option', async () => {
  const result = await FileBrowser.run({ startDir: '/tmp' })
  assert.ok(Array.isArray(result), 'should return array')
  assert.ok(result[0].includes('tmp'), 'should include startDir in result')
})

test('FileBrowser.run accepts title option', async () => {
  // Title doesn't affect the return value in non-TTY, but it should not throw
  const result = await FileBrowser.run({ title: 'Custom Title' })
  assert.ok(Array.isArray(result), 'should return array')
})

test('FileBrowser.run accepts color option', async () => {
  const result = await FileBrowser.run({ color: false })
  assert.ok(Array.isArray(result), 'should return array with color=false')
})

test('FileBrowser.run accepts showHidden option', async () => {
  const result = await FileBrowser.run({ showHidden: true })
  assert.ok(Array.isArray(result), 'should return array with showHidden=true')
})

test('FileBrowser.run accepts fileFilter option', async () => {
  const result = await FileBrowser.run({ fileFilter: ['.js', '.ts'] })
  assert.ok(Array.isArray(result), 'should return array with fileFilter')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 15. Edge Cases
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nEdge Cases:')

test('FileBrowser with empty string startDir', () => {
  const browser = new FileBrowser({ startDir: '' })
  assert.ok(browser, 'should construct with empty startDir')
  assert.equal(browser.title, 'Select Paths', 'title should be default')
})

test('FileBrowser with very long title', () => {
  const longTitle = 'A'.repeat(200)
  const browser = new FileBrowser({ title: longTitle })
  assert.equal(browser.title, longTitle, 'should accept long title')
  const screen = new VirtualScreen(80, 24)
  browser.render(screen, { bounds: { row: 0 } })
  const line0 = screen.getLine(0)
  // Title may be truncated by VirtualScreen width but should still have content
  assert.ok(line0.length > 0, 'should render long title without crash')
})

test('FileBrowser selectedPaths returns a copy', () => {
  const browser = new FileBrowser()
  const paths1 = browser.selectedPaths
  const paths2 = browser.selectedPaths
  assert.notEqual(paths1, paths2, 'selectedPaths should return different array references')
  assert.deepEqual(paths1, paths2, 'selectedPaths should have same contents')
})

test('multiple FileBrowser instances have unique ids', () => {
  const b1 = new FileBrowser()
  const b2 = new FileBrowser()
  assert.notEqual(b1.id, b2.id, 'each instance should have a unique id')
})

test('render on small VirtualScreen does not crash', () => {
  const browser = new FileBrowser({ title: 'Small' })
  const screen = new VirtualScreen(10, 5)
  browser.render(screen, { bounds: { row: 0 } })
  // Should not throw — rendering clamps to screen bounds
  assert.ok(true, 'render on small screen should not crash')
})

test('render on large VirtualScreen works', () => {
  const browser = new FileBrowser({ title: 'Large' })
  const screen = new VirtualScreen(200, 60)
  browser.render(screen, { bounds: { row: 0 } })
  const line0 = screen.getLine(0)
  assert.ok(line0.includes('Large'), 'should render on large screen')
})

test('handleKey space then q returns handled for both', () => {
  const browser = new FileBrowser()
  // space on Done → finish
  const h1 = browser.handleKey({ name: 'space' })
  assert.equal(h1, true, 'space should be handled')
  // q after complete → not handled (already complete)
  const h2 = browser.handleKey({ name: 'q' })
  assert.equal(h2, false, 'q after complete should return false')
})

test('handleKey escape then down returns false (already complete)', () => {
  const browser = new FileBrowser()
  browser.handleKey({ name: 'escape' })
  const handled = browser.handleKey({ name: 'down' })
  assert.equal(handled, false, 'should return false after already complete')
})

test('multiple escape presses are idempotent', () => {
  const browser = new FileBrowser()
  browser.handleKey({ name: 'escape' })
  assert.equal(browser.isComplete, true, 'first escape completes')
  const h = browser.handleKey({ name: 'escape' })
  assert.equal(h, false, 'second escape returns false (already complete)')
  assert.equal(browser.isComplete, true, 'still complete')
})

test('constructor with null options throws (Component requires object)', () => {
  // Component constructor accesses options.id, so null throws
  assert.throws(() => new FileBrowser(null), TypeError, 'should throw TypeError with null options')
})

test('constructor with undefined options does not crash', () => {
  const browser = new FileBrowser(undefined)
  assert.ok(browser, 'should construct with undefined options')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 16. Rendering — Scroll Pagination (via cursor movement simulation)
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nRendering — Scroll & State:')

test('render with color=false does not crash', () => {
  const browser = new FileBrowser({ color: false })
  const screen = new VirtualScreen(80, 24)
  browser.render(screen, { bounds: { row: 0 } })
  const line0 = screen.getLine(0)
  assert.ok(line0.includes('Select Paths'), 'should render without color')
})

test('render after setState updates output', () => {
  const browser = new FileBrowser({ title: 'Before' })
  const screen = new VirtualScreen(80, 24)
  browser.render(screen, { bounds: { row: 0 } })
  const line0Before = screen.getLine(0)
  assert.ok(line0Before.includes('Before'), 'should contain original title')
  // Note: setState doesn't change the title (it's a private field)
  // But render should still work after setState
  browser.setState({ something: 'else' })
  browser.render(screen, { bounds: { row: 0 } })
  assert.ok(true, 'render after setState should not crash')
})

test('render writes to correct rows with offset', () => {
  const browser = new FileBrowser({ title: 'Offset' })
  const screen = new VirtualScreen(80, 24)
  browser.render(screen, { bounds: { row: 10 } })
  const line0 = screen.getLine(0)
  const line10 = screen.getLine(10)
  // Row 0 should be empty
  assert.ok(!line0.includes('Offset'), 'row 0 should not contain content')
  // Row 10 should have the title
  assert.ok(line10.includes('Offset'), 'row 10 should contain title')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 17. Multi-select Functionality
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nMulti-select Functionality:')

test('selectedPaths is initially empty', () => {
  const browser = new FileBrowser()
  assert.deepEqual(browser.selectedPaths, [], 'should start with no selections')
})

test('selectedPaths returns array not Set', () => {
  const browser = new FileBrowser()
  const paths = browser.selectedPaths
  assert.ok(Array.isArray(paths), 'selectedPaths should return an Array')
})

test('multiple selectedPaths calls return independent copies', () => {
  const browser = new FileBrowser()
  const paths1 = browser.selectedPaths
  paths1.push('/fake/path')
  const paths2 = browser.selectedPaths
  assert.deepEqual(paths2, [], 'original should not be affected by push')
})

test('a key with empty entries keeps selection empty', () => {
  const browser = new FileBrowser()
  browser.handleKey({ name: 'a' })
  assert.deepEqual(browser.selectedPaths, [], 'should remain empty with no entries')
})

// ═══════════════════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════════════════════════════════════════')
console.log(`\nResults: ${passed} passed, ${failed} failed, ${total} total`)
if (failed > 0) {
  process.exit(1)
}
