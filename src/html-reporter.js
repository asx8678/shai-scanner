
const SEVERITY_CONFIG = {
  critical: { color: '#DC2626', bg: '#FEE2E2', icon: '🔴', label: 'Critical' },
  high: { color: '#EA580C', bg: '#FFF7ED', icon: '🟠', label: 'High' },
  medium: { color: '#D97706', bg: '#FFFBEB', icon: '🟡', label: 'Medium' },
  low: { color: '#2563EB', bg: '#EFF6FF', icon: '🔵', label: 'Low' },
};

const TYPE_DESCRIPTIONS = {
  'package-ioc': 'Known compromised package version',
  'lockfile-ioc': 'Compromised package found in lockfile',
  'manifest-ioc': 'Compromised package referenced in manifest',
  'manifest-self-ioc': 'Self-referential manifest compromise',
  'live-osv-advisory': 'Live OSV advisory match',
  'live-github-advisory': 'GitHub Advisory Database match',
  'live-github-malware-advisory': 'GitHub malware advisory',
  'workflow-ioc': 'Suspicious workflow detected',
  'script-ioc': 'Suspicious install script',
  'suspicious-file': 'Suspicious file detected',
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function severityBadge(severity) {
  const config = SEVERITY_CONFIG[severity] || {
    color: '#6B7280',
    bg: '#F3F4F6',
    icon: '⚪',
    label: severity,
  };
  return `<span class="badge" style="background:${config.bg};color:${config.color};border:1px solid ${config.color}20">${config.icon} ${config.label}</span>`;
}

function createBarChart(data, max) {
  const barMaxWidth = 100;
  return data
    .map(({ label, value, color }) => {
      const width = max > 0 ? (value / max) * barMaxWidth : 0;
      return `
      <div class="chart-row">
        <span class="chart-label">${escapeHtml(label)}</span>
        <div class="chart-bar-container">
          <div class="chart-bar" style="width:${width}%;background:${color}"></div>
        </div>
        <span class="chart-value">${value}</span>
      </div>`;
    })
    .join('');
}

function createDonutChart(critical, high, medium, low) {
  const total = critical + high + medium + low;
  if (total === 0) return '<div class="donut-empty">No findings</div>';

  const size = 120;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const segments = [
    { value: critical, color: '#DC2626', label: 'Critical' },
    { value: high, color: '#EA580C', label: 'High' },
    { value: medium, color: '#D97706', label: 'Medium' },
    { value: low, color: '#2563EB', label: 'Low' },
  ].filter((s) => s.value > 0);

  let currentOffset = 0;
  const circles = segments
    .map((seg) => {
      const pct = seg.value / total;
      const dashArray = `${pct * circumference} ${(1 - pct) * circumference}`;
      const rotation = currentOffset * 360 - 90;
      currentOffset += pct;
      return `<circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="${seg.color}" stroke-width="${strokeWidth}" stroke-dasharray="${dashArray}" transform="rotate(${rotation} ${size / 2} ${size / 2})" />`;
    })
    .join('');

  return `
    <div class="donut-wrapper">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${circles}</svg>
      <div class="donut-center">
        <span class="donut-total">${total}</span>
        <span class="donut-label">Total</span>
      </div>
    </div>`;
}

function findingDetail(finding, index) {
  const config = SEVERITY_CONFIG[finding.severity] || {};
  const rel = finding.path ? finding.path : '';
  const typeLabel = TYPE_DESCRIPTIONS[finding.type] || finding.type;

  return `
    <div class="finding-card" style="border-left: 4px solid ${config.color || '#6B7280'}">
      <div class="finding-header" onclick="this.parentElement.classList.toggle('expanded')">
        <div class="finding-title">
          <span class="finding-number">#${index + 1}</span>
          ${severityBadge(finding.severity)}
          <span class="finding-type">${escapeHtml(typeLabel)}</span>
          ${finding.packageName ? `<span class="finding-package">${escapeHtml(finding.packageName)}${finding.packageVersion ? `@${escapeHtml(finding.packageVersion)}` : ''}</span>` : ''}
        </div>
        <span class="expand-icon">▶</span>
      </div>
      <div class="finding-details">
        ${finding.attack ? `<div class="finding-row"><span class="finding-label">Attack:</span> <span class="finding-value">${escapeHtml(finding.attack)}</span></div>` : ''}
        ${finding.description ? `<div class="finding-row"><span class="finding-label">Description:</span> <span class="finding-value">${escapeHtml(finding.description)}</span></div>` : ''}
        ${finding.evidence ? `<div class="finding-row"><span class="finding-label">Evidence:</span> <span class="finding-value evidence">${escapeHtml(finding.evidence)}</span></div>` : ''}
        ${finding.url ? `<div class="finding-row"><span class="finding-label">URL:</span> <span class="finding-value"><a href="${escapeHtml(finding.url)}" target="_blank">${escapeHtml(finding.url)}</a></span></div>` : ''}
        ${rel ? `<div class="finding-row"><span class="finding-label">Path:</span> <span class="finding-value path">${escapeHtml(rel)}</span></div>` : ''}
        ${finding.remediation ? `<div class="finding-row"><span class="finding-label">Remediation:</span> <span class="finding-value">${escapeHtml(finding.remediation)}</span></div>` : ''}
        ${finding.source ? `<div class="finding-row"><span class="finding-label">Source:</span> <span class="finding-value">${escapeHtml(finding.source)}</span></div>` : ''}
      </div>
    </div>`;
}

function generateStyles() {
  return `
    :root {
      --primary: #0F172A;
      --primary-light: #1E293B;
      --accent: #3B82F6;
      --accent-hover: #2563EB;
      --success: #10B981;
      --warning: #F59E0B;
      --danger: #EF4444;
      --bg: #F8FAFC;
      --card-bg: #FFFFFF;
      --border: #E2E8F0;
      --text: #1E293B;
      --text-muted: #64748B;
      --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      --radius: 8px;
      --shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
      --shadow-md: 0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: var(--font-family);
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      min-height: 100vh;
    }

    .header {
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
      color: white;
      padding: 2rem;
      text-align: center;
    }

    .header h1 {
      font-size: 1.875rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      letter-spacing: -0.025em;
    }

    .header .subtitle {
      color: #94A3B8;
      font-size: 0.875rem;
    }

    .header .timestamp {
      margin-top: 0.75rem;
      font-size: 0.75rem;
      color: #64748B;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1.5rem;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .summary-card {
      background: var(--card-bg);
      border-radius: var(--radius);
      padding: 1.25rem;
      box-shadow: var(--shadow);
      text-align: center;
    }

    .summary-card .value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--primary);
    }

    .summary-card .label {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    .summary-card.status-safe .value { color: var(--success); }
    .summary-card.status-vuln .value { color: var(--danger); }

    .section {
      background: var(--card-bg);
      border-radius: var(--radius);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: var(--shadow);
    }

    .section-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--primary);
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid var(--border);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      align-items: start;
    }

    .chart-box {
      padding: 1rem;
      background: var(--bg);
      border-radius: var(--radius);
    }

    .chart-box h3 {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .chart-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .chart-label {
      width: 80px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .chart-bar-container {
      flex: 1;
      height: 24px;
      background: var(--border);
      border-radius: 4px;
      overflow: hidden;
    }

    .chart-bar {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
      min-width: 2px;
    }

    .chart-value {
      width: 32px;
      text-align: right;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .donut-wrapper {
      display: flex;
      justify-content: center;
      position: relative;
    }

    .donut-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
    }

    .donut-total {
      font-size: 1.5rem;
      font-weight: 700;
      display: block;
    }

    .donut-label {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .donut-empty {
      text-align: center;
      padding: 2rem;
      color: var(--text-muted);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
    }

    .stat-item {
      padding: 1rem;
      background: var(--bg);
      border-radius: var(--radius);
    }

    .stat-item .stat-value {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--primary);
    }

    .stat-item .stat-label {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    .findings-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .finding-card {
      background: var(--bg);
      border-radius: var(--radius);
      overflow: hidden;
      transition: box-shadow 0.2s;
    }

    .finding-card:hover {
      box-shadow: var(--shadow-md);
    }

    .finding-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      cursor: pointer;
      user-select: none;
    }

    .finding-header:hover {
      background: var(--card-bg);
    }

    .finding-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .finding-number {
      font-weight: 600;
      color: var(--text-muted);
      font-size: 0.875rem;
    }

    .finding-type {
      font-weight: 500;
      font-size: 0.875rem;
    }

    .finding-package {
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
      font-size: 0.8125rem;
      background: var(--card-bg);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      border: 1px solid var(--border);
    }

    .expand-icon {
      color: var(--text-muted);
      font-size: 0.75rem;
      transition: transform 0.2s;
    }

    .finding-card.expanded .expand-icon {
      transform: rotate(90deg);
    }

    .finding-details {
      padding: 0 1.25rem;
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease, padding 0.3s ease;
    }

    .finding-card.expanded .finding-details {
      max-height: 1000px;
      padding: 0 1.25rem 1.25rem;
    }

    .finding-row {
      display: flex;
      padding: 0.5rem 0;
      border-top: 1px solid var(--border);
    }

    .finding-label {
      width: 120px;
      font-weight: 500;
      color: var(--text-muted);
      flex-shrink: 0;
    }

    .finding-value {
      flex: 1;
      word-break: break-word;
    }

    .finding-value.evidence {
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
      font-size: 0.875rem;
      background: var(--card-bg);
      padding: 0.5rem;
      border-radius: 4px;
    }

    .finding-value.path {
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
      font-size: 0.8125rem;
      color: var(--text-muted);
    }

    .finding-value a {
      color: var(--accent);
      text-decoration: none;
    }

    .finding-value a:hover {
      text-decoration: underline;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
      white-space: nowrap;
    }

    .clear-message {
      text-align: center;
      padding: 2rem;
      color: var(--success);
      font-size: 1.125rem;
    }

    .clear-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .warnings-list {
      background: #FFFBEB;
      border: 1px solid #FDE68A;
      border-radius: var(--radius);
      padding: 1rem;
      margin-top: 1rem;
    }

    .warnings-list h4 {
      color: #92400E;
      margin-bottom: 0.5rem;
    }

    .warning-item {
      font-size: 0.875rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid #FDE68A;
    }

    .warning-item:last-child {
      border-bottom: none;
    }

    .footer {
      text-align: center;
      padding: 2rem;
      color: var(--text-muted);
      font-size: 0.8125rem;
    }

    .footer a {
      color: var(--accent);
      text-decoration: none;
    }

    .audit-section {
      margin-top: 1rem;
      padding: 1rem;
      background: var(--bg);
      border-radius: var(--radius);
    }

    .audit-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .audit-success { color: var(--success); }
    .audit-fail { color: var(--danger); }

    .search-box {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid var(--border);
      border-radius: var(--radius);
      font-size: 1rem;
      margin-bottom: 1rem;
      transition: border-color 0.2s;
    }

    .search-box:focus {
      outline: none;
      border-color: var(--accent);
    }

    .filter-buttons {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }

    .filter-btn {
      padding: 0.5rem 1rem;
      border: 2px solid var(--border);
      border-radius: 20px;
      background: var(--card-bg);
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .filter-btn:hover {
      border-color: var(--accent);
      color: var(--accent);
    }

    .filter-btn.active {
      background: var(--accent);
      color: white;
      border-color: var(--accent);
    }

    @media print {
      body { background: white; }
      .header { background: var(--primary) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .container { padding: 0; }
      .section { box-shadow: none; border: 1px solid var(--border); break-inside: avoid; }
      .finding-details { max-height: none !important; padding: 0 1.25rem 1.25rem !important; }
      .filter-buttons, .search-box { display: none !important; }
      .finding-card { break-inside: avoid; }
    }

    @media (max-width: 640px) {
      .header { padding: 1.5rem 1rem; }
      .header h1 { font-size: 1.5rem; }
      .container { padding: 1rem; }
      .summary-grid { grid-template-columns: repeat(2, 1fr); }
      .charts-grid { grid-template-columns: 1fr; }
      .finding-title { flex-direction: column; align-items: flex-start; }
      .finding-row { flex-direction: column; }
      .finding-label { width: auto; margin-bottom: 0.25rem; }
    }
  `;
}

function generateScripts() {
  return `
    document.addEventListener('DOMContentLoaded', function() {
      const searchBox = document.getElementById('finding-search');
      const filterBtns = document.querySelectorAll('.filter-btn');
      const findings = document.querySelectorAll('.finding-card');
      let activeFilter = 'all';

      if (searchBox) {
        searchBox.addEventListener('input', function(e) {
          const query = e.target.value.toLowerCase();
          findings.forEach(function(finding) {
            const text = finding.textContent.toLowerCase();
            const matchesSearch = !query || text.includes(query);
            const matchesFilter = activeFilter === 'all' || finding.dataset.severity === activeFilter;
            finding.style.display = matchesSearch && matchesFilter ? '' : 'none';
          });
        });
      }

      filterBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
          filterBtns.forEach(function(b) { b.classList.remove('active'); });
          btn.classList.add('active');
          activeFilter = btn.dataset.severity || 'all';
          findings.forEach(function(finding) {
            const matchesFilter = activeFilter === 'all' || finding.dataset.severity === activeFilter;
            const query = searchBox ? searchBox.value.toLowerCase() : '';
            const text = finding.textContent.toLowerCase();
            const matchesSearch = !query || text.includes(query);
            finding.style.display = matchesSearch && matchesFilter ? '' : 'none';
          });
        });
      });
    });
  `;
}

export function renderHtmlReport(result, options = {}) {
  const findings = result.findings || [];
  const warnings = result.warnings || [];
  const stats = result.stats || {};

  const critical = findings.filter((f) => f.severity === 'critical').length;
  const high = findings.filter((f) => f.severity === 'high').length;
  const medium = findings.filter((f) => f.severity === 'medium').length;
  const low = findings.filter((f) => f.severity === 'low').length;
  const hasFindings = findings.length > 0;

  const maxSeverity = Math.max(critical, high, medium, low, 1);

  const severityBars = [
    { label: 'Critical', value: critical, color: '#DC2626' },
    { label: 'High', value: high, color: '#EA580C' },
    { label: 'Medium', value: medium, color: '#D97706' },
    { label: 'Low', value: low, color: '#2563EB' },
  ];

  const typeCounts = {};
  for (const finding of findings) {
    typeCounts[finding.type] = (typeCounts[finding.type] || 0) + 1;
  }
  const typeEntries = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const maxType = typeEntries.length > 0 ? typeEntries[0][1] : 1;

  const typeColors = [
    '#8B5CF6',
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#EC4899',
    '#06B6D4',
    '#84CC16',
  ];
  const typeBars = typeEntries.map(([type, count], i) => ({
    label: type,
    value: count,
    color: typeColors[i % typeColors.length],
  }));

  const now = new Date()
    .toISOString()
    .replace('T', ' ')
    .replace(/\.\d+Z/, ' UTC');

  const warningsHtml =
    warnings.length > 0
      ? `<div class="warnings-list">
         <h4>⚠️ Warnings (${warnings.length})</h4>
         ${warnings.map((w) => `<div class="warning-item"><strong>${escapeHtml(w.path || 'unknown')}:</strong> ${escapeHtml(w.message || '')}</div>`).join('')}
       </div>`
      : '';

  const audit = options.auditResult;
  const auditHtml = audit
    ? `<div class="section">
         <div class="section-title">📋 Package Manager Audit</div>
         <div class="audit-section">
           <div class="audit-header">
             ${audit.success ? '<span class="audit-success">✓ Completed</span>' : '<span class="audit-fail">✗ Failed</span>'}
             <span>${escapeHtml(audit.packageManager || 'unknown')}</span>
           </div>
           ${audit.success ? `<p>Vulnerabilities: ${audit.summary?.total || 0} (${audit.summary?.critical || 0} critical, ${audit.summary?.high || 0} high, ${audit.summary?.medium || 0} medium, ${audit.summary?.low || 0} low)</p>` : `<p>Error: ${escapeHtml(audit.error || 'unknown error')}</p>`}
         </div>
       </div>`
    : '';

  const liveAdvisories = result.liveAdvisories;
  const liveHtml = liveAdvisories
    ? `<div class="section">
         <div class="section-title">🌐 Live Advisory Query Results</div>
         <div class="stats-grid">
           <div class="stat-item">
             <div class="stat-value">${liveAdvisories.findings?.length || 0}</div>
             <div class="stat-label">Live Findings</div>
           </div>
           <div class="stat-item">
             <div class="stat-value">${(liveAdvisories.sources || []).join(', ') || 'none'}</div>
             <div class="stat-label">Sources Queried</div>
           </div>
           <div class="stat-item">
             <div class="stat-value">${stats.livePackagesQueried || 0}</div>
             <div class="stat-label">Packages Queried</div>
           </div>
         </div>
       </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Shai-Scanner Security Report - Generated ${escapeHtml(now)}">
  <title>Shai-Scanner Security Report</title>
  <style>${generateStyles()}</style>
</head>
<body>
  <div class="header">
    <h1>🛡️ Shai-Scanner Security Report</h1>
    <div class="subtitle">Supply Chain Security Assessment</div>
    <div class="timestamp">Generated: ${escapeHtml(now)}</div>
  </div>

  <div class="container">
    <!-- Executive Summary -->
    <div class="summary-grid">
      <div class="summary-card ${hasFindings ? 'status-vuln' : 'status-safe'}">
        <div class="value">${hasFindings ? '⚠️' : '✅'}</div>
        <div class="label">${hasFindings ? `${findings.length} Finding${findings.length !== 1 ? 's' : ''}` : 'All Clear'}</div>
      </div>
      <div class="summary-card">
        <div class="value">${stats.packagesScanned || 0}</div>
        <div class="label">Packages Scanned</div>
      </div>
      <div class="summary-card">
        <div class="value">${stats.lockfilePackagesScanned || 0}</div>
        <div class="label">Lockfile Packages</div>
      </div>
      <div class="summary-card">
        <div class="value">${result.scanTimeMs || 0}ms</div>
        <div class="label">Scan Duration</div>
      </div>
    </div>

    <!-- Severity Breakdown Charts -->
    <div class="section">
      <div class="section-title">📊 Severity Breakdown</div>
      <div class="charts-grid">
        <div class="chart-box">
          <h3>Severity Distribution</h3>
          ${createBarChart(severityBars, maxSeverity)}
        </div>
        <div class="chart-box">
          <h3>Findings Overview</h3>
          ${createDonutChart(critical, high, medium, low)}
        </div>
      </div>
    </div>

    ${
      typeEntries.length > 0
        ? `
    <!-- Finding Types -->
    <div class="section">
      <div class="section-title">📈 Finding Types</div>
      <div class="chart-box">
        ${createBarChart(typeBars, maxType)}
      </div>
    </div>`
        : ''
    }

    <!-- Detailed Findings -->
    <div class="section">
      <div class="section-title">🔍 Detailed Findings (${findings.length})</div>
      ${
        hasFindings
          ? `
      <input type="text" class="search-box" id="finding-search" placeholder="Search findings...">
      <div class="filter-buttons">
        <button class="filter-btn active" data-severity="all">All</button>
        <button class="filter-btn" data-severity="critical">🔴 Critical (${critical})</button>
        <button class="filter-btn" data-severity="high">🟠 High (${high})</button>
        <button class="filter-btn" data-severity="medium">🟡 Medium (${medium})</button>
        <button class="filter-btn" data-severity="low">🔵 Low (${low})</button>
      </div>`
          : ''
      }
      <div class="findings-list">
        ${
          findings.length > 0
            ? findings.map((f, i) => findingDetail(f, i)).join('')
            : `
        <div class="clear-message">
          <div class="clear-icon">✅</div>
          <p><strong>All Clear</strong></p>
          <p>No Shai-Hulud indicators or selected live advisory matches were found in the scanned paths.</p>
        </div>`
        }
      </div>
      ${warningsHtml}
    </div>

    <!-- Scan Statistics -->
    <div class="section">
      <div class="section-title">📈 Scan Statistics</div>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">${stats.packagesScanned || 0}</div>
          <div class="stat-label">Installed Packages</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.lockfilePackagesScanned || 0}</div>
          <div class="stat-label">Lockfile Packages</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.manifestsScanned || 0}</div>
          <div class="stat-label">Manifests Scanned</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.iocFilesScanned || 0}</div>
          <div class="stat-label">IOC Files Checked</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${result.scanTimeMs || 0}ms</div>
          <div class="stat-label">Total Scan Time</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${result.database?.versionCount || 0}</div>
          <div class="stat-label">Database IOCs</div>
        </div>
      </div>
      <div style="margin-top: 1rem; font-size: 0.875rem; color: var(--text-muted);">
        <strong>Database Sources:</strong> ${(result.database?.sources || []).join(', ') || 'embedded'}
      </div>
    </div>

    ${liveHtml}
    ${auditHtml}
  </div>

  <div class="footer">
    <p>Report generated by <strong>Shai-Scanner v4.6.5</strong></p>
    <p>Powered by Datadog Shai-Hulud IOC feeds, OSV.dev, and GitHub Advisory Database</p>
  </div>

  <script>${generateScripts()}</script>
</body>
</html>`;
}
