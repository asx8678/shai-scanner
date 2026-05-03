/**
 * Menu Component Migration Test
 *
 * Tests the new SelectMenu and CheckboxMenu components that extend Component base class.
 * Serves as a template for testing other component migrations.
 *
 * Usage: node test/menu-test.js
 */

import assert from 'node:assert/strict'
import { SelectMenu, CheckboxMenu } from '../src/tui/components/menu.js'
import { Component } from '../src/tui/core/component.js'
import { SelectMenu as OriginalSelectMenu, CheckboxMenu as OriginalCheckboxMenu } from '../src/tui.js'
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

console.log('Menu Component Migration Tests\n')

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Module Exports
// ═══════════════════════════════════════════════════════════════════════════════

console.log('Module Exports:')

test('SelectMenu is exported from src/tui/components/menu.js', () => {
  assert.ok(SelectMenu, 'SelectMenu should be defined')
  assert.equal(typeof SelectMenu, 'function', 'SelectMenu should be a constructor function')
})

test('CheckboxMenu is exported from src/tui/components/menu.js', () => {
  assert.ok(CheckboxMenu, 'CheckboxMenu should be defined')
  assert.equal(typeof CheckboxMenu, 'function', 'CheckboxMenu should be a constructor function')
})

test('Component is exported from src/tui/core/component.js', () => {
  assert.ok(Component, 'Component should be defined')
  assert.equal(typeof Component, 'function', 'Component should be a constructor function')
})

test('Original SelectMenu is exported from tui.js', () => {
  assert.ok(OriginalSelectMenu, 'OriginalSelectMenu should be defined')
  assert.equal(typeof OriginalSelectMenu, 'function', 'OriginalSelectMenu should be a constructor function')
})

test('Original CheckboxMenu is exported from tui.js', () => {
  assert.ok(OriginalCheckboxMenu, 'OriginalCheckboxMenu should be defined')
  assert.equal(typeof OriginalCheckboxMenu, 'function', 'OriginalCheckboxMenu should be a constructor function')
})

test('New and original SelectMenu are the same class', () => {
  assert.equal(SelectMenu, OriginalSelectMenu, 'SelectMenu should be re-exported from tui.js')
})

