// src/tui/core/renderer.js
// Double-buffer differential terminal renderer

import { stdout as processStdout } from 'node:process';
import { VirtualScreen } from './virtual-screen.js';

// ─── ANSI escape code constants ──────────────────────────────────────────────

export const ANSI = {
  clear: '\x1b[2J',
  clearLine: '\x1b[2K',
  cursorHome: '\x1b[H',
  cursorHide: '\x1b[?25l',
  cursorShow: '\x1b[?25h',
  cursorSave: '\x1b[s',
  cursorRestore: '\x1b[u',
  enterAlternateScreen: '\x1b[?1049h',
  exitAlternateScreen: '\x1b[?1049l',
  moveUp: (n) => `\x1b[${n}A`,
  moveDown: (n) => `\x1b[${n}B`,
  moveToCol: (n) => `\x1b[${n}G`,
  moveTo: (row, col) => `\x1b[${row};${col}H`,
};

// ─── Renderer ────────────────────────────────────────────────────────────────

/**
 * Double-buffer differential terminal renderer.
 *
 * Pipeline:
 *   1. Caller populates a VirtualScreen (the frame)
 *   2. Caller calls renderer.render(virtualScreen)
 *   3. Renderer diffs the new frame against the previous one
 *   4. Changed lines are batched into a single write operation
 *   5. Previous buffer is swapped to the just-rendered frame
 */
export class Renderer {
  /** @type {VirtualScreen} */
  currentBuffer;
  /** @type {VirtualScreen} */
  previousBuffer;
  /** @type {import('node:stream').Writable} */
  #stdout;
  /** @type {boolean} */
  #isTTY;

  /**
   * @param {{ terminalSize: { cols: number, rows: number }, onResize: (cb: Function) => Function }} screenManager
   * @param {{ stdout?: import('node:stream').Writable }} [options]
   */
  constructor(screenManager, options = {}) {
    this.#stdout = options.stdout || processStdout;
    this.#isTTY = this.#stdout.isTTY ?? false;

    const { cols, rows } = screenManager.terminalSize;
    this.currentBuffer = new VirtualScreen(cols, rows);
    this.previousBuffer = new VirtualScreen(cols, rows);

    // Subscribe to terminal resize events so buffers stay in sync
    screenManager.onResize(({ cols, rows }) => {
      this.resize(cols, rows);
    });
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  /**
   * Differential render: compare virtualScreen against the previously
   * rendered frame and write only changed lines to the terminal.
   *
   * @param {VirtualScreen} virtualScreen
   */
  render(virtualScreen) {
    if (!this.#isTTY) {
      this.#renderNonTTY(virtualScreen);
      return;
    }

    this.#syncSize(virtualScreen);

    const { cols, rows } = virtualScreen;
    const parts = [];
    let lastAttr = null;

    for (let row = 0; row < rows; row++) {
      if (!this.#lineChanged(virtualScreen, row)) continue;

      // Position cursor at start of this row (1-based ANSI)
      parts.push(ANSI.moveTo(row + 1, 1));

      for (let col = 0; col < cols; col++) {
        const ch = virtualScreen.buffer[row][col];
        const attr = virtualScreen.attributes[row][col];

        if (attr !== lastAttr) {
          if (lastAttr != null) parts.push('\x1b[0m');
          if (attr != null) parts.push(attr);
          lastAttr = attr;
        }
        parts.push(ch);
      }

      if (lastAttr != null) {
        parts.push('\x1b[0m');
        lastAttr = null;
      }

      // Clear trailing characters from a previously wider line
      parts.push(ANSI.clearLine);
    }

    // Batch write for minimal I/O
    if (parts.length > 0) {
      this.#stdout.write(parts.join(''));
    }

    this.#swapBuffers(virtualScreen);
  }

  /**
   * Force full-screen render, bypassing diff. Use for initial draw.
   *
   * @param {VirtualScreen} virtualScreen
   */
  fullRender(virtualScreen) {
    if (!this.#isTTY) {
      this.#renderNonTTY(virtualScreen);
      return;
    }

    this.#syncSize(virtualScreen);

    const { cols, rows } = virtualScreen;
    const parts = [ANSI.cursorHome];
    let lastAttr = null;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const ch = virtualScreen.buffer[row][col];
        const attr = virtualScreen.attributes[row][col];

        if (attr !== lastAttr) {
          if (lastAttr != null) parts.push('\x1b[0m');
          if (attr != null) parts.push(attr);
          lastAttr = attr;
        }
        parts.push(ch);
      }

      if (lastAttr != null) {
        parts.push('\x1b[0m');
        lastAttr = null;
      }
      if (row < rows - 1) parts.push('\n');
    }

    if (parts.length > 0) {
      this.#stdout.write(parts.join(''));
    }

    this.#swapBuffers(virtualScreen);
  }

