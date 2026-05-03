// src/tui/core/virtual-screen.js
// 2D character buffer with per-cell attributes, dirty tracking, and region support

import { stripAnsi } from '../../utils.js';

export class VirtualScreen {
  /** @type {number} */
  cols;
  /** @type {number} */
  rows;

  /** @type {string[][]} */
  buffer;

  /** @type {(string|null)[][]} */
  attributes;

  /** @type {Set<number>} */
  #dirty;

  /** @type {Map<string, {row: number, col: number, width: number, height: number}>} */
  #regions;

  constructor(cols, rows) {
    this.cols = Math.max(1, cols | 0);
    this.rows = Math.max(1, rows | 0);
    this.buffer = [];
    this.attributes = [];
    this.#dirty = new Set();
    this.#regions = new Map();
    this.#allocate(this.rows, this.cols);
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  /**
   * Write a full line of text at row.
   * Text is stripped of ANSI escapes before storage.
   *
   * @param {number} row - 0-based row index
   * @param {string} text - display text
   * @param {string | { attribute?: string, segments?: Array<{ col: number, len: number, attribute: string }> }} [opts]
   */
  setLine(row, text, opts) {
    if (row < 0 || row >= this.rows) return;

    const cfg = typeof opts === 'string' || opts == null ? { attribute: opts ?? null } : opts;

    const clean = stripAnsi(text || '');
    const len = Math.min(clean.length, this.cols);

    for (let col = 0; col < this.cols; col++) {
      this.buffer[row][col] = ' ';
      this.attributes[row][col] = null;
    }

    if (cfg.attribute) {
      for (let col = 0; col < len; col++) {
        this.attributes[row][col] = cfg.attribute;
      }
    }

    for (let col = 0; col < len; col++) {
      this.buffer[row][col] = clean[col];
    }

    if (Array.isArray(cfg.segments)) {
      for (const seg of cfg.segments) {
        const end = Math.min(seg.col + seg.len, this.cols);
        for (let col = Math.max(0, seg.col); col < end; col++) {
          this.attributes[row][col] = seg.attribute ?? null;
        }
      }
    }

    this.markDirty(row);
  }

  /**
   * Set an individual cell.
   * @param {number} row
   * @param {number} col
   * @param {string} char - single character
   * @param {string|null} [attribute=null]
   */
  setCell(row, col, char, attribute = null) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
    if (this.buffer[row][col] !== char || this.attributes[row][col] !== attribute) {
      this.buffer[row][col] = char;
      this.attributes[row][col] = attribute;
      this.markDirty(row);
    }
  }

  /**
   * Get the plain text content of a row.
   * @param {number} row
   * @returns {string}
   */
  getLine(row) {
    if (row < 0 || row >= this.rows) return '';
    return this.buffer[row].join('');
  }

  /**
   * Get the attribute at a specific cell.
   * @param {number} row
   * @param {number} col
   * @returns {string|null}
   */
  getCellAttribute(row, col) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
    return this.attributes[row][col];
  }

  /** Clear the entire buffer to spaces and mark every row dirty. */
  clear() {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        this.buffer[row][col] = ' ';
        this.attributes[row][col] = null;
      }
      this.markDirty(row);
    }
  }

  /**
   * Resize the buffer, preserving existing content where dimensions overlap.
   * New cells are filled with spaces. All rows are marked dirty.
   *
   * @param {number} cols
   * @param {number} rows
   */
  resize(cols, rows) {
    const newCols = Math.max(1, cols | 0);
    const newRows = Math.max(1, rows | 0);

    const newBuffer = Array.from({ length: newRows }, (_, r) =>
      Array.from({ length: newCols }, (_, c) =>
        r < this.rows && c < this.cols ? this.buffer[r][c] : ' ',
      ),
    );
    const newAttrs = Array.from({ length: newRows }, (_, r) =>
      Array.from({ length: newCols }, (_, c) =>
        r < this.rows && c < this.cols ? this.attributes[r][c] : null,
      ),
    );

    this.cols = newCols;
    this.rows = newRows;
    this.buffer = newBuffer;
    this.attributes = newAttrs;

    for (let r = 0; r < newRows; r++) this.markDirty(r);
  }

  /** Mark a single row as changed. */
  markDirty(row) {
    this.#dirty.add(row);
  }

  /** @returns {boolean} */
  isDirty(row) {
    return this.#dirty.has(row);
  }

  /** Clear all dirty flags. */
  clearDirty() {
    this.#dirty.clear();
  }

  /** @returns {Set<number>} snapshot of dirty row indices */
  get dirtyRows() {
    return new Set(this.#dirty);
  }

  // ─── Region Support ──────────────────────────────────────────────────────

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
   * Clear a specific region (fill with spaces).
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

  /**
   * Get region bounds.
   * @param {string} name
   * @returns {{ row: number, col: number, width: number, height: number } | undefined}
   */
  getRegion(name) {
    return this.#regions.get(name);
  }

  /**
   * Remove a named region.
   * @param {string} name
   */
  removeRegion(name) {
    this.#regions.delete(name);
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  #allocate(rows, cols) {
    this.buffer = Array.from({ length: rows }, () => new Array(cols).fill(' '));
    this.attributes = Array.from({ length: rows }, () => new Array(cols).fill(null));
  }
}