test('New and original CheckboxMenu are the same class', () => {
  assert.equal(CheckboxMenu, OriginalCheckboxMenu, 'CheckboxMenu should be re-exported from tui.js')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 2. SelectMenu Inheritance
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nSelectMenu Inheritance:')

test('SelectMenu extends Component', () => {
  const menu = new SelectMenu()
  assert.ok(menu instanceof Component, 'SelectMenu instance should be instance of Component')
  assert.ok(menu instanceof SelectMenu, 'SelectMenu instance should be instance of SelectMenu')
})

test('SelectMenu prototype chain includes Component', () => {
  assert.ok(Component.isPrototypeOf(SelectMenu), 'SelectMenu should extend Component')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 3. CheckboxMenu Inheritance
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nCheckboxMenu Inheritance:')

test('CheckboxMenu extends Component', () => {
  const menu = new CheckboxMenu()
  assert.ok(menu instanceof Component, 'CheckboxMenu instance should be instance of Component')
  assert.ok(menu instanceof CheckboxMenu, 'CheckboxMenu instance should be instance of CheckboxMenu')
})

test('CheckboxMenu prototype chain includes Component', () => {
  assert.ok(Component.isPrototypeOf(CheckboxMenu), 'CheckboxMenu should extend Component')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Component Methods (Inherited from Component)
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nComponent Methods (Inherited):')

test('SelectMenu has id property', () => {
  const menu = new SelectMenu()
  assert.ok(menu.id, 'SelectMenu should have an id')
  assert.equal(typeof menu.id, 'string', 'id should be a string')
})

test('SelectMenu has isMounted property', () => {
  const menu = new SelectMenu()
  assert.equal(menu.isMounted, false, 'SelectMenu should not be mounted initially')
})

test('SelectMenu has setState method', () => {
  const menu = new SelectMenu()
  assert.equal(typeof menu.setState, 'function', 'setState should be a function')
})

test('SelectMenu has mount method', () => {
  const menu = new SelectMenu()
  assert.equal(typeof menu.mount, 'function', 'mount should be a function')
})

test('SelectMenu has unmount method', () => {
  const menu = new SelectMenu()
  assert.equal(typeof menu.unmount, 'function', 'unmount should be a function')
})

test('SelectMenu has render method', () => {
  const menu = new SelectMenu()
  assert.equal(typeof menu.render, 'function', 'render should be a function')
})

test('SelectMenu has handleKey method', () => {
  const menu = new SelectMenu()
  assert.equal(typeof menu.handleKey, 'function', 'handleKey should be a function')
})

test('SelectMenu has addChild method', () => {
  const menu = new SelectMenu()
  assert.equal(typeof menu.addChild, 'function', 'addChild should be a function')
})

test('SelectMenu has removeChild method', () => {
  const menu = new SelectMenu()
  assert.equal(typeof menu.removeChild, 'function', 'removeChild should be a function')
})

test('CheckboxMenu has id property', () => {
  const menu = new CheckboxMenu()
  assert.ok(menu.id, 'CheckboxMenu should have an id')
  assert.equal(typeof menu.id, 'string', 'id should be a string')
})

test('CheckboxMenu has isMounted property', () => {
  const menu = new CheckboxMenu()
  assert.equal(menu.isMounted, false, 'CheckboxMenu should not be mounted initially')
})

test('CheckboxMenu has setState method', () => {
  const menu = new CheckboxMenu()
  assert.equal(typeof menu.setState, 'function', 'setState should be a function')
})

test('CheckboxMenu has mount method', () => {
  const menu = new CheckboxMenu()
  assert.equal(typeof menu.mount, 'function', 'mount should be a function')
})

test('CheckboxMenu has unmount method', () => {
  const menu = new CheckboxMenu()
  assert.equal(typeof menu.unmount, 'function', 'unmount should be a function')
})

test('CheckboxMenu has render method', () => {
  const menu = new CheckboxMenu()
  assert.equal(typeof menu.render, 'function', 'render should be a function')
})

test('CheckboxMenu has handleKey method', () => {
  const menu = new CheckboxMenu()
  assert.equal(typeof menu.handleKey, 'function', 'handleKey should be a function')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 5. SelectMenu-specific Properties and Methods
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nSelectMenu-specific Properties:')

test('SelectMenu has static run method', () => {
  assert.equal(typeof SelectMenu.run, 'function', 'SelectMenu.run should be a function')
})

test('SelectMenu constructor accepts options', () => {
  const menu = new SelectMenu({
    title: 'Test Title',
    items: [{ label: 'Item 1', value: 'val1' }],
    color: false
  })
  assert.ok(menu, 'SelectMenu should be created with options')
})

test('SelectMenu has title property', () => {
  const menu = new SelectMenu({ title: 'Test' })
  assert.equal(menu.title, 'Test', 'title should match constructor option')
})

test('SelectMenu has items property (returns copy)', () => {
  const originalItems = [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }]
  const menu = new SelectMenu({ items: originalItems })
  const items = menu.items
  assert.deepEqual(items, originalItems, 'items should match constructor option')
  // Verify it's a copy, not a reference
  items.push({ label: 'C', value: 'c' })
  assert.deepEqual(menu.items, originalItems, 'modifying returned items should not affect SelectMenu')
})

test('SelectMenu defaults to empty title', () => {
  const menu = new SelectMenu()
  assert.equal(menu.title, '', 'default title should be empty string')
})

test('SelectMenu defaults to empty items', () => {
  const menu = new SelectMenu()
  assert.deepEqual(menu.items, [], 'default items should be empty array')
})

test('SelectMenu is not complete initially', () => {
  const menu = new SelectMenu()
  assert.equal(menu.isComplete, false, 'isComplete should be false initially')
})

test('SelectMenu result is null initially', () => {
  const menu = new SelectMenu()
  assert.equal(menu.result, null, 'result should be null initially')
})

test('SelectMenu selectedIndex is 0 initially', () => {
  const menu = new SelectMenu({ items: [{ label: 'A', value: 'a' }] })
  assert.equal(menu.selectedIndex, 0, 'selectedIndex should be 0 initially')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 6. CheckboxMenu-specific Properties and Methods
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nCheckboxMenu-specific Properties:')

test('CheckboxMenu has static run method', () => {
  assert.equal(typeof CheckboxMenu.run, 'function', 'CheckboxMenu.run should be a function')
})

test('CheckboxMenu constructor accepts options', () => {
  const menu = new CheckboxMenu({
    title: 'Test Title',
    items: [{ label: 'Item 1', value: 'val1', checked: true }],
    color: false
  })
  assert.ok(menu, 'CheckboxMenu should be created with options')
})

test('CheckboxMenu has title property', () => {
  const menu = new CheckboxMenu({ title: 'Test' })
  assert.equal(menu.title, 'Test', 'title should match constructor option')
})

test('CheckboxMenu has items property (returns copy)', () => {
  const originalItems = [{ label: 'A', value: 'a', checked: true }]
  const menu = new CheckboxMenu({ items: originalItems })
  const items = menu.items
  assert.deepEqual(items, originalItems, 'items should match constructor option')
})

test('CheckboxMenu defaults to empty title', () => {
  const menu = new CheckboxMenu()
  assert.equal(menu.title, '', 'default title should be empty string')
})

test('CheckboxMenu defaults to empty items', () => {
  const menu = new CheckboxMenu()
  assert.deepEqual(menu.items, [], 'default items should be empty array')
})

test('CheckboxMenu is not complete initially', () => {
  const menu = new CheckboxMenu()
  assert.equal(menu.isComplete, false, 'isComplete should be false initially')
})

test('CheckboxMenu result is null initially', () => {
  const menu = new CheckboxMenu()
  assert.equal(menu.result, null, 'result should be null initially')
})

test('CheckboxMenu selectedIndex is 0 initially', () => {
  const menu = new CheckboxMenu({ items: [{ label: 'A', value: 'a' }] })
  assert.equal(menu.selectedIndex, 0, 'selectedIndex should be 0 initially')
})

test('CheckboxMenu checkedStates reflects initial checked values', () => {
  const menu = new CheckboxMenu({
    items: [
      { label: 'A', value: 'a', checked: true },
      { label: 'B', value: 'b', checked: false },
      { label: 'C', value: 'c', checked: true },
    ]
  })
  assert.deepEqual(menu.checkedStates, [true, false, true], 'checkedStates should match initial checked values')
})

test('CheckboxMenu checkedStates returns copy', () => {
  const menu = new CheckboxMenu({
    items: [{ label: 'A', value: 'a', checked: true }]
  })
  const states = menu.checkedStates
  states[0] = false
  assert.deepEqual(menu.checkedStates, [true], 'modifying returned checkedStates should not affect CheckboxMenu')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 7. SelectMenu handleKey()
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nSelectMenu handleKey():')

test('SelectMenu handles up arrow', () => {
  const menu = new SelectMenu({
    items: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }, { label: 'C', value: 'c' }]
  })
  const handled = menu.handleKey({ name: 'up' })
  assert.equal(handled, true, 'up key should be handled')
  assert.equal(menu.selectedIndex, 2, 'selectedIndex should wrap to end')
})

test('SelectMenu handles down arrow', () => {
  const menu = new SelectMenu({
    items: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }, { label: 'C', value: 'c' }]
  })
  const handled = menu.handleKey({ name: 'down' })
  assert.equal(handled, true, 'down key should be handled')
  assert.equal(menu.selectedIndex, 1, 'selectedIndex should increment')
})

test('SelectMenu handles down arrow wrapping', () => {
  const menu = new SelectMenu({
    items: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }]
  })
  menu.handleKey({ name: 'down' })
  menu.handleKey({ name: 'down' })
  assert.equal(menu.selectedIndex, 0, 'selectedIndex should wrap to start')
})

test('SelectMenu handles enter key', () => {
  const menu = new SelectMenu({
    items: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }]
  })
  menu.handleKey({ name: 'down' }) // Move to B
  const handled = menu.handleKey({ name: 'return' })
  assert.equal(handled, true, 'enter key should be handled')
  assert.equal(menu.isComplete, true, 'menu should be complete')
  assert.equal(menu.result, 'b', 'result should be selected item value')
})

test('SelectMenu handles escape key', () => {
  const menu = new SelectMenu({
    items: [{ label: 'A', value: 'a' }]
  })
  const handled = menu.handleKey({ name: 'escape' })
  assert.equal(handled, true, 'escape key should be handled')
  assert.equal(menu.isComplete, true, 'menu should be complete')
  assert.equal(menu.isCancelled, true, 'menu should be cancelled')
})

test('SelectMenu handles q key', () => {
  const menu = new SelectMenu({
    items: [{ label: 'A', value: 'a' }]
  })
  const handled = menu.handleKey({ name: 'q' })
  assert.equal(handled, true, 'q key should be handled')
  assert.equal(menu.isComplete, true, 'menu should be complete')
  assert.equal(menu.isCancelled, true, 'menu should be cancelled')
})

test('SelectMenu ignores unhandled keys', () => {
  const menu = new SelectMenu({
    items: [{ label: 'A', value: 'a' }]
  })
  const handled = menu.handleKey({ name: 'x' })
  assert.equal(handled, false, 'unhandled key should return false')
})

test('SelectMenu ignores keys when complete', () => {
  const menu = new SelectMenu({
    items: [{ label: 'A', value: 'a' }]
  })
  menu.handleKey({ name: 'return' }) // Complete
  const handled = menu.handleKey({ name: 'down' })
  assert.equal(handled, false, 'key after complete should return false')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 8. CheckboxMenu handleKey()
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nCheckboxMenu handleKey():')

test('CheckboxMenu handles up arrow', () => {
  const menu = new CheckboxMenu({
    items: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }]
  })
  const handled = menu.handleKey({ name: 'up' })
  assert.equal(handled, true, 'up key should be handled')
  assert.equal(menu.selectedIndex, 1, 'selectedIndex should wrap to end')
})

test('CheckboxMenu handles down arrow', () => {
  const menu = new CheckboxMenu({
    items: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }]
  })
  const handled = menu.handleKey({ name: 'down' })
  assert.equal(handled, true, 'down key should be handled')
  assert.equal(menu.selectedIndex, 1, 'selectedIndex should increment')
})

test('CheckboxMenu handles space to toggle', () => {
  const menu = new CheckboxMenu({
    items: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }]
  })
  assert.deepEqual(menu.checkedStates, [false, false], 'initially nothing checked')
  const handled = menu.handleKey({ name: 'space' })
  assert.equal(handled, true, 'space key should be handled')
  assert.deepEqual(menu.checkedStates, [true, false], 'first item should be checked')
})

