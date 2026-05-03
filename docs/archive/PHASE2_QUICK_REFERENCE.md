# Phase 2 Quick Reference

> **Migration Order:** Box → TextInput → confirm → Spinner → ProgressBar → SelectMenu → CheckboxMenu → FileBrowser → LiveProgress → FindingsBrowser → ScannerTUI

## 🚀 Migration Steps (Per Component)

### 1. Create Component File
```javascript
// src/tui/components/[component].js
import { Component } from '../core/component.js';

export class [ComponentName] extends Component {
  // ... implementation
}
```

### 2. Extend Component Base Class
```javascript
class [ComponentName] extends Component {
  #state; // Private state
  constructor(options) {
    super();
    this.#state = { ... };
  }
}
```

### 3. Implement Lifecycle Methods
```javascript
mount() { /* Setup */ super.mount(); }
unmount() { /* Cleanup */ super.unmount(); }
render(screen, ctx) { /* Render to VirtualScreen */ }
handleKey(key) { /* Handle input */ return boolean; }
```

### 4. Use setState() for Updates
```javascript
// Instead of: this.#value = newValue;
// Use: this.setState({ value: newValue });
```

### 5. Add Backward Compatibility
```javascript
static async run(options) {
  return new Promise((resolve) => {
    const instance = new [ComponentName](options);
    instance.mount();
    instance.on('result', (value) => {
      instance.unmount();
      resolve(value);
    });
  });
}
```

### 6. Update Re-exports
```javascript
// src/tui.js
export { [ComponentName] } from './tui/components/[component].js';
```

---

## 📋 Component Checklist

Use this checklist for each component:

- [ ] Create `src/tui/components/[name].js`
- [ ] Extend `Component` base class
- [ ] Remove direct `process.stdout.write()` / `process.stderr.write()` calls
- [ ] Implement `render(screen, ctx)` method
- [ ] Implement `handleKey(key)` method (if interactive)
- [ ] Use `setState()` for state changes
- [ ] Remove manual resize handling
- [ ] Add `mount()` / `unmount()` lifecycle
- [ ] Add backward-compatible static `run()` method
- [ ] Update `src/tui.js` re-exports
- [ ] Write unit tests
- [ ] Write visual regression test
- [ ] Test with `ScannerTUI`
- [ ] Test edge cases (empty lists, long text, resize)

---

## 🧪 Testing Commands

```bash
# Run all tests
node test/tui-test.js

# Run specific component test
node test/[component]-test.js

# Run integration tests
node test/tui-integration.js

# Run visual regression tests
node test/visual-regression.js

# Run performance benchmarks
node test/performance.js
```

---

## 🔧 Common Patterns

### Pattern 1: Interactive Menu
```javascript
class SelectMenu extends Component {
  #items;
  #selectedIndex = 0;
  
  handleKey(key) {
    switch (key.name) {
      case 'up':
        this.setState({ 
          selectedIndex: (this.#selectedIndex - 1 + this.#items.length) % this.#items.length 
        });
        return true;
      case 'down':
        this.setState({ 
          selectedIndex: (this.#selectedIndex + 1) % this.#items.length 
        });
        return true;
      case 'return':
        this.emit('select', this.#items[this.#selectedIndex].value);
        return true;
    }
    return false;
  }
  
  render(screen, ctx) {
    for (let i = 0; i < this.#items.length; i++) {
      const marker = i === this.#selectedIndex ? '▶' : ' ';
      screen.setLine(ctx.bounds.row + i, ctx.bounds.col, `${marker} ${this.#items[i].label}`);
    }
  }
}
```

### Pattern 2: Async Component
```javascript
class FileBrowser extends Component {
  #entries = [];
  
  async mount() {
    await super.mount();
    await this.#loadEntries();
  }
  
  async #loadEntries() {
    this.#entries = await fs.readdir(this.#currentDir);
    this.requestRender();
  }
  
  render(screen, ctx) {
    // Render entries...
  }
}
```

### Pattern 3: Animated Component
```javascript
class Spinner extends Component {
  #frame = 0;
  #interval;
  
  mount() {
    super.mount();
    this.#interval = setInterval(() => {
      this.setState({ frame: (this.#frame + 1) % FRAMES.length });
    }, 80);
  }
  
  unmount() {
    clearInterval(this.#interval);
    super.unmount();
  }
  
  render(screen, ctx) {
    screen.setLine(ctx.bounds.row, ctx.bounds.col, `${FRAMES[this.#frame]} ${this.state.text}`);
  }
}
```

---

## 🐛 Common Issues & Fixes

### Issue 1: Component not re-rendering
**Fix:** Ensure you're using `setState()` instead of direct assignment
```javascript
// ❌ Wrong
this.#value = newValue;

// ✅ Correct
this.setState({ value: newValue });
```

### Issue 2: Resize causes flicker
**Fix:** Remove manual resize handling, let `RenderCoordinator` handle it
```javascript
// ❌ Wrong
const unsubResize = onResize(() => this.render());

// ✅ Correct
// No resize handling needed - coordinator handles it
```

### Issue 3: Component not cleaning up
**Fix:** Ensure `unmount()` is called and timers are cleared
```javascript
class AnimatedComponent extends Component {
  #interval;
  
  mount() {
    super.mount();
    this.#interval = setInterval(() => { ... }, 100);
  }
  
  unmount() {
    clearInterval(this.#interval); // ← Don't forget this!
    super.unmount();
  }
}
```

### Issue 4: Static `run()` method not working
**Fix:** Ensure you're emitting the correct event
```javascript
static async run(options) {
  return new Promise((resolve) => {
    const instance = new MyComponent(options);
    instance.mount();
    
    instance.on('select', (value) => {  // ← Must match component's emit
      instance.unmount();
      resolve(value);
    });
  });
}
```

---

## 📊 Migration Progress

Track your progress with this table:

| Component | File | Status | Tests | Notes |
|-----------|------|--------|-------|-------|
| Box | `src/tui/components/box.js` | ⬜ Not Started | ⬜ | |
| TextInput | `src/tui/components/input.js` | ⬜ Not Started | ⬜ | |
| confirm | `src/tui/components/input.js` | ⬜ Not Started | ⬜ | |
| Spinner | `src/tui/components/progress.js` | ⬜ Not Started | ⬜ | |
| ProgressBar | `src/tui/components/progress.js` | ⬜ Not Started | ⬜ | |
| SelectMenu | `src/tui/components/menu.js` | ⬜ Not Started | ⬜ | |
| CheckboxMenu | `src/tui/components/menu.js` | ⬜ Not Started | ⬜ | |
| FileBrowser | `src/tui/components/browser.js` | ⬜ Not Started | ⬜ | |
| LiveProgress | `src/tui/components/progress.js` | ⬜ Not Started | ⬜ | |
| FindingsBrowser | `src/tui/components/findings.js` | ⬜ Not Started | ⬜ | |
| ScannerTUI | `src/tui-app.js` | ⬜ Not Started | ⬜ | |

---

*Generated by Max 🐶 — "All bark, all byte!"*