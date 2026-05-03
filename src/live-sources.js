import { DEFAULTS } from './constants.js';
import { rangeMayIncludeVersion } from './semver-lite.js';
import { sanitize, uniqueBy } from './utils.js';

export const OSV_QUERYBATCH_URL = 'https://api.osv.dev/v1/querybatch';
export const OSV_VULN_URL = 'https://api.osv.dev/v1/vulns/';
export const GITHUB_ADVISORIES_URL = 'https://api.github.com/advisories';

function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function normalizePackage(pkg) {
  const name = String(pkg?.name ?? pkg?.packageName ?? '').trim();
  const version = String(pkg?.version ?? pkg?.packageVersion ?? '').trim().replace(/^v/, '');
  if (!name || !version || version === '*' || name.length > 214 || version.length > 128) return null;
  if (/\s/.test(name) || /[<>|]/.test(version)) return null;
  return {
    name,
    version,
    paths: Array.isArray(pkg.paths) ? pkg.paths.filter(Boolean).map(String) : (pkg.path ? [String(pkg.path)] : []),
    sources: Array.isArray(pkg.sources) ? pkg.sources.filter(Boolean).map(String) : (pkg.source ? [String(pkg.source)] : [])
  };
}

function normalizeInventory(packages, maxPackages) {
  return uniqueBy((packages || []).map(normalizePackage).filter(Boolean), (pkg) => `${pkg.name}@${pkg.version}`)
    .slice(0, Math.max(1, Number(maxPackages) || DEFAULTS.MAX_LIVE_OSV_PACKAGES));
}

function makeAbortSignal(timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, cancel: () => clearTimeout(timer) };
}