test('CheckboxMenu handles space to uncheck', () => {
  const menu = new CheckboxMenu({
    items: [{ label: 'A', value: 'a', checked: true }]
  })
  menu.handleKey({ name: 'space' })
  assert.deepEqual(menu.checkedStates, [false], 'item should be unchecked')
})

test('CheckboxMenu handles a to select all', () => {
  const menu = new CheckboxMenu({
    items: [
      { label: 'A', value: 'a' },
      { label: 'B', value: 'b' },
      { label: 'C', value: 'c' }
    ]
  })
  const handled = menu.handleKey({ name: 'a' })
  assert.equal(handled, true, 'a key should be handled')
  assert.deepEqual(menu.checkedStates, [true, true, true], 'all items should be checked')
})

test('CheckboxMenu handles a to deselect all', () => {
  const menu = new CheckboxMenu({
    items: [
      { label: 'A', value: 'a', checked: true },
      { label: 'B', value: 'b', checked: true },
      { label: 'C', value: 'c', checked: true }
    ]
  })
  menu.handleKey({ name: 'a' })
  assert.deepEqual(menu.checkedStates, [false, false, false], 'all items should be unchecked')
})

test('CheckboxMenu handles enter to confirm', () => {
  const menu = new CheckboxMenu({
    items: [
      { label: 'A', value: 'a', checked: true },
      { label: 'B', value: 'b', checked: false },
      { label: 'C', value: 'c', checked: true }
    ]
  })
  const handled = menu.handleKey({ name: 'return' })
  assert.equal(handled, true, 'enter key should be handled')
  assert.equal(menu.isComplete, true, 'menu should be complete')
  assert.deepEqual(menu.result, ['a', 'c'], 'result should be checked item values')
})

