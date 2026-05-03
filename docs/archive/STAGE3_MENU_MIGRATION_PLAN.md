# Stage 3: SelectMenu & CheckboxMenu Migration Plan

> **Generated:** 2025-06-01 by Max 🐶  
> **Purpose:** Detailed execution plan for migrating interactive menu components  
> **Status:** ✅ Complete  
> **Target:** `src/tui/components/menu.js`  
> **Dependencies:** TextInput ✅, Box ✅, Spinner ✅, ProgressBar ✅

---

## 📋 Executive Summary

This plan details the migration of `SelectMenu` and `CheckboxMenu` from static classes in `src/tui.js` to modern `Component` subclasses following the established architecture patterns. Both components share similar navigation patterns and can be migrated together in a single file.

**Key Challenges:**
1. Both components use direct `processStdout.write()` calls that must be replaced with VirtualScreen rendering
2. Must maintain backward compatibility with existing static `run()` methods
3. Both components handle complex keyboard navigation (arrow keys, space, enter, escape, 'a' for all)
4. Must integrate with the Component lifecycle (mount/unmount) and event handling system

**Estimated Effort:** 4 days (2 days per component, accounting for shared patterns)

---

## 🎯 Success Criteria

### Functional Requirements
- [ ] `SelectMenu.run()` maintains identical API and behavior
- [ ] `CheckboxMenu.run()` maintains identical API and behavior
- [ ] Both components extend `Component` base class
- [ ] Both components work with `VirtualScreen` rendering
- [ ] Both components handle keyboard navigation correctly
- [ ] Non-TTY fallback behavior preserved
- [ ] Terminal resize handling preserved

### Technical Requirements
- [ ] No direct `processStdout.write()` calls in component methods (except static `run()`)
- [ ] Proper mount/unmount lifecycle management
- [ ] State management via `setState()` method
- [ ] Event handling via `handleKey()` method
- [ ] Rendering via `render(screen, ctx)` method

### Quality Requirements
- [ ] 100% backward compatibility maintained
- [ ] All existing tests pass
- [ ] New unit tests added (target: 40+ tests)
- [ ] Performance equivalent or better than original
- [ ] Memory leak prevention (proper cleanup)

---

## 📁 Files to Create/Modify

### New Files
| File | Purpose | Estimated Lines |
|------|---------|-----------------|
| `src/tui/components/menu.js` | SelectMenu & CheckboxMenu components | 400-500 |
| `test/menu-test.js` | Unit tests for menu components | 500-600 |

### Modified Files
| File | Changes | Estimated Changes |
|------|---------|-------------------|
| `src/tui/index.js` | Add exports for new components | +4 lines |
| `src/tui.js` | Add re-exports for backward compatibility | +2 lines |

---

## 🏗️ Architecture Analysis

### Current Implementation (src/tui.js)

**SelectMenu (lines 569-663):**
- Static `run()` method with async/await pattern
- Direct `processStdout.write()` for rendering
- Uses `KeyReader` for keyboard input
- Handles: up/down arrows, enter, escape, 'q'
- Tracks `selected` index and `lineCount`
- Non-TTY fallback: returns first actionable item

**CheckboxMenu (lines 666-754):**
- Static `run()` method with async/await pattern
- Direct `processStdout.write()` for rendering
- Uses `KeyReader` for keyboard input
- Handles: up/down arrows, space (toggle), enter (confirm), escape (cancel), 'a' (all/none)
- Tracks `selected` index, `checked[]` array, and `lineCount`
- Non-TTY fallback: returns items checked by default

### Target Architecture (Component Pattern)

**Component Lifecycle:**
1. `constructor(options)` - Initialize with configuration
2. `mount()` - Setup KeyReader, register event handlers
3. `handleKey(key)` - Process keyboard input, update state
4. `render(screen, ctx)` - Write to VirtualScreen
5. `unmount()` - Cleanup KeyReader, remove event handlers

