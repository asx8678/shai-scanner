// src/tui/components/findings-browse.js
// Legacy static browse() method — extracted from FindingsBrowser class
// for file-size compliance. Provides the backward-compatible interactive mode
// that owns the full input/output loop.

import { sanitize } from '../../utils.js';
import { stdout as processStdout } from 'node:process';

import { ANSI } from '../../tui.js';
import { SelectMenu } from './menu.js';
import { CheckboxMenu } from './menu.js';
import { TextInput } from './input.js';
import { Box } from './box.js';

import {
  extractCveIds,
  buildSummaryLines,
  buildDetailText,
  openInBrowser,
  computeFiltered,
  SEVERITY_COLOR,
  SEVERITY_ICON,
} from './findings-helpers.js';

// ─── Constants ──────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 10;

/**
 * Legacy interactive mode that owns the input loop.
 * Backward compatible with original `browse()` method.
 *
 * @param {Array} findings - Full findings array from scan results
 * @param {object} [options]
 * @param {boolean} [options.color]
 * @returns {Promise<void>}
 */
export async function browse(findings, options = {}) {
  if (!findings || findings.length === 0) return;

  const { colorize } = await import('../../utils.js');
  const color = options.color !== false && !process.env.NO_COLOR;
  const c = colorize(color);

  const severityFilter = new Set();
  const typeFilter = new Set();
  const sourceFilter = new Set();
  let searchQuery = '';
  let page = 0;
  const perPage = ITEMS_PER_PAGE;

  const localComputeFiltered = () =>
    computeFiltered({
      findings,
      searchQuery,
      severityFilter,
      typeFilter,
      sourceFilter,
    });

  const hasActiveFilters = () =>
    severityFilter.size > 0 || typeFilter.size > 0 || sourceFilter.size > 0 || searchQuery !== '';

  const localBuildSummaryLines = (filtered, total) =>
    buildSummaryLines({
      c,
      filtered,
      total,
      hasActiveFilters: hasActiveFilters(),
      searchQuery,
      severityFilter,
      typeFilter,
      sourceFilter,
    });

  let done = false;
  while (!done) {
    const filtered = localComputeFiltered();
    const total = findings.length;
    const pages = Math.max(1, Math.ceil(filtered.length / perPage));

    page = Math.min(Math.max(0, page), pages - 1);

    const start = page * perPage;
    const pageItems = filtered.slice(start, start + perPage);

    // Summary box
    processStdout.write('\n');
    processStdout.write(
      Box.draw({
        title: 'Findings Browser',
        lines: localBuildSummaryLines(filtered, total),
        borderColor: hasActiveFilters() ? 'yellow' : filtered.length > 0 ? 'cyan' : 'green',
      }),
    );
    processStdout.write('\n');

    // Build SelectMenu items
    const items = [];

    if (pageItems.length === 0) {
      items.push({ label: '(no findings match current filters)', value: 'act:none' });
    }

    for (let i = 0; i < pageItems.length; i++) {
      const f = pageItems[i];
      const gIdx = start + i;
      const icon = SEVERITY_ICON[f.severity] || '⚪';
      const sev = (f.severity || '?').toUpperCase().padEnd(8);
      const pkg = sanitize(`${f.packageName || '?'}@${f.packageVersion || '?'}`, 35);
      const cve = extractCveIds(f).join(', ');

      items.push({
        label: `${icon} ${sev} ${pkg.padEnd(35)} ${f.type || '?'}`,
        description: cve || sanitize(f.description || '', 60),
        value: `idx:${gIdx}`,
      });
    }

    // Actions
    items.push({ label: '────────── Actions ──────────', value: 'act:none' });
    items.push({
      label: '🔍 Search findings',
      value: 'act:search',
      description: searchQuery ? `"${sanitize(searchQuery, 30)}"` : 'filter by keyword',
    });
    items.push({
      label: '🔧 Filter by severity',
      value: 'act:filter-severity',
      description: severityFilter.size > 0 ? [...severityFilter].join(', ') : 'all',
    });
    items.push({
      label: '🔧 Filter by type',
      value: 'act:filter-type',
      description: typeFilter.size > 0 ? `${typeFilter.size} selected` : 'all',
    });
    items.push({
      label: '🔧 Filter by source',
      value: 'act:filter-source',
      description: sourceFilter.size > 0 ? `${sourceFilter.size} selected` : 'all',
    });
    if (hasActiveFilters()) {
      items.push({ label: '🗑  Clear all filters', value: 'act:clear' });
    }

    // Pagination
    if (pages > 1) {
      items.push({ label: `──────── Page ${page + 1}/${pages} ────────`, value: 'act:none' });
      if (page < pages - 1) items.push({ label: '→ Next page', value: 'act:next' });
      if (page > 0) items.push({ label: '← Previous page', value: 'act:prev' });
    }

    items.push({ label: '← Back to results', value: 'back' });

    const titleExtra = hasActiveFilters() ? ` / ${total} total` : '';
    const action = await SelectMenu.run({
      title: `Findings (${filtered.length} shown${titleExtra})`,
      items,
    });

    if (action === null || action === 'back') {
      done = true;
    } else if (action.startsWith('idx:')) {
      await renderDetail(parseInt(action.slice(4), 10));
    } else if (action === 'act:search') {
      const query = await TextInput.run({
        prompt: '🔍 Search: ',
        defaultValue: searchQuery,
      });
      if (query !== null) {
        searchQuery = query.trim();
        page = 0;
      }
    } else if (action === 'act:filter-severity') {
      const severities = ['critical', 'high', 'medium', 'low'];
      const selected = await CheckboxMenu.run({
        title: 'Filter by Severity',
        items: severities.map((s) => ({
          label: `${SEVERITY_ICON[s]} ${s}`,
          value: s,
          checked: severityFilter.size === 0 || severityFilter.has(s),
        })),
      });
      if (selected !== null) {
        severityFilter.clear();
        if (selected.length < severities.length) {
          for (const s of selected) severityFilter.add(s);
        }
        page = 0;
      }
    } else if (action === 'act:filter-type') {
      const types = [...new Set(findings.map((f) => f.type).filter(Boolean))].sort();
      if (types.length > 0) {
        const selected = await CheckboxMenu.run({
          title: 'Filter by Type',
          items: types.map((t) => ({
            label: t,
            value: t,
            checked: typeFilter.size === 0 || typeFilter.has(t),
          })),
        });
        if (selected !== null) {
          typeFilter.clear();
          if (selected.length < types.length) {
            for (const t of selected) typeFilter.add(t);
          }
          page = 0;
        }
      }
    } else if (action === 'act:filter-source') {
      const sources = [...new Set(findings.map((f) => f.source).filter(Boolean))].sort();
      if (sources.length > 0) {
        const selected = await CheckboxMenu.run({
          title: 'Filter by Source',
          items: sources.map((s) => ({
            label: s,
            value: s,
            checked: sourceFilter.size === 0 || sourceFilter.has(s),
          })),
        });
        if (selected !== null) {
          sourceFilter.clear();
          if (selected.length < sources.length) {
            for (const s of selected) sourceFilter.add(s);
          }
          page = 0;
        }
      }
    } else if (action === 'act:clear') {
      severityFilter.clear();
      typeFilter.clear();
      sourceFilter.clear();
      searchQuery = '';
      page = 0;
    } else if (action === 'act:next') {
      page = Math.min(page + 1, pages - 1);
    } else if (action === 'act:prev') {
      page = Math.max(0, page - 1);
    }
  }

  // Nested detail renderer (static helper)
  async function renderDetail(startIdx) {
    const filtered = localComputeFiltered();
    let curIdx = startIdx;
    let lineCount = 0;

    const clearOutput = () => {
      if (lineCount > 0) {
        processStdout.write(ANSI.moveUp(lineCount));
        for (let i = 0; i < lineCount; i++) processStdout.write(`${ANSI.clearLine}\n`);
        processStdout.write(ANSI.moveUp(lineCount));
      }
      lineCount = 0;
    };

    const writeTracked = (str) => {
      processStdout.write(str);
      lineCount += str.split('\n').length - 1;
    };

    while (true) {
      clearOutput();

      const finding = filtered[curIdx];
      if (!finding) break;

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
        title: `Finding ${curIdx + 1}/${filtered.length} — ${(finding.severity || 'unknown').toUpperCase()}`,
        lines,
        borderColor: sevColor,
      });

      writeTracked(`\n${boxStr}\n\n`);

      // Action menu
      const actions = [{ label: '📋 Copy details to clipboard', value: 'copy' }];
      if (finding.url) {
        actions.push({ label: '🌐 Open URL in browser', value: 'browser' });
      }
      actions.push({ label: '───────────────────────', value: 'none' });
      if (curIdx > 0) actions.push({ label: '← Previous finding', value: 'prev' });
      if (curIdx < filtered.length - 1) actions.push({ label: 'Next finding →', value: 'next' });
      actions.push({ label: '← Back to list', value: 'back' });

      const sel = await SelectMenu.run({ title: 'Actions', items: actions });

      switch (sel) {
        case 'copy': {
          const detailText = buildDetailText(finding, curIdx, filtered.length);
          try {
            const b64 = Buffer.from(detailText).toString('base64');
            processStdout.write(`\x1b]52;c;${b64}\x07`);
            processStdout.write(`${c.green('✓')} Details copied to clipboard\n`);
          } catch {
            processStdout.write(`${c.yellow('⚠')} Could not copy to clipboard\n`);
          }
          clearOutput();
          const confirmBox = Box.draw({
            title: 'Copied ✓',
            lines: ['Finding details copied to clipboard.', 'Re-rendering in a moment...'],
            borderColor: 'green',
          });
          writeTracked(`\n${confirmBox}\n\n`);
          await new Promise((r) => setTimeout(r, 900));
          break;
        }
        case 'browser':
          if (finding.url) openInBrowser(finding.url, c);
          break;
        case 'prev':
          curIdx = Math.max(0, curIdx - 1);
          break;
        case 'next':
          curIdx = Math.min(filtered.length - 1, curIdx + 1);
          break;
        case 'back':
        case 'none':
        case null:
        default:
          return;
      }
    }
  }
}
