# Shai-Scanner v4.6.0 Video Tutorial Script

**Duration:** 10–15 minutes  
**Target Audience:** Developers, DevOps engineers, security teams  
**Video Title:** Shai-Scanner v4.6.0: Stop Supply-Chain Attacks Before They Start  
**Presenter:** [Your Name/Host]  
**Recording Date:** May 2026  

---

## Video Overview & Learning Objectives

By the end of this video, viewers will be able to:

1. Understand what shai-scanner does and why it matters
2. Install and configure shai-scanner
3. Run their first vulnerability scan
4. Interpret scan results and understand severity levels
5. Integrate shai-scanner into CI/CD pipelines

---

## 🎬 Video Script

### INTRODUCTION (0:00–1:00)

**[VISUAL: Animated text on dark background with red accents]**
**[VISUAL: News headlines about npm supply-chain attacks scrolling across screen]**

**NARRATOR (V.O.):**
In 2025, there was a 742% increase in npm supply-chain attacks. Last year, thousands of developers unknowingly installed malicious packages that stole credentials, deployed backdoors, and compromised entire production systems.

**[VISUAL: Quick montage of affected projects, code repositories, security alerts]**

**NARRATOR (V.O.):**
The real problem? Most security tools are bloated, require runtime dependencies that introduce their own attack vectors, and can't run in air-gapped environments where the most sensitive development happens.

**[VISUAL: Shai-Scanner logo appears with clean, modern animation]**

**NARRATOR (V.O.):**
Meet Shai-Scanner v4.6.0—a zero-dependency, offline-capable supply-chain security scanner designed specifically for npm projects. It detects known malicious packages, compromised versions, and suspicious artifacts before they ever make it to production.

**[VISUAL: Terminal showing shai-scanner --help with key features highlighted]**

**NARRATOR (V.O.):**
In the next 10 minutes, I'll show you how to install it, run your first scan, and integrate it into your CI/CD pipeline. Let's dive in.

**[TRANSITION: Quick animation to section title card]**

---

### WHAT IS SHAI-SCANNER? (1:00–3:00)

**[VISUAL: Animated diagram showing supply-chain attack vectors]**

**NARRATOR (V.O.):**
Before we get into installation, let's understand what makes shai-scanner different.

**[VISUAL: Side-by-side comparison of traditional security tools vs shai-scanner]**

**NARRATOR (V.O.):**
Traditional npm security scanners often require React, Ink, Commander, or dozens of other dependencies. Each dependency is a potential attack vector. Shai-scanner has **zero runtime dependencies**. That's right—zero. It's a single, self-contained tool you can trust.

**[VISUAL: Feature icons appearing one by one with brief descriptions]**

**NARRATOR (V.O.):**
Here are the key features:

- **Zero Runtime Dependencies** - No attack surface from your security tool
- **Offline Capability** - Works in air-gapped, classified, and secure environments
- **Multi-Project Scanning** - Scan hundreds of repositories from a single command
- **Live Advisories** - Real-time checks against OSV.dev and GitHub Advisory Database
- **JSON/SARIF Output** - Perfect for CI/CD integration and automated reporting
- **HTML Reports** - Interactive, shareable reports for management and stakeholders
- **Custom IOCs** - Import your own threat intelligence CSV files
- **Broad Lockfile Coverage** - Supports npm, yarn, pnpm, and bun lockfiles

**[VISUAL: Animated list checking off each feature]**

**NARRATOR (V.O.):**
Whether you're a solo developer, part of a DevOps team, or responsible for security across an enterprise, shai-scanner adapts to your workflow.

**[VISUAL: Quick montage of different environments: laptop, server room, CI/CD pipeline]**

**NARRATOR (V.O.):**
It checks not just package versions, but also lockfiles, lifecycle scripts, GitHub Actions workflows, and even suspicious files that malware typically creates.

**[TRANSITION: Section title card "Installation"]**

---

### INSTALLATION (3:00–5:00)

**[VISUAL: Clean terminal window with command prompt]**

**NARRATOR (V.O.):**
Installation is straightforward. You have three options:

**[VISUAL: Command typed out with syntax highlighting]**

**NARRATOR (V.O.):**
**Option 1: Global installation (recommended for regular use)**

```bash
npm install -g shai-scanner
```

**[VISUAL: Installation progress and success message]**

**NARRATOR (V.O.):**
Once installed, you can run shai-scanner from anywhere on your system.

**[VISUAL: Command typed out]**

**NARRATOR (V.O.):**
**Option 2: Run with npx (no installation required)**

```bash
npx shai-scanner --scan .
```

**[VISUAL: npx downloading and running]**

**NARRATOR (V.O.):**
Perfect for trying it out or running one-off scans.

**[VISUAL: Command typed out]**

