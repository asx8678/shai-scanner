// src/tui/core/screen-manager.js
// ScreenManager — manages alternate screen buffer, cursor visibility, and terminal resize events.

import { stdin as processStdin, stdout as processStdout } from 'node:process';
import { ANSI } from './renderer.js';
import { registerCleanup } from './cleanup.js';
import { onResize, getTerminalSize } from './terminal.js';

/**
 * @typedef {object} ScreenManagerOptions
 * @property {import('node:stream').Writable} [stdout] — writable stream (default: process.stdout)
 * @property {import('node:stream').Readable} [stdin]  — readable stream (default: process.stdin)
 */

/**
 * ScreenManager — manages alternate screen buffer, cursor visibility,
 * and terminal resize events as a cohesive lifecycle.
 *
 * Usage:
 *   const sm = new ScreenManager();
 *   sm.enter();           // switch to alternate screen
 *   sm.onResize(({ cols, rows }) => { ... });
 *   // ... render your TUI ...
 *   sm.exit();            // restore terminal
 *
 * The manager is safe to call enter()/exit() multiple times (idempotent).
 * It automatically registers with the cleanup tracker so unexpected exits
 * still restore the terminal.
 */
export class ScreenManager {
  /** @type {boolean} */
  isInAlternateScreen = false;

  /** @type {{ cols: number, rows: number }} */
  terminalSize = { cols: 80, rows: 24 };

  /** @type {Array<(size: { cols: number, rows: number }) => void>} */
  resizeListeners = [];

  /** @type {import('node:stream').Writable} */
  #stdout;

  /** @type {import('node:stream').Readable} */
  #stdin;

  /** @type {boolean} */
  #sigwinchRegistered = false;

  /** @type {(() => void) | null} */
  #unsubscribeCleanup = null;

  /** @type {(() => void) | null} */
  #unsubscribeGlobalResize = null;

  /**
   * @param {ScreenManagerOptions} [options]
   */
  constructor(options = {}) {
    this.#stdout = options.stdout || processStdout;
    this.#stdin = options.stdin || processStdin;
    this.terminalSize = this.getSize();
  }

  /**
   * Switch to alternate screen buffer, hide cursor, clear screen,
   * and begin tracking terminal size.
   * Safe to call multiple times (idempotent).
   */
  enter() {
    if (this.isInAlternateScreen) return;

    // Only emit escape codes when stdout is a TTY
    if (this.#stdout.isTTY) {
      this.#stdout.write(ANSI.enterAlternateScreen);
      this.#stdout.write(ANSI.cursorHide);
      this.#stdout.write(ANSI.clear);
      this.#stdout.write(ANSI.cursorHome);
    }

    this.isInAlternateScreen = true;
    this.terminalSize = this.getSize();

    // Register SIGWINCH tracking
    this.#registerResizeHandler();

    // Register with centralized cleanup so unexpected exits restore state
    this.#unsubscribeCleanup = registerCleanup(() => this.exit());
  }

  /**
   * Restore cursor, switch back to main screen, and tear down listeners.
   * Safe to call multiple times (idempotent).
   */
  exit() {
    if (!this.isInAlternateScreen) return;

    if (this.#stdout.isTTY) {
      this.#stdout.write(ANSI.cursorShow);
      this.#stdout.write(ANSI.exitAlternateScreen);
    }

    this.isInAlternateScreen = false;

    // Unregister resize handler
    this.#unregisterResizeHandler();

    // Unregister from cleanup tracker
    if (this.#unsubscribeCleanup) {
      this.#unsubscribeCleanup();
      this.#unsubscribeCleanup = null;
    }
  }

  /**
   * Clear the entire screen and move cursor to top-left.
   */
  clear() {
    if (this.#stdout.isTTY) {
      this.#stdout.write(ANSI.clear);
      this.#stdout.write(ANSI.cursorHome);
    }
  }

  /**
   * Return the current terminal size.
   * @returns {{ cols: number, rows: number }}
   */
  getSize() {
    return {
      cols: this.#stdout.columns || 80,
      rows: this.#stdout.rows || 24,
    };
  }

  /**
   * Register a resize listener. Returns an unsubscribe function.
   * @param {(size: { cols: number, rows: number }) => void} callback
   * @returns {() => void} unsubscribe
   */
  onResize(callback) {
    this.resizeListeners.push(callback);
    return () => {
      const idx = this.resizeListeners.indexOf(callback);
      if (idx !== -1) this.resizeListeners.splice(idx, 1);
    };
  }

  /**
   * Update cached size and notify registered listeners.
   * @private
   */
  #updateSize() {
    const newSize = this.getSize();
    // Only notify if dimensions actually changed (avoid resize storms)
    if (newSize.cols !== this.terminalSize.cols || newSize.rows !== this.terminalSize.rows) {
      this.terminalSize = newSize;
      for (const cb of this.resizeListeners.slice()) {
        try {
          cb(newSize);
        } catch {
          /* swallow */
        }
      }
    }
  }

  /**
   * Register the global SIGWINCH handler and wire it to #updateSize.
   * @private
   */
  #registerResizeHandler() {
    if (this.#sigwinchRegistered) return;
    this.#sigwinchRegistered = true;

    // Also hook into the module-level resize bus so we don't duplicate
    // SIGWINCH listeners (Node allows many, but we want clean lifecycle).
    this.#unsubscribeGlobalResize = onResize((size) => {
      // size comes from the global SIGWINCH handler — forward to our own state
      this.terminalSize = size;
      for (const cb of this.resizeListeners.slice()) {
        try {
          cb(size);
        } catch {
          /* swallow */
        }
      }
    });
  }

  /**
   * Tear down the global resize wiring.
   * @private
   */
  #unregisterResizeHandler() {
    if (!this.#sigwinchRegistered) return;
    this.#sigwinchRegistered = false;

    if (this.#unsubscribeGlobalResize) {
      this.#unsubscribeGlobalResize();
      this.#unsubscribeGlobalResize = null;
    }
  }
}
