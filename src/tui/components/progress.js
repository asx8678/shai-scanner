// src/tui/components/progress.js
// Spinner, ProgressBar, and LiveProgress components - extends Component base class for TUI rendering
// Maintains backward compatibility with the original classes in tui.js

import { Component } from '../core/component.js';
import { colorize, stripAnsi } from '../../utils.js';

// Process stderr reference for terminal detection
import { stderr as processStderr } from 'node:process';
import { onResize } from '../../tui.js';

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const SPINNER_INTERVAL = 80;

/**
 * Spinner component that displays an animated spinner with text.
 * Can be used as both a static utility (backward compatible) and as a proper Component subclass.
 */
export class Spinner extends Component {
  /** @type {string} */ #text = '';
  /** @type {number} */ #frame = 0;
  /** @type {ReturnType<typeof setInterval> | null} */ #interval = null;
  /** @type {boolean} */ #running = false;
  /** @type {boolean} */ #isTTY = false;
  /** @type {ReturnType<typeof colorize> | null} */ #color = null;
  /** @type {string | null} */ #status = null; // null | 'success' | 'failure'
  /** @type {string} */ #statusText = '';

  constructor(text = '', options = {}) {
    super(options);
    this.#text = text;
    this.#isTTY = processStderr.isTTY;
    this.#color = colorize(options.color !== false);
    this.#status = null;
    this.#statusText = '';
  }

  /**
   * Check if the spinner is currently running.
   * @returns {boolean}
   */
  get isRunning() {
    return this.#running;
  }

  /**
   * Mount the component - don't auto-start animation.
   */
  mount() {
    super.mount();
    // Note: Don't auto-start in mount(), let start() handle it
  }

  /**
   * Unmount the component - cleanup interval.
   */
  unmount() {
    this.#stop();
    super.unmount();
  }

  /**
   * Render the spinner to a VirtualScreen.
   * @param {import('../core/virtual-screen.js').VirtualScreen} screen
   * @param {object} ctx - Render context with bounds and terminal size
   */
  render(screen, ctx) {
    if (!this.#isTTY) return;

    if (this.#status) {
      // Final state rendering
      const icon = this.#status === 'success' ? this.#color.green('✓') : this.#color.red('✗');
      screen.setLine(ctx?.bounds?.row ?? 0, `${icon} ${this.#color.bold(this.#statusText)}`);
    } else if (this.#running) {
      // Animation rendering
      const frame = this.#color.cyan(SPINNER_FRAMES[this.#frame]);
      screen.setLine(ctx?.bounds?.row ?? 0, `${frame} ${this.#color.bold(this.#text)}`);
    }
  }

  /**
   * Start the spinner animation.
   */
  start() {
    if (this.#running) return;
    this.#running = true;
    this.#status = null;
    this.#frame = 0;

    if (!this.#isTTY) {
      // Non-TTY: write once and return
      processStderr.write(`${this.#color.bold(this.#text)}\n`);
      return;
    }

    // Start animation interval
    this.#interval = setInterval(() => {
      this.#frame = (this.#frame + 1) % SPINNER_FRAMES.length;
      this.requestRender(); // Trigger re-render
    }, SPINNER_INTERVAL);

    this.requestRender(); // Initial render
  }

