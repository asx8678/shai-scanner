/**
 * @module multi-scanner
 * @description Multi-project scanning for shai-scanner.
 * Allows scanning multiple projects from a single command, useful for
 * organizations with multiple repositories or projects.
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve, join, relative, isAbsolute } from 'node:path';
import { glob } from 'node:fs/promises';
import { Scanner } from './scanner.js';
import { colorize } from './utils.js';

/**
 * Parse a multi-scan file containing project paths (one per line).
 * Supports:
 *   - Relative and absolute paths
 *   - Glob patterns (e.g., ./projects/STAR/package.json where STAR is a wildcard)
 *   - Comments (# and //)
 *   - Blank lines
 *
 * @param {string} filePath - Path to the multi-scan file.
 * @returns {Promise<string[]>} Array of resolved project paths.
 */
export async function parseMultiScanFile(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`Multi-scan file not found: ${filePath}`);
  }

  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n').map((line) => line.trim());

  const rawPaths = [];
  const globPatterns = [];

  for (const line of lines) {
    // Skip empty lines and comments
    if (!line || line.startsWith('#') || line.startsWith('//')) continue;

    // Check if line contains glob characters
    if (line.includes('*') || line.includes('{') || line.includes('?')) {
      globPatterns.push(line);
    } else {
      rawPaths.push(line);
    }
  }

  // Resolve regular paths
  const resolvedPaths = rawPaths.map((p) => resolve(p));

  // Expand glob patterns
  const expandedGlobPaths = [];
  for (const pattern of globPatterns) {
    const expanded = await expandGlob(pattern);
    expandedGlobPaths.push(...expanded);
  }

  // Combine and deduplicate
  const allPaths = [...resolvedPaths, ...expandedGlobPaths];

  // Convert file paths to their parent directories (scanner expects directories)
  const finalPaths = [];
  for (const p of allPaths) {
    try {
      const stat = statSync(p);
      if (stat.isFile()) {
        // If it's a file, use its parent directory
        finalPaths.push(resolve(p, '..'));
      } else {
        finalPaths.push(p);
      }
    } catch {
      // If stat fails, keep the path as-is
      finalPaths.push(p);
    }
  }

  return [...new Set(finalPaths)];
}

/**
 * Expand a glob pattern into actual file/directory paths.
 *
 * @param {string} pattern - Glob pattern to expand.
 * @returns {Promise<string[]>} Array of matching paths.
 */
async function expandGlob(pattern) {
  try {
    const results = [];
    for await (const match of glob(pattern, { absolute: true })) {
      results.push(match);
    }
    return results;
  } catch (error) {
    // If glob fails, return empty array (don't fail entire scan)
    console.error(`Warning: Failed to expand glob pattern "${pattern}": ${error.message}`);
    return [];
  }
}

/**
 * Scan multiple projects and aggregate results.
 *
 * @param {string[]} projectPaths - Array of project paths to scan.
 * @param {import('./database.js').VulnerabilityDatabase} db - Database instance.
 * @param {object} options - Scan options.
 * @param {function} onProgress - Progress callback.
 * @returns {Promise<object>} Aggregated scan results.
 */
