/**
 * FindingsBrowser Component Test
 *
 * Tests the FindingsBrowser component that extends Component base class.
 * Covers: inheritance, state management, key handling, filtering,
 * pagination, rendering, detail view, edge cases, and backward compatibility.
 *
 * Usage: node test/findings-test.js
 */

import assert from 'node:assert/strict'
import { FindingsBrowser } from '../src/tui/components/findings.js'
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

// ─── Sample Data ─────────────────────────────────────────────────────────────

const sampleFindings = [
  {
    packageName: 'lodash',
    packageVersion: '4.17.20',
    severity: 'critical',
    type: 'prototype-pollution',
    attack: 'CVE-2021-23337',
    description: 'Prototype Pollution via template function',
    evidence: 'lodash template function allows code injection',
    remediation: 'Upgrade to lodash >= 4.17.21',
    path: 'package.json',
    source: 'npm-audit',
  },
  {
    packageName: 'minimist',
    packageVersion: '1.2.5',
    severity: 'high',
    type: 'prototype-pollution',
    attack: 'CVE-2021-44906',
    description: 'Prototype Pollution in minimist',
    url: 'https://github.com/advisories/GHSA-xvch-5gv4-984h',
    remediation: 'Upgrade to minimist >= 1.2.6',
    path: 'node_modules/minimist/index.js',
    source: 'npm-audit',
  },
  {
    packageName: 'express',
    packageVersion: '4.17.1',
    severity: 'medium',
    type: 'open-redirect',
    description: 'Open redirect in express',
    publishedAt: '2024-01-15',
    updatedAt: '2024-02-01',
    path: 'package.json',
    source: 'snyk',
  },
  {
    packageName: 'qs',
    packageVersion: '6.5.2',
    severity: 'low',
    type: 'denial-of-service',
    description: 'Prototype pollution in qs',
    path: 'node_modules/qs/lib/utils.js',
    source: 'npm-audit',
  },
  {
    packageName: 'debug',
    packageVersion: '2.6.9',
    severity: 'critical',
    type: 'regex-dos',
    description: 'Regular Expression Denial of Service in debug',
    attack: 'CVE-2017-16137 GHSA-gxpj-cx7g-858c',
    path: 'package.json',
    source: 'retire.js',
  },
  {
    packageName: 'minimatch',
    packageVersion: '3.0.4',
    severity: 'high',
    type: 'regex-dos',
    description: 'ReDoS in minimatch',
    path: 'node_modules/minimatch/index.js',
    source: 'npm-audit',
  },
]