**Key Differences:**
- No direct stdout writes in component methods
- State changes trigger re-render via `setState()`
- Rendering is declarative (screen.setLine()) vs imperative (stdout.write())
- Lifecycle managed by parent component/coordinator

---

## 📅 Detailed Execution Plan

### Phase 1: Foundation Setup (0.5 day)

#### Task 1.1: Create menu.js skeleton
**Agent:** Implementation Agent  
**Files:** `src/tui/components/menu.js`  
**Dependencies:** None

**Subtasks:**
1. Create file with module header and imports
2. Import `Component` from `../core/component.js`
3. Import `colorize`, `stripAnsi` from `../../utils.js`
4. Import `stdin/stdout` from `node:process`
5. Import `KeyReader` from `../../tui.js` (or duplicate minimal implementation)
6. Create `SelectMenu` class extending `Component`
7. Create `CheckboxMenu` class extending `Component`

**Acceptance Criteria:**
- [ ] File compiles without errors
- [ ] Classes properly extend Component
- [ ] Imports are correct and minimal

#### Task 1.2: Define class structure
**Agent:** Implementation Agent  
**Files:** `src/tui/components/menu.js`  
**Dependencies:** Task 1.1

**Subtasks:**
1. Define private fields for SelectMenu:
   - `#title`, `#items`, `#color`, `#selected`, `#complete`, `#result`, `#reader`
2. Define private fields for CheckboxMenu:
   - `#title`, `#items`, `#color`, `#selected`, `#checked`, `#complete`, `#result`, `#reader`
3. Define constructor with options validation
4. Define readonly getters for public properties
5. Define `mount()` and `unmount()` lifecycle methods

**Acceptance Criteria:**
- [ ] All private fields defined with proper types
- [ ] Constructor validates inputs
- [ ] Public API matches requirements

### Phase 2: SelectMenu Implementation (1 day)

#### Task 2.1: Implement SelectMenu constructor & state
**Agent:** Implementation Agent  
**Files:** `src/tui/components/menu.js`  
**Dependencies:** Task 1.2

**Subtasks:**
1. Implement constructor with options destructuring
2. Initialize `#selected = 0`
3. Initialize `#complete = false`
4. Initialize `#result = null`
5. Initialize `#reader = null`
6. Handle non-TTY case in constructor (set complete immediately)

**Code Pattern:**
```javascript
constructor(options = {}) {
  super(options)
  this.#title = options?.title || ''
  this.#items = options?.items || []
  this.#color = options?.color !== false
  this.#selected = 0
  this.#complete = false
  this.#result = null
  this.#reader = null
  
  // Non-TTY: return first actionable item
  if (!processStdin.isTTY || !processStdout.isTTY) {
    const first = this.#items.find(i => !i.value?.startsWith('act:') && i.value !== 'none')
    this.#result = first ? first.value : (this.#items.length > 0 ? this.#items[0].value : null)
    this.#complete = true
  }
}
```

**Acceptance Criteria:**
- [ ] Constructor properly initializes all state
- [ ] Non-TTY handling works correctly
- [ ] State is encapsulated in private fields

#### Task 2.2: Implement SelectMenu lifecycle
**Agent:** Implementation Agent  
**Files:** `src/tui/components/menu.js`  
**Dependencies:** Task 2.1

**Subtasks:**
1. Implement `mount()` method:
   - Call `super.mount()`
   - Create `KeyReader` instance if TTY
   - Set `#reader` reference
2. Implement `unmount()` method:
   - Destroy `KeyReader` if exists
   - Set `#reader = null`
   - Call `super.unmount()`

**Code Pattern:**
```javascript
mount() {
  super.mount()
  if (processStdin.isTTY && processStdout.isTTY) {
    this.#reader = new KeyReader()
  }
}

unmount() {
  if (this.#reader) {
    this.#reader.destroy()
    this.#reader = null
  }
  super.unmount()
}
```

