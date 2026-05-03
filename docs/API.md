# Shai-Scanner API Documentation

## Overview

Shai-Scanner provides a comprehensive JavaScript API for programmatic vulnerability scanning, lockfile parsing, and supply chain security analysis. This documentation covers all classes, functions, types, and usage examples.

## Installation

```bash
npm install shai-scanner
```

## Quick Start

```javascript
import { VulnerabilityDatabase, Scanner } from 'shai-scanner';

// Create database instance
const db = new VulnerabilityDatabase({ offline: true });

// Create scanner
const scanner = new Scanner(db);

// Scan a directory
const result = await scanner.scan(['.'], {
  includeNodeModules: true,
  includeLockfiles: true,
  includeManifests: true
});

console.log(`Found ${result.findings.length} findings`);
console.log(`Scanned ${result.stats.packagesScanned} packages`);
```

## Core Classes

### VulnerabilityDatabase

The main class for managing the vulnerability database and performing IOC lookups.

#### Constructor

```javascript
const db = new VulnerabilityDatabase(options);
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `offline` | boolean | `false` | Run in offline mode (no network updates) |
| `cachePath` | string | `undefined` | Custom cache directory path |
| `noCache` | boolean | `false` | Disable caching entirely |

#### Methods

##### addEntry(entry, context?)

Adds a custom IOC entry to the database.

```javascript
const added = db.addEntry({
  name: 'malicious-package',
  versions: ['1.0.0', '1.0.1'],
  severity: 'critical',
  attack: 'supply-chain',
  description: 'Known malicious package',
  sources: ['internal-report']
});
```

**Parameters:**
- `entry` (Partial<VulnEntry> & { name: string }): IOC entry data
- `context` (Record<string, unknown>): Optional metadata

**Returns:** `boolean` - `true` if entry was added

##### check(name, version)

Checks if a specific package version is known to be malicious.

```javascript
const vuln = db.check('malicious-package', '1.0.0');

if (vuln) {
  console.log(`Vulnerability found: ${vuln.description}`);
  console.log(`Severity: ${vuln.severity}`);
}
```

**Parameters:**
- `name` (string): Package name
- `version` (string): Package version

**Returns:** `VulnEntry | null`

##### checkManifestRange(name, range)

Checks if a package range in a manifest could include malicious versions.

```javascript
const vuln = db.checkManifestRange('malicious-package', '^1.0.0');

if (vuln) {
  console.log(`Range ${vuln.matchedRange} may include malicious versions`);
}
```

**Parameters:**
- `name` (string): Package name
- `range` (string): Semver range

**Returns:** `(VulnEntry & { matchedRange: string }) | null`

##### search(query)

Searches the database for packages matching a query.

```javascript
const results = db.search('malicious');

results.forEach(vuln => {
  console.log(`${vuln.name}@${vuln.versions.join(', ')}: ${vuln.description}`);
});
```

**Parameters:**
- `query` (string): Search query

**Returns:** `VulnEntry[]`

##### getAllEntries()

Retrieves all entries in the database.

```javascript
const allVulns = db.getAllEntries();
console.log(`Total vulnerabilities: ${allVulns.length}`);
```

**Returns:** `VulnEntry[]`

##### getInfo()

Gets metadata about the database.

```javascript
const info = db.getInfo();
console.log(`Database version: ${info.version}`);
console.log(`Last updated: ${info.lastUpdated}`);
console.log(`Package count: ${info.packageCount}`);
```

**Returns:** `DatabaseInfo`

##### shouldAutoUpdate(intervalHours?)

Checks if the database should auto-update.

```javascript
if (db.shouldAutoUpdate(6)) {
  await db.update();
}
```

**Parameters:**
- `intervalHours` (number): Time interval in hours (default: 6)

**Returns:** `boolean`

##### importCsvText(text, options?)

Imports IOC data from CSV text.

```javascript
const count = db.importCsvText(`
package_name,package_version
malicious-pkg,1.0.0
another-pkg,2.0.0
`);
console.log(`Imported ${count} entries`);
```

**Parameters:**
- `text` (string): CSV content
- `options` (Record<string, unknown>): Import options

**Returns:** `number` - Count of imported entries

##### importCsvFile(filePath, options?)

Imports IOC data from a CSV file.

```javascript
const count = db.importCsvFile('./internal-iocs.csv');
console.log(`Imported ${count} entries`);
```

**Parameters:**
- `filePath` (string): Path to CSV file
- `options` (Record<string, unknown>): Import options

**Returns:** `number` - Count of imported entries

##### update(onProgress?)

Updates the database from remote sources.

```javascript
const result = await db.update((message) => {
  console.log(`Update progress: ${message}`);
});

