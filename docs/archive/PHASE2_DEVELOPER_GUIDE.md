# Phase 2 Developer Guide

> **Quick guide for migrating components to the new TUI architecture**

## 🎯 Goal

Migrate all existing components to use:
1. `Component` base class
2. `VirtualScreen` for rendering
3. `RenderCoordinator` for coordination
4. `setState()` for reactive updates

## 🚀 Quick Start (5-Minute Migration)

### Step 1: Create Component File
```javascript
// src/tui/components/my-component.js
import { Component } from '../core/component.js';

export class MyComponent extends Component {
  // ... implementation
}
```

### Step 2: Implement Basic Structure
```javascript
export class MyComponent extends Component {
  #state = { value: 0 };
  
  constructor(options) {
    super();
    this.#state = { ...options };
  }
  
  render(screen, ctx) {
    const { row, col } = ctx.bounds;
    screen.setLine(row, col, `Value: ${this.#state.value}`);
  }
}
```

### Step 3: Add Interactivity (if needed)
```javascript
handleKey(key) {
  if (key.name === 'up') {
    this.setState({ value: this.#state.value + 1 });
    return true; // handled
  }
  return false; // not handled
}
```

### Step 4: Add Lifecycle (if needed)
```javascript
mount() {
  super.mount();
  // Setup (timers, event listeners, etc.)
}

unmount() {
  // Cleanup (clear timers, remove listeners)
  super.unmount();
}
```

### Step 5: Add Backward Compatibility
```javascript
static async run(options) {
  return new Promise((resolve) => {
    const instance = new MyComponent(options);
    instance.mount();
    
    instance.on('done', (value) => {
      instance.unmount();
      resolve(value);
    });
  });
}
```

## 📝 Common Patterns

### Pattern 1: Simple Static Component
**Example:** Box

```javascript
export class Box extends Component {
  #title;
  #content;
  #width;
  
  constructor(options) {
    super();
    this.#title = options.title;
    this.#content = options.content;
    this.#width = options.width || 60;
  }
  
  render(screen, ctx) {
    const { row, col } = ctx.bounds;
    
    // Render box border
    screen.setLine(row, col, `┌${'─'.repeat(this.#width - 2)}┐`);
    screen.setLine(row + 1, col, `│${this.#title.padEnd(this.#width - 4)}│`);
    screen.setLine(row + 2, col, `├${'─'.repeat(this.#width - 2)}┤`);
    
    // Render content
    let contentRow = row + 3;
    for (const line of this.#content) {
      screen.setLine(contentRow++, col, `│ ${line.padEnd(this.#width - 4)}│`);
    }
    
    screen.setLine(contentRow, col, `└${'─'.repeat(this.#width - 2)}┘`);
  }
  
  // Backward compatibility
  static draw(options) {
    const box = new Box(options);
    const screen = new VirtualScreen(80, 24);
    box.render(screen, { bounds: { row: 0, col: 0 }, terminalSize: { rows: 24, cols: 80 } });
    return screen.toString();
  }
}
```

### Pattern 2: Interactive Input Component
**Example:** TextInput

```javascript
export class TextInput extends Component {
  #value = '';
  #placeholder;
  #cursorPos = 0;
  
  constructor(options) {
    super();
    this.#placeholder = options.placeholder || '';
  }
  
  render(screen, ctx) {
    const { row, col } = ctx.bounds;
    const display = this.#value || this.#placeholder;
    const cursor = this.#cursorPos;
    
    screen.setLine(row, col, display);
    // Note: Cursor positioning handled by RenderCoordinator
  }
  
  handleKey(key) {
    switch (key.name) {
      case 'return':
        this.emit('submit', this.#value);
        return true;
      case 'escape':
        this.emit('cancel');
        return true;
      case 'backspace':
        this.setState({ 
          value: this.#value.slice(0, -1),
          cursorPos: this.#cursorPos - 1 
        });
        return true;
      default:
        if (key.sequence && key.sequence.length === 1) {
          this.setState({ 
            value: this.#value + key.sequence,
            cursorPos: this.#cursorPos + 1 
          });
          return true;
        }
    }
    return false;
  }
  
  static async run(options) {
    return new Promise((resolve) => {
      const input = new TextInput(options);
      input.mount();
      
      input.on('submit', (value) => {
        input.unmount();
        resolve(value);
      });
      
      input.on('cancel', () => {
        input.unmount();
        resolve(null);
      });
    });
  }
}
```

### Pattern 3: Animated Component
**Example:** Spinner

```javascript
const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const INTERVAL = 80;

export class Spinner extends Component {
  #text;
  #frame = 0;
  #interval;
  
  constructor(options) {
    super();
    this.#text = options.text || '';
  }
  
  mount() {
    super.mount();
    this.#interval = setInterval(() => {
      this.setState({ frame: (this.#frame + 1) % FRAMES.length });
    }, INTERVAL);
  }
  
  unmount() {
    if (this.#interval) {
      clearInterval(this.#interval);
    }
    super.unmount();
  }
  
  render(screen, ctx) {
    const { row, col } = ctx.bounds;
    screen.setLine(row, col, `${FRAMES[this.#frame]} ${this.#text}`);
  }
  
  static create(text) {
    return new Spinner({ text });
  }
}
```

### Pattern 4: List Component with Virtual Scrolling
**Example:** SelectMenu

```javascript
export class SelectMenu extends Component {
  #items;
  #selectedIndex = 0;
  #scrollTop = 0;
  #maxVisible;
  
  constructor(options) {
    super();
    this.#items = options.items || [];
    this.#maxVisible = options.maxVisible || 10;
  }
  
  render(screen, ctx) {
    const { row, col } = ctx.bounds;
    const { rows: termRows } = ctx.terminalSize;
    
    // Calculate visible items (virtual scrolling)
    this.#maxVisible = Math.min(this.#maxVisible, termRows - 4);
    const startIdx = Math.max(0, this.#selectedIndex - Math.floor(this.#maxVisible / 2));
    const endIdx = Math.min(this.#items.length, startIdx + this.#maxVisible);
    
    // Render items
    for (let i = startIdx; i < endIdx; i++) {
      const item = this.#items[i];
      const isSelected = i === this.#selectedIndex;
      const marker = isSelected ? '▶' : ' ';
      
      screen.setLine(row + (i - startIdx), col, `${marker} ${item.label}`);
    }
    
    // Render scroll indicators
    if (startIdx > 0) {
      screen.setLine(row - 1, col, '▲');
    }
    if (endIdx < this.#items.length) {
      screen.setLine(row + (endIdx - startIdx), col, '▼');
    }
    
    // Report height to coordinator
    ctx.height = endIdx - startIdx + 2; // +2 for scroll indicators
  }
  
  handleKey(key) {
    switch (key.name) {
      case 'up':
        this.setState({ 
          selectedIndex: Math.max(0, this.#selectedIndex - 1) 
        });
        return true;
      case 'down':
        this.setState({ 
          selectedIndex: Math.min(this.#items.length - 1, this.#selectedIndex + 1) 
        });
        return true;
      case 'return':
        this.emit('select', this.#items[this.#selectedIndex]);
        return true;
    }
    return false;
  }
}
```

## 🐛 Common Pitfalls & Fixes

### ❌ Pitfall 1: Direct State Assignment
```javascript
// ❌ Wrong - No re-render triggered
this.#value = newValue;

// ✅ Correct - Triggers re-render
this.setState({ value: newValue });
```

### ❌ Pitfall 2: Manual Resize Handling
```javascript
// ❌ Wrong - Conflicts with RenderCoordinator
const unsubResize = onResize(() => {
  processStdout.write(ANSI.moveUp(lineCount));
  processStdout.write(render());
});

// ✅ Correct - Let coordinator handle resize
// No resize handling needed
```

### ❌ Pitfall 3: Missing Cleanup
```javascript
// ❌ Wrong - Timer keeps running after unmount
mount() {
  this.#interval = setInterval(() => { ... }, 100);
}

// ✅ Correct - Clean up in unmount
mount() {
  this.#interval = setInterval(() => { ... }, 100);
}

unmount() {
  clearInterval(this.#interval);
  super.unmount();
}
```

### ❌ Pitfall 4: Direct Terminal Writes
```javascript
// ❌ Wrong - Bypasses rendering pipeline
process.stdout.write('Hello');
process.stderr.write('Error');

// ✅ Correct - Use VirtualScreen
render(screen, ctx) {
  screen.setLine(ctx.bounds.row, ctx.bounds.col, 'Hello');
}
```

### ❌ Pitfall 5: Missing Backward Compatibility
```javascript
// ❌ Wrong - Breaks existing code
class MyComponent extends Component {
  // No static run() method
}

// ✅ Correct - Maintains backward compatibility
class MyComponent extends Component {
  static async run(options) {
    return new Promise((resolve) => {
      const instance = new MyComponent(options);
      instance.mount();
      instance.on('done', resolve);
    });
  }
}
```

## 🧪 Testing Your Component

### 1. Unit Test
```javascript
import assert from 'node:assert/strict';
import { VirtualScreen } from '../src/tui/core/virtual-screen.js';
import { MyComponent } from '../src/tui/components/my-component.js';

test('MyComponent renders correctly', () => {
  const component = new MyComponent({ value: 42 });
  const screen = new VirtualScreen(80, 24);
  
  component.render(screen, { 
    bounds: { row: 0, col: 0 }, 
    terminalSize: { rows: 24, cols: 80 } 
  });
  
  const output = screen.toString();
  assert.ok(output.includes('42'));
});

test('MyComponent handles keys', () => {
  const component = new MyComponent({ value: 0 });
  
  component.handleKey({ name: 'up' });
  assert.equal(component.state.value, 1);
});
```

### 2. Visual Regression Test
```javascript
import { VirtualScreen } from '../src/tui/core/virtual-screen.js';
import { MyComponent } from '../src/tui/components/my-component.js';

test('MyComponent matches snapshot', () => {
  const component = new MyComponent({ value: 42 });
  const screen = new VirtualScreen(80, 24);
  
  component.render(screen, { 
    bounds: { row: 0, col: 0 }, 
    terminalSize: { rows: 24, cols: 80 } 
  });
  
  const snapshot = captureSnapshot(screen);
  const baseline = loadBaseline('my-component.snapshot');
  
  assert.strictEqual(snapshot, baseline);
});
```

### 3. Integration Test
```javascript
import { RenderCoordinator } from '../src/tui/core/render-coordinator.js';
import { MyComponent } from '../src/tui/components/my-component.js';

test('MyComponent works with RenderCoordinator', async () => {
  const coordinator = new RenderCoordinator();
  coordinator.initialize();
  
  const component = new MyComponent({ value: 42 });
  coordinator.registerComponent(component);
  
  // Simulate keypress
  component.handleKey({ name: 'up' });
  
  // Wait for render
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Verify state updated
  assert.equal(component.state.value, 1);
  
  coordinator.destroy();
});
```

## 📊 Migration Checklist

For each component, complete this checklist:

- [ ] Create `src/tui/components/[name].js`
- [ ] Extend `Component` base class
- [ ] Implement `render(screen, ctx)` method
- [ ] Implement `handleKey(key)` method (if interactive)
- [ ] Use `setState()` for state changes
- [ ] Add `mount()` / `unmount()` lifecycle (if needed)
- [ ] Add backward-compatible static `run()` method
- [ ] Update `src/tui.js` re-exports
- [ ] Write unit tests
- [ ] Write visual regression test (if applicable)
- [ ] Test with `ScannerTUI`
- [ ] Run validation script: `node scripts/validate-migration.js`

## 🎉 You're Ready!

Once you complete these steps, your component is fully migrated. Move on to the next component in the migration order:

1. Box
2. TextInput
3. confirm
4. Spinner
5. ProgressBar
6. SelectMenu
7. CheckboxMenu
8. FileBrowser
9. LiveProgress
10. FindingsBrowser

**Good luck! 🐶**

---

*Generated by Max 🐶 — "All bark, all byte!"*