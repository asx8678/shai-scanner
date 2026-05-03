# 🎉 Shai-Scanner v4.6.0 Release Announcement

**Release Date:** May 2, 2026  
**Release Type:** Minor Release (Phase 4 Complete)  
**Breaking Changes:** ✅ None - Full backward compatibility maintained  
**Security Updates:** 🔒 Zero runtime dependencies maintained, enhanced security policies

---

## 📋 Changelog Summary

### 🚀 New Features
- **Complete TUI Component Architecture** - Modern, maintainable terminal UI system with 11 migrated components
- **Enhanced Scan Configuration** - All CLI options now available in TUI with 6-section configuration flow
- **Comprehensive Test Suite** - Visual regression, cross-platform, and performance benchmarks
- **Full Documentation** - Usage guides, migration guides, and architecture docs
- **Live Advisory Integration** - OSV.dev + GitHub Advisory Database integration for real-time vulnerability checks
- **Audit Integration** - npm/pnpm/yarn audit support for comprehensive security scanning
- **Scan Tuning** - Max depth, fail on advisory/warning options for fine-grained control

### 🐛 Bug Fixes
- Race conditions in render batching resolved
- Resize handling conflicts fixed
- Component lifecycle cleanup improved
- Legacy file references updated
- Package.json range matching enhanced for better accuracy

### ⚡ Performance Improvements
- Zero runtime dependencies (no React, Ink, Commander, Chalk)
- Optimized render batching with double-buffer differential rendering
- Enhanced VirtualScreen with region tracking and dirty row management
- Performance benchmarks included in test suite

### 🔒 Security Updates
- No runtime dependencies maintained (eliminates supply chain risk)
- Private file permissions for cached IOCs
- Enhanced security policy with vulnerability reporting process
- Offline mode for deterministic CI builds
- Custom IOC import without source modification

### 📚 Documentation Updates
- `CONTRIBUTING.md` - Comprehensive developer contribution guidelines
- `CODE_OF_CONDUCT.md` - Community standards (Contributor Covenant v2.1)
- `SECURITY.md` - Enhanced security policy with vulnerability reporting process
- `docs/API.md` - Complete API documentation for programmatic usage
- `docs/TUI_USAGE_GUIDE.md` - Complete TUI usage guide
- `docs/MIGRATION_GUIDE.md` - Migration from legacy code
- `docs/CROSS_PLATFORM_TESTING.md` - Cross-platform testing documentation
- `ARCHITECTURE.md` - System architecture overview

### ⚠️ Breaking Changes
**None** - Full backward compatibility maintained. All existing imports and usage patterns continue to work.

**Note**: While the TUI architecture has been completely rewritten with a new component system, all legacy APIs remain unchanged. The following changes are internal and do not affect the public API:
- Legacy `src/tui.js` reduced from 942 → 559 lines
- `src/tui-findings.js` removed (imports updated)
- `app.js` split into 4 focused modules (app-config, app-scan, app-results, app-utils)
- `findings.js` split into 2 modules (findings-browse, findings-helpers)

---

## 📦 Installation Instructions

### npm install
```bash
# Install locally in your project
npm install shai-scanner

# Install globally
npm install -g shai-scanner

# Install specific version
npm install shai-scanner@4.6.0
```

### yarn add
```bash
# Add to your project
yarn add shai-scanner

# Add globally
yarn global add shai-scanner

# Add specific version
yarn add shai-scanner@4.6.0
```

### Global Installation
```bash
# Using npm
npm install -g shai-scanner

# Using yarn
yarn global add shai-scanner

# Verify installation
shai-scanner --version
```

### Local Installation
```bash
# In your project directory
npm install shai-scanner --save-dev

# Or with yarn
yarn add shai-scanner --dev
```

### Version Pinning
```bash
# In package.json
{
  "dependencies": {
    "shai-scanner": "4.6.0"
  }
}

# Or with range
{
  "dependencies": {
    "shai-scanner": "^4.6.0"
  }
}
```

---

## 🚀 Quick Start Guide

### Basic Usage Example
```bash
# Scan current directory
shai-scanner --scan .

# Scan with offline mode (deterministic)
shai-scanner --scan . --offline --no-auto-update

# Scan lockfiles only (safest first check)
shai-scanner --lockfiles-only --scan .
```

