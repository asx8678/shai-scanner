/**
 * TextInput Component Migration Test
 *
 * Tests the new TextInput component that extends Component base class.
 * Serves as a template for testing other component migrations.
 *
 * Usage: node test/input-test.js
 */

import assert from 'node:assert/strict'
import { TextInput, Confirm, confirm } from '../src/tui/components/input.js'
import { Component } from '../src/tui/core/component.js'

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

console.log('TextInput Component Migration Tests\n')

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Module Exports
// ═══════════════════════════════════════════════════════════════════════════════

console.log('Module Exports:')

test('TextInput is exported from src/tui/components/input.js', () => {
  assert.ok(TextInput, 'TextInput should be defined')
  assert.equal(typeof TextInput, 'function', 'TextInput should be a constructor function')
})

test('Confirm is exported from src/tui/components/input.js', () => {
  assert.ok(Confirm, 'Confirm should be defined')
  assert.equal(typeof Confirm, 'function', 'Confirm should be a constructor function')
})

test('confirm function is exported from src/tui/components/input.js', () => {
  assert.ok(confirm, 'confirm should be defined')
  assert.equal(typeof confirm, 'function', 'confirm should be a function')
})

test('Component is exported from src/tui/core/component.js', () => {
  assert.ok(Component, 'Component should be defined')
  assert.equal(typeof Component, 'function', 'Component should be a constructor function')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 2. TextInput Inheritance
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nTextInput Inheritance:')

test('TextInput extends Component', () => {
  const input = new TextInput()
  assert.ok(input instanceof Component, 'TextInput instance should be instance of Component')
  assert.ok(input instanceof TextInput, 'TextInput instance should be instance of TextInput')
})

test('TextInput prototype chain includes Component', () => {
  assert.ok(Component.isPrototypeOf(TextInput), 'TextInput should extend Component')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 3. TextInput Component Methods (Inherited from Component)
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nTextInput Component Methods (Inherited):')

test('TextInput has id property', () => {
  const input = new TextInput()
  assert.ok(input.id, 'TextInput should have an id')
  assert.equal(typeof input.id, 'string', 'id should be a string')
})

test('TextInput has isMounted property', () => {
  const input = new TextInput()
  assert.equal(input.isMounted, false, 'TextInput should not be mounted initially')
})

test('TextInput has setState method', () => {
  const input = new TextInput()
  assert.equal(typeof input.setState, 'function', 'setState should be a function')
})

test('TextInput has mount method', () => {
  const input = new TextInput()
  assert.equal(typeof input.mount, 'function', 'mount should be a function')
})

test('TextInput has unmount method', () => {
  const input = new TextInput()
  assert.equal(typeof input.unmount, 'function', 'unmount should be a function')
})

test('TextInput has render method', () => {
  const input = new TextInput()
  assert.equal(typeof input.render, 'function', 'render should be a function')
})

test('TextInput has handleKey method', () => {
  const input = new TextInput()
  assert.equal(typeof input.handleKey, 'function', 'handleKey should be a function')
})

test('TextInput has addChild method', () => {
  const input = new TextInput()
  assert.equal(typeof input.addChild, 'function', 'addChild should be a function')
})

test('TextInput has removeChild method', () => {
  const input = new TextInput()
  assert.equal(typeof input.removeChild, 'function', 'removeChild should be a function')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 4. TextInput-specific Properties and Methods
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nTextInput-specific Properties:')

test('TextInput has static run method', () => {
  assert.equal(typeof TextInput.run, 'function', 'TextInput.run should be a function')
})

test('TextInput constructor accepts options', () => {
  const input = new TextInput({
    prompt: 'Test prompt',
    defaultValue: 'default',
    color: false
  })
  assert.ok(input, 'TextInput should be created with options')
})

test('TextInput has prompt property', () => {
  const input = new TextInput({ prompt: 'Enter: ' })
  assert.equal(input.prompt, 'Enter: ', 'prompt should match constructor option')
})

test('TextInput has defaultValue property', () => {
  const input = new TextInput({ defaultValue: 'test' })
  assert.equal(input.defaultValue, 'test', 'defaultValue should match constructor option')
})

test('TextInput has isComplete property', () => {
  const input = new TextInput()
  assert.equal(input.isComplete, false, 'isComplete should be false initially')
})

test('TextInput has result property', () => {
  const input = new TextInput()
  assert.equal(input.result, null, 'result should be null initially')
})

test('TextInput has inputBuffer property', () => {
  const input = new TextInput()
  assert.equal(input.inputBuffer, '', 'inputBuffer should be empty initially')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 5. TextInput Key Handling
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nTextInput Key Handling:')

test('TextInput handles character input', () => {
  const input = new TextInput()
  const handled = input.handleKey({ char: 'a', name: 'a' })
  assert.ok(handled, 'Character key should be handled')
  assert.equal(input.inputBuffer, 'a', 'inputBuffer should contain the character')
})

test('TextInput handles backspace', () => {
  const input = new TextInput()
  input.handleKey({ char: 'a', name: 'a' })
  const handled = input.handleKey({ name: 'backspace' })
  assert.ok(handled, 'Backspace key should be handled')
  assert.equal(input.inputBuffer, '', 'inputBuffer should be empty after backspace')
})

test('TextInput handles enter (submit)', () => {
  const input = new TextInput()
  input.handleKey({ char: 'a', name: 'a' })
  const handled = input.handleKey({ name: 'return' })
  assert.ok(handled, 'Enter key should be handled')
  assert.ok(input.isComplete, 'isComplete should be true after enter')
  assert.equal(input.result, 'a', 'result should contain the input')
})

test('TextInput handles escape (cancel)', () => {
  const input = new TextInput()
  input.handleKey({ char: 'a', name: 'a' })
  const handled = input.handleKey({ name: 'escape' })
  assert.ok(handled, 'Escape key should be handled')
  assert.ok(input.isComplete, 'isComplete should be true after escape')
  assert.equal(input.result, null, 'result should be null after escape')
})

test('TextInput ignores ctrl keys', () => {
  const input = new TextInput()
  const handled = input.handleKey({ char: 'a', name: 'a', ctrl: true })
  assert.equal(handled, false, 'Ctrl keys should not be handled')
  assert.equal(input.inputBuffer, '', 'inputBuffer should remain empty')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Confirm Inheritance and Properties
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nConfirm Inheritance and Properties:')

test('Confirm extends Component', () => {
  const confirmComp = new Confirm()
  assert.ok(confirmComp instanceof Component, 'Confirm instance should be instance of Component')
  assert.ok(confirmComp instanceof Confirm, 'Confirm instance should be instance of Confirm')
})

test('Confirm prototype chain includes Component', () => {
  assert.ok(Component.isPrototypeOf(Confirm), 'Confirm should extend Component')
})

test('Confirm has static run method', () => {
  assert.equal(typeof Confirm.run, 'function', 'Confirm.run should be a function')
})

test('Confirm constructor accepts options', () => {
  const confirmComp = new Confirm({
    question: 'Are you sure?',
    defaultValue: false,
    color: false
  })
  assert.ok(confirmComp, 'Confirm should be created with options')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 7. Confirm Key Handling
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nConfirm Key Handling:')

test('Confirm handles y key', () => {
  const confirmComp = new Confirm()
  const handled = confirmComp.handleKey({ char: 'y', name: 'y' })
  assert.ok(handled, 'Y key should be handled')
  assert.ok(confirmComp.isComplete, 'isComplete should be true')
  assert.equal(confirmComp.result, true, 'result should be true')
})

test('Confirm handles n key', () => {
  const confirmComp = new Confirm()
  const handled = confirmComp.handleKey({ char: 'n', name: 'n' })
  assert.ok(handled, 'N key should be handled')
  assert.ok(confirmComp.isComplete, 'isComplete should be true')
  assert.equal(confirmComp.result, false, 'result should be false')
})

test('Confirm handles enter (use default)', () => {
  const confirmComp = new Confirm({ defaultValue: true })
  const handled = confirmComp.handleKey({ name: 'return' })
  assert.ok(handled, 'Enter key should be handled')
  assert.ok(confirmComp.isComplete, 'isComplete should be true')
  assert.equal(confirmComp.result, true, 'result should be true (default)')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 8. Backward Compatibility
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nBackward Compatibility:')

test('TextInput maintains backward-compatible API', () => {
  // Verify that the new TextInput has the same static methods as the original
  assert.equal(typeof TextInput.run, 'function', 'TextInput.run should exist')
})

test('confirm function maintains backward-compatible API', () => {
  // Verify that the confirm function has the same signature
  assert.equal(typeof confirm, 'function', 'confirm should be a function')
})

// ═══════════════════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════════════════════════════════════════')
console.log(`\nResults: ${passed} passed, ${failed} failed, ${total} total`)
if (failed > 0) {
  process.exit(1)
}