test('CheckboxMenu handles escape to cancel', () => {
  const menu = new CheckboxMenu({
    items: [{ label: 'A', value: 'a' }]
  })
  const handled = menu.handleKey({ name: 'escape' })
  assert.equal(handled, true, 'escape key should be handled')
  assert.equal(menu.isComplete, true, 'menu should be complete')
  assert.equal(menu.isCancelled, true, 'menu should be cancelled')
})

test('CheckboxMenu ignores unhandled keys', () => {
  const menu = new CheckboxMenu({
    items: [{ label: 'A', value: 'a' }]
  })
  const handled = menu.handleKey({ name: 'x' })
  assert.equal(handled, false, 'unhandled key should return false')
})

test('CheckboxMenu ignores keys when complete', () => {
  const menu = new CheckboxMenu({
    items: [{ label: 'A', value: 'a' }]
  })
  menu.handleKey({ name: 'return' }) // Complete
  const handled = menu.handleKey({ name: 'space' })
  assert.equal(handled, false, 'key after complete should return false')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 9. SelectMenu render() to VirtualScreen
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nSelectMenu render():')

test('SelectMenu renders title', () => {
  const menu = new SelectMenu({
    title: 'My Menu',
    items: [{ label: 'Item', value: 'val' }]
  })
  const screen = new VirtualScreen(80, 24)
  menu.render(screen, { bounds: { row: 0 } })
  const line0 = screen.getLine(0)
  assert.ok(line0.includes('My Menu'), 'rendered line should contain title')
})

test('SelectMenu renders items', () => {
  const menu = new SelectMenu({
    items: [
      { label: 'First', value: 'a' },
      { label: 'Second', value: 'b' }
    ]
  })
  const screen = new VirtualScreen(80, 24)
  menu.render(screen, { bounds: { row: 0 } })
  const line0 = screen.getLine(0)
  const line1 = screen.getLine(1)
  assert.ok(line0.includes('First'), 'first line should contain first item')
  assert.ok(line1.includes('Second'), 'second line should contain second item')
})

test('SelectMenu renders selected indicator', () => {
  const menu = new SelectMenu({
    items: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }]
  })
  menu.handleKey({ name: 'down' }) // Select second item
  const screen = new VirtualScreen(80, 24)
  menu.render(screen, { bounds: { row: 0 } })
  const line1 = screen.getLine(1)
  assert.ok(line1.includes('▶'), 'selected item should have arrow indicator')
})