console.log(`Added ${result.added} new entries`);
console.log(`Merged ${result.mergedRows} duplicate entries`);
```

**Parameters:**
- `onProgress` (function): Progress callback

**Returns:** `Promise<UpdateResult>`

---

### Scanner

The main scanning engine for analyzing projects and dependencies.

#### Constructor

```javascript
const scanner = new Scanner(db, options);
```

**Parameters:**
- `db` (VulnerabilityDatabase): Database instance
- `options` (ScannerOptions): Optional configuration

**ScannerOptions:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxSearchDepth` | number | `10` | Maximum directory search depth |
| `maxLockfileDepth` | number | `5` | Maximum depth for lockfile discovery |
| `maxManifestDepth` | number | `3` | Maximum depth for manifest discovery |
| `maxPackageJsonBytes` | number | `102400` | Maximum package.json size to parse |
| `followSymlinks` | boolean | `false` | Follow symbolic links |

#### Methods

##### scan(paths, options?, onProgress?)

Scans the specified paths for vulnerabilities.

```javascript
const result = await scanner.scan(['.'], {
  includeNodeModules: true,
  includeLockfiles: true,
  includeManifests: true,
  includeIocFiles: true
}, (progress) => {
  console.log(`Scanning ${progress.path} (${progress.phase})`);
});
```

**Parameters:**
- `paths` (string[]): Array of paths to scan
- `options` (ScanOptions): Scan configuration
- `onProgress` (function): Progress callback

**ScanOptions:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `includeNodeModules` | boolean | `true` | Scan node_modules directories |
| `includeLockfiles` | boolean | `true` | Scan lockfile contents |
| `includeManifests` | boolean | `true` | Scan package.json manifests |
| `includeIocFiles` | boolean | `true` | Scan for IOC files |

**Returns:** `Promise<ScanResult>`

---

## Utility Functions

### Database Functions

#### getDatabase(options?)

Factory function to create a VulnerabilityDatabase instance.

```javascript
import { getDatabase } from 'shai-scanner';

const db = getDatabase({ offline: true });
```

**Parameters:**
- `options` (object): Database options (same as VulnerabilityDatabase constructor)

**Returns:** `VulnerabilityDatabase`

### Lockfile Parsers

#### parseLockFile(filePath)

Auto-detects lockfile format and parses it.

```javascript
import { parseLockFile } from 'shai-scanner';

const packages = parseLockFile('./package-lock.json');
packages.forEach(pkg => {
  console.log(`${pkg.name}@${pkg.version} (from ${pkg.source})`);
});
```

**Parameters:**
- `filePath` (string): Path to lockfile

**Returns:** `Array<{ name, version, source }> | { packages: [], warning: string }`

#### parsePackageLock(filePath)

Parses npm package-lock.json files.

```javascript
import { parsePackageLock } from 'shai-scanner';

const packages = parsePackageLock('./package-lock.json');
```

**Parameters:**
- `filePath` (string): Path to package-lock.json

**Returns:** `Array<{ name, version, source }>`

#### parsePnpmLock(filePath)

Parses pnpm-lock.yaml files.

