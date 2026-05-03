// src/tui/components/findings.js
// FindingsBrowser component — extends Component base class for TUI rendering
// Maintains backward compatibility with the original FindingsBrowser class
// Enhanced findings browsing with filtering, search, pagination, and rich detail views

import { Component } from '../core/component.js';
import { colorize, sanitize } from '../../utils.js';

// Process and child_process references
import { stdin as processStdin, stdout as processStdout } from 'node:process';

// ─── Shared imports from existing components ────────────────────────────────
import { KeyReader } from '../../tui.js';
import { onResize } from '../../tui.js';
import { Box } from './box.js';

// ─── Shared helpers ──────────────────────────────────────────────────────────
import {
  extractCveIds,
  buildSummaryLines,
  computeFiltered,
  SEVERITY_COLOR,
  SEVERITY_ICON,
} from './findings-helpers.js';

// ─── Legacy static browse (extracted to its own module) ──────────────────────
import { browse } from './findings-browse.js';

// ─── Constants ──────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 10;

// ─────────────────────────────────────────────────────────────────────────────
//  FindingsBrowser — interactive findings browser component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Interactive findings browser component with filtering, search, pagination,
 * and rich detail views. Can be used as both a static utility (backward compatible)
 * and as a proper Component subclass.
 *
 * @example
 * // Static usage (backward compatible):
 * await FindingsBrowser.browse(findings, { color: true })
 *
 * // Component usage:
 * const browser = new FindingsBrowser({ findings, color: true })
 * browser.mount()
 * browser.handleKey({ name: 'down' })
 * browser.render(screen, { bounds: { row: 0 } })
 * browser.unmount()
 */
export class FindingsBrowser extends Component {
  /** @type {Array} Original unfiltered findings */
  #findings;
  /** @type {Function} colorize helper */
  #c;

  // Filter / search state
  #severityFilter = new Set();
  #typeFilter = new Set();
  #sourceFilter = new Set();
  #searchQuery = '';

  // Pagination
  #page = 0;
  #perPage = ITEMS_PER_PAGE;

  // State machine
  #view = 'list'; // 'list', 'detail'
  #detailIdx = 0;

  // Component state
  #reader = null;
  #unsubscribeResize = null;
  #pendingAsync = false;
  #lineCount = 0;

  constructor(options = {}) {
    super(options);
    this.#findings = options?.findings || [];
    this.#c = colorize(options?.color !== false && !process.env.NO_COLOR);
  }

  /** @readonly */
  get view() {
    return this.#view;
  }

  /** @readonly */
  get findings() {
    return [...this.#findings];
  }

  /** @readonly */
  get hasActiveFilters() {
    return (
      this.#severityFilter.size > 0 ||
      this.#typeFilter.size > 0 ||
      this.#sourceFilter.size > 0 ||
      this.#searchQuery !== ''
    );
  }

  /** @readonly */
  get filtered() {
    return this.#getFiltered();
  }

  /** @readonly */
  get currentPage() {
    return this.#page;
  }

  /** @readonly */
  get totalPages() {
    return Math.max(1, Math.ceil(this.#getFiltered().length / this.#perPage));
  }

  // ─── Computed: filtered list ────────────────────────────────────────

  #getFiltered() {
    return computeFiltered({
      findings: this.#findings,
      searchQuery: this.#searchQuery,
      severityFilter: this.#severityFilter,
      typeFilter: this.#typeFilter,
      sourceFilter: this.#sourceFilter,
    });
  }

  #buildSummary(filtered, total) {
    return buildSummaryLines({
      c: this.#c,
      filtered,
      total,
      hasActiveFilters: this.hasActiveFilters,
      searchQuery: this.#searchQuery,
      severityFilter: this.#severityFilter,
      typeFilter: this.#typeFilter,
      sourceFilter: this.#sourceFilter,
    });
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────

  mount() {
    super.mount();

    if (!processStdin.isTTY || !processStdout.isTTY) {
      // Non-TTY: complete immediately
      return;
    }

    this.#reader = new KeyReader();
    this.#unsubscribeResize = onResize(() => {
      this.requestRender();
    });
    this.requestRender();
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

  // ─── Key Handling ───────────────────────────────────────────────────

  handleKey(key) {
    if (this.#pendingAsync) return false;

    switch (this.#view) {
      case 'list':
        return this.#handleListKey(key);
      case 'detail':
        return this.#handleDetailKey(key);
      default:
        return false;
    }
  }

  #handleListKey(key) {
    const filtered = this.#getFiltered();
    const pages = this.totalPages;

    switch (key.name) {
      case 'up':
      case 'k':
        this.#page = Math.max(0, this.#page - 1);
        this.requestRender();
        return true;
      case 'down':
      case 'j':
        this.#page = Math.min(pages - 1, this.#page + 1);
        this.requestRender();
        return true;
      case 'left':
      case 'h':
        this.#page = Math.max(0, this.#page - 1);
        this.requestRender();
        return true;
      case 'l':
      case 'right':
        this.#page = Math.min(pages - 1, this.#page + 1);
        this.requestRender();
        return true;
      case 'enter':
        if (filtered.length > 0) {
          this.#view = 'detail';
          this.#detailIdx = this.#page * this.#perPage;
          this.requestRender();
        }
        return true;
      case 'q':
      case 'escape':
        this.setState({ complete: true, result: 'back' });
        return true;
      case 's':
        this.#openSearch();
        return true;
      case 'f':
        this.#openSeverityFilter();
        return true;
      case 'c':
        if (this.hasActiveFilters) {
          this.#clearFilters();
          this.requestRender();
        }
        return true;
      default:
        return false;
    }
  }

  #handleDetailKey(key) {
    const filtered = this.#getFiltered();

    switch (key.name) {
      case 'up':
      case 'k':
        this.#detailIdx = Math.max(0, this.#detailIdx - 1);
        this.requestRender();
        return true;
      case 'down':
      case 'j':
        this.#detailIdx = Math.min(filtered.length - 1, this.#detailIdx + 1);
        this.requestRender();
        return true;
      case 'left':
      case 'h':
        this.#detailIdx = Math.max(0, this.#detailIdx - 1);
        this.requestRender();
        return true;
      case 'l':
      case 'right':
        this.#detailIdx = Math.min(filtered.length - 1, this.#detailIdx + 1);
        this.requestRender();
        return true;
      case 'enter':
      case 'escape':
      case 'q':
        this.#view = 'list';
        this.requestRender();
        return true;
      default:
        return false;
    }
  }

