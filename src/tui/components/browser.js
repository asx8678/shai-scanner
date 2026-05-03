// src/tui/components/browser.js
// FileBrowser component — extends Component base class for TUI rendering
// Maintains backward compatibility with the original FileBrowser class in tui.js
//
// Stage 4 of Phase 2 TUI component migration

import { Component } from '../core/component.js';
import { colorize } from '../../utils.js';
import { resolve, parse, dirname, join, extname, relative, basename } from 'node:path';
import { stdin as processStdin, stdout as processStdout } from 'node:process';

// ─── Shared KeyReader / ANSI / resize imports from original tui.js ───────────
import { KeyReader, ANSI, onResize, getTerminalSize } from '../../tui.js';

// ─── Done sentinel (frozen, shared between class and static run) ─────────────
const DONE_ENTRY = Object.freeze({
  name: '✅ Done — press Enter to finish',
  isDir: false,
  isFile: false,
  isHidden: false,
  path: null,
  isDone: true,
});

// ─── Max visible rows (terminal-aware) ──────────────────────────────────────
const getMaxVisible = () => Math.max(5, getTerminalSize().rows - 10);

// ───────────────────────────────────────────────────────────────────────────────
//  FileBrowser — interactive multi-select file browser
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Interactive file browser component with directory navigation, multi-select,
 * filtering, icons, and scrolling.
 *
 * @example
 * // Static usage (backward compatible):
 * const paths = await FileBrowser.run({ startDir: '.', title: 'Select Files' })
 *
 * // Component usage:
 * const browser = new FileBrowser({ startDir: '.', title: 'Select Files' })
 * browser.mount()
 * browser.handleKey({ name: 'down' })
 * browser.render(screen, { bounds: { row: 0 } })
 * const paths = browser.selectedPaths
 * browser.unmount()
 */
export class FileBrowser extends Component {
  // ─── Configuration & state ─────────────────────────────────────────────
  /** @type {string} */ #startDir;
  /** @type {string} */ #title;
  /** @type {boolean} */ #selectFiles;
  /** @type {boolean} */ #selectDirs;
  /** @type {boolean} */ #showHidden;
  /** @type {string[] | null} */ #fileFilter;
  /** @type {boolean} */ #color;
  /** @type {string} */ #currentDir;
  /** @type {Array} */ #entries;
  /** @type {number} */ #cursorPos;
  /** @type {Set<string>} */ #selectedPaths;
  /** @type {boolean} */ #showHiddenFiles;
  /** @type {number} */ #scrollTop;
  /** @type {Map<string, Array>} */ #dirCache;
  /** @type {boolean} */ #complete;
  /** @type {string[] | null} */ #result;
  /** @type {boolean} */ #cancelled;
  /** @type {KeyReader | null} */ #reader;
  /** @type {Function | null} */ #unsubscribeResize;
  /** @type {boolean} */ #pendingAsync;
  /** @type {number} */ #lineCount;

  constructor(options = {}) {
    super(options);
    this.#startDir = options?.startDir ?? '.';
    this.#title = options?.title ?? 'Select Paths';
    this.#selectFiles = options?.selectFiles !== false;
    this.#selectDirs = options?.selectDirs !== false;
    this.#showHidden = options?.showHidden === true;
    this.#fileFilter = Array.isArray(options?.fileFilter) ? options.fileFilter : null;
    this.#color = options?.color !== false;
    this.#currentDir = '';
    this.#entries = [];
    this.#cursorPos = 0;
    this.#selectedPaths = new Set();
    this.#showHiddenFiles = this.#showHidden;
    this.#scrollTop = 0;
    this.#dirCache = new Map();
    this.#complete = false;
    this.#result = null;
    this.#cancelled = false;
    this.#reader = null;
    this.#unsubscribeResize = null;
    this.#pendingAsync = false;
    this.#lineCount = 0;
  }

