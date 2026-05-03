#!/usr/bin/env node

/**
 * Repository Health Dashboard for shai-scanner
 * Shows GitHub repository health metrics
 */

import { parseArgs } from 'node:util';
import { execSync } from 'node:child_process';

const REPO_OWNER = 'asx8678';
const REPO_NAME = 'shai-scanner';
const GITHUB_REPO = `${REPO_OWNER}/${REPO_NAME}`;

const args = parseArgs({
  options: {
    json: {
      type: 'boolean',
      default: false,
    },
    help: {
      type: 'boolean',
      short: 'h',
      default: false,
    },
  },
  strict: false,
});

const { values } = args;

if (values.help) {
  console.log(`
🏥 Repository Health Dashboard for ${GITHUB_REPO}

Usage: node scripts/repo-health.js [options]

Options:
  --json    Output machine-readable JSON
  --help    Show this help message

Examples:
  node scripts/repo-health.js
  node scripts/repo-health.js --json
`);
  process.exit(0);
}

/**
 * Check if gh CLI is available
 */
function isGhAvailable() {
  try {
    execSync('gh --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetch repo data using gh CLI
 */
function fetchWithGh() {
  try {
    const output = execSync(`gh repo view ${GITHUB_REPO} --json name,description,url,stargazerCount,forkCount,watchers,issues,licenseInfo,pushedAt,isArchived,isFork,diskUsage,defaultBranchRef`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return JSON.parse(output);
  } catch (error) {
    return { error: 'gh_failed', message: error.message };
  }
}

/**
 * Fetch JSON from URL with error handling
 */
async function fetchJson(url) {
  try {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
    };

    // Use GITHUB_TOKEN if available for higher rate limits
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      if (response.status === 404) {
        return { error: 'not_found', message: `Repository "${GITHUB_REPO}" not found` };
      }
      if (response.status === 403) {
        return { error: 'rate_limited', message: 'GitHub API rate limit exceeded. Set GITHUB_TOKEN for higher limits.' };
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error.cause?.code === 'ENOTFOUND') {
      return { error: 'network', message: 'Network error - check your internet connection' };
    }
    return { error: 'fetch_failed', message: error.message };
  }
}

/**
 * Format date to human readable
 */
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get health score based on metrics
 */
function calculateHealthScore(data) {
  let score = 50; // Base score

  // Stars contribute up to 20 points
  const stars = data.stargazerCount || 0;
  score += Math.min(20, Math.floor(stars / 10));

  // Forks contribute up to 10 points
  const forks = data.forkCount || 0;
  score += Math.min(10, forks);

  // Open issues penalty (more open issues = lower score)
  const openIssues = data.issues?.totalCount || 0;
  if (openIssues > 50) score -= 10;
  else if (openIssues > 20) score -= 5;

  // Has description bonus
  if (data.description && data.description.length > 10) score += 5;

  // Has license bonus
  if (data.licenseInfo?.name) score += 5;

  // Recent activity bonus
  if (data.pushedAt) {
    const daysSinceUpdate = Math.floor((Date.now() - new Date(data.pushedAt)) / (1000 * 60 * 60 * 24));
    if (daysSinceUpdate < 7) score += 10;
    else if (daysSinceUpdate < 30) score += 5;
    else if (daysSinceUpdate > 365) score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Get health rating from score
 */
function getHealthRating(score) {
  if (score >= 80) return { rating: '🟢 Excellent', emoji: '🟢' };
  if (score >= 60) return { rating: '🟡 Good', emoji: '🟡' };
  if (score >= 40) return { rating: '🟠 Fair', emoji: '🟠' };
  return { rating: '🔴 Needs Attention', emoji: '🔴' };
}

/**
 * Main function
 */
async function main() {
  const now = new Date();
  let repoData;
  let usingGh = false;

  // Try gh CLI first, fallback to API
  if (isGhAvailable()) {
    const ghResult = fetchWithGh();
    if (!ghResult.error) {
      repoData = {
        name: ghResult.name,
        description: ghResult.description,
        full_name: GITHUB_REPO,
        html_url: ghResult.url || `https://github.com/${GITHUB_REPO}`,
        stargazers_count: ghResult.stargazerCount || 0,
        forks_count: ghResult.forkCount || 0,
        watchers_count: ghResult.watchers?.totalCount || 0,
        open_issues_count: ghResult.issues?.totalCount || 0,
        pushed_at: ghResult.pushedAt,
        license: ghResult.licenseInfo ? { name: ghResult.licenseInfo.name, spdx_id: ghResult.licenseInfo.spdxId } : null,
        archived: ghResult.isArchived || false,
        fork: ghResult.isFork || false,
        size: ghResult.diskUsage || 0,
        default_branch: ghResult.defaultBranchRef?.name || 'main',
      };
      usingGh = true;
    }
  }

  // Fallback to API if gh failed
  if (!repoData) {
    repoData = await fetchJson(`https://api.github.com/repos/${GITHUB_REPO}`);
  }

  // Handle errors
  if (repoData.error) {
    if (values.json) {
      console.log(JSON.stringify({
        success: false,
        error: repoData.error,
        message: repoData.message,
        timestamp: now.toISOString(),
      }, null, 2));
    } else {
      console.error(`❌ Error: ${repoData.message}`);
    }
    process.exit(1);
  }

  // Calculate health metrics
  const healthScore = calculateHealthScore(repoData);
  const healthRating = getHealthRating(healthScore);

  // Build result object
  const result = {
    success: true,
    repository: GITHUB_REPO,
    timestamp: now.toISOString(),
    data_source: usingGh ? 'gh CLI' : 'GitHub API',
    metrics: {
      name: repoData.name,
      description: repoData.description,
      url: repoData.html_url,
      stars: repoData.stargazers_count || 0,
      forks: repoData.forks_count || 0,
      watchers: repoData.watchers_count || 0,
      openIssues: repoData.open_issues_count || 0,
      lastCommit: repoData.pushed_at,
      license: repoData.license?.name || 'Not specified',
      isArchived: repoData.archived || false,
      isFork: repoData.fork || false,
      size: repoData.size || 0,
      defaultBranch: repoData.default_branch || 'main',
    },
    health: {
      score: healthScore,
      rating: healthRating.rating,
    },
  };

  if (values.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('');
    console.log('🏥 Repository Health Dashboard');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log(`📦 Repository: ${GITHUB_REPO}`);
    console.log(`🔗 URL: ${repoData.html_url}`);
    console.log(`🕐 Report Time: ${now.toLocaleString()}`);
    console.log(`📡 Data Source: ${usingGh ? 'gh CLI' : 'GitHub API'}`);
    console.log('');
    console.log('───────────────────────────────────────────────────────────');
    console.log('📊 Repository Statistics');
    console.log('───────────────────────────────────────────────────────────');
    console.log('');
    console.log(`  ⭐ Stars:       ${repoData.stargazers_count?.toLocaleString() || 0}`);
    console.log(`  🍴 Forks:       ${repoData.forks_count?.toLocaleString() || 0}`);
    console.log(`  👁️  Watchers:    ${repoData.watchers_count?.toLocaleString() || 0}`);
    console.log(`  🐛 Open Issues: ${repoData.open_issues_count?.toLocaleString() || 0}`);
    console.log(`  💾 Size:        ${formatBytes((repoData.size || 0) * 1024)}`);
    console.log(`  🌿 Branch:      ${repoData.default_branch || 'main'}`);
    console.log('');
    console.log('───────────────────────────────────────────────────────────');
    console.log('📝 Repository Details');
    console.log('───────────────────────────────────────────────────────────');
    console.log('');
    console.log(`  📄 Description: ${repoData.description || 'No description provided'}`);
    console.log(`  ⚖️  License:     ${repoData.license?.name || 'Not specified'}`);
    console.log(`  📅 Last Commit: ${formatDate(repoData.pushed_at)}`);
    console.log(`  🔒 Archived:    ${repoData.archived ? 'Yes' : 'No'}`);
    console.log(`  🍴 Is Fork:     ${repoData.fork ? 'Yes' : 'No'}`);
    console.log('');
    console.log('───────────────────────────────────────────────────────────');
    console.log('🏆 Health Assessment');
    console.log('───────────────────────────────────────────────────────────');
    console.log('');
    console.log(`  Score:  ${healthScore}/100`);
    console.log(`  Rating: ${healthRating.rating}`);
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
  }
}

main().catch(error => {
  if (values.json) {
    console.log(JSON.stringify({
      success: false,
      error: 'unexpected',
      message: error.message,
    }, null, 2));
  } else {
    console.error('❌ Unexpected error:', error.message);
  }
  process.exit(1);
});