**Acceptance Criteria:**
- [ ] KeyReader created on mount (TTY only)
- [ ] KeyReader destroyed on unmount
- [ ] No memory leaks

#### Task 2.3: Implement SelectMenu key handling
**Agent:** Implementation Agent  
**Files:** `src/tui/components/menu.js`  
**Dependencies:** Task 2.2

**Subtasks:**
1. Implement `handleKey(key)` method
2. Handle 'up' arrow: decrement selected (wrap around)
3. Handle 'down' arrow: increment selected (wrap around)
4. Handle 'return': set result to selected item value, mark complete
5. Handle 'escape'/'q': cancel, mark complete with null result
6. Call `setState()` after each state change
7. Return `true` if key was handled, `false` otherwise

**Code Pattern:**
```javascript
handleKey(key) {
  if (this.#complete) return false
  
  switch (key.name) {
    case 'up': {
      this.#selected = (this.#selected - 1 + this.#items.length) % this.#items.length
      this.setState({ selected: this.#selected })
      return true
    }
    case 'down': {
      this.#selected = (this.#selected + 1) % this.#items.length
      this.setState({ selected: this.#selected })
      return true
    }
    case 'return': {
      this.#result = this.#items[this.#selected].value
      this.#complete = true
      this.setState({ complete: true, result: this.#result })
      return true
    }
    case 'escape':
    case 'q': {
      this.#result = null
      this.#complete = true
      this.setState({ complete: true, result: null })
      return true
    }
    default:
      return false
  }
}
```

**Acceptance Criteria:**
- [ ] All key bindings work correctly
- [ ] State updates trigger re-render
- [ ] Complete state properly set

#### Task 2.4: Implement SelectMenu rendering
**Agent:** Implementation Agent  
**Files:** `src/tui/components/menu.js`  
**Dependencies:** Task 2.3

**Subtasks:**
1. Implement `render(screen, ctx)` method
2. Calculate start row from `ctx.bounds.row`
3. Render title if present
4. Render each item with selection indicator
5. Render help text at bottom
6. Use `screen.setLine()` for each line
7. Apply colors using `colorize()` helper

**Code Pattern:**
```javascript
render(screen, ctx) {
  const c = colorize(this.#color)
  const startRow = ctx?.bounds?.row ?? 0
  let row = startRow
  
  // Title
  if (this.#title) {
    screen.setLine(row, c.bold(this.#title))
    row++
  }
  
  // Items
  for (let i = 0; i < this.#items.length; i++) {
    const item = this.#items[i]
    const marker = i === this.#selected ? c.cyan('▶') : ' '
    const label = i === this.#selected ? c.bold(item.label) : item.label
    const desc = item.description ? ` ${c.dim(item.description)}` : ''
    screen.setLine(row, `${marker} ${label}${desc}`)
    row++
  }
  
  // Help text
  screen.setLine(row + 1, c.dim('[↑↓ navigate] [Enter select] [q quit]'))
}
```

**Acceptance Criteria:**
- [ ] Rendering matches original visual output
- [ ] Colors applied correctly
- [ ] Selection indicator visible
- [ ] Help text displayed

#### Task 2.5: Implement SelectMenu static run() method
**Agent:** Implementation Agent  
**Files:** `src/tui/components/menu.js`  
**Dependencies:** Task 2.4

**Subtasks:**
1. Implement `static async run(options)` method
2. Maintain identical API signature
3. Handle non-TTY case (return early)
4. Create component instance
5. Setup render loop (similar to original)
6. Wait for completion
7. Cleanup and return result

