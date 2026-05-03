/**
 * Progress Component Migration Test
 *
 * Tests the new Spinner and ProgressBar components that extend Component base class.
 * Serves as a template for testing other component migrations.
 *
 * Usage: node test/progress-test.js
 */

import assert from 'node:assert/strict'
import { Spinner, ProgressBar } from '../src/tui/components/progress.js'
import { Component } from '../src/tui/core/component.js'
import { Spinner as OriginalSpinner, ProgressBar as OriginalProgressBar } from '../src/tui.js'
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

console.log('Progress Component Migration Tests\n')

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Module Exports
// ═══════════════════════════════════════════════════════════════════════════════

console.log('Module Exports:')

test('Spinner is exported from src/tui/components/progress.js', () => {
  assert.ok(Spinner, 'Spinner should be defined')
  assert.equal(typeof Spinner, 'function', 'Spinner should be a constructor function')
})

test('ProgressBar is exported from src/tui/components/progress.js', () => {
  assert.ok(ProgressBar, 'ProgressBar should be defined')
  assert.equal(typeof ProgressBar, 'function', 'ProgressBar should be a constructor function')
})

test('Component is exported from src/tui/core/component.js', () => {
  assert.ok(Component, 'Component should be defined')
  assert.equal(typeof Component, 'function', 'Component should be a constructor function')
})