export async function scanMultipleProjects(projectPaths, db, options = {}, onProgress) {
  const {
    includeNodeModules = true,
    includeLockfiles = true,
    includeManifests = true,
    includeIocFiles = true,
    maxDepth = undefined,
    parallel = false,
    concurrency = 4,
  } = options;

  const scannerOptions = {
    maxSearchDepth: maxDepth,
    maxLockfileDepth: maxDepth,
    maxManifestDepth: maxDepth,
  };

  const scanner = new Scanner(db, scannerOptions);
  const results = [];
  const errors = [];

  // Helper function to scan a single project
  const scanProject = async (projectPath) => {
    const startTime = Date.now();
    try {
      onProgress?.({
        phase: 'project-start',
        path: projectPath,
        projectIndex: results.length,
        totalProjects: projectPaths.length,
      });

      const result = await scanner.scan(
        [projectPath],
        {
          includeNodeModules,
          includeLockfiles,
          includeManifests,
          includeIocFiles,
        },
        (progress) => {
          onProgress?.({
            phase: 'project-progress',
            path: projectPath,
            subProgress: progress,
          });
        },
      );

      const duration = Date.now() - startTime;
      results.push({
        path: projectPath,
        result,
        duration,
        success: true,
      });

      onProgress?.({
        phase: 'project-complete',
        path: projectPath,
        findings: result.findings.length,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      errors.push({
        path: projectPath,
        error: error.message,
        duration,
      });

      onProgress?.({
        phase: 'project-error',
        path: projectPath,
        error: error.message,
      });
    }
  };

  if (parallel && projectPaths.length > 1) {
    // Execute scans in parallel with concurrency limit
    await executeWithConcurrency(projectPaths, concurrency, scanProject);
  } else {
    // Execute scans sequentially
    for (const projectPath of projectPaths) {
      await scanProject(projectPath);
    }
  }

  // Aggregate results
  return aggregateResults(results, errors, projectPaths);
}

/**
 * Execute tasks with a concurrency limit.
 *
 * @param {T[]} items - Items to process.
 * @param {number} concurrency - Maximum concurrent tasks.
 * @param {(item: T) => Promise<void>} task - Task function.
 * @template T
 */
async function executeWithConcurrency(items, concurrency, task) {
  const queue = [...items];
  const running = new Set();

  const runNext = async () => {
    if (queue.length === 0) return;
    const item = queue.shift();
    const promise = task(item).finally(() => running.delete(promise));
    running.add(promise);
    if (running.size >= concurrency) {
      await Promise.race(running);
    }
    await runNext();
  };

  await runNext();
  await Promise.all(running);
}

/**
 * Aggregate results from multiple project scans.
 *
 * @param {object[]} successfulResults - Results from successful scans.
 * @param {object[]} errors - Errors from failed scans.
 * @param {string[]} allPaths - All original project paths.
 * @returns {object} Aggregated results.
 */
function aggregateResults(successfulResults, errors, allPaths) {
  const aggregated = {
    tool: { name: 'shai-scanner', version: '4.6.0', mode: 'multi-project' },
    scanType: 'multi-project',
    scannedPaths: allPaths,
    projects: [],
    findings: [],
    vulnerabilities: [],
    warnings: [],
    inventory: [],
    stats: {
      totalProjects: allPaths.length,
      successfulProjects: successfulResults.length,
      failedProjects: errors.length,
      totalFindings: 0,
      totalVulnerabilities: 0,
      totalPackagesScanned: 0,
      totalLockfilePackagesScanned: 0,
      totalManifestsScanned: 0,
      scanTimeMs: 0,
    },
    errors,
    scanTimeMs: 0,
  };

  const allFindings = [];
  const allVulnerabilities = [];
  const allInventory = [];
  const allWarnings = [];
  let totalTime = 0;

  for (const { path, result, duration, success } of successfulResults) {
    if (!success || !result) continue;

    aggregated.projects.push({
      path,
      findingsCount: result.findings.length,
      vulnerabilitiesCount: result.vulnerabilities.length,
      duration,
      stats: result.stats,
    });

    // Prefix finding paths with project path for context
    const findings = (result.findings || []).map((f) => ({
      ...f,
      projectPath: path,
      relativePath: f.path ? relative(path, f.path) : f.path,
    }));

    allFindings.push(...findings);
    allVulnerabilities.push(
      ...(result.vulnerabilities || []).map((v) => ({
        ...v,
        projectPath: path,
        relativePath: v.path ? relative(path, v.path) : v.path,
      })),
    );
    allInventory.push(...(result.inventory || []));
    allWarnings.push(...(result.warnings || []));

    // Aggregate stats
    if (result.stats) {
      aggregated.stats.totalPackagesScanned += result.stats.packagesScanned || 0;
      aggregated.stats.totalLockfilePackagesScanned += result.stats.lockfilePackagesScanned || 0;
      aggregated.stats.totalManifestsScanned += result.stats.manifestsScanned || 0;
    }

    totalTime += duration;
  }

  // Deduplicate findings across projects
  aggregated.findings = deduplicateFindings(allFindings);
  aggregated.vulnerabilities = deduplicateFindings(allVulnerabilities);
  aggregated.warnings = allWarnings;
  aggregated.inventory = aggregateInventory(allInventory);

  aggregated.stats.totalFindings = aggregated.findings.length;
  aggregated.stats.totalVulnerabilities = aggregated.vulnerabilities.length;
  aggregated.stats.scanTimeMs = totalTime;

  return aggregated;
}

/**
 * Deduplicate findings based on id.
 *
 * @param {object[]} findings - Array of findings.
 * @returns {object[]} Deduplicated findings.
 */
function deduplicateFindings(findings) {
  const seen = new Set();
  const unique = [];

  for (const finding of findings) {
    if (!seen.has(finding.id)) {
      seen.add(finding.id);
      unique.push(finding);
    }
  }

  return unique.sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
  });
}

