#!/usr/bin/env node

/**
 * npm Download Analytics for shai-scanner
 * Fetches and displays npm download statistics
 */

import { parseArgs } from 'node:util';

const PACKAGE_NAME = 'shai-scanner';

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
📊 npm Download Analytics for ${PACKAGE_NAME}

Usage: node scripts/monitor-npm.js [options]

Options:
  --json    Output machine-readable JSON
  --help    Show this help message

Examples:
  node scripts/monitor-npm.js
  node scripts/monitor-npm.js --json
`);
  process.exit(0);
}

/**
 * Fetch JSON from URL with error handling
 */
async function fetchJson(url) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        return { error: 'not_found', message: `Package "${PACKAGE_NAME}" not found on npm` };
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
 * Calculate trend from daily downloads array
 */
function calculateTrend(dailyDownloads) {
  if (!dailyDownloads || dailyDownloads.length < 14) {
    return 'insufficient_data';
  }

  const mid = Math.floor(dailyDownloads.length / 2);
  const firstHalf = dailyDownloads.slice(0, mid);
  const secondHalf = dailyDownloads.slice(mid);

  const avgFirst = firstHalf.reduce((sum, d) => sum + d.downloads, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((sum, d) => sum + d.downloads, 0) / secondHalf.length;

  const changePercent = ((avgSecond - avgFirst) / avgFirst) * 100;

  if (changePercent > 10) return 'increasing';
  if (changePercent < -10) return 'decreasing';
  return 'stable';
}

/**
 * Format numbers with commas
 */
function formatNumber(num) {
  return num.toLocaleString('en-US');
}

/**
 * Get trend emoji
 */
function getTrendEmoji(trend) {
  switch (trend) {
    case 'increasing': return '📈';
    case 'decreasing': return '📉';
    case 'stable': return '➡️';
    default: return '❓';
  }
}

/**
 * Main function
 */
async function main() {
  const now = new Date();

  // Fetch all data in parallel
  const [weeklyData, monthlyData, rangeData] = await Promise.all([
    fetchJson(`https://api.npmjs.org/downloads/point/last-week/${PACKAGE_NAME}`),
    fetchJson(`https://api.npmjs.org/downloads/point/last-month/${PACKAGE_NAME}`),
    fetchJson(`https://api.npmjs.org/downloads/range/last-month/${PACKAGE_NAME}`),
  ]);

  // Check for errors
  const errors = [weeklyData, monthlyData, rangeData].filter(d => d.error);
  if (errors.length > 0) {
    const firstError = errors[0];
    if (values.json) {
      console.log(JSON.stringify({
        success: false,
        error: firstError.error,
        message: firstError.message,
        timestamp: now.toISOString(),
      }, null, 2));
    } else {
      console.error(`❌ Error: ${firstError.message}`);
    }
    process.exit(1);
  }

  // Calculate metrics
  const weeklyDownloads = weeklyData.downloads || 0;
  const monthlyDownloads = monthlyData.downloads || 0;
  const dailyDownloads = rangeData.downloads || [];

  const daysWithDownloads = dailyDownloads.filter(d => d.downloads > 0).length;
  const dailyAverage = daysWithDownloads > 0 ? Math.round(monthlyDownloads / daysWithDownloads) : 0;
  const trend = calculateTrend(dailyDownloads);

  // Build result object
  const result = {
    success: true,
    package: PACKAGE_NAME,
    timestamp: now.toISOString(),
    metrics: {
      weeklyDownloads,
      monthlyDownloads,
      dailyAverage,
      trend,
      daysWithDownloads,
    },
  };

  if (values.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('');
    console.log('📊 npm Download Analytics');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log(`📦 Package: ${PACKAGE_NAME}`);
    console.log(`🕐 Report Time: ${now.toLocaleString()}`);
    console.log('');
    console.log('───────────────────────────────────────────────────────────');
    console.log('📥 Download Statistics');
    console.log('───────────────────────────────────────────────────────────');
    console.log('');
    console.log(`  📅 Last Week:    ${formatNumber(weeklyDownloads)} downloads`);
    console.log(`  📆 Last Month:   ${formatNumber(monthlyDownloads)} downloads`);
    console.log(`  📈 Daily Avg:    ${formatNumber(dailyAverage)} downloads/day`);
    console.log(`  ${getTrendEmoji(trend)} Trend:        ${trend.charAt(0).toUpperCase() + trend.slice(1)}`);
    console.log('');
    console.log('───────────────────────────────────────────────────────────');
    console.log('');

    // Mini sparkline of recent downloads
    if (dailyDownloads.length > 0) {
      const maxDownloads = Math.max(...dailyDownloads.map(d => d.downloads));
      const sparkline = dailyDownloads.slice(-7).map(d => {
        const height = maxDownloads > 0 ? Math.ceil((d.downloads / maxDownloads) * 5) : 0;
        return '█'.repeat(Math.max(1, height));
      }).join(' ');

      console.log('  Last 7 days:');
      console.log(`  ${sparkline}`);
      console.log('');
    }

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
