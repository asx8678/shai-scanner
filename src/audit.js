import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { safeJsonParse } from './utils.js';

export function detectPackageManager(dir) {
  if (existsSync(join(dir, 'pnpm-lock.yaml')) && commandAvailable('pnpm')) return 'pnpm';
  if (existsSync(join(dir, 'yarn.lock')) && commandAvailable('yarn')) return 'yarn';
  if ((existsSync(join(dir, 'package-lock.json')) || existsSync(join(dir, 'npm-shrinkwrap.json'))) && commandAvailable('npm')) return 'npm';
  if (commandAvailable('npm')) return 'npm';
  if (commandAvailable('pnpm')) return 'pnpm';
  if (commandAvailable('yarn')) return 'yarn';
  return 'none';
}

function commandAvailable(command) {
  try {
    const result = spawnSync(command, ['--version'], { stdio: 'pipe', timeout: 5000 });
    return result.status === 0;
  } catch {
    return false;
  }
}

export async function runAudit(dir, onProgress) {
  const packageManager = detectPackageManager(dir);
  if (packageManager === 'none') {
    return { packageManager, success: false, error: 'No npm, pnpm, or yarn command found', vulnerabilities: [], summary: emptySummary() };
  }
  onProgress?.(`Running ${packageManager} audit`);
  let output = '';
  try {
    if (packageManager === 'npm') output = run('npm', ['audit', '--json'], dir);
    if (packageManager === 'pnpm') output = run('pnpm', ['audit', '--json'], dir);
    if (packageManager === 'yarn') output = run('yarn', ['audit', '--json'], dir);
    const vulnerabilities = parseAudit(packageManager, output);
    return { packageManager, success: true, vulnerabilities, summary: summarize(vulnerabilities) };
  } catch (error) {
    return { packageManager, success: false, error: error instanceof Error ? error.message : String(error), vulnerabilities: [], summary: emptySummary() };
  }
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: 'pipe', timeout: 60000, maxBuffer: 25 * 1024 * 1024 });
  return result.stdout?.toString() || result.stderr?.toString() || '{}';
}

function parseAudit(pm, output) {
  if (pm === 'yarn') return parseYarnAudit(output);
  const data = safeJsonParse(output);
  if (!data || typeof data !== 'object') return [];
  const out = [];

  if (data.vulnerabilities && typeof data.vulnerabilities === 'object') {
    for (const [name, vuln] of Object.entries(data.vulnerabilities)) {
      if (!vuln || typeof vuln !== 'object') continue;
      const via = Array.isArray(vuln.via) ? vuln.via : [];
      const firstObj = via.find((v) => v && typeof v === 'object');
      out.push({
        name,
        severity: normalizeSeverity(vuln.severity),
        title: firstObj?.title || via.find((v) => typeof v === 'string') || 'npm audit vulnerability',
        url: firstObj?.url || '',
        range: vuln.range || '*',
        fixAvailable: Boolean(vuln.fixAvailable),
        via: via.map((v) => typeof v === 'string' ? v : v?.name || v?.source).filter(Boolean)
      });
    }
  }

  if (data.advisories && typeof data.advisories === 'object') {
    for (const advisory of Object.values(data.advisories)) {
      if (!advisory || typeof advisory !== 'object') continue;
      out.push({
        name: advisory.module_name || advisory.name || 'unknown',
        severity: normalizeSeverity(advisory.severity),
        title: advisory.title || 'pnpm audit vulnerability',
        url: advisory.url || '',
        range: advisory.vulnerable_versions || advisory.range || '*',
        fixAvailable: Boolean(advisory.patched_versions && advisory.patched_versions !== '<0.0.0'),
        via: []
      });
    }
  }

  return out;
}

function parseYarnAudit(output) {
  const out = [];
  for (const line of String(output || '').split(/\r?\n/).filter(Boolean)) {
    const data = safeJsonParse(line);
    if (!data || data.type !== 'auditAdvisory') continue;
    const advisory = data.data?.advisory;
    if (!advisory) continue;
    out.push({
      name: advisory.module_name || 'unknown',
      severity: normalizeSeverity(advisory.severity),
      title: advisory.title || 'yarn audit vulnerability',
      url: advisory.url || '',
      range: advisory.vulnerable_versions || '*',
      fixAvailable: Boolean(advisory.patched_versions && advisory.patched_versions !== '<0.0.0'),
      via: []
    });
  }
  return out;
}

function normalizeSeverity(severity) {
  const s = String(severity || '').toLowerCase();
  if (s === 'critical') return 'critical';
  if (s === 'high') return 'high';
  if (s === 'moderate' || s === 'medium') return 'medium';
  if (s === 'low') return 'low';
  return 'info';
}

function emptySummary() {
  return { total: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0 };
}

function summarize(vulnerabilities) {
  const summary = emptySummary();
  for (const vuln of vulnerabilities) {
    summary.total++;
    summary[vuln.severity] = (summary[vuln.severity] || 0) + 1;
  }
  return summary;
}