/**
 * Aggregate inventory items, combining paths from different projects.
 *
 * @param {object[]} inventory - Array of inventory items.
 * @returns {object[]} Aggregated inventory.
 */
function aggregateInventory(inventory) {
  const map = new Map();

  for (const item of inventory) {
    const key = `${item.name}@${item.version}`;
    const existing = map.get(key) || {
      name: item.name,
      version: item.version,
      paths: [],
      sources: [],
    };

    if (item.path && !existing.paths.includes(item.path)) {
      existing.paths.push(item.path);
    }
    if (item.source && !existing.sources.includes(item.source)) {
      existing.sources.push(item.source);
    }

    map.set(key, existing);
  }

  return Array.from(map.values()).sort(
    (a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version),
  );
}

/**
 * Render a consolidated text report for multi-project scanning.
 *
 * @param {object} aggregatedResult - Aggregated scan results.
 * @param {object} options - Rendering options.
 * @returns {string} Text report.
 */
export function renderMultiProjectTextReport(aggregatedResult, options = {}) {
  const { color: colorOption = true } = options;
  const colors = colorize(colorOption !== false);
  const lines = [];

  lines.push(colors.bold('Shai-Scanner Multi-Project Scan Results'));
  lines.push(`Scanned ${aggregatedResult.stats.totalProjects} project(s)`);
  lines.push(`Successfully scanned: ${aggregatedResult.stats.successfulProjects}`);
  if (aggregatedResult.stats.failedProjects > 0) {
    lines.push(colors.yellow(`Failed: ${aggregatedResult.stats.failedProjects}`));
  }
  lines.push('');

  // Summary statistics
  lines.push(colors.bold('Summary'));
  lines.push(`Total findings: ${aggregatedResult.stats.totalFindings}`);
  lines.push(`Total vulnerabilities: ${aggregatedResult.stats.totalVulnerabilities}`);
  lines.push(`Packages scanned: ${aggregatedResult.stats.totalPackagesScanned}`);
  lines.push(`Lockfile packages scanned: ${aggregatedResult.stats.totalLockfilePackagesScanned}`);
  lines.push(`Manifests scanned: ${aggregatedResult.stats.totalManifestsScanned}`);
  lines.push(`Scan time: ${aggregatedResult.stats.scanTimeMs}ms`);
  lines.push('');

  // Per-project breakdown
  if (aggregatedResult.projects.length > 0) {
    lines.push(colors.bold('Per-Project Breakdown'));
    lines.push('-'.repeat(60));

    for (const project of aggregatedResult.projects) {
      const relPath = relative(process.cwd(), project.path) || project.path;
      const hasFindings = project.findingsCount > 0;
      const status = hasFindings ? colors.red('⚠️') : colors.green('✓');

      lines.push(`${status} ${relPath}`);
      lines.push(
        `   Findings: ${project.findingsCount}, Vulnerabilities: ${project.vulnerabilitiesCount}`,
      );
      lines.push(`   Duration: ${project.duration}ms`);
      if (project.stats) {
        lines.push(
          `   Packages: ${project.stats.packagesScanned || 0}, Lockfiles: ${project.stats.lockfilePackagesScanned || 0}`,
        );
      }
      lines.push('');
    }
  }

  // Errors
  if (aggregatedResult.errors.length > 0) {
    lines.push(colors.yellow('Errors'));
    for (const error of aggregatedResult.errors) {
      const relPath = relative(process.cwd(), error.path) || error.path;
      lines.push(`  ✗ ${relPath}: ${error.error}`);
    }
    lines.push('');
  }

  // Findings
  if (aggregatedResult.findings.length > 0) {
    lines.push(colors.red(`Found ${aggregatedResult.findings.length} security finding(s)`));
    lines.push('');

    aggregatedResult.findings.forEach((finding, index) => {
      const paint = severityColor(colors, finding.severity);
      const relPath = finding.projectPath ? relative(process.cwd(), finding.projectPath) : '';
      const relFinding = finding.relativePath || finding.path;

      lines.push(
        `${String(index + 1).padStart(2, ' ')}. ${paint(finding.severity.toUpperCase())} ${colors.bold(finding.type)} ${finding.packageName ? `${finding.packageName}@${finding.packageVersion || ''}` : ''}`,
      );
      if (relPath) lines.push(`    Project: ${sanitize(relPath)}`);
      if (finding.attack) lines.push(`    Attack: ${sanitize(finding.attack)}`);
      if (finding.description) lines.push(`    Detail: ${sanitize(finding.description, 280)}`);
      if (relFinding) lines.push(`    Path: ${sanitize(relFinding)}`);
      lines.push('');
    });
  } else {
    lines.push(colors.green('ALL CLEAR — no security findings across all scanned projects.'));
  }

  return lines.join('\n');
}