  /** Clear terminal screen and reset both buffers. */
  clear() {
    if (this.#isTTY) {
      this.#stdout.write(ANSI.clear);
      this.#stdout.write(ANSI.cursorHome);
    }
    this.currentBuffer.clear();
    this.previousBuffer.clear();
    this.currentBuffer.clearDirty();
    this.previousBuffer.clearDirty();
  }

  /**
   * Update terminal size and resize buffers.
   * @param {number} cols
   * @param {number} rows
   */
  resize(cols, rows) {
    this.currentBuffer.resize(cols, rows);
    this.previousBuffer.resize(cols, rows);
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  /**
   * Compare a single line between the new frame and previous buffer.
   *
   * Dirty semantics: a dirty row means the caller explicitly touched it
   * (via setLine / setCell) so it MAY have changed and needs comparison.
   * A non-dirty row was definitely not touched and can be skipped cheaply.
   *
   * @param {VirtualScreen} incoming
   * @param {number} row
   * @returns {boolean}
   */
  #lineChanged(incoming, row) {
    // Untouched rows are guaranteed identical — skip expensive comparison
    if (!incoming.isDirty(row)) return false;

    const prev = this.previousBuffer;
    if (row >= prev.rows) return true;

    const prevRow = prev.buffer[row];
    const currRow = incoming.buffer[row];
    const prevAttrRow = prev.attributes[row];
    const currAttrRow = incoming.attributes[row];
    const cols = incoming.cols;

    for (let col = 0; col < cols; col++) {
      if (currRow[col] !== prevRow[col]) return true;
      if (currAttrRow[col] !== prevAttrRow[col]) return true;
    }
    return false;
  }

  /**
   * Snapshot the rendered frame into previousBuffer so the next diff
   * has an accurate baseline. Deep-copies cell data so the caller
   * retains ownership of their VirtualScreen.
   *
   * @param {VirtualScreen} rendered
   */
  #swapBuffers(rendered) {
    const { cols, rows } = rendered;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.previousBuffer.buffer[r][c] = rendered.buffer[r][c];
        this.previousBuffer.attributes[r][c] = rendered.attributes[r][c];
      }
    }
    this.previousBuffer.clearDirty();
  }

  /**
   * Ensure internal buffers match incoming screen dimensions.
   * @param {VirtualScreen} incoming
   */
  #syncSize(incoming) {
    if (this.currentBuffer.cols !== incoming.cols || this.currentBuffer.rows !== incoming.rows) {
      this.currentBuffer.resize(incoming.cols, incoming.rows);
    }
    if (this.previousBuffer.cols !== incoming.cols || this.previousBuffer.rows !== incoming.rows) {
      this.previousBuffer.resize(incoming.cols, incoming.rows);
    }
  }

  /**
   * Non-TTY fallback: dump plain text to stdout.
   * @param {VirtualScreen} virtualScreen
   */
  #renderNonTTY(virtualScreen) {
    for (let row = 0; row < virtualScreen.rows; row++) {
      processStdout.write(virtualScreen.getLine(row) + '\n');
    }
  }
}