```javascript
import { parsePnpmLock } from 'shai-scanner';

const packages = parsePnpmLock('./pnpm-lock.yaml');
```

**Parameters:**
- `filePath` (string): Path to pnpm-lock.yaml

**Returns:** `Array<{ name, version, source }>`

#### parseYarnLock(filePath)

Parses yarn.lock files.

```javascript
import { parseYarnLock } from 'shai-scanner';

const packages = parseYarnLock('./yarn.lock');
```

**Parameters:**
- `filePath` (string): Path to yarn.lock

**Returns:** `Array<{ name, version, source }>`

#### parseBunLock(filePath)

Parses bun.lock files.

```javascript
import { parseBunLock } from 'shai-scanner';

const packages = parseBunLock('./bun.lock');
```

**Parameters:**
- `filePath` (string): Path to bun.lock

**Returns:** `Array<{ name, version, source }>`

### Package Manager Detection

#### detectPackageManager(dir)

Detects the package manager used in a directory.

```javascript
import { detectPackageManager } from 'shai-scanner';

const pm = detectPackageManager('./my-project');
console.log(`Package manager: ${pm}`); // 'npm', 'pnpm', 'yarn', or 'none'
```

**Parameters:**
- `dir` (string): Directory to check

**Returns:** `'npm' | 'pnpm' | 'yarn' | 'none'`

### Audit Integration

#### runAudit(dir, onProgress?)

Runs the package manager's native audit.

```javascript
import { runAudit } from 'shai-scanner';

const auditResult = await runAudit('./my-project', (msg) => {
  console.log(msg);
});

console.log(`Found ${auditResult.summary.total} vulnerabilities`);
```

**Parameters:**
- `dir` (string): Directory to audit
- `onProgress` (function): Progress callback

**Returns:** `Promise<AuditResult>`

### Live Advisory Queries

#### queryLiveAdvisories(packages, options?, onProgress?)

Queries live advisory sources (OSV.dev and GitHub).

```javascript
import { queryLiveAdvisories } from 'shai-scanner';

const live = await queryLiveAdvisories(
  result.inventory,
  { sources: ['osv', 'github'] },
  (msg) => console.log(msg)
);

console.log(`Found ${live.findings.length} live advisories`);
```

**Parameters:**
- `packages` (PackageInventoryEntry[]): Packages to query
- `options` (LiveSourceOptions): Query options
- `onProgress` (function): Progress callback

**Returns:** `Promise<LiveAdvisoryResult>`

#### queryOsvForPackages(packages, options?)

Queries OSV.dev for vulnerabilities.

```javascript
import { queryOsvForPackages } from 'shai-scanner';

const osvResult = await queryOsvForPackages(result.inventory, {
  timeoutMs: 10000,
  batchSize: 100
});
```

**Parameters:**
- `packages` (PackageInventoryEntry[]): Packages to query
- `options` (LiveSourceOptions): Query options

**Returns:** `Promise<LiveSourceResult>`

#### queryGithubAdvisoriesForPackages(packages, options?)

Queries GitHub Advisory Database.

```javascript
import { queryGithubAdvisoriesForPackages } from 'shai-scanner';

const githubResult = await queryGithubAdvisoriesForPackages(
  result.inventory,
  {
    githubToken: process.env.GITHUB_TOKEN,
    githubTypes: ['reviewed', 'malware']
  }
);
```

**Parameters:**
- `packages` (PackageInventoryEntry[]): Packages to query
- `options` (LiveSourceOptions): Query options

**Returns:** `Promise<LiveSourceResult>`

### Multi-Project Scanning

#### parseMultiScanFile(filePath)

Parses a multi-scan file containing project paths.

```javascript
import { parseMultiScanFile } from 'shai-scanner';

const projectPaths = await parseMultiScanFile('./projects.txt');
console.log(`Found ${projectPaths.length} projects to scan`);
```

**Parameters:**
- `filePath` (string): Path to multi-scan file

