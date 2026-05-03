import { existsSync, readFileSync } from 'node:fs';
import { DATA_SOURCES, DEFAULTS } from './constants.js';
import { EMBEDDED_IOCS } from './embedded-db.js';
import { parseCsv } from './csv.js';
import { rangeMayIncludeVersion } from './semver-lite.js';
import { envFlag, getCachePath, hasControlChars, isPlainObject, safeJsonParse, sanitize, writeFileAtomic } from './utils.js';

const SEVERITY_RANK = Object.freeze({ low: 1, medium: 2, high: 3, critical: 4 });
const VALID_SEVERITIES = new Set(['critical', 'high', 'medium', 'low']);

function normalizeSeverity(value, fallback = 'critical') {
  const v = String(value ?? '').toLowerCase().trim();
  if (v === 'moderate') return 'medium';
  return VALID_SEVERITIES.has(v) ? v : fallback;
}

function normalizeString(value, maxLen) {
  if (typeof value !== 'string') return null;
  const s = value.trim();
  if (!s || s.length > maxLen || hasControlChars(s)) return null;
  return s;
}

function normalizeVersion(value) {
  const version = normalizeString(String(value ?? ''), 128);
  if (!version) return null;
  if (version === '*' || /^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][A-Za-z0-9_.-]+)?$/.test(version)) return version;
  return version.replace(/^v/, '') || null;
}

export class VulnerabilityDatabase {
  constructor(options = {}) {
    this.offline = options.offline ?? envFlag('SHAI_SCANNER_OFFLINE');
    this.cachePath = options.cachePath || getCachePath();
    this.packages = new Map();
    this.info = {
      version: '4.6.1',
      createdAt: '2026-05-02T00:00:00Z',
      lastUpdated: null,
      lastCheckTime: null,
      packageCount: 0,
      versionCount: 0,
      sources: ['embedded']
    };
    this.loadEmbedded();
    if (!options.noCache) this.loadCache();
  }

  loadEmbedded() {
    for (const entry of EMBEDDED_IOCS) this.addEntry(entry, { source: 'embedded' });
    this.refreshCounts();
  }

  loadCache() {
    try {
      if (!existsSync(this.cachePath)) return;
      const data = safeJsonParse(readFileSync(this.cachePath, 'utf8'));
      if (!isPlainObject(data)) return;
      if (Array.isArray(data.entries)) {
        for (const entry of data.entries) this.addEntry(entry, { source: 'cache' });
      }
      if (isPlainObject(data.info)) {
        this.info = {
          ...this.info,
          lastUpdated: normalizeString(data.info.lastUpdated, 64) || this.info.lastUpdated,
          lastCheckTime: normalizeString(data.info.lastCheckTime, 64) || this.info.lastCheckTime,
          sources: Array.isArray(data.info.sources) ? [...new Set([...this.info.sources, ...data.info.sources.map((s) => sanitize(s, 80))])] : this.info.sources
        };
      }
      this.refreshCounts();
    } catch {
      // Ignore corrupt cache and continue with embedded data.
    }
  }

  saveCache() {
    const entries = this.getAllEntries();
    const payload = JSON.stringify({ info: this.info, entries }, null, 2);
    writeFileAtomic(this.cachePath, payload, DEFAULTS.FILE_MODE_PRIVATE);
  }

  refreshCounts() {
    this.info.packageCount = this.packages.size;
    let versionCount = 0;
    for (const entry of this.packages.values()) versionCount += entry.versions.length;
    this.info.versionCount = versionCount;
  }

  addEntry(rawEntry, context = {}) {
    if (!isPlainObject(rawEntry)) return false;
    const name = normalizeString(rawEntry.name, 214);
    if (!name) return false;
    const rawVersions = Array.isArray(rawEntry.versions) ? rawEntry.versions : [rawEntry.version];
    const versions = rawVersions.map(normalizeVersion).filter(Boolean).slice(0, 10000);
    if (versions.length === 0) return false;

    const severity = normalizeSeverity(rawEntry.severity, context.severity || 'critical');
    const attack = normalizeString(rawEntry.attack, 96) || context.attack || 'unknown';
    const description = normalizeString(rawEntry.description, 600) || `${attack} indicator of compromise`;
    const sources = new Set([...(Array.isArray(rawEntry.sources) ? rawEntry.sources : []), context.source].filter(Boolean).map((s) => sanitize(s, 120)));

    const existing = this.packages.get(name);
    if (existing) {
      const versionSet = new Set(existing.versions);
      for (const version of versions) versionSet.add(version);
      existing.versions = Array.from(versionSet).sort();
      if (SEVERITY_RANK[severity] > SEVERITY_RANK[existing.severity]) existing.severity = severity;
      if (!existing.attack || existing.attack === 'unknown') existing.attack = attack;
      if (description && (!existing.description || existing.description.includes('indicator'))) existing.description = description;
      for (const source of sources) existing.sources.push(source);
      existing.sources = Array.from(new Set(existing.sources));
    } else {
      this.packages.set(name, {
        name,
        versions: Array.from(new Set(versions)).sort(),
        severity,
        attack,
        description,
        sources: Array.from(sources)
      });
    }
    this.refreshCounts();
    return true;
  }

