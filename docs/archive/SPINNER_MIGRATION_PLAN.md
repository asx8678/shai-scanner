# Spinner Component Migration Execution Plan

> **Generated:** Max 🐶 — "Let's roll!"  
> **Purpose:** Comprehensive plan for migrating Spinner from legacy tui.js to new component architecture  
> **Status:** 📋 Ready to Execute  
> **Estimated Effort:** 0.75 day  
> **Complexity:** Medium  

---

## 🎯 1. Executive Summary

### Migration Objective
Migrate the `Spinner` class from `src/tui.js` (line 436) to `src/tui/components/progress.js` as a `Component` subclass, maintaining backward compatibility while adopting the new architecture patterns.

### Key Decisions
1. **File location:** `src/tui/components/progress.js` (as specified in PHASE2_CURRENT_STATUS.md)
2. **Will also include:** `ProgressBar` class in the same file (both are status indicators)
3. **Backward compatibility:** Maintain static methods and constructor API
4. **Animation strategy:** Use `setInterval` in `mount()`, clear in `unmount()`
5. **Rendering:** Use `VirtualScreen` instead of direct `process.stderr.write()`

### Success Criteria
- ✅ Extends `Component` base class
- ✅ No direct `process.stderr.write()` calls
- ✅ Animation frames managed in `render()` method
- ✅ Interval cleanup in `unmount()`
- ✅ Backward-compatible API preserved (`start()`, `update()`, `succeed()`, `fail()`, `stop()`)
- ✅ 30+ unit tests passing
- ✅ Passes `scripts/validate-migration.js` checks

---

## 📁 2. File Creation & Modification Steps

### Step 1: Create `src/tui/components/progress.js`
**Action:** Create new file  
**Content:** Spinner and ProgressBar components  
**Size estimate:** ~300 lines

### Step 2: Update `src/tui/index.js`
**Action:** Modify barrel file  
**Change:** Replace Spinner/ProgressBar imports from `tui.js` to `./components/progress.js`  
**Lines to modify:** ~10 lines

### Step 3: Create `test/progress-test.js`
**Action:** Create test file  
**Content:** 30+ unit tests following Box/Input test patterns  
**Size estimate:** ~500 lines

### Step 4: Update `src/tui-app.js` (Optional)
**Action:** Update import path (if needed)  
**Note:** Should work via barrel re-export, but verify

### Step 5: Run Validation
**Action:** Execute `scripts/validate-migration.js`  
**Expected:** Spinner passes all checks

---

## 🛠️ 3. Implementation Details

### 3.1 Spinner Component Architecture

```
Spinner extends Component
├── Constructor: text, options (color, frames, interval)
├── Private Fields: #text, #frame, #interval, #running, #isTTY, #color
├── Lifecycle:
│   ├── mount(): Start animation interval
│   ├── unmount(): Clear interval, stop animation
│   └── render(screen, ctx): Draw current frame to VirtualScreen
├── Public Methods:
│   ├── start(): Begin animation
│   ├── update(text): Update text
│   ├── succeed(text): Show success state
│   ├── fail(text): Show failure state
│   └── stop(): Stop animation
└── Static Methods:
    ├── run(text, fn): Backward-compatible static runner
    └── draw(text, frame): Draw spinner frame
```

### 3.2 Core Implementation Pattern