**Code Pattern:**
```javascript
static async run(options = {}) {
  const { title = '', items = [], color = true } = options
  
  // Non-TTY: return first actionable item
  if (!processStdin.isTTY || !processStdout.isTTY) {
    const first = items.find(i => !i.value?.startsWith('act:') && i.value !== 'none')
    return first ? first.value : (items.length > 0 ? items[0].value : null)
  }
  
  const menu = new SelectMenu({ title, items, color })
  menu.mount()
  
  const reader = new KeyReader()
  let selected = 0
  let lineCount = 0
  
  const render = () => {
    // ... original render logic using processStdout.write
  }
  
  // Initial render
  processStdout.write(render())
  
  // Main loop
  let result = null
  let done = false
  
  while (!done) {
    const key = await reader.readKey()
    
    switch (key.name) {
      case 'up':
        selected = (selected - 1 + items.length) % items.length
        processStdout.write(ANSI.moveUp(lineCount))
        processStdout.write(render())
        break
      case 'down':
        selected = (selected + 1) % items.length
        processStdout.write(ANSI.moveUp(lineCount))
        processStdout.write(render())
        break
      case 'return':
        result = items[selected].value
        done = true
        break
      case 'escape':
      case 'q':
        done = true
        break
    }
  }
  
  // Cleanup
  reader.destroy()
  menu.unmount()
  return result
}
```

**Acceptance Criteria:**
- [ ] API matches original exactly
- [ ] Behavior identical to original
- [ ] Proper cleanup on completion

### Phase 3: CheckboxMenu Implementation (1 day)

#### Task 3.1: Implement CheckboxMenu constructor & state
**Agent:** Implementation Agent  
**Files:** `src/tui/components/menu.js`  
**Dependencies:** Task 2.5

**Subtasks:**
1. Implement constructor with options destructuring
2. Initialize `#selected = 0`
3. Initialize `#checked` array (clone from items)
4. Initialize `#complete = false`
5. Initialize `#result = null`
6. Initialize `#reader = null`
7. Handle non-TTY case (return checked items)

**Code Pattern:**
```javascript
constructor(options = {}) {
  super(options)
  this.#title = options?.title || ''
  this.#items = options?.items || []
  this.#color = options?.color !== false
  this.#selected = 0
  this.#checked = this.#items.map(i => !!i.checked)
  this.#complete = false
  this.#result = null
  this.#reader = null
  
  // Non-TTY: return items checked by default
  if (!processStdin.isTTY || !processStdout.isTTY) {
    this.#result = this.#items.filter((_, i) => this.#checked[i]).map(i => i.value)
    this.#complete = true
  }
}
```

**Acceptance Criteria:**
- [ ] Checked array properly cloned
- [ ] Non-TTY handling works correctly
- [ ] State encapsulated properly

#### Task 3.2: Implement CheckboxMenu lifecycle
**Agent:** Implementation Agent  
**Files:** `src/tui/components/menu.js`  
**Dependencies:** Task 3.1

**Subtasks:**
1. Implement `mount()` method (same pattern as SelectMenu)
2. Implement `unmount()` method (same pattern as SelectMenu)

**Acceptance Criteria:**
- [ ] Lifecycle methods properly implemented
- [ ] Resource cleanup handled

#### Task 3.3: Implement CheckboxMenu key handling
**Agent:** Implementation Agent  
**Files:** `src/tui/components/menu.js`  
**Dependencies:** Task 3.2

**Subtasks:**
1. Implement `handleKey(key)` method
2. Handle 'up'/'down' arrows (same as SelectMenu)
3. Handle 'space': toggle checked state at selected index
4. Handle 'return': return array of checked item values
5. Handle 'escape': cancel, return null
6. Handle 'a': toggle all items (if all checked, uncheck all; otherwise check all)
7. Call `setState()` after each state change

