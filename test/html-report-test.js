import assert from 'node:assert/strict';
import { renderHtmlReport } from '../src/html-reporter.js';

// Test 1: Empty findings report
console.log('Test 1: Empty findings report');
const emptyResult = {
  findings: [],
  vulnerabilities: [],
  warnings: [],
  stats: {
    packagesScanned: 100,
    lockfilePackagesScanned: 50,
    manifestsScanned: 10,
    iocFilesScanned: 5
  },
  scanTimeMs: 1234,
  database: {
    versionCount: 12345,
    sources: ['datadog-shai-hulud', 'datadog-mini-shai-hulud']
  }
};

const emptyHtml = renderHtmlReport(emptyResult);
assert.ok(emptyHtml.includes('All Clear'), 'Should contain All Clear message');
assert.ok(emptyHtml.includes('100'), 'Should contain packages scanned count');
assert.ok(emptyHtml.includes('12345'), 'Should contain database IOC count');
assert.ok(emptyHtml.includes('datadog-shai-hulud'), 'Should contain database sources');
console.log('✓ Empty findings report test passed');

// Test 2: Report with findings
console.log('Test 2: Report with findings');
const resultWithFindings = {
  findings: [
    {
      id: 'test-finding-1',
      type: 'package-ioc',
      severity: 'critical',
      path: '/path/to/node_modules/malicious/package.json',
      packageName: 'malicious-package',
      packageVersion: '1.0.0',
      attack: 'Remote code execution',
      description: 'This package contains malware that executes arbitrary code',
      evidence: 'base64encodedpayload==',
      url: 'https://github.com/advisories/GHSA-1234-5678',
      remediation: 'Remove this package immediately',
      source: 'datadog-shai-hulud'
    },
    {
      id: 'test-finding-2',
      type: 'lockfile-ioc',
      severity: 'high',
      path: '/path/to/package-lock.json',
      packageName: 'suspicious-dep',
      packageVersion: '2.0.0',
      attack: 'Credential theft',
      description: 'Steals environment variables and API keys'
    },
    {
      id: 'test-finding-3',
      type: 'live-osv-advisory',
      severity: 'medium',
      packageName: 'vulnerable-lib',
      packageVersion: '3.0.0',
      attack: 'Cross-site scripting',
      description: 'XSS vulnerability in version 3.0.0'
    },
    {
      id: 'test-finding-4',
      type: 'manifest-ioc',
      severity: 'low',
      path: '/path/to/package.json',
      packageName: 'outdated-pkg',
      packageVersion: '1.2.3',
      attack: 'Known vulnerability',
      description: 'Outdated version with known security issues'
    }
  ],
  vulnerabilities: [],
  warnings: [
    { path: 'live-advisories', message: 'Timeout querying OSV.dev' },
    { path: 'scan', message: 'Could not read some files due to permissions' }
  ],
  stats: {
    packagesScanned: 250,
    lockfilePackagesScanned: 75,
    manifestsScanned: 15,
    iocFilesScanned: 8,
    livePackagesQueried: 100,
    liveFindings: 1,
    liveSources: ['osv', 'github']
  },
  scanTimeMs: 5678,
  scanTime: 5.678,
  database: {
    versionCount: 98765,
    sources: ['datadog-shai-hulud']
  },
  liveAdvisories: {
    findings: [],
    sources: ['osv', 'github']
  }
};

const findingsHtml = renderHtmlReport(resultWithFindings);
assert.ok(findingsHtml.includes('malicious-package'), 'Should contain malicious package name');
assert.ok(findingsHtml.includes('Critical'), 'Should contain Critical severity');
assert.ok(findingsHtml.includes('Remote code execution'), 'Should contain attack description');
assert.ok(findingsHtml.includes('All Clear') === false, 'Should NOT contain All Clear message');
assert.ok(findingsHtml.includes('Warnings'), 'Should contain warnings section');
assert.ok(findingsHtml.includes('Timeout querying OSV.dev'), 'Should contain warning message');
assert.ok(findingsHtml.includes('OSV.dev'), 'Should contain OSV.dev in warnings');
assert.ok(findingsHtml.includes('Live Advisory'), 'Should contain live advisory section');
assert.ok(findingsHtml.includes('100'), 'Should contain live packages queried');
console.log('✓ Report with findings test passed');

// Test 3: HTML structure validation
console.log('Test 3: HTML structure validation');
const htmlStructure = renderHtmlReport(emptyResult);
assert.ok(htmlStructure.includes('<!DOCTYPE html>'), 'Should have DOCTYPE');
assert.ok(htmlStructure.includes('<html lang="en">'), 'Should have html tag');
assert.ok(htmlStructure.includes('<head>'), 'Should have head tag');
assert.ok(htmlStructure.includes('<body>'), 'Should have body tag');
assert.ok(htmlStructure.includes('<meta charset="UTF-8">'), 'Should have charset meta');
assert.ok(htmlStructure.includes('<title>Shai-Scanner Security Report</title>'), 'Should have title');
assert.ok(htmlStructure.includes('<style>'), 'Should have inline styles');
assert.ok(htmlStructure.includes('<script>'), 'Should have inline scripts');
console.log('✓ HTML structure validation test passed');