  /**
   * Update the spinner text.
   * @param {string} text - New text to display
   */
  update(text) {
    this.#text = text;
    if (!this.#running) return;
    this.requestRender();
  }

  /**
   * Show success state and stop the spinner.
   * @param {string} text - Success message to display
   */
  succeed(text) {
    this.#stop();
    this.#status = 'success';
    this.#statusText = text;
    if (!this.#isTTY) {
      processStderr.write(`${this.#color.green('✓')} ${this.#color.bold(text)}\n`);
    } else {
      this.requestRender();
      // Write final state to stderr for backward compatibility
      processStderr.write(`\r${this.#color.green('✓')} ${this.#color.bold(text)}\n`);
    }
  }

  /**
   * Show failure state and stop the spinner.
   * @param {string} text - Failure message to display
   */
  fail(text) {
    this.#stop();
    this.#status = 'failure';
    this.#statusText = text;
    if (!this.#isTTY) {
      processStderr.write(`${this.#color.red('✗')} ${this.#color.bold(text)}\n`);
    } else {
      this.requestRender();
      // Write final state to stderr for backward compatibility
      processStderr.write(`\r${this.#color.red('✗')} ${this.#color.bold(text)}\n`);
    }
  }

  /**
   * Stop the spinner animation.
   */
  stop() {
    this.#stop();
  }

  /**
   * Internal stop method to clear interval.
   */
  #stop() {
    this.#running = false;
    if (this.#interval) {
      clearInterval(this.#interval);
      this.#interval = null;
    }
  }

  /**
   * Backward-compatible static method.
   * Creates a spinner, runs a function, and handles success/failure.
   * @param {string} text - Initial spinner text
   * @param {Function} fn - Async function to run (receives update callback)
   * @returns {Promise<any>} - Result of the function
   */
  static async run(text, fn) {
    const spinner = new Spinner(text);
    spinner.start();
    try {
      const result = await fn((msg) => spinner.update(msg));
      spinner.succeed(typeof result === 'string' ? result : text);
      return result;
    } catch (error) {
      spinner.fail(error.message || 'Failed');
      throw error;
    }
  }

  /**
   * Static method to draw a spinner frame without instantiation.
   * @param {string} text - Text to display
   * @param {number} frame - Frame index
   * @returns {string} - Formatted spinner frame
   */
  static draw(text, frame = 0) {
    const c = colorize(true);
    const frameChar = SPINNER_FRAMES[frame % SPINNER_FRAMES.length];
    return `${c.cyan(frameChar)} ${c.bold(text)}`;
  }
}

/**
 * ProgressBar component that displays a progress bar with percentage.
 * Can be used as both a static utility (backward compatible) and as a proper Component subclass.
 */
export class ProgressBar extends Component {
  /** @type {number} */ #total = 100;
  /** @type {number} */ #width = 30;
  /** @type {string} */ #label = '';
  /** @type {number} */ #current = 0;
  /** @type {boolean} */ #isTTY = false;
  /** @type {ReturnType<typeof colorize> | null} */ #color = null;

  constructor(options = {}) {
    super(options);
    this.#total = Math.max(options.total || 100, 1);
    this.#width = Math.max(options.width || 30, 5);
    this.#label = options.label || '';
    this.#isTTY = processStderr.isTTY;
    this.#color = colorize(options.color !== false);
  }

  /**
   * Mount the component - setup.
   */
  mount() {
    super.mount();
  }

  /**
   * Unmount the component - cleanup.
   */
  unmount() {
    super.unmount();
  }