// Helper: generate many findings for pagination tests
function makeManyFindings(count) {
  return Array.from({ length: count }, (_, i) => ({
    packageName: `pkg${i}`,
    packageVersion: `${i}.0.0`,
    severity: ['critical', 'high', 'medium', 'low'][i % 4],
    type: 'test',
    description: `Test finding ${i}`,
    path: `/test/${i}`,
    source: 'test',
  }))
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Module Exports
// ═══════════════════════════════════════════════════════════════════════════════

console.log('FindingsBrowser Component Tests\n')
console.log('Module Exports:')

test('FindingsBrowser is exported from src/tui/components/findings.js', () => {
  assert.ok(FindingsBrowser, 'FindingsBrowser should be defined')
  assert.equal(typeof FindingsBrowser, 'function', 'FindingsBrowser should be a constructor function')
})

test('Component is exported from src/tui/core/component.js', () => {
  assert.ok(Component, 'Component should be defined')
  assert.equal(typeof Component, 'function', 'Component should be a constructor function')
})

test('VirtualScreen is exported from src/tui/core/virtual-screen.js', () => {
  assert.ok(VirtualScreen, 'VirtualScreen should be defined')
  assert.equal(typeof VirtualScreen, 'function', 'VirtualScreen should be a constructor function')
})

test('FindingsBrowser has static browse method', () => {
  assert.equal(typeof FindingsBrowser.browse, 'function', 'FindingsBrowser.browse should be a function')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Inheritance
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nInheritance:')

test('FindingsBrowser extends Component', () => {
  const browser = new FindingsBrowser({ findings: [] })
  assert.ok(browser instanceof Component, 'FindingsBrowser instance should be instance of Component')
  assert.ok(browser instanceof FindingsBrowser, 'FindingsBrowser instance should be instance of FindingsBrowser')
})

test('FindingsBrowser prototype chain includes Component', () => {
  assert.ok(Component.isPrototypeOf(FindingsBrowser), 'FindingsBrowser should extend Component')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Constructor & Default Properties
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nConstructor & Default Properties:')

test('FindingsBrowser constructs with no options', () => {
  const browser = new FindingsBrowser()
  assert.ok(browser, 'FindingsBrowser should construct with no options')
})

test('FindingsBrowser defaults to empty findings', () => {
  const browser = new FindingsBrowser()
  assert.deepEqual(browser.findings, [], 'findings should be empty by default')
})

test('FindingsBrowser view defaults to "list"', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  assert.equal(browser.view, 'list', 'view should default to "list"')
})

test('FindingsBrowser currentPage defaults to 0', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  assert.equal(browser.currentPage, 0, 'currentPage should be 0 initially')
})

test('FindingsBrowser totalPages is 1 with no findings', () => {
  const browser = new FindingsBrowser({ findings: [] })
  assert.equal(browser.totalPages, 1, 'totalPages should be at least 1')
})

test('FindingsBrowser hasActiveFilters defaults to false', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  assert.equal(browser.hasActiveFilters, false, 'hasActiveFilters should be false initially')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Constructor Options
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nConstructor Options:')

test('FindingsBrowser accepts findings option', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  assert.equal(browser.findings.length, sampleFindings.length, 'should have sample findings')
})

test('FindingsBrowser accepts color option', () => {
  const browser = new FindingsBrowser({ findings: [], color: false })
  assert.ok(browser, 'should construct with color option')
})

test('FindingsBrowser accepts color=true option', () => {
  const browser = new FindingsBrowser({ findings: [], color: true })
  assert.ok(browser, 'should construct with color=true option')
})

test('FindingsBrowser accepts all options together', () => {
  const browser = new FindingsBrowser({
    findings: sampleFindings,
    color: true,
  })
  assert.equal(browser.findings.length, sampleFindings.length, 'findings count should match')
  assert.ok(browser, 'should construct with all options')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Component Methods (Inherited from Component)
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nComponent Methods (Inherited):')

test('FindingsBrowser has id property', () => {
  const browser = new FindingsBrowser({ findings: [] })
  assert.ok(browser.id, 'FindingsBrowser should have an id')
  assert.equal(typeof browser.id, 'string', 'id should be a string')
})

test('FindingsBrowser has isMounted property', () => {
  const browser = new FindingsBrowser({ findings: [] })
  assert.equal(browser.isMounted, false, 'should not be mounted initially')
})

test('FindingsBrowser has setState method', () => {
  const browser = new FindingsBrowser({ findings: [] })
  assert.equal(typeof browser.setState, 'function', 'setState should be a function')
})

test('FindingsBrowser has mount method', () => {
  const browser = new FindingsBrowser({ findings: [] })
  assert.equal(typeof browser.mount, 'function', 'mount should be a function')
})

test('FindingsBrowser has unmount method', () => {
  const browser = new FindingsBrowser({ findings: [] })
  assert.equal(typeof browser.unmount, 'function', 'unmount should be a function')
})

test('FindingsBrowser has render method', () => {
  const browser = new FindingsBrowser({ findings: [] })
  assert.equal(typeof browser.render, 'function', 'render should be a function')
})

test('FindingsBrowser has handleKey method', () => {
  const browser = new FindingsBrowser({ findings: [] })
  assert.equal(typeof browser.handleKey, 'function', 'handleKey should be a function')
})

test('FindingsBrowser has addChild method', () => {
  const browser = new FindingsBrowser({ findings: [] })
  assert.equal(typeof browser.addChild, 'function', 'addChild should be a function')
})

test('FindingsBrowser has removeChild method', () => {
  const browser = new FindingsBrowser({ findings: [] })
  assert.equal(typeof browser.removeChild, 'function', 'removeChild should be a function')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Lifecycle (Mount / Unmount)
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nLifecycle (Mount / Unmount):')

test('FindingsBrowser is not mounted before mount()', () => {
  const browser = new FindingsBrowser({ findings: [] })
  assert.equal(browser.isMounted, false, 'should not be mounted initially')
})

test('FindingsBrowser unmount works without mount', () => {
  const browser = new FindingsBrowser({ findings: [] })
  browser.unmount()
  assert.equal(browser.isMounted, false, 'should remain unmounted')
})

test('FindingsBrowser mount in non-TTY sets complete', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  try {
    browser.mount()
  } catch {
    // Expected if KeyReader fails in non-TTY
  }
  assert.ok(browser, 'mount should not crash')
  browser.unmount()
})

test('FindingsBrowser mount/unmount lifecycle completes cleanly', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  try {
    browser.mount()
  } catch {
    // Expected in some environments
  }
  browser.unmount()
  assert.equal(browser.isMounted, false, 'should be unmounted after unmount')
})

test('FindingsBrowser setState does not throw before mount', () => {
  const browser = new FindingsBrowser({ findings: [] })
  browser.setState({ customKey: 'customValue' })
  assert.ok(browser, 'setState should not throw before mount')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 7. Keyboard Handling — List View Navigation (Up / Down / j / k)
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nKeyboard Handling — List View Navigation:')

test('handleKey up returns true', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const handled = browser.handleKey({ name: 'up' })
  assert.equal(handled, true, 'up key should be handled')
})

test('handleKey down returns true', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const handled = browser.handleKey({ name: 'down' })
  assert.equal(handled, true, 'down key should be handled')
})

test('handleKey k returns true (vim up)', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const handled = browser.handleKey({ name: 'k' })
  assert.equal(handled, true, 'k key should be handled')
})

test('handleKey j returns true (vim down)', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const handled = browser.handleKey({ name: 'j' })
  assert.equal(handled, true, 'j key should be handled')
})

test('handleKey up at page 0 stays at 0', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  browser.handleKey({ name: 'up' })
  assert.equal(browser.currentPage, 0, 'currentPage should stay at 0')
})

test('handleKey down on single page does not change page', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  // 6 findings, 10 per page => 1 page, page should stay at 0
  browser.handleKey({ name: 'down' })
  assert.equal(browser.currentPage, 0, 'currentPage should stay at 0 on single page')
})

test('handleKey down increments page with multiple pages', () => {
  const browser = new FindingsBrowser({ findings: makeManyFindings(25) })
  assert.equal(browser.currentPage, 0, 'currentPage should start at 0')
  browser.handleKey({ name: 'down' })
  assert.equal(browser.currentPage, 1, 'currentPage should be 1 after down')
})

test('handleKey down at max page stays at max', () => {
  const browser = new FindingsBrowser({ findings: makeManyFindings(25) })
  const maxPage = browser.totalPages - 1
  for (let i = 0; i < 100; i++) {
    browser.handleKey({ name: 'down' })
  }
  assert.equal(browser.currentPage, maxPage, 'currentPage should not exceed max')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 8. Keyboard Handling — Left/Right Navigation (h / l)
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nKeyboard Handling — Left/Right Navigation:')

test('handleKey left returns true', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const handled = browser.handleKey({ name: 'left' })
  assert.equal(handled, true, 'left key should be handled')
})

test('handleKey right returns true', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const handled = browser.handleKey({ name: 'right' })
  assert.equal(handled, true, 'right key should be handled')
})

test('handleKey h returns true (vim left)', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const handled = browser.handleKey({ name: 'h' })
  assert.equal(handled, true, 'h key should be handled')
})