**Returns:** `Promise<string[]>` - Array of resolved project paths

#### scanMultipleProjects(projectPaths, db, options?)

Scans multiple projects and aggregates results.

```javascript
import { scanMultipleProjects } from 'shai-scanner';

const db = new VulnerabilityDatabase({ offline: true });
const result = await scanMultipleProjects(
  ['/path/to/project-a', '/path/to/project-b'],
  db,
  {
    parallel: true,
    concurrency: 4,
    includeLockfiles: true
  }
);

console.log(`Scanned ${result.stats.totalProjects} projects`);
console.log(`Found ${result.stats.totalFindings} findings`);
```

**Parameters:**
- `projectPaths` (string[]): Array of project paths
- `db` (VulnerabilityDatabase): Database instance
- `options` (object): Scan options

**Returns:** `Promise<object>` - Aggregated scan results

### Report Generators

#### renderJsonReport(result, options?)

Generates a JSON report from scan results.

```javascript
import { renderJsonReport } from 'shai-scanner';

const jsonReport = renderJsonReport(result, {
  auditResult: auditResult
});

fs.writeFileSync('report.json', jsonReport);
```

**Parameters:**
- `result` (ScanResult): Scan results
- `options` (object): Report options

**Returns:** `string`

#### renderSarifReport(result)

Generates a SARIF report for GitHub Code Scanning.

```javascript
import { renderSarifReport } from 'shai-scanner';

const sarifReport = renderSarifReport(result);
fs.writeFileSync('shai-scanner.sarif', sarifReport);
```

**Parameters:**
- `result` (ScanResult): Scan results

**Returns:** `string`

#### renderTextReport(result, options?)

Generates a human-readable text report.

```javascript
import { renderTextReport } from 'shai-scanner';

const textReport = renderTextReport(result, {
  color: true,
  auditResult: auditResult
});

console.log(textReport);
```

**Parameters:**
- `result` (ScanResult): Scan results
- `options` (object): Report options

**Returns:** `string`

#### renderHtmlReport(result, options?)

Generates an interactive HTML report.

```javascript
import { renderHtmlReport } from 'shai-scanner';

const htmlReport = renderHtmlReport(result, {
  auditResult: auditResult
});

fs.writeFileSync('report.html', htmlReport);
```

**Parameters:**
- `result` (ScanResult): Scan results
- `options` (object): Report options

**Returns:** `string`

### SBOM Generation

#### generateSBOM(result, options?)

Generates an SPDX 2.3 compliant SBOM.

```javascript
import { generateSBOM } from 'shai-scanner';

const sbom = generateSBOM(result, {
  format: 'json',
  name: 'my-project',
  rootPath: '/path/to/project'
});

fs.writeFileSync('sbom.spdx.json', sbom);
```

**Parameters:**
- `result` (ScanResult): Scan results
- `options` (SBOMOptions): SBOM generation options

**SBOMOptions:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `format` | string | `'json'` | Output format: `'json'` or `'tag-value'` |
| `name` | string | `'project'` | SBOM document name |
| `namespace` | string | auto-generated | Document namespace URI |
| `rootPath` | string | `'.'` | Root project path |

**Returns:** `string`

#### generateMinimalSBOM(result)

Generates a minimal SBOM with basic package information.

```javascript
import { generateMinimalSBOM } from 'shai-scanner';

const minimalSBOM = generateMinimalSBOM(result);
console.log(`SBOM contains ${minimalSBOM.packages.length} packages`);
```

**Parameters:**
- `result` (ScanResult): Scan results

**Returns:** `MinimalSBOM`

#### validateNTIACompliance(sbom)

Validates an SPDX document against NTIA minimum elements.

```javascript
import { validateNTIACompliance } from 'shai-scanner';

const validation = validateNTIACompliance(JSON.parse(sbom));
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
console.log('Warnings:', validation.warnings);
```

**Parameters:**
- `sbom` (SPDXDocument): Parsed SPDX document

