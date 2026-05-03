// src/tui/components/menu.js
// SelectMenu and CheckboxMenu components - extends Component base class for TUI rendering
// Maintains backward compatibility with the original classes in tui.js
//
// Stage 3 of Phase 2 TUI component migration

import { Component } from '../core/component.js';
import { colorize, stripAnsi } from '../../utils.js';

// Process stdin/stdout references
import { stdin as processStdin, stdout as processStdout } from 'node:process';

// ─── Shared KeyReader import ──────────────────────────────────────────────────
// We import KeyReader from the original tui.js since it handles raw mode
// and keypress parsing — no need to duplicate that logic.
import { KeyReader } from '../../tui.js';

// ─── Shared ANSI / resize ─────────────────────────────────────────────────────
import { ANSI, onResize } from '../../tui.js';

// ───────────────────────────────────────────────────────────────────────────────
//  SelectMenu — single-select interactive menu
// ───────────────────────────────────────────────────────────────────────────────

/**
 * SelectMenu component for single-item selection from a list.
 * Can be used as both a static utility (backward compatible) and as a proper Component subclass.
 *
 * @example
 * // Static usage (backward compatible):
 * const value = await SelectMenu.run({ title: 'Pick one:', items: [...] })
 *
 * // Component usage:
 * const menu = new SelectMenu({ title: 'Pick one:', items: [...] })
 * menu.mount()
 * menu.handleKey({ name: 'down' })
 * menu.render(screen, { bounds: { row: 0 } })
 * menu.unmount()
 */
export class SelectMenu extends Component {
  /** @type {string} */ #title;
  /** @type {Array<{label: string, value: string, description?: string}>} */ #items;
  /** @type {boolean} */ #color;
  /** @type {number} */ #selected;
  /** @type {boolean} */ #complete;
  /** @type {string | null} */ #result;
  /** @type {boolean} */ #cancelled;
  /** @type {KeyReader | null} */ #reader;
  /** @type {number} */ #lineCount;
  /** @type {Function | null} */ #unsubscribeResize;
  /** @type {Function | null} */ #resolvePromise;
  /** @type {Function | null} */ #keyLoopAbort;
  /** @type {AbortController | null} */ #abortController;

  constructor(options = {}) {
    super(options);
    this.#title = options?.title || '';
    this.#items = Array.isArray(options?.items) ? options.items : [];
    this.#color = options?.color !== false;
    this.#selected = 0;
    this.#complete = false;
    this.#result = null;
    this.#cancelled = false;
    this.#reader = null;
    this.#lineCount = 0;
    this.#unsubscribeResize = null;
    this.#resolvePromise = null;
    this.#abortController = null;
  }

