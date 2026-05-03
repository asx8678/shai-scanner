# Frequently Asked Questions

Welcome to the shai-scanner FAQ! This comprehensive guide answers the top 20 questions about shai-scanner.

## 📚 Table of Contents

1. [General Questions](#-general-questions) - What is shai-scanner?
2. [Installation & Setup](#-installation--setup) - How to install and configure
3. [Scanning & Analysis](#-scanning--analysis) - Running scans and interpreting results
4. [CI/CD Integration](#-cicd-integration) - GitHub Actions, quality gates, SARIF
5. [Troubleshooting](#-troubleshooting) - Common issues and solutions
6. [Security & Privacy](#-security--privacy) - Data handling and security features
7. [Contributing](#-contributing) - How to contribute
8. [Community](#-community) - Support and resources
9. [Future Plans](#-future-plans) - Roadmap and updates
10. [Contact & Support](#-contact--support) - Getting help

---

## 🚀 General Questions

### 1. What is shai-scanner?
Shai-scanner is a **dependency-light security scanner** for detecting npm supply-chain attacks:
- **Shai-Hulud** malware patterns (versions 1.0, 2.0, 3.0)
- **Mini Shai-Hulud** variants (April 2026 npm packages)
- Suspicious packages and malicious dependencies
- Supply-chain attack indicators and artifacts

Built with **zero runtime dependencies** to minimize attack surface. Analyzes `node_modules`, lockfiles, and package manifests.

**Key Features:**
- Fast, offline-capable scanning
- Live advisory queries (OSV.dev, GitHub Advisory Database)
- HTML reports, SBOM generation, multi-project scanning

### 2. How does shai-scanner differ from other scanners?
| Feature | shai-scanner | Other Scanners |
|---------|-------------|----------------|
| **Dependencies** | Zero runtime | Often many dependencies |
| **Offline Mode** | Full support | Usually requires internet |
| **Supply-Chain Focus** | npm-specific | General vulnerability scanning |
| **Performance** | Optimized | Can be slow |
| **Output Formats** | JSON, SARIF, HTML, SBOM | Limited formats |
| **Multi-Project** | Built-in | Often requires scripting |

**Unique Advantages:**
- Zero dependencies eliminate transitive risks
- Conservative matching catches suspicious ranges
- Artifact detection for `.dev-env`, `.claude/settings.json`
- Live advisory mode checks exact versions

### 3. What are the main features?
**Core Scanning:**
- `node_modules`, lockfiles (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `bun.lock`)
- Package manifests, workspaces, monorepos

**Detection:**
- Known malicious packages/versions
- Suspicious lifecycle scripts
- Artifact persistence files
- GitHub Actions anomalies
- Custom IOC lists

**Output:**
- Interactive HTML reports with charts
- JSON for programmatic use
- SARIF for GitHub integration
- SPDX 2.3 SBOM generation

**Advanced:**
- Multi-project scanning with parallel execution
- Live queries against OSV.dev/GitHub
- Custom CSV imports
- TUI (Terminal User Interface)

### 4. Is shai-scanner free to use?
**Yes!** Completely free and open-source under MIT license:
- Personal and commercial use
- Modification and distribution
- CI/CD integration
- No restrictions

**Only costs:** Setup time (minimal), optional network bandwidth for live queries.

### 5. What are the system requirements?
**Minimum:**
- **Node.js**: 18+ (LTS recommended)
- **npm**: Any recent version
- **OS**: Windows, macOS, or Linux
- **Disk**: <100MB, **Memory**: <512MB

**Optional:** Git, network access, Unicode terminal for TUI.

---

## ⚙️ Installation & Setup

### 6. How do I install shai-scanner?
**Option 1: Global (Recommended)**
```bash
npm install -g shai-scanner
shai-scanner --version
```

**Option 2: npx (No Install)**
```bash
npx shai-scanner --help
npx shai-scanner --scan .
```

**Option 3: From Source**
```bash
git clone https://github.com/asx8678/shai-scanner.git
cd shai-scanner
npm install -g .
node src/cli.js --help
```

### 7. Do I need Node.js?
**Yes, Node.js 18+ required.** Uses ES modules, async/await.

**Check version:**
```bash
node --version
```

**Install if needed:**
- Download from [nodejs.org](https://nodejs.org/)
- Or use version manager:
  ```bash
  nvm install 18 && nvm use 18
  # or
  fnm install 18 && fnm use 18
  ```

### 8. Can I use shai-scanner offline?
**Yes! Core feature for:**
- Forensic investigations
- Deterministic CI/CD runs
- Secure/air-gapped environments

**Usage:**
```bash
# Update while online first
shai-scanner --update

# Then scan offline
shai-scanner --scan . --offline
shai-scanner --scan . --no-auto-update --offline
```

**Works offline:** IOC database, lockfiles, manifests, artifacts, custom CSVs.
**Requires network:** Live queries, database updates.

### 9. How do I configure shai-scanner?
**Basic:**
```bash
shai-scanner --scan .                    # Current directory
shai-scanner --scan /path/to/project     # Specific path
shai-scanner --scan . --offline          # Offline mode
```

**Output:**
```bash
shai-scanner --scan . --json > results.json
shai-scanner --scan . --sarif --output shai-scanner.sarif
shai-scanner --scan . --html -o report.html
shai-scanner --scan . --sbom -o bill-of-materials.spdx.json
```

**Advanced:**
```bash
shai-scanner --scan . --lockfiles-only   # Fastest scan
shai-scanner --check package@version     # Check specific package
shai-scanner --scan . --live --fail-on-advisory
shai-scanner --import-csv ./internal-iocs.csv --scan .
shai-scanner --multi-scan projects.txt --parallel --concurrency 8
```

**No config files** (YAGNI) - all via CLI flags for transparency.

---

## 🔍 Scanning & Analysis

### 10. How do I run my first scan?
```bash
# 1. Install
npm install -g shai-scanner

# 2. Navigate to project
cd /path/to/project

# 3. Run scan
shai-scanner --scan .

# 4. Check results (exit code: 0=clean, 1=findings, 2=error)
```

**Recommended workflow:**
```bash
shai-scanner --scan . --lockfiles-only   # Start here (safest)
shai-scanner --scan .                     # Full scan if clean
shai-scanner --scan . --html -o report.html  # Generate report
```

### 11. What do severity levels mean?
| Severity | Meaning | Action |
|----------|---------|--------|
| **CRITICAL** 🔴 | Known malicious package | Immediate removal |
| **HIGH** 🟠 | Strong compromise indicator | Remove and investigate |
| **MEDIUM** 🟡 | Suspicious pattern | Review and assess |
| **LOW** 🟢 | Minor concern | Monitor |
| **INFO** ⚪ | Informational | No action |

**Finding types:** Package matches, version ranges, artifacts, scripts.

### 12. How do I interpret results?
**Output example:**
```
📦 Found 3 findings:
1. CRITICAL: malicious-package@1.2.3 (Shai-Hulud 2.0)
2. HIGH: @cap-js/sqlite@2.2.2 (Mini Shai-Hulud)
3. MEDIUM: suspicious-file.js (Artifact detection)
```

**Key info:** Package, version, type, source, recommended action.

**Exit codes:**
- `0`: Clean
- `1`: Findings detected
- `2`: Error during scan
- `3`: Database update failed
- `4`: Invalid arguments

**Action:** Remove Critical/High immediately, review Medium, monitor Low.

### 13. Can I scan multiple projects?
**Yes! Built-in multi-project scanning:**

```bash
# Create project list
# projects.txt (one path per line)
/home/user/project-a
/home/user/project-b
./monorepo/packages/*/package.json

# Scan all
shai-scanner --multi-scan projects.txt
shai-scanner --multi-scan projects.txt --parallel --concurrency 8
shai-scanner --multi-scan projects.txt --json > all-results.json
```

**Supports:** Absolute/relative paths, glob patterns, comments, blank lines.

---

## 🔄 CI/CD Integration

### 14. How do I integrate with GitHub Actions?
**Quick setup:**
```bash
shai-scanner --init-ci > .github/workflows/shai-scanner.yml
```

**Complete workflow:**
```yaml
name: Shai-Hulud supply-chain scan
on: [push, pull_request, workflow_dispatch]
jobs:
  shai-scanner:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci --ignore-scripts
      - run: npx shai-scanner --scan . --live --fail-on-advisory --sarif --output shai-scanner.sarif
      - uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: shai-scanner.sarif
```

### 15. What are quality gates?
**Automated checks that block deployments on security issues:**

```bash
# Fail on any advisory
shai-scanner --scan . --live --fail-on-advisory

# Fail on critical findings
if shai-scanner --scan . --json > results.json; then
  CRITICAL=$(cat results.json | jq '.findings | map(select(.severity == "CRITICAL")) | length')
  [ "$CRITICAL" -gt 0 ] && exit 1
fi

# Fail on warnings
shai-scanner --scan . --fail-on-warning
```

**Benefits:** Prevents vulnerabilities, enforces policies, provides feedback.

### 16. How do I generate SARIF reports?
```bash
# Basic SARIF
shai-scanner --scan . --sarif --output shai-scanner.sarif

# With live queries
shai-scanner --scan . --live --sarif --output shai-scanner.sarif

# For GitHub Actions
npx shai-scanner --scan . --sarif --output ${{ github.workspace }}/shai-scanner.sarif
```

**Benefits:** Standard format, GitHub integration, IDE support, compliance.

---

## 🛠️ Troubleshooting

### 17. What if shai-scanner isn't working?
**Step 1: Check requirements**
```bash
node --version           # Should be 18+
shai-scanner --version
shai-scanner --help
```

**Step 2: Common fixes:**

**"Command not found"**
```bash
npm install -g shai-scanner
# or use npx
```

**"Permission denied"**
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

**Slow scans**
```bash
shai-scanner --scan . --offline --lockfiles-only
```

**Step 3: Get help**
- Run with `--verbose`
- Check [Troubleshooting Guide](../../docs/TROUBLESHOOTING.md)
- Search [existing issues](https://github.com/asx8678/shai-scanner/issues)

### 18. Where can I find help?
**Documentation:**
- [Troubleshooting Guide](../../docs/TROUBLESHOOTING.md)
- [API Documentation](../../docs/API.md)
- [TUI Usage Guide](../../docs/TUI_USAGE_GUIDE.md)

**Community:**
- [GitHub Discussions](https://github.com/asx8678/shai-scanner/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/shai-scanner)
- [Twitter/X](https://x.com/shaiscanner)

**Bug Reports:**
- [Issue Tracker](https://github.com/asx8678/shai-scanner/issues)
- [Bug Report Template](../ISSUE_TEMPLATE/bug_report.md)

**Security Issues:**
- [Security Policy](../../SECURITY.md)
- security@shai-scanner.dev

---

## 🔒 Security & Privacy

### 19. Does shai-scanner collect my data?
**No!** Designed with privacy in mind:

**Does NOT collect:**
- ❌ Source code or file contents
- ❌ Personal information
- ❌ Telemetry or usage data
- ❌ Secrets or credentials

**Optional sends (with network):**
- ✅ Package names/versions (live queries)
- ✅ IOC updates (`--update`)

**Privacy controls:**
```bash
shai-scanner --scan . --offline           # No data sent
shai-scanner --scan . --no-auto-update   # Disable updates
shai-scanner --scan . --lockfiles-only   # Fastest, no network
```

### 20. How does shai-scanner ensure security?
**Supply Chain:**
- Zero dependencies = no transitive risks
- Minimal attack surface (Node.js built-ins only)
- 174+ automated tests

**Data:**
- Local processing only
- No cloud dependencies
- HTTPS-only updates
- Private file permissions

**Code:**
- ES Modules, input validation
- TypeScript definitions available

**Operations:**
- Responsible disclosure
- Regular security updates
- NTIA, EU CRA, SPDX compliance

---

## 🤝 Contributing

### How can I contribute?
**Types:** Bug reports, features, docs, tests, translations, UI/UX.

**Getting started:**
1. Read [Contributing Guide](../../CONTRIBUTING.md)
2. Check [good first issues](https://github.com/asx8678/shai-scanner/labels/good%20first%20issue)
3. Join [Discussions](https://github.com/asx8678/shai-scanner/discussions)
4. Follow [Code of Conduct](../../CODE_OF_CONDUCT.md)

**Development:**
```bash
git clone https://github.com/YOUR_USERNAME/shai-scanner.git
cd shai-scanner
npm install
npm test
npm run tui
```

**Guidelines:** Zero dependencies, tests required, docs updated, follow patterns.

**Recognition:** Comprehensive [Contributor Recognition Program](CONTRIBUTOR_RECOGNITION.md) with badges, rewards, and public recognition!

---

## 🎉 Community

### What community resources are available?
**GitHub:**
- [Discussions](https://github.com/asx8678/shai-scanner/discussions) - Ask, share, showcase
- [Issues](https://github.com/asx8678/shai-scanner/issues) - Bugs, features
- Templates: Q&A, Feature Request, Showcase, Contributor Nomination

**Events:**
- Community calls, security workshops
- Contributor bounties, Hacktoberfest

**Social:**
- Twitter/X: [@shaiscanner](https://x.com/shaiscanner)
- Star the repo!

**Getting help:** Search discussions → Check FAQ → Read docs → Ask → Open issue.

---

## 🗺️ Future Plans

### What's on the roadmap?
**Near-term (3 months):**
- Enhanced TUI, expanded IOCs
- IDE plugins (VS Code, JetBrains)
- Performance improvements

**Medium-term (3-6 months):**
- Python, Ruby, Go support
- Cloud integration (AWS, Azure, GCP)
- Risk scoring, team features

**Long-term (6+ months):**
- AI-powered analysis
- Real-time monitoring
- Compliance automation (SOC 2, PCI DSS, HIPAA)
- Enterprise features (SSO, RBAC)

**Influence roadmap:** Vote on issues, submit proposals, contribute code, share use cases.

**Schedule:** Patches as needed, minors every 2-3 months, majors annually.

---

## 📞 Contact & Support

### How do I get help?
**Self-service:**
1. [FAQ](FAQ.md) (this document)
2. [Troubleshooting Guide](../../docs/TROUBLESHOOTING.md)
3. [API Docs](../../docs/API.md)
4. [Examples](../../examples/)

**Community:**
1. [GitHub Discussions](https://github.com/asx8678/shai-scanner/discussions) - Best for questions
2. [Stack Overflow](https://stackoverflow.com/questions/tagged/shai-scanner)
3. [Twitter/X](https://x.com/shaiscanner)

**Bug Reports:**
- [Issue Tracker](https://github.com/asx8678/shai-scanner/issues)
- [Bug Report Template](../ISSUE_TEMPLATE/bug_report.md)

**Security Issues:**
- [Security Policy](../../SECURITY.md)
- security@shai-scanner.dev
- GitHub Security Advisories

**Enterprise:** support@shai-scanner.dev (priority support, custom development)

**Response times:** Discussions 24-48h, bugs 3 days, security 48h (see SLA).

**When contacting:** Include Node.js version, OS, command, error, reproduction steps.

---

## 📝 Still Have Questions?

1. **Search discussions** - Might already be answered
2. **Check docs** - Comprehensive guides available
3. **Start discussion** - Use Q&A template
4. **Join community** - Meet other users

---

*Last updated: 2026-05-02 | Found an issue? [Edit this FAQ](https://github.com/asx8678/shai-scanner/edit/main/.github/community/FAQ.md)*