**Returns:** `NTIAValidationResult`

### Multi-Project Report Generators

#### renderMultiProjectTextReport(result)

Generates a consolidated text report for multi-project scanning.

```javascript
import { renderMultiProjectTextReport } from 'shai-scanner';

const textReport = renderMultiProjectTextReport(multiProjectResult);
console.log(textReport);
```

**Parameters:**
- `result` (object): Multi-project scan results

**Returns:** `string`

#### renderMultiProjectJsonReport(result)

Generates a consolidated JSON report for multi-project scanning.

```javascript
import { renderMultiProjectJsonReport } from 'shai-scanner';

const jsonReport = renderMultiProjectJsonReport(multiProjectResult);
fs.writeFileSync('multi-project-report.json', jsonReport);
```

**Parameters:**
- `result` (object): Multi-project scan results

**Returns:** `string`

#### renderMultiProjectSarifReport(result)

Generates a consolidated SARIF report for multi-project scanning.

```javascript
import { renderMultiProjectSarifReport } from 'shai-scanner';

const sarifReport = renderMultiProjectSarifReport(multiProjectResult);
fs.writeFileSync('multi-project.sarif', sarifReport);
```

**Parameters:**
- `result` (object): Multi-project scan results

**Returns:** `string`

#### renderMultiProjectHtmlReport(result)

Generates a consolidated HTML report for multi-project scanning.

```javascript
import { renderMultiProjectHtmlReport } from 'shai-scanner';

const htmlReport = renderMultiProjectHtmlReport(multiProjectResult);
fs.writeFileSync('multi-project-report.html', htmlReport);
```

**Parameters:**
- `result` (object): Multi-project scan results

**Returns:** `string`

### Utility Functions

#### rangeMayIncludeVersion(range, version)

Checks if a semver range could include a specific version.

```javascript
import { rangeMayIncludeVersion } from 'shai-scanner';

const couldMatch = rangeMayIncludeVersion('^1.0.0', '1.2.3');
console.log(`Range ^1.0.0 could include 1.2.3: ${couldMatch}`);
```

**Parameters:**
- `range` (string): Semver range
- `version` (string): Version to check

**Returns:** `boolean`

#### liveVulnToFinding(vulnerability)

Converts a live advisory vulnerability to a Finding object.

```javascript
import { liveVulnToFinding } from 'shai-scanner';

const finding = liveVulnToFinding(liveVulnerability);
console.log(`Converted to finding: ${finding.id}`);
```

**Parameters:**
- `vulnerability` (LiveAdvisoryVulnerability): Live advisory vulnerability

**Returns:** `Finding`

---

## TypeScript Definitions

### Key Interfaces

```typescript
export interface VulnEntry {
  name: string;
  versions: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  attack: string;
  description: string;
  sources: string[];
}

export interface Finding {
  id: string;
  type: string;
  severity: string;
  path: string;
  packageName?: string;
  packageVersion?: string;
  attack?: string;
  description: string;
  evidence: string;
  source: string;
  remediation: string;
  url?: string;
  advisoryId?: string;
  aliases?: string[];
  publishedAt?: string | null;
  updatedAt?: string | null;
}

export interface ScanResult {
  scannedPaths: string[];
  findings: Finding[];
  vulnerabilities: Finding[];
  warnings: Array<{ path: string; message: string }>;
  inventory: PackageInventoryEntry[];
  stats: ScanStats;
  database: DatabaseInfo;
  liveAdvisories?: LiveAdvisoryResult;
  scanTimeMs: number;
}

export interface ScanStats {
  scannedPaths: string[];
  nodeModulesFound: number;
  packagesScanned: number;
  lockFilesScanned: number;
  lockfilePackagesScanned: number;
  manifestsScanned: number;
  iocFilesScanned: number;
  workflowsScanned: number;
  inventoryPackages: number;
  livePackagesQueried?: number;
  liveFindings?: number;
  liveSources?: string[];
}
```

