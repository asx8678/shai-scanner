# Phase 2 Execution Plan: Core Component Refactoring

> **Goal:** Migrate all existing components to use the new architecture while maintaining backward compatibility and eliminating flicker.

## 📋 Executive Summary

Phase 2 is the **biggest migration effort** — we need to refactor all existing TUI components to use the new `Component` base class, `VirtualScreen`, and `RenderCoordinator`. The key challenges are:

1. **Backward Compatibility** - Existing code imports directly from `tui.js`
2. **Mixed Rendering Strategies** - Components currently use 3+ different rendering approaches
3. **Complex Dependencies** - Some components (like `FindingsBrowser`) are composed of multiple smaller components
4. **Race Conditions** - Multiple resize handlers and animation timers need coordination

### Success Criteria
- ✅ All components use `Component` base class
- ✅ Zero direct `process.stdout.write()` / `process.stderr.write()` in components
- ✅ All components render to `VirtualScreen`
- ✅ Render batching eliminates flicker
- ✅ Backward compatibility maintained via re-exports
- ✅ Integration tests pass for all components

---

## 🔍 Component Analysis

### Current Component Inventory

| Component | Lines | Complexity | Dependencies | Flicker Risk |
|-----------|-------|------------|--------------|--------------|
| **Box** | ~50 | Low | None | None |
| **TextInput** | ~45 | Low | readline | None |
| **confirm** | ~60 | Low | TextInput | None |
| **Spinner** | ~80 | Medium | ANSI | Low |
| **ProgressBar** | ~50 | Medium | ANSI | Low |
| **SelectMenu** | ~100 | Medium | KeyReader, ANSI | Medium |
| **CheckboxMenu** | ~110 | Medium | KeyReader, ANSI | Medium |
| **FileBrowser** | ~400 | High | KeyReader, ANSI, fs | Low |
| **LiveProgress** | ~160 | High | ANSI, colorize | Medium |
| **FindingsBrowser** | ~650 | High | SelectMenu, CheckboxMenu, TextInput, Box | Medium |

### Dependency Graph

```
FindingsBrowser
  ├── SelectMenu
  ├── CheckboxMenu
  ├── TextInput
  └── Box

ScannerTUI (tui-app.js)
  ├── SelectMenu
  ├── CheckboxMenu
  ├── FileBrowser
  ├── LiveProgress
  ├── Spinner
  ├── Box
  ├── TextInput
  └── confirm
      └── TextInput
```

---

## 🎯 Migration Order

### Strategy: **Bottom-Up Dependency Injection**

Migrate leaf components first, then work up the dependency tree. This ensures:
1. Each component can be tested in isolation before moving to dependents
2. We can maintain backward compatibility at each step
3. Integration issues are caught early

### Recommended Order

#### **Stage 1: Simple Static Components (No Input)**
1. **Box** - Pure rendering, no state, no input
2. **TextInput** - Simple readline wrapper
3. **confirm** - Built on TextInput

**Why first:** Zero flicker risk, simple to migrate, builds confidence.

#### **Stage 2: Status Indicators (stderr)**
4. **Spinner** - Simple animation on stderr
5. **ProgressBar** - Simple animation on stderr

**Why next:** These write to stderr (not stdout), so they're isolated from the main rendering pipeline. Good for testing the `VirtualScreen` integration with stderr.

#### **Stage 3: Interactive Menus (stdout)**
6. **SelectMenu** - Single-select with keyboard navigation
7. **CheckboxMenu** - Multi-select with keyboard navigation

**Why here:** These are the most flicker-prone components. Migrating them will validate the core architecture.

#### **Stage 4: Complex Components**
8. **FileBrowser** - Complex virtual scrolling, async I/O
9. **LiveProgress** - Multi-line animated progress

**Why later:** These are complex and depend on proper resize handling.

#### **Stage 5: Composite Components**
10. **FindingsBrowser** - Depends on SelectMenu, CheckboxMenu, TextInput, Box

**Why last:** This component is a mini-app itself. It will be the integration test for all previous migrations.

---

## 📝 Detailed Migration Plans

### 1. Box Component

**Current Implementation:** Static box drawing utility, no state, no input.

**Migration Steps:**
1. Create `src/tui/components/box.js`
2. Extend `Component` base class
3. Move rendering logic to `render(screen, ctx)` method
4. Remove direct `process.stdout.write()` calls
5. Add backward-compatible static `draw()` method

