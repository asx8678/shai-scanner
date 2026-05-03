import { relative } from 'node:path';
import { colorize, sanitize } from './utils.js';

function severityColor(colors, severity) {
  if (severity === 'critical') return colors.red;
  if (severity === 'high') return colors.yellow;
  if (severity === 'medium') return colors.magenta;
  if (severity === 'low') return colors.blue;
  return (x) => x;
}

export function renderTextReport(result, options = {}) {
  const colors = colorize(options.color !== false);
  const lines = [];
  const findings = result.findings || [];
  const vulns = result.vulnerabilities || [];
  const cwd = process.cwd();
  const critical = findings.filter((f) => f.severity === 'critical').length;
  const high = findings.filter((f) => f.severity === 'high').length;
  const medium = findings.filter((f) => f.severity === 'medium').length;
  const low = findings.filter((f) => f.severity === 'low').length;

  lines.push(colors.bold('Shai-Scanner 4.5 scan results'));
  if (result.liveAdvisories) {
    lines.push(`Live advisories: ${result.liveAdvisories.findings?.length || 0} finding(s) from ${(result.liveAdvisories.sources || []).join(', ') || 'none'}`);
  }
  lines.push('');
  lines.push(`Database: ${result.database?.versionCount ?? 0} package-version IOCs from ${(result.database?.sources || []).join(', ') || 'embedded'}`);
  lines.push(`Scanned: ${result.stats?.packagesScanned ?? 0} installed packages, ${result.stats?.lockfilePackagesScanned ?? 0} lockfile packages, ${result.stats?.manifestsScanned ?? 0} manifests`);
  lines.push(`Findings: ${findings.length} total (${colors.red(`${critical} critical`)}, ${colors.yellow(`${high} high`)}, ${colors.magenta(`${medium} medium`)}, ${colors.blue(`${low} low`)})`);
  lines.push(`Time: ${result.scanTimeMs}ms`);
  lines.push('');

  if (findings.length === 0) {
    lines.push(colors.green('ALL CLEAR — no Shai-Hulud indicators or selected live advisory matches were found in the scanned paths.'));
  } else {
    lines.push(colors.red(`FOUND ${findings.length} SECURITY FINDING${findings.length === 1 ? '' : 'S'}`));
    lines.push('');
    findings.forEach((finding, index) => {
      const paint = severityColor(colors, finding.severity);
      const rel = finding.path ? relative(cwd, finding.path) || finding.path : '';
      lines.push(`${String(index + 1).padStart(2, ' ')}. ${paint(finding.severity.toUpperCase())} ${colors.bold(finding.type)} ${finding.packageName ? `${finding.packageName}${finding.packageVersion ? `@${finding.packageVersion}` : ''}` : ''}`.trim());
      if (finding.attack) lines.push(`    Attack: ${sanitize(finding.attack)}`);
      if (finding.description) lines.push(`    Detail: ${sanitize(finding.description, 280)}`);
      if (finding.evidence) lines.push(`    Evidence: ${sanitize(finding.evidence, 280)}`);
      if (finding.url) lines.push(`    URL: ${sanitize(finding.url, 300)}`);
      if (rel) lines.push(`    Path: ${sanitize(rel, 260)}`);
      if (finding.remediation) lines.push(`    Fix: ${sanitize(finding.remediation, 320)}`);
      lines.push('');
    });

    if (vulns.length > 0) {
      lines.push(colors.yellow('Immediate response checklist'));
      lines.push('  1. Stop installs/builds that used the affected dependency tree.');
      lines.push('  2. Remove malicious package versions and regenerate lockfiles.');
      lines.push('  3. Reinstall with lifecycle scripts disabled until the tree is trusted.');
      lines.push('  4. Rotate npm, GitHub, cloud, CI/CD, Vault, and API credentials reachable from affected hosts.');
      lines.push('  5. Audit GitHub repositories, workflows, OIDC trusted publishing settings, and Actions logs.');
    }
  }

  if (result.warnings?.length) {
    lines.push('');
    lines.push(colors.yellow('Warnings'));
    for (const warning of result.warnings) lines.push(`  - ${sanitize(warning.path)}: ${sanitize(warning.message)}`);
  }

  if (options.auditResult) {
    const audit = options.auditResult;
    lines.push('');
    lines.push(colors.bold('Package manager audit'));
    if (!audit.success) {
      lines.push(`  ${colors.yellow('Not completed')}: ${sanitize(audit.error || 'unknown error')}`);
    } else {
      lines.push(`  Manager: ${audit.packageManager}`);
      lines.push(`  Vulnerabilities: ${audit.summary.total} (${audit.summary.critical} critical, ${audit.summary.high} high, ${audit.summary.medium} medium, ${audit.summary.low} low)`);
    }
  }

  return lines.join('\n');
}

export function renderJsonReport(result, options = {}) {
  return JSON.stringify({ ...result, audit: options.auditResult }, null, 2);
}

export function renderSarifReport(result) {
  const rules = new Map();
  const results = [];
  for (const finding of result.findings || []) {
    const ruleId = `shai-scanner/${finding.type}/${finding.source || finding.severity}`;
    if (!rules.has(ruleId)) {
      rules.set(ruleId, {
        id: ruleId,
        shortDescription: { text: finding.type },
        fullDescription: { text: finding.description || finding.type },
        defaultConfiguration: { level: sarifLevel(finding.severity) }
      });
    }
    results.push({
      ruleId,
      level: sarifLevel(finding.severity),
      message: { text: [finding.packageName && `${finding.packageName}@${finding.packageVersion || ''}`, finding.description, finding.evidence].filter(Boolean).join(' — ') },
      locations: finding.path ? [{ physicalLocation: { artifactLocation: { uri: finding.path } } }] : []
    });
  }
  return JSON.stringify({
    version: '2.1.0',
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    runs: [{
      tool: { driver: { name: 'shai-scanner', version: '4.6.5', rules: Array.from(rules.values()) } },
      results
    }]
  }, null, 2);
}

function sarifLevel(severity) {
  if (severity === 'critical' || severity === 'high') return 'error';
  if (severity === 'medium') return 'warning';
  return 'note';
}