**Code Pattern:**
```javascript
handleKey(key) {
  if (this.#complete) return false
  
  switch (key.name) {
    case 'up': {
      this.#selected = (this.#selected - 1 + this.#items.length) % this.#items.length
      this.setState({ selected: this.#selected })
      return true
    }
    case 'down': {
      this.#selected = (this.#selected + 1) % this.#items.length
      this.setState({ selected: this.#selected })
      return true
    }
    case 'space': {
      this.#checked[this.#selected] = !this.#checked[this.#selected]
      this.setState({ checked: [...this.#checked] })
      return true
    }
    case 'return': {
      this.#result = this.#items
        .filter((_, i) => this.#checked[i])
        .map(i => i.value)
      this.#complete = true
      this.setState({ complete: true, result: this.#result })
      return true
    }
    case 'escape': {
      this.#result = null
      this.#complete = true
      this.setState({ complete: true, result: null })
      return true
    }
    case 'a': {
      const allChecked = this.#checked.every(Boolean)
      this.#checked = this.#checked.map(() => !allChecked)
      this.setState({ checked: [...this.#checked] })
      return true
    }
    default:
      return false
  }
}
```

**Acceptance Criteria:**
- [ ] Space toggle works correctly
- [ ] 'a' key toggles all properly
- [ ] Return provides correct checked values

#### Task 3.4: Implement CheckboxMenu rendering
**Agent:** Implementation Agent  
**Files:** `src/tui/components/menu.js`  
**Dependencies:** Task 3.3

**Subtasks:**
1. Implement `render(screen, ctx)` method
2. Calculate start row from `ctx.bounds.row`
3. Render title if present
4. Render each item with checkbox indicator
5. Render dynamic help text (all/none based on state)
6. Use `screen.setLine()` for each line

**Code Pattern:**
```javascript
render(screen, ctx) {
  const c = colorize(this.#color)
  const startRow = ctx?.bounds?.row ?? 0
  let row = startRow
  
  // Title
  if (this.#title) {
    screen.setLine(row, c.bold(this.#title))
    row++
  }
  
  // Items
  for (let i = 0; i < this.#items.length; i++) {
    const item = this.#items[i]
    const marker = i === this.#selected ? c.cyan('▶') : ' '
    const checkbox = this.#checked[i] ? c.green('x') : ' '
    const label = i === this.#selected ? c.bold(item.label) : item.label
    const desc = item.description ? ` ${c.dim(item.description)}` : ''
    screen.setLine(row, `${marker} [${checkbox}] ${label}${desc}`)
    row++
  }
  
  // Dynamic help text
  const allChecked = this.#checked.every(Boolean)
  const toggleHint = allChecked ? 'none' : 'all'
  screen.setLine(row + 1, 
    c.dim(`[↑↓ navigate] [Space toggle] [a ${toggleHint}] [Enter confirm] [Esc cancel]`))
}
```

**Acceptance Criteria:**
- [ ] Checkboxes rendered correctly
- [ ] Selection indicator visible
- [ ] Dynamic help text updates

#### Task 3.5: Implement CheckboxMenu static run() method
**Agent:** Implementation Agent  
**Files:** `src/tui/components/menu.js`  
**Dependencies:** Task 3.4

**Subtasks:**
1. Implement `static async run(options)` method
2. Maintain identical API signature
3. Handle non-TTY case
4. Create component instance
5. Setup render loop
6. Handle all key bindings
7. Cleanup and return result

**Acceptance Criteria:**
- [ ] API matches original exactly
- [ ] Behavior identical to original
- [ ] Proper cleanup

### Phase 4: Integration & Exports (0.5 day)

#### Task 4.1: Update src/tui/index.js exports
**Agent:** Integration Agent  
**Files:** `src/tui/index.js`  
**Dependencies:** Tasks 2.5, 3.5

**Subtasks:**
1. Add import for SelectMenu and CheckboxMenu from './components/menu.js'
2. Add exports for both components
3. Ensure backward compatibility exports remain

**Code Changes:**
```javascript
// Add to Migrated Components section
export { SelectMenu, CheckboxMenu } from './components/menu.js'
```

**Acceptance Criteria:**
- [ ] Components accessible from tui/index.js
- [ ] Existing imports still work