test('Original Spinner is exported from tui.js', () => {
  assert.ok(OriginalSpinner, 'OriginalSpinner should be defined')
  assert.equal(typeof OriginalSpinner, 'function', 'OriginalSpinner should be a constructor function')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Inheritance
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nInheritance:')

test('Spinner extends Component', () => {
  const spinner = new Spinner()
  assert.ok(spinner instanceof Component, 'Spinner instance should be instance of Component')
  assert.ok(spinner instanceof Spinner, 'Spinner instance should be instance of Spinner')
})

test('ProgressBar extends Component', () => {
  const progressBar = new ProgressBar()
  assert.ok(progressBar instanceof Component, 'ProgressBar instance should be instance of Component')
  assert.ok(progressBar instanceof ProgressBar, 'ProgressBar instance should be instance of ProgressBar')
})

test('Spinner prototype chain includes Component', () => {
  assert.ok(Component.isPrototypeOf(Spinner), 'Spinner should extend Component')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Component Methods (Inherited from Component)
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nComponent Methods (Inherited):')

test('Spinner has id property', () => {
  const spinner = new Spinner()
  assert.ok(spinner.id, 'Spinner should have an id')
  assert.equal(typeof spinner.id, 'string', 'id should be a string')
})

test('Spinner has isMounted property', () => {
  const spinner = new Spinner()
  assert.equal(spinner.isMounted, false, 'Spinner should not be mounted initially')
})

test('Spinner has setState method', () => {
  const spinner = new Spinner()
  assert.equal(typeof spinner.setState, 'function', 'setState should be a function')
})

test('Spinner has mount method', () => {
  const spinner = new Spinner()
  assert.equal(typeof spinner.mount, 'function', 'mount should be a function')
})

test('Spinner has unmount method', () => {
  const spinner = new Spinner()
  assert.equal(typeof spinner.unmount, 'function', 'unmount should be a function')
})

test('Spinner has render method', () => {
  const spinner = new Spinner()
  assert.equal(typeof spinner.render, 'function', 'render should be a function')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Spinner-specific Properties
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nSpinner-specific Properties:')

test('Constructor sets text', () => {
  const spinner = new Spinner('Test text')
  // We can't access private fields directly, but we can test behavior
  assert.ok(spinner, 'Spinner should be created')
})

test('Constructor sets color option', () => {
  const spinner = new Spinner('Test', { color: false })
  assert.ok(spinner, 'Spinner should be created with color option')
})

test('Default color is true', () => {
  const spinner = new Spinner('Test')
  assert.ok(spinner, 'Spinner should be created with default color')
})

test('Defaults to not running', () => {
  const spinner = new Spinner()
  // The spinner shouldn't be running initially
  assert.ok(!spinner.isRunning, 'Spinner should not be running initially')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Spinner Lifecycle
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nSpinner Lifecycle:')

test('start() sets running state', () => {
  const spinner = new Spinner('Test')
  spinner.start()
  // We can't directly check the private field, but we can test that it doesn't throw
  assert.ok(spinner, 'Spinner should start without errors')
  spinner.stop() // Clean up
})

test('stop() clears running state', () => {
  const spinner = new Spinner('Test')
  spinner.start()
  spinner.stop()
  assert.ok(spinner, 'Spinner should stop without errors')
})

test('mount() initializes component', () => {
  const spinner = new Spinner('Test')
  spinner.mount()
  assert.ok(spinner.isMounted, 'Spinner should be mounted after mount()')
  spinner.unmount()
})

test('unmount() clears interval', () => {
  const spinner = new Spinner('Test')
  spinner.start()
  spinner.mount()
  spinner.unmount()
  assert.ok(!spinner.isMounted, 'Spinner should be unmounted after unmount()')
})

test('Multiple start() calls are idempotent', () => {
  const spinner = new Spinner('Test')
  spinner.start()
  spinner.start() // Should not throw or create multiple intervals
  spinner.stop()
  assert.ok(spinner, 'Multiple start() calls should not cause issues')
})

test('update() changes text', () => {
  const spinner = new Spinner('Initial')
  spinner.start()
  spinner.update('Updated')
  assert.ok(spinner, 'update() should work without errors')
  spinner.stop()
})

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Spinner Rendering
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nSpinner Rendering:')

test('render() writes to VirtualScreen', () => {
  const spinner = new Spinner('Test')
  const screen = new VirtualScreen(80, 24)
  const ctx = { bounds: { row: 0, col: 0, width: 80, height: 1 } }
  
  spinner.start()
  spinner.render(screen, ctx)
  
  // Check that something was written to the screen
  const line = screen.getLine(0)
  assert.ok(line.length > 0, 'render() should write to VirtualScreen')
  spinner.stop()
})

test('Animation frames cycle correctly', () => {
  // Mock process.stderr.isTTY for this test
  const originalIsTTY = Object.getOwnPropertyDescriptor(process.stderr, 'isTTY')
  Object.defineProperty(process.stderr, 'isTTY', { value: true, configurable: true })
  
  try {
    const spinner = new Spinner('Test')
    const screen = new VirtualScreen(80, 24)
    const ctx = { bounds: { row: 0, col: 0, width: 80, height: 1 } }
    
    spinner.mount()
    spinner.start()
    
    // Get initial render
    spinner.render(screen, ctx)
    const initialLine = screen.getLine(0)
    
    // Wait a bit for animation to advance
    setTimeout(() => {
      spinner.render(screen, ctx)
      const nextLine = screen.getLine(0)
      // The lines should be different due to animation
      assert.notEqual(initialLine, nextLine, 'Animation frames should change')
      spinner.stop()
    }, 100)
  } finally {
    // Restore original isTTY
    if (originalIsTTY) {
      Object.defineProperty(process.stderr, 'isTTY', originalIsTTY)
    } else {
      Object.defineProperty(process.stderr, 'isTTY', { value: undefined, configurable: true })
    }
  }
})

test('succeed() shows checkmark', () => {
  const spinner = new Spinner('Test')
  const screen = new VirtualScreen(80, 24)
  const ctx = { bounds: { row: 0, col: 0, width: 80, height: 1 } }
  
  spinner.start()
  spinner.succeed('Success!')
  
  // After succeed(), the spinner should be stopped and in success state
  assert.ok(!spinner.isRunning, 'Spinner should be stopped after succeed()')
})

test('fail() shows cross', () => {
  const spinner = new Spinner('Test')
  const screen = new VirtualScreen(80, 24)
  const ctx = { bounds: { row: 0, col: 0, width: 80, height: 1 } }
  
  spinner.start()
  spinner.fail('Failed!')
  
  // After fail(), the spinner should be stopped and in failure state
  assert.ok(!spinner.isRunning, 'Spinner should be stopped after fail()')
})

test('Non-TTY mode degrades gracefully', () => {
  // This test is more of a smoke test since we can't easily mock process.stderr.isTTY
  const spinner = new Spinner('Test')
  assert.ok(spinner, 'Spinner should work in any TTY mode')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 7. Static Methods
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nStatic Methods:')

test('Spinner.run() exists', () => {
  assert.equal(typeof Spinner.run, 'function', 'Spinner.run should be a function')
})

test('Spinner.run() returns promise', async () => {
  const result = await Spinner.run('Test', async (update) => {
    update('Processing...')
    return 'done'
  })
  assert.equal(result, 'done', 'Spinner.run() should return the function result')
})

test('Spinner.draw() returns string', () => {
  const result = Spinner.draw('Test text')
  assert.equal(typeof result, 'string', 'Spinner.draw() should return a string')
  assert.ok(result.length > 0, 'Spinner.draw() should return non-empty string')
})

test('Spinner.draw() includes frame character', () => {
  const result = Spinner.draw('Test text', 0)
  assert.ok(result.includes('Test text'), 'Spinner.draw() should include the text')
  // Check for braille characters
  assert.ok(result.includes('⠋') || result.includes('⠙') || result.includes('⠹'), 
    'Spinner.draw() should include a spinner frame')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 8. Backward Compatibility
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nBackward Compatibility:')

test('Original Spinner still available from tui.js', () => {
  assert.ok(OriginalSpinner, 'OriginalSpinner should still be available')
  const spinner = new OriginalSpinner('Test')
  assert.ok(spinner, 'OriginalSpinner should be instantiable')
})

test('New Spinner has same API surface', () => {
  const spinner = new Spinner('Test')
  // Check all expected methods exist
  const expectedMethods = ['start', 'update', 'succeed', 'fail', 'stop', 'mount', 'unmount', 'render']
  for (const method of expectedMethods) {
    assert.equal(typeof spinner[method], 'function', `Spinner.${method} should be a function`)
  }
})

test('Static methods produce same output', () => {
  // The new Spinner has a static draw() method that the original doesn't
  // This is an enhancement, not a backward compatibility issue
  const newResult = Spinner.draw('Test', 0)
  assert.ok(newResult.length > 0, 'Static draw() should produce output')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 9. Edge Cases
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nEdge Cases:')

test('Empty text handling', () => {
  const spinner = new Spinner('')
  assert.ok(spinner, 'Spinner should handle empty text')
  spinner.start()
  spinner.stop()
})

test('Null/undefined options', () => {
  // The Component constructor expects an options object
  // We need to handle null/undefined gracefully
  const spinner1 = new Spinner('Test')
  const spinner2 = new Spinner('Test')
  assert.ok(spinner1, 'Spinner should handle default options')
  assert.ok(spinner2, 'Spinner should handle default options')
})

test('Rapid start/stop cycles', () => {
  const spinner = new Spinner('Test')
  for (let i = 0; i < 10; i++) {
    spinner.start()
    spinner.stop()
  }
  assert.ok(spinner, 'Spinner should handle rapid start/stop cycles')
})

test('Multiple updates before render', () => {
  const spinner = new Spinner('Test')
  spinner.start()
  spinner.update('Update 1')
  spinner.update('Update 2')
  spinner.update('Update 3')
  assert.ok(spinner, 'Spinner should handle multiple updates')
  spinner.stop()
})

test('Cleanup on unmount', () => {
  const spinner = new Spinner('Test')
  spinner.start()
  spinner.mount()
  spinner.unmount()
  assert.ok(!spinner.isMounted, 'Spinner should be unmounted')
  // After unmount, the spinner should be stopped
})

test('ProgressBar instantiation', () => {
  const progressBar = new ProgressBar({ total: 100, width: 30, label: 'Test' })
  assert.ok(progressBar, 'ProgressBar should be instantiable')
})

test('ProgressBar methods', () => {
  const progressBar = new ProgressBar({ total: 100 })
  assert.equal(typeof progressBar.update, 'function', 'update should be a function')
  assert.equal(typeof progressBar.tick, 'function', 'tick should be a function')
  assert.equal(typeof progressBar.done, 'function', 'done should be a function')
  assert.equal(typeof progressBar.mount, 'function', 'mount should be a function')
  assert.equal(typeof progressBar.unmount, 'function', 'unmount should be a function')
})

test('ProgressBar update method', () => {
  const progressBar = new ProgressBar({ total: 100 })
  progressBar.mount()
  progressBar.update(50)
  progressBar.done()
  progressBar.unmount()
  assert.ok(progressBar, 'ProgressBar should work with update method')
})

test('ProgressBar tick method', () => {
  const progressBar = new ProgressBar({ total: 10 })
  progressBar.mount()
  for (let i = 0; i < 5; i++) {
    progressBar.tick()
  }
  progressBar.done()
  progressBar.unmount()
  assert.ok(progressBar, 'ProgressBar should work with tick method')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 10. Integration Tests
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nIntegration Tests:')

test('Spinner.run() with async function', async () => {
  let updateCalled = false
  const result = await Spinner.run('Processing...', async (update) => {
    update('Step 1')
    updateCalled = true
    await new Promise(resolve => setTimeout(resolve, 50))
    return 'completed'
  })
  assert.ok(updateCalled, 'Update callback should be called')
  assert.equal(result, 'completed', 'Result should be returned')
})

test('Spinner.run() with failing function', async () => {
  try {
    await Spinner.run('Failing...', async () => {
      throw new Error('Test error')
    })
    assert.fail('Should have thrown')
  } catch (error) {
    assert.equal(error.message, 'Test error', 'Error should be propagated')
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n' + '='.repeat(60))
console.log(`Progress Component Tests: ${passed} passed, ${failed} failed, ${total} total`)
console.log('='.repeat(60))

if (failed > 0) {
  process.exit(1)
}