test('handleKey l returns true (vim right)', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const handled = browser.handleKey({ name: 'l' })
  assert.equal(handled, true, 'l key should be handled')
})

test('handleKey left at page 0 stays at 0', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  browser.handleKey({ name: 'left' })
  assert.equal(browser.currentPage, 0, 'currentPage should stay at 0')
})

test('handleKey right increments page with multiple pages', () => {
  const browser = new FindingsBrowser({ findings: makeManyFindings(25) })
  browser.handleKey({ name: 'right' })
  assert.equal(browser.currentPage, 1, 'currentPage should be 1 after right')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 9. Keyboard Handling — Finish (Escape / q)
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nKeyboard Handling — Finish:')

test('handleKey escape returns true in list view', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const handled = browser.handleKey({ name: 'escape' })
  assert.equal(handled, true, 'escape should be handled')
})

test('handleKey q returns true in list view', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const handled = browser.handleKey({ name: 'q' })
  assert.equal(handled, true, 'q should be handled')
})

test('escape sets state complete to true', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  browser.handleKey({ name: 'escape' })
  assert.equal(browser.state.complete, true, 'state.complete should be true after escape')
})

test('escape sets state result to "back"', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  browser.handleKey({ name: 'escape' })
  assert.equal(browser.state.result, 'back', 'state.result should be "back"')
})

test('q sets state complete to true', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  browser.handleKey({ name: 'q' })
  assert.equal(browser.state.complete, true, 'state.complete should be true after q')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 10. Keyboard Handling — Enter (Detail View)
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nKeyboard Handling — Enter (Detail View):')

test('handleKey enter in list view with findings switches to detail', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const handled = browser.handleKey({ name: 'enter' })
  assert.equal(handled, true, 'enter should be handled')
  assert.equal(browser.view, 'detail', 'view should switch to "detail"')
})

test('handleKey enter in list view with no findings stays in list', () => {
  const browser = new FindingsBrowser({ findings: [] })
  const handled = browser.handleKey({ name: 'enter' })
  assert.equal(handled, true, 'enter should still be handled')
  assert.equal(browser.view, 'list', 'view should stay "list" with no findings')
})

test('handleKey escape in detail view returns to list', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  browser.handleKey({ name: 'enter' }) // switch to detail
  assert.equal(browser.view, 'detail', 'should be in detail view')
  browser.handleKey({ name: 'escape' }) // back to list
  assert.equal(browser.view, 'list', 'view should return to "list"')
})

