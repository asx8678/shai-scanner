# Phase 2 Remaining Execution Plan: Documentation Enhancement

**Project:** shai-scanner v4.6.0  
**Date:** 2026-05-02  
**Status:** 📋 Ready for Execution  
**Remaining Tasks:** 4 items from BD Readiness Checklist  

---

## 🎯 Executive Summary

This plan details the execution of the remaining Phase 2 documentation tasks for the shai-scanner project. These tasks are critical for community building, security transparency, and developer onboarding. The plan follows the project's existing documentation style: technical but accessible, using emoji for visual hierarchy, and maintaining a professional yet approachable tone.

## 📊 Remaining Tasks Overview

### 1. Create CONTRIBUTING.md
**Priority:** High  
**Estimated Time:** 30-45 minutes  
**Dependencies:** None  

### 2. Create CODE_OF_CONDUCT.md
**Priority:** Medium  
**Estimated Time:** 15-20 minutes  
**Dependencies:** None  

### 3. Update SECURITY.md with Vulnerability Reporting
**Priority:** High  
**Estimated Time:** 30-40 minutes  
**Dependencies:** None  

### 4. Create API Documentation (if needed)
**Priority:** Medium  
**Estimated Time:** 45-60 minutes  
**Dependencies:** Review of existing index.d.ts  

---

## 📝 Detailed Execution Plan

### Task 1: Create CONTRIBUTING.md

#### Purpose
Provide clear guidelines for contributors to understand how to contribute to the project, set up their development environment, and follow project standards.

#### Document Structure
```markdown
# Contributing to Shai-Scanner

Thank you for your interest in contributing to shai-scanner! This document provides guidelines and information for contributors.

## 🤝 Code of Conduct
This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## 🚀 How to Contribute

### Reporting Bugs
- Use the GitHub issue tracker
- Include detailed reproduction steps
- Provide system information (Node.js version, OS)
- Include scanner output and logs

### Suggesting Enhancements
- Open an issue with the "enhancement" label
- Describe the use case and proposed solution
- Consider security implications

### Pull Requests
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🛠️ Development Setup

### Prerequisites
- Node.js 18 or higher
- npm (comes with Node.js)
- Git

### Getting Started
```bash
# Clone the repository
git clone https://github.com/security-tools/shai-scanner.git
cd shai-scanner

# Install dependencies (none required, but run for setup)
npm install

# Run the scanner on itself
node src/cli.js --scan . --offline --no-auto-update

# Run tests
npm test
```

### Development Commands
```bash
# Run core tests
npm test

# Run TUI tests
npm run test:tui

# Run visual regression tests
npm run test:visual

# Run performance benchmarks
npm run test:benchmark

# Run cross-platform tests
npm run test:cross-platform

# Run the scanner in TUI mode
npm run tui

# Update the IOC database
npm run update-db
```

## 📋 Coding Standards

### Style Guide
- **No runtime dependencies** - This is a core principle
- Use modern JavaScript (ES modules, async/await)
- Follow the existing code style (no linter configured, but be consistent)
- Use descriptive variable and function names
- Add comments for complex logic

### File Organization
- Source code in `src/`
- TUI components in `src/tui/components/`
- TUI core infrastructure in `src/tui/core/`
- Tests in `test/`
- Documentation in `docs/`

### Testing Requirements
- All new features must include tests
- Visual changes need visual regression tests
- Performance impacts should be benchmarked
- Cross-platform compatibility must be maintained

## 🧪 Testing

### Test Suites
The project has multiple test suites:

1. **Core Tests** (`npm test`):
   - Basic functionality validation
   - Scanner operations
   - Database operations
   - Lockfile parsing

2. **TUI Tests** (`npm run test:tui`):
   - Component lifecycle tests
   - Keyboard navigation tests
   - Rendering tests

3. **Visual Regression** (`npm run test:visual`):
   - Terminal output validation
   - Baseline comparison

4. **Performance** (`npm run test:benchmark`):
   - Rendering performance
   - Memory usage
   - Startup time

5. **Cross-Platform** (`npm run test:cross-platform`):
   - Windows, macOS, Linux compatibility
   - Terminal compatibility

### Running Tests
```bash
# Run all tests
npm test

# Run specific test suite
npm run test:tui