### Type Exports

```typescript
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'none';
export type SBOMFormat = 'json' | 'tag-value';
export type LiveSource = 'osv' | 'github';
```

---

## Usage Examples

### Basic Scanning

```javascript
import { VulnerabilityDatabase, Scanner } from 'shai-scanner';

async function scanProject(projectPath) {
  const db = new VulnerabilityDatabase({ offline: true });
  const scanner = new Scanner(db);
  
  const result = await scanner.scan([projectPath], {
    includeNodeModules: false,
    includeLockfiles: true,
    includeManifests: true
  });
  
  console.log(`Found ${result.findings.length} findings`);
  
  result.findings.forEach(finding => {
    console.log(`[${finding.severity}] ${finding.packageName}@${finding.packageVersion}`);
    console.log(`  ${finding.description}`);
    console.log(`  Remediation: ${finding.remediation}`);
  });
  
  return result;
}
```

### CI Integration

```javascript
import { VulnerabilityDatabase, Scanner, renderJsonReport, renderSarifReport } from 'shai-scanner';

async function ciScan() {
  const db = new VulnerabilityDatabase();
  await db.update(); // Update database
  
  const scanner = new Scanner(db);
  const result = await scanner.scan(['.']);
  
  // Generate reports
  const jsonReport = renderJsonReport(result);
  const sarifReport = renderSarifReport(result);
  
  // Write reports
  fs.writeFileSync('shai-scan.json', jsonReport);
  fs.writeFileSync('shai-scanner.sarif', sarifReport);
  
  // Fail CI if critical findings
  const criticalFindings = result.findings.filter(f => f.severity === 'critical');
  if (criticalFindings.length > 0) {
    console.error(`Found ${criticalFindings.length} critical vulnerabilities`);
    process.exit(1);
  }
  
  console.log('No critical vulnerabilities found');
}
```

### Custom IOC Import

```javascript
import { VulnerabilityDatabase } from 'shai-scanner';

async function loadCustomIOCs() {
  const db = new VulnerabilityDatabase();
  
  // Import from CSV text
  const csvText = `
package_name,package_version
internal-malicious,1.0.0
another-bad-pkg,2.3.4
`;
  const imported = db.importCsvText(csvText);
  console.log(`Imported ${imported} custom IOCs`);
  
  // Import from file
  const fileImported = db.importCsvFile('./internal-iocs.csv');
  console.log(`Imported ${fileImported} IOCs from file`);
  
  return db;
}
```

### Error Handling

```javascript
import { VulnerabilityDatabase, Scanner } from 'shai-scanner';

async function safeScan() {
  try {
    const db = new VulnerabilityDatabase({ offline: true });
    const scanner = new Scanner(db);
    
    const result = await scanner.scan(['.']);
    return result;
  } catch (error) {
    // Handle common errors
    if (error.code === 'ENOENT') {
      console.error('Directory not found');
    } else if (error.code === 'EACCES') {
      console.error('Permission denied');
    } else {
      console.error('Scan error:', error.message);
    }
    
    // Return empty result on error
    return {
      findings: [],
      stats: { packagesScanned: 0 },
      warnings: [{ path: '.', message: error.message }]
    };
  }
}
```

### Performance Considerations

```javascript
import { VulnerabilityDatabase, Scanner } from 'shai-scanner';

async function optimizedScan() {
  // Use offline mode for faster scanning
  const db = new VulnerabilityDatabase({ offline: true });
  
  // Configure scanner for performance
  const scanner = new Scanner(db, {
    maxSearchDepth: 5,      // Limit directory depth
    maxLockfileDepth: 3,    // Limit lockfile search
    maxPackageJsonBytes: 50000 // Skip large package.json files
  });
  
  // Scan only necessary directories
  const result = await scanner.scan(['./src', './lib'], {
    includeNodeModules: false, // Skip node_modules for speed
    includeLockfiles: true,
    includeManifests: true
  });
  
  return result;
}
```

