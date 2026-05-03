/**
 * SBOM (Software Bill of Materials) generation for shai-scanner.
 * Generates SPDX 2.3 format SBOMs for software supply chain transparency.
 * Supports JSON and tag-value output formats.
 *
 * SPDX Specification: https://spdx.org/spdx-specification/
 * NTIA Minimum Elements: https://www.ntia.doc.gov/files/ntia/publications/ssc_framework_20210712.pdf
 * EU CRA Requirements: https://digital-strategy.ec.europa.eu/en/policies/cyber-resilience-act
 *
 * @module sbom
 */

import { createHash } from 'node:crypto';

// SPDX document version
const SPDX_VERSION = 'SPDX-2.3';
const SPDX_DATA_LICENSE = 'CC0-1.0';
const SPDX_CREATOR_TOOL = 'shai-scanner@4.6.5'; // Update this when version changes
const TOOL_VERSION = '4.6.5';

/**
 * Generate a SPDX 2.3 SBOM from scan results.
 *
 * @param {Object} result - Scanner result object
 * @param {Object} options - Generation options
 * @param {string} options.format - Output format: 'json' (default) or 'tag-value'
 * @param {string} options.name - Document name (default: project name or 'scan')
 * @param {string} options.namespace - SPDX document namespace URI
 * @param {string} options.rootPath - Root path for relative file paths
 * @returns {string} Generated SBOM in specified format
 */