  // ─── Async Operations ───────────────────────────────────────────────

  async #openSearch() {
    // Lazy import to avoid circular deps at load time
    const { TextInput } = await import('./input.js');
    this.#pendingAsync = true;
    try {
      const query = await TextInput.run({
        prompt: '🔍 Search: ',
        defaultValue: this.#searchQuery,
      });
      if (query !== null) {
        this.#searchQuery = query.trim();
        this.#page = 0;
        this.requestRender();
      }
    } finally {
      this.#pendingAsync = false;
    }
  }

  async #openSeverityFilter() {
    // Lazy import to avoid circular deps at load time
    const { CheckboxMenu } = await import('./menu.js');
    this.#pendingAsync = true;
    try {
      const severities = ['critical', 'high', 'medium', 'low'];
      const selected = await CheckboxMenu.run({
        title: 'Filter by Severity',
        items: severities.map((s) => ({
          label: `${SEVERITY_ICON[s]} ${s}`,
          value: s,
          checked: this.#severityFilter.size === 0 || this.#severityFilter.has(s),
        })),
      });

      if (selected !== null) {
        this.#severityFilter.clear();
        if (selected.length < severities.length) {
          for (const s of selected) this.#severityFilter.add(s);
        }
        this.#page = 0;
        this.requestRender();
      }
    } finally {
      this.#pendingAsync = false;
    }
  }

  #clearFilters() {
    this.#severityFilter.clear();
    this.#typeFilter.clear();
    this.#sourceFilter.clear();
    this.#searchQuery = '';
    this.#page = 0;
  }

  // ─── Render ─────────────────────────────────────────────────────────

  render(screen, ctx) {
    if (this.#findings.length === 0) {
      screen.setLine(ctx.bounds.row, 'No findings to display');
      return;
    }

    const filtered = this.#getFiltered();
    const total = this.#findings.length;
    const pages = this.totalPages;

    this.#page = Math.min(Math.max(0, this.#page), pages - 1);

    let row = ctx.bounds.row;

    if (this.#view === 'list') {
      row = this.#renderList(screen, row, filtered, total, pages);
    } else if (this.#view === 'detail') {
      row = this.#renderDetail(screen, row, filtered);
    }

    this.#lineCount = row - ctx.bounds.row;
  }

  #renderList(screen, row, filtered, total, pages) {
    const start = this.#page * this.#perPage;
    const pageItems = filtered.slice(start, start + this.#perPage);

    // Summary box
    const summaryLines = this.#buildSummary(filtered, total);
    const boxStr = Box.draw({
      title: 'Findings Browser',
      lines: summaryLines,
      borderColor: this.hasActiveFilters ? 'yellow' : filtered.length > 0 ? 'cyan' : 'green',
    });
    screen.setLine(row++, boxStr);

    // List items
    if (pageItems.length === 0) {
      screen.setLine(row++, '  (no findings match current filters)');
    } else {
      for (let i = 0; i < pageItems.length; i++) {
        const f = pageItems[i];
        const icon = SEVERITY_ICON[f.severity] || '⚪';
        const sev = (f.severity || '?').toUpperCase().padEnd(8);
        const pkg = sanitize(`${f.packageName || '?'}@${f.packageVersion || '?'}`, 35);
        const cve = extractCveIds(f).join(', ');

        const line = `${icon} ${sev} ${pkg.padEnd(35)} ${f.type || '?'}`;
        screen.setLine(row++, line);
        if (cve || f.description) {
          screen.setLine(row++, `          ${cve || sanitize(f.description || '', 60)}`);
        }
      }
    }

    // Actions
    screen.setLine(row++, '────────── Actions ──────────');
    screen.setLine(
      row++,
      `🔍 [s] Search findings ${this.#searchQuery ? `("${sanitize(this.#searchQuery, 30)}")` : ''}`,
    );
    screen.setLine(
      row++,
      `🔧 [f] Filter by severity ${this.#severityFilter.size > 0 ? `[${[...this.#severityFilter].join(', ')}]` : ''}`,
    );
    if (this.hasActiveFilters) {
      screen.setLine(row++, '🗑  [c] Clear all filters');
    }

    // Pagination
    if (pages > 1) {
      screen.setLine(row++, `──────── Page ${this.#page + 1}/${pages} ────────`);
      screen.setLine(row++, '← Previous page | → Next page');
    }

    screen.setLine(row++, '← [q] Back to results');

    return row;
  }

  #renderDetail(screen, row, filtered) {
    const c = this.#c;
    const finding = filtered[this.#detailIdx];
    if (!finding) {
      screen.setLine(row++, 'No finding selected');
      return row;
    }

    // Build rich detail box
    const sevColor = SEVERITY_COLOR[finding.severity] || 'dim';
    const lines = [];

    lines.push(
      `${c.bold('Package:')}      ${finding.packageName || 'N/A'}@${finding.packageVersion || 'N/A'}`,
    );
    lines.push(`${c.bold('Type:')}         ${finding.type || 'N/A'}`);
    const sevLabel =
      { critical: 'CRIT', high: 'HIGH', medium: 'MED', low: 'LOW' }[finding.severity] || '????';
    lines.push(
      `${c.bold('Severity:')}     ${c[sevColor](`[${sevLabel}] ${(finding.severity || 'unknown').toUpperCase()}`)}`,
    );

    const cves = extractCveIds(finding);
    if (cves.length > 0) {
      lines.push(`${c.bold('CVE/GHSA:')}     ${cves.join(', ')}`);
    }
    if (finding.url) {
      lines.push(`${c.bold('URL:')}          ${finding.url}`);
    }
    if (finding.advisoryId) {
      lines.push(`${c.bold('Advisory ID:')}  ${finding.advisoryId}`);
    }
    if (finding.publishedAt) {
      lines.push(`${c.bold('Published:')}    ${finding.publishedAt}`);
    }
    if (finding.updatedAt) {
      lines.push(`${c.bold('Updated:')}      ${finding.updatedAt}`);
    }

    lines.push('');
    lines.push(`${c.bold('Path:')}         ${finding.path || 'N/A'}`);
    lines.push(`${c.bold('Attack:')}       ${finding.attack || 'N/A'}`);
    lines.push(`${c.bold('Source:')}       ${finding.source || 'N/A'}`);
    lines.push('');
    lines.push(`${c.bold('Description:')}  ${finding.description || 'N/A'}`);
    lines.push(`${c.bold('Evidence:')}     ${finding.evidence || 'N/A'}`);
    lines.push('');
    lines.push(`${c.bold('Remediation:')}  ${finding.remediation || 'N/A'}`);

    const boxStr = Box.draw({
      title: `Finding ${this.#detailIdx + 1}/${filtered.length} — ${(finding.severity || 'unknown').toUpperCase()}`,
      lines,
      borderColor: sevColor,
    });
    screen.setLine(row++, boxStr);

    // Navigation
    screen.setLine(row++, '');
    screen.setLine(row++, '[←] Previous finding | [→] Next finding | [Enter/Escape] Back to list');

    return row;
  }

  // ─── Static Backward Compatible Method ──────────────────────────────

  /**
   * Legacy interactive mode that owns the input loop.
   * Backward compatible with original `browse()` method.
   * Delegated to `findings-browse.js`.
   *
   * @param {Array} findings - Full findings array from scan results
   * @param {object} [options]
   * @param {boolean} [options.color]
   * @returns {Promise<void>}
   */
  static async browse(findings, options = {}) {
    return browse(findings, options);
  }
}
