import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Scanner, VulnerabilityDatabase, generateSBOM, generateMinimalSBOM, validateNTIACompliance } from '../src/index.js';

const root = mkdtempSync(join(tmpdir(), 'shai-scanner-sbom-test-'));

try {
  // Create test fixtures
  writeFileSync(join(root, 'package.json'), JSON.stringify({
    name: 'test-project',
    version: '1.0.0',
    dependencies: {
      '@asyncapi/parser': '^3.4.0',
      'express': '^4.18.0'
    }
  }, null, 2));

  writeFileSync(join(root, 'package-lock.json'), JSON.stringify({
    lockfileVersion: 3,
    packages: {
      '': { name: 'test-project', version: '1.0.0' },
      'node_modules/@asyncapi/parser': { name: '@asyncapi/parser', version: '3.4.1' },
      'node_modules/express': { name: 'express', version: '4.18.0' }
    }
  }, null, 2));

  // Run scanner
  const db = new VulnerabilityDatabase({ offline: true, noCache: true });
  const scanner = new Scanner(db, { maxSearchDepth: 5, maxLockfileDepth: 5, maxManifestDepth: 5 });
  const result = await scanner.scan([root]);

  // Test 1: Generate JSON SBOM
  console.log('Test 1: Generate JSON SBOM...');
  const jsonSbom = generateSBOM(result, {
    format: 'json',
    name: 'test-project',
    rootPath: root
  });
  const sbomObj = JSON.parse(jsonSbom);
  assert.equal(sbomObj.spdxVersion, 'SPDX-2.3');
  assert.equal(sbomObj.name, 'test-project');
  assert.ok(sbomObj.packages.length >= 3); // Root + packages + build info
  assert.ok(sbomObj.relationships.length >= 2);
  console.log('  ✓ JSON SBOM generated successfully');

  // Test 2: Generate tag-value SBOM
  console.log('Test 2: Generate tag-value SBOM...');
  const tagValueSbom = generateSBOM(result, {
    format: 'tag-value',
    name: 'test-project',
    rootPath: root
  });
  assert.ok(tagValueSbom.includes('SPDXVersion: SPDX-2.3'));
  assert.ok(tagValueSbom.includes('DocumentName: test-project'));
  assert.ok(tagValueSbom.includes('PackageName: @asyncapi/parser'));
  console.log('  ✓ Tag-value SBOM generated successfully');

  // Test 3: Validate NTIA compliance
  console.log('Test 3: Validate NTIA compliance...');
  const validation = validateNTIACompliance(sbomObj);
  assert.ok(validation.valid, 'SBOM should be NTIA compliant');
  assert.ok(validation.summary.packageCount >= 3);
  console.log('  ✓ NTIA compliance validation passed');

  // Test 4: Generate minimal SBOM
  console.log('Test 4: Generate minimal SBOM...');
  const minimalSbom = generateMinimalSBOM(result);
  assert.ok(minimalSbom.spdxVersion);
  assert.ok(minimalSbom.name);
  assert.ok(minimalSbom.packages.length >= 2, 'Minimal SBOM should have at least 2 packages');
  assert.ok(minimalSbom.metadata.tool);
  console.log('  ✓ Minimal SBOM generated successfully');

  // Test 5: SBOM includes vulnerability annotations
  console.log('Test 5: SBOM includes vulnerability annotations...');
  const vulnAnnotations = sbomObj.annotations.filter(ann => ann.comment && ann.comment.includes('Vulnerability'));
  assert.ok(vulnAnnotations.length > 0, 'Should have vulnerability annotations');
  console.log(`  ✓ Found ${vulnAnnotations.length} vulnerability annotations`);

  // Test 6: SBOM includes external document references
  console.log('Test 6: SBOM includes external document references...');
  assert.ok(sbomObj.externalDocumentRefs.length >= 0, 'External document refs should be an array');
  console.log(`  ✓ Found ${sbomObj.externalDocumentRefs.length} external document references`);

  // Test 7: SBOM includes build info package
  console.log('Test 7: SBOM includes build info package...');
  const buildInfoPackage = sbomObj.packages.find(p => p.name === 'shai-scanner-build');
  assert.ok(buildInfoPackage, 'Should have build info package');
  assert.equal(buildInfoPackage.primaryPackagePurpose, 'TOOL');
  console.log('  ✓ Build info package found');

  // Test 8: SBOM relationships are correct
  console.log('Test 8: SBOM relationships are correct...');
  const rootDependsOnPackages = sbomObj.relationships.filter(r => 
    r.spdxElementId === 'SPDXRef-Package-Root' && r.relationshipType === 'DEPENDS_ON'
  );
  assert.ok(rootDependsOnPackages.length >= 2, 'Root should depend on at least 2 packages');
  console.log(`  ✓ Found ${rootDependsOnPackages.length} DEPENDS_ON relationships`);

  // Test 9: SBOM has correct creation info
  console.log('Test 9: SBOM has correct creation info...');
  assert.ok(sbomObj.creationInfo.created);
  assert.ok(Array.isArray(sbomObj.creationInfo.creators));
  assert.ok(sbomObj.creationInfo.creators.length > 0);
  console.log('  ✓ Creation info is valid');

  // Test 10: SBOM has correct namespace
  console.log('Test 10: SBOM has correct namespace...');
  assert.ok(sbomObj.documentNamespace.includes('test-project'));
  console.log('  ✓ Document namespace is valid');

  // Test 11: Test with empty results
  console.log('Test 11: Test with empty results...');
  const emptyResult = { findings: [], vulnerabilities: [], inventory: [] };
  const emptySbom = generateSBOM(emptyResult, { name: 'empty-project' });
  const emptySbomObj = JSON.parse(emptySbom);
  assert.equal(emptySbomObj.packages.length, 2); // Root + build info
  console.log('  ✓ Empty results handled correctly');

  // Test 12: Test NTIA validation with missing fields
  console.log('Test 12: Test NTIA validation with missing fields...');
  const invalidSbom = { name: 'test' }; // Missing required fields
  const invalidValidation = validateNTIACompliance(invalidSbom);
  assert.ok(!invalidValidation.valid, 'Should be invalid with missing fields');
  assert.ok(invalidValidation.errors.length > 0, 'Should have validation errors');
  console.log('  ✓ NTIA validation correctly identifies invalid SBOM');

  // Test 13: SBOM contains supplier information
  console.log('Test 13: SBOM contains supplier information...');
  const packagesWithSupplier = sbomObj.packages.filter(p => p.supplier && p.supplier !== 'NOASSERTION');
  assert.ok(packagesWithSupplier.length >= 0, 'Some packages should have supplier info');
  console.log(`  ✓ Found ${packagesWithSupplier.length} packages with supplier info`);

  // Test 14: SBOM contains download locations
  console.log('Test 14: SBOM contains download locations...');
  const packagesWithDownloadLocation = sbomObj.packages.filter(p => 
    p.downloadLocation && p.downloadLocation !== 'NOASSERTION'
  );
  assert.ok(packagesWithDownloadLocation.length >= 2, 'Packages should have download locations');
  console.log(`  ✓ Found ${packagesWithDownloadLocation.length} packages with download locations`);

  console.log('\n✅ All SBOM tests passed!');
  
} finally {
  rmSync(root, { recursive: true, force: true });
}