  /** @readonly */ get title() {
    return this.#title;
  }
  /** @readonly */ get currentDir() {
    return this.#currentDir;
  }
  /** @readonly */ get isComplete() {
    return this.#complete;
  }
  /** @readonly */ get isCancelled() {
    return this.#cancelled;
  }
  /** @readonly */ get cursorPos() {
    return this.#cursorPos;
  }
  /** @readonly */ get showHidden() {
    return this.#showHiddenFiles;
  }
  /** @returns {string[]} Currently selected absolute paths */
  get selectedPaths() {
    return Array.from(this.#selectedPaths);
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  mount() {
    super.mount();
    if (!processStdin.isTTY || !processStdout.isTTY) {
      this.#currentDir = resolve(this.#startDir);
      this.#complete = true;
      this.#result = [this.#currentDir];
      this.setState({ complete: true, result: this.#result });
      return;
    }
    this.#reader = new KeyReader();
    this.#unsubscribeResize = onResize(() => {
      this.#dirCache.clear();
      this.requestRender();
    });
    this.#initDir();
  }

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

  async #initDir() {
    this.#currentDir = resolve(this.#startDir);
    await this.#readCurrentEntries();
    this.requestRender();
  }

  // ─── Directory reading & caching ────────────────────────────────────────
  #cacheKey(dir) {
    return `${dir}::${this.#showHiddenFiles}::${this.#fileFilter?.join(',') ?? ''}`;
  }

