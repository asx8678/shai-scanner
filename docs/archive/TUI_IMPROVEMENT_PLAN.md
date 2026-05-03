# 🐕 TUI Improvement Plan — shai-scanner

> *"Who's a good boy? The one who fixes the flicker, that's who!"*
> — Max, your code puppy

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Current Architecture Analysis](#current-architecture-analysis)
- [Issues Identified](#issues-identified)
- [Phase 1: Foundation & Architecture](#phase-1-foundation--architecture)
- [Phase 2: Core Component Refactoring](#phase-2-core-component-refactoring)
- [Phase 3: Enhanced Features](#phase-3-enhanced-features)
- [Phase 4: Testing & Polish](#phase-4-testing--polish)
- [Implementation Timeline](#implementation-timeline)
- [Risk Mitigation](#risk-mitigation)
- [Success Metrics](#success-metrics)

---

## Executive Summary

The shai-scanner TUI currently has excellent functionality and a solid feature set, but suffers from **architectural inconsistencies** that lead to rendering issues, flicker, and maintenance complexity. The `VirtualScreen` and `Renderer` classes exist but are **unused** by the actual application components, which each implement their own ad-hoc rendering strategies.

This plan outlines a **4-phase approach** to unify the rendering architecture, eliminate flicker, and create a maintainable, extensible TUI framework.

---

## Current Architecture Analysis

### What Exists Today

```
src/
├── tui.js           (2145 lines) — Monolithic TUI toolkit
│   ├── ScreenManager    — Alternate screen buffer lifecycle
│   ├── KeyReader        — Raw-mode keypress reader
│   ├── Spinner          — Braille spinner on stderr
│   ├── ProgressBar      — Progress bar on stderr
│   ├── SelectMenu       — Single-select menu (line-based rendering)
│   ├── CheckboxMenu     — Multi-select menu (line-based rendering)
│   ├── TextInput        — Text input via readline
│   ├── confirm          — Yes/no prompt
│   ├── FileBrowser      — File browser (differential rendering)
│   ├── Box              — Box drawing utility
│   ├── LiveProgress     — Multi-line progress display
│   ├── VirtualScreen    — 2D character buffer (UNUSED)
│   └── Renderer         — Double-buffer differential renderer (UNUSED)
│
├── tui-app.js       (1800 lines) — Main TUI application
│   └── ScannerTUI      — State machine driving screens
│
└── tui-findings.js  (650 lines)  — Findings browser
    └── FindingsBrowser — Rich findings viewer
```

### Current Rendering Strategies (Inconsistent)

| Component | Strategy | Output Stream | Flicker Risk |
|-----------|----------|---------------|--------------|
| SelectMenu | Line-count tracking + moveUp | stdout | Medium |
| CheckboxMenu | Line-count tracking + moveUp | stdout | Medium |
| FileBrowser | Differential (line comparison) | stdout | Low |
| LiveProgress | moveUp + clearLine | stderr | Low |
| Spinner | `\r` + clearLine | stderr | Low |
| ProgressBar | `\r` + clearLine | stderr | Low |
| Box | Static (no in-place updates) | stdout | None |
| TextInput | readline (readline handles it) | stdout | None |

---

## Issues Identified

### 1. Mixed Rendering Approaches

**Problem:** Each component implements its own rendering strategy independently.

```javascript
// SelectMenu: Line-count tracking
processStdout.write(ANSI.moveUp(lineCount));
processStdout.write(render());

// FileBrowser: Differential rendering
if (old === line) {
  if (i < newLen - 1) processStdout.write('\x1b[1B');
} else {
  processStdout.write(`\x1b[2K${line}`);
}

// LiveProgress: moveUp + rebuild
processStderr.write(ANSI.moveUp(this.#lastHeight));
for (const line of lines) {
  processStderr.write(`${ANSI.clearLine}${line}\n`);
}
```

**Impact:** Different components handle resize, cleanup, and error recovery differently, leading to inconsistent behavior and hard-to-debug rendering bugs.

### 2. Unused Infrastructure

**Problem:** `VirtualScreen` and `Renderer` classes exist but aren't used by any component.

```javascript
// These classes are fully implemented but never instantiated by components
export class VirtualScreen { /* ... 200+ lines of working code */ }
export class Renderer { /* ... 200+ lines of working code */ }
```

**Impact:** Double buffering and differential rendering capabilities are available but wasted. Components reinvent partial versions of these capabilities.

### 3. No Render Coordination

**Problem:** Each component manages rendering independently, with no central coordination.

```javascript
// tui-app.js: App-level resize handling
const debouncedResize = debounce(() => {
  if (this.running && !this.#rendering) {
    this.#dispatchScreen().catch(() => {});
  }
}, 150);

// tui.js: Component-level resize handling
const unsubResize = onResize(() => {
  processStdout.write(ANSI.moveUp(lineCount));
  processStdout.write(render());
});

// tui-findings.js: Yet another resize handler
// (FindingsBrowser has its own rendering loop)
```

**Impact:** Multiple resize handlers can fire simultaneously, causing render storms and race conditions.

### 4. Refresh Race Conditions

**Problem:** Animation timers and resize events can trigger overlapping renders.

```javascript
// LiveProgress animation timer
this.#interval = setInterval(() => {
  this.#frame = (this.#frame + 1) % SPINNER_FRAMES.length;
  this.render(); // Can overlap with resize-triggered render
}, SPINNER_INTERVAL);

// Resize handler
this.#unsubResize = onResize(() => this.render());
```

**Impact:** Occasional visual glitches during terminal resize or rapid state updates.

### 5. Inconsistent Cursor Management

**Problem:** Different components position the cursor differently.

```javascript
// Some use ANSI.moveUp
processStdout.write(ANSI.moveUp(lineCount));

// FileBrowser uses raw escape sequences
processStdout.write(`\x1b[${prevLen}A`);

// LiveProgress writes to stderr
processStderr.write(ANSI.moveUp(this.#lastHeight));
```

**Impact:** Cursor position can be incorrect after component transitions.

### 6. Mixed Output Streams

**Problem:** Components write to different output streams.

| Component | Stream |
|-----------|--------|
| SelectMenu | stdout |
| CheckboxMenu | stdout |
| FileBrowser | stdout |
| Spinner | stderr |
| ProgressBar | stderr |
| LiveProgress | stderr |

**Impact:** Makes it harder to reason about terminal state. In alternate screen mode, both streams share the same display.

---

## Phase 1: Foundation & Architecture

> **Goal:** Create the centralized rendering infrastructure and migrate one component as a proof of concept.

### 1.1 Centralized RenderCoordinator

**Location:** `src/tui/core/render-coordinator.js`

The RenderCoordinator will be the **single source of truth** for all rendering operations. It eliminates race conditions and provides a unified rendering pipeline.

```javascript
// src/tui/core/render-coordinator.js

import { VirtualScreen, Renderer, ScreenManager } from './renderer.js';

export class RenderCoordinator {
  #renderer;
  #screenManager;
  #virtualScreen;
  #renderQueue;
  #isRendering;
  #resizeDebouncer;
  #cursorPosition;
  #dirtyRegions;

  constructor(options = {}) {
    this.#screenManager = new ScreenManager(options);
    this.#renderer = new Renderer(this.#screenManager);
    this.#virtualScreen = null;
    this.#renderQueue = [];
    this.#isRendering = false;
    this.#cursorPosition = { row: 0, col: 0 };
    this.#dirtyRegions = new Set();

    // Debounced resize handler
    this.#resizeDebouncer = debounce((size) => {
      this.#handleResize(size);
    }, 100);
  }

  /**
   * Initialize the coordinator — enters alternate screen mode
   * and sets up the rendering pipeline.
   */
  initialize() {
    this.#screenManager.enter();
    const { cols, rows } = this.#screenManager.terminalSize;
    this.#virtualScreen = new VirtualScreen(cols, rows);

    // Register resize handler
    this.#screenManager.onResize((size) => {
      this.#resizeDebouncer.trigger(size);
    });
  }

  /**
   * Register a component with the coordinator.
   * Returns a ComponentHandle for interacting with the component.
   *
   * @param {Component} component
   * @returns {ComponentHandle}
   */
  registerComponent(component) {
    const handle = new ComponentHandle(this, component);
    this.#dirtyRegions.add(handle.id);
    return handle;
  }

  /**
   * Request a re-render. Renders are batched — multiple requests
   * within the same tick result in a single render pass.
   *
   * @param {string} componentId - Optional: specific component to re-render
   */
  requestRender(componentId = null) {
    if (componentId) {
      this.#dirtyRegions.add(componentId);
    }

    if (!this.#renderScheduled) {
      this.#renderScheduled = true;
      // Use queueMicrotask for render batching
      queueMicrotask(() => this.#performRender());
    }
  }

  /**
   * Perform the actual render pass.
   * @private
   */
  #performRender() {
    if (this.#isRendering) return;
    this.#isRendering = true;
    this.#renderScheduled = false;

    try {
      // Clear virtual screen
      this.#virtualScreen.clear();

      // Let all registered components render to the virtual screen
      for (const component of this.#registeredComponents) {
        component.render(this.#virtualScreen);
      }

      // Single differential render to terminal
      this.#renderer.render(this.#virtualScreen);
    } finally {
      this.#isRendering = false;
      this.#dirtyRegions.clear();
    }
  }

  /**
   * Handle terminal resize.
   * @private
   */
  #handleResize({ cols, rows }) {
    this.#virtualScreen.resize(cols, rows);
    this.requestRender(); // Full re-render on resize
  }

  /**
   * Get current terminal dimensions.
   */
  get size() {
    return this.#screenManager.terminalSize;
  }

  /**
   * Clean up and restore terminal state.
   */
  destroy() {
    this.#screenManager.exit();
  }
}
```

### 1.2 Enhanced Component Base Class

**Location:** `src/tui/core/component.js`

```javascript
// src/tui/core/component.js

let nextComponentId = 0;

export class Component {
  #id;
  #coordinator;
  #parent;
  #children;
  #state;
  #dirty;
  #mounted;

  constructor(options = {}) {
    this.#id = `component-${nextComponentId++}`;
    this.#coordinator = null;
    this.#parent = null;
    this.#children = new Map();
    this.#state = {};
    this.#dirty = true;
    this.#mounted = false;
  }

  /** @readonly */
  get id() { return this.#id; }

  /** @readonly */
  get isMounted() { return this.#mounted; }

  /**
   * Set component state and trigger re-render.
   * @param {object} newState - Partial state to merge
   */
  setState(newState) {
    Object.assign(this.#state, newState);
    this.#dirty = true;
    this.requestRender();
  }

  /** @protected */
  get state() { return this.#state; }

  /**
   * Mount the component — called when added to the component tree.
   * Override for setup logic.
   */
  mount() {
    this.#mounted = true;
    for (const child of this.#children.values()) {
      child.mount();
    }
  }

  /**
   * Unmount the component — called when removed from the tree.
   * Override for cleanup logic.
   */
  unmount() {
    this.#mounted = false;
    for (const child of this.#children.values()) {
      child.unmount();
    }
  }

  /**
   * Render the component to a VirtualScreen.
   * Override in subclasses.
   *
   * @param {VirtualScreen} screen
   * @param {RenderContext} ctx
   */
  render(screen, ctx) {
    // Default: render children
    for (const child of this.#children.values()) {
      child.render(screen, ctx);
    }
  }

  /**
   * Handle a keypress event.
   * Override in subclasses.
   *
   * @param {Key} key
   * @returns {boolean} true if handled, false to bubble up
   */
  handleKey(key) {
    return false; // Not handled — bubble up
  }

  /**
   * Request a re-render through the coordinator.
   */
  requestRender() {
    this.#coordinator?.requestRender(this.#id);
  }

  /**
   * Add a child component.
   */
  addChild(child) {
    child.#parent = this;
    this.#children.set(child.id, child);
    if (this.#mounted) child.mount();
  }

  /**
   * Remove a child component.
   */
  removeChild(child) {
    child.unmount();
    child.#parent = null;
    this.#children.delete(child.id);
  }

  /** @internal */
  __setCoordinator(coordinator) {
    this.#coordinator = coordinator;
  }
}
```

### 1.3 Enhanced Event Bus

**Location:** `src/tui/core/event-bus.js`

```javascript
// src/tui/core/event-bus.js

export class EventBus {
  #listeners;
  #onceListeners;

  constructor() {
    this.#listeners = new Map();
    this.#onceListeners = new Map();
  }

  /**
   * Subscribe to an event.
   * @param {string} event
   * @param {Function} callback
   * @returns {Function} unsubscribe
   */
  on(event, callback) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, []);
    }
    this.#listeners.get(event).push(callback);

    return () => this.off(event, callback);
  }

  /**
   * Subscribe to an event once.
   * @param {string} event
   * @param {Function} callback
   */
  once(event, callback) {
    if (!this.#onceListeners.has(event)) {
      this.#onceListeners.set(event, []);
    }
    this.#onceListeners.get(event).push(callback);
  }

  /**
   * Unsubscribe from an event.
   * @param {string} event
   * @param {Function} callback
   */
  off(event, callback) {
    const listeners = this.#listeners.get(event);
    if (listeners) {
      const idx = listeners.indexOf(callback);
      if (idx !== -1) listeners.splice(idx, 1);
    }
  }

  /**
   * Emit an event.
   * @param {string} event
   * @param {...any} args
   */
  emit(event, ...args) {
    const listeners = this.#listeners.get(event) || [];
    for (const listener of listeners) {
      try {
        listener(...args);
      } catch (error) {
        console.error(`EventBus: Error in listener for "${event}":`, error);
      }
    }

    const onceListeners = this.#onceListeners.get(event) || [];
    this.#onceListeners.delete(event);
    for (const listener of onceListeners) {
      try {
        listener(...args);
      } catch (error) {
        console.error(`EventBus: Error in once-listener for "${event}":`, error);
      }
    }
  }

  /**
   * Remove all listeners.
   */
  clear() {
    this.#listeners.clear();
    this.#onceListeners.clear();
  }
}
```

### 1.4 Enhanced VirtualScreen

**Location:** `src/tui/core/virtual-screen.js`

Enhance the existing VirtualScreen with region tracking:

```javascript
// src/tui/core/virtual-screen.js

import { stripAnsi } from '../utils.js';

export class VirtualScreen {
  #cols;
  #rows;
  #buffer;
  #attributes;
  #dirty;
  #regions;

  constructor(cols, rows) {
    this.#cols = Math.max(1, cols | 0);
    this.#rows = Math.max(1, rows | 0);
    this.#dirty = new Set();
    this.#regions = new Map();
    this.#allocate(this.#rows, this.#cols);
  }

  // ... (existing API preserved)

  /**
   * Define a named region for targeted updates.
   *
   * @param {string} name
   * @param {{ row: number, col: number, width: number, height: number }} bounds
   */
  defineRegion(name, bounds) {
    this.#regions.set(name, bounds);
  }

  /**
   * Mark a named region as dirty.
   * @param {string} name
   */
  markRegionDirty(name) {
    const region = this.#regions.get(name);
    if (!region) return;

    for (let r = region.row; r < region.row + region.height; r++) {
      this.markDirty(r);
    }
  }

  /**
   * Clear a specific region.
   * @param {string} name
   */
  clearRegion(name) {
    const region = this.#regions.get(name);
    if (!region) return;

    for (let r = region.row; r < region.row + region.height; r++) {
      for (let c = region.col; c < region.col + region.width; c++) {
        this.setCell(r, c, ' ');
      }
    }
  }

  // ... rest of existing API
}
```

### 1.5 File Structure

```
src/tui/
├── core/
│   ├── render-coordinator.js   # Central render management
│   ├── component.js            # Base component class
│   ├── event-bus.js            # Event system
│   ├── virtual-screen.js       # Enhanced VirtualScreen
│   └── renderer.js             # Enhanced Renderer
├── components/                  # (Phase 2)
├── themes/                      # (Phase 3)
└── index.js                     # Public API
```

### Phase 1 Tasks

- [ ] Create `src/tui/core/` directory structure
- [ ] Implement `EventBus` class with tests
- [ ] Extract and enhance `VirtualScreen` into `core/virtual-screen.js`
- [ ] Extract and enhance `Renderer` into `core/renderer.js`
- [ ] Implement `Component` base class with lifecycle
- [ ] Implement `RenderCoordinator` with render batching
- [ ] Add `ComponentHandle` for component-coordinator communication
- [ ] Write unit tests for all core classes
- [ ] Create `src/tui/index.js` public API barrel file
- [ ] Ensure backward compatibility with existing exports

---

## Phase 2: Core Component Refactoring

> **Goal:** Migrate all components to use the new architecture. This is the biggest phase.

### 2.1 Component Migration Strategy

Each component will be refactored to:

1. Extend `Component` base class
2. Render to `VirtualScreen` instead of directly to stdout/stderr
3. Handle events through the event system
4. Use `setState()` for reactive updates

### 2.2 SelectMenu Refactoring

```javascript
// src/tui/components/menu.js (SelectMenu)

import { Component } from '../core/component.js';

export class SelectMenu extends Component {
  #items;
  #selectedIndex;
  #title;
  #colorize;

  constructor({ title = '', items = [], color = true }) {
    super();
    this.#title = title;
    this.#items = items;
    this.#selectedIndex = 0;
    this.#colorize = colorize(color);
  }

  render(screen, ctx) {
    const { row: startRow, col: startCol } = ctx.bounds;
    let row = startRow;
    const c = this.#colorize;

    // Render title
    if (this.#title) {
      screen.setLine(row++, startCol, this.#title, { attribute: c.bold('') });
    }

    // Render items
    for (let i = 0; i < this.#items.length; i++) {
      const item = this.#items[i];
      const isSelected = i === this.#selectedIndex;

      const marker = isSelected ? c.cyan('▶') : ' ';
      const label = isSelected ? c.bold(item.label) : item.label;
      const desc = item.description ? ` ${c.dim(item.description)}` : '';

      screen.setLine(row++, startCol, `${marker} ${label}${desc}`, {
        segments: isSelected ? [
          { col: 0, len: 2, attribute: c.cyan('') },
          { col: 2, len: label.length, attribute: c.bold('') },
        ] : []
      });
    }

    // Render footer
    screen.setLine(row++, startCol, '', { attribute: null });
    screen.setLine(row++, startCol, `[↑↓ navigate] [Enter select] [q quit]`, {
      attribute: c.dim('')
    });

    ctx.height = row - startRow;
  }

  handleKey(key) {
    switch (key.name) {
      case 'up':
        this.#selectedIndex = (this.#selectedIndex - 1 + this.#items.length) % this.#items.length;
        this.requestRender();
        return true;

      case 'down':
        this.#selectedIndex = (this.#selectedIndex + 1) % this.#items.length;
        this.requestRender();
        return true;

      case 'return':
        this.emit('select', this.#items[this.#selectedIndex].value);
        return true;

      case 'escape':
      case 'q':
        this.emit('cancel');
        return true;
    }

    return false; // Not handled
  }
}
```

### 2.3 FileBrowser Refactoring

```javascript
// src/tui/components/browser.js (FileBrowser)

import { Component } from '../core/component.js';

export class FileBrowser extends Component {
  #entries;
  #cursorPos;
  #scrollTop;
  #currentDir;
  #selectedPaths;
  #showHidden;
  #dirCache;

  constructor(options = {}) {
    super();
    this.#currentDir = options.startDir || '.';
    this.#selectedPaths = new Set();
    this.#showHidden = options.showHidden || false;
    this.#dirCache = new Map();
    this.#cursorPos = 0;
    this.#scrollTop = 0;
  }

  async mount() {
    await super.mount();
    await this.#loadEntries();
  }

  render(screen, ctx) {
    const { row: startRow, col: startCol } = ctx.bounds;
    const { rows: termRows, cols: termCols } = ctx.terminalSize;
    let row = startRow;

    // Title with selection count
    let titleLine = this.#title;
    if (this.#selectedPaths.size > 0) {
      titleLine += `   ✓ ${this.#selectedPaths.size} selected`;
    }
    screen.setLine(row++, startCol, titleLine);

    // Current directory
    screen.setLine(row++, startCol, `📁 ${this.#currentDir}`);

    // Items (with virtual scrolling)
    const maxVisible = termRows - 10; // Reserve space for header/footer
    const allItems = [...this.#entries, DONE_ENTRY];
    const visible = allItems.slice(this.#scrollTop, this.#scrollTop + maxVisible);

    for (let i = 0; i < visible.length; i++) {
      const entry = visible[i];
      const idx = this.#scrollTop + i;
      const isCursor = idx === this.#cursorPos;

      // ... render entry with proper segments for cursor highlighting

      screen.setLine(row++, startCol, this.#renderEntry(entry, isCursor));
    }

    // Scroll indicator
    if (allItems.length > maxVisible) {
      screen.setLine(row++, startCol, this.#renderScrollIndicator(allItems.length, maxVisible));
    }

    // Footer
    screen.setLine(row++, startCol, '[↑↓ nav] [Space select] [Enter open] [h hidden] [a all] [Esc finish]');

    ctx.height = row - startRow;
  }
}
```

### 2.4 LiveProgress Refactoring

```javascript
// src/tui/components/progress.js (LiveProgress)

import { Component } from '../core/component.js';

export class LiveProgress extends Component {
  #phases;
  #phaseStates;
  #stats;
  #animationFrame;
  #frameIndex;

  constructor(options = {}) {
    super();
    this.#phases = [];
    this.#phaseStates = new Map();
    this.#stats = {};
    this.#frameIndex = 0;
  }

  mount() {
    super.mount();
    this.#startAnimation();
  }

  unmount() {
    this.#stopAnimation();
    super.unmount();
  }

  #startAnimation() {
    // Use requestAnimationFrame-style timing for smooth animations
    const animate = () => {
      this.#frameIndex = (this.#frameIndex + 1) % SPINNER_FRAMES.length;
      this.requestRender();
      this.#animationFrame = setTimeout(animate, SPINNER_INTERVAL);
    };
    this.#animationFrame = setTimeout(animate, SPINNER_INTERVAL);
  }

  #stopAnimation() {
    if (this.#animationFrame) {
      clearTimeout(this.#animationFrame);
      this.#animationFrame = null;
    }
  }

  render(screen, ctx) {
    const { row: startRow, col: startCol } = ctx.bounds;
    let row = startRow;

    for (const name of this.#phases) {
      const state = this.#phaseStates.get(name);
      const prefix = this.#getPrefix(state);
      const text = state.status === 'done' ? this.#dim(state.text) : this.#bold(state.text);
      const detail = state.detail ? ` ${this.#dim(state.detail)}` : '';

      screen.setLine(row++, startCol, `${prefix} ${text}${detail}`);
    }

    // Stats line
    if (Object.keys(this.#stats).length > 0) {
      const statsLine = Object.entries(this.#stats)
        .map(([k, v]) => `${k}: ${this.#bold(String(v))}`)
        .join('  ');
      screen.setLine(row++, startCol, this.#dim(statsLine));
    }

    ctx.height = row - startRow;
  }
}
```

### 2.5 Render Batching & Queue System

The `RenderCoordinator` handles batching automatically:

```javascript
// Example: Multiple rapid updates result in a single render

progress.update('phase1', { status: 'active', detail: 'file1.js' });
progress.update('stats', { packages: 100 });
progress.update('phase1', { detail: 'file2.js' });

// All three setState() calls happen in the same tick
// Only ONE render pass is performed
```

### Phase 2 Tasks

- [ ] Create `src/tui/components/menu.js` (SelectMenu + CheckboxMenu)
- [ ] Create `src/tui/components/input.js` (TextInput + confirm)
- [ ] Create `src/tui/components/browser.js` (FileBrowser)
- [ ] Create `src/tui/components/progress.js` (LiveProgress + Spinner + ProgressBar)
- [ ] Create `src/tui/components/box.js` (Box)
- [ ] Create `src/tui/components/findings.js` (FindingsBrowser)
- [ ] Update `ScannerTUI` to use `RenderCoordinator`
- [ ] Implement render queue with batching
- [ ] Add proper cursor position tracking
- [ ] Fix all refresh/flicker issues
- [ ] Add component unmounting on screen transitions
- [ ] Write integration tests for component rendering

---

## Phase 3: Enhanced Features

> **Goal:** Add polish, animations, and extensibility to the TUI.

### 3.1 Smooth Animations

```javascript
// src/tui/core/animation.js

export class AnimationController {
  #animations;
  #isRunning;

  constructor() {
    this.#animations = new Map();
    this.#isRunning = false;
  }

  /**
   * Create a smooth transition between values.
   *
   * @param {string} name - Animation name
   * @param {object} options
   * @param {number} options.from - Start value
   * @param {number} options.to - End value
   * @param {number} options.duration - Duration in ms
   * @param {Function} options.onUpdate - Called with interpolated value
   * @param {Function} [options.onComplete] - Called when done
   */
  animate(name, { from, to, duration, easing = 'easeInOut', onUpdate, onComplete }) {
    const startTime = performance.now();
    const easingFn = EASINGS[easing] || EASINGS.easeInOut;

    this.#animations.set(name, {
      from, to, duration, easingFn, onUpdate, onComplete, startTime
    });

    if (!this.#isRunning) {
      this.#isRunning = true;
      this.#tick();
    }
  }

  #tick() {
    const now = performance.now();

    for (const [name, anim] of this.#animations) {
      const elapsed = now - anim.startTime;
      const progress = Math.min(elapsed / anim.duration, 1);
      const easedProgress = anim.easingFn(progress);
      const currentValue = anim.from + (anim.to - anim.from) * easedProgress;

      anim.onUpdate(currentValue);

      if (progress >= 1) {
        anim.onComplete?.();
        this.#animations.delete(name);
      }
    }

    if (this.#animations.size > 0) {
      requestAnimationFrame(() => this.#tick());
    } else {
      this.#isRunning = false;
    }
  }
}

const EASINGS = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => 1 - (1 - t) * (1 - t),
  easeInOut: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
};
```

### 3.2 Theme System

```javascript
// src/tui/themes/default.js

export const defaultTheme = {
  name: 'default',
  colors: {
    primary: 'cyan',
    secondary: 'blue',
    success: 'green',
    warning: 'yellow',
    error: 'red',
    dim: 'dim',
    bold: 'bold',
    text: null, // default terminal color
    background: null,
    highlight: { fg: 'black', bg: 'cyan' },
    cursor: { fg: 'cyan', bold: true },
  },
  icons: {
    cursor: '▶',
    checkbox: { checked: '✓', unchecked: ' ' },
    spinner: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ',
    folder: '📁',
    file: '📄',
  },
  borders: {
    style: 'rounded', // 'rounded', 'single', 'double', 'none'
    chars: {
      topLeft: '┌',
      topRight: '┐',
      bottomLeft: '└',
      bottomRight: '┘',
      horizontal: '─',
      vertical: '│',
    },
  },
  spacing: {
    padding: 1,
    margin: 1,
    lineHeight: 1,
  },
};

// src/tui/themes/high-contrast.js

export const highContrastTheme = {
  ...defaultTheme,
  name: 'high-contrast',
  colors: {
    ...defaultTheme.colors,
    primary: 'brightWhite',
    secondary: 'brightCyan',
    success: 'brightGreen',
    warning: 'brightYellow',
    error: 'brightRed',
    highlight: { fg: 'black', bg: 'brightWhite' },
    cursor: { fg: 'brightCyan', bold: true },
  },
  icons: {
    ...defaultTheme.icons,
    cursor: '►',
    checkbox: { checked: '[X]', unchecked: '[ ]' },
    success: '[OK]',
    error: '[!!]',
    warning: '[!]',
    info: '[i]',
  },
};
```

### 3.3 Mouse Support (Optional)

```javascript
// src/tui/core/mouse-handler.js

export class MouseHandler {
  #enabled;
  #callbacks;
  #stream;

  constructor(stream = process.stdout) {
    this.#enabled = false;
    this.#callbacks = new Map();
    this.#stream = stream;
  }

  enable() {
    if (this.#enabled) return;
    this.#enabled = true;

    // Enable SGR mouse mode (supports coordinates > 223)
    this.#stream.write('\x1b[?1006h');
    // Enable button tracking
    this.#stream.write('\x1b[?1002h');
  }

  disable() {
    if (!this.#enabled) return;
    this.#enabled = false;

    this.#stream.write('\x1b[?1006l');
    this.#stream.write('\x1b[?1002l');
  }

  /**
   * Parse a mouse event from raw input.
   * @param {string} raw
   * @returns {{ type: string, row: number, col: number, button: string } | null}
   */
  parse(raw) {
    // SGR format: ESC [ < Cb ; Cx ; Cy M/m
    const match = raw.match(/^\x1b\[<(\d+);(\d+);(\d+)([Mm])$/);
    if (!match) return null;

    const [, cb, col, row, type] = match;
    const button = parseInt(cb, 10) & 0x03;
    const isRelease = type === 'm';

    return {
      type: isRelease ? 'release' : 'press',
      row: parseInt(row, 10) - 1,
      col: parseInt(col, 10) - 1,
      button: ['left', 'middle', 'right'][button] || 'unknown',
      shift: !!(parseInt(cb, 10) & 0x04),
      meta: !!(parseInt(cb, 10) & 0x08),
      ctrl: !!(parseInt(cb, 10) & 0x10),
    };
  }
}
```

### 3.4 Accessibility Improvements

```javascript
// src/tui/core/accessibility.js

export class AccessibilityManager {
  #announcements;
  #lastAnnouncement;

  constructor() {
    this.#announcements = [];
    this.#lastAnnouncement = '';
  }

  /**
   * Announce a message to screen readers.
   * In terminal context, this outputs a visually hidden line.
   *
   * @param {string} message
   * @param {boolean} [interrupt=false] - If true, cancel previous announcement
   */
  announce(message, interrupt = false) {
    if (interrupt) {
      this.#announcements.length = 0;
    }
    this.#announcements.push(message);
    this.#processAnnouncements();
  }

  #processAnnouncements() {
    // Output as a visually hidden line (using ANSI)
    // Screen readers will read this content
    while (this.#announcements.length > 0) {
      const message = this.#announcements.shift();
      if (message !== this.#lastAnnouncement) {
        this.#lastAnnouncement = message;
        // Write to a screen-reader-only channel
        process.stderr.write(`\x1b[?1003l[Screen Reader] ${message}\n`);
      }
    }
  }

  /**
   * Get color-blind friendly alternative text for a status.
   *
   * @param {string} status
   * @returns {string}
   */
  getStatusText(status) {
    const statusMap = {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Information',
      pending: 'Pending',
      active: 'Active',
      done: 'Done',
    };
    return statusMap[status] || status;
  }
}
```

### Phase 3 Tasks

- [ ] Implement `AnimationController` with easing functions
- [ ] Create theme files: `default.js`, `high-contrast.js`
- [ ] Implement `ThemeManager` for runtime theme switching
- [ ] Add mouse event parsing (SGR mode)
- [ ] Create `AccessibilityManager` for screen reader support
- [ ] Add aria-label equivalents for all interactive elements
- [ ] Implement focus management for keyboard navigation
- [ ] Add theme preview in settings screen
- [ ] Document theming API

---

## Phase 4: Testing & Polish

> **Goal:** Ensure quality, performance, and cross-platform compatibility.

### 4.1 Visual Regression Tests

```javascript
// test/visual-regression.js

import assert from 'node:assert/strict';

/**
 * Capture the current state of a VirtualScreen as a string snapshot.
 *
 * @param {VirtualScreen} screen
 * @returns {string}
 */
function captureSnapshot(screen) {
  const lines = [];
  for (let row = 0; row < screen.rows; row++) {
    lines.push(screen.getLine(row));
  }
  return lines.join('\n');
}

/**
 * Compare two snapshots and report differences.
 *
 * @param {string} expected
 * @param {string} actual
 * @returns {{ match: boolean, diffs: string[] }}
 */
function compareSnapshots(expected, actual) {
  const expectedLines = expected.split('\n');
  const actualLines = actual.split('\n');
  const diffs = [];

  const maxLines = Math.max(expectedLines.length, actualLines.length);
  for (let i = 0; i < maxLines; i++) {
    const expected = expectedLines[i] || '';
    const actual = actualLines[i] || '';

    if (expected !== actual) {
      diffs.push(`Line ${i + 1}:\n  Expected: ${JSON.stringify(expected)}\n  Actual:   ${JSON.stringify(actual)}`);
    }
  }

  return { match: diffs.length === 0, diffs };
}

// Test: SelectMenu renders correctly
await testAsync('SelectMenu renders correctly', async () => {
  const menu = new SelectMenu({
    title: 'Test Menu',
    items: [
      { label: 'Option 1', value: 'opt1' },
      { label: 'Option 2', value: 'opt2' },
    ],
    color: false, // Disable colors for snapshot
  });

  const screen = new VirtualScreen(80, 24);
  menu.render(screen, { bounds: { row: 0, col: 0 }, terminalSize: { rows: 24, cols: 80 } });

  const snapshot = captureSnapshot(screen);
  const expected = `
Test Menu
▶ Option 1
  Option 2

[↑↓ navigate] [Enter select] [q quit]
`.trim();

  const { match, diffs } = compareSnapshots(expected, snapshot);
  assert.ok(match, `Snapshot mismatch:\n${diffs.join('\n')}`);
});
```

### 4.2 Performance Benchmarks

```javascript
// test/performance.js

import { performance } from 'node:perf_hooks';

/**
 * Benchmark render performance.
 *
 * @param {string} name
 * @param {Function} fn
 * @param {number} iterations
 */
async function benchmark(name, fn, iterations = 100) {
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }

  times.sort((a, b) => a - b);
  const p50 = times[Math.floor(times.length * 0.5)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const p99 = times[Math.floor(times.length * 0.99)];

  console.log(`  ${name}:`);
  console.log(`    p50: ${p50.toFixed(2)}ms`);
  console.log(`    p95: ${p95.toFixed(2)}ms`);
  console.log(`    p99: ${p99.toFixed(2)}ms`);

  return { p50, p95, p99 };
}

// Benchmark: Full screen render
await benchmark('Full screen render (80x24)', async () => {
  const screen = new VirtualScreen(80, 24);
  const renderer = new Renderer(screenManager);

  // Fill screen with content
  for (let row = 0; row < 24; row++) {
    screen.setLine(row, 0, `Line ${row}: ${'x'.repeat(60)}`);
  }

  renderer.fullRender(screen);
});

// Benchmark: Differential render (small change)
await benchmark('Differential render (1 line changed)', async () => {
  // Pre-populate previous buffer
  renderer.fullRender(screen);

  // Change one line
  screen.setLine(12, 0, 'Updated line');
  screen.markDirty(12);

  renderer.render(screen);
});
```

### 4.3 Cross-Platform Testing Matrix

| Terminal | OS | Status | Notes |
|----------|-----|--------|-------|
| Terminal.app | macOS | 🟡 | Test emoji rendering |
| iTerm2 | macOS | 🟢 | Primary development terminal |
| Alacritty | macOS/Linux | 🟢 | Fast rendering |
| Windows Terminal | Windows | 🟡 | Test color support |
| cmd.exe | Windows | 🔴 | Limited ANSI support |
| GNOME Terminal | Linux | 🟡 | Test resize handling |
| Kitty | Linux/macOS | 🟢 | Full feature support |

### 4.4 Documentation Updates

- [ ] Update `TUI_USAGE_GUIDE.md` with new architecture
- [ ] Add API documentation for all public classes
- [ ] Create migration guide for existing users
- [ ] Add troubleshooting section for common issues
- [ ] Document theming customization
- [ ] Add performance tuning guide

### Phase 4 Tasks

- [ ] Create visual regression test suite
- [ ] Add performance benchmark suite
- [ ] Test on all terminals in matrix
- [ ] Fix any cross-platform issues found
- [ ] Update all documentation
- [ ] Add JSDoc comments to all public APIs
- [ ] Create CHANGELOG entry
- [ ] Tag release version

---

## Implementation Timeline

### Week 1-2: Phase 1 (Foundation)
- Create core infrastructure
- Implement RenderCoordinator
- Add Component base class
- **Milestone:** Core framework complete with tests

### Week 3-4: Phase 2 (Migration)
- Refactor SelectMenu and CheckboxMenu
- Refactor FileBrowser
- Refactor LiveProgress, Spinner, ProgressBar
- Refactor TextInput, confirm, Box
- Refactor FindingsBrowser
- Update ScannerTUI to use new architecture
- **Milestone:** All components migrated, zero flicker

### Week 5: Phase 3 (Enhancements)
- Implement AnimationController
- Create theme system
- Add accessibility features
- **Milestone:** Themes working, animations smooth

### Week 6: Phase 4 (Polish)
- Visual regression tests
- Performance benchmarks
- Cross-platform testing
- Documentation updates
- **Milestone:** Release-ready

---

## Risk Mitigation

### 1. Backward Compatibility

**Risk:** Breaking changes for users importing directly from `tui.js`

**Mitigation:**
```javascript
// src/tui.js — maintained as re-export barrel
export {
  SelectMenu,
  CheckboxMenu,
  TextInput,
  confirm,
  FileBrowser,
  Box,
  Spinner,
  ProgressBar,
  LiveProgress,
  ScreenManager,
  KeyReader,
  VirtualScreen,
  Renderer,
  cleanupTerminal,
  onResize,
  getTerminalSize,
  debounce,
  ANSI,
} from './tui/index.js';
```

### 2. Performance Regression

**Risk:** New architecture adds overhead

**Mitigation:**
- Feature flag for legacy rendering: `SHAI_SCANNER_LEGACY_TUI=1`
- Performance benchmarks run on every PR
- Differential rendering minimizes I/O

### 3. Feature Parity

**Risk:** Missing functionality during migration

**Mitigation:**
- Comprehensive test suite before migration
- Component-by-component migration with integration tests
- Legacy fallback for unmigrated components

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Flicker on resize | Occasional | Zero |
| Flicker on state update | Rare | Zero |
| Animation framerate | Variable | 60fps |
| Full screen render time | ~50ms | <16ms |
| Differential render time | N/A | <5ms |
| Cursor positioning bugs | ~2/year | Zero |
| Cross-platform issues | 1-2 | Zero |
| Lines of code (TUI) | 2800 | ~2000 |
| Component count | 10 (flat) | 10 (organized) |
| Test coverage | 30% | 90% |

---

## Appendix A: Migration Checklist

Use this checklist when migrating each component:

- [ ] Extend `Component` base class
- [ ] Remove direct `process.stdout.write()` / `process.stderr.write()` calls
- [ ] Implement `render(screen, ctx)` method
- [ ] Implement `handleKey(key)` method
- [ ] Use `setState()` for state changes
- [ ] Remove manual resize handling (coordinator handles it)
- [ ] Remove manual cleanup (unmount handles it)
- [ ] Add unit tests
- [ ] Add visual regression test
- [ ] Update documentation

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **VirtualScreen** | 2D character buffer that components render to |
| **Renderer** | Handles differential updates from VirtualScreen to terminal |
| **RenderCoordinator** | Central manager for all rendering operations |
| **Component** | Base class for all UI elements |
| **ComponentHandle** | Interface between component and coordinator |
| **Dirty Region** | Area of screen that needs re-rendering |
| **Double Buffering** | Technique to eliminate flicker by comparing frames |
| **SGR Mode** | Select Graphic Rendition mode for mouse events |

---

*Generated by Max 🐶 — "All bark, all byte!"*
