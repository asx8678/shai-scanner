import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { VulnerabilityDatabase, Scanner, parsePackageLock, parsePnpmLock, queryLiveAdvisories, rangeMayIncludeVersion } from '../src/index.js';

const root = mkdtempSync(join(tmpdir(), 'shai-scanner-test-'));
try {
  writeFileSync(join(root, 'package.json'), JSON.stringify({
    name: 'fixture',
    version: '1.0.0',
    dependencies: {
      '@asyncapi/parser': '^3.4.0',
      'express': '^4.18.0'
    },
    scripts: {
      preinstall: 'node setup.mjs'
    }
  }, null, 2));

  writeFileSync(join(root, 'package-lock.json'), JSON.stringify({
    lockfileVersion: 3,
    packages: {
      '': { name: 'fixture', version: '1.0.0' },
      'node_modules/@asyncapi/parser': { name: '@asyncapi/parser', version: '3.4.1' },
      'node_modules/express': { name: 'express', version: '4.18.0' }
    }
  }, null, 2));

  mkdirSync(join(root, 'node_modules', '@asyncapi', 'parser'), { recursive: true });
  writeFileSync(join(root, 'node_modules', '@asyncapi', 'parser', 'package.json'), JSON.stringify({
    name: '@asyncapi/parser',
    version: '3.4.1',
    scripts: { preinstall: 'node setup_bun.js' }
  }, null, 2));
  writeFileSync(join(root, 'node_modules', '@asyncapi', 'parser', 'setup_bun.js'), 'console.log("fixture")');

  mkdirSync(join(root, '.github', 'workflows'), { recursive: true });
  writeFileSync(join(root, '.github', 'workflows', 'bad.yml'), 'on: discussion\njobs:\n  leak:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo ${{ toJson(secrets) }}');

  const db = new VulnerabilityDatabase({ offline: true, noCache: true });
  assert.ok(db.check('@asyncapi/parser', '3.4.1'));
  assert.ok(rangeMayIncludeVersion('^3.4.0', '3.4.1'));
  assert.ok(!rangeMayIncludeVersion('^4.4.0', '3.4.1'));
  assert.ok(rangeMayIncludeVersion('>= 1.0.0, < 2.0.0', '1.5.0'));
  assert.ok(!rangeMayIncludeVersion('>= 1.0.0, < 2.0.0', '2.0.0'));
  assert.ok(!rangeMayIncludeVersion('1.2.3', '11.2.30'));

  const pkgs = parsePackageLock(join(root, 'package-lock.json'));
  assert.ok(pkgs.some((p) => p.name === '@asyncapi/parser' && p.version === '3.4.1'));

  const pnpmFile = join(root, 'pnpm-lock.yaml');
  writeFileSync(pnpmFile, `lockfileVersion: '9.0'\n\npackages:\n  '@cap-js/sqlite@2.2.2':\n    resolution: {integrity: sha512-test}\n`);
  const pnpm = parsePnpmLock(pnpmFile);
  assert.ok(pnpm.some((p) => p.name === '@cap-js/sqlite' && p.version === '2.2.2'));

  const scanner = new Scanner(db, { maxSearchDepth: 5, maxLockfileDepth: 5, maxManifestDepth: 5 });
  const result = await scanner.scan([root]);
  assert.ok(result.findings.some((f) => f.type === 'package-ioc' && f.packageName === '@asyncapi/parser'));
  assert.ok(result.findings.some((f) => f.type === 'lockfile-ioc' && f.packageName === '@asyncapi/parser'));
  assert.ok(result.findings.some((f) => f.type === 'manifest-ioc' && f.packageName === '@asyncapi/parser'));
  assert.ok(result.findings.some((f) => f.type === 'suspicious-script'));
  assert.ok(result.findings.some((f) => f.type === 'suspicious-file'));
  assert.ok(result.findings.some((f) => f.type === 'suspicious-workflow'));


  const fakeFetch = async (url, options = {}) => {
    const href = String(url);
    let payload;
    if (href.includes('/querybatch')) {
      payload = { results: [{ vulns: [{ id: 'MAL-MOCK-1', modified: '2026-01-01T00:00:00Z' }] }] };
    } else if (href.includes('/v1/vulns/MAL-MOCK-1')) {
      payload = { id: 'MAL-MOCK-1', aliases: ['GHSA-mock'], summary: 'Mock npm malware advisory', details: 'malware', modified: '2026-01-01T00:00:00Z', references: [{ url: 'https://osv.dev/vulnerability/MAL-MOCK-1' }] };
    } else if (href.includes('api.github.com/advisories') && href.includes('type=reviewed')) {
      payload = [{ ghsa_id: 'GHSA-live-test', type: 'reviewed', severity: 'high', summary: 'Mock GHSA', html_url: 'https://github.com/advisories/GHSA-live-test', vulnerabilities: [{ package: { ecosystem: 'npm', name: 'mock-live' }, vulnerable_version_range: '>= 1.0.0, < 2.0.0', first_patched_version: { identifier: '2.0.0' } }] }];
    } else {
      payload = [];
    }
    return { ok: true, text: async () => JSON.stringify(payload) };
  };
  const live = await queryLiveAdvisories([{ name: 'mock-live', version: '1.5.0', paths: [root], sources: ['test'] }], { sources: ['osv', 'github'], fetchImpl: fakeFetch, maxPackages: 10 });
  assert.ok(live.findings.some((f) => f.type === 'live-osv-advisory'));
  assert.ok(live.findings.some((f) => f.type === 'live-github-advisory'));

  console.log('self-test passed');
} finally {
  rmSync(root, { recursive: true, force: true });
}
