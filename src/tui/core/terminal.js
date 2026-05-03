// src/tui/core/terminal.js
// Terminal utilities: resize handling, debounce, etc.

import { stdout as processStdout } from 'node:process';

// ─── Resize-aware infrastructure ─────────────────────────────────────────────
// Components can register a callback to be invoked on SIGWINCH.
// Only one active render callback is supported at a time (the current screen).
const RESIZE_LISTENERS = [];

/**
 * Register a callback to fire on terminal resize.
 * @param {Function} cb — called with { cols, rows }
 * @returns {Function} unsubscribe
 */
export function onResize(cb) {
  RESIZE_LISTENERS.push(cb);
  return () => {
    const idx = RESIZE_LISTENERS.indexOf(cb);
    if (idx !== -1) RESIZE_LISTENERS.splice(idx, 1);
  };
}

/**
 * Get the current terminal dimensions.
 * @returns {{ cols: number, rows: number }}
 */
export function getTerminalSize() {
  return {
    cols: processStdout.columns || 80,
    rows: processStdout.rows || 24,
  };
}

/**
 * Debounce a function: delays invocation until `ms` after the last call.
 * Useful for rapid keypress events or resize storms.
 * @param {Function} fn
 * @param {number} ms
 * @returns {{ trigger: Function, cancel: Function, flush: Function }}
 */
export function debounce(fn, ms = 100) {
  let timer = null;
  const wrapper = {
    trigger(...args) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        fn(...args);
      }, ms);
    },
    cancel() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    },
    flush(...args) {
      wrapper.cancel();
      fn(...args);
    },
  };
  return wrapper;
}

/**
 * Get the resize listeners (for internal use).
 * @internal
 */
export function getResizeListeners() {
  return RESIZE_LISTENERS;
}