#### Task 4.2: Update src/tui.js backward compatibility
**Agent:** Integration Agent  
**Files:** `src/tui.js`  
**Dependencies:** Task 4.1

**Subtasks:**
1. Add re-exports from './tui/components/menu.js'
2. Maintain existing SelectMenu and CheckboxMenu exports
3. Add comments indicating migration

**Code Changes:**
```javascript
// Add after TextInput/confirm re-exports section
// ───────────────────────────────────────────────────────────────────────────────
//  5. SelectMenu & CheckboxMenu — migrated to src/tui/components/menu.js
// ───────────────────────────────────────────────────────────────────────────────

// Re-export from migrated component for backward compatibility
export { SelectMenu, CheckboxMenu } from './tui/components/menu.js'
```

**Acceptance Criteria:**
- [ ] Backward compatibility maintained
- [ ] No duplicate class definitions
- [ ] Deprecation comments added

### Phase 5: Testing (1 day)

#### Task 5.1: Create test/menu-test.js
**Agent:** Testing Agent  
**Files:** `test/menu-test.js`  
**Dependencies:** Tasks 2.5, 3.5

**Subtasks:**
1. Create test file with module imports
2. Add test utilities (test runner, assertions)
3. Organize tests into logical groups

**Test Structure:**
```javascript
// ═══════════════════════════════════════════════════════════════════════════════
// 1. Module Exports
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// 2. SelectMenu - Inheritance
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// 3. SelectMenu - Constructor & State
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// 4. SelectMenu - Key Handling
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// 5. SelectMenu - Rendering
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// 6. SelectMenu - Static run() Method
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// 7. CheckboxMenu - Inheritance
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// 8. CheckboxMenu - Constructor & State
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// 9. CheckboxMenu - Key Handling
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// 10. CheckboxMenu - Rendering
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// 11. CheckboxMenu - Static run() Method
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// 12. Backward Compatibility
// ═══════════════════════════════════════════════════════════════════════════════
```

**Acceptance Criteria:**
- [ ] Test file created
- [ ] Test groups organized logically
- [ ] Test utilities ready

#### Task 5.2: Write SelectMenu tests
**Agent:** Testing Agent  
**Files:** `test/menu-test.js`  
**Dependencies:** Task 5.1

**Subtasks:**
1. Write inheritance tests (extends Component)
2. Write constructor tests (options parsing, non-TTY)
3. Write state management tests (getters, setState)
4. Write lifecycle tests (mount/unmount, KeyReader)
5. Write key handling tests (up/down/return/escape/q)
6. Write rendering tests (VirtualScreen output)
7. Write static run() tests (backward compatibility)

**Test Count Target:** 20+ tests for SelectMenu

**Acceptance Criteria:**
- [ ] All SelectMenu tests pass
- [ ] Edge cases covered
- [ ] Error conditions tested

#### Task 5.3: Write CheckboxMenu tests
**Agent:** Testing Agent  
**Files:** `test/menu-test.js`  
**Dependencies:** Task 5.2

**Subtasks:**
1. Write inheritance tests
2. Write constructor tests (checked array cloning)
3. Write state management tests
4. Write lifecycle tests
5. Write key handling tests (space, 'a', return with multiple checks)
6. Write rendering tests (checkbox display)
7. Write static run() tests

**Test Count Target:** 20+ tests for CheckboxMenu

**Acceptance Criteria:**
- [ ] All CheckboxMenu tests pass
- [ ] Multi-select behavior verified
- [ ] Toggle all functionality tested

#### Task 5.4: Run existing test suite
**Agent:** Testing Agent  
**Files:** All test files  
**Dependencies:** Tasks 5.2, 5.3

**Subtasks:**
1. Run `node test/box-test.js`
2. Run `node test/input-test.js`
3. Run `node test/progress-test.js`
4. Run `node test/menu-test.js`
5. Run `node test/self-test.js`
6. Run `node scripts/validate-migration.js`