**Key Changes:**
```javascript
// BEFORE: Static method that returns string
static draw({ title, content, width, padding }) { ... }

// AFTER: Component with render method + static helper
class Box extends Component {
  render(screen, ctx) { /* render to VirtualScreen */ }
  static draw({ title, content, width, padding }) { /* backward compat */ }
}
```

**Testing Strategy:**
- Unit test: Render to `VirtualScreen`, verify output matches expected
- Visual test: Capture snapshot, compare with baseline
- Regression test: Ensure static `draw()` still works

---

### 2. TextInput Component

**Current Implementation:** Wraps Node.js `readline/promises` for single-line input.

**Migration Steps:**
1. Create `src/tui/components/input.js`
2. Extend `Component` base class
3. Handle keypresses in `handleKey()` method
4. Use `setState()` for input buffer updates
5. Maintain compatibility with existing `TextInput.run()` static method

**Key Changes:**
```javascript
// BEFORE: Static async method with internal readline
static async run(options) {
  const rl = createInterface({ input: processStdin, ... });
  // ... readline logic
}

// AFTER: Component with lifecycle
class TextInput extends Component {
  mount() { /* setup readline */ }
  unmount() { /* cleanup readline */ }
  handleKey(key) { /* update input buffer */ }
  render(screen, ctx) { /* render input line */ }
  static async run(options) { /* backward compat wrapper */ }
}
```

**Testing Strategy:**
- Unit test: Simulate keypresses, verify state updates
- Integration test: Test with real terminal input
- Backward compat test: Ensure `TextInput.run()` still works

---

### 3. confirm Component

**Current Implementation:** Simple yes/no prompt using TextInput.

**Migration Steps:**
1. Add to `src/tui/components/input.js`
2. Extend `Component` base class
3. Reuse `TextInput` component internally
4. Add validation logic for yes/no input

**Key Changes:**
```javascript
// BEFORE: Standalone async function
export async function confirm(question, defaultValue = true, options) { ... }

// AFTER: Component wrapping TextInput
export class ConfirmDialog extends Component {
  #textInput;
  constructor(options) {
    super();
    this.#textInput = new TextInput(options);
    this.addChild(this.#textInput);
  }
  render(screen, ctx) {
    // Render question + TextInput
  }
  static async run(options) { /* backward compat */ }
}
```

**Testing Strategy:**
- Unit test: Verify yes/no validation
- Integration test: Test with terminal input
- Backward compat test: Ensure `confirm()` still works

---

### 4. Spinner Component

**Current Implementation:** Simple braille animation on stderr.

**Migration Steps:**
1. Create `src/tui/components/progress.js`
2. Extend `Component` base class
3. Move animation timer to `mount()`/`unmount()` lifecycle
4. Use `setState()` for frame updates
5. Render to `VirtualScreen` (but still target stderr region)

**Key Changes:**
```javascript
// BEFORE: Direct stderr writes with interval
class Spinner {
  constructor(text) {
    this.#interval = setInterval(() => {
      processStderr.write(`\r${frame} ${text}`);
    }, 80);
  }
}

// AFTER: Component with lifecycle
class Spinner extends Component {
  mount() { this.#startAnimation(); }
  unmount() { this.#stopAnimation(); }
  render(screen, ctx) { screen.setLine(row, col, `${frame} ${text}`); }
  static create(text) { return new Spinner({ text }); }
}
```

**Testing Strategy:**
- Unit test: Verify animation frame cycling
- Visual test: Capture stderr output over time
- Performance test: Ensure no memory leaks from timers

---

### 5. ProgressBar Component

**Current Implementation:** Simple progress bar on stderr.

**Migration Steps:**
1. Add to `src/tui/components/progress.js`
2. Extend `Component` base class
3. Use `setState()` for progress updates
4. Render to `VirtualScreen`

**Key Changes:**
```javascript
// BEFORE: Direct stderr writes
class ProgressBar {
  update(progress) {
    processStderr.write(`\r[${'█'.repeat(width)}${'░'.repeat(remaining)}] ${percent}%`);
  }
}

// AFTER: Component with reactive updates
class ProgressBar extends Component {
  update(progress) { this.setState({ progress }); }
  render(screen, ctx) {
    const { progress } = this.state;
    screen.setLine(row, col, this.#renderBar(progress));
  }
}
```

**Testing Strategy:**
- Unit test: Verify progress bar rendering at 0%, 50%, 100%
- Visual test: Snapshot comparison
- Performance test: Rapid updates don't cause flicker

---