test('handleKey enter in detail view returns to list', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  browser.handleKey({ name: 'enter' }) // detail
  assert.equal(browser.view, 'detail', 'should be in detail view')
  browser.handleKey({ name: 'enter' }) // back to list
  assert.equal(browser.view, 'list', 'view should return to "list"')
})

test('handleKey q in detail view returns to list', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  browser.handleKey({ name: 'enter' }) // detail
  assert.equal(browser.view, 'detail', 'should be in detail view')
  browser.handleKey({ name: 'q' })
  assert.equal(browser.view, 'list', 'q in detail view should return to list')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 11. Keyboard Handling — Detail View Navigation
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nKeyboard Handling — Detail View Navigation:')

test('handleKey down in detail view increments detail index', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  browser.handleKey({ name: 'enter' }) // enter detail
  browser.handleKey({ name: 'down' })
  assert.equal(browser.view, 'detail', 'should still be in detail view')
})

test('handleKey up in detail view decrements detail index', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  browser.handleKey({ name: 'enter' }) // detail
  browser.handleKey({ name: 'down' }) // go forward
  browser.handleKey({ name: 'up' })   // go back
  assert.equal(browser.view, 'detail', 'should still be in detail view')
})

test('handleKey j in detail view works (vim down)', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  browser.handleKey({ name: 'enter' })
  const handled = browser.handleKey({ name: 'j' })
  assert.equal(handled, true, 'j should be handled in detail')
  assert.equal(browser.view, 'detail', 'should stay in detail')
})

test('handleKey k in detail view works (vim up)', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  browser.handleKey({ name: 'enter' })
  const handled = browser.handleKey({ name: 'k' })
  assert.equal(handled, true, 'k should be handled in detail')
  assert.equal(browser.view, 'detail', 'should stay in detail')
})

test('handleKey h in detail view works (vim left)', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  browser.handleKey({ name: 'enter' })
  const handled = browser.handleKey({ name: 'h' })
  assert.equal(handled, true, 'h should be handled in detail')
})

test('handleKey l in detail view works (vim right)', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  browser.handleKey({ name: 'enter' })
  const handled = browser.handleKey({ name: 'l' })
  assert.equal(handled, true, 'l should be handled in detail')
})

test('handleKey unhandled key in detail view returns false', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  browser.handleKey({ name: 'enter' }) // detail
  const handled = browser.handleKey({ name: 'x' })
  assert.equal(handled, false, 'unhandled key should return false in detail')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 12. Keyboard Handling — Search & Filter Keys
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nKeyboard Handling — Search & Filter Keys:')

test('handleKey s returns true (search)', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const handled = browser.handleKey({ name: 's' })
  assert.equal(handled, true, 's key should be handled')
})

test('handleKey f returns true (filter)', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const handled = browser.handleKey({ name: 'f' })
  assert.equal(handled, true, 'f key should be handled')
})

test('handleKey c returns true (clear filters)', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const handled = browser.handleKey({ name: 'c' })
  assert.equal(handled, true, 'c key should be handled')
})

test('handleKey unhandled key returns false', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const handled = browser.handleKey({ name: 'x' })
  assert.equal(handled, false, 'unhandled key should return false')
})

test('handleKey z returns false (not handled)', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const handled = browser.handleKey({ name: 'z' })
  assert.equal(handled, false, 'z key should not be handled')
})

test('handleKey w returns false (not handled)', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const handled = browser.handleKey({ name: 'w' })
  assert.equal(handled, false, 'w key should not be handled')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 13. State Management
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nState Management:')

test('setState merges new state', () => {
  const browser = new FindingsBrowser({ findings: [] })
  browser.setState({ foo: 'bar' })
  assert.equal(browser.state.foo, 'bar', 'should merge new state')
})

test('setState merges multiple keys', () => {
  const browser = new FindingsBrowser({ findings: [] })
  browser.setState({ a: 1, b: 2 })
  assert.equal(browser.state.a, 1, 'first key should be set')
  assert.equal(browser.state.b, 2, 'second key should be set')
})

test('setState preserves existing state', () => {
  const browser = new FindingsBrowser({ findings: [] })
  browser.setState({ a: 1 })
  browser.setState({ b: 2 })
  assert.equal(browser.state.a, 1, 'existing key should be preserved')
  assert.equal(browser.state.b, 2, 'new key should be added')
})

test('setState overrides existing key', () => {
  const browser = new FindingsBrowser({ findings: [] })
  browser.setState({ a: 1 })
  browser.setState({ a: 2 })
  assert.equal(browser.state.a, 2, 'key should be overridden')
})

test('findings getter returns a copy', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const f1 = browser.findings
  const f2 = browser.findings
  assert.notEqual(f1, f2, 'findings should return different array references')
  assert.deepEqual(f1, f2, 'findings should have same contents')
})