  check(name, version) {
    const entry = this.packages.get(String(name ?? '').trim());
    if (!entry) return null;
    const v = String(version ?? '').trim();
    if (entry.versions.includes('*') || entry.versions.includes(v) || entry.versions.includes(v.replace(/^v/, ''))) {
      return { ...entry, versions: [...entry.versions], sources: [...entry.sources] };
    }
    return null;
  }

  checkManifestRange(name, range) {
    const entry = this.packages.get(String(name ?? '').trim());
    if (!entry) return null;
    const matches = entry.versions.filter((version) => version === '*' || rangeMayIncludeVersion(range, version));
    if (matches.length === 0) return null;
    return { ...entry, versions: matches, sources: [...entry.sources], matchedRange: String(range ?? '') };
  }

  search(query) {
    const q = String(query ?? '').toLowerCase();
    return this.getAllEntries().filter((entry) => entry.name.toLowerCase().includes(q) || entry.attack.toLowerCase().includes(q));
  }

  getAllEntries() {
    return Array.from(this.packages.values()).map((entry) => ({ ...entry, versions: [...entry.versions], sources: [...entry.sources] }));
  }

  getInfo() {
    this.refreshCounts();
    return { ...this.info, sources: [...this.info.sources] };
  }

  shouldAutoUpdate(intervalHours = DEFAULTS.AUTO_UPDATE_INTERVAL_HOURS) {
    if (this.offline || envFlag('SHAI_SCANNER_NO_AUTO_UPDATE')) return false;
    if (!this.info.lastCheckTime) return true;
    const last = Date.parse(this.info.lastCheckTime);
    if (!Number.isFinite(last)) return true;
    return (Date.now() - last) / (1000 * 60 * 60) >= intervalHours;
  }

  importCsvText(text, options = {}) {
    const rows = parseCsv(text);
    return this.addRows(rows, options);
  }

  importCsvFile(filePath, options = {}) {
    const text = readFileSync(filePath, 'utf8');
    const added = this.importCsvText(text, { source: `file:${filePath}`, ...options });
    this.info.lastUpdated = new Date().toISOString();
    this.saveCache();
    return added;
  }

  addRows(rows, options = {}) {
    if (!Array.isArray(rows) || rows.length === 0) return 0;
    const first = rows[0].map((c) => c.toLowerCase());
    const hasHeader = first.includes('package_name') || first.includes('name');
    const dataRows = hasHeader ? rows.slice(1) : rows;
    let added = 0;

    for (const row of dataRows) {
      if (!row || row.length < 2) continue;
      let name = row[0]?.trim();
      let versionsCell = row[1]?.trim();
      if (!name || !versionsCell || name === 'package_name') continue;
      versionsCell = versionsCell.replace(/^"|"$/g, '');
      const versions = versionsCell.split(/\s*,\s*/).map((v) => v.trim()).filter(Boolean);
      if (versions.length === 0) continue;
      const vendors = row[2]?.trim();
      const ok = this.addEntry({
        name,
        versions,
        severity: options.severity || 'critical',
        attack: options.attack || 'shai-hulud',
        description: vendors ? `${options.attack || 'Shai-Hulud'} IOC reported by ${vendors}` : `${options.attack || 'Shai-Hulud'} IOC`,
        sources: [options.source || 'csv']
      }, options);
      if (ok) added++;
    }
    return added;
  }

  async update(onProgress) {
    if (this.offline) {
      this.info.lastCheckTime = new Date().toISOString();
      this.saveCache();
      return { success: false, before: this.info.versionCount, after: this.info.versionCount, added: 0, sources: [], errors: ['Offline mode is enabled'] };
    }

    const before = this.info.versionCount;
    const errors = [];
    const sources = [];
    let addedRows = 0;

    for (const source of DATA_SOURCES) {
      try {
        onProgress?.(`Fetching ${source.id}`);
        const text = await fetchText(source.url, DEFAULTS.FETCH_TIMEOUT_MS, DEFAULTS.MAX_REMOTE_BYTES);
        const rows = parseCsv(text);
        const added = this.addRows(rows, { source: source.id, attack: source.attack, severity: source.severity });
        addedRows += added;
        sources.push(source.id);
        onProgress?.(`${source.id}: merged ${added} package rows`);
      } catch (error) {
        errors.push(`${source.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    this.info.lastUpdated = new Date().toISOString();
    this.info.lastCheckTime = new Date().toISOString();
    this.info.sources = Array.from(new Set([...this.info.sources, ...sources]));
    this.refreshCounts();
    this.saveCache();

    return {
      success: sources.length > 0,
      before,
      after: this.info.versionCount,
      added: Math.max(0, this.info.versionCount - before),
      mergedRows: addedRows,
      sources,
      errors
    };
  }
}

async function fetchText(url, timeoutMs, maxBytes) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') throw new Error('Only HTTPS data sources are allowed');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'shai-scanner/4.6.1' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    if (Buffer.byteLength(text, 'utf8') > maxBytes) throw new Error(`Remote file exceeds ${maxBytes} bytes`);
    return text;
  } finally {
    clearTimeout(timer);
  }
}

export function getDatabase(options = {}) {
  return new VulnerabilityDatabase(options);
}