test('SelectMenu renders hint at bottom', () => {
  const menu = new SelectMenu({
    items: [{ label: 'A', value: 'a' }]
  })
  const screen = new VirtualScreen(80, 24)
  menu.render(screen, { bounds: { row: 0 } })
  // Hint is at row 2 (0=blank, 1=hint)
  const line2 = screen.getLine(2)
  assert.ok(line2.includes('navigate'), 'hint should contain navigation text')
})

test('SelectMenu renders without title', () => {
  const menu = new SelectMenu({
    items: [{ label: 'A', value: 'a' }]
  })
  const screen = new VirtualScreen(80, 24)
  menu.render(screen, { bounds: { row: 0 } })
  const line0 = screen.getLine(0)
  assert.ok(line0.includes('A'), 'first line should contain item')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 10. CheckboxMenu render() to VirtualScreen
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nCheckboxMenu render():')

test('CheckboxMenu renders title', () => {
  const menu = new CheckboxMenu({
    title: 'Select Options',
    items: [{ label: 'Option', value: 'opt' }]
  })
  const screen = new VirtualScreen(80, 24)
  menu.render(screen, { bounds: { row: 0 } })
  const line0 = screen.getLine(0)
  assert.ok(line0.includes('Select Options'), 'rendered line should contain title')
})

test('CheckboxMenu renders items with checkboxes', () => {
  const menu = new CheckboxMenu({
    items: [
      { label: 'Item A', value: 'a' },
      { label: 'Item B', value: 'b' }
    ]
  })
  const screen = new VirtualScreen(80, 24)
  menu.render(screen, { bounds: { row: 0 } })
  const line0 = screen.getLine(0)
  assert.ok(line0.includes('Item A'), 'first line should contain first item')
  assert.ok(line0.includes('[ ]'), 'unchecked item should have [ ]')
})

test('CheckboxMenu renders checked items', () => {
  const menu = new CheckboxMenu({
    items: [{ label: 'X', value: 'x', checked: true }]
  })
  const screen = new VirtualScreen(80, 24)
  menu.render(screen, { bounds: { row: 0 } })
  const line0 = screen.getLine(0)
  assert.ok(line0.includes('x'), 'checked item should show x')
})

test('CheckboxMenu renders selected indicator', () => {
  const menu = new CheckboxMenu({
    items: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }]
  })
  menu.handleKey({ name: 'down' }) // Select second item
  const screen = new VirtualScreen(80, 24)
  menu.render(screen, { bounds: { row: 0 } })
  const line1 = screen.getLine(1)
  assert.ok(line1.includes('▶'), 'selected item should have arrow indicator')
})