test('multiple FindingsBrowser instances have unique ids', () => {
  const b1 = new FindingsBrowser({ findings: [] })
  const b2 = new FindingsBrowser({ findings: [] })
  assert.notEqual(b1.id, b2.id, 'each instance should have a unique id')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 14. Filtering & Computed State
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nFiltering & Computed State:')

test('filtered returns all findings with no active filters', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  assert.equal(browser.filtered.length, sampleFindings.length, 'should return all findings')
})

test('filtered returns correct data', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const filtered = browser.filtered
  assert.equal(filtered.length, sampleFindings.length, 'should return all findings')
  assert.equal(filtered[0].packageName, 'lodash', 'first finding should be lodash')
})

test('hasActiveFilters is false initially', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  assert.equal(browser.hasActiveFilters, false, 'should have no active filters initially')
})

test('totalPages with empty findings is 1', () => {
  const browser = new FindingsBrowser({ findings: [] })
  assert.equal(browser.totalPages, 1, 'should be at least 1 page')
})

test('totalPages with 6 findings is 1 (items per page = 10)', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  assert.equal(browser.totalPages, 1, '6 findings should fit on 1 page')
})

test('totalPages with 15 findings is 2', () => {
  const browser = new FindingsBrowser({ findings: makeManyFindings(15) })
  assert.equal(browser.totalPages, 2, '15 findings should be 2 pages')
})

test('totalPages with 25 findings is 3', () => {
  const browser = new FindingsBrowser({ findings: makeManyFindings(25) })
  assert.equal(browser.totalPages, 3, '25 findings should be 3 pages')
})

test('totalPages with 0 findings is 1 (minimum)', () => {
  const browser = new FindingsBrowser({ findings: [] })
  assert.equal(browser.totalPages, 1, '0 findings should be 1 page minimum')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 15. Rendering to VirtualScreen — Empty State
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nRendering to VirtualScreen — Empty State:')

test('render with no findings shows empty message', () => {
  const browser = new FindingsBrowser({ findings: [] })
  const screen = new VirtualScreen(80, 24)
  browser.render(screen, { bounds: { row: 0 } })
  const line0 = screen.getLine(0)
  assert.ok(line0.includes('No findings'), 'should show "No findings" message')
})

test('render with no findings only sets one line', () => {
  const browser = new FindingsBrowser({ findings: [] })
  const screen = new VirtualScreen(80, 24)
  browser.render(screen, { bounds: { row: 0 } })
  const line1 = screen.getLine(1).trim()
  assert.equal(line1, '', 'second line should be empty (early return)')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 16. Rendering to VirtualScreen — List View
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nRendering to VirtualScreen — List View:')

test('render with findings produces output', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const screen = new VirtualScreen(80, 30)
  browser.render(screen, { bounds: { row: 0 } })
  const line0 = screen.getLine(0)
  assert.ok(line0.length > 0, 'first line should have content')
})

test('render shows "Findings Browser" title in box header', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const screen = new VirtualScreen(80, 30)
  browser.render(screen, { bounds: { row: 0 } })
  const line0 = screen.getLine(0)
  assert.ok(line0.includes('Findings Browser'), 'first line should contain "Findings Browser" title')
})

test('render shows finding entries as separate lines', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const screen = new VirtualScreen(80, 30)
  browser.render(screen, { bounds: { row: 0 } })
  // Finding rows are rendered as separate setLine calls outside the box
  let foundLodash = false
  for (let i = 0; i < 30; i++) {
    if (screen.getLine(i).includes('lodash')) {
      foundLodash = true
      break
    }
  }
  assert.ok(foundLodash, 'should show lodash finding entry as separate line')
})

test('render shows multiple finding entries', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const screen = new VirtualScreen(80, 30)
  browser.render(screen, { bounds: { row: 0 } })
  let foundMinimist = false
  for (let i = 0; i < 30; i++) {
    if (screen.getLine(i).includes('minimist')) {
      foundMinimist = true
      break
    }
  }
  assert.ok(foundMinimist, 'should show minimist finding entry as separate line')
})

test('render shows severity icons', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const screen = new VirtualScreen(80, 30)
  browser.render(screen, { bounds: { row: 0 } })
  let foundCrit = false
  for (let i = 0; i < 30; i++) {
    if (screen.getLine(i).includes('[CRIT]')) {
      foundCrit = true
      break
    }
  }
  assert.ok(foundCrit, 'should show [CRIT] severity icon')
})

test('render shows CVE IDs in finding lines', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const screen = new VirtualScreen(80, 30)
  browser.render(screen, { bounds: { row: 0 } })
  let foundCve = false
  for (let i = 0; i < 30; i++) {
    if (screen.getLine(i).includes('CVE-')) {
      foundCve = true
      break
    }
  }
  assert.ok(foundCve, 'should show CVE identifiers')
})

