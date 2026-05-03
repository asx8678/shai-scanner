# Shai-Scanner v4.6.0 Troubleshooting Guide

> 🐕 Max here! This guide will help you resolve 90% of common issues. Bookmark it, share it, love it!

## Table of Contents

1. [Installation Issues](#1-installation-issues)
2. [Scan Issues](#2-scan-issues)
3. [Output Issues](#3-output-issues)
4. [CI/CD Issues](#4-cicd-issues)
5. [Performance Issues](#5-performance-issues)
6. [Network Issues](#6-network-issues)
7. [Configuration Issues](#7-configuration-issues)
8. [Error Messages](#8-error-messages)

---

## 1. Installation Issues

### 1.1 Node.js Version Compatibility

**Severity: 🔴 Critical**

**Problem:** Scanner fails to start or throws syntax errors on older Node.js versions.

**Symptoms:**
```
SyntaxError: Unexpected token '.'
TypeError: fetch is not a function
```

**Solution:**
```bash
# Check your Node.js version
node --version

# Shai-Scanner v4.6.0 requires Node.js 18 or higher
# Upgrade using nvm (recommended)
nvm install 18
nvm use 18

# Or using fnm
fnm install 18
fnm use 18

# Or download from https://nodejs.org/
```

**Prevention:** Pin your Node.js version in `.nvmrc` or `.node-version`:
```bash
echo "18" > .nvmrc
```

---

### 1.2 Permission Errors on macOS/Linux

**Severity: 🟡 High**

**Problem:** `npm install -g` fails with EACCES errors.

**Symptoms:**
```
npm ERR! code EACCES
npm ERR! syscall open
npm ERR! path /usr/local/lib/node_modules/...
```

**Solution:**
```bash
# Option 1: Fix npm global directory permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Option 2: Use nvm (avoids global permission issues)
nvm install 18
npm install -g shai-scanner

# Option 3: Use sudo (not recommended but works)
sudo npm install -g shai-scanner
```

**Prevention:** Use nvm for Node.js version management - it avoids permission issues entirely.

---

### 1.3 Global vs Local Installation Issues

**Severity: 🟡 Medium**

**Problem:** `shai-scanner` command not found after installation.

**Symptoms:**
```bash
$ shai-scanner --scan .
shai-scanner: command not found
```

**Solution:**
```bash
# Verify global installation location
npm root -g
npm bin -g

# Check if shai-scanner is in global packages
npm list -g shai-scanner

# Add global bin to PATH if needed
export PATH="$(npm bin -g):$PATH"

# Or use npx (no global install needed)
npx shai-scanner --scan .
```

**Tip:** For local projects, prefer `npx shai-scanner` over global installation.

---

### 1.4 npx vs npm install Differences

**Severity: 🟢 Low**

**Problem:** Confusion about when to use npx vs npm install.

**Solution:**
```bash
# npx: Run without installing (one-time use)
npx shai-scanner --scan .

# npm install -g: Install globally (repeated use)
npm install -g shai-scanner
shai-scanner --scan .

# npm install: Install locally in project
npm install shai-scanner
npx shai-scanner --scan .
# Or add to scripts in package.json
```

**Recommendation:** Use `npx` for CI/CD pipelines and one-off scans. Use global install for development machines.

---

### 1.5 Windows-Specific Issues

**Severity: 🟡 Medium**

**Problem:** Path issues, permission errors, or PowerShell execution policy restrictions.

**Symptoms:**
```
File cannot be loaded because running scripts is disabled on this system
```

**Solution:**
```powershell
# Fix PowerShell execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or use Command Prompt instead
cmd /c "shai-scanner --scan ."

# Use npx to avoid PATH issues
npx shai-scanner --scan .

# Verify Node.js installation
node --version
npm --version
```

**Prevention:** Install Node.js using the official MSI installer which handles PATH configuration.

---

### 1.6 Package Already Installed but Outdated

**Severity: 🟢 Low**

**Problem:** Running an older version after update.

**Solution:**
```bash
# Check current version
shai-scanner --version

# Force update global installation
npm install -g shai-scanner@latest

# Clear npm cache if needed
npm cache clean --force
npm install -g shai-scanner@latest
```

---

## 2. Scan Issues

### 2.1 "No package.json found" Error

**Severity: 🟡 High**

**Problem:** Scanner can't find project root.

**Symptoms:**
```
Warning: No package.json found in scanned paths
```

**Solution:**
```bash
# Scan specific directory containing package.json
shai-scanner --scan /path/to/project

# Scan current directory explicitly
shai-scanner --scan .

# Scan lockfiles only (doesn't require package.json)
shai-scanner --scan . --lockfiles-only

# Check what files are being scanned
shai-scanner --scan . --json | jq '.summary'
```

**Prevention:** Always run scanner from project root or specify the correct path.

---

### 2.2 Scan Timeout on Large Repositories

**Severity: 🟡 High**

**Problem:** Scan hangs or takes excessively long on large codebases.

**Symptoms:**
- Scan appears to hang
- Process uses high CPU for extended period
- Memory usage keeps increasing

**Solution:**
```bash
# Limit scan depth
shai-scanner --scan . --max-depth 3

# Scan lockfiles only (much faster)
shai-scanner --scan . --lockfiles-only

# Disable node_modules scanning
shai-scanner --scan . --no-node-modules

# Scan specific subdirectory
shai-scanner --scan ./src

# Skip IOC file scanning
shai-scanner --scan . --no-ioc-files
```

**Prevention:** Use `--lockfiles-only` in CI/CD for fastest scans.

---

### 2.3 Memory Issues with Large Dependency Trees

**Severity: 🟠 High**

**Problem:** Node.js runs out of memory scanning large projects.

**Symptoms:**
```
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory
```

**Solution:**
```bash
# Increase Node.js memory limit
node --max-old-space-size=4096 node_modules/shai-scanner/src/cli.js --scan .

# Or for global installation
NODE_OPTIONS="--max-old-space-size=4096" shai-scanner --scan .

# Disable node_modules scanning (reduces memory usage)
shai-scanner --scan . --no-node-modules

# Scan lockfiles only
shai-scanner --scan . --lockfiles-only
```

**Prevention:** For CI/CD, set `NODE_OPTIONS` in your workflow environment.

---

### 2.4 Lockfile Parsing Errors

**Severity: 🟡 Medium**

**Problem:** Scanner fails to parse lockfiles.

**Symptoms:**
```
Warning: Failed to parse package-lock.json
Warning: Invalid lockfile format
```

**Solution:**
```bash
# Regenerate lockfile
rm package-lock.json
npm install

# For pnpm
rm pnpm-lock.yaml
pnpm install

# For yarn
rm yarn.lock
yarn install

# Verify lockfile integrity
npm ci  # Clean install using lockfile

# Scan without lockfiles
shai-scanner --scan . --no-lockfiles
```

**Prevention:** Don't manually edit lockfiles. Use your package manager to manage them.

---

### 2.5 Permission Denied Errors

**Severity: 🟡 High**

**Problem:** Scanner can't read certain files or directories.

**Symptoms:**
```
Error: EACCES: permission denied, scandir '/some/path'
```

**Solution:**
```bash
# Fix directory permissions
chmod -R 755 /path/to/project

# Or run scanner with appropriate user
sudo shai-scanner --scan /path/to/project

# Scan specific accessible directories
shai-scanner --scan ./src

# Skip problematic directories
shai-scanner --scan . --no-node-modules
```

**Prevention:** Ensure your user has read access to all project directories.

---

### 2.6 Scan Finds Nothing

**Severity: 🟢 Low**

**Problem:** Scanner runs but reports no findings in a project you know has issues.

**Symptoms:**
```
✓ No findings — all clear!
```

**Solution:**
```bash
# Verify scan configuration
shai-scanner --scan . --json | jq '.summary'

# Enable all scan phases
shai-scanner --scan . --node-modules --lockfiles --manifests --ioc-files

# Run with debug output
DEBUG=1 shai-scanner --scan .

# Check if files exist
ls -la node_modules/
ls package-lock.json
```

---

## 3. Output Issues

### 3.1 JSON Output Not Valid

**Severity: 🟡 Medium**

**Problem:** JSON output is malformed or can't be parsed.

**Symptoms:**
```bash
$ shai-scanner --scan . --json | jq .
parse error: Invalid numeric literal at line 1, column 1
```

**Solution:**
```bash
# Redirect to file first
shai-scanner --scan . --json > scan-results.json

# Validate JSON
cat scan-results.json | jq .

# Check if stderr is mixed with stdout
shai-scanner --scan . --json 2>/dev/null | jq .

# Use quiet mode to suppress warnings
shai-scanner --scan . --json --quiet > scan-results.json
```

**Prevention:** Always use `--quiet` with `--json` in automated scripts.

---

### 3.2 SARIF Upload Failures

**Severity: 🟠 High**

**Problem:** SARIF file fails to upload to GitHub or other platforms.

**Symptoms:**
```
Error: SARIF upload failed
Invalid SARIF format
```

**Solution:**
```bash
# Generate SARIF file
shai-scanner --scan . --sarif --output results.sarif

# Validate SARIF structure
cat results.sarif | jq '.version'

# Ensure proper GitHub Actions permissions
# In your workflow.yml:
# permissions:
#   security-events: write

# Test SARIF upload manually
gh api repos/{owner}/{repo}/code-scanning/sarifs \
  -H "Accept: application/vnd.github+json" \
  -F ref=refs/heads/main \
  -F commit_sha=$(git rev-parse HEAD) \
  -F sarif=@results.sarif
```

**Prevention:** Always validate SARIF output before uploading.

---

### 3.3 HTML Report Generation Issues

**Severity: 🟡 Medium**

**Problem:** HTML report is blank or corrupted.

**Symptoms:**
- Empty HTML file
- Browser shows parsing errors
- Missing styles or scripts

**Solution:**
```bash
# Generate HTML report
shai-scanner --scan . --html --output report.html

# Verify file was created
ls -la report.html

# Check file size (should be > 10KB)
wc -c report.html

# Open in browser to verify
open report.html  # macOS
xdg-open report.html  # Linux
start report.html  # Windows
```

**Prevention:** Ensure you have write permissions to the output directory.

---

### 3.4 Custom IOC CSV Format Problems

**Severity: 🟡 Medium**

**Problem:** Custom IOC file not loading or parsing correctly.

**Symptoms:**
```
Warning: Failed to import custom IOCs
Error: Invalid CSV format
```

**Solution:**
```bash
# Expected CSV format (one IOC per line):
# name,version,type,severity
# malicious-package,1.0.0,critical,package
# bad-script.js,*,high,script

# Verify CSV format
head -5 custom-iocs.csv

# Test import
shai-scanner --scan . --import-csv custom-iocs.csv

# Use tab or comma delimiter
shai-scanner --scan . --import-csv custom-iocs.csv --csv-delimiter ","
```

**CSV Format Requirements:**
```
# Headers (optional but recommended)
name,version,type,severity,description

# Example entries
evil-package,1.2.3,critical,package,Known malware
suspicious.js,*,high,script,Malicious script
bad-domain.com,*,medium,network,C2 server
```

---

### 3.5 Output File Not Created

**Severity: 🟡 Medium**

**Problem:** Output file doesn't exist after scan.

**Symptoms:**
```bash
$ shai-scanner --scan . --sarif -o results.sarif
$ ls results.sarif
ls: results.sarif: No such file or directory
```

**Solution:**
```bash
# Check current directory
pwd

# Use absolute path
shai-scanner --scan . --sarif -o /full/path/to/results.sarif

# Ensure directory exists
mkdir -p ./output
shai-scanner --scan . --sarif -o ./output/results.sarif

# Check for errors
shai-scanner --scan . --sarif -o results.sarif 2>&1
```

---

## 4. CI/CD Issues

### 4.1 GitHub Actions Workflow Failures

**Severity: 🟠 High**

**Problem:** Scanner fails in GitHub Actions.

**Symptoms:**
```
Error: shai-scanner: command not found
Error: EACCES: permission denied
```

**Solution:**
```yaml
# .github/workflows/security-scan.yml
name: Security Scan
on: [push, pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run Shai-Scanner
        run: npx shai-scanner --scan . --sarif --output results.sarif
      
      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: results.sarif
```

**Prevention:** Always use `npx` in CI/CD to avoid global installation issues.

---

### 4.2 Quality Gate Not Blocking Merges

**Severity: 🟠 High**

**Problem:** Vulnerabilities found but PR still merges.

**Solution:**
```yaml
# Add fail conditions to your workflow
- name: Run security scan
  run: |
    npx shai-scanner --scan . \
      --sarif \
      --fail-on-advisory \
      --output results.sarif
  
# Or use exit code in workflow
- name: Check scan results
  run: |
    npx shai-scanner --scan . --json > results.json
    if [ $? -eq 1 ]; then
      echo "Vulnerabilities found!"
      exit 1
    fi
```

**Exit Codes Reference:**
| Code | Meaning |
|------|---------|
| 0 | Success (no vulnerabilities) |
| 1 | Vulnerabilities found |
| 2 | Scan error |
| 3 | Update error |
| 4 | Invalid arguments |
| 130 | Interrupted (SIGINT) |

---

### 4.3 SARIF Upload Permission Issues

**Severity: 🟠 High**

**Problem:** Can't upload SARIF to GitHub Security tab.

**Symptoms:**
```
Error: Resource not accessible by integration
403 Forbidden
```

**Solution:**
```yaml
# Ensure proper permissions in workflow
permissions:
  contents: read
  security-events: write
  actions: read

# For pull requests from forks
on:
  pull_request_target:
    branches: [main]
```

**Prevention:** Use `pull_request_target` for fork PRs, but be careful with security.

---

### 4.4 Multi-Project Scanning Failures

**Severity: 🟡 Medium**

**Problem:** Multi-scan fails or misses projects.

**Symptoms:**
```
Error: Multi-scan file not found
Warning: Failed to expand glob pattern
```

**Solution:**
```bash
# Create multi-scan config file
cat > projects.json << 'EOF'
{
  "projects": [
    "./frontend",
    "./backend",
    "./shared-lib"
  ]
}
EOF

# Run multi-scan
shai-scanner --multi-scan projects.json

# Use glob patterns
cat > projects.json << 'EOF'
{
  "projects": [
    "packages/*",
    "services/*/src"
  ]
}
EOF

# Debug multi-scan
shai-scanner --multi-scan projects.json --json | jq '.summary'
```

---

### 4.5 CI Pipeline Timeout

**Severity: 🟡 Medium**

**Problem:** Security scan takes too long in CI/CD.

**Solution:**
```yaml
# Optimize for CI/CD
- name: Fast security scan
  run: |
    npx shai-scanner --scan . \
      --lockfiles-only \
      --no-node-modules \
      --quiet \
      --sarif \
      -o results.sarif

# Or scan only changed files
- name: Scan changes
  run: |
    git diff --name-only HEAD~1 | grep -E '\.(js|json|yaml)$' | \
      xargs npx shai-scanner --check
```

---

## 5. Performance Issues

### 5.1 Slow Scan Times

**Severity: 🟡 Medium**

**Problem:** Scanner takes too long to complete.

**Symptoms:**
- Scan takes > 5 minutes
- High CPU usage
- Process appears stuck

**Solution:**
```bash
# Profile scan time
time shai-scanner --scan .

# Optimize scan phases
shai-scanner --scan . \
  --no-node-modules \
  --max-depth 3 \
  --lockfiles-only

# Scan specific directories
shai-scanner --scan ./src --lockfiles-only

# Use offline mode (skip network calls)
shai-scanner --scan . --offline
```

**Performance Tips:**
1. Use `--lockfiles-only` for CI/CD (10x faster)
2. Limit depth with `--max-depth`
3. Skip `node_modules` when not needed
4. Use `--offline` when IOC database is fresh

---

### 5.2 High Memory Usage

**Severity: 🟠 High**

**Problem:** Scanner consumes excessive memory.

**Solution:**
```bash
# Monitor memory usage
time -v shai-scanner --scan .

# Increase memory limit
NODE_OPTIONS="--max-old-space-size=8192" shai-scanner --scan .

# Reduce memory footprint
shai-scanner --scan . \
  --no-node-modules \
  --lockfiles-only \
  --no-ioc-files

# Scan in batches
shai-scanner --scan ./src --lockfiles-only
shai-scanner --scan ./lib --lockfiles-only
```

---

### 5.3 Large Repository Handling

**Severity: 🟡 Medium**

**Problem:** Scanner struggles with monorepos or large codebases.

**Solution:**
```bash
# Use multi-scan for monorepos
cat > projects.json << 'EOF'
{
  "projects": [
    "packages/core",
    "packages/utils",
    "packages/cli"
  ]
}
EOF
shai-scanner --multi-scan projects.json

# Scan specific workspaces
shai-scanner --scan ./packages/core --lockfiles-only

# Parallel scanning (future feature)
# For now, use background processes
shai-scanner --scan ./packages/a &
shai-scanner --scan ./packages/b &
wait
```

---

### 5.4 Network Timeout Issues

**Severity: 🟡 Medium**

**Problem:** Live advisory queries time out.

**Solution:**
```bash
# Use offline mode
shai-scanner --scan . --offline

# Limit live queries
shai-scanner --scan . --live --live-limit 100

# Skip live queries entirely
shai-scanner --scan . --no-live

# Cache database first
shai-scanner --update
shai-scanner --scan . --offline
```

---

## 6. Network Issues

### 6.1 Corporate Proxy Settings

**Severity: 🟠 High**

**Problem:** Can't fetch IOC database behind corporate proxy.

**Solution:**
```bash
# Configure npm proxy
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Or use environment variables
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080

# Test connectivity
curl -I https://raw.githubusercontent.com

# Run scanner with proxy
shai-scanner --update
shai-scanner --scan . --offline
```

**For NTLM proxies:**
```bash
export HTTP_PROXY=http://user:password@proxy.company.com:8080
export HTTPS_PROXY=http://user:password@proxy.company.com:8080
```

---

### 6.2 Firewall Blocking OSV.dev

**Severity: 🟡 Medium**

**Problem:** Live advisory queries fail due to firewall.

**Solution:**
```bash
# Whitelist these domains:
# - osv.dev
# - api.osv.dev
# - github.com
# - api.github.com

# Test connectivity
curl -I https://osv.dev
curl -I https://api.osv.dev

# Use offline mode if blocked
shai-scanner --scan . --offline

# Use proxy if available
export HTTPS_PROXY=http://proxy:8080
shai-scanner --scan . --live
```

---

### 6.3 Offline Mode Not Working

**Severity: 🟡 Medium**

**Problem:** Scanner tries to make network requests in offline mode.

**Solution:**
```bash
# Ensure database is cached first
shai-scanner --update

# Verify offline flag
shai-scanner --scan . --offline --json | jq '.summary.sources'

# Check cache location
ls -la ~/.shai-scanner/cache/

# Force offline with all network disabled
shai-scanner --scan . \
  --offline \
  --no-live \
  --no-auto-update
```

---

### 6.4 Cache Corruption Issues

**Severity: 🟡 Medium**

**Problem:** Scanner uses stale or corrupted IOC data.

**Solution:**
```bash
# Clear cache
rm -rf ~/.shai-scanner/cache/

# Force fresh download
shai-scanner --update --force

# Verify cache
shai-scanner --list-db

# Check cache age
ls -la ~/.shai-scanner/cache/
```

**Prevention:** Set up automatic cache refresh in CI/CD:
```bash
# At start of CI pipeline
shai-scanner --update || true
```

---

## 7. Configuration Issues

### 7.1 Environment Variable Conflicts

**Severity: 🟡 Medium**

**Problem:** Unexpected behavior due to environment variables.

**Solution:**
```bash
# Check for conflicting variables
env | grep -i shai
env | grep -i scanner

# Common variables and their effects:
# SHAI_SCANNER_OFFLINE=1    - Force offline mode
# SHAI_SCANNER_QUIET=1      - Suppress output
# NO_COLOR=1                - Disable colors

# Reset to defaults
unset SHAI_SCANNER_OFFLINE
unset SHAI_SCANNER_QUIET

# Use command-line flags instead
shai-scanner --scan . --offline --quiet
```

---

### 7.2 Config File Location Issues

**Severity: 🟡 Medium**

**Problem:** Scanner can't find or read config file.

**Solution:**
```bash
# Default config location
ls -la ~/.shai-scanner/config.json

# Create config if missing
mkdir -p ~/.shai-scanner
cat > ~/.shai-scanner/config.json << 'EOF'
{
  "offline": false,
  "autoUpdate": true,
  "maxDepth": 10
}
EOF

# Verify config
shai-scanner --scan . --json | jq '.config'

# Reset config
rm ~/.shai-scanner/config.json
```

---

### 7.3 Custom IOC File Not Loading

**Severity: 🟡 Medium**

**Problem:** Custom IOC CSV not being imported.

**Solution:**
```bash
# Verify file exists
ls -la custom-iocs.csv

# Check file format
head -5 custom-iocs.csv

# Test import
shai-scanner --scan . --import-csv custom-iocs.csv --json | jq '.summary'

# Common format issues:
# 1. No header row required, but if present, must be valid
# 2. Fields: name,version,type,severity,description
# 3. Use comma or tab delimiter

# Debug import
shai-scanner --scan . --import-csv custom-iocs.csv 2>&1 | grep -i import
```

---

### 7.4 Debug Mode Not Working

**Severity: 🟢 Low**

**Problem:** Can't get debug output.

**Solution:**
```bash
# Enable debug mode
DEBUG=1 shai-scanner --scan .

# Or use verbose flag
shai-scanner --scan . --verbose

# Capture debug output
shai-scanner --scan . --json 2>debug.log

# Check scanner version
shai-scanner --version

# Verify installation
which shai-scanner
npm list -g shai-scanner
```

---

### 7.5 TUI Not Displaying Correctly

**Severity: 🟡 Medium**

**Problem:** Terminal UI garbled or not rendering.

**Solution:**
```bash
# Ensure terminal supports ANSI
export TERM=xterm-256color

# Disable colors if needed
export NO_COLOR=1

# Use non-TTY mode
shai-scanner --scan . --json

# Check terminal size
stty size

# Reset terminal
reset
```

---

## 8. Error Messages

### 8.1 Common Error Messages and Solutions

| Error Message | Cause | Solution |
|---------------|-------|----------|
| `No package.json found` | Scanner can't find project root | Run from project root or use `--scan /path` |
| `fetch is not a function` | Node.js < 18 | Upgrade to Node.js 18+ |
| `EACCES: permission denied` | Insufficient permissions | Fix permissions or use sudo |
| `JavaScript heap out of memory` | Large project, low memory | Use `--max-old-space-size=4096` |
| `Multi-scan file not found` | Invalid multi-scan path | Check file path exists |
| `HTTP 403` | Forbidden/permissions | Check network/proxy settings |
| `HTTP 429` | Rate limited | Wait or use `--offline` |
| `Invalid SARIF format` | Malformed SARIF output | Regenerate with `--sarif` |
| `Command not found` | Scanner not installed | Use `npx` or install globally |

---

### 8.2 Exit Code Reference

```bash
# Exit codes (from src/constants.js)
0   - SUCCESS: No vulnerabilities found
1   - VULNERABILITIES_FOUND: Threats detected
2   - SCAN_ERROR: Scanner encountered an error
3   - UPDATE_ERROR: Database update failed
4   - INVALID_ARGS: Invalid command-line arguments
130 - INTERRUPTED: User pressed Ctrl+C (SIGINT)
```

**Usage in scripts:**
```bash
shai-scanner --scan .
exit_code=$?

case $exit_code in
  0) echo "All clear!" ;;
  1) echo "Vulnerabilities found - blocking merge" ; exit 1 ;;
  2) echo "Scan error - check logs" ; exit 2 ;;
  3) echo "Update failed - using cached data" ;;
  4) echo "Invalid arguments - check usage" ; exit 4 ;;
  *) echo "Unknown error: $exit_code" ;;
esac
```

---

### 8.3 Log File Analysis

**Enable verbose logging:**
```bash
# Capture all output
shai-scanner --scan . --json > results.json 2> scan.log

# Analyze logs
grep -i error scan.log
grep -i warning scan.log
grep -i timeout scan.log

# Check database update logs
shai-scanner --update --json 2> update.log
```

**Log file location:**
```bash
# Check for log files
ls -la ~/.shai-scanner/logs/

# View recent logs
tail -f ~/.shai-scanner/logs/scanner.log
```

---

### 8.4 Debug Mode Usage

**Enable comprehensive debugging:**
```bash
# Full debug output
DEBUG=1 shai-scanner --scan . --json 2>debug.log

# Analyze debug output
cat debug.log | grep -E "(scan|find|parse)" | head -50

# Profile performance
time shai-scanner --scan . --lockfiles-only

# Memory profiling
node --expose-gc --max-old-space-size=4096 \
  node_modules/shai-scanner/src/cli.js --scan . 2>memory.log
```

**Debug environment variables:**
```bash
export DEBUG=1              # Enable debug output
export NODE_DEBUG=http      # Debug HTTP requests
export NODE_DEBUG=net       # Debug network connections
```

---

## Quick Reference Commands

### Diagnostic Commands
```bash
# Check installation
shai-scanner --version
node --version
npm --version

# Test basic functionality
shai-scanner --scan . --offline --quiet --json | jq '.summary'

# Verify database
shai-scanner --list-db

# Test network connectivity
shai-scanner --update --json 2>&1 | head -20
```

### Common Fix Commands
```bash
# Reset everything
rm -rf ~/.shai-scanner/cache/
shai-scanner --update
shai-scanner --scan . --offline

# Force reinstall
npm uninstall -g shai-scanner
npm install -g shai-scanner@latest

# Clear npm cache
npm cache clean --force
npm install -g shai-scanner@latest
```

---

## Getting Help

If you're still stuck:

1. **Check the logs**: Enable debug mode and analyze output
2. **Search issues**: [GitHub Issues](https://github.com/your-org/shai-scanner/issues)
3. **Community**: [Discord/Slack channel]
4. **Report bugs**: Include `--json` output and debug logs

---

## Prevention Tips

1. **Always use Node.js 18+** - Check with `node --version`
2. **Use `npx` in CI/CD** - Avoids global installation issues
3. **Cache the database** - Run `shai-scanner --update` periodically
4. **Use `--lockfiles-only`** - Fastest scan mode for CI/CD
5. **Enable `--quiet` with `--json`** - Clean output for automation
6. **Set `NODE_OPTIONS`** - Prevent memory issues in large projects
7. **Test locally first** - Verify scan works before pushing to CI

---

*Last updated: v4.6.0 | Maintained by Shai-Scanner Team*
