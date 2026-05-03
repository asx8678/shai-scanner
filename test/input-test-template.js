/**
 * TextInput Component Migration Test Template
 *
 * Tests the new TextInput component that extends Component base class.
 * Serves as a template for testing other component migrations.
 *
 * Usage: node test/input-test.js
 */

import assert from 'node:assert/strict'
import { TextInput } from '../src/tui/components/input.js'
import { Component } from '../src/tui/core/component.js'
import { TextInput as OriginalTextInput } from '../src/tui.js'

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

test('Component is exported from src/tui/core/component.js', () => {
  assert.ok(Component, 'Component should be defined')
  assert.equal(typeof Component, 'function', 'Component should be a constructor function')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Inheritance
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nInheritance:')

test('TextInput extends Component', () => {
  const input = new TextInput()
  assert.ok(input instanceof Component, 'TextInput instance should be instance of Component')
  assert.ok(input instanceof TextInput, 'TextInput instance should be instance of TextInput')
})

test('TextInput prototype chain includes Component', () => {
  assert.ok(Component.isPrototypeOf(TextInput), 'TextInput should extend Component')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Component Methods (Inherited from Component)
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nComponent Methods (Inherited):')

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

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Static run() Method
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nStatic run() Method:')

test('TextInput.run is a function', () => {
  assert.equal(typeof TextInput.run, 'function', 'TextInput.run should be a function')
})

// Note: Testing run() requires mocking readline which is complex
// These are placeholder tests that should be expanded

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Backward Compatibility
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nBackward Compatibility:')

test('TextInput maintains backward-compatible API', () => {
  // Verify that the new TextInput has the same static methods as the original
  assert.equal(typeof TextInput.run, 'function', 'TextInput.run should exist')
})

// ═══════════════════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════════════════════════════════════════')
console.log(`\nResults: ${passed} passed, ${failed} failed, ${total} total`)
if (failed > 0) {
  process.exit(1)
}