// Test 4: CSS contains key styles
console.log('Test 4: CSS contains key styles');
const cssStyles = renderHtmlReport(emptyResult);
assert.ok(cssStyles.includes('--primary:'), 'Should have CSS variables');
assert.ok(cssStyles.includes('@media print'), 'Should have print styles');
assert.ok(cssStyles.includes('@media (max-width'), 'Should have responsive styles');
console.log('✓ CSS contains key styles test passed');

// Test 5: Interactive JavaScript
console.log('Test 5: Interactive JavaScript');
const jsContent = renderHtmlReport(emptyResult);
assert.ok(jsContent.includes('finding-search'), 'Should have search functionality');
assert.ok(jsContent.includes('filter-btn'), 'Should have filter buttons');
assert.ok(jsContent.includes('click'), 'Should have click handlers');
console.log('✓ Interactive JavaScript test passed');

// Test 6: Severity badges
console.log('Test 6: Severity badges');
const badgeHtml = renderHtmlReport(resultWithFindings);
assert.ok(badgeHtml.includes('🔴 Critical'), 'Should have critical badge');
assert.ok(badgeHtml.includes('🟠 High'), 'Should have high badge');
assert.ok(badgeHtml.includes('🟡 Medium'), 'Should have medium badge');
assert.ok(badgeHtml.includes('🔵 Low'), 'Should have low badge');
console.log('✓ Severity badges test passed');

// Test 7: Charts
console.log('Test 7: Charts');
const chartHtml = renderHtmlReport(resultWithFindings);
assert.ok(chartHtml.includes('chart-bar'), 'Should have chart bars');
assert.ok(chartHtml.includes('Severity Breakdown'), 'Should have severity breakdown');
assert.ok(chartHtml.includes('Finding Types'), 'Should have finding types');
console.log('✓ Charts test passed');

// Test 8: Expandable sections
console.log('Test 8: Expandable sections');
const expandHtml = renderHtmlReport(resultWithFindings);
assert.ok(expandHtml.includes('finding-header'), 'Should have finding headers');
assert.ok(expandHtml.includes('finding-details'), 'Should have finding details');
assert.ok(expandHtml.includes('expanded'), 'Should have expanded class');
console.log('✓ Expandable sections test passed');

// Test 9: Options parameter
console.log('Test 9: Options parameter');
const auditResult = {
  success: true,
  packageManager: 'npm',
  summary: { total: 5, critical: 1, high: 2, medium: 1, low: 1 }
};

const optionsHtml = renderHtmlReport(emptyResult, { auditResult });
assert.ok(optionsHtml.includes('Package Manager Audit'), 'Should have audit section');
assert.ok(optionsHtml.includes('npm'), 'Should contain package manager');
assert.ok(optionsHtml.includes('Completed'), 'Should show audit completed');
console.log('✓ Options parameter test passed');

// Test 10: XSS prevention
console.log('Test 10: XSS prevention');
const xssResult = {
  findings: [{
    id: 'xss-test',
    type: 'package-ioc',
    severity: 'critical',
    packageName: '<script>alert("xss")</script>',
    packageVersion: '1.0.0',
    attack: 'XSS attack with <img src=x onerror=alert(1)>',
    description: 'Description with "quotes" and \'apostrophes\'',
    evidence: 'Evidence with special chars: & < > " \''
  }],
  vulnerabilities: [],
  warnings: [],
  stats: {},
  scanTimeMs: 100,
  database: {}
};

const xssHtml = renderHtmlReport(xssResult);
assert.ok(!xssHtml.includes('<script>alert("xss")</script>'), 'Should escape script tags');
assert.ok(xssHtml.includes('&lt;script&gt;'), 'Should have escaped script tags');
assert.ok(!xssHtml.includes('<img src=x'), 'Should escape img tags (angle brackets escaped)');
assert.ok(xssHtml.includes('&lt;img'), 'Should escape img tags');
console.log('✓ XSS prevention test passed');

// Test 11: Responsive design
console.log('Test 11: Responsive design');
const responsiveHtml = renderHtmlReport(emptyResult);
assert.ok(responsiveHtml.includes('meta name="viewport"'), 'Should have viewport meta');
assert.ok(responsiveHtml.includes('max-width'), 'Should have responsive styles');
console.log('✓ Responsive design test passed');

// Test 12: Print-friendly layout
console.log('Test 12: Print-friendly layout');
const printHtml = renderHtmlReport(emptyResult);
assert.ok(printHtml.includes('@media print'), 'Should have print media queries');
assert.ok(printHtml.includes('print-color-adjust'), 'Should have print color adjust');
console.log('✓ Print-friendly layout test passed');

console.log('\n✅ All tests passed!');