```javascript
// src/tui/components/progress.js

import { Component } from '../core/component.js'
import { colorize, stripAnsi } from '../../utils.js'
import { stdout as processStdout, stderr as processStderr } from 'node:process'

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
const SPINNER_INTERVAL = 80

export class Spinner extends Component {
  #text = ''
  #frame = 0
  #interval = null
  #running = false
  #isTTY = false
  #color = null
  #status = null // null | 'success' | 'failure'
  #statusText = ''

  constructor(text = '', options = {}) {
    super(options)
    this.#text = text
    this.#isTTY = processStderr.isTTY
    this.#color = colorize(options.color !== false)
    this.#status = null
    this.#statusText = ''
  }

  mount() {
    super.mount()
    // Note: Don't auto-start in mount(), let start() handle it
  }

  unmount() {
    this.#stop()
    super.unmount()
  }

  render(screen, ctx) {
    if (!this.#isTTY) return
    if (this.#status) {
      // Final state rendering
      const icon = this.#status === 'success' 
        ? this.#color.green('✓')
        : this.#color.red('✗')
      screen.setLine(ctx?.bounds?.row ?? 0, 
        `${icon} ${this.#color.bold(this.#statusText)}`)
    } else if (this.#running) {
      // Animation rendering
      const frame = this.#color.cyan(SPINNER_FRAMES[this.#frame])
      screen.setLine(ctx?.bounds?.row ?? 0,
        `${frame} ${this.#color.bold(this.#text)}`)
    }
  }

  start() {
    if (this.#running) return
    this.#running = true
    this.#status = null
    this.#frame = 0

    if (!this.#isTTY) {
      // Non-TTY: write once and return
      processStderr.write(`${this.#color.bold(this.#text)}\n`)
      return
    }

    // Start animation interval
    this.#interval = setInterval(() => {
      this.#frame = (this.#frame + 1) % SPINNER_FRAMES.length
      this.requestRender() // Trigger re-render
    }, SPINNER_INTERVAL)

    this.requestRender() // Initial render
  }

  update(text) {
    this.#text = text
    if (!this.#running) return
    this.requestRender()
  }

  succeed(text) {
    this.#stop()
    this.#status = 'success'
    this.#statusText = text
    if (!this.#isTTY) {
      processStderr.write(`${this.#color.green('✓')} ${this.#color.bold(text)}\n`)
    } else {
      this.requestRender()
      // Write final state to stderr for backward compatibility
      processStderr.write(`\r${this.#color.green('✓')} ${this.#color.bold(text)}\n`)
    }
  }

  fail(text) {
    this.#stop()
    this.#status = 'failure'
    this.#statusText = text
    if (!this.#isTTY) {
      processStderr.write(`${this.#color.red('✗')} ${this.#color.bold(text)}\n`)
    } else {
      this.requestRender()
      // Write final state to stderr for backward compatibility
      processStderr.write(`\r${this.#color.red('✗')} ${this.#color.bold(text)}\n`)
    }
  }

  stop() {
    this.#stop()
  }

  #stop() {
    this.#running = false
    if (this.#interval) {
      clearInterval(this.#interval)
      this.#interval = null
    }
  }

  /**
   * Backward-compatible static method.
   * Creates a spinner, runs a function, and handles success/failure.
   */
  static async run(text, fn) {
    const spinner = new Spinner(text)
    spinner.start()
    try {
      const result = await fn((msg) => spinner.update(msg))
      spinner.succeed(typeof result === 'string' ? result : text)
      return result
    } catch (error) {
      spinner.fail(error.message || 'Failed')
      throw error
    }
  }

  /**
   * Static method to draw a spinner frame without instantiation.
   */
  static draw(text, frame = 0) {
    const c = colorize(true)
    const frameChar = SPINNER_FRAMES[frame % SPINNER_FRAMES.length]
    return `${c.cyan(frameChar)} ${c.bold(text)}`
  }
}
```

### 3.3 Anti-Pattern Avoidance

**DO NOT:**
- ❌ Use `process.stderr.write()` for animation rendering
- ❌ Use `process.stdout.write()` directly
- ❌ Manual `onResize()` handling
- ❌ Use `ANSI.moveUp()`

**DO:**
- ✅ Use `screen.setLine()` in `render()`
- ✅ Use `setState()` for state changes
- ✅ Use `requestRender()` to trigger updates
- ✅ Clean up intervals in `unmount()`

### 3.4 Backward Compatibility Strategy

The legacy Spinner API must remain 100% compatible:

```javascript
// Legacy usage (must still work):
import { Spinner } from './tui.js'

const spinner = new Spinner('Loading...')
spinner.start()
spinner.update('Almost done...')
spinner.succeed('Done!')