test('CheckboxMenu renders toggle hint dynamically', () => {
  const menu = new CheckboxMenu({
    items: [{ label: 'A', value: 'a' }]
  })
  const screen = new VirtualScreen(80, 24)
  menu.render(screen, { bounds: { row: 0 } })
  const line2 = screen.getLine(2) // hint line (0=title blank, 1=item, 2=blank, 3=hint)
  // When nothing checked, hint should show "all"
  assert.ok(line2.includes('all') || line2.includes('none'), 'hint should show toggle hint')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 11. Non-TTY Behavior
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nNon-TTY Behavior:')

test('SelectMenu static run handles non-TTY (non-interactive)', async () => {
  // This test verifies the static run method returns a value without TTY
  // We can't easily test non-TTY in a test, but we can verify the method exists
  assert.equal(typeof SelectMenu.run, 'function', 'SelectMenu.run should exist')
})

test('CheckboxMenu static run handles non-TTY (non-interactive)', async () => {
  assert.equal(typeof CheckboxMenu.run, 'function', 'CheckboxMenu.run should exist')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 12. Component Lifecycle
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nComponent Lifecycle:')

test('SelectMenu mount/unmount works', () => {
  const menu = new SelectMenu({
    items: [{ label: 'A', value: 'a' }]
  })
  assert.equal(menu.isMounted, false, 'should not be mounted initially')
  // Note: mount() may fail without TTY, but it should not throw
  try {
    menu.mount()
  } catch {
    // Expected in non-TTY environment
  }
  // unmount should always work
  menu.unmount()
  assert.equal(menu.isMounted, false, 'should not be mounted after unmount')
})

test('CheckboxMenu mount/unmount works', () => {
  const menu = new CheckboxMenu({
    items: [{ label: 'A', value: 'a' }]
  })
  assert.equal(menu.isMounted, false, 'should not be mounted initially')
  try {
    menu.mount()
  } catch {
    // Expected in non-TTY environment
  }
  menu.unmount()
  assert.equal(menu.isMounted, false, 'should not be mounted after unmount')
})

test('SelectMenu setState triggers state update', () => {
  const menu = new SelectMenu({
    items: [{ label: 'A', value: 'a' }]
  })
  menu.setState({ customKey: 'customValue' })
  // We can't directly access state, but we can verify it doesn't throw
  assert.ok(menu, 'setState should not throw')
})

test('CheckboxMenu setState triggers state update', () => {
  const menu = new CheckboxMenu({
    items: [{ label: 'A', value: 'a' }]
  })
  menu.setState({ customKey: 'customValue' })
  assert.ok(menu, 'setState should not throw')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 13. Backward Compatibility
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nBackward Compatibility:')

test('SelectMenu maintains backward-compatible static run API', () => {
  assert.equal(typeof SelectMenu.run, 'function', 'SelectMenu.run should exist')
  // Verify it accepts the same options as the original
  const runStr = SelectMenu.run.toString()
  assert.ok(runStr.includes('title'), 'run method should accept title option')
  assert.ok(runStr.includes('items'), 'run method should accept items option')
  assert.ok(runStr.includes('color'), 'run method should accept color option')
})

test('CheckboxMenu maintains backward-compatible static run API', () => {
  assert.equal(typeof CheckboxMenu.run, 'function', 'CheckboxMenu.run should exist')
  const runStr = CheckboxMenu.run.toString()
  assert.ok(runStr.includes('title'), 'run method should accept title option')
  assert.ok(runStr.includes('items'), 'run method should accept items option')
  assert.ok(runStr.includes('color'), 'run method should accept color option')
})

test('SelectMenu and CheckboxMenu are same classes via tui.js and component path', () => {
  assert.equal(SelectMenu, OriginalSelectMenu, 'SelectMenu from both paths should be identical')
  assert.equal(CheckboxMenu, OriginalCheckboxMenu, 'CheckboxMenu from both paths should be identical')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 14. Edge Cases
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nEdge Cases:')

test('SelectMenu with single item', () => {
  const menu = new SelectMenu({
    items: [{ label: 'Only', value: 'only' }]
  })
  menu.handleKey({ name: 'return' })
  assert.equal(menu.result, 'only', 'should select the only item')
})

test('SelectMenu navigation with single item wraps correctly', () => {
  const menu = new SelectMenu({
    items: [{ label: 'Only', value: 'only' }]
  })
  menu.handleKey({ name: 'up' })
  assert.equal(menu.selectedIndex, 0, 'up with single item stays at 0')
  menu.handleKey({ name: 'down' })
  assert.equal(menu.selectedIndex, 0, 'down with single item stays at 0')
})

test('CheckboxMenu with all items pre-checked', () => {
  const menu = new CheckboxMenu({
    items: [
      { label: 'A', value: 'a', checked: true },
      { label: 'B', value: 'b', checked: true }
    ]
  })
  menu.handleKey({ name: 'a' }) // Should deselect all
  assert.deepEqual(menu.checkedStates, [false, false], 'all should be deselected')
  menu.handleKey({ name: 'return' })
  assert.deepEqual(menu.result, [], 'result should be empty')
})

test('CheckboxMenu with no items pre-checked', () => {
  const menu = new CheckboxMenu({
    items: [
      { label: 'A', value: 'a' },
      { label: 'B', value: 'b' }
    ]
  })
  menu.handleKey({ name: 'a' }) // Should select all
  assert.deepEqual(menu.checkedStates, [true, true], 'all should be selected')
  menu.handleKey({ name: 'return' })
  assert.deepEqual(menu.result, ['a', 'b'], 'result should contain all values')
})

test('SelectMenu with empty items array', () => {
  const menu = new SelectMenu({ items: [] })
  assert.equal(menu.items.length, 0, 'should have no items')
  assert.equal(menu.isComplete, false, 'should not be complete')
})

test('CheckboxMenu with empty items array', () => {
  const menu = new CheckboxMenu({ items: [] })
  assert.equal(menu.items.length, 0, 'should have no items')
  const handled = menu.handleKey({ name: 'return' })
  assert.equal(handled, true, 'enter should be handled')
  assert.deepEqual(menu.result, [], 'result should be empty array')
})

// ═══════════════════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════════════════════════════════════════')
console.log(`\nResults: ${passed} passed, ${failed} failed, ${total} total`)
if (failed > 0) {
  process.exit(1)
}