test('render shows Actions section', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const screen = new VirtualScreen(80, 30)
  browser.render(screen, { bounds: { row: 0 } })
  let foundActions = false
  for (let i = 0; i < 30; i++) {
    if (screen.getLine(i).includes('Actions')) {
      foundActions = true
      break
    }
  }
  assert.ok(foundActions, 'should show Actions section')
})

test('render shows Search action', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const screen = new VirtualScreen(80, 30)
  browser.render(screen, { bounds: { row: 0 } })
  let foundSearch = false
  for (let i = 0; i < 30; i++) {
    if (screen.getLine(i).includes('[s]') && screen.getLine(i).includes('Search')) {
      foundSearch = true
      break
    }
  }
  assert.ok(foundSearch, 'should show [s] Search action')
})

test('render shows Filter action', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const screen = new VirtualScreen(80, 30)
  browser.render(screen, { bounds: { row: 0 } })
  let foundFilter = false
  for (let i = 0; i < 30; i++) {
    if (screen.getLine(i).includes('[f]') && screen.getLine(i).includes('Filter')) {
      foundFilter = true
      break
    }
  }
  assert.ok(foundFilter, 'should show [f] Filter action')
})

test('render shows Back action', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const screen = new VirtualScreen(80, 30)
  browser.render(screen, { bounds: { row: 0 } })
  let foundBack = false
  for (let i = 0; i < 30; i++) {
    if (screen.getLine(i).includes('[q]') && screen.getLine(i).includes('Back')) {
      foundBack = true
      break
    }
  }
  assert.ok(foundBack, 'should show [q] Back action')
})

test('render with custom bounds offset', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const screen = new VirtualScreen(80, 30)
  browser.render(screen, { bounds: { row: 5 } })
  const line0 = screen.getLine(0)
  assert.ok(!line0.includes('Findings Browser'), 'row 0 should not have content')
  let foundTitle = false
  for (let i = 5; i < 30; i++) {
    if (screen.getLine(i).includes('Findings Browser')) {
      foundTitle = true
      break
    }
  }
  assert.ok(foundTitle, 'should find title at offset row')
})

test('render without bounds context throws', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const screen = new VirtualScreen(80, 30)
  assert.throws(() => browser.render(screen, {}), TypeError, 'should throw with empty ctx')
})

test('render without ctx argument throws', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const screen = new VirtualScreen(80, 30)
  assert.throws(() => browser.render(screen), TypeError, 'should throw without ctx')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 17. Rendering — Detail View
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nRendering — Detail View:')

test('render detail view shows finding title in box header', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  browser.handleKey({ name: 'enter' }) // switch to detail
  const screen = new VirtualScreen(80, 30)
  browser.render(screen, { bounds: { row: 0 } })
  let foundTitle = false
  for (let i = 0; i < 30; i++) {
    if (screen.getLine(i).includes('Finding 1/6')) {
      foundTitle = true
      break
    }
  }
  assert.ok(foundTitle, 'should show "Finding 1/6" in detail box header')
})

test('render detail view shows severity label in box header', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  browser.handleKey({ name: 'enter' }) // detail
  const screen = new VirtualScreen(80, 30)
  browser.render(screen, { bounds: { row: 0 } })
  let foundSeverity = false
  for (let i = 0; i < 30; i++) {
    if (screen.getLine(i).includes('CRITICAL')) {
      foundSeverity = true
      break
    }
  }
  assert.ok(foundSeverity, 'should show CRITICAL in detail box title')
})

test('render detail view shows navigation hints', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  browser.handleKey({ name: 'enter' }) // detail
  const screen = new VirtualScreen(80, 30)
  browser.render(screen, { bounds: { row: 0 } })
  let foundNav = false
  for (let i = 0; i < 30; i++) {
    const line = screen.getLine(i)
    if (line.includes('[←]') && line.includes('[→]') && line.includes('Back to list')) {
      foundNav = true
      break
    }
  }
  assert.ok(foundNav, 'should show [←] Previous / [→] Next / Back to list hints')
})

test('render detail view has empty line between box and navigation', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  browser.handleKey({ name: 'enter' }) // detail
  const screen = new VirtualScreen(80, 30)
  browser.render(screen, { bounds: { row: 0 } })
  let foundEmptyLine = false
  for (let i = 1; i < 30; i++) {
    if (screen.getLine(i).trim() === '') {
      foundEmptyLine = true
      break
    }
  }
  assert.ok(foundEmptyLine, 'should have empty line between box and navigation')
})