  /**
   * Update the progress value.
   * @param {number} value - New progress value
   */
  update(value) {
    this.#current = Math.min(Math.max(value, 0), this.#total);
    this.setState({ current: this.#current });
  }

  /**
   * Increment progress by one unit.
   */
  tick() {
    this.update(this.#current + 1);
  }

  /**
   * Mark progress as complete.
   */
  done() {
    this.#current = this.#total;
    this.requestRender();
    if (this.#isTTY) processStderr.write('\n');
  }

  /**
   * Render the progress bar to a VirtualScreen.
   * @param {import('../core/virtual-screen.js').VirtualScreen} screen
   * @param {object} ctx - Render context with bounds and terminal size
   */
  render(screen, ctx) {
    if (!this.#isTTY) return;

    const pct = Math.round((this.#current / this.#total) * 100);
    const filled = Math.round((this.#current / this.#total) * this.#width);
    const empty = this.#width - filled;

    const bar = '█'.repeat(filled) + '░'.repeat(Math.max(empty, 0));
    const pctStr = String(pct).padStart(3);

    const line = `${this.#color.cyan(bar)} ${this.#color.bold(`${pctStr}%`)} ${this.#color.dim(this.#label)}`;
    screen.setLine(ctx?.bounds?.row ?? 0, line);
  }
}

// ───────────────────────────────────────────────────────────────────────────────
//  LiveProgress — multi-line progress display that updates in-place
//  Migrated from src/tui.js to the component architecture.
// ───────────────────────────────────────────────────────────────────────────────

/**
 * LiveProgress — multi-line progress display that updates in-place.
 * Shows phases with animated spinners, status indicators, and stats.
 *
 * Backward-compatible: same API as the original class in tui.js.
 */
export class LiveProgress {
  #phases = [];
  #phaseStates = new Map(); // name -> { status, text, detail }
  #stats = {};
  #interval = null;
  #running = false;
  #isTTY = false;
  #color = null;
  #frame = 0;
  #lastHeight = 0;
  #unsubResize = null;

  constructor({ color = true } = {}) {
    this.#isTTY = processStderr.isTTY;
    this.#color = colorize(color);
  }

  setPhases(phases) {
    this.#phases = phases;
    for (const name of phases) {
      if (!this.#phaseStates.has(name)) {
        this.#phaseStates.set(name, { status: 'pending', text: name, detail: '' });
      }
    }
    if (this.#running) this.render();
  }

  update(name, { status, text, detail } = {}) {
    const state = this.#phaseStates.get(name) || { status: 'pending', text: name, detail: '' };
    if (status !== undefined) state.status = status;
    if (text !== undefined) state.text = text;
    if (detail !== undefined) state.detail = detail;
    this.#phaseStates.set(name, state);
    if (this.#running) this.render();
  }

  setStats(stats) {
    this.#stats = { ...this.#stats, ...stats };
    if (this.#running) this.render();
  }

  start() {
    if (this.#running) return;
    this.#running = true;
    this.#frame = 0;

    if (!this.#isTTY) {
      // Non-TTY: just print initial state as lines
      this.#renderNonTTY();
      return;
    }

    this.render();

    // Re-render on terminal resize
    this.#unsubResize = onResize(() => this.render());

    // Animate spinners for active phases
    this.#interval = setInterval(() => {
      this.#frame = (this.#frame + 1) % SPINNER_FRAMES.length;
      this.render();
    }, SPINNER_INTERVAL);
  }

  render() {
    if (!this.#running) return;
    if (!this.#isTTY) {
      this.#renderNonTTY();
      return;
    }

    const lines = this.#buildLines();

    // Move cursor back up to overwrite previous output
    if (this.#lastHeight > 0) {
      processStderr.write(`\x1b[${this.#lastHeight}A`);
    }

    for (const line of lines) {
      processStderr.write(`\x1b[2K${line}\n`);
    }

    this.#lastHeight = lines.length;
  }

  done() {
    this.#running = false;
    if (this.#interval) {
      clearInterval(this.#interval);
      this.#interval = null;
    }

    // Unsubscribe from resize events
    if (this.#unsubResize) {
      this.#unsubResize();
      this.#unsubResize = null;
    }

    // Final render with no animation
    if (this.#isTTY) {
      // Set all active phases to pending (no spinner)
      for (const [name, state] of this.#phaseStates) {
        if (state.status === 'active') state.status = 'pending';
      }
      this.render();
    } else {
      this.#renderNonTTY();
    }
  }

  #buildLines() {
    const c = this.#color;
    const lines = [];

    for (const name of this.#phases) {
      const state = this.#phaseStates.get(name) || { status: 'pending', text: name, detail: '' };
      // Accessibility: use text labels alongside color indicators
      let prefix;
      switch (state.status) {
        case 'active':
          prefix = c.cyan(SPINNER_FRAMES[this.#frame]);
          break;
        case 'done':
          prefix = c.green('[done]');
          break;
        default:
          prefix = c.dim('[----]');
          break;
      }
      const text = state.status === 'done' ? c.dim(state.text) : c.bold(state.text);
      const detail = state.detail ? ` ${c.dim(state.detail)}` : '';
      lines.push(`${prefix} ${text}${detail}`);
    }

    // Stats box
    const statsEntries = Object.entries(this.#stats);
    if (statsEntries.length > 0) {
      const statsLine = statsEntries.map(([k, v]) => `${k}: ${c.bold(String(v))}`).join('  ');
      lines.push(c.dim(statsLine));
    }

    return lines;
  }

  #renderNonTTY() {
    const lines = this.#buildLines();
    for (const line of lines) {
      processStderr.write(`${line}\n`);
    }
  }
}