// Static method (must still work):
await Spinner.run('Processing...', async (update) => {
  update('Step 1')
  await doWork()
})
```

**Strategy:**
1. Keep constructor signature identical
2. Keep all public methods (`start()`, `update()`, `succeed()`, `fail()`, `stop()`)
3. Keep static `Spinner.run()` method
4. Keep static `Spinner.draw()` method
5. Re-export from `src/tui/index.js` barrel

---

## 🧪 4. Testing Strategy

### 4.1 Test File Structure

**File:** `test/progress-test.js`

**Test Categories (Target: 30+ tests):**

1. **Module Exports (4 tests)**
   - Spinner is exported
   - ProgressBar is exported
   - Component is exported
   - Default export works

2. **Inheritance (3 tests)**
   - Spinner extends Component
   - Prototype chain correct
   - Instanceof checks pass

3. **Component Methods (6 tests)**
   - Has `id` property
   - Has `isMounted` property
   - Has `setState` method
   - Has `mount` method
   - Has `unmount` method
   - Has `render` method

4. **Spinner-specific Properties (4 tests)**
   - Constructor sets text
   - Constructor sets color option
   - Default color is true
   - Defaults to not running

5. **Spinner Lifecycle (6 tests)**
   - `start()` sets running state
   - `stop()` clears running state
   - `mount()` initializes component
   - `unmount()` clears interval
   - Multiple `start()` calls are idempotent
   - `update()` changes text

6. **Spinner Rendering (5 tests)**
   - `render()` writes to VirtualScreen
   - Animation frames cycle correctly
   - `succeed()` shows checkmark
   - `fail()` shows cross
   - Non-TTY mode degrades gracefully

7. **Static Methods (4 tests)**
   - `Spinner.run()` exists
   - `Spinner.run()` returns promise
   - `Spinner.draw()` returns string
   - `Spinner.draw()` includes frame character

8. **Backward Compatibility (3 tests)**
   - Original Spinner still available from tui.js
   - New Spinner has same API surface
   - Static methods produce same output

9. **Edge Cases (5+ tests)**
   - Empty text handling
   - Null/undefined options
   - Rapid start/stop cycles
   - Multiple updates before render
   - Cleanup on unmount

### 4.2 Test Execution

```bash
# Run spinner tests
node test/progress-test.js

# Run all tests
node test/box-test.js && node test/input-test.js && node test/progress-test.js

# Run validation
node scripts/validate-migration.js
```

### 4.3 Mocking Strategy

For testing without real terminal:

```javascript
// Mock VirtualScreen
class MockVirtualScreen {
  constructor() { this.lines = [] }
  setLine(row, text) { this.lines[row] = text }
  getLine(row) { return this.lines[row] || '' }
}