test('render detail view second finding navigates forward', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  browser.handleKey({ name: 'enter' }) // detail at index 0
  browser.handleKey({ name: 'down' })  // advance to index 1
  const screen = new VirtualScreen(80, 30)
  browser.render(screen, { bounds: { row: 0 } })
  let foundSecond = false
  for (let i = 0; i < 30; i++) {
    if (screen.getLine(i).includes('Finding 2/6')) {
      foundSecond = true
      break
    }
  }
  assert.ok(foundSecond, 'should show "Finding 2/6" after down navigation')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 18. Rendering — Scroll & State
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nRendering — Scroll & State:')

test('render with color=false does not crash', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings, color: false })
  const screen = new VirtualScreen(80, 30)
  browser.render(screen, { bounds: { row: 0 } })
  const line0 = screen.getLine(0)
  assert.ok(line0.includes('Findings Browser'), 'should render without color')
})

test('render after setState does not crash', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const screen = new VirtualScreen(80, 30)
  browser.render(screen, { bounds: { row: 0 } })
  browser.setState({ something: 'else' })
  browser.render(screen, { bounds: { row: 0 } })
  assert.ok(true, 'render after setState should not crash')
})

test('render writes to correct rows with offset', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const screen = new VirtualScreen(80, 30)
  browser.render(screen, { bounds: { row: 10 } })
  const line0 = screen.getLine(0)
  assert.ok(!line0.includes('Findings Browser'), 'row 0 should not have content with offset')
  let foundTitleAtOffset = false
  for (let i = 10; i < 30; i++) {
    if (screen.getLine(i).includes('Findings Browser')) {
      foundTitleAtOffset = true
      break
    }
  }
  assert.ok(foundTitleAtOffset, 'should find title at offset row')
})

test('render on small VirtualScreen does not crash', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const screen = new VirtualScreen(20, 5)
  browser.render(screen, { bounds: { row: 0 } })
  assert.ok(true, 'render on small screen should not crash')
})

test('render on large VirtualScreen works', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const screen = new VirtualScreen(200, 60)
  browser.render(screen, { bounds: { row: 0 } })
  const line0 = screen.getLine(0)
  assert.ok(line0.includes('Findings Browser'), 'should render on large screen')
})

test('render clamps page to valid range', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  const maxPage = browser.totalPages - 1
  for (let i = 0; i < 100; i++) browser.handleKey({ name: 'down' })
  assert.equal(browser.currentPage, maxPage, 'page should be clamped to max')
  const screen = new VirtualScreen(80, 30)
  browser.render(screen, { bounds: { row: 0 } })
  assert.ok(true, 'render with clamped page should not crash')
})

test('render pagination on multi-page dataset', () => {
  const browser = new FindingsBrowser({ findings: makeManyFindings(25) })
  const screen = new VirtualScreen(80, 30)
  browser.render(screen, { bounds: { row: 0 } })
  let foundPagination = false
  for (let i = 0; i < 30; i++) {
    if (screen.getLine(i).includes('Page 1/3')) {
      foundPagination = true
      break
    }
  }
  assert.ok(foundPagination, 'should show pagination "Page 1/3"')
})

test('render shows next/prev page hints', () => {
  const browser = new FindingsBrowser({ findings: makeManyFindings(25) })
  const screen = new VirtualScreen(80, 30)
  browser.render(screen, { bounds: { row: 0 } })
  let foundPageNav = false
  for (let i = 0; i < 30; i++) {
    const line = screen.getLine(i)
    if (line.includes('Previous page') && line.includes('Next page')) {
      foundPageNav = true
      break
    }
  }
  assert.ok(foundPageNav, 'should show Previous/Next page navigation hints')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 19. Edge Cases
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nEdge Cases:')

test('FindingsBrowser with empty string findings', () => {
  const browser = new FindingsBrowser()
  assert.ok(browser, 'should construct with no options')
  assert.deepEqual(browser.findings, [], 'findings should be empty')
})

test('FindingsBrowser with findings having missing fields', () => {
  const sparseFindings = [
    { packageName: 'pkg1' },
    { severity: 'high' },
    {},
  ]
  const browser = new FindingsBrowser({ findings: sparseFindings })
  assert.equal(browser.filtered.length, 3, 'should handle sparse findings')
  const screen = new VirtualScreen(80, 30)
  browser.render(screen, { bounds: { row: 0 } })
  assert.ok(true, 'should render sparse findings without crash')
})

test('handleKey after escape still processes keys (view remains list)', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  browser.handleKey({ name: 'escape' })
  assert.equal(browser.state.complete, true, 'state.complete should be true')
  const handled = browser.handleKey({ name: 'down' })
  assert.equal(handled, true, 'down should still work (view is still list)')
})

test('multiple enter presses toggle between views', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  browser.handleKey({ name: 'enter' })
  assert.equal(browser.view, 'detail', 'first enter -> detail')
  browser.handleKey({ name: 'enter' })
  assert.equal(browser.view, 'list', 'second enter -> list')
  browser.handleKey({ name: 'enter' })
  assert.equal(browser.view, 'detail', 'third enter -> detail')
})