async function postJson(fetchImpl, url, payload, timeoutMs, headers = {}) {
  const { signal, cancel } = makeAbortSignal(timeoutMs);
  try {
    const response = await fetchImpl(url, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'shai-scanner/4.6.5',
        ...headers
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await readJson(response);
  } finally {
    cancel();
  }
}

async function getJson(fetchImpl, url, timeoutMs, headers = {}) {
  const { signal, cancel } = makeAbortSignal(timeoutMs);
  try {
    const response = await fetchImpl(url, {
      method: 'GET',
      signal,
      headers: {
        'User-Agent': 'shai-scanner/4.6.5',
        ...headers
      }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await readJson(response);
  } finally {
    cancel();
  }
}

async function readJson(response) {
  const text = typeof response.text === 'function'
    ? await response.text()
    : JSON.stringify(await response.json());
  if (Buffer.byteLength(text || '', 'utf8') > DEFAULTS.MAX_REMOTE_BYTES) {
    throw new Error(`Response too large (>${DEFAULTS.MAX_REMOTE_BYTES} bytes)`);
  }
  return text ? JSON.parse(text) : null;
}

function severityFromCvssScore(score) {
  const n = typeof score === 'number' ? score : Number.parseFloat(String(score ?? ''));
  if (!Number.isFinite(n)) return null;
  if (n >= 9) return 'critical';
  if (n >= 7) return 'high';
  if (n >= 4) return 'medium';
  return 'low';
}

function normalizeSeverity(value) {
  const s = String(value ?? '').toLowerCase().trim();
  if (s === 'critical') return 'critical';
  if (s === 'high') return 'high';
  if (s === 'moderate' || s === 'medium') return 'medium';
  if (s === 'low') return 'low';
  return null;
}

export function severityFromOsvRecord(record) {
  if (!record || typeof record !== 'object') return 'high';

  const direct = normalizeSeverity(record.database_specific?.severity);
  if (direct) return direct;

  if (Array.isArray(record.severity)) {
    for (const sev of record.severity) {
      const normalized = normalizeSeverity(sev?.score || sev?.type);
      if (normalized) return normalized;
      const fromNumber = severityFromCvssScore(sev?.score);
      if (fromNumber) return fromNumber;
    }
  }

  if (Array.isArray(record.affected)) {
    for (const affected of record.affected) {
      const ecosystemSpecific = affected?.ecosystem_specific || {};
      const normalized = normalizeSeverity(ecosystemSpecific.severity || ecosystemSpecific.impact);
      if (normalized) return normalized;
    }
  }

  const id = String(record.id || '');
  const text = `${record.summary || ''} ${record.details || ''}`.toLowerCase();
  if (id.startsWith('MAL-') || text.includes('malware') || text.includes('malicious')) return 'critical';
  return 'high';
}

function aliasesFor(record, id) {
  return Array.from(new Set([id, ...(Array.isArray(record?.aliases) ? record.aliases : [])].filter(Boolean)));
}

function referenceUrls(record, limit = 5) {
  if (!Array.isArray(record?.references)) return [];
  return record.references.map((r) => r?.url).filter(Boolean).slice(0, limit);
}

function summarizeRecord(record, id) {
  if (!record || typeof record !== 'object') {
    return { id, aliases: [id], severity: 'high', summary: id, details: '', modified: null, published: null, references: [] };
  }
  const recordId = record.id || id;
  return {
    id: recordId,
    aliases: aliasesFor(record, recordId),
    severity: severityFromOsvRecord(record),
    summary: sanitize(record.summary || recordId, 300),
    details: sanitize(record.details || '', 1000),
    modified: record.modified || null,
    published: record.published || null,
    references: referenceUrls(record)
  };
}

function normalizeOsvOptions(options) {
  return {
    fetchImpl: options.fetchImpl || globalThis.fetch,
    timeoutMs: Number(options.timeoutMs) || DEFAULTS.FETCH_TIMEOUT_MS,
    batchSize: Math.max(1, Math.min(Number(options.batchSize) || DEFAULTS.OSV_BATCH_SIZE, DEFAULTS.OSV_BATCH_SIZE)),
    maxPackages: Math.max(1, Number(options.maxPackages) || DEFAULTS.MAX_LIVE_OSV_PACKAGES),
    detailLimit: Math.max(0, Number(options.detailLimit) || DEFAULTS.MAX_LIVE_OSV_DETAILS),
    onProgress: options.onProgress
  };
}

export async function queryOsvForPackages(packages, options = {}) {
  const cfg = normalizeOsvOptions(options);
  if (typeof cfg.fetchImpl !== 'function') throw new Error('fetch is not available in this Node.js runtime');

  const inventory = normalizeInventory(packages, cfg.maxPackages);
  const vulnerabilities = [];
  const errors = [];
  const detailCache = new Map();

  for (const group of chunk(inventory, cfg.batchSize)) {
    const queries = group.map((pkg) => ({ package: { name: pkg.name, ecosystem: 'npm' }, version: pkg.version }));
    let data;
    try {
      cfg.onProgress?.(`OSV: querying ${group.length} package versions`);
      data = await postJson(cfg.fetchImpl, OSV_QUERYBATCH_URL, { queries }, cfg.timeoutMs);
    } catch (error) {
      errors.push(`OSV querybatch: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }

    const results = Array.isArray(data?.results) ? data.results : [];
    for (let i = 0; i < group.length; i++) {
      const pkg = group[i];
      const result = results[i] || {};
      if (result.next_page_token) errors.push(`${pkg.name}@${pkg.version}: OSV result was paginated; first page only was processed`);
      const vulns = Array.isArray(result.vulns) ? result.vulns : [];
      for (const vuln of vulns) {
        const id = String(vuln?.id || '').trim();
        if (!id) continue;
        let detail = detailCache.get(id);
        if (!detail && detailCache.size < cfg.detailLimit) {
          try {
            cfg.onProgress?.(`OSV: fetching ${id}`);
            detail = summarizeRecord(await getJson(cfg.fetchImpl, `${OSV_VULN_URL}${encodeURIComponent(id)}`, cfg.timeoutMs), id);
            detailCache.set(id, detail);
          } catch (error) {
            errors.push(`${id}: ${error instanceof Error ? error.message : String(error)}`);
            detail = summarizeRecord(vuln, id);
            detailCache.set(id, detail);
          }
        } else if (!detail) {
          detail = summarizeRecord(vuln, id);
        }

        vulnerabilities.push({
          source: 'osv.dev',
          id,
          aliases: detail.aliases,
          severity: detail.severity,
          summary: detail.summary,
          details: detail.details,
          packageName: pkg.name,
          packageVersion: pkg.version,
          packageSources: pkg.sources,
          packagePaths: pkg.paths,
          modified: detail.modified || vuln.modified || null,
          published: detail.published || null,
          references: detail.references
        });
      }
    }
  }

  const uniqueVulns = uniqueBy(vulnerabilities, (v) => `${v.source}:${v.id}:${v.packageName}@${v.packageVersion}`)
    .sort((a, b) => severityOrder(b.severity) - severityOrder(a.severity) || a.packageName.localeCompare(b.packageName));

  return {
    source: 'osv.dev',
    ecosystem: 'npm',
    packagesQueried: inventory.length,
    vulnerabilities: uniqueVulns,
    errors,
    truncated: (packages || []).length > inventory.length,
    generatedAt: new Date().toISOString()
  };
}

function githubHeaders(token) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'shai-scanner/4.6.5'
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function buildGithubAdvisoryUrl(group, type, page) {
  const params = new URLSearchParams();
  params.set('ecosystem', 'npm');
  params.set('type', type);
  params.set('per_page', '100');
  params.set('page', String(page));
  params.set('affects', group.map((pkg) => `${pkg.name}@${pkg.version}`).join(','));
  return `${GITHUB_ADVISORIES_URL}?${params.toString()}`;
}

function advisoryReferences(advisory) {
  const refs = [];
  if (advisory?.html_url) refs.push(advisory.html_url);
  if (Array.isArray(advisory?.references)) refs.push(...advisory.references.filter(Boolean));
  return Array.from(new Set(refs)).slice(0, 5);
}

function inventoryByName(inventory) {
  const map = new Map();
  for (const pkg of inventory) {
    const list = map.get(pkg.name) || [];
    list.push(pkg);
    map.set(pkg.name, list);
  }
  return map;
}

function githubAdvisoryToMatches(advisory, inventoryMap) {
  const matches = [];
  const vulns = Array.isArray(advisory?.vulnerabilities) ? advisory.vulnerabilities : [];
  for (const vuln of vulns) {
    if (vuln?.package?.ecosystem && String(vuln.package.ecosystem).toLowerCase() !== 'npm') continue;
    const name = vuln?.package?.name;
    if (!name) continue;
    const candidates = inventoryMap.get(name) || [];
    const range = vuln.vulnerable_version_range || vuln.range || '*';
    for (const pkg of candidates) {
      if (!rangeMayIncludeVersion(String(range), pkg.version)) continue;
      const id = advisory.ghsa_id || advisory.cve_id || advisory.url || `${name}:${range}`;
      const aliases = Array.from(new Set([advisory.ghsa_id, advisory.cve_id, ...(Array.isArray(advisory.cwes) ? advisory.cwes.map((c) => c?.cwe_id).filter(Boolean) : [])].filter(Boolean)));
      matches.push({
        source: 'github-advisory-database',
        id,
        aliases,
        severity: normalizeSeverity(advisory.severity) || 'high',
        summary: sanitize(advisory.summary || advisory.description || id, 300),
        details: sanitize(advisory.description || '', 1000),
        packageName: pkg.name,
        packageVersion: pkg.version,
        packageSources: pkg.sources,
        packagePaths: pkg.paths,
        modified: advisory.updated_at || null,
        published: advisory.published_at || null,
        references: advisoryReferences(advisory),
        advisoryType: advisory.type || 'reviewed',
        vulnerableRange: String(range),
        patchedVersion: vuln.first_patched_version?.identifier || null,
        withdrawnAt: advisory.withdrawn_at || null
      });
    }
  }
  return matches;
}

function normalizeGithubOptions(options) {
  return {
    fetchImpl: options.fetchImpl || globalThis.fetch,
    timeoutMs: Number(options.timeoutMs) || DEFAULTS.FETCH_TIMEOUT_MS,
    batchSize: Math.max(1, Math.min(Number(options.githubBatchSize || options.batchSize) || DEFAULTS.GITHUB_ADVISORY_BATCH_SIZE, 100)),
    maxPackages: Math.max(1, Number(options.maxPackages) || DEFAULTS.MAX_LIVE_GITHUB_PACKAGES),
    maxPages: Math.max(1, Math.min(Number(options.maxPages) || 10, 20)),
    token: options.githubToken || process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '',
    includeTypes: Array.isArray(options.githubTypes) && options.githubTypes.length ? options.githubTypes : ['reviewed', 'malware'],
    onProgress: options.onProgress
  };
}

export async function queryGithubAdvisoriesForPackages(packages, options = {}) {
  const cfg = normalizeGithubOptions(options);
  if (typeof cfg.fetchImpl !== 'function') throw new Error('fetch is not available in this Node.js runtime');

  const inventory = normalizeInventory(packages, cfg.maxPackages);
  const vulnerabilities = [];
  const errors = [];
  const inventoryMap = inventoryByName(inventory);

  for (const group of chunk(inventory, cfg.batchSize)) {
    for (const type of cfg.includeTypes) {
      for (let page = 1; page <= cfg.maxPages; page++) {
        let advisories;
        try {
          cfg.onProgress?.(`GitHub Advisory: ${type}, ${group.length} package versions, page ${page}`);
          advisories = await getJson(cfg.fetchImpl, buildGithubAdvisoryUrl(group, type, page), cfg.timeoutMs, githubHeaders(cfg.token));
        } catch (error) {
          errors.push(`GitHub ${type}: ${error instanceof Error ? error.message : String(error)}`);
          break;
        }
        if (!Array.isArray(advisories) || advisories.length === 0) break;
        for (const advisory of advisories) vulnerabilities.push(...githubAdvisoryToMatches(advisory, inventoryMap));
        if (advisories.length < 100) break;
      }
    }
  }

  const uniqueVulns = uniqueBy(vulnerabilities, (v) => `${v.source}:${v.id}:${v.advisoryType}:${v.packageName}@${v.packageVersion}:${v.vulnerableRange}`)
    .sort((a, b) => severityOrder(b.severity) - severityOrder(a.severity) || a.packageName.localeCompare(b.packageName));

  return {
    source: 'github-advisory-database',
    ecosystem: 'npm',
    packagesQueried: inventory.length,
    vulnerabilities: uniqueVulns,
    errors,
    truncated: (packages || []).length > inventory.length,
    generatedAt: new Date().toISOString()
  };
}

export async function queryLiveAdvisories(packages, options = {}, onProgress) {
  if (options.offline) {
    return {
      enabled: false,
      ecosystem: 'npm',
      packagesQueried: 0,
      sources: [],
      findings: [],
      results: {},
      errors: ['Offline mode enabled; live advisory queries were skipped.'],
      generatedAt: new Date().toISOString()
    };
  }

  const sources = normalizeSourceList(options.sources || options.source || (options.osv || options.github ? [options.osv && 'osv', options.github && 'github'].filter(Boolean) : ['osv', 'github']));
  const normalizedInventory = normalizeInventory(packages, options.maxPackages || DEFAULTS.MAX_LIVE_OSV_PACKAGES);
  const results = {};
  const findings = [];
  const errors = [];

  if (normalizedInventory.length === 0) {
    return {
      enabled: true,
      ecosystem: 'npm',
      packagesQueried: 0,
      sources: sources.map((s) => s === 'osv' ? 'osv.dev' : 'github-advisory-database'),
      findings: [],
      results: {},
      errors: ['No exact package inventory was found; live advisory queries need lockfiles or installed node_modules.'],
      generatedAt: new Date().toISOString()
    };
  }

  if (sources.includes('osv')) {
    try {
      const osv = await queryOsvForPackages(normalizedInventory, { ...options, onProgress: onProgress || options.onProgress });
      results.osv = osv;
      findings.push(...osv.vulnerabilities.map(liveVulnToFinding));
      errors.push(...osv.errors);
    } catch (error) {
      errors.push(`OSV: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (sources.includes('github')) {
    try {
      const github = await queryGithubAdvisoriesForPackages(normalizedInventory, { ...options, onProgress: onProgress || options.onProgress });
      results.github = github;
      findings.push(...github.vulnerabilities.map(liveVulnToFinding));
      errors.push(...github.errors);
    } catch (error) {
      errors.push(`GitHub Advisory Database: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    enabled: true,
    ecosystem: 'npm',
    packagesQueried: Math.max(results.osv?.packagesQueried || 0, results.github?.packagesQueried || 0),
    sources: sources.map((s) => s === 'osv' ? 'osv.dev' : 'github-advisory-database'),
    findings: uniqueBy(findings, (f) => f.id),
    results,
    errors,
    generatedAt: new Date().toISOString()
  };
}

function normalizeSourceList(value) {
  const raw = Array.isArray(value) ? value : String(value || '').split(',');
  const normalized = raw.map((item) => String(item).trim().toLowerCase()).filter(Boolean);
  if (normalized.includes('all')) return ['osv', 'github'];
  const out = [];
  for (const item of normalized) {
    if (item === 'osv' || item === 'osv.dev' || item === 'cve' || item === 'cves') out.push('osv');
    if (item === 'github' || item === 'ghsa' || item === 'github-advisory' || item === 'github-advisory-database') out.push('github');
  }
  return out.length ? Array.from(new Set(out)) : ['osv', 'github'];
}

export function liveVulnToFinding(vuln) {
  const isGithub = vuln.source === 'github-advisory-database';
  const isMalware = String(vuln.advisoryType || '').toLowerCase() === 'malware' || String(vuln.id || '').startsWith('MAL-') || /malware|malicious/i.test(`${vuln.summary || ''} ${vuln.details || ''}`);
  const type = isGithub ? (isMalware ? 'live-github-malware-advisory' : 'live-github-advisory') : 'live-osv-advisory';
  const sourceLabel = isGithub ? 'GitHub Advisory Database' : 'OSV';
  const firstUrl = vuln.references?.[0] || (isGithub ? '' : `https://osv.dev/vulnerability/${encodeURIComponent(vuln.id)}`);
  const fix = vuln.patchedVersion ? `Upgrade ${vuln.packageName} to ${vuln.patchedVersion} or later; regenerate the lockfile.` : `Upgrade or replace ${vuln.packageName}@${vuln.packageVersion}; review ${vuln.id} and regenerate the lockfile.`;
  return {
    id: `${type}:${vuln.id}:${vuln.packageName}@${vuln.packageVersion}:${vuln.vulnerableRange || ''}`,
    type,
    severity: vuln.severity || 'high',
    path: vuln.packagePaths?.[0] || '',
    packageName: vuln.packageName,
    packageVersion: vuln.packageVersion,
    attack: vuln.aliases?.join(', ') || vuln.id,
    description: vuln.summary || vuln.id,
    evidence: `${sourceLabel} advisory ${vuln.id} matched ${vuln.packageName}@${vuln.packageVersion}${vuln.vulnerableRange ? ` (${vuln.vulnerableRange})` : ''}`,
    source: vuln.source,
    url: firstUrl,
    advisoryId: vuln.id,
    aliases: vuln.aliases || [],
    publishedAt: vuln.published,
    updatedAt: vuln.modified,
    remediation: fix
  };
}

function severityOrder(severity) {
  return { low: 1, medium: 2, high: 3, critical: 4 }[severity] || 0;
}