**Acceptance Criteria:**
- [ ] All existing tests pass
- [ ] No regressions introduced
- [ ] Migration validation passes

### Phase 6: Documentation & Polish (0.5 day)

#### Task 6.1: Update documentation
**Agent:** Documentation Agent  
**Files:** Various  
**Dependencies:** Task 5.4

**Subtasks:**
1. Update PHASE2_CURRENT_STATUS.md
2. Update PHASE2_NEXT_STEPS_SUMMARY.md
3. Create STAGE3_MIGRATION_COMPLETE.md
4. Update README.md if needed
5. Add JSDoc comments to new code

**Acceptance Criteria:**
- [ ] Documentation updated
- [ ] Migration status accurate
- [ ] Usage examples provided

#### Task 6.2: Final validation
**Agent:** Validation Agent  
**Files:** All  
**Dependencies:** Task 6.1

**Subtasks:**
1. Run full test suite
2. Test in real terminal environment
3. Verify backward compatibility with existing usage
4. Performance comparison (optional)
5. Memory leak check

**Acceptance Criteria:**
- [ ] All tests pass
- [ ] Visual output matches original
- [ ] No performance regression
- [ ] No memory leaks

---

## 🔗 Dependency Graph

```
Phase 1: Foundation Setup
    └── Task 1.1: Create menu.js skeleton
        └── Task 1.2: Define class structure

Phase 2: SelectMenu Implementation (depends on Phase 1)
    └── Task 2.1: Constructor & state
        └── Task 2.2: Lifecycle
            └── Task 2.3: Key handling
                └── Task 2.4: Rendering
                    └── Task 2.5: Static run()

Phase 3: CheckboxMenu Implementation (depends on Phase 2)
    └── Task 3.1: Constructor & state
        └── Task 3.2: Lifecycle
            └── Task 3.3: Key handling
                └── Task 3.4: Rendering
                    └── Task 3.5: Static run()

Phase 4: Integration (depends on Phases 2 & 3)
    ├── Task 4.1: Update index.js
    └── Task 4.2: Update tui.js

Phase 5: Testing (depends on Phases 2, 3, & 4)
    ├── Task 5.1: Test structure
    │   ├── Task 5.2: SelectMenu tests
    │   └── Task 5.3: CheckboxMenu tests
    └── Task 5.4: Run full test suite

Phase 6: Documentation (depends on Phase 5)
    ├── Task 6.1: Update docs
    └── Task 6.2: Final validation
```

---

## 👥 Agent Assignments

### Primary Agents
| Agent | Role | Responsibilities |
|-------|------|------------------|
| **Implementation Agent** | Core development | Create menu.js, implement components |
| **Testing Agent** | Quality assurance | Write tests, run test suites |
| **Integration Agent** | System integration | Update exports, maintain compatibility |
| **Documentation Agent** | Documentation | Update docs, add comments |
| **Validation Agent** | Final validation | End-to-end testing, performance |

### Agent Collaboration
- **Implementation Agent** works on Phases 1-3
- **Integration Agent** works on Phase 4 (after Implementation)
- **Testing Agent** works on Phase 5 (parallel with Integration)
- **Documentation Agent** works on Phase 6 (after Testing)
- **Validation Agent** works on Phase 6 (after Documentation)

---

## ⚠️ Risks & Mitigations

### High Risk
1. **KeyReader conflicts** - Multiple KeyReader instances
   - *Mitigation:* Use KeyReader singleton pattern, destroy previous on create
   - *Status:* Pattern established in TextInput migration ✅

2. **Rendering differences** - Visual output may differ
   - *Mitigation:* Side-by-side comparison testing
   - *Status:* Will validate in Phase 5

### Medium Risk
3. **State synchronization** - Component state vs static run() state
   - *Mitigation:* Keep static run() independent, don't mix patterns
   - *Status:* Pattern established in other migrations ✅

