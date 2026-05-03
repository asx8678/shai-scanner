// src/tui/components/input.js
// TextInput component - extends Component base class for TUI rendering
// Maintains backward compatibility with the original TextInput class in tui.js

import { Component } from '../core/component.js';
import { colorize } from '../../utils.js';

// Process stdin/stdout references
import { stdin as processStdin, stdout as processStdout } from 'node:process';
import { createInterface } from 'node:readline/promises';

/**
 * TextInput component that provides single-line text input via readline.
 * Can be used as both a static utility (backward compatible) and as a proper Component subclass.
 */
export class TextInput extends Component {
  constructor(options = {}) {
    super(options);
    this.#prompt = options?.prompt || '';
    this.#defaultValue = options?.defaultValue || '';
    this.#color = options?.color !== false;
    this.#inputBuffer = '';
    this.#cursorPosition = 0;
    this.#rl = null;
    this.#complete = false;
    this.#result = null;
  }

  /** @type {string} */ #prompt;
  /** @type {string} */ #defaultValue;
  /** @type {boolean} */ #color;
  /** @type {string} */ #inputBuffer;
  /** @type {number} */ #cursorPosition;
  /** @type {import('node:readline/promises').Interface | null} */ #rl;
  /** @type {boolean} */ #complete;
  /** @type {string | null} */ #result;

  /** @readonly */ get prompt() {
    return this.#prompt;
  }
  /** @readonly */ get defaultValue() {
    return this.#defaultValue;
  }
  /** @readonly */ get isComplete() {
    return this.#complete;
  }
  /** @readonly */ get result() {
    return this.#result;
  }
  /** @readonly */ get inputBuffer() {
    return this.#inputBuffer;
  }

  /**
   * Mount the component - setup readline interface.
   */
  mount() {
    super.mount();
    this.#setupReadline();
  }

  /**
   * Unmount the component - cleanup readline.
   */
  unmount() {
    this.#cleanupReadline();
    super.unmount();
  }

  /**
   * Setup readline interface for interactive input.
   * @private
   */
  #setupReadline() {
    if (!processStdin.isTTY || !processStdout.isTTY) {
      // Non-TTY: set default value directly
      this.#result = this.#defaultValue || null;
      this.#complete = true;
      this.setState({
        inputBuffer: this.#defaultValue,
        complete: true,
        result: this.#result,
      });
      return;
    }