# Run with verbose output
node test/self-test.js --verbose
```

## 📦 Pull Request Process

### Before Submitting
1. Ensure all tests pass
2. Update documentation if needed
3. Add entries to CHANGELOG.md
4. Follow the commit message format

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### PR Review Process
1. Automated tests must pass
2. At least one maintainer review required
3. Security-sensitive changes need security review
4. Documentation updates should be reviewed for accuracy

## 🔄 Release Process

### Versioning
This project follows Semantic Versioning:
- **Major**: Breaking changes
- **Minor**: New features (backward compatible)
- **Patch**: Bug fixes (backward compatible)

### Release Steps
1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Run release script: `./scripts/release.sh [patch|minor|major]`
4. Create GitHub release
5. Publish to npm

### For Maintainers
```bash
# Dry run release
./scripts/release.sh patch --dry-run

# Actual release
./scripts/release.sh patch

# Skip tests (use with caution)
./scripts/release.sh patch --skip-tests
```

## 🐛 Issue Templates

### Bug Report
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Run '...'
2. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- Node.js version: [e.g. 18.0.0]
- OS: [e.g. Windows 11, macOS 14.0, Ubuntu 22.04]
- Scanner version: [e.g. 4.6.0]

**Additional context**
Add any other context about the problem here.
```

### Feature Request
```markdown
**Is your feature request related to a problem?**
A clear description of the problem. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
A description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
```

## 📚 Documentation

### Contributing to Documentation
- Documentation is in Markdown format
- Use consistent formatting with existing docs
- Include code examples where appropriate
- Test all code examples before submitting

### Documentation Structure
```
docs/
├── stakeholders/          # Business documentation
├── TUI_USAGE_GUIDE.md    # TUI usage guide
├── MIGRATION_GUIDE.md    # Migration instructions
└── CROSS_PLATFORM_TESTING.md  # Cross-platform testing
```

## 🎯 Good First Issues

Looking for ways to contribute? Check out these "good first issue" labels:
- Documentation improvements
- Test coverage additions
- Bug fixes
- Performance optimizations

## 📞 Getting Help

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Security Issues**: See [SECURITY.md](SECURITY.md) for vulnerability reporting

## 🙏 Recognition

Contributors will be recognized in:
- CHANGELOG.md
- README.md contributors section
- GitHub release notes

---

**Thank you for contributing to shai-scanner!** 🐕

Together, we're making npm supply-chain security better for everyone.
```

#### Validation Steps
1. Verify all links work
2. Test all code examples
3. Ensure consistent formatting
4. Check for typos and grammar

#### Agent Recommendation
**Documentation Agent** with focus on developer experience and community building.

---

### Task 2: Create CODE_OF_CONDUCT.md

#### Purpose
Establish clear community standards based on the Contributor Covenant v2.1, the standard for open source projects.

#### Document Structure
```markdown
# Contributor Covenant Code of Conduct

## Our Pledge

We as members, contributors, and leaders pledge to make participation in our
community a harassment-free experience for everyone, regardless of age, body
size, visible or invisible disability, ethnicity, sex characteristics, gender
identity and expression, level of experience, education, socio-economic status,
nationality, personal appearance, race, religion, or sexual identity
and orientation.

We pledge to act and interact in ways that contribute to an open, welcoming,
diverse, inclusive, and healthy community.

## Our Standards

Examples of behavior that contributes to a positive environment for our
community include:

* Demonstrating empathy and kindness toward other people
* Being respectful of differing opinions, viewpoints, and experiences
* Giving and gracefully accepting constructive feedback
* Accepting responsibility and apologizing to those affected by our mistakes,
  and learning from the experience
* Focusing on what is best not just for us as individuals, but for the
  overall community

Examples of unacceptable behavior include:

* The use of sexualized language or imagery, and sexual attention or
  advances of any kind
* Trolling, insulting or derogatory comments, and personal or political attacks
* Public or private harassment
* Publishing others' private information, such as a physical or email
  address, without their explicit permission
* Other conduct which could reasonably be considered inappropriate in a
  professional setting

## Enforcement Responsibilities

Community leaders are responsible for clarifying and enforcing our standards of
acceptable behavior and will take appropriate and fair corrective action in
response to any behavior that they deem inappropriate, threatening, offensive,
or harmful.

Community leaders have the right and responsibility to remove, edit, or reject
comments, commits, code, wiki edits, issues, and other contributions that are
not aligned to this Code of Conduct, and will communicate reasons for moderation
decisions when appropriate.

## Scope

This Code of Conduct applies within all community spaces, and also applies when
an individual is officially representing the community in public spaces.
Examples of representing our community include using an official e-mail address,
posting via an official social media account, or acting as an appointed
representative at an online or offline event.

## Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be
reported to the community leaders responsible for enforcement at
**security@shai-scanner.dev**.

All complaints will be reviewed and investigated promptly and fairly.

All community leaders are obligated to respect the privacy and security of the
reporter of any incident.

## Enforcement Guidelines

Community leaders will follow these Community Impact Guidelines in determining
the consequences for any action they deem in violation of this Code of Conduct:

### 1. Correction

**Community Impact**: Use of inappropriate language or other behavior deemed
unprofessional or unwelcome in the community.

**Consequence**: A private, written warning from community leaders, providing
clarity around the nature of the violation and an explanation of why the
behavior was inappropriate. A public apology may be requested.

### 2. Warning

**Community Impact**: A violation through a single incident or series
of actions.

**Consequence**: A warning with consequences for continued behavior. No
interaction with the people involved, including unsolicited interaction with
those enforcing the Code of Conduct, for a specified period of time. This
includes avoiding interactions in community spaces as well as external channels
like social media. Violating these terms may lead to a temporary or
permanent ban.

### 3. Temporary Ban

**Community Impact**: A serious violation of community standards, including
sustained inappropriate behavior.

**Consequence**: A temporary ban from any sort of interaction or public
communication with the community for a specified period of time. No public or
private interaction with the people involved, including unsolicited interaction
with those enforcing the Code of Conduct, is allowed during this period.
Violating these terms may lead to a permanent ban.

### 4. Permanent Ban

**Community Impact**: Demonstrating a pattern of violation of community
standards, including sustained inappropriate behavior, harassment of an
individual, or aggression toward or disparagement of classes of individuals.

**Consequence**: A permanent ban from any sort of public interaction within
the community.

## Attribution