  /** @readonly */ get title() {
    return this.#title;
  }
  /** @readonly */ get items() {
    return [...this.#items];
  }
  /** @readonly */ get isComplete() {
    return this.#complete;
  }
  /** @readonly */ get isCancelled() {
    return this.#cancelled;
  }
  /** @readonly */ get result() {
    return this.#result;
  }
  /** @readonly */ get selectedIndex() {
    return this.#selected;
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  /**
   * Mount the component - setup KeyReader and event listeners.
   */
  mount() {
    super.mount();

    if (!processStdin.isTTY || !processStdout.isTTY) {
      // Non-TTY: resolve immediately with fallback
      this.#complete = true;
      const first = this.#items.find((i) => !i.value?.startsWith('act:') && i.value !== 'none');
      this.#result = first ? first.value : this.#items.length > 0 ? this.#items[0].value : null;
      this.setState({ complete: true, result: this.#result });
      return;
    }

    this.#reader = new KeyReader();
    this.#abortController = new AbortController();

    // Register resize handler
    this.#unsubscribeResize = onResize(() => {
      this.requestRender();
    });
  }

  /**
   * Unmount the component - cleanup KeyReader and event listeners.
   */
  unmount() {
    if (this.#unsubscribeResize) {
      this.#unsubscribeResize();
      this.#unsubscribeResize = null;
    }
    if (this.#reader) {
      this.#reader.destroy();
      this.#reader = null;
    }
    if (this.#abortController) {
      this.#abortController.abort();
      this.#abortController = null;
    }
    super.unmount();
  }

  // ─── Key Handling ─────────────────────────────────────────────────────────

  /**
   * Handle a keypress event.
   * @param {object} key - Key object with name, char, raw properties
   * @returns {boolean} true if handled, false to bubble up
   */
  handleKey(key) {
    if (this.#complete) return false;

    switch (key.name) {
      case 'up': {
        this.#selected = (this.#selected - 1 + this.#items.length) % this.#items.length;
        this.setState({ selected: this.#selected });
        return true;
      }
      case 'down': {
        this.#selected = (this.#selected + 1) % this.#items.length;
        this.setState({ selected: this.#selected });
        return true;
      }
      case 'return': {
        this.#result = this.#items[this.#selected].value;
        this.#complete = true;
        this.setState({ complete: true, result: this.#result });
        return true;
      }
      case 'escape':
      case 'q': {
        this.#cancelled = true;
        this.#complete = true;
        this.setState({ complete: true, cancelled: true });
        return true;
      }
      default:
        return false;
    }
  }

  // ─── Rendering ────────────────────────────────────────────────────────────

  /**
   * Render the component to a VirtualScreen.
   * @param {import('../core/virtual-screen.js').VirtualScreen} screen
   * @param {object} ctx - Render context with bounds and terminal size
   */
  render(screen, ctx) {
    const c = colorize(this.#color);
    const startRow = ctx?.bounds?.row ?? 0;
    let lineIdx = 0;

    // Title
    if (this.#title) {
      screen.setLine(startRow + lineIdx, c.bold(this.#title));
      lineIdx++;
    }

    // Items
    for (let i = 0; i < this.#items.length; i++) {
      const item = this.#items[i];
      const marker = i === this.#selected ? c.cyan('▶') : ' ';
      const label = i === this.#selected ? c.bold(item.label) : item.label;
      const desc = item.description ? ` ${c.dim(item.description)}` : '';
      screen.setLine(startRow + lineIdx, `${marker} ${label}${desc}`);
      lineIdx++;
    }

    // Blank line
    screen.setLine(startRow + lineIdx, '');
    lineIdx++;

    // Hint
    screen.setLine(startRow + lineIdx, c.dim('[↑↓ navigate] [Enter select] [q quit]'));
    lineIdx++;

    this.#lineCount = lineIdx;
  }

  // ─── Static run() for backward compatibility ──────────────────────────────

  /**
   * Static method to run SelectMenu interactively.
   * Maintains backward compatibility with the original SelectMenu.run() API.
   *
   * @param {object} options
   * @param {string} [options.title=''] - Menu title
   * @param {Array<{label: string, value: string, description?: string}>} [options.items=[]] - Menu items
   * @param {boolean} [options.color=true] - Enable/disable color
   * @returns {Promise<string | null>} Selected item value, or null on cancel
   */
  static async run(options = {}) {
    const { title = '', items = [], color = true } = options;

    if (!processStdin.isTTY || !processStdout.isTTY) {
      // Non-TTY: return first actionable item's value, or null
      const first = items.find((i) => !i.value?.startsWith('act:') && i.value !== 'none');
      return first ? first.value : items.length > 0 ? items[0].value : null;
    }

    const c = colorize(color);
    const reader = new KeyReader();
    let selected = 0;
    let lineCount = 0;

    const render = () => {
      let output = '';
      if (title) output += `${c.bold(title)}\n`;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const marker = i === selected ? c.cyan('▶') : ' ';
        const label = i === selected ? c.bold(item.label) : item.label;
        const desc = item.description ? ` ${c.dim(item.description)}` : '';
        output += `${marker} ${label}${desc}\n`;
      }
      output += `\n${c.dim('[↑↓ navigate] [Enter select] [q quit]')}\n`;
      lineCount = (title ? 1 : 0) + items.length + 2;
      return output;
    };

    // Initial render
    processStdout.write(render());

    // SIGWINCH: re-render on terminal resize
    const unsubResize = onResize(() => {
      processStdout.write(ANSI.moveUp(lineCount));
      processStdout.write(render());
    });

    // Wait for keypresses
    let result = null;
    let done = false;

    while (!done) {
      const key = await reader.readKey();

      switch (key.name) {
        case 'up': {
          selected = (selected - 1 + items.length) % items.length;
          processStdout.write(ANSI.moveUp(lineCount));
          processStdout.write(render());
          break;
        }
        case 'down': {
          selected = (selected + 1) % items.length;
          processStdout.write(ANSI.moveUp(lineCount));
          processStdout.write(render());
          break;
        }
        case 'return': {
          result = items[selected].value;
          done = true;
          break;
        }
        case 'escape':
        case 'q': {
          done = true;
          break;
        }
        default:
          break;
      }
    }

    // Clean up: move up and clear all rendered lines
    unsubResize();
    processStdout.write(ANSI.moveUp(lineCount));
    for (let i = 0; i < lineCount; i++) {
      processStdout.write(`${ANSI.clearLine}\n`);
    }
    processStdout.write(ANSI.moveUp(lineCount));

    reader.destroy();
    return result;
  }
}

// ───────────────────────────────────────────────────────────────────────────────
//  CheckboxMenu — multi-select interactive menu
// ───────────────────────────────────────────────────────────────────────────────

/**
 * CheckboxMenu component for multi-item selection from a list.
 * Can be used as both a static utility (backward compatible) and as a proper Component subclass.
 *
 * @example
 * // Static usage (backward compatible):
 * const values = await CheckboxMenu.run({ title: 'Pick some:', items: [...] })
 *
 * // Component usage:
 * const menu = new CheckboxMenu({ title: 'Pick some:', items: [...] })
 * menu.mount()
 * menu.handleKey({ name: 'space' })
 * menu.render(screen, { bounds: { row: 0 } })
 * menu.unmount()
 */
export class CheckboxMenu extends Component {
  /** @type {string} */ #title;
  /** @type {Array<{label: string, value: string, description?: string, checked?: boolean}>} */ #items;
  /** @type {boolean} */ #color;
  /** @type {number} */ #selected;
  /** @type {boolean[]} */ #checked;
  /** @type {boolean} */ #complete;
  /** @type {string[] | null} */ #result;
  /** @type {boolean} */ #cancelled;
  /** @type {KeyReader | null} */ #reader;
  /** @type {number} */ #lineCount;
  /** @type {Function | null} */ #unsubscribeResize;

  constructor(options = {}) {
    super(options);
    this.#title = options?.title || '';
    this.#items = Array.isArray(options?.items) ? options.items : [];
    this.#color = options?.color !== false;
    this.#selected = 0;
    this.#checked = this.#items.map((i) => !!i.checked);
    this.#complete = false;
    this.#result = null;
    this.#cancelled = false;
    this.#reader = null;
    this.#lineCount = 0;
    this.#unsubscribeResize = null;
  }

  /** @readonly */ get title() {
    return this.#title;
  }
  /** @readonly */ get items() {
    return [...this.#items];
  }
  /** @readonly */ get isComplete() {
    return this.#complete;
  }
  /** @readonly */ get isCancelled() {
    return this.#cancelled;
  }
  /** @readonly */ get result() {
    return this.#result ? [...this.#result] : null;
  }
  /** @readonly */ get selectedIndex() {
    return this.#selected;
  }
  /** @readonly */ get checkedStates() {
    return [...this.#checked];
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  /**
   * Mount the component - setup KeyReader and event listeners.
   */
  mount() {
    super.mount();

    if (!processStdin.isTTY || !processStdout.isTTY) {
      // Non-TTY: resolve immediately with default checked items
      this.#complete = true;
      this.#result = this.#items.filter((_, i) => this.#checked[i]).map((i) => i.value);
      this.setState({ complete: true, result: this.#result });
      return;
    }

    this.#reader = new KeyReader();

    // Register resize handler
    this.#unsubscribeResize = onResize(() => {
      this.requestRender();
    });
  }

  /**
   * Unmount the component - cleanup KeyReader and event listeners.
   */
  unmount() {
    if (this.#unsubscribeResize) {
      this.#unsubscribeResize();
      this.#unsubscribeResize = null;
    }
    if (this.#reader) {
      this.#reader.destroy();
      this.#reader = null;
    }
    super.unmount();
  }

  // ─── Key Handling ─────────────────────────────────────────────────────────

  /**
   * Handle a keypress event.
   * @param {object} key - Key object with name, char, raw properties
   * @returns {boolean} true if handled, false to bubble up
   */
  handleKey(key) {
    if (this.#complete) return false;

    switch (key.name) {
      case 'up': {
        this.#selected = (this.#selected - 1 + this.#items.length) % this.#items.length;
        this.setState({ selected: this.#selected });
        return true;
      }
      case 'down': {
        this.#selected = (this.#selected + 1) % this.#items.length;
        this.setState({ selected: this.#selected });
        return true;
      }
      case 'space': {
        this.#checked[this.#selected] = !this.#checked[this.#selected];
        this.setState({ checked: [...this.#checked] });
        return true;
      }
      case 'return': {
        this.#result = this.#items.filter((_, i) => this.#checked[i]).map((i) => i.value);
        this.#complete = true;
        this.setState({ complete: true, result: this.#result });
        return true;
      }
      case 'escape': {
        this.#cancelled = true;
        this.#complete = true;
        this.setState({ complete: true, cancelled: true });
        return true;
      }
      case 'a': {
        const allChecked = this.#checked.every(Boolean);
        for (let i = 0; i < this.#checked.length; i++) this.#checked[i] = !allChecked;
        this.setState({ checked: [...this.#checked] });
        return true;
      }
      default:
        return false;
    }
  }

  // ─── Rendering ────────────────────────────────────────────────────────────

  /**
   * Render the component to a VirtualScreen.
   * @param {import('../core/virtual-screen.js').VirtualScreen} screen
   * @param {object} ctx - Render context with bounds and terminal size
   */
  render(screen, ctx) {
    const c = colorize(this.#color);
    const startRow = ctx?.bounds?.row ?? 0;
    let lineIdx = 0;

    // Title
    if (this.#title) {
      screen.setLine(startRow + lineIdx, c.bold(this.#title));
      lineIdx++;
    }

    // Items with checkboxes
    for (let i = 0; i < this.#items.length; i++) {
      const item = this.#items[i];
      const marker = i === this.#selected ? c.cyan('▶') : ' ';
      const checkbox = this.#checked[i] ? c.green('x') : ' ';
      const label = i === this.#selected ? c.bold(item.label) : item.label;
      const desc = item.description ? ` ${c.dim(item.description)}` : '';
      screen.setLine(startRow + lineIdx, `${marker} [${checkbox}] ${label}${desc}`);
      lineIdx++;
    }

    // Blank line
    screen.setLine(startRow + lineIdx, '');
    lineIdx++;

    // Hint
    const allChecked = this.#checked.every(Boolean);
    const toggleHint = allChecked ? 'none' : 'all';
    screen.setLine(
      startRow + lineIdx,
      c.dim(`[↑↓ navigate] [Space toggle] [a ${toggleHint}] [Enter confirm] [Esc cancel]`),
    );
    lineIdx++;

    this.#lineCount = lineIdx;
  }

  // ─── Static run() for backward compatibility ──────────────────────────────

  /**
   * Static method to run CheckboxMenu interactively.
   * Maintains backward compatibility with the original CheckboxMenu.run() API.
   *
   * @param {object} options
   * @param {string} [options.title=''] - Menu title
   * @param {Array<{label: string, value: string, description?: string, checked?: boolean}>} [options.items=[]] - Menu items
   * @param {boolean} [options.color=true] - Enable/disable color
   * @returns {Promise<string[] | null>} Array of selected item values, or null on cancel
   */
  static async run(options = {}) {
    const { title = '', items = [], color = true } = options;

    if (!processStdin.isTTY || !processStdout.isTTY) {
      // Non-TTY: return items that are checked by default
      return items.filter((i) => i.checked).map((i) => i.value);
    }

    const c = colorize(color);
    const reader = new KeyReader();
    let selected = 0;
    const checked = items.map((i) => !!i.checked);
    let lineCount = 0;

    const render = () => {
      let output = '';
      if (title) output += `${c.bold(title)}\n`;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const marker = i === selected ? c.cyan('▶') : ' ';
        const checkbox = checked[i] ? c.green('x') : ' ';
        const label = i === selected ? c.bold(item.label) : item.label;
        const desc = item.description ? ` ${c.dim(item.description)}` : '';
        output += `${marker} [${checkbox}] ${label}${desc}\n`;
      }
      const allChecked = checked.every(Boolean);
      const toggleHint = allChecked ? 'none' : 'all';
      output += `\n${c.dim(`[↑↓ navigate] [Space toggle] [a ${toggleHint}] [Enter confirm] [Esc cancel]`)}\n`;
      lineCount = (title ? 1 : 0) + items.length + 2;
      return output;
    };

    processStdout.write(render());

    // Re-render on terminal resize
    const unsubResize = onResize(() => {
      processStdout.write(ANSI.moveUp(lineCount));
      processStdout.write(render());
    });

    let result = null;
    let done = false;

    while (!done) {
      const key = await reader.readKey();

      switch (key.name) {
        case 'up': {
          selected = (selected - 1 + items.length) % items.length;
          processStdout.write(ANSI.moveUp(lineCount));
          processStdout.write(render());
          break;
        }
        case 'down': {
          selected = (selected + 1) % items.length;
          processStdout.write(ANSI.moveUp(lineCount));
          processStdout.write(render());
          break;
        }
        case 'space': {
          checked[selected] = !checked[selected];
          processStdout.write(ANSI.moveUp(lineCount));
          processStdout.write(render());
          break;
        }
        case 'return': {
          result = items.filter((_, i) => checked[i]).map((i) => i.value);
          done = true;
          break;
        }
        case 'escape': {
          done = true;
          break;
        }
        case 'a': {
          const allChecked = checked.every(Boolean);
          for (let i = 0; i < checked.length; i++) checked[i] = !allChecked;
          processStdout.write(ANSI.moveUp(lineCount));
          processStdout.write(render());
          break;
        }
        default:
          break;
      }
    }

    // Clear output
    unsubResize();
    processStdout.write(ANSI.moveUp(lineCount));
    for (let i = 0; i < lineCount; i++) {
      processStdout.write(`${ANSI.clearLine}\n`);
    }
    processStdout.write(ANSI.moveUp(lineCount));

    reader.destroy();
    return result;
  }
}

export default SelectMenu;