### 6. SelectMenu Component

**Current Implementation:** Single-select menu with line-count tracking.

**Migration Steps:**
1. Create `src/tui/components/menu.js`
2. Extend `Component` base class
3. Move key handling to `handleKey()` method
4. Use `setState()` for selection updates
5. Remove manual resize handling (coordinator handles it)

**Key Changes:**
```javascript
// BEFORE: Line-count tracking + manual resize
class SelectMenu {
  static async run(options) {
    let lineCount = 0;
    const render = () => { /* calculate lineCount */ };
    const unsubResize = onResize(() => {
      processStdout.write(ANSI.moveUp(lineCount));
      processStdout.write(render());
    });
  }
}

// AFTER: Component with virtual rendering
class SelectMenu extends Component {
  #items;
  #selectedIndex;
  handleKey(key) {
    if (key.name === 'up') {
      this.setState({ selectedIndex: ... });
      return true;
    }
  }
  render(screen, ctx) {
    // Render menu items to VirtualScreen
    ctx.height = rowCount; // Report height to coordinator
  }
  static async run(options) { /* backward compat wrapper */ }
}
```

**Testing Strategy:**
- Unit test: Simulate arrow keys, verify selection changes
- Visual test: Snapshot comparison
- Integration test: Test with `ScannerTUI`
- Flicker test: Rapid keypresses don't cause visual glitches

---

### 7. CheckboxMenu Component

**Current Implementation:** Multi-select menu with line-count tracking.

**Migration Steps:**
1. Add to `src/tui/components/menu.js`
2. Extend `Component` base class
3. Move key handling to `handleKey()` method
4. Use `setState()` for selection state updates

**Key Changes:**
```javascript
// BEFORE: Manual rendering with ANSI escapes
class CheckboxMenu {
  static async run(options) {
    let lineCount = 0;
    const render = () => { /* manual ANSI construction */ };
    processStdout.write(ANSI.moveUp(lineCount));
    processStdout.write(render());
  }
}

// AFTER: Component with virtual rendering
class CheckboxMenu extends Component {
  #selectedSet;
  handleKey(key) {
    if (key.name === 'space') {
      // Toggle selection
      this.setState({ selectedSet: newSet });
    }
  }
  render(screen, ctx) {
    // Render checkboxes to VirtualScreen
  }
}
```

**Testing Strategy:**
- Unit test: Simulate space/enter/arrow keys
- Visual test: Snapshot comparison
- Integration test: Test with `ScannerTUI`

---

### 8. FileBrowser Component

**Current Implementation:** Complex file browser with virtual scrolling and differential rendering.

**Migration Steps:**
1. Create `src/tui/components/browser.js`
2. Extend `Component` base class
3. Move async I/O to `mount()` lifecycle
4. Use `setState()` for directory changes, selection, scroll position
5. Remove manual differential rendering (VirtualScreen handles it)