This Code of Conduct is adapted from the [Contributor Covenant][homepage],
version 2.1, available at
[https://www.contributor-covenant.org/version/2/1/code_of_conduct.html][v2.1].

Community Impact Guidelines were inspired by
[Mozilla's code of conduct enforcement ladder][Mozilla CoC].

For answers to common questions about this code of conduct, see the FAQ at
[https://www.contributor-covenant.org/faq][FAQ]. Translations are available at
[https://www.contributor-covenant.org/translations][translations].

[homepage]: https://www.contributor-covenant.org
[v2.1]: https://www.contributor-covenant.org/version/2/1/code_of_conduct.html
[Mozilla CoC]: https://github.com/mozilla/diversity
[FAQ]: https://www.contributor-covenant.org/faq
[translations]: https://www.contributor-covenant.org/translations
```

#### Validation Steps
1. Verify the text matches Contributor Covenant v2.1
2. Ensure all links work
3. Check for formatting consistency

#### Agent Recommendation
**Community Manager Agent** - This is a standard template that requires minimal customization.

---

### Task 3: Update SECURITY.md with Vulnerability Reporting

#### Purpose
Enhance the existing SECURITY.md with comprehensive vulnerability reporting process, security contacts, response timeline, and disclosure policy.

#### Current Content Analysis
The current SECURITY.md is minimal (1020 bytes) and covers:
- Basic reporting instructions
- Safe operation guidelines
- Threat model

#### Enhanced Document Structure
```markdown
# Security Policy

## 🛡️ Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 4.6.x   | ✅ Active support  |
| 4.5.x   | ✅ Security fixes  |
| < 4.5   | ❌ No support      |

## 🔍 Reporting a Vulnerability

### Security Contact
- **Email:** security@shai-scanner.dev
- **GitHub Security Advisories:** [Report Vulnerability](https://github.com/security-tools/shai-scanner/security/advisories/new)
- **Response Time:** Within 48 hours for initial acknowledgment

### What to Include
When reporting a vulnerability, please include:

1. **Package Information**
   - Package name and version
   - Lockfile snippet or package path
   - Scanner command and output
   - Whether network updates were enabled

2. **Vulnerability Details**
   - Type of vulnerability (false negative, false positive, etc.)
   - Steps to reproduce
   - Potential impact assessment
   - Suggested fix (if any)

3. **Environment Details**
   - Node.js version
   - Operating system
   - Scanner version
   - Configuration used

### ⚠️ Important Security Notes
- **Do not include live credentials, tokens, private repository dumps, or secret-scanner output**
- **Do not disclose vulnerabilities publicly until a fix is available**
- **Use encrypted communication for sensitive information**

## 🚨 Response Timeline

| Phase | Timeframe | Actions |
|-------|-----------|---------|
| **Acknowledgment** | Within 48 hours | Confirm receipt, assign tracking ID |
| **Initial Assessment** | Within 5 business days | Severity assessment, initial response plan |
| **Investigation** | Within 14 business days | Detailed analysis, root cause identification |
| **Fix Development** | Within 30 business days | Develop and test security patch |
| **Release** | Within 45 business days | Release fix, publish security advisory |
| **Public Disclosure** | After fix release | Coordinate disclosure with reporter |

## 📋 Disclosure Policy

### Coordinated Disclosure
We follow the coordinated disclosure model:

1. **Reporter notifies us** via secure channel
2. **We acknowledge** and begin investigation
3. **We develop a fix** and test thoroughly
4. **We release the fix** and notify reporter
5. **We publish a security advisory** after fix is available
6. **Reporter may disclose** after reasonable time (typically 90 days)

### Safe Harbor
We support safe harbor for security researchers:

- We will not pursue legal action against researchers who:
  - Make a good faith effort to avoid privacy violations
  - Only interact with accounts you own or with explicit permission
  - Do not exploit a vulnerability beyond what is necessary to confirm its existence
  - Report vulnerabilities promptly and do not publicly disclose before a fix is available

## 🔧 Security Update Process

### When a Security Issue is Confirmed
1. **Immediate Actions:**
   - Create private security branch
   - Develop fix in isolation
   - Prepare security advisory

2. **Fix Release:**
   - Bump patch version (e.g., 4.6.0 → 4.6.1)
   - Update CHANGELOG.md with security section
   - Publish to npm
   - Create GitHub release with security advisory

3. **Post-Release:**
   - Notify users via GitHub security advisories
   - Update documentation if needed
   - Monitor for related issues

### Security Advisory Format
```markdown
## [Security Advisory Title]

### Summary
Brief description of the vulnerability.

### Impact
What could an attacker achieve?

### Affected Versions
- 4.6.0
- 4.5.0

### Patched Versions
- 4.6.1

### References
- CVE ID (if applicable)
- GitHub Advisory
- Related issues
```

## 🐛 Scanner-Specific Security Considerations

### False Negatives
If the scanner fails to detect a known malicious package:
1. Report immediately with package details
2. Include lockfile and node_modules structure
3. Provide IOC data if available

### False Positives
If the scanner incorrectly flags a legitimate package:
1. Report with package details
2. Include evidence of legitimacy
3. Suggest detection improvements

### Database Accuracy
If IOC database contains incorrect information:
1. Report the specific entry
2. Provide evidence of inaccuracy
3. Suggest corrections

## 🔄 Safe Operation Guidelines

### Recommended Practices
```bash
# Use offline mode for deterministic builds
shai-scanner --scan . --offline --no-auto-update

# Use lockfiles-only for pre-install checks
shai-scanner --lockfiles-only --scan .

# Use no-auto-update to prevent network calls
shai-scanner --scan . --no-auto-update

# In CI, install dependencies safely
npm ci --ignore-scripts
```

### Network Security
- Scanner only fetches IOC data from fixed allowlist
- All network requests use HTTPS
- Cached data stored with private file permissions
- No data uploaded to external services

## 📞 Security Contacts

- **Primary:** security@shai-scanner.dev
- **GitHub:** @security-tools/maintainers
- **Response SLA:** 48 hours for acknowledgment

## 🏆 Bug Bounty

### Current Status
We do not currently operate a formal bug bounty program. However, we deeply appreciate security researchers who help improve our security posture.

### Recognition
We recognize security contributors in:
- SECURITY.md acknowledgments
- GitHub release notes
- CHANGELOG.md security sections

### Future Considerations
As the project grows, we may establish a formal bug bounty program. Stay tuned for updates.

## 📚 Additional Resources

- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [npm Security Best Practices](https://docs.npmjs.com/creating-a-package-json-file#using-a-package-lock-file)

---

**Last Updated:** 2026-05-02  
**Version:** 1.1  
**Contact:** security@shai-scanner.dev
```

#### Validation Steps
1. Verify all links work
2. Ensure email addresses are valid
3. Check for consistency with existing documentation
4. Verify GitHub repository settings for security advisories

#### Agent Recommendation
**Security Policy Agent** with expertise in vulnerability disclosure and security best practices.

---

### Task 4: Create API Documentation

#### Purpose
Provide comprehensive API documentation for developers using shai-scanner programmatically, based on the existing TypeScript definitions.

#### Current State Analysis
The project already has:
- `index.d.ts` with comprehensive TypeScript definitions
- Well-structured exports in `src/index.js`
- Clear class and function signatures

#### Document Structure
```markdown
# Shai-Scanner API Documentation

**Version:** 4.6.0  
**Last Updated:** 2026-05-02

## Overview

Shai-Scanner provides a comprehensive API for programmatic scanning of npm projects for supply-chain attacks. The API is designed with zero runtime dependencies and works in both Node.js and browser environments (with limitations).

## Installation

```bash
npm install shai-scanner
```

## Quick Start

```javascript
import { getDatabase, Scanner } from 'shai-scanner';

// Initialize database
const db = getDatabase({ offline: true });

// Create scanner instance
const scanner = new Scanner(db);

// Scan a project
const result = await scanner.scan(['./my-project']);
console.log(`Found ${result.findings.length} findings`);
```

## Core Classes

### VulnerabilityDatabase

The `VulnerabilityDatabase` class manages IOC (Indicators of Compromise) data for vulnerability detection.

```javascript
import { VulnerabilityDatabase } from 'shai-scanner';

const db = new VulnerabilityDatabase({
  offline: true,        // Use cached data only
  cachePath: './cache', // Custom cache location
  noCache: false        // Enable/disable caching
});
```

#### Methods

##### `addEntry(entry, context?)`
Add a vulnerability entry to the database.

```javascript
const entry = {
  name: 'malicious-package',
  versions: ['1.0.0', '1.0.1'],
  severity: 'critical',
  attack: 'supply-chain',
  description: 'Known malicious package',
  sources: ['datadog-ioc']
};

db.addEntry(entry);
```

##### `check(name, version)`
Check if a specific package version is known to be malicious.

```javascript
const result = db.check('package-name', '1.0.0');
if (result) {
  console.log(`Vulnerability found: ${result.description}`);
}
```

##### `checkManifestRange(name, range)`
Check if a package version range in package.json matches any known vulnerabilities.

```javascript
const result = db.checkManifestRange('package-name', '^1.0.0');
if (result) {
  console.log(`Range ${result.matchedRange} matches vulnerability`);
}
```

##### `search(query)`
Search the database for entries matching a query.

```javascript
const results = db.search('malicious');
console.log(`Found ${results.length} matching entries`);
```

##### `getAllEntries()`
Get all entries in the database.

```javascript
const entries = db.getAllEntries();
console.log(`Database contains ${entries.length} entries`);
```

##### `getInfo()`
Get database metadata and statistics.

```javascript
const info = db.getInfo();
console.log(`Database version: ${info.version}`);
console.log(`Last updated: ${info.lastUpdated}`);
console.log(`Package count: ${info.packageCount}`);
```

##### `shouldAutoUpdate(intervalHours?)`
Check if database should be automatically updated.

```javascript
if (db.shouldAutoUpdate(24)) {
  await db.update();
}
```

##### `importCsvText(text, options?)`
Import vulnerability data from CSV text.

```javascript
const csvText = `name,versions,severity,attack,description,sources
malicious-package,1.0.0;1.0.1,critical,supply-chain,Malicious package,datadog-ioc`;

const count = db.importCsvText(csvText);
console.log(`Imported ${count} entries`);
```

##### `importCsvFile(filePath, options?)`
Import vulnerability data from a CSV file.

```javascript
const count = db.importCsvFile('./data/vulnerabilities.csv');
console.log(`Imported ${count} entries`);
```

##### `update(onProgress?)`
Update the database from remote sources.

```javascript
const result = await db.update((message) => {
  console.log(`Update: ${message}`);
});

console.log(`Added ${result.added} new entries`);
```

### Scanner

The `Scanner` class performs the actual scanning of projects and dependencies.

```javascript
import { Scanner } from 'shai-scanner';

const scanner = new Scanner(db, {
  maxSearchDepth: 10,      // Maximum directory depth to search
  maxLockfileDepth: 5,     // Maximum depth for lockfiles
  maxManifestDepth: 5,     // Maximum depth for package.json files
  maxPackageJsonBytes: 1024 * 1024, // 1MB limit for package.json
  followSymlinks: false    // Don't follow symbolic links
});
```

#### Methods

##### `scan(paths, options?, onProgress?)`
Scan the specified paths for vulnerabilities.

```javascript
const result = await scanner.scan(
  ['./project1', './project2'],
  {
    includeNodeModules: true,   // Scan installed packages
    includeLockfiles: true,     // Scan lockfiles
    includeManifests: true,     // Scan package.json files
    includeIocFiles: true       // Scan for IOC files
  },
  (progress) => {
    console.log(`Scanning ${progress.path}...`);
  }
);

console.log(`Scan completed in ${result.scanTimeMs}ms`);
console.log(`Found ${result.findings.length} findings`);
```

## Utility Functions

### Database Functions

#### `getDatabase(options?)`
Get a configured database instance.

```javascript
import { getDatabase } from 'shai-scanner';

const db = getDatabase({
  offline: true,
  cachePath: './cache',
  noCache: false
});
```

### Lockfile Parsers

#### `parseLockFile(filePath)`
Parse any supported lockfile format.

```javascript
import { parseLockFile } from 'shai-scanner';

const packages = parseLockFile('./package-lock.json');
console.log(`Found ${packages.length} packages`);
```

#### `parsePackageLock(filePath)`
Parse npm package-lock.json.

```javascript
import { parsePackageLock } from 'shai-scanner';

const packages = parsePackageLock('./package-lock.json');
```

#### `parsePnpmLock(filePath)`
Parse pnpm-lock.yaml.

```javascript
import { parsePnpmLock } from 'shai-scanner';

const packages = parsePnpmLock('./pnpm-lock.yaml');
```

#### `parseYarnLock(filePath)`
Parse yarn.lock.

```javascript
import { parseYarnLock } from 'shai-scanner';

const packages = parseYarnLock('./yarn.lock');
```

#### `parseBunLock(filePath)`
Parse bun.lock (JSON format).

```javascript
import { parseBunLock } from 'shai-scanner';

const packages = parseBunLock('./bun.lock');
```

### Package Manager Detection

#### `detectPackageManager(dir)`
Detect the package manager used in a directory.

```javascript
import { detectPackageManager } from 'shai-scanner';

const pm = detectPackageManager('./my-project');
console.log(`Package manager: ${pm}`); // 'npm', 'pnpm', 'yarn', or 'none'
```

### Audit Integration

#### `runAudit(dir, onProgress?)`
Run package manager audit.

```javascript
import { runAudit } from 'shai-scanner';

const auditResult = await runAudit('./my-project', (message) => {
  console.log(`Audit: ${message}`);
});

console.log(`Found ${auditResult.summary.total} vulnerabilities`);
```

### Live Advisory Queries

#### `queryLiveAdvisories(packages, options?, onProgress?)`
Query live advisory databases for vulnerabilities.

```javascript
import { queryLiveAdvisories } from 'shai-scanner';

const packages = [
  { name: 'package-name', version: '1.0.0', paths: ['node_modules/package-name'], sources: ['npm'] }
];

const result = await queryLiveAdvisories(
  packages,
  {
    osv: true,           // Query OSV.dev
    github: true,        // Query GitHub Advisory Database
    timeoutMs: 5000,     // 5 second timeout
    batchSize: 100       // Query 100 packages at a time
  },
  (message) => console.log(`Live query: ${message}`)
);

console.log(`Found ${result.findings.length} live findings`);
```

#### `queryOsvForPackages(packages, options?)`
Query OSV.dev specifically.

```javascript
import { queryOsvForPackages } from 'shai-scanner';

const result = await queryOsvForPackages(packages, {
  timeoutMs: 10000,
  batchSize: 50
});
```

#### `queryGithubAdvisoriesForPackages(packages, options?)`
Query GitHub Advisory Database.

```javascript
import { queryGithubAdvisoriesForPackages } from 'shai-scanner';

const result = await queryGithubAdvisoriesForPackages(packages, {
  githubToken: process.env.GITHUB_TOKEN,
  githubTypes: ['reviewed', 'malware'],
  detailLimit: 100
});
```

### Report Generators

#### `renderJsonReport(result, options?)`
Generate JSON report.

```javascript
import { renderJsonReport } from 'shai-scanner';

const json = renderJsonReport(scanResult, {
  auditResult: auditResult
});
console.log(json);
```

#### `renderSarifReport(result)`
Generate SARIF report for GitHub Code Scanning.

```javascript
import { renderSarifReport } from 'shai-scanner';

const sarif = renderSarifReport(scanResult);
```

#### `renderTextReport(result, options?)`
Generate human-readable text report.

```javascript
import { renderTextReport } from 'shai-scanner';

const text = renderTextReport(scanResult, {
  auditResult: auditResult,
  color: true
});
console.log(text);
```

#### `renderHtmlReport(result, options?)`
Generate interactive HTML report.

```javascript
import { renderHtmlReport } from 'shai-scanner';

const html = renderHtmlReport(scanResult, {
  auditResult: auditResult
});

// Save to file
import fs from 'fs';
fs.writeFileSync('report.html', html);
```

### SBOM Generation

#### `generateSBOM(result, options?)`
Generate SPDX 2.3 SBOM.

```javascript
import { generateSBOM } from 'shai-scanner';

const sbom = generateSBOM(scanResult, {
  format: 'json',         // 'json' or 'tag-value'
  name: 'my-project',
  namespace: 'https://example.com',
  rootPath: './my-project'
});
```

#### `generateMinimalSBOM(result)`
Generate minimal SBOM for quick inventory.

```javascript
import { generateMinimalSBOM } from 'shai-scanner';

const minimal = generateMinimalSBOM(scanResult);
console.log(`Contains ${minimal.metadata.packageCount} packages`);
```

#### `validateNTIACompliance(sbom)`
Validate SBOM against NTIA requirements.

```javascript
import { validateNTIACompliance } from 'shai-scanner';

const validation = validateNTIACompliance(sbomDocument);
if (!validation.valid) {
  console.log('NTIA compliance errors:', validation.errors);
}
```

### Utility Functions

#### `rangeMayIncludeVersion(range, version)`
Check if a semver range might include a specific version.

```javascript
import { rangeMayIncludeVersion } from 'shai-scanner';

const mightInclude = rangeMayIncludeVersion('^1.0.0', '1.2.3');
console.log(`Might include: ${mightInclude}`); // true
```

#### `liveVulnToFinding(vulnerability)`
Convert a live vulnerability to a finding object.

```javascript
import { liveVulnToFinding } from 'shai-scanner';

const finding = liveVulnToFinding(liveVulnerability);
```

## TypeScript Definitions

The package includes comprehensive TypeScript definitions in `index.d.ts`. All interfaces and types are exported for use in TypeScript projects.

### Key Interfaces

```typescript
interface Finding {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  path: string;
  packageName?: string;
  packageVersion?: string;
  attack?: string;
  description: string;
  evidence: string;
  source: string;
  remediation: string;
  // ... more fields
}

interface ScanResult {
  tool?: { name: string; version: string };
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

interface ScanStats {
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

## Examples

### Basic Scanning

```javascript
import { getDatabase, Scanner } from 'shai-scanner';

async function scanProject(projectPath) {
  // Initialize database
  const db = getDatabase({ offline: true });
  
  // Create scanner
  const scanner = new Scanner(db);
  
  // Scan project
  const result = await scanner.scan([projectPath]);
  
  // Process results
  if (result.findings.length > 0) {
    console.log('🚨 Security issues found:');
    result.findings.forEach(finding => {
      console.log(`  - ${finding.severity.toUpperCase()}: ${finding.description}`);
    });
  } else {
    console.log('✅ No security issues found');
  }
  
  return result;
}
```

### CI Integration

```javascript
import { getDatabase, Scanner, renderJsonReport } from 'shai-scanner';
import fs from 'fs';

async function ciScan() {
  const db = getDatabase({ offline: true });
  const scanner = new Scanner(db);
  
  const result = await scanner.scan(['.']);
  
  // Generate reports
  const jsonReport = renderJsonReport(result);
  fs.writeFileSync('scan-results.json', jsonReport);
  
  // Exit with error code if critical findings
  const criticalFindings = result.findings.filter(f => f.severity === 'critical');
  if (criticalFindings.length > 0) {
    console.error(`Found ${criticalFindings.length} critical vulnerabilities`);
    process.exit(1);
  }
}
```

### Custom IOC Import

```javascript
import { VulnerabilityDatabase } from 'shai-scanner';

async function importCustomIOCs() {
  const db = new VulnerabilityDatabase({ offline: false });
  
  // Import from CSV text
  const csvData = `
name,versions,severity,attack,description,sources
my-custom-package,1.0.0;1.0.1,critical,supply-chain,Custom IOC entry,custom-feed
  `.trim();
  
  const count = db.importCsvText(csvData);
  console.log(`Imported ${count} custom IOC entries`);
  
  // Check a package
  const result = db.check('my-custom-package', '1.0.0');
  if (result) {
    console.log(`Found custom IOC: ${result.description}`);
  }
}
```

## Error Handling

All async functions return promises that reject with descriptive error messages. Common errors include:

```javascript
try {
  const result = await scanner.scan(['./nonexistent']);
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error('Directory not found');
  } else if (error.code === 'EACCES') {
    console.error('Permission denied');
  } else {
    console.error('Scan failed:', error.message);
  }
}
```

## Performance Considerations

- **Offline Mode**: Use `--offline` or `offline: true` for fastest scanning
- **Batch Processing**: Use `batchSize` option for live queries
- **Caching**: Enable caching for repeated scans
- **Memory**: Large projects may require increased Node.js memory limit

```bash
# Increase memory limit for large projects
node --max-old-space-size=4096 node_modules/shai-scanner/src/cli.js --scan .
```

## Browser Compatibility

While the core scanner is designed for Node.js, some utility functions can be used in browser environments:

- `rangeMayIncludeVersion()` - Pure JavaScript
- `renderJsonReport()` - String output
- `renderSarifReport()` - String output

**Note**: File system operations require Node.js.

---

**API Version:** 4.6.0  
**TypeScript Definitions:** Included in package  
**License:** MIT
```

#### Validation Steps
1. Verify all code examples work
2. Ensure TypeScript definitions match documentation
3. Test all imports and exports
4. Check for consistency with existing code

#### Agent Recommendation
**API Documentation Agent** with expertise in developer documentation and TypeScript.

---

## 🔄 Task Dependencies and Execution Order

### Parallel Execution Opportunities
All four tasks can be executed in parallel as they have no dependencies on each other.

### Recommended Execution Order
1. **CODE_OF_CONDUCT.md** (15-20 minutes) - Simplest, quick win
2. **CONTRIBUTING.md** (30-45 minutes) - Community building foundation
3. **SECURITY.md Update** (30-40 minutes) - Security transparency
4. **API Documentation** (45-60 minutes) - Most complex, requires code review

### Total Estimated Time
- **Sequential:** 2-3 hours
- **Parallel:** 1-1.5 hours (with multiple agents)

## 🧪 Testing and Validation Plan

### Documentation Validation
1. **Link Checking:** Verify all internal and external links
2. **Code Example Testing:** Run all code examples
3. **Reference Validation:** Check all references to other documents
4. **Terminology Consistency:** Ensure consistent use of terms

### Style Validation
1. **Formatting Consistency:** Check headings, lists, code blocks
2. **Emoji Usage:** Ensure consistent and appropriate emoji usage
3. **Tone Consistency:** Maintain professional yet approachable tone
4. **Accessibility:** Ensure documentation is accessible

### Technical Validation
1. **API Documentation:** Test all API examples against actual code
2. **CLI Examples:** Test all CLI commands in documentation
3. **Installation Instructions:** Test all installation methods
4. **Code Snippets:** Verify all code snippets work

## 📊 Success Metrics

### Documentation Quality
- [ ] 100% of remaining Phase 2 documents created
- [ ] 100% of code examples tested and working
- [ ] 100% of links validated
- [ ] 100% of style guidelines followed
- [ ] Consistent formatting across all documents

### Business Value
- [ ] CONTRIBUTING.md enables easy developer onboarding
- [ ] CODE_OF_CONDUCT.md establishes clear community standards
- [ ] SECURITY.md provides comprehensive vulnerability reporting
- [ ] API documentation enables programmatic usage

### Technical Quality
- [ ] All documentation is accurate and up-to-date
- [ ] TypeScript definitions match API documentation
- [ ] No broken references or links
- [ ] Consistent terminology throughout

## 🚀 Post-Execution Steps

### Integration
1. Update README.md to link to new documents
2. Update package.json files array if needed
3. Update CHANGELOG.md with documentation additions
4. Create GitHub issue templates if not present

### Monitoring
1. Monitor GitHub issues for documentation feedback
2. Track API usage patterns
3. Gather community feedback
4. Plan documentation updates for future releases

## 📞 Agent Recommendations

### For CODE_OF_CONDUCT.md
**Community Manager Agent** - Standard template, minimal customization needed.

### For CONTRIBUTING.md
**Documentation Agent** - Focus on developer experience and community building.

### For SECURITY.md
**Security Policy Agent** - Expertise in vulnerability disclosure and security best practices.

### For API Documentation
**API Documentation Agent** - Expertise in developer documentation and TypeScript.

---

**Plan Author:** Max 🐶  
**Date:** 2026-05-02  
**Status:** ✅ Ready for Execution  
**Next Step:** Begin parallel execution of all four tasks

**📚 For a consolidated execution plan, see `PHASE2_FINAL_EXECUTION_PLAN.md`**