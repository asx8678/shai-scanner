import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { VulnerabilityDatabase, Scanner } from '../src/index.js';
import { parseMultiScanFile, scanMultipleProjects, renderMultiProjectTextReport, renderMultiProjectJsonReport, renderMultiProjectSarifReport } from '../src/multi-scanner.js';

const root = mkdtempSync(join(tmpdir(), 'shai-scanner-multi-scan-test-'));
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failed++;
    console.log(`  ✗ ${name}`);
    console.log(`    ${error.message}`);
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failed++;
    console.log(`  ✗ ${name}`);
    console.log(`    ${error.message}`);
  }
}

// Set up test fixtures
try {
  // Project 1: Has a known compromised package
  mkdirSync(join(root, 'project1'), { recursive: true });
  writeFileSync(join(root, 'project1', 'package.json'), JSON.stringify({
    name: 'project1',
    version: '1.0.0',
    dependencies: {
      '@asyncapi/parser': '^3.4.0'
    }
  }, null, 2));

  writeFileSync(join(root, 'project1', 'package-lock.json'), JSON.stringify({
    lockfileVersion: 3,
    packages: {
      '': { name: 'project1', version: '1.0.0' },
      'node_modules/@asyncapi/parser': { name: '@asyncapi/parser', version: '3.4.1' }
    }
  }, null, 2));

  // Project 2: Clean project
  mkdirSync(join(root, 'project2'), { recursive: true });
  writeFileSync(join(root, 'project2', 'package.json'), JSON.stringify({
    name: 'project2',
    version: '2.0.0',
    dependencies: {
      'express': '^4.18.0'
    }
  }, null, 2));

  writeFileSync(join(root, 'project2', 'package-lock.json'), JSON.stringify({
    lockfileVersion: 3,
    packages: {
      '': { name: 'project2', version: '2.0.0' },
      'node_modules/express': { name: 'express', version: '4.18.0' }
    }
  }, null, 2));

  // Project 3: Empty project
  mkdirSync(join(root, 'project3'), { recursive: true });
  writeFileSync(join(root, 'project3', 'package.json'), JSON.stringify({
    name: 'project3',
    version: '3.0.0'
  }, null, 2));

  // Multi-scan files
  writeFileSync(join(root, 'projects.txt'), [
    '# Test projects',
    join(root, 'project1'),
    join(root, 'project2'),
    join(root, 'project3'),
    ''
  ].join('\n'));

  writeFileSync(join(root, 'glob-projects.txt'), [
    '# Test with glob',
    join(root, '*/package.json')
  ].join('\n'));

  writeFileSync(join(root, 'error-projects.txt'), [
    join(root, 'project1'),
    '/non/existent/path',
    join(root, 'project2')
  ].join('\n'));

  writeFileSync(join(root, 'empty.txt'), [
    '# Empty file',
    '',
    '  ',
    '# Another comment'
  ].join('\n'));

  writeFileSync(join(root, 'relative.txt'), [
    'project1',
    'project2'
  ].join('\n'));

  console.log('Multi-project scanning tests\n');

  const db = new VulnerabilityDatabase({ offline: true, noCache: true });
  assert.ok(db.check('@asyncapi/parser', '3.4.1'), 'Database should have test IOC');

  // Test parseMultiScanFile
  console.log('parseMultiScanFile:');

  await testAsync('reads project list file', async () => {
    const paths = await parseMultiScanFile(join(root, 'projects.txt'));
    assert.equal(paths.length, 3);
    assert.ok(paths.includes(join(root, 'project1')));
    assert.ok(paths.includes(join(root, 'project2')));
    assert.ok(paths.includes(join(root, 'project3')));
  });

  await testAsync('expands glob patterns', async () => {
    const paths = await parseMultiScanFile(join(root, 'glob-projects.txt'));
    // Glob should find package.json files and convert to parent dirs
    assert.ok(paths.length >= 2, `Expected at least 2 paths, got ${paths.length}`);
  });

  await testAsync('handles non-existent file', async () => {
    try {
      await parseMultiScanFile('/non/existent/file.txt');
      assert.fail('Should have thrown');
    } catch (error) {
      assert.ok(error.message.includes('not found'));
    }
  });

  await testAsync('skips comments and blank lines', async () => {
    const paths = await parseMultiScanFile(join(root, 'projects.txt'));
    assert.ok(!paths.some(p => p.includes('#')), 'Should not include comment lines');
  });

  await testAsync('returns empty array for empty file', async () => {
    const paths = await parseMultiScanFile(join(root, 'empty.txt'));
    assert.equal(paths.length, 0);
  });

  await testAsync('handles relative paths', async () => {
    const paths = await parseMultiScanFile(join(root, 'relative.txt'));
    assert.equal(paths.length, 2);
    // Paths should be resolved to absolute
    assert.ok(paths.every(p => p.startsWith('/')));
  });

  await testAsync('deduplicates paths', async () => {
    writeFileSync(join(root, 'dupes.txt'), [
      join(root, 'project1'),
      join(root, 'project1'),
      join(root, 'project2')
    ].join('\n'));
    const paths = await parseMultiScanFile(join(root, 'dupes.txt'));
    assert.equal(paths.length, 2);
  });

  // Test scanMultipleProjects
  console.log('\nscanMultipleProjects:');

  await testAsync('scans multiple projects successfully', async () => {
    const paths = await parseMultiScanFile(join(root, 'projects.txt'));
    const result = await scanMultipleProjects(paths, db, {
      parallel: false,
      offline: true
    });

    assert.equal(result.stats.totalProjects, 3);
    assert.equal(result.stats.successfulProjects, 3);
    assert.equal(result.stats.failedProjects, 0);
    assert.equal(result.projects.length, 3);
  });

  await testAsync('detects findings across projects', async () => {
    const paths = await parseMultiScanFile(join(root, 'projects.txt'));
    const result = await scanMultipleProjects(paths, db, {
      parallel: false,
      offline: true
    });

    // Project 1 has @asyncapi/parser@3.4.1 which is compromised
    assert.ok(result.stats.totalFindings > 0, 'Should find at least one finding');
    assert.ok(result.stats.totalVulnerabilities > 0, 'Should find vulnerabilities');
  });

  await testAsync('handles scan errors gracefully', async () => {
    const paths = await parseMultiScanFile(join(root, 'error-projects.txt'));
    const result = await scanMultipleProjects(paths, db, {
      parallel: false,
      offline: true
    });

    // Should still scan valid projects
    assert.ok(result.stats.successfulProjects >= 2, 'Should scan at least 2 projects');
    // Non-existent path shouldn't cause a hard error
    assert.ok(result.stats.failedProjects <= 1);
  });

  await testAsync('scans in parallel', async () => {
    const paths = await parseMultiScanFile(join(root, 'projects.txt'));
    const result = await scanMultipleProjects(paths, db, {
      parallel: true,
      concurrency: 2,
      offline: true
    });

    assert.equal(result.stats.totalProjects, 3);
    assert.equal(result.stats.successfulProjects, 3);
  });

  await testAsync('aggregates inventory across projects', async () => {
    const paths = await parseMultiScanFile(join(root, 'projects.txt'));
    const result = await scanMultipleProjects(paths, db, {
      parallel: false,
      offline: true
    });

    assert.ok(Array.isArray(result.inventory));
    // Should have packages from multiple projects
    const inventoryNames = result.inventory.map(i => i.name);
    assert.ok(inventoryNames.includes('@asyncapi/parser') || inventoryNames.includes('express'),
      'Should have inventory from scanned projects');
  });

  // Test report renderers
  console.log('\nReport renderers:');

  test('renderMultiProjectTextReport produces output', () => {
    const paths = [join(root, 'project1'), join(root, 'project2')];
    const result = {
      tool: { name: 'shai-scanner', version: '4.6.5', mode: 'multi-project' },
      scannedPaths: paths,
      projects: [
        { path: paths[0], findingsCount: 1, vulnerabilitiesCount: 1, duration: 10, stats: {} },
        { path: paths[1], findingsCount: 0, vulnerabilitiesCount: 0, duration: 5, stats: {} }
      ],
      findings: [{ id: 'test', type: 'package-ioc', severity: 'critical', packageName: 'test', packageVersion: '1.0.0', path: paths[0], projectPath: paths[0] }],
      vulnerabilities: [{ id: 'test', type: 'package-ioc', severity: 'critical', packageName: 'test', packageVersion: '1.0.0', path: paths[0], projectPath: paths[0] }],
      warnings: [],
      inventory: [],
      stats: {
        totalProjects: 2,
        successfulProjects: 2,
        failedProjects: 0,
        totalFindings: 1,
        totalVulnerabilities: 1,
        totalPackagesScanned: 10,
        totalLockfilePackagesScanned: 5,
        totalManifestsScanned: 2,
        scanTimeMs: 15
      },
      errors: []
    };

    const report = renderMultiProjectTextReport(result, { color: false });
    assert.ok(report.includes('Multi-Project Scan Results'));
    assert.ok(report.includes('2 project(s)'));
    assert.ok(report.includes('Total findings: 1'));
    assert.ok(report.includes('Per-Project Breakdown'));
    assert.ok(report.includes('project1'));
  });

  test('renderMultiProjectJsonReport produces valid JSON', () => {
    const result = {
      tool: { name: 'shai-scanner', version: '4.6.5', mode: 'multi-project' },
      projects: [],
      findings: [],
      stats: { totalProjects: 0 }
    };

    const report = renderMultiProjectJsonReport(result);
    const parsed = JSON.parse(report);
    assert.equal(parsed.tool.mode, 'multi-project');
  });

  test('renderMultiProjectSarifReport produces valid SARIF', () => {
    const result = {
      findings: [
        {
          id: 'test',
          type: 'package-ioc',
          severity: 'critical',
          packageName: 'test-pkg',
          packageVersion: '1.0.0',
          description: 'Test finding',
          evidence: 'test evidence',
          source: 'database',
          path: '/test/path',
          projectPath: '/project',
          relativePath: 'path'
        }
      ],
      stats: { totalProjects: 1 }
    };

    const report = renderMultiProjectSarifReport(result);
    const parsed = JSON.parse(report);
    assert.equal(parsed.version, '2.1.0');
    assert.ok(parsed.runs.length > 0);
    assert.ok(parsed.runs[0].results.length > 0);
    assert.equal(parsed.runs[0].results[0].ruleId, 'shai-scanner/package-ioc/database');
  });

  // Integration test: full workflow
  console.log('\nIntegration tests:');

  await testAsync('full multi-scan workflow', async () => {
    const paths = await parseMultiScanFile(join(root, 'projects.txt'));
    const result = await scanMultipleProjects(paths, db, {
      parallel: false,
      offline: true
    });

    // Verify aggregated result structure
    assert.ok(result.tool);
    assert.equal(result.tool.mode, 'multi-project');
    assert.ok(result.projects.length > 0);
    assert.ok(Array.isArray(result.findings));
    assert.ok(Array.isArray(result.vulnerabilities));
    assert.ok(result.stats);

    // Generate reports
    const jsonReport = renderMultiProjectJsonReport(result);
    const parsedJson = JSON.parse(jsonReport);
    assert.ok(parsedJson.projects);

    const sarifReport = renderMultiProjectSarifReport(result);
    const parsedSarif = JSON.parse(sarifReport);
    assert.ok(parsedSarif.runs);

    const textReport = renderMultiProjectTextReport(result, { color: false });
    assert.ok(textReport.includes('Multi-Project'));
  });

  await testAsync('multi-scan with scan options', async () => {
    const paths = await parseMultiScanFile(join(root, 'projects.txt'));
    const result = await scanMultipleProjects(paths, db, {
      includeNodeModules: false,
      includeLockfiles: true,
      includeManifests: true,
      includeIocFiles: false,
      parallel: false,
      offline: true
    });

    // Should still find lockfile-based findings
    assert.ok(result.stats.totalProjects === 3);
  });

} catch (error) {
  console.error(`\nSetup error: ${error.message}`);
  process.exitCode = 1;
} finally {
  // Cleanup
  try { rmSync(root, { recursive: true, force: true }); } catch {}

  console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}