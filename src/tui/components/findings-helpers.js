// src/tui/components/findings-helpers.js
// Shared helper functions for FindingsBrowser component
// Extracted to keep the main component file under 600 lines

import { colorize, sanitize } from '../../utils.js';
import { spawn } from 'node:child_process';
import { stdout as processStdout } from 'node:process';

// ─── Constants ──────────────────────────────────────────────────────────────
const SEVERITY_COLOR = { critical: 'red', high: 'yellow', medium: 'cyan', low: 'dim' };
const SEVERITY_ICON = { critical: '[CRIT]', high: '[HIGH]', medium: '[MED]', low: '[LOW]' };

// ─── Helper Functions ───────────────────────────────────────────────────────

/**
 * Pull CVE-xxxx-yyy and GHSA-xxx identifiers out of a finding.
 * @param {object} finding
 * @returns {string[]}
 */
export function extractCveIds(finding) {
  const parts = [finding.attack || '', ...(finding.aliases || [])].join(' ');
  const matches = parts.match(/CVE-\d{4}-\d+|GHSA-[\w-]{4,}/g);
  return matches ? [...new Set(matches)] : [];
}

/**
 * Build the summary lines for the list-view box.
 * @param {object} params
 * @param {Function} params.c - colorize helper
 * @param {Array} params.filtered - filtered findings
 * @param {number} params.total - total findings count
 * @param {boolean} params.hasActiveFilters - whether filters are active
 * @param {string} params.searchQuery - current search query
 * @param {Set} params.severityFilter - severity filter set
 * @param {Set} params.typeFilter - type filter set
 * @param {Set} params.sourceFilter - source filter set
 * @returns {string[]}
 */
export function buildSummaryLines({
  c,
  filtered,
  total,
  hasActiveFilters,
  searchQuery,
  severityFilter,
  typeFilter,
  sourceFilter,
}) {
  const bySev = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of filtered) bySev[f.severity] = (bySev[f.severity] || 0) + 1;

  const lines = [
    `${c.red('[CRIT]')} ${String(bySev.critical).padStart(4)}  ` +
      `${c.yellow('[HIGH]')} ${String(bySev.high).padStart(4)}  ` +
      `${c.cyan('[MED]')}  ${String(bySev.medium).padStart(4)}  ` +
      `${c.dim('[LOW]')}  ${String(bySev.low).padStart(4)}`,
  ];

  if (hasActiveFilters) {
    const criteria = [];
    if (searchQuery) criteria.push(`search: "${sanitize(searchQuery, 30)}"`);
    if (severityFilter.size > 0) criteria.push(`severity: ${[...severityFilter].join(', ')}`);
    if (typeFilter.size > 0) criteria.push(`type: ${typeFilter.size} selected`);
    if (sourceFilter.size > 0) criteria.push(`source: ${sourceFilter.size} selected`);
    lines.push(`${c.yellow('Active filters:')} ${criteria.join(' | ')}`);
    lines.push(`${c.bold('Showing:')} ${filtered.length} of ${total} findings`);
  } else {
    lines.push(`${c.bold('Total:')} ${total} findings`);
  }

  return lines;
}

/**
 * Build a plain-text copy of the finding detail.
 * @param {object} finding
 * @param {number} idx - 0-based index
 * @param {number} total - total findings count
 * @returns {string}
 */
export function buildDetailText(finding, idx, total) {
  const parts = [
    `Finding ${idx + 1}/${total}`,
    `Package: ${finding.packageName || 'N/A'}@${finding.packageVersion || 'N/A'}`,
    `Type: ${finding.type || 'N/A'}`,
    `Severity: ${finding.severity || 'unknown'}`,
  ];
  const cves = extractCveIds(finding);
  if (cves.length > 0) parts.push(`CVE/GHSA: ${cves.join(', ')}`);
  if (finding.url) parts.push(`URL: ${finding.url}`);
  if (finding.advisoryId) parts.push(`Advisory ID: ${finding.advisoryId}`);
  if (finding.publishedAt) parts.push(`Published: ${finding.publishedAt}`);
  if (finding.updatedAt) parts.push(`Updated: ${finding.updatedAt}`);
  parts.push(
    `Path: ${finding.path || 'N/A'}`,
    `Attack: ${finding.attack || 'N/A'}`,
    `Source: ${finding.source || 'N/A'}`,
    `Description: ${finding.description || 'N/A'}`,
    `Evidence: ${finding.evidence || 'N/A'}`,
    `Remediation: ${finding.remediation || 'N/A'}`,
  );
  return parts.join('\n');
}

/**
 * Open a URL in the user's default browser.
 * @param {string} url
 * @param {Function} c - colorize helper
 */
export function openInBrowser(url, c) {
  try {
    const platform = process.platform;
    let cmd, args;
    if (platform === 'darwin') {
      cmd = 'open';
      args = [url];
    } else if (platform === 'win32') {
      cmd = 'cmd';
      args = ['/c', 'start', url.replace(/&/g, '^&')];
    } else {
      cmd = 'xdg-open';
      args = [url];
    }

    spawn(cmd, args, { detached: true, stdio: 'ignore' }).unref();
    processStdout.write(`${c.green('✓')} Opening ${sanitize(url, 80)}\n`);
  } catch {
    processStdout.write(`${c.yellow('⚠')} Could not open browser. URL: ${url}\n`);
  }
}

/**
 * Copy text to clipboard via OSC 52 (widely supported in modern terminals).
 * @param {string} text
 * @param {Function} c - colorize helper
 */
export function copyToClipboard(text, c) {
  try {
    const b64 = Buffer.from(text).toString('base64');
    processStdout.write(`\x1b]52;c;${b64}\x07`);
    processStdout.write(`${c.green('✓')} Details copied to clipboard\n`);
  } catch {
    processStdout.write(`${c.yellow('⚠')} Could not copy to clipboard\n`);
  }
}

/**
 * Compute filtered findings based on search query and filters.
 * @param {object} params
 * @param {Array} params.findings - original findings
 * @param {string} params.searchQuery - search query
 * @param {Set} params.severityFilter - severity filter
 * @param {Set} params.typeFilter - type filter
 * @param {Set} params.sourceFilter - source filter
 * @returns {Array}
 */
export function computeFiltered({
  findings,
  searchQuery,
  severityFilter,
  typeFilter,
  sourceFilter,
}) {
  let result = findings;

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter(
      (f) =>
        (f.packageName || '').toLowerCase().includes(q) ||
        (f.description || '').toLowerCase().includes(q) ||
        (f.attack || '').toLowerCase().includes(q) ||
        (f.type || '').toLowerCase().includes(q) ||
        (f.evidence || '').toLowerCase().includes(q),
    );
  }
  if (severityFilter.size > 0) result = result.filter((f) => severityFilter.has(f.severity));
  if (typeFilter.size > 0) result = result.filter((f) => typeFilter.has(f.type));
  if (sourceFilter.size > 0) result = result.filter((f) => sourceFilter.has(f.source));

  return result;
}

// ─── Exports ────────────────────────────────────────────────────────────────
export { SEVERITY_COLOR, SEVERITY_ICON };
