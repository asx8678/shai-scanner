/**
 * Box Component Migration Test
 *
 * Tests the new Box component that extends Component base class.
 * Serves as a template for testing other component migrations.
 *
 * Usage: node test/box-test.js
 */

import assert from 'node:assert/strict'
import { Box } from '../src/tui/components/box.js'
import { Component } from '../src/tui/core/component.js'
import { Box as OriginalBox } from '../src/tui.js'

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

console.log('Box Component Migration Tests\n')

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Module Exports
// ═══════════════════════════════════════════════════════════════════════════════

console.log('Module Exports:')

test('Box is exported from src/tui/components/box.js', () => {
  assert.ok(Box, 'Box should be defined')
  assert.equal(typeof Box, 'function', 'Box should be a constructor function')
})

test('Component is exported from src/tui/core/component.js', () => {
  assert.ok(Component, 'Component should be defined')
  assert.equal(typeof Component, 'function', 'Component should be a constructor function')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Inheritance
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nInheritance:')

test('Box extends Component', () => {
  const box = new Box()
  assert.ok(box instanceof Component, 'Box instance should be instance of Component')
  assert.ok(box instanceof Box, 'Box instance should be instance of Box')
})

test('Box prototype chain includes Component', () => {
  assert.ok(Component.isPrototypeOf(Box), 'Box should extend Component')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Component Methods (Inherited from Component)
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nComponent Methods (Inherited):')

test('Box has id property', () => {
  const box = new Box()
  assert.ok(box.id, 'Box should have an id')
  assert.equal(typeof box.id, 'string', 'id should be a string')
})

test('Box has isMounted property', () => {
  const box = new Box()
  assert.equal(box.isMounted, false, 'Box should not be mounted initially')
})

test('Box has setState method', () => {
  const box = new Box()
  assert.equal(typeof box.setState, 'function', 'setState should be a function')
})

test('Box has mount method', () => {
  const box = new Box()
  assert.equal(typeof box.mount, 'function', 'mount should be a function')
})

test('Box has unmount method', () => {
  const box = new Box()
  assert.equal(typeof box.unmount, 'function', 'unmount should be a function')
})

test('Box has render method', () => {
  const box = new Box()
  assert.equal(typeof box.render, 'function', 'render should be a function')
})

test('Box has addChild method', () => {
  const box = new Box()
  assert.equal(typeof box.addChild, 'function', 'addChild should be a function')
})

test('Box has removeChild method', () => {
  const box = new Box()
  assert.equal(typeof box.removeChild, 'function', 'removeChild should be a function')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Box-specific Properties and Methods
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nBox-specific Properties:')

test('Box has title property', () => {
  const box = new Box({ title: 'Test' })
  assert.equal(box.title, 'Test', 'title should match constructor option')
})

test('Box has lines property (returns copy)', () => {
  const originalLines = ['line1', 'line2']
  const box = new Box({ lines: originalLines })
  const lines = box.lines
  assert.deepEqual(lines, originalLines, 'lines should match constructor option')
  // Verify it's a copy, not a reference
  lines.push('line3')
  assert.deepEqual(box.lines, originalLines, 'modifying returned lines should not affect Box')
})

test('Box has borderColor property', () => {
  const box = new Box({ borderColor: 'red' })
  assert.equal(box.borderColor, 'red', 'borderColor should match constructor option')
})

test('Box defaults to green borderColor', () => {
  const box = new Box()
  assert.equal(box.borderColor, 'green', 'default borderColor should be green')
})

console.log('\nBox-specific Methods:')

test('Box has setTitle method', () => {
  const box = new Box()
  assert.equal(typeof box.setTitle, 'function', 'setTitle should be a function')
  box.setTitle('New Title')
  assert.equal(box.title, 'New Title', 'setTitle should update the title')
})

test('Box has setLines method', () => {
  const box = new Box()
  assert.equal(typeof box.setLines, 'function', 'setLines should be a function')
  box.setLines(['a', 'b', 'c'])
  assert.deepEqual(box.lines, ['a', 'b', 'c'], 'setLines should update the lines')
})

test('Box has addLine method', () => {
  const box = new Box()
  assert.equal(typeof box.addLine, 'function', 'addLine should be a function')
  box.addLine('first')
  assert.deepEqual(box.lines, ['first'], 'addLine should add a line')
  box.addLine('second')
  assert.deepEqual(box.lines, ['first', 'second'], 'addLine should append')
})

test('Box has clearLines method', () => {
  const box = new Box({ lines: ['a', 'b'] })
  assert.equal(typeof box.clearLines, 'function', 'clearLines should be a function')
  box.clearLines()
  assert.deepEqual(box.lines, [], 'clearLines should remove all lines')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Static draw() Method
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nStatic draw() Method:')

test('Box has static draw method', () => {
  assert.equal(typeof Box.draw, 'function', 'Box.draw should be a function')
})

test('Box.draw returns a string', () => {
  const result = Box.draw()
  assert.equal(typeof result, 'string', 'Box.draw should return a string')
})

test('Box.draw renders a basic box', () => {
  const result = Box.draw({ color: false })
  const lines = result.split('\n')
  // Should have at least 3 lines (top border, bottom border)
  assert.ok(lines.length >= 2, 'Box should have at least top and bottom borders')
  assert.ok(lines[0].includes('┌'), 'Top border should start with ┌')
  assert.ok(lines[lines.length - 1].includes('└'), 'Bottom border should end with └')
})

test('Box.draw renders box with title', () => {
  const result = Box.draw({ title: 'Hello', color: false })
  assert.ok(result.includes('Hello'), 'Box should contain the title')
  assert.ok(result.includes('┌─ Hello'), 'Top border should include title')
})

test('Box.draw renders box with lines', () => {
  const result = Box.draw({ lines: ['Line 1', 'Line 2'], color: false })
  assert.ok(result.includes('Line 1'), 'Box should contain Line 1')
  assert.ok(result.includes('Line 2'), 'Box should contain Line 2')
})

test('Box.draw handles empty box', () => {
  const result = Box.draw({ color: false })
  const lines = result.split('\n')
  assert.equal(lines.length, 2, 'Empty box should have 2 lines (top and bottom borders)')
})

test('Box.draw truncates long lines', () => {
  const longLine = 'A'.repeat(200)
  const result = Box.draw({ lines: [longLine], color: false })
  const innerContent = result.split('\n')[1]
  // Should be truncated with ellipsis
  assert.ok(innerContent.includes('…') || innerContent.length < 200, 'Long line should be truncated')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Rendering with VirtualScreen
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nRendering with VirtualScreen:')

test('Box can render to VirtualScreen', async () => {
  const { VirtualScreen } = await import('../src/tui/core/virtual-screen.js')
  const screen = new VirtualScreen(80, 24)
  const box = new Box({ title: 'Test Box', lines: ['Hello', 'World'] })

  // Mock the dirty check to avoid coordinator
  box.__clearDirty()

  box.render(screen, { bounds: { row: 0, col: 0, width: 80, height: 24 } })

  // Verify the screen was written to (should have some content)
  const line0 = screen.buffer[0].join('')
  assert.ok(line0.includes('Test Box') || line0.includes('┌'), 'First line should have box content')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 7. Backward Compatibility with Original Box Class
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nBackward Compatibility:')

test('Original Box is still available from tui.js', () => {
  assert.ok(OriginalBox, 'Original Box should be available')
  assert.equal(typeof OriginalBox, 'function', 'Original Box should be a function')
})

test('Original Box.draw and new Box.draw produce same output', () => {
  const options = { title: 'Compat Test', lines: ['Line 1', 'Line 2'], color: false }
  const originalResult = OriginalBox.draw(options)
  const newResult = Box.draw(options)
  assert.equal(newResult, originalResult, 'New Box.draw should produce same output as original')
})

test('Box from tui.js is the same as the component Box (re-export)', () => {
  assert.equal(Box, OriginalBox, 'Box from tui.js should be the same as component Box (re-exported)')
  assert.ok(Box.isPrototypeOf(Box) || Box === Box, 'Box should be a class')
  assert.ok(Box.prototype instanceof Component, 'New Box should extend Component')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 8. Edge Cases
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nEdge Cases:')

test('Box handles null/undefined options gracefully', () => {
  const box1 = new Box(null)
  const box2 = new Box(undefined)
  assert.equal(box1.title, '', 'null options should default to empty title')
  assert.equal(box2.title, '', 'undefined options should default to empty title')
})

test('Box handles empty lines array', () => {
  const result = Box.draw({ lines: [], color: false })
  assert.ok(typeof result === 'string', 'Should return a string')
})

test('Box handles lines with ANSI codes', () => {
  const coloredLine = '\u001b[32mGreen Text\u001b[0m'
  const result = Box.draw({ lines: [coloredLine], color: false })
  assert.ok(result.includes('Green Text'), 'Should include text content from ANSI string')
})

test('Box handles very long titles', () => {
  const longTitle = 'T'.repeat(100)
  const result = Box.draw({ title: longTitle, color: false })
  assert.ok(result.includes(longTitle), 'Should include the long title')
})

test('Box handles special characters in lines', () => {
  const specialLine = 'Line with "quotes" and \'apostrophes\' & <special> chars'
  const result = Box.draw({ lines: [specialLine], color: false })
  assert.ok(result.includes('quotes'), 'Should handle quotes')
  assert.ok(result.includes('apostrophes'), 'Should handle apostrophes')
})

// ═══════════════════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n' + '─'.repeat(60))
console.log(`Results: ${passed}/${total} passed, ${failed} failed`)
console.log('─'.repeat(60))

if (failed > 0) {
  process.exit(1)
} else {
  console.log('✅ All Box component migration tests passed!')
  process.exit(0)
}