export function generateSBOM(result, options = {}) {
  const format = options.format || 'json';
  const name = options.name || result.project?.name || 'scan';
  const namespace = options.namespace || `https://shai-scanner.dev/spdx/${name}/${Date.now()}`;

  // Extract inventory and findings
  const inventory = result.inventory || [];
  const findings = result.findings || [];
  const vulnerabilities = result.vulnerabilities || [];

  // Build SBOM structure
  const sbom = {
    spdxVersion: SPDX_VERSION,
    dataLicense: SPDX_DATA_LICENSE,
    SPDXID: 'SPDXRef-DOCUMENT',
    name: name,
    documentNamespace: namespace,
    creationInfo: {
      created: new Date().toISOString(),
      creators: [
        SPDX_CREATOR_TOOL,
        'Tool: shai-scanner',
        `Organization: ${result.project?.organization || 'Unknown'}`,
      ].filter((item) => !item.includes('Unknown')),
      licenseListVersion: '3.21.0',
    },
    // Package information
    packages: [],
    // Relationships between packages
    relationships: [],
    // Annotations for findings/vulnerabilities
    annotations: [],
    // External document references for vulnerability details
    externalDocumentRefs: [],
    // Cross references for vulnerability links
    crossReferences: [],
  };

  // Add root package (the scanned project)
  const rootPackage = {
    SPDXID: 'SPDXRef-Package-Root',
    name: name,
    versionInfo: result.project?.version || 'NOASSERTION',
    supplier: result.project?.organization
      ? `Organization: ${result.project.organization}`
      : 'NOASSERTION',
    downloadLocation: result.project?.repository || 'NOASSERTION',
    filesAnalyzed: false,
    licenseConcluded: result.project?.license || 'NOASSERTION',
    licenseDeclared: result.project?.license || 'NOASSERTION',
    copyrightText: result.project?.copyright || 'NOASSERTION',
    comment: `Root package for ${name} project scan`,
    // NTIA minimum elements
    primaryPackagePurpose: 'APPLICATION',
    // Build timestamp
    buildTimestamp: new Date().toISOString(),
  };

  // Add checksum for root package if available
  if (result.project?.checksum) {
    rootPackage.checksums = [
      {
        algorithm: 'SHA256',
        checksumValue: result.project.checksum,
      },
    ];
  }

  sbom.packages.push(rootPackage);

  // Map to track packages by name@version for deduplication
  const packageMap = new Map();

  // Add packages from inventory
  for (const pkg of inventory) {
    const packageKey = `${pkg.name}@${pkg.version}`;
    if (packageMap.has(packageKey)) continue;

    const spdxId = `SPDXRef-Package-${sanitizeSpdxId(pkg.name)}-${sanitizeSpdxId(pkg.version)}`;
    const packageEntry = {
      SPDXID: spdxId,
      name: pkg.name,
      versionInfo: pkg.version,
      supplier: 'NOASSERTION',
      downloadLocation: `https://registry.npmjs.org/${pkg.name}/-/${pkg.name}-${pkg.version}.tgz`,
      filesAnalyzed: false,
      licenseConcluded: 'NOASSERTION',
      licenseDeclared: 'NOASSERTION',
      copyrightText: 'NOASSERTION',
      // NTIA minimum elements
      primaryPackagePurpose: 'LIBRARY',
      // Source information
      sourceInfo: pkg.source ? `Found in: ${pkg.source}` : 'NOASSERTION',
    };

    // Add package checksum if available
    if (pkg.checksum) {
      packageEntry.checksums = [
        {
          algorithm: 'SHA256',
          checksumValue: pkg.checksum,
        },
      ];
    }

    // Add homepage if available
    if (pkg.homepage) {
      packageEntry.homepage = pkg.homepage;
    }

    packageMap.set(packageKey, { spdxId, package: packageEntry });
    sbom.packages.push(packageEntry);

    // Add relationship: root depends on package
    sbom.relationships.push({
      spdxElementId: 'SPDXRef-Package-Root',
      relationshipType: 'DEPENDS_ON',
      relatedSpdxElement: spdxId,
    });
  }

  // Add vulnerabilities as annotations with severity ratings
  for (const vuln of vulnerabilities) {
    const vulnId = `SPDXRef-Vulnerability-${sanitizeSpdxId(vuln.id || vuln.packageName || 'unknown')}`;
    const annotation = {
      SPDXID: vulnId,
      annotationType: 'REVIEW',
      annotator: `Tool: ${SPDX_CREATOR_TOOL}`,
      annotationDate: new Date().toISOString(),
      comment: `Vulnerability: ${vuln.severity?.toUpperCase() || 'UNKNOWN'} - ${vuln.description || vuln.type || 'Unknown vulnerability'}`,
    };

    // Add external reference for vulnerability details
    if (vuln.url) {
      sbom.externalDocumentRefs.push({
        externalDocumentId: `VEX-${vulnId}`,
        spdxDocument: vuln.url,
        checksum: [
          {
            algorithm: 'SHA256',
            checksumValue: createHash('sha256').update(vuln.url).digest('hex'),
          },
        ],
      });
    }

    // Link vulnerability to affected package
    if (vuln.packageName && vuln.packageVersion) {
      const packageKey = `${vuln.packageName}@${vuln.packageVersion}`;
      const packageInfo = packageMap.get(packageKey);
      if (packageInfo) {
        annotation.relationship = {
          spdxElementId: packageInfo.spdxId,
          relationshipType: 'AFFECTS',
          relatedSpdxElement: vulnId,
        };
        sbom.relationships.push(annotation.relationship);
      }
    }

    sbom.annotations.push(annotation);
  }

  // Add findings as additional annotations (non-vulnerability findings)
  const nonVulnFindings = findings.filter(
    (f) => !f.severity || f.type === 'suspicious-script' || f.type === 'suspicious-file',
  );
  for (const finding of nonVulnFindings.slice(0, 100)) {
    // Limit to first 100 to keep SBOM manageable
    const findingId = `SPDXRef-Finding-${sanitizeSpdxId(finding.id || 'unknown')}`;
    sbom.annotations.push({
      SPDXID: findingId,
      annotationType: 'OTHER',
      annotator: `Tool: ${SPDX_CREATOR_TOOL}`,
      annotationDate: new Date().toISOString(),
      comment: `Finding: ${finding.type} - ${finding.description || 'No description'}`,
      location: finding.path ? { relativePath: finding.path } : undefined,
    });
  }

  // Add build information as a special package
  sbom.packages.push({
    SPDXID: 'SPDXRef-Package-BuildInfo',
    name: 'shai-scanner-build',
    versionInfo: TOOL_VERSION,
    supplier: `Tool: ${SPDX_CREATOR_TOOL}`,
    downloadLocation: 'https://github.com/nicholasgasior/shai-scanner',
    filesAnalyzed: false,
    licenseConcluded: 'MIT',
    licenseDeclared: 'MIT',
    copyrightText: 'Copyright (c) 2024 Security Tools',
    comment: 'Build information for this SBOM generation',
    primaryPackagePurpose: 'TOOL',
  });

  // Add relationship: root depends on build info
  sbom.relationships.push({
    spdxElementId: 'SPDXRef-Package-Root',
    relationshipType: 'BUILD_TOOL_OF',
    relatedSpdxElement: 'SPDXRef-Package-BuildInfo',
  });

  // Format output
  if (format === 'tag-value') {
    return formatSpdxTagValue(sbom);
  }

  return JSON.stringify(sbom, null, 2);
}

/**
 * Convert SBOM object to SPDX tag-value format.
 *
 * @param {Object} sbom - SBOM object
 * @returns {string} Tag-value formatted string
 */