/**
 * Render a consolidated JSON report for multi-project scanning.
 *
 * @param {object} aggregatedResult - Aggregated scan results.
 * @returns {string} JSON report string.
 */
export function renderMultiProjectJsonReport(aggregatedResult) {
  return JSON.stringify(aggregatedResult, null, 2);
}

/**
 * Render a consolidated SARIF report for multi-project scanning.
 *
 * @param {object} aggregatedResult - Aggregated scan results.
 * @returns {string} SARIF report string.
 */
export function renderMultiProjectSarifReport(aggregatedResult) {
  const rules = new Map();
  const results = [];

  for (const finding of aggregatedResult.findings || []) {
    const ruleId = `shai-scanner/${finding.type}/${finding.source || finding.severity}`;
    if (!rules.has(ruleId)) {
      rules.set(ruleId, {
        id: ruleId,
        shortDescription: { text: finding.type },
        fullDescription: { text: finding.description || finding.type },
        defaultConfiguration: { level: sarifLevel(finding.severity) },
      });
    }
    results.push({
      ruleId,
      level: sarifLevel(finding.severity),
      message: {
        text: [
          finding.packageName && `${finding.packageName}@${finding.packageVersion || ''}`,
          finding.description,
          finding.evidence,
        ]
          .filter(Boolean)
          .join(' — '),
      },
      locations: finding.path
        ? [{ physicalLocation: { artifactLocation: { uri: finding.path } } }]
        : [],
      // Add project context
      properties: {
        projectPath: finding.projectPath,
        relativePath: finding.relativePath,
      },
    });
  }

  return JSON.stringify(
    {
      version: '2.1.0',
      $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
      runs: [
        {
          tool: {
            driver: {
              name: 'shai-scanner',
              version: '4.6.0',
              rules: Array.from(rules.values()),
              properties: {
                scanMode: 'multi-project',
                totalProjects: aggregatedResult.stats.totalProjects,
                successfulProjects: aggregatedResult.stats.successfulProjects,
              },
            },
          },
          results,
        },
      ],
    },
    null,
    2,
  );
}

/**
 * Render a consolidated HTML report for multi-project scanning.
 *
 * @param {object} aggregatedResult - Aggregated scan results.
 * @returns {string} HTML report string.
 */
