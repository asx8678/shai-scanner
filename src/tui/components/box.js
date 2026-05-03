// src/tui/components/box.js
// Box component - extends Component base class for TUI rendering
// Maintains backward compatibility with the original Box class in tui.js

import { Component } from '../core/component.js';
import { colorize, stripAnsi } from '../../utils.js';

// Process stdout reference for terminal width detection
import { stdout as processStdout } from 'node:process';

/**
 * Box component that renders bordered boxes with optional titles and colored borders.
 * Can be used as both a static utility (backward compatible) and as a proper Component subclass.
 */
export class Box extends Component {
  constructor(options = {}) {
    super(options || {});
    this.#title = options?.title || '';
    this.#lines = options?.lines || [];
    this.#color = options?.color !== false;
    this.#borderColor = options?.borderColor || 'green';
  }

  /** @type {string} */ #title;
  /** @type {string[]} */ #lines;
  /** @type {boolean} */ #color;
  /** @type {string} */ #borderColor;

  /** @readonly */
  get title() {
    return this.#title;
  }

  /** @readonly */
  get lines() {
    return [...this.#lines];
  }

  /** @readonly */
  get borderColor() {
    return this.#borderColor;
  }

  /**
   * Set the title and trigger re-render.
   * @param {string} title
   */
  setTitle(title) {
    this.#title = title;
    this.requestRender();
  }

  /**
   * Replace all lines and trigger re-render.
   * @param {string[]} lines
   */
  setLines(lines) {
    this.#lines = [...lines];
    this.requestRender();
  }

  /**
   * Add a line and trigger re-render.
   * @param {string} line
   */
  addLine(line) {
    this.#lines.push(line);
    this.requestRender();
  }

  /**
   * Clear all lines.
   */
  clearLines() {
    this.#lines = [];
    this.requestRender();
  }

  /**
   * Render the box to a VirtualScreen.
   * @param {import('../core/virtual-screen.js').VirtualScreen} screen
   * @param {object} ctx - Render context with bounds and terminal size
   */
  render(screen, ctx) {
    const output = Box.draw({
      title: this.#title,
      lines: this.#lines,
      color: this.#color,
      borderColor: this.#borderColor,
    });

    const lines = output.split('\n');
    const startRow = ctx?.bounds?.row ?? 0;

    for (let i = 0; i < lines.length; i++) {
      screen.setLine(startRow + i, lines[i]);
    }
  }

  /**
   * Static method to draw a box without instantiating a component.
   * Maintains backward compatibility with the original Box.draw() API.
   *
   * @param {object} options
   * @param {string} [options.title=''] - Box title
   * @param {string[]} [options.lines=[]] - Lines of content
   * @param {boolean} [options.color=true] - Enable/disable color
   * @param {string} [options.borderColor='green'] - Border color name
   * @returns {string} Rendered box as a string
   */
  static draw(options = {}) {
    const { title = '', lines = [], color = true, borderColor = 'green' } = options;

    const c = colorize(color);
    const border = c[borderColor] || c.green;

    // Always read the latest terminal width — handles resize
    const maxWidth = Math.max(40, processStdout.columns || 80);

    // Measure content width (strip ANSI for accurate measurement)
    const contentWidths = [
      title ? title.length + 2 : 0, // +2 for padding around title
      ...lines.map((l) => stripAnsi(l).length),
    ];
    const contentWidth = Math.max(...contentWidths, 0);

    // Box width: content + 4 (2 spaces padding each side + border chars)
    const boxWidth = Math.min(contentWidth + 4, maxWidth);
    const innerWidth = boxWidth - 4; // space for content between │ │

    const topBorder = title
      ? `┌─ ${title} ${'─'.repeat(Math.max(0, innerWidth - title.length - 1))}┐`
      : `┌${'─'.repeat(innerWidth + 2)}┐`;

    const bottomBorder = `└${'─'.repeat(innerWidth + 2)}┘`;

    const result = [border(topBorder)];

    for (const line of lines) {
      const clean = stripAnsi(line);
      // Truncate lines that exceed the box width to prevent overflow
      const truncated = clean.length > innerWidth ? clean.slice(0, innerWidth - 1) + '…' : clean;
      const padding = Math.max(0, innerWidth - truncated.length);
      result.push(
        `${border('│ ')}${line.length > innerWidth ? truncated : line}${' '.repeat(padding)}${border(' │')}`,
      );
    }

    result.push(border(bottomBorder));

    return result.join('\n');
  }
}

export default Box;