4. **Performance regression** - VirtualScreen overhead
   - *Mitigation:* Differential rendering, minimize allocations
   - *Status:* VirtualScreen designed for performance ✅

### Low Risk
5. **Test coverage gaps** - Missing edge cases
   - *Mitigation:* Follow established test patterns, 40+ tests target
   - *Status:* Test structure defined ✅

---

## 📊 Success Metrics

### Quantitative
- [ ] 100% backward compatibility (API match)
- [ ] 40+ unit tests passing
- [ ] 0 regressions in existing tests
- [ ] <5% performance difference (optional)

### Qualitative
- [ ] Code follows established patterns
- [ ] Clear separation of concerns
- [ ] Proper encapsulation
- [ ] Good documentation

---

## 📚 References

### Existing Migrations (Patterns to Follow)
- `src/tui/components/box.js` - Box component
- `src/tui/components/input.js` - TextInput & confirm
- `src/tui/components/progress.js` - Spinner & ProgressBar

### Core Architecture
- `src/tui/core/component.js` - Base class
- `src/tui/core/virtual-screen.js` - Rendering target
- `src/tui/core/renderer.js` - Terminal renderer

### Tests
- `test/box-test.js` - Box tests (36/36)
- `test/input-test.js` - TextInput tests (36/36)
- `test/progress-test.js` - Progress tests

---

## 📝 Notes

1. **KeyReader Usage:** The static `run()` methods will continue to use KeyReader directly for backward compatibility. The Component `handleKey()` method will receive keys from the parent component/coordinator.

2. **Rendering Strategy:** The static `run()` methods will use direct stdout writes (like original). The Component `render()` method will use VirtualScreen (for new architecture).

3. **State Isolation:** Component instance state and static run() state are completely isolated. They serve different use cases.

4. **Future Integration:** Once migrated, the Component versions can be used in the new TUI architecture with RenderCoordinator. The static versions remain for legacy code.

---

**Total Estimated Effort:** 4 days  
**Critical Path:** Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6  
**Parallel Opportunities:** Phase 4 (Integration) can start as soon as individual components are complete

---

## ✅ Implementation Summary (Complete)

### Files Created
| File | Lines | Purpose |
|------|-------|---------|
| `src/tui/components/menu.js` | 380 | SelectMenu & CheckboxMenu Component classes |
| `test/menu-test.js` | 520 | 90 comprehensive unit tests |

### Files Modified
| File | Changes |
|------|---------|
| `src/tui/index.js` | Added SelectMenu, CheckboxMenu exports from `./components/menu.js` |
| `src/tui.js` | Replaced inline SelectMenu/CheckboxMenu with re-exports from `./tui/components/menu.js` |
| `PHASE2_CURRENT_STATUS.md` | Updated status to 90% complete (9/10 components) |

### Architecture Design

**Component Lifecycle (VirtualScreen rendering):**
- `mount()` → Sets up KeyReader and resize handler (or resolves immediately for non-TTY)
- `handleKey(key)` → Updates internal state (`selected`, `checked`, `complete`)
- `render(screen, ctx)` → Declaratively writes to VirtualScreen via `screen.setLine()`
- `unmount()` → Cleans up KeyReader and event subscriptions

**Backward-Compatible Static Methods:**
- `static async run(options)` → Retains original direct-processStdout-write pattern
- Uses `KeyReader` for raw keypress input, `onResize` for terminal resize
- Identical API and behavior as the original implementations
- These methods intentionally use ANSI escape codes for backward compatibility

### Test Results
- **90/90 tests passing** in `test/menu-test.js`
- All existing tests (box-test, progress-test, self-test) still pass
- Tests cover: module exports, inheritance, properties, key handling, rendering, lifecycle, edge cases, backward compatibility

*Plan created by Max 🐶 - Let's migrate these menus!* 🐕