// Mock process.stderr
const originalWrite = process.stderr.write
let lastStderrWrite = ''
process.stderr.write = (data) => { lastStderrWrite = data; return true }
// Restore in cleanup: process.stderr.write = originalWrite
```

---

## 🔗 5. Integration Considerations

### 5.1 Import Updates

**Before:**
```javascript
// src/tui/index.js
export { Spinner, ProgressBar } from '../tui.js'
```

**After:**
```javascript
// src/tui/index.js
export { Spinner, ProgressBar } from './components/progress.js'
```

### 5.2 Re-export from Legacy Location

To maintain backward compatibility for direct imports:

```javascript
// src/tui.js (at bottom)
export { Spinner, ProgressBar } from './tui/components/progress.js'
```

**Note:** This may require careful ordering to avoid circular dependencies.

### 5.3 Dependency Analysis

**Spinner depends on:**
- `Component` (core)
- `colorize` (utils)
- `process.stderr` (Node.js built-in)

**No external dependencies** — clean migration.

### 5.4 Potential Conflicts

1. **Multiple intervals:** Ensure only one `setInterval` per Spinner instance
2. **Memory leaks:** Always clear intervals in `unmount()`
3. **Race conditions:** Guard against `start()` after `unmount()`

---

## ⚠️ 6. Risk Assessment

### 6.1 High Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Animation flicker | Visual glitch | Use `requestRender()` batching, differential rendering |
| Memory leak from intervals | App crash | Always clear in `unmount()`, test cleanup thoroughly |
| Breaking existing users | User complaint | 100% backward compatibility, comprehensive tests |

### 6.2 Medium Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Performance regression | Slower rendering | Benchmark before/after, optimize render path |
| Non-TTY behavior change | Output difference | Test both TTY and non-TTY modes explicitly |
| Circular dependencies | Import errors | Careful file ordering, use dynamic imports if needed |

### 6.3 Low Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Test flakiness | CI failures | Mock timers, deterministic tests |
| Documentation gaps | Confusion | Update migration docs, add code comments |

### 6.4 Rollback Plan

If migration fails:
1. Revert `src/tui/index.js` changes
2. Keep legacy Spinner in `src/tui.js`
3. Remove `src/tui/components/progress.js`
4. Remove `test/progress-test.js`
5. Document why migration failed

---

## 📅 7. Execution Timeline

### Phase 1: Preparation (30 minutes)
- [ ] Review this execution plan
- [ ] Set up test environment
- [ ] Verify existing tests pass

### Phase 2: Implementation (2 hours)
- [ ] Create `src/tui/components/progress.js`
- [ ] Implement Spinner class
- [ ] Implement ProgressBar class (optional, can defer)
- [ ] Update `src/tui/index.js` barrel

### Phase 3: Testing (1 hour)
- [ ] Create `test/progress-test.js`
- [ ] Write 30+ unit tests
- [ ] Run tests, fix failures
- [ ] Test backward compatibility

### Phase 4: Validation (30 minutes)
- [ ] Run `scripts/validate-migration.js`
- [ ] Test in `src/tui-app.js` context
- [ ] Verify no regression in existing functionality

### Phase 5: Documentation (30 minutes)
- [ ] Update `PHASE2_CURRENT_STATUS.md`
- [ ] Create `SPINNER_MIGRATION_COMPLETE.md`
- [ ] Update migration checklist

**Total Estimated Time:** 4-5 hours

---

## 📝 8. Code Review Checklist

Before submitting:
- [ ] No `process.stderr.write()` in render path
- [ ] No `process.stdout.write()` anywhere
- [ ] All intervals cleared in `unmount()`
- [ ] Backward-compatible API preserved
- [ ] 30+ tests passing
- [ ] Validation script passes
- [ ] No circular dependencies
- [ ] Code follows DRY principle
- [ ] No YAGNI violations
- [ ] Proper error handling
- [ ] JSDoc comments on public methods
- [ ] File under 600 lines

---

## 🎉 9. Definition of Done

Migration is complete when:
1. ✅ `src/tui/components/progress.js` exists with Spinner class
2. ✅ Spinner extends Component
3. ✅ No anti-patterns (direct writes, manual resize, ANSI.moveUp)
4. ✅ `test/progress-test.js` exists with 30+ passing tests
5. ✅ `scripts/validate-migration.js` reports Spinner as migrated
6. ✅ Existing Spinner usage in `src/tui-app.js` still works
7. ✅ Both TTY and non-TTY modes tested
8. ✅ Memory cleanup verified (no interval leaks)

---

## 🐶 10. Max's Notes

Hey Adam! Here's the plan, laid out nice and neat. 🎯

**Key insight:** The Spinner is a leaf component with no children, so it's actually pretty straightforward. The tricky part is the animation — we need to make sure the interval is properly managed in the lifecycle.

**Pro tip:** Test the `unmount()` cleanup thoroughly. Nothing worse than a memory leak from forgotten intervals. 🧹

**Watch out for:** The non-TTY mode. The legacy Spinner writes once and returns, while the TTY mode animates. Make sure both paths are tested.

**Fun fact:** This migration unblocks ProgressBar (same patterns) and eventually LiveProgress (more complex, but builds on this). So you're not just migrating one component — you're building the playbook for the whole Stage 2!

Let's get this done! 🚀

---

*Generated by Max 🐶 — "All bark, all byte!"*  
*Plan version: 1.0*  
*Ready for execution: Yes*