export function renderMultiProjectHtmlReport(aggregatedResult) {
  const critical = aggregatedResult.findings.filter((f) => f.severity === 'critical').length;
  const high = aggregatedResult.findings.filter((f) => f.severity === 'high').length;
  const medium = aggregatedResult.findings.filter((f) => f.severity === 'medium').length;
  const low = aggregatedResult.findings.filter((f) => f.severity === 'low').length;

  const projectRows = aggregatedResult.projects
    .map((p) => {
      const relPath = p.path.replace(process.cwd(), '.').replace(/^\//, '');
      const hasFindings = p.findingsCount > 0;
      return `<tr>
      <td>${escapeHtml(relPath)}</td>
      <td class="${hasFindings ? 'text-danger' : 'text-success'}">${p.findingsCount}</td>
      <td>${p.vulnerabilitiesCount}</td>
      <td>${p.duration}ms</td>
    </tr>`;
    })
    .join('\n');

  const findingRows = aggregatedResult.findings
    .map((f, i) => {
      const relProject = f.projectPath
        ? f.projectPath.replace(process.cwd(), '.').replace(/^\//, '')
        : '';
      return `<tr>
      <td>${i + 1}</td>
      <td class="severity-${f.severity}">${f.severity.toUpperCase()}</td>
      <td>${escapeHtml(f.type)}</td>
      <td>${escapeHtml(f.packageName ? `${f.packageName}@${f.packageVersion || ''}` : '')}</td>
      <td>${escapeHtml(relProject)}</td>
      <td>${escapeHtml(f.description || '')}</td>
    </tr>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shai-Scanner Multi-Project Security Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 30px; }
    h1 { color: #2c3e50; margin-bottom: 10px; }
    h2 { color: #34495e; margin: 20px 0 10px; border-bottom: 2px solid #eee; padding-bottom: 5px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
    .stat-card { background: #f8f9fa; border-radius: 8px; padding: 20px; text-align: center; }
    .stat-value { font-size: 2em; font-weight: bold; color: #2c3e50; }
    .stat-label { color: #666; font-size: 0.9em; }
    .severity-critical { color: #e74c3c; font-weight: bold; }
    .severity-high { color: #e67e22; font-weight: bold; }
    .severity-medium { color: #f39c12; }
    .severity-low { color: #3498db; }
    .text-danger { color: #e74c3c; }
    .text-success { color: #27ae60; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f8f9fa; font-weight: 600; }
    tr:hover { background: #f8f9fa; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 0.9em; }
    .clear { color: #27ae60; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Shai-Scanner Multi-Project Security Report</h1>
    <p>Generated: ${new Date().toISOString()}</p>
    
    <div class="summary">
      <div class="stat-card">
        <div class="stat-value">${aggregatedResult.stats.totalProjects}</div>
        <div class="stat-label">Projects Scanned</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${aggregatedResult.stats.totalFindings}</div>
        <div class="stat-label">Total Findings</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${aggregatedResult.stats.totalVulnerabilities}</div>
        <div class="stat-label">Vulnerabilities</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${aggregatedResult.stats.scanTimeMs}ms</div>
        <div class="stat-label">Scan Time</div>
      </div>
    </div>

    <h2>Severity Distribution</h2>
    <div class="summary">
      <div class="stat-card"><div class="stat-value severity-critical">${critical}</div><div class="stat-label">Critical</div></div>
      <div class="stat-card"><div class="stat-value severity-high">${high}</div><div class="stat-label">High</div></div>
      <div class="stat-card"><div class="stat-value severity-medium">${medium}</div><div class="stat-label">Medium</div></div>
      <div class="stat-card"><div class="stat-value severity-low">${low}</div><div class="stat-label">Low</div></div>
    </div>

    <h2>Per-Project Breakdown</h2>
    <table>
      <thead><tr><th>Project</th><th>Findings</th><th>Vulnerabilities</th><th>Duration</th></tr></thead>
      <tbody>${projectRows}</tbody>
    </table>

    ${
      aggregatedResult.findings.length > 0
        ? `
    <h2>Findings</h2>
    <table>
      <thead><tr><th>#</th><th>Severity</th><th>Type</th><th>Package</th><th>Project</th><th>Description</th></tr></thead>
      <tbody>${findingRows}</tbody>
    </table>
    `
        : '<p class="clear">ALL CLEAR — no security findings across all scanned projects.</p>'
    }

    <div class="footer">
      <p>Shai-Scanner ${aggregatedResult.tool?.version || '4.6.0'} | Multi-Project Report</p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function severityColor(colors, severity) {
  if (severity === 'critical') return colors.red;
  if (severity === 'high') return colors.yellow;
  if (severity === 'medium') return colors.magenta;
  if (severity === 'low') return colors.blue;
  return (x) => x;
}

function sarifLevel(severity) {
  if (severity === 'critical' || severity === 'high') return 'error';
  if (severity === 'medium') return 'warning';
  return 'note';
}

function sanitize(input, maxLength = 1000) {
  const value = String(input ?? '');
  const cleaned = value
    .replace(/[\u001B\u009B][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim();
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength - 1)}…` : cleaned;
}