function formatSpdxTagValue(sbom) {
  const lines = [];

  // Document section
  lines.push('SPDXVersion: ' + sbom.spdxVersion);
  lines.push('DataLicense: ' + sbom.dataLicense);
  lines.push('SPDXID: ' + sbom.SPDXID);
  lines.push('DocumentName: ' + sbom.name);
  lines.push('DocumentNamespace: ' + sbom.documentNamespace);
  lines.push('Creator: ' + sbom.creationInfo.creators.join(' '));
  lines.push('Created: ' + sbom.creationInfo.created);
  lines.push('');

  // Packages section
  for (const pkg of sbom.packages) {
    lines.push('PackageName: ' + pkg.name);
    lines.push('SPDXID: ' + pkg.SPDXID);
    lines.push('PackageVersion: ' + pkg.versionInfo);
    lines.push('PackageSupplier: ' + pkg.supplier);
    lines.push('PackageDownloadLocation: ' + pkg.downloadLocation);
    lines.push('FilesAnalyzed: ' + (pkg.filesAnalyzed ? 'true' : 'false'));
    lines.push('LicenseConcluded: ' + pkg.licenseConcluded);
    lines.push('LicenseDeclared: ' + pkg.licenseDeclared);
    lines.push('PackageCopyrightText: ' + pkg.copyrightText);
    if (pkg.comment) lines.push('PackageComment: ' + pkg.comment);
    if (pkg.sourceInfo) lines.push('PackageSourceInfo: ' + pkg.sourceInfo);
    if (pkg.homepage) lines.push('PackageHomepage: ' + pkg.homepage);
    if (pkg.checksums) {
      for (const checksum of pkg.checksums) {
        lines.push('PackageChecksum: ' + checksum.algorithm + ' ' + checksum.checksumValue);
      }
    }
    lines.push('');
  }

  // Relationships section
  for (const rel of sbom.relationships) {
    lines.push(
      'Relationship: ' +
        rel.spdxElementId +
        ' ' +
        rel.relationshipType +
        ' ' +
        rel.relatedSpdxElement,
    );
  }
  lines.push('');

  // Annotations section (for vulnerabilities)
  for (const ann of sbom.annotations) {
    lines.push('Annotator: ' + ann.annotator);
    lines.push('AnnotationDate: ' + ann.annotationDate);
    lines.push('AnnotationType: ' + ann.annotationType);
    lines.push('SPDXREF: ' + ann.SPDXID);
    lines.push('AnnotationComment: ' + ann.comment);
    lines.push('');
  }

  // External document references
  for (const ref of sbom.externalDocumentRefs) {
    lines.push(
      'ExternalDocumentRef: ' +
        ref.externalDocumentId +
        ' ' +
        ref.spdxDocument +
        ' ' +
        ref.checksum[0].algorithm +
        ':' +
        ref.checksum[0].checksumValue,
    );
  }

  return lines.join('\n');
}

/**
 * Sanitize a string for use in SPDX IDs.
 * Only alphanumeric characters, hyphens, and underscores are allowed.
 *
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeSpdxId(str) {
  if (!str) return 'unknown';
  // Replace invalid characters with hyphens
  return str
    .replace(/[^a-zA-Z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Generate a minimal SBOM for quick export.
 * Useful for CI/CD pipelines where full vulnerability details aren't needed.
 *
 * @param {Object} result - Scanner result object
 * @returns {Object} Minimal SBOM object
 */
export function generateMinimalSBOM(result) {
  const inventory = result.inventory || [];

  return {
    spdxVersion: 'SPDX-2.3',
    name: result.project?.name || 'scan',
    packages: inventory.map((pkg) => ({
      name: pkg.name,
      version: pkg.version,
      supplier: 'NOASSERTION',
      downloadLocation: `https://registry.npmjs.org/${pkg.name}/-/${pkg.name}-${pkg.version}.tgz`,
    })),
    metadata: {
      tool: SPDX_CREATOR_TOOL,
      generatedAt: new Date().toISOString(),
      packageCount: inventory.length,
    },
  };
}

/**
 * Validate SBOM for NTIA minimum elements compliance.
 *
 * @param {Object} sbom - SBOM object to validate
 * @returns {Object} Validation results with errors and warnings
 */
export function validateNTIACompliance(sbom) {
  const errors = [];
  const warnings = [];

  // Check required fields
  if (!sbom.spdxVersion) errors.push('Missing SPDX version');
  if (!sbom.name) errors.push('Missing document name');
  if (!sbom.documentNamespace) errors.push('Missing document namespace');
  if (!sbom.creationInfo?.created) errors.push('Missing creation timestamp');
  if (!sbom.creationInfo?.creators?.length) errors.push('Missing creator information');

  // Check packages
  if (!sbom.packages?.length) {
    errors.push('No packages found in SBOM');
    return { valid: false, errors, warnings };
  }

  for (const pkg of sbom.packages) {
    if (!pkg.name) warnings.push(`Package missing name: ${pkg.SPDXID}`);
    if (!pkg.versionInfo || pkg.versionInfo === 'NOASSERTION') {
      warnings.push(`Package ${pkg.name} missing version information`);
    }
    if (!pkg.supplier || pkg.supplier === 'NOASSERTION') {
      warnings.push(`Package ${pkg.name} missing supplier information`);
    }
    if (!pkg.downloadLocation || pkg.downloadLocation === 'NOASSERTION') {
      warnings.push(`Package ${pkg.name} missing download location`);
    }
  }

  // Check relationships
  if (!sbom.relationships?.length) {
    warnings.push('No relationships defined');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary: {
      packageCount: sbom.packages.length,
      relationshipCount: sbom.relationships?.length || 0,
      vulnerabilityCount: sbom.annotations?.length || 0,
    },
  };
}
