// src/tui/index.js
// Public API barrel file for the TUI system
// All components migrated to the Component-based architecture.
// Backward compatibility maintained via re-exports from '../tui.js'.

// ─── Core Architecture ──────────────────────────────────────────────────────

export { EventBus } from './core/event-bus.js';
export { VirtualScreen } from './core/virtual-screen.js';
export { Renderer, ANSI } from './core/renderer.js';
export { Component } from './core/component.js';
export { RenderCoordinator } from './core/render-coordinator.js';

// ─── Migrated Components ────────────────────────────────────────────────────

export { Box } from './components/box.js';
export { TextInput, Confirm, confirm } from './components/input.js';
export { Spinner, ProgressBar, LiveProgress } from './components/progress.js';
export { SelectMenu, CheckboxMenu } from './components/menu.js';
export { FileBrowser } from './components/browser.js';
export { FindingsBrowser } from './components/findings.js';
export { ScannerTUI } from './components/app.js';

// ─── Legacy Utilities (still in src/tui.js — not yet migrated) ──────────────
// Kept for backward compatibility with existing code that imports from '../tui.js'.

export {
  onResize,
  getTerminalSize,
  debounce,
  ScreenManager,
  KeyReader,
  cleanupTerminal,
  resetCleanupState,
} from '../tui.js';

// ─── Default Export ──────────────────────────────────────────────────────────

import { RenderCoordinator } from './core/render-coordinator.js';
import { EventBus } from './core/event-bus.js';
import { Component } from './core/component.js';

export default {
  // Core
  RenderCoordinator,
  EventBus,
  Component,

  // Re-export key items for convenience
  get VirtualScreen() {
    return import('./core/virtual-screen.js').then((m) => m.VirtualScreen);
  },
  get Renderer() {
    return import('./core/renderer.js').then((m) => m.Renderer);
  },
  get ANSI() {
    return import('./core/renderer.js').then((m) => m.ANSI);
  },
};