### Common Commands
```bash
# Check a single package
shai-scanner --check @asyncapi/parser@3.4.1
shai-scanner --check intercom-client@7.0.4

# Query live advisories
shai-scanner --scan . --live
shai-scanner --scan . --live-osv
shai-scanner --scan . --live-github

# Update IOC database
shai-scanner --update

# Import custom CSV
shai-scanner --import-csv ./internal-iocs.csv --scan .

# Generate GitHub Actions workflow
shai-scanner --init-ci > .github/workflows/shai-scanner.yml
```

### Configuration Options
```bash
# Offline mode (no network calls)
shai-scanner --scan . --offline --no-auto-update

# Live advisory mode
shai-scanner --scan . --live --fail-on-advisory

# Limit live queries for large repos
shai-scanner --scan . --live --live-limit 1000

# Custom IOC import
shai-scanner --import-csv ./custom-iocs.csv --scan .

# Audit integration
shai-scanner --scan . --audit
```

### Output Formats
```bash
# JSON output
shai-scanner --scan . --json > shai-scan.json

# SARIF output for GitHub code scanning
shai-scanner --scan . --sarif --output shai-scanner.sarif

# Default table output
shai-scanner --scan .
```

### Programmatic Usage
```javascript
import { VulnerabilityDatabase, Scanner, queryLiveAdvisories } from 'shai-scanner';

// Initialize database
const db = new VulnerabilityDatabase({ offline: true });
const scanner = new Scanner(db);

// Scan directory
const result = await scanner.scan(['.'], {
  includeNodeModules: true,
  includeLockfiles: true,
  includeManifests: true,
  includeIocFiles: true
});

// Optional: run live lookups
const live = await queryLiveAdvisories(result.inventory, { 
  sources: ['osv', 'github'] 
});

console.log(result.findings, live.findings);
```

---

## ✨ Key Features Highlight

### 🚫 Zero Runtime Dependencies
- No React, Ink, Commander, Chalk, or transitive install risk
- Pure Node.js implementation using built-ins only
- Eliminates supply chain attack surface

### 📊 174+ Security Databases
- Datadog IOC files (Shai-Hulud 2.0/3.0)
- Mini Shai-Hulud npm packages (April 2026 coverage)
- OSV.dev integration
- GitHub Advisory Database
- Custom IOC support via CSV import

### 🖥️ TUI Dashboard
- Modern, maintainable terminal UI system
- 11 migrated components with new architecture
- Interactive scan configuration
- Real-time progress tracking
- Findings browser with filtering

### 🔄 CI/CD Integration
- JSON and SARIF output formats
- GitHub Actions workflow generation
- Exit codes for CI pipelines
- Deterministic offline mode
- Custom IOC import for enterprise use

### 🌐 Cross-Platform Support
- Windows, macOS, and Linux compatibility
- Node.js 18+ required
- Binary lockfile detection (bun.lockb)
- Unicode and emoji support in TUI

---

## 🔄 Migration Guide

### From Previous Version (4.5.0 to 4.6.0)

#### Breaking Changes
**None** - The new architecture maintains full backward compatibility. All existing imports and usage patterns continue to work.

#### What Changed (Internal Improvements)
1. **TUI Architecture Rewrite** - Complete overhaul of terminal UI system
2. **Module Reorganization** - Several source files split or reorganized
3. **New Component System** - Modern component architecture with lifecycle management

#### Migration Steps (Optional but Recommended)
1. **Update your dependencies**:
   ```bash
   npm install shai-scanner@4.6.0
   # or
   yarn upgrade shai-scanner@4.6.0
   ```

2. **Optional: Update imports** (both work):
   ```javascript
   // Legacy imports still work
   import { SelectMenu } from 'shai-scanner/tui.js'
   
   // New imports (recommended)
   import { SelectMenu } from 'shai-scanner/tui'
   ```

3. **Optional: Use lifecycle methods** (recommended):
   ```javascript
   // Before
   const menu = new SelectMenu(options)
   menu.reader = new KeyReader()
   menu.setupResizeHandler()
   
   // After (recommended)
   const menu = new SelectMenu(options)
   menu.mount()      // Automatic setup
   menu.unmount()    // Automatic cleanup
   ```