  async #readEntries(dir) {
    const key = this.#cacheKey(dir);
    if (this.#dirCache.has(key)) return this.#dirCache.get(key);
    const { readdir } = await import('node:fs/promises');
    let result;
    try {
      const items = await readdir(dir, { withFileTypes: true });
      items.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });
      result = [];
      if (dir !== parse(dir).root)
        result.push({
          name: '..',
          isDir: true,
          isFile: false,
          isHidden: false,
          path: dirname(dir),
          isDone: false,
        });
      for (const item of items) {
        const isHidden = item.name.startsWith('.');
        if (!this.#showHiddenFiles && isHidden) continue;
        const isDir = item.isDirectory();
        const isFile = item.isFile();
        if (
          this.#fileFilter &&
          isFile &&
          !this.#fileFilter.includes(extname(item.name).toLowerCase())
        )
          continue;
        result.push({
          name: item.name,
          isDir,
          isFile,
          isHidden,
          path: join(dir, item.name),
          isDone: false,
        });
      }
    } catch (err) {
      result = [
        {
          name: `⚠ Error: ${err.message}`,
          isDir: false,
          isFile: false,
          isHidden: false,
          path: null,
          isDone: false,
        },
      ];
    }
    this.#dirCache.set(key, result);
    return result;
  }

  async #readCurrentEntries() {
    this.#entries = await this.#readEntries(this.#currentDir);
  }

  // ─── Clamping helpers ───────────────────────────────────────────────────

  #clampCursor() {
    const total = this.#entries.length + 1;
    if (this.#cursorPos >= total) this.#cursorPos = total - 1;
    if (this.#cursorPos < 0) this.#cursorPos = 0;
  }

  #clampScroll() {
    const mv = getMaxVisible(),
      total = this.#entries.length + 1;
    if (this.#cursorPos < this.#scrollTop) this.#scrollTop = this.#cursorPos;
    if (this.#cursorPos >= this.#scrollTop + mv) this.#scrollTop = this.#cursorPos - mv + 1;
    if (this.#scrollTop > Math.max(0, total - mv)) this.#scrollTop = Math.max(0, total - mv);
  }

  // ─── Shared line builder (used by both render() and static run()) ───────

  /**
   * Build an array of display lines from the given state snapshot.
   * This is the single source of truth for what the browser looks like.
   *
   * @param {object} s - State snapshot
   * @param {string} s.title
   * @param {string} s.currentDir
   * @param {Array} s.entries
   * @param {number} s.cursorPos
   * @param {Set<string>} s.selectedPaths
   * @param {boolean} s.showHiddenFiles
   * @param {number} s.scrollTop
   * @param {boolean} s.color
   * @returns {string[]}
   */
  static #buildLines(s) {
    const c = colorize(s.color);
    const maxVisible = getMaxVisible();
    const termWidth = processStdout.columns || 80;
    const sep = c.dim('  ' + '─'.repeat(Math.min(60, termWidth - 4)));
    const allItems = [...s.entries, DONE_ENTRY];
    const totalItems = allItems.length;

    // Clamp cursor + scroll
    let { cursorPos, scrollTop } = s;
    if (cursorPos >= totalItems) cursorPos = totalItems - 1;
    if (cursorPos < 0) cursorPos = 0;
    if (cursorPos < scrollTop) scrollTop = cursorPos;
    if (cursorPos >= scrollTop + maxVisible) scrollTop = cursorPos - maxVisible + 1;
    if (scrollTop > Math.max(0, totalItems - maxVisible))
      scrollTop = Math.max(0, totalItems - maxVisible);

    const visible = allItems.slice(scrollTop, scrollTop + maxVisible);
    const lines = [];

    // Title row
    let titleLine = `  ${c.bold(s.title)}`;
    if (s.selectedPaths.size > 0) {
      titleLine += `   ${c.green('✓')} ${c.bold(s.selectedPaths.size + ' selected')}`;
    }
    lines.push(titleLine);

    // Current directory
    lines.push(`  ${c.cyan('📁 ' + s.currentDir)}`);
    lines.push(sep);

    // Empty hint
    if (s.entries.length === 0) lines.push(`  ${c.dim('(empty directory)')}`);

    // Visible items
    for (let i = 0; i < visible.length; i++) {
      const entry = visible[i];
      const isCursor = scrollTop + i === cursorPos;
      const marker = isCursor ? c.cyan('▶') : ' ';

      if (entry.isDone) {
        const label = isCursor ? c.green(c.bold(entry.name)) : c.green(entry.name);
        lines.push(`  ${marker}    ${label}`);
      } else if (entry.path === null) {
        const label = isCursor ? c.bold(entry.name) : entry.name;
        lines.push(`  ${marker}    ⚠ ${label}`);
      } else {
        const isSelected = s.selectedPaths.has(entry.path);
        const checkbox = isSelected ? c.green('✓') : ' ';
        const icon = entry.name === '..' ? '⬆' : entry.isDir ? '📁' : entry.isHidden ? '👻' : '📄';
        let label;
        if (isCursor) {
          label = entry.isDir ? c.bold(entry.name + '/') : c.bold(entry.name);
        } else if (entry.isDir) {
          label = c.blue(entry.name + '/');
        } else if (entry.isHidden) {
          label = c.dim(entry.name);
        } else {
          label = entry.name;
        }
        lines.push(`  ${marker} [${checkbox}] ${icon} ${label}`);
      }
    }

    // Scroll indicator
    if (totalItems > maxVisible) {
      const pct = Math.round(((scrollTop + maxVisible) / totalItems) * 100);
      lines.push(
        `  ${c.dim(`[${scrollTop + 1}–${Math.min(scrollTop + maxVisible, totalItems)} of ${totalItems}] (${pct}%)`)}`,
      );
    }

    lines.push(sep);

    // Selection summary
    if (s.selectedPaths.size > 0) {
      const arr = Array.from(s.selectedPaths);
      const shown = arr.slice(0, 3).map((p) => {
        const rel = relative(s.currentDir, p);
        return rel.length < p.length ? rel : basename(p);
      });
      const extra = arr.length > 3 ? c.dim(` (+${arr.length - 3} more)`) : '';
      lines.push(
        `  ${c.green('✓')} ${c.bold(s.selectedPaths.size + ' selected:')}${c.dim(' ' + shown.join(', '))}${extra}`,
      );
    } else {
      lines.push(`  ${c.dim('No paths selected — Space to select, Enter to open')}`);
    }

    // Footer
    const hiddenHint = s.showHiddenFiles ? 'hide hidden' : 'show hidden';
    lines.push(
      `  ${c.dim(`[↑↓ nav] [Space select] [Enter open] [h ${hiddenHint}] [a all] [Esc finish]`)}`,
    );

    return lines;
  }

  // ─── Key Handling ───────────────────────────────────────────────────────
  handleKey(key) {
    if (this.#complete || this.#pendingAsync) return false;
    const totalItems = this.#entries.length + 1;

    switch (key.name) {
      case 'up': {
        this.#cursorPos = Math.max(0, this.#cursorPos - 1);
        this.#clampScroll();
        this.requestRender();
        return true;
      }
      case 'down': {
        this.#cursorPos = Math.min(totalItems - 1, this.#cursorPos + 1);
        this.#clampScroll();
        this.requestRender();
        return true;
      }
      case 'space': {
        if (this.#cursorPos === this.#entries.length) {
          this.#finish();
          return true;
        }
        const entry = this.#entries[this.#cursorPos];
        if (entry?.path !== null) {
          if (this.#selectedPaths.has(entry.path)) {
            this.#selectedPaths.delete(entry.path);
          } else if ((entry.isDir && this.#selectDirs) || (entry.isFile && this.#selectFiles)) {
            this.#selectedPaths.add(entry.path);
          }
        }
        this.#cursorPos = Math.min(totalItems - 1, this.#cursorPos + 1);
        this.#clampScroll();
        this.setState({ selectedPaths: this.selectedPaths });
        return true;
      }
      case 'return': {
        if (this.#cursorPos === this.#entries.length) {
          this.#finish();
          return true;
        }
        const entry = this.#entries[this.#cursorPos];
        if (entry?.path !== null) {
          if (entry.isDir) {
            this.#navigateInto(entry.path);
            return true;
          }
          if (entry.isFile && this.#selectFiles) {
            if (this.#selectedPaths.has(entry.path)) {
              this.#selectedPaths.delete(entry.path);
            } else {
              this.#selectedPaths.add(entry.path);
            }
            this.#cursorPos = Math.min(totalItems - 1, this.#cursorPos + 1);
            this.#clampScroll();
            this.setState({ selectedPaths: this.selectedPaths });
          }
        }
        return true;
      }
      case 'h': {
        this.#toggleHidden();
        return true;
      }
      case 'a': {
        const allSelected = this.#entries.every(
          (e) => e.path === null || this.#selectedPaths.has(e.path),
        );
        for (const e of this.#entries) {
          if (!e.path) continue;
          if (allSelected) {
            this.#selectedPaths.delete(e.path);
          } else if ((e.isDir && this.#selectDirs) || (e.isFile && this.#selectFiles)) {
            this.#selectedPaths.add(e.path);
          }
        }
        this.setState({ selectedPaths: this.selectedPaths });
        return true;
      }
      case 'left': {
        if (this.#currentDir !== parse(this.#currentDir).root) {
          this.#navigateInto(dirname(this.#currentDir));
        }
        return true;
      }
      case 'right': {
        const entry = this.#entries[this.#cursorPos];
        if (entry?.isDir && entry.path !== null) this.#navigateInto(entry.path);
        return true;
      }
      case 'escape':
      case 'q': {
        this.#finish();
        return true;
      }
      default:
        return false;
    }
  }

  // ─── Async state transitions ────────────────────────────────────────────
  async #navigateInto(dirPath) {
    this.#pendingAsync = true;
    this.#currentDir = dirPath;
    this.#cursorPos = 0;
    this.#scrollTop = 0;
    await this.#readCurrentEntries();
    this.#clampCursor();
    this.#clampScroll();
    this.#pendingAsync = false;
    this.setState({ currentDir: this.#currentDir });
  }

  async #toggleHidden() {
    this.#pendingAsync = true;
    this.#showHiddenFiles = !this.#showHiddenFiles;
    this.#dirCache.clear();
    await this.#readCurrentEntries();
    this.#cursorPos = Math.min(this.#cursorPos, this.#entries.length);
    this.#scrollTop = 0;
    this.#clampCursor();
    this.#clampScroll();
    this.#pendingAsync = false;
    this.setState({ showHiddenFiles: this.#showHiddenFiles });
  }

  #finish() {
    this.#complete = true;
    this.#result =
      this.#selectedPaths.size === 0 ? [this.#currentDir] : Array.from(this.#selectedPaths);
    this.setState({ complete: true, result: this.#result });
  }
  // ─── Component render (writes to VirtualScreen) ────────────────────────

  render(screen, ctx) {
    const startRow = ctx?.bounds?.row ?? 0;
    this.#clampCursor();
    this.#clampScroll();
    const lines = FileBrowser.#buildLines({
      title: this.#title,
      currentDir: this.#currentDir,
      entries: this.#entries,
      cursorPos: this.#cursorPos,
      selectedPaths: this.#selectedPaths,
      showHiddenFiles: this.#showHiddenFiles,
      scrollTop: this.#scrollTop,
      color: this.#color,
    });
    for (let i = 0; i < lines.length; i++) {
      screen.setLine(startRow + i, lines[i]);
    }
    this.#lineCount = lines.length;
  }

  // ─── Static run() for backward compatibility ────────────────────────────
  static async run(options = {}) {
    const {
      startDir = '.',
      title = 'Select Paths',
      selectFiles = true,
      selectDirs = true,
      showHidden = false,
      fileFilter = null,
      color = true,
    } = options;

    const fs = await import('node:fs/promises');
    if (!processStdin.isTTY || !processStdout.isTTY) return [resolve(startDir)];

    const reader = new KeyReader();

    // ── Mutable state ────────────────────────────────────────────────────
    let currentDir = resolve(startDir);
    let entries = [];
    let cursorPos = 0;
    const selectedPaths = new Set();
    let showHiddenFiles = showHidden;
    let scrollTop = 0;
    let prevRenderedLines = [];

    // ── Directory cache ──────────────────────────────────────────────────
    const dirCache = new Map();
    const makeCacheKey = (dir) => `${dir}::${showHiddenFiles}::${fileFilter?.join(',') ?? ''}`;

    const readEntries = async (dir) => {
      const key = makeCacheKey(dir);
      if (dirCache.has(key)) return dirCache.get(key);
      let result;
      try {
        const items = await fs.readdir(dir, { withFileTypes: true });
        items.sort((a, b) => {
          if (a.isDirectory() && !b.isDirectory()) return -1;
          if (!a.isDirectory() && b.isDirectory()) return 1;
          return a.name.localeCompare(b.name);
        });
        result = [];
        if (dir !== parse(dir).root) {
          result.push({
            name: '..',
            isDir: true,
            isFile: false,
            isHidden: false,
            path: dirname(dir),
            isDone: false,
          });
        }
        for (const item of items) {
          const isHidden = item.name.startsWith('.');
          if (!showHiddenFiles && isHidden) continue;
          const isDir = item.isDirectory();
          const isFile = item.isFile();
          if (fileFilter && isFile && !fileFilter.includes(extname(item.name).toLowerCase()))
            continue;
          result.push({
            name: item.name,
            isDir,
            isFile,
            isHidden,
            path: join(dir, item.name),
            isDone: false,
          });
        }
      } catch (err) {
        result = [
          {
            name: `⚠ Error: ${err.message}`,
            isDir: false,
            isFile: false,
            isHidden: false,
            path: null,
            isDone: false,
          },
        ];
      }
      dirCache.set(key, result);
      return result;
    };

    // ── Differential renderer ────────────────────────────────────────────
    const render = () => {
      const newLines = FileBrowser.#buildLines({
        title,
        currentDir,
        entries,
        cursorPos,
        selectedPaths,
        showHiddenFiles,
        scrollTop,
        color,
      });
      const prevLen = prevRenderedLines.length;
      const newLen = newLines.length;

      if (prevLen > 0) processStdout.write(`\x1b[${prevLen}A`);
      for (let i = 0; i < newLen; i++) {
        const old = i < prevLen ? prevRenderedLines[i] : undefined;
        processStdout.write('\r');
        if (old === newLines[i]) {
          if (i < newLen - 1) processStdout.write('\x1b[1B');
        } else {
          processStdout.write(`\x1b[2K${newLines[i]}`);
          if (i < newLen - 1) processStdout.write('\n');
        }
      }
      const excess = prevLen - newLen;
      for (let j = 0; j < excess; j++) processStdout.write('\n\r\x1b[2K');
      if (excess > 0) processStdout.write(`\x1b[${excess}A`);
      prevRenderedLines = newLines;
    };

    // ── Initialize ───────────────────────────────────────────────────────
    entries = await readEntries(currentDir);
    render();

    const unsubResize = onResize(() => {
      dirCache.clear();
      prevRenderedLines = [];
      render();
    });

    // ── Event loop ───────────────────────────────────────────────────────
    let finished = false;
    while (!finished) {
      const key = await reader.readKey();
      const total = entries.length + 1;

      switch (key.name) {
        case 'up':
          cursorPos = Math.max(0, cursorPos - 1);
          render();
          break;
        case 'down':
          cursorPos = Math.min(total - 1, cursorPos + 1);
          render();
          break;
        case 'space': {
          if (cursorPos === entries.length) {
            finished = true;
            break;
          }
          const e = entries[cursorPos];
          if (e?.path !== null) {
            if (selectedPaths.has(e.path)) selectedPaths.delete(e.path);
            else if ((e.isDir && selectDirs) || (e.isFile && selectFiles))
              selectedPaths.add(e.path);
          }
          cursorPos = Math.min(total - 1, cursorPos + 1);
          render();
          break;
        }
        case 'return': {
          if (cursorPos === entries.length) {
            finished = true;
            break;
          }
          const e = entries[cursorPos];
          if (e?.path !== null) {
            if (e.isDir) {
              currentDir = e.path;
              entries = await readEntries(currentDir);
              cursorPos = 0;
              scrollTop = 0;
            } else if (e.isFile && selectFiles) {
              if (selectedPaths.has(e.path)) selectedPaths.delete(e.path);
              else selectedPaths.add(e.path);
              cursorPos = Math.min(total - 1, cursorPos + 1);
            }
          }
          render();
          break;
        }
        case 'h': {
          showHiddenFiles = !showHiddenFiles;
          dirCache.clear();
          entries = await readEntries(currentDir);
          cursorPos = Math.min(cursorPos, entries.length);
          scrollTop = 0;
          render();
          break;
        }
        case 'a': {
          const allSel = entries.every((e) => e.path === null || selectedPaths.has(e.path));
          for (const e of entries) {
            if (!e.path) continue;
            if (allSel) selectedPaths.delete(e.path);
            else if ((e.isDir && selectDirs) || (e.isFile && selectFiles))
              selectedPaths.add(e.path);
          }
          render();
          break;
        }
        case 'left': {
          if (currentDir !== parse(currentDir).root) {
            currentDir = dirname(currentDir);
            entries = await readEntries(currentDir);
            cursorPos = 0;
            scrollTop = 0;
            render();
          }
          break;
        }
        case 'right': {
          const e = entries[cursorPos];
          if (e?.isDir && e.path !== null) {
            currentDir = e.path;
            entries = await readEntries(currentDir);
            cursorPos = 0;
            scrollTop = 0;
            render();
          }
          break;
        }
        case 'escape':
        case 'q':
          finished = true;
          break;
      }
    }

    // ── Cleanup ──────────────────────────────────────────────────────────
    unsubResize();
    const clearCount = prevRenderedLines.length;
    if (clearCount > 0) {
      processStdout.write(`\x1b[${clearCount}A`);
      for (let i = 0; i < clearCount; i++) processStdout.write('\x1b[2K\n');
      processStdout.write(`\x1b[${clearCount}A`);
    }
    reader.destroy();

    return selectedPaths.size === 0 ? [currentDir] : Array.from(selectedPaths);
  }
}

export default FileBrowser;