    this.#rl = createInterface({
      input: processStdin,
      output: processStdout,
    });
  }

  /**
   * Cleanup readline interface.
   * @private
   */
  #cleanupReadline() {
    if (this.#rl) {
      this.#rl.close();
      this.#rl = null;
    }
  }

  /**
   * Handle a keypress event.
   * @param {object} key - Key object with name, char, raw properties
   * @returns {boolean} true if handled, false to bubble up
   */
  handleKey(key) {
    if (this.#complete) return false;

    if (key.name === 'return') {
      // Submit input
      const trimmed = this.#inputBuffer.trim();
      this.#result = trimmed || this.#defaultValue || null;
      this.#complete = true;
      this.setState({
        inputBuffer: this.#inputBuffer,
        complete: true,
        result: this.#result,
      });
      return true;
    }

    if (key.name === 'escape') {
      // Cancel
      this.#result = null;
      this.#complete = true;
      this.setState({
        inputBuffer: this.#inputBuffer,
        complete: true,
        result: null,
      });
      return true;
    }

    if (key.name === 'backspace') {
      // Delete character
      this.#inputBuffer = this.#inputBuffer.slice(0, -1);
      this.setState({ inputBuffer: this.#inputBuffer });
      return true;
    }

    if (key.char && !key.ctrl && !key.meta) {
      // Add character
      this.#inputBuffer += key.char;
      this.setState({ inputBuffer: this.#inputBuffer });
      return true;
    }

    return false;
  }

  /**
   * Render the component to a VirtualScreen.
   * @param {import('../core/virtual-screen.js').VirtualScreen} screen
   * @param {object} ctx - Render context with bounds and terminal size
   */
  render(screen, ctx) {
    const c = colorize(this.#color);
    const promptStr = `${c.bold(this.#prompt)}`;

    // Build display string
    let display = promptStr;
    if (!this.#complete && this.#defaultValue) {
      display += `${c.dim(`(${this.#defaultValue}) `)}`;
    }

    if (!this.#complete) {
      display += this.#inputBuffer;
    } else if (this.#result !== null) {
      display += this.#result;
    }

    // Write to virtual screen
    const startRow = ctx?.bounds?.row ?? 0;
    screen.setLine(startRow, display);
  }

  /**
   * Static method to run TextInput without instantiating a component.
   * Maintains backward compatibility with the original TextInput.run() API.
   *
   * @param {object} options
   * @param {string} [options.prompt=''] - Display prompt text
   * @param {string} [options.defaultValue=''] - Default value if no input
   * @param {boolean} [options.color=true] - Enable/disable color
   * @returns {Promise<string | null>} User input or default value, null on error
   */
  static async run(options = {}) {
    const { prompt = '', defaultValue = '', color = true } = options;

    const c = colorize(color);
    const promptStr = `${c.bold(prompt)}`;

    if (!processStdin.isTTY || !processStdout.isTTY) {
      // Non-TTY: just return default
      processStdout.write(`${promptStr}${defaultValue}\n`);
      return defaultValue || null;
    }

    // Use readline/promises for proper line editing
    const rl = createInterface({
      input: processStdin,
      output: processStdout,
    });

    // Build the prompt text
    const fullPrompt = defaultValue ? `${promptStr}${c.dim(`(${defaultValue}) `)}` : promptStr;

    try {
      const answer = await rl.question(fullPrompt);
      const result = answer.trim() || defaultValue;
      return result || null;
    } catch {
      // Ctrl+C or other error
      return null;
    } finally {
      rl.close();
    }
  }
}

// ───────────────────────────────────────────────────────────────────────────────
//  confirm — yes/no prompt
// ───────────────────────────────────────────────────────────────────────────────

/**
 * confirm component that provides yes/no prompt via readline.
 * Can be used as both a static utility (backward compatible) and as a proper Component subclass.
 */
export class Confirm extends Component {
  constructor(options = {}) {
    super(options);
    this.#question = options?.question || '';
    this.#defaultValue = options?.defaultValue !== false;
    this.#color = options?.color !== false;
    this.#complete = false;
    this.#result = null;
    this.#rl = null;
  }

  /** @type {string} */ #question;
  /** @type {boolean} */ #defaultValue;
  /** @type {boolean} */ #color;
  /** @type {boolean} */ #complete;
  /** @type {boolean | null} */ #result;
  /** @type {import('node:readline/promises').Interface | null} */ #rl;

  /** @readonly */ get question() {
    return this.#question;
  }
  /** @readonly */ get defaultValue() {
    return this.#defaultValue;
  }
  /** @readonly */ get isComplete() {
    return this.#complete;
  }
  /** @readonly */ get result() {
    return this.#result;
  }

  /**
   * Mount the component - setup readline interface.
   */
  mount() {
    super.mount();
    this.#setupReadline();
  }

  /**
   * Unmount the component - cleanup readline.
   */
  unmount() {
    this.#cleanupReadline();
    super.unmount();
  }

  /**
   * Setup readline interface for interactive input.
   * @private
   */
  #setupReadline() {
    if (!processStdin.isTTY || !processStdout.isTTY) {
      // Non-TTY: return default value
      this.#result = this.#defaultValue;
      this.#complete = true;
      this.setState({
        complete: true,
        result: this.#result,
      });
      return;
    }

    this.#rl = createInterface({
      input: processStdin,
      output: processStdout,
    });
  }

  /**
   * Cleanup readline interface.
   * @private
   */
  #cleanupReadline() {
    if (this.#rl) {
      this.#rl.close();
      this.#rl = null;
    }
  }

  /**
   * Handle a keypress event.
   * @param {object} key - Key object with name, char, raw properties
   * @returns {boolean} true if handled, false to bubble up
   */
  handleKey(key) {
    if (this.#complete) return false;

    if (key.name === 'return') {
      // Submit - use default if empty
      this.#result = this.#defaultValue;
      this.#complete = true;
      this.setState({
        complete: true,
        result: this.#result,
      });
      return true;
    }

    if (key.name === 'escape') {
      // Cancel - use default
      this.#result = this.#defaultValue;
      this.#complete = true;
      this.setState({
        complete: true,
        result: this.#result,
      });
      return true;
    }

    if (key.char) {
      const lower = key.char.toLowerCase();
      if (['y', 'n'].includes(lower)) {
        this.#result = lower === 'y';
        this.#complete = true;
        this.setState({
          complete: true,
          result: this.#result,
        });
        return true;
      }
    }

    return false;
  }

  /**
   * Render the component to a VirtualScreen.
   * @param {import('../core/virtual-screen.js').VirtualScreen} screen
   * @param {object} ctx - Render context with bounds and terminal size
   */
  render(screen, ctx) {
    const c = colorize(this.#color);
    const hint = this.#defaultValue ? `${c.dim('[Y/n]')}` : `${c.dim('[y/N]')}`;

    const display = `${c.bold(this.#question)} ${hint}`;

    // Write to virtual screen
    const startRow = ctx?.bounds?.row ?? 0;
    screen.setLine(startRow, display);
  }

  /**
   * Static method to run confirm without instantiating a component.
   * Maintains backward compatibility with the original confirm() function.
   *
   * @param {string} question - The question to ask
   * @param {boolean} [defaultValue=true] - Default answer (true for Y, false for N)
   * @param {object} [options={}] - Options
   * @param {boolean} [options.color=true] - Enable/disable color
   * @returns {Promise<boolean>} User answer
   */
  static async run(question, defaultValue = true, options = {}) {
    const { color = true } = options;
    const c = colorize(color);

    const hint = defaultValue ? `${c.dim('[Y/n]')}` : `${c.dim('[y/N]')}`;

    if (!processStdin.isTTY || !processStdout.isTTY) {
      processStdout.write(`${c.bold(question)} ${hint} ${defaultValue ? 'y' : 'n'}\n`);
      return defaultValue;
    }

    const rl = createInterface({
      input: processStdin,
      output: processStdout,
    });

    try {
      const answer = await rl.question(`${c.bold(question)} ${hint} `);
      const trimmed = answer.trim().toLowerCase();

      if (trimmed === '') return defaultValue;
      if (['y', 'yes', 'yeah', 'yep'].includes(trimmed)) return true;
      if (['n', 'no', 'nope', 'nah'].includes(trimmed)) return false;

      // Invalid input: ask again recursively
      rl.close();
      return Confirm.run(question, defaultValue, { color });
    } catch {
      return defaultValue;
    } finally {
      rl.close();
    }
  }
}

/**
 * Backward-compatible confirm function.
 * Wraps the Confirm class to maintain the original API.
 */
export async function confirm(question, defaultValue = true, options = {}) {
  return Confirm.run(question, defaultValue, options);
}

export default TextInput;