#### Deprecation Notices
- Legacy TUI components deprecated (still functional but not recommended)
- Direct imports from removed files will cause errors

#### Upgrade Path
1. Update package.json dependency
2. Run `npm install` or `yarn install`
3. Test existing scan commands
4. Explore new TUI features with `npm run tui`
5. Update CI/CD pipelines if using custom configurations

---

## 🤝 Community and Support

### 💬 GitHub Discussions
- **Q&A**: For questions about shai-scanner usage
- **Feature Requests**: For suggesting improvements
- **Showcase**: For sharing your projects using shai-scanner
- **Community**: General discussion and feedback

### 🐛 Issue Tracker
- **Bug Reports**: Detailed issue templates provided
- **Feature Requests**: Structured submission process
- **Security Issues**: Private reporting via security@shai-scanner.dev

### 📝 Contributing Guidelines
- Comprehensive `CONTRIBUTING.md` with clear onboarding process
- Code of Conduct based on Contributor Covenant v2.1
- Recognition program for contributors (Bronze → Diamond levels)
- Good first issues labeled for new contributors

### 📚 Code of Conduct
- Contributor Covenant v2.1 adopted
- Inclusive community standards enforced
- Clear enforcement guidelines

---

## 🙏 Acknowledgments

### 👥 Contributors
- **Core Maintainers**: Security Tools team
- **Community Contributors**: All developers who have contributed code, documentation, or feedback
- **Special Recognition**: Contributors at Bronze, Silver, Gold, Diamond, and Maintainer levels

### 📦 Dependencies
- **Zero runtime dependencies** - Pure Node.js implementation
- **Dev dependencies only**: Testing and development tools
- **Build tools**: Minimal, focused on packaging and testing

### 💬 Community Feedback
- Security researchers who identified vulnerabilities
- Enterprise users who provided enterprise use case feedback
- Open source community members who contributed features and bug fixes

### 🎁 Special Thanks
- **Datadog**: For IOC data and Shai-Hulud research
- **Security Teams**: Aikido, Wiz, StepSecurity, Socket, Upwind for Mini Shai-Hulud coverage
- **npm Community**: For reporting vulnerabilities and providing feedback
- **GitHub**: For platform support and security advisories

---

## 🗺️ Next Steps

### 📅 Roadmap Preview
- **Phase 5**: Enhanced TUI features and enterprise integrations
- **Performance optimizations**: Further benchmark improvements
- **Extended database coverage**: More IOC sources and vulnerability databases
- **IDE integrations**: VSCode, JetBrains plugin development

### 💡 Feature Requests
- Submit via GitHub Issues with `enhancement` label
- Join GitHub Discussions for feature suggestions
- Contribute directly via pull requests

### 🐛 Bug Reports
- Use GitHub Issues with detailed reproduction steps
- Include scanner command, output, and environment details
- Check existing issues before creating new ones

### 🌟 Community Involvement
- **Contributor Recognition**: Join our recognition program
- **Documentation**: Help improve guides and examples
- **Testing**: Contribute test cases and cross-platform validation
- **Security**: Report vulnerabilities through responsible disclosure

---

## 📈 Exit Codes Reference

| Code | Meaning |
|------|---------|
| 0 | No package/version IOCs found |
| 1 | Known malicious package/version found, `--fail-on-advisory` matched live advisories, or `--fail-on-warning` matched suspicious artifacts |
| 2 | Scan/runtime error |
| 3 | Database update failed |
| 4 | Invalid arguments |

---

## 🔗 Useful Links

- **GitHub Repository**: [shai-scanner](https://github.com/security-tools/shai-scanner)
- **npm Package**: [shai-scanner](https://www.npmjs.com/package/shai-scanner)
- **Documentation**: [docs/](./docs/)
- **API Reference**: [docs/API.md](./docs/API.md)
- **Migration Guide**: [docs/MIGRATION_GUIDE.md](./docs/MIGRATION_GUIDE.md)
- **Security Policy**: [SECURITY.md](./SECURITY.md)
- **Contributing**: [CONTRIBUTING.md](./CONTRIBUTING.md)

---

**Thank you for using Shai-Scanner!** 🐕  
*Keeping your npm dependencies safe, one scan at a time.*