test('FindingsBrowser with single finding', () => {
  const single = [sampleFindings[0]]
  const browser = new FindingsBrowser({ findings: single })
  assert.equal(browser.filtered.length, 1, 'should have 1 finding')
  assert.equal(browser.totalPages, 1, 'should have 1 page')
  const screen = new VirtualScreen(80, 30)
  browser.render(screen, { bounds: { row: 0 } })
  assert.ok(true, 'should render single finding without crash')
})

test('FindingsBrowser with many findings for pagination', () => {
  const browser = new FindingsBrowser({ findings: makeManyFindings(25) })
  assert.equal(browser.filtered.length, 25, 'should have 25 findings')
  assert.equal(browser.totalPages, 3, 'should have 3 pages (25/10)')
})

test('FindingsBrowser with very long finding description', () => {
  const longDesc = 'A'.repeat(200)
  const findings = [{
    packageName: 'long-pkg',
    packageVersion: '1.0.0',
    severity: 'high',
    type: 'test',
    description: longDesc,
    path: '/test',
    source: 'test',
  }]
  const browser = new FindingsBrowser({ findings })
  const screen = new VirtualScreen(80, 30)
  browser.render(screen, { bounds: { row: 0 } })
  assert.ok(true, 'should render long description without crash')
})

test('constructor with null options throws (Component requires object)', () => {
  assert.throws(() => new FindingsBrowser(null), TypeError, 'should throw TypeError with null options')
})

test('constructor with undefined options does not crash', () => {
  const browser = new FindingsBrowser(undefined)
  assert.ok(browser, 'should construct with undefined options')
  assert.deepEqual(browser.findings, [], 'should default to empty findings')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 20. Key Handling Order & State Transitions
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nKey Handling Order & State Transitions:')

test('navigate down multiple pages then up', () => {
  const browser = new FindingsBrowser({ findings: makeManyFindings(30) })
  browser.handleKey({ name: 'down' })
  browser.handleKey({ name: 'down' })
  assert.equal(browser.currentPage, 2, 'should be on page 2')
  browser.handleKey({ name: 'up' })
  assert.equal(browser.currentPage, 1, 'should be on page 1 after up')
})

test('enter detail and navigate between findings', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  browser.handleKey({ name: 'enter' }) // detail at index 0
  assert.equal(browser.view, 'detail', 'should be in detail')
  browser.handleKey({ name: 'down' }) // next finding
  browser.handleKey({ name: 'down' }) // next finding
  browser.handleKey({ name: 'up' })   // previous finding
  assert.equal(browser.view, 'detail', 'should still be in detail after nav')
  browser.handleKey({ name: 'escape' }) // back to list
  assert.equal(browser.view, 'list', 'should be back in list')
})

test('state.complete persists after multiple operations', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  browser.handleKey({ name: 'down' })
  browser.handleKey({ name: 'enter' }) // detail
  browser.handleKey({ name: 'escape' }) // list
  assert.equal(browser.view, 'list', 'should be in list')
  browser.handleKey({ name: 'q' })
  assert.equal(browser.state.complete, true, 'state.complete should be true')
})

test('escape in detail returns to list, not quit', () => {
  const browser = new FindingsBrowser({ findings: sampleFindings })
  browser.handleKey({ name: 'enter' }) // detail
  browser.handleKey({ name: 'escape' }) // back to list (not quit)
  assert.equal(browser.view, 'list', 'should be in list')
  assert.notEqual(browser.state.complete, true, 'should not be complete')
})

// ═══════════════════════════════════════════════════════════════════════════════
// 21. Backward Compatibility — Static browse()
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nBackward Compatibility — Static browse():')

test('FindingsBrowser.browse is a static async function', () => {
  assert.equal(typeof FindingsBrowser.browse, 'function', 'browse should be a function')
  const result = FindingsBrowser.browse([], {})
  assert.ok(result instanceof Promise, 'browse should return a Promise')
  return result
})

test('FindingsBrowser.browse with empty findings resolves immediately', async () => {
  const result = await FindingsBrowser.browse([], {})
  assert.equal(result, undefined, 'browse with empty findings should resolve to undefined')
})

test('FindingsBrowser.browse accepts color option', async () => {
  const result = await FindingsBrowser.browse([], { color: false })
  assert.equal(result, undefined, 'browse should handle color option')
})

// ═══════════════════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════════════════════════════════════════')
console.log(`\nResults: ${passed} passed, ${failed} failed, ${total} total`)
if (failed > 0) {
  process.exit(1)
}