---

## Constants

```javascript
import { EXIT_CODES, DEFAULTS, DATA_SOURCES, IOC_FILE_NAMES, LOCK_FILE_NAMES } from 'shai-scanner';

// Exit codes
console.log('Success:', EXIT_CODES.SUCCESS);
console.log('Vulnerability found:', EXIT_CODES.VULNERABILITY_FOUND);
console.log('Error:', EXIT_CODES.ERROR);

// Default values
console.log('Default max depth:', DEFAULTS.MAX_SEARCH_DEPTH);

// Data sources
console.log('Available sources:', DATA_SOURCES);

// IOC file patterns
console.log('IOC files to scan:', IOC_FILE_NAMES);

// Lockfile patterns
console.log('Lockfile formats:', LOCK_FILE_NAMES);
```

---

## Browser Compatibility

### Node.js Requirements

- **Minimum**: Node.js 18.0.0
- **Recommended**: Node.js 20.x LTS or later

### Browser Support

The core scanner API is designed for Node.js and does not support browser environments due to:

- File system access requirements
- Network capabilities for live advisory queries
- Child process execution for package manager audit

### Limited Browser Support

Some utility functions may work in browser environments with polyfills:

```javascript
// These functions can be used in browsers with polyfills
import { rangeMayIncludeVersion } from 'shai-scanner';

// Note: File-based functions require Node.js
```

---

## Error Handling

### Common Error Codes

| Error Code | Description | Resolution |
|------------|-------------|------------|
| `ENOENT` | File or directory not found | Verify path exists |
| `EACCES` | Permission denied | Check file permissions |
| `EISDIR` | Expected file, got directory | Verify file path |
| `JSON_PARSE_ERROR` | Invalid JSON in lockfile | Check lockfile format |

### Async/Promise Rejection Handling

```javascript
// Always handle promise rejections
scanner.scan(['.'])
  .then(result => {
    // Process results
  })
  .catch(error => {
    console.error('Scan failed:', error);
  });

// Or use try/catch with async/await
try {
  const result = await scanner.scan(['.']);
} catch (error) {
  console.error('Scan failed:', error);
}
```

### Error Recovery Strategies

```javascript
async function robustScan() {
  const paths = ['./src', './lib', './test'];
  const allFindings = [];
  
  for (const path of paths) {
    try {
      const result = await scanner.scan([path]);
      allFindings.push(...result.findings);
    } catch (error) {
      console.warn(`Failed to scan ${path}: ${error.message}`);
      // Continue with other paths
    }
  }
  
  return allFindings;
}
```

---

## Performance Tips

### Offline Mode

Use offline mode for deterministic scans and faster performance:

```javascript
const db = new VulnerabilityDatabase({ offline: true });
```

### Batch Processing

Process large projects in batches:

```javascript
// Query in batches to avoid API limits
const batchSize = 100;
for (let i = 0; i < packages.length; i += batchSize) {
  const batch = packages.slice(i, i + batchSize);
  const result = await queryOsvForPackages(batch);
  // Process results
}
```

### Caching

The database automatically caches results. Disable only when needed:

```javascript
const db = new VulnerabilityDatabase({ noCache: true });
```

### Memory Management

For large projects, scan selectively:

```javascript
const result = await scanner.scan(['.'], {
  includeNodeModules: false, // Large directories
  includeLockfiles: true,
  includeManifests: true,
  includeIocFiles: true
});
```

---

## Additional Resources

- **[README.md](../README.md)** - Project overview and quick start
- **[TUI Usage Guide](TUI_USAGE_GUIDE.md)** - Interactive terminal UI
- **[Migration Guide](MIGRATION_GUIDE.md)** - Migrating from legacy APIs
- **[Cross-Platform Testing](CROSS_PLATFORM_TESTING.md)** - Compatibility information

---

*Last updated: 2026-05-02*