**Key Changes:**
```javascript
// BEFORE: Complex differential rendering with manual line comparison
class FileBrowser {
  static async run(options) {
    let prevLines = [];
    const render = () => {
      // Compare with prevLines, only update changed lines
      for (let i = 0; i < newLines.length; i++) {
        if (old === line) {
          if (i < newLen - 1) processStdout.write('\x1b[1B');
        } else {
          processStdout.write(`\x1b[2K${line}`);
        }
      }
    };
  }
}

// AFTER: Component with virtual scrolling
class FileBrowser extends Component {
  #entries;
  #cursorPos;
  #scrollTop;
  async mount() { await this.#loadEntries(); }
  handleKey(key) { /* navigate, select, open directory */ }
  render(screen, ctx) {
    // Virtual scrolling - only render visible items
    const visible = this.#getVisibleItems(ctx.terminalSize.rows);
    for (const [i, entry] of visible) {
      screen.setLine(row, col, this.#renderEntry(entry));
    }
  }
}
```

**Testing Strategy:**
- Unit test: Simulate navigation, directory changes
- Visual test: Snapshot comparison
- Performance test: Large directories don't cause lag
- Integration test: Test with `ScannerTUI`

---

### 9. LiveProgress Component

**Current Implementation:** Multi-line progress display with animation.

**Migration Steps:**
1. Add to `src/tui/components/progress.js`
2. Extend `Component` base class
3. Move animation timer to `mount()`/`unmount()` lifecycle
4. Use `setState()` for phase updates and stats

**Key Changes:**
```javascript
// BEFORE: Manual resize handling + moveUp
class LiveProgress {
  constructor() {
    this.#unsubResize = onResize(() => this.render());
  }
  render() {
    processStderr.write(ANSI.moveUp(this.#lastHeight));
    for (const line of lines) {
      processStderr.write(`${ANSI.clearLine}${line}\n`);
    }
  }
}

// AFTER: Component with coordinated rendering
class LiveProgress extends Component {
  #phases;
  #stats;
  mount() { this.#startAnimation(); }
  unmount() { this.#stopAnimation(); }
  render(screen, ctx) {
    // Render all phases to VirtualScreen
    for (const phase of this.#phases) {
      screen.setLine(row, col, this.#renderPhase(phase));
    }
    // Render stats line
    ctx.height = rowCount;
  }
}
```

**Testing Strategy:**
- Unit test: Verify phase state transitions
- Visual test: Snapshot comparison
- Performance test: Animation doesn't cause flicker
- Integration test: Test with scanning operations

---

### 10. FindingsBrowser Component

**Current Implementation:** Complex composite component using SelectMenu, CheckboxMenu, TextInput, Box.

**Migration Steps:**
1. Create `src/tui/components/findings.js`
2. Extend `Component` base class
3. Use child components (already migrated in previous stages)
4. Move rendering logic to `render()` method
5. Coordinate child component rendering

**Key Changes:**
```javascript
// BEFORE: Directly uses other components with their static methods
class FindingsBrowser {
  async browse() {
    const action = await SelectMenu.run({ items: [...] });
    // ...
  }
}

// AFTER: Component tree with child components
class FindingsBrowser extends Component {
  #childComponents = {
    list: new SelectMenu({ ... }),
    filter: new CheckboxMenu({ ... }),
    search: new TextInput({ ... }),
  };
  
  constructor(findings) {
    super();
    for (const child of Object.values(this.#childComponents)) {
      this.addChild(child);
    }
  }
  
  render(screen, ctx) {
    // Render current view based on state
    if (this.state.view === 'list') {
      this.#childComponents.list.render(screen, ctx);
    }
  }
  
  handleKey(key) {
    // Delegate to appropriate child based on view
    return this.#currentChild.handleKey(key);
  }
}
```

**Testing Strategy:**
- Unit test: Test each sub-view independently
- Integration test: Test navigation between views
- Visual test: Snapshot comparison for each view
- Backward compat test: Ensure `browse()` method still works

---

## 🔄 ScannerTUI Migration

After all components are migrated, update `ScannerTUI` to use the new architecture.

### Migration Steps:

1. **Create `RenderCoordinator` instance**
```javascript
class ScannerTUI {
  #coordinator;
  
  async init() {
    this.#coordinator = new RenderCoordinator();
    this.#coordinator.initialize();
  }
}
```

2. **Replace direct component usage with component tree**
```javascript
// BEFORE: Each screen creates components directly
async #renderMainMenu() {
  const selection = await SelectMenu.run({ ... });
}

// AFTER: Screen methods manage component tree
async #renderMainMenu() {
  const menu = new SelectMenu({ ... });
  this.#coordinator.registerComponent(menu);
  
  return new Promise((resolve) => {
    menu.on('select', (value) => {
      this.#coordinator.unregisterComponent(menu);
      resolve(value);
    });
  });
}
```

3. **Remove manual resize handling**
```javascript
// BEFORE: Manual debounce + re-render
const debouncedResize = debounce(() => {
  this.#dispatchScreen();
}, 150);
const unsubResize = onResize(() => debouncedResize.trigger());

// AFTER: Coordinator handles resize automatically
// No manual resize handling needed
```

4. **Add proper screen transitions**
```javascript
// BEFORE: Just change screen name
navigateTo(screen) {
  this.currentScreen = screen;
}

// AFTER: Unmount old components, mount new ones
navigateTo(screen) {
  this.#unmountCurrentScreen();
  this.currentScreen = screen;
  this.#mountCurrentScreen();
}
```

---

## 🧪 Testing Strategy

### Test Pyramid

```
                    /\
                   /  \
                  / E2E\  ← Integration tests with ScannerTUI
                 /──────\
                /        \
               /Integration\  ← Component composition tests
              /────────────\
             /              \
            /    Unit Tests   \  ← Individual component tests
           /──────────────────\
          /                    \
         /  Visual Regression   \  ← Snapshot comparison tests
        /────────────────────────\
```

### Test Categories

#### 1. Unit Tests (Per Component)
- **Input simulation:** Test key handling with mock key events
- **State transitions:** Verify `setState()` updates trigger re-renders
- **Virtual rendering:** Capture `VirtualScreen` output, verify correctness
- **Edge cases:** Empty lists, long text, terminal resize

**Example Test:**
```javascript
test('SelectMenu handles arrow keys', async () => {
  const menu = new SelectMenu({ items: [{ label: 'A' }, { label: 'B' }] });
  const screen = new VirtualScreen(80, 24);
  
  menu.handleKey({ name: 'down' });
  menu.render(screen, { bounds: { row: 0, col: 0 }, terminalSize: { rows: 24, cols: 80 } });
  
  const output = captureScreen(screen);
  assert.ok(output.includes('▶ B')); // B is selected
});
```

#### 2. Integration Tests (Component Composition)
- **FindingsBrowser:** Test navigation between list, filter, search views
- **ScannerTUI screens:** Test screen transitions and data flow
- **Render batching:** Verify rapid updates don't cause flicker

**Example Test:**
```javascript
test('FindingsBrowser navigation works', async () => {
  const browser = new FindingsBrowser(mockFindings);
  const screen = new VirtualScreen(80, 24);
  
  // Mount and render initial view
  browser.mount();
  browser.render(screen, ...);
  
  // Simulate filter action
  browser.handleKey({ name: 'f' }); // Opens filter view
  browser.render(screen, ...);
  
  const output = captureScreen(screen);
  assert.ok(output.includes('Filter by severity'));
});
```

#### 3. Visual Regression Tests
- **Snapshot comparison:** Capture screen output, compare with baseline
- **Cross-platform:** Test on macOS, Linux, Windows terminals
- **Color modes:** Test with/without colors

**Example Test:**
```javascript
test('SelectMenu matches snapshot', async () => {
  const menu = new SelectMenu({ 
    items: [{ label: 'Option 1' }, { label: 'Option 2' }],
    color: false // Disable colors for reproducibility
  });
  
  const screen = new VirtualScreen(80, 24);
  menu.render(screen, ...);
  
  const snapshot = captureSnapshot(screen);
  const baseline = loadBaseline('select-menu.snapshot');
  
  assert.strictEqual(snapshot, baseline);
});
```

#### 4. Performance Tests
- **Render timing:** Measure render duration, ensure <16ms
- **Memory leaks:** Verify timers are cleaned up on unmount
- **Rapid updates:** Test 1000 updates/second don't cause flicker

**Example Test:**
```javascript
test('LiveProgress renders under 16ms', async () => {
  const progress = new LiveProgress();
  progress.mount();
  
  const start = performance.now();
  for (let i = 0; i < 100; i++) {
    progress.update('phase1', { detail: `file${i}.js` });
  }
  const duration = performance.now() - start;
  
  assert.ok(duration / 100 < 16, `Average render time: ${duration/100}ms`);
});
```

---

## 🔙 Backward Compatibility Strategy

### Re-export Barrel File

Update `src/tui.js` to re-export from new component files:

```javascript
// src/tui.js - Maintained as backward-compatible barrel

// Core
export { EventBus } from './tui/core/event-bus.js';
export { VirtualScreen } from './tui/core/virtual-screen.js';
export { Renderer } from './tui/core/renderer.js';
export { Component } from './tui/core/component.js';
export { RenderCoordinator } from './tui/core/render-coordinator.js';

// Components
export { Box } from './tui/components/box.js';
export { TextInput, ConfirmDialog, confirm } from './tui/components/input.js';
export { Spinner, ProgressBar, LiveProgress } from './tui/components/progress.js';
export { SelectMenu, CheckboxMenu } from './tui/components/menu.js';
export { FileBrowser } from './tui/components/browser.js';
export { FindingsBrowser } from './tui/components/findings.js';

// Utilities (unchanged)
export { ANSI, debounce, onResize, getTerminalSize } from './tui.js';
export { ScreenManager, KeyReader } from './tui.js';
export { cleanupTerminal, resetCleanupState } from './tui.js';
```

### Static Method Wrappers

Each component provides a static `run()` method for backward compatibility:

```javascript
class SelectMenu extends Component {
  // ... component implementation ...
  
  /**
   * Backward-compatible static method.
   * Creates a component, runs it, and returns the result.
   */
  static async run(options) {
    return new Promise((resolve) => {
      const menu = new SelectMenu(options);
      menu.mount();
      
      menu.on('select', (value) => {
        menu.unmount();
        resolve(value);
      });
      
      menu.on('cancel', () => {
        menu.unmount();
        resolve(null);
      });
    });
  }
}
```

### Feature Flag for Gradual Rollout

```javascript
// Environment variable to enable legacy rendering
const USE_LEGACY_TUI = process.env.SHAI_SCANNER_LEGACY_TUI === '1';

// In components:
render(screen, ctx) {
  if (USE_LEGACY_TUI) {
    // Fall back to old rendering strategy
    return this.#legacyRender();
  }
  
  // New virtual screen rendering
  this.#virtualRender(screen, ctx);
}
```

---

## 🚀 Implementation Timeline

### Week 1: Stage 1 - Simple Components
- [ ] **Day 1-2:** Box component
- [ ] **Day 3:** TextInput component
- [ ] **Day 4:** confirm component
- [ ] **Day 5:** Unit tests + integration test with ScannerTUI

### Week 2: Stage 2 - Status Indicators
- [ ] **Day 1-2:** Spinner component
- [ ] **Day 3:** ProgressBar component
- [ ] **Day 4:** Integration with LiveProgress
- [ ] **Day 5:** Performance testing

### Week 3: Stage 3 - Interactive Menus
- [ ] **Day 1-3:** SelectMenu component
- [ ] **Day 4-5:** CheckboxMenu component
- [ ] **Day 6-7:** Visual regression tests
- [ ] **Day 8:** Flicker testing

### Week 4: Stage 4 - Complex Components
- [ ] **Day 1-3:** FileBrowser component
- [ ] **Day 4-5:** LiveProgress component
- [ ] **Day 6-7:** Performance optimization
- [ ] **Day 8:** Cross-platform testing

### Week 5: Stage 5 - Composite Components
- [ ] **Day 1-3:** FindingsBrowser component
- [ ] **Day 4-5:** ScannerTUI integration
- [ ] **Day 6-7:** End-to-end testing
- [ ] **Day 8:** Documentation updates

### Week 6: Polish & Release
- [ ] **Day 1-2:** Bug fixes from testing
- [ ] **Day 3-4:** Performance tuning
- [ ] **Day 5:** Documentation
- [ ] **Day 6:** Release preparation

---

## ⚠️ Risk Mitigation

### Risk 1: Breaking Existing Code
**Mitigation:** 
- Maintain `tui.js` as backward-compatible barrel
- Static `run()` methods provide identical API
- Feature flag for gradual rollout

### Risk 2: Performance Regression
**Mitigation:**
- Render batching reduces I/O
- Differential rendering minimizes changes
- Performance benchmarks on every PR

### Risk 3: Missing Functionality
**Mitigation:**
- Comprehensive test suite before migration
- Side-by-side comparison of old/new rendering
- Manual testing checklist for each component

### Risk 4: Complex FindingsBrowser Migration
**Mitigation:**
- Migrate child components first
- Test each sub-view independently
- Keep existing `browse()` method interface

---

## 📊 Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Flicker on resize | Occasional | Zero | Manual testing |
| Flicker on state update | Rare | Zero | Automated tests |
| Full screen render time | ~50ms | <16ms | Performance benchmark |
| Differential render time | N/A | <5ms | Performance benchmark |
| Test coverage | 30% | 90% | Code coverage tool |
| Breaking changes | N/A | Zero | API compatibility tests |

---

## 📚 Documentation Updates

### Required Documentation
1. **Migration Guide** - For users importing from `tui.js`
2. **Component API Docs** - JSDoc comments for all public methods
3. **Architecture Guide** - How the new system works
4. **Troubleshooting Guide** - Common issues and solutions

### Documentation Files to Update
- `TUI_USAGE_GUIDE.md` - Add new architecture section
- `README.md` - Update TUI section
- `PHASE2_COMPLETE.md` - Create after migration
- `CHANGELOG.md` - Document breaking changes (if any)

---

## 🎉 Conclusion

Phase 2 is the most critical phase for eliminating flicker and establishing a maintainable architecture. By following this bottom-up migration strategy, we ensure:

1. **Zero Breaking Changes** - Backward compatibility maintained
2. **Incremental Testing** - Each component tested before moving to next
3. **Flicker Elimination** - VirtualScreen + RenderCoordinator solves root cause
4. **Maintainable Code** - Clean component hierarchy and lifecycle

**Next Step:** Start with Stage 1 (Box, TextInput, confirm) and build momentum!

---

*Generated by Max 🐶 — "All bark, all byte!"*