**NARRATOR (V.O.):**
**Option 3: Run from source (for developers)**

```bash
# Clone the repository
git clone https://github.com/your-org/shai-scanner.git
cd shai-scanner

# Run directly
node src/cli.js --help
```

**[VISUAL: Directory structure shown with src/cli.js highlighted]**

**NARRATOR (V.O.):**
Now let's verify the installation.

**[VISUAL: Command typed out]**

**NARRATOR (V.O.):**

```bash
shai-scanner --version
```

**[VISUAL: Version output "4.6.0" displayed]**

**NARRATOR (V.O.):**
You should see version 4.6.0. Let's also check the help to see all available options.

**[VISUAL: Command typed out]**

**NARRATOR (V.O.):**

```bash
shai-scanner --help
```

**[VISUAL: Help output with key sections highlighted]**

**NARRATOR (V.O.):**
The help output shows all available commands and options. Take a moment to explore it. Now let's run our first scan.

**[TRANSITION: Section title card "First Scan"]**

---

### FIRST SCAN (5:00–8:00)

**[VISUAL: Terminal with a sample npm project open]**

**NARRATOR (V.O.):**
I've created a sample project with a mix of safe and intentionally vulnerable packages for demonstration.

**[VISUAL: cat package.json showing dependencies]**

**NARRATOR (V.O.):**
Let's see what's in our package.json.

**[VISUAL: package.json content displayed]**

**NARRATOR (V.O.):**
Now, let's run shai-scanner on this project.

**[VISUAL: Command typed out with dramatic pause]**

**NARRATOR (V.O.):**

```bash
shai-scanner --scan .
```

**[VISUAL: Scan progress with spinner animation]**

**NARRATOR (V.O.):**
The scan is checking our node_modules, package-lock.json, and package.json for known indicators of compromise.

**[VISUAL: Scan results appear with color-coded severity levels]**

**NARRATOR (V.O.):**
And here are the results. Shai-scanner found several issues. Let's break down what we're seeing.

**[VISUAL: Results highlighted with explanations]**

**NARRATOR (V.O.):**
**Severity Levels:**
- **CRITICAL** - Confirmed malicious package or version. Immediate action required.
- **HIGH** - Strong indicators of compromise. Should be addressed immediately.
- **MEDIUM** - Suspicious artifacts or patterns that warrant investigation.
- **LOW** - Potential issues that may require manual review.
- **INFO** - Informational findings for awareness.

**[VISUAL: Specific finding highlighted with details]**

**NARRATOR (V.O.):**
In this case, we see a CRITICAL finding for a known malicious package. Shai-scanner detected it in our lockfile and flagged the exact version.

**[VISUAL: Terminal showing additional scan options]**

**NARRATOR (V.O.):**
You can also check specific packages before installing them:

**[VISUAL: Command typed out]**

**NARRATOR (V.O.):**

```bash
shai-scanner --check @asyncapi/parser@3.4.1
```

**[VISUAL: Package check result displayed]**

**NARRATOR (V.O.):**
This is perfect for vetting new dependencies before adding them to your project.

**[VISUAL: Lockfile-only scan command]**

**NARRATOR (V.O.):**
For the safest possible check, scan only lockfiles without requiring node_modules:

**[VISUAL: Command typed out]**

**NARRATOR (V.O.):**

```bash
shai-scanner --lockfiles-only --scan .
```

**[VISUAL: Lockfile scan results]**

**NARRATOR (V.O.):**
This doesn't require `npm install` and doesn't execute lifecycle scripts, making it ideal for pre-installation checks.

**[TRANSITION: Section title card "Advanced Features"]**

---

### ADVANCED FEATURES (8:00–12:00)

**[VISUAL: Section header with icons for each feature]**

**NARRATOR (V.O.):**
Shai-scanner isn't just a basic scanner. Let's explore its advanced features.

#### JSON Output (8:15–9:00)

**[VISUAL: Command typed out]**

**NARRATOR (V.O.):**
First, JSON output for automation and integration:

```bash
shai-scanner --scan . --json > shai-scan.json
```

**[VISUAL: JSON output displayed in formatted view]**

**NARRATOR (V.O.):**
The JSON output includes structured data about findings, inventory, and scan metadata. Perfect for piping into other tools or storing for historical analysis.

#### SARIF Output (9:00–9:45)

**[VISUAL: Command typed out]**

**NARRATOR (V.O.):**
For GitHub code scanning integration, use SARIF format:

```bash
shai-scanner --scan . --sarif --output shai-scanner.sarif
```

**[VISUAL: SARIF file content with GitHub code scanning UI mockup]**

**NARRATOR (V.O.):**
SARIF is the standard format for static analysis results. Upload it to GitHub, and your findings appear right in your repository's Security tab.

#### HTML Reports (9:45–10:30)

**[VISUAL: Command typed out]**

**NARRATOR (V.O.):**
Need to share results with management or stakeholders? Generate an interactive HTML report:

```bash
shai-scanner --scan . --html -o report.html
```

**[VISUAL: HTML report opening in browser with features highlighted]**

**NARRATOR (V.O.):**
The HTML report is self-contained, interactive, and includes:
- Executive summary with key metrics
- Visual severity charts
- Detailed findings with expandable sections
- Search and filter capabilities
- Print-friendly layout

**[VISUAL: Scrolling through HTML report features]**

**NARRATOR (V.O.):**
It's perfect for presentations, audits, and sharing with non-technical stakeholders.

#### Custom IOCs (10:30–11:15)

**[VISUAL: CSV file being created]**

**NARRATOR (V.O.):**
Have your own threat intelligence? Import custom IOCs:

```bash
# Create a custom IOC CSV
cat > internal-iocs.csv << EOF
package_name,package_version
malicious-internal-pkg,1.2.3
suspicious-tool,2.1.0
EOF

# Run scan with custom IOCs
shai-scanner --import-csv ./internal-iocs.csv --scan .
```

**[VISUAL: Custom IOCs being applied to scan]**

**NARRATOR (V.O.):**
You can create organization-specific threat lists without modifying shai-scanner's source code.

#### Live Advisory Mode (11:15–12:00)

**[VISUAL: Command typed out with network activity visualization]**

**NARRATOR (V.O.):**
For real-time vulnerability intelligence, enable live advisory mode:

```bash
# Query OSV.dev and GitHub Advisory Database
shai-scanner --scan . --live

# Query only OSV.dev
shai-scanner --scan . --live-osv

# Query only GitHub, including malware advisories
shai-scanner --scan . --live-github

# Make CI fail on live advisories
shai-scanner --scan . --live --fail-on-advisory
```

**[VISUAL: Live advisory results with external sources highlighted]**

**NARRATOR (V.O.):**
Live mode sends exact package names and versions to OSV.dev and/or GitHub. It's intentionally opt-in so offline forensic scans and deterministic CI runs remain possible.

**[VISUAL: Large repository scanning with limit option]**

**NARRATOR (V.O.):**
For large repositories, limit live queries:

```bash
shai-scanner --scan . --live --live-limit 1000
```

**[TRANSITION: Section title card "CI/CD Integration"]**

---

### CI/CD INTEGRATION (12:00–14:00)

**[VISUAL: CI/CD pipeline diagram with shai-scanner integrated]**

**NARRATOR (V.O.):**
Let's integrate shai-scanner into your CI/CD pipeline. This is where it really shines.

#### GitHub Actions Setup (12:15–13:00)

**[VISUAL: Command to generate workflow]**

**NARRATOR (V.O.):**
Shai-scanner can generate a GitHub Actions workflow for you:

```bash
shai-scanner --init-ci > .github/workflows/shai-scanner.yml
```

**[VISUAL: Generated workflow file displayed]**

**NARRATOR (V.O.):**
Or create your own. Here's a comprehensive workflow:

**[VISUAL: Code editor showing GitHub Actions YAML]**

**NARRATOR (V.O.):**

```yaml
name: Shai-Hulud supply-chain scan

on:
  push:
  pull_request:
  workflow_dispatch:

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
      
      - name: Install dependencies safely
        run: npm ci --ignore-scripts
      
      - name: Scan dependency tree
        run: npx shai-scanner --scan . --live --fail-on-advisory --sarif --output shai-scanner.sarif
      
      - name: Upload SARIF to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: shai-scanner.sarif
```

**[VISUAL: GitHub Actions UI showing workflow running]**

**NARRATOR (V.O.):**
This workflow runs on every push and pull request, scanning your dependencies and uploading results to GitHub's Security tab.

#### Quality Gates (13:00–13:45)

**[VISUAL: Pipeline with quality gate visualization]**

**NARRATOR (V.O.):**
For strict security policies, configure quality gates:

```bash
# Fail on any findings
shai-scanner --scan . --json --fail-on warning

# Fail only on critical/high findings
shai-scanner --scan . --json --fail-on critical

# Fail on live advisories
shai-scanner --scan . --live --fail-on-advisory
```

**[VISUAL: Build failing due to security findings]**

**NARRATOR (V.O.):**
When the scanner finds issues matching your threshold, it returns a non-zero exit code, failing the build and preventing compromised code from reaching production.

#### Multi-Project Scanning (13:45–14:00)

**[VISUAL: Multiple repositories being scanned]**

**NARRATOR (V.O.):**
For organizations with multiple repositories:

```bash
# Create a project list
cat > projects.txt << EOF
/path/to/project-a
/path/to/project-b
/path/to/project-c
EOF

# Scan all projects
shai-scanner --multi-scan projects.txt --parallel --concurrency 8 --json
```

**[VISUAL: Consolidated report across projects]**

**NARRATOR (V.O.):**
Shai-scanner scans all projects and produces a consolidated report with findings across your entire organization.

**[TRANSITION: Section title card "Wrap-up"]**

---

### WRAP-UP (14:00–15:00)

**[VISUAL: Key takeaways appearing on screen]**

**NARRATOR (V.O.):**
Let's recap what we covered:

**[VISUAL: Checklist appearing item by item]**

**NARRATOR (V.O.):**

✅ **What shai-scanner does** - Detects supply-chain attacks in npm dependencies  
✅ **Installation** - Three options: global, npx, or source  
✅ **First scan** - Basic scanning and understanding results  
✅ **Advanced features** - JSON, SARIF, HTML reports, custom IOCs, live advisories  
✅ **CI/CD integration** - GitHub Actions, quality gates, multi-project scanning  

**[VISUAL: Resource links and call-to-action]**

**NARRATOR (V.O.):**
Ready to secure your supply chain? Here's how to get started:

1. **Install now**: `npm install -g shai-scanner`
2. **Run a scan**: `shai-scanner --scan .`
3. **Check the docs**: [docs.shai-scanner.dev](https://docs.shai-scanner.dev)
4. **Join the community**: [GitHub Discussions](https://github.com/your-org/shai-scanner/discussions)
5. **Report issues**: [GitHub Issues](https://github.com/your-org/shai-scanner/issues)

**[VISUAL: Social media handles and community links]**

**NARRATOR (V.O.):**
Follow us on Twitter @ShaiScanner for the latest updates, and star the GitHub repository if you find it useful.

**[VISUAL: Closing animation with shai-scanner logo]**

**NARRATOR (V.O.):**
Thanks for watching! Stay secure, and remember—the best time to scan was yesterday. The second best time is now.

**[VISUAL: End screen with subscribe button and related videos]**

**NARRATOR (V.O.):**
Don't forget to subscribe for more security tool tutorials. See you in the next one!

**[FADE TO BLACK]**

---

## 📝 Production Notes

### Visual Elements Checklist

- [ ] Animated text for introduction statistics
- [ ] News headline montage (stock footage)
- [ ] Shai-scanner logo animation
- [ ] Terminal screen recordings
- [ ] Feature comparison diagrams
- [ ] Installation progress animations
- [ ] Scan results visualizations
- [ ] HTML report demo in browser
- [ ] GitHub Actions workflow UI
- [ ] Pipeline diagram animations
- [ ] End screen with subscribe CTA

### Screen Recording Setup

**Terminal Theme:** Dark background, high-contrast text  
**Font:** JetBrains Mono or similar monospace  
**Resolution:** 1920x1080 (1080p)  
**Frame Rate:** 30fps for terminal, 60fps for animations  

### Recording Commands

```bash
# Sample scan for recording
shai-scanner --scan ./test-project --offline --no-auto-update

# JSON output example
shai-scanner --scan ./test-project --json

# HTML report generation
shai-scanner --scan ./test-project --html -o demo-report.html

# Live advisory demo
shai-scanner --scan ./test-project --live
```

### Timing Breakdown

| Section | Duration | Cumulative |
|---------|----------|------------|
| Introduction | 1:00 | 1:00 |
| What is Shai-Scanner | 2:00 | 3:00 |
| Installation | 2:00 | 5:00 |
| First Scan | 3:00 | 8:00 |
| Advanced Features | 4:00 | 12:00 |
| CI/CD Integration | 2:00 | 14:00 |
| Wrap-up | 1:00 | 15:00 |

### Audio Notes

- **Background Music:** Low-key, tech-focused ambient track
- **Volume:** Music at -20dB, voice at 0dB
- **Effects:** Subtle whoosh transitions, click sounds for terminal commands

### Post-Production

- **Color Grading:** Cool tones, slightly desaturated
- **Graphics:** Flat design, minimal shadows
- **Typography:** Clean sans-serif for titles, monospace for code
- **Transitions:** Smooth fades, quick cuts for terminal demos

---

## 🔗 Related Resources

- [Shai-Scanner README](../README.md)
- [Architecture Documentation](../ARCHITECTURE.md)
- [API Documentation](../docs/API.md)
- [TUI Usage Guide](../docs/TUI_USAGE_GUIDE.md)
- [Use Cases](../marketing/USE_CASES.md)
- [GitHub Actions Example](../examples/github-action.yml)

---

**Script Version:** 1.0  
**Last Updated:** May 2026  
**Author:** Shai-Scanner Team  

*This script is production-ready and follows video tutorial best practices. All commands have been tested with shai-scanner v4.6.0.*
