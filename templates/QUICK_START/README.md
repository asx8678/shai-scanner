# Shai-Scanner Quick Start Template

> A ready-to-clone project template that wires up shai-scanner v4.6.0 with GitHub Actions security scanning from the jump. 🚀

## What This Template Gives You

| File | Purpose |
|------|---------|
| `package.json` | Pre-configured with shai-scanner as a devDependency, scan scripts, and example dependencies |
| `.github/workflows/security-scan.yml` | 4-job GitHub Actions workflow: lockfile scan → full scan → quality gate → multi-project scan |
| `.gitignore` | Covers Node.js, IDE files, test output, and shai-scanner cache/artifacts |
| `src/index.js` | Simple Express server demonstrating imports that shai-scanner monitors |
| `src/utils.js` | Utility module with hashing, deep-clone, HTTP, and validation helpers |
| `test/test.js` | Test suite using Node.js built-in test runner |
| `README.md` | This file — full usage guide |

## Quick Start

### Option 1: Clone It

```bash
git clone https://github.com/YOUR_ORG/shai-scanner-quick-start.git my-project
cd my-project
npm install
```

### Option 2: Use as GitHub Template

1. Click **"Use this template"** on the repo page
2. Name your new repository
3. Clone it and run `npm install`

### Option 3: Download a Zip

Grab the zip, unzip it, `npm install`, and you're rolling.

## First Scan

Once installed, run your first scan:

```bash
# Quick offline scan (fastest, no network needed)
npm run scan

# Or run shai-scanner directly
npx shai-scanner --scan . --offline --no-auto-update
```

That's it. You're scanning. 🎉

## Available Scan Commands

| Command | Description |
|---------|-------------|
| `npm run scan` | Quick offline IOC scan (fast, deterministic) |
| `npm run scan:lockfiles` | Scan lockfiles only — no `node_modules` needed |
| `npm run scan:live` | Full scan with live OSV/GitHub advisory lookups |
| `npm run scan:ci` | CI scan that generates SARIF output |
| `npm run scan:html` | Generate interactive HTML report |
| `npm test` | Run the test suite |
| `npm start` | Start the Express server |

## CI/CD Setup

The included GitHub Actions workflow (`.github/workflows/security-scan.yml`) provides:

### Workflow Jobs

1. **🔒 Lockfile Scan** — Fast scan of lockfiles only (blocks PRs quickly)
2. **🔍 Full Security Scan** — Complete scan with SARIF upload to GitHub Security tab
3. **🚦 Quality Gate** — Fails the build on critical/high vulnerabilities
4. **🏢 Multi-Project Scan** — Optional monorepo scanning (manual trigger only)

### Triggers

| Trigger | What Happens |
|---------|-------------|
| Push to `main`/`master` | Full scan with live advisories + SARIF upload |
| Pull request | Lockfile scan + offline full scan |
| Manual dispatch | Choose scan mode: quick / full / live |

### Customizing Severity Thresholds

Edit the quality gate job in the workflow to adjust what blocks merges:

```yaml
# In .github/workflows/security-scan.yml → quality-gate job
CRITICAL=$(cat scan-results.json | grep -c '"severity":"critical"' || true)
HIGH=$(cat scan-results.json | grep -c '"severity":"high"' || true)

# Adjust these thresholds:
if [ "$CRITICAL" -gt 0 ]; then  # Block on ANY critical
  exit 1
fi
if [ "$HIGH" -gt 5 ]; then      # Allow up to 5 high
  exit 1
fi
```

## Shai-Scanner Integration Guide

### Programmatic Usage

You can use shai-scanner as a library in your own tools:

```js
import { VulnerabilityDatabase, Scanner } from 'shai-scanner';

const db = new VulnerabilityDatabase({ offline: true });
const scanner = new Scanner(db);
const result = await scanner.scan(['.'], {
  includeNodeModules: true,
  includeLockfiles: true,
  includeManifests: true,
});

console.log(`Found ${result.findings.length} findings`);
```

### Live Advisory Mode

For the most up-to-date vulnerability data:

```bash
# Query OSV.dev + GitHub Advisory Database
shai-scanner --scan . --live

# Fail CI on live matches
shai-scanner --scan . --live --fail-on-advisory
```

### Custom IOC Import

Add your own indicators of compromise:

```csv
package_name,package_version
@internal/suspicious-pkg,1.0.0
```

```bash
shai-scanner --import-csv ./my-iocs.csv --scan .
```

### Multi-Project Scanning

Scan multiple repos from one command:

```bash
cat > projects.txt << EOF
./packages/api
./packages/web
./packages/shared
EOF

shai-scanner --multi-scan projects.txt --parallel
```

## Project Structure

```
my-project/
├── .github/
│   └── workflows/
│       └── security-scan.yml    # CI/CD security pipeline
├── src/
│   ├── index.js                 # Main application
│   └── utils.js                 # Utility functions
├── test/
│   └── test.js                  # Test suite
├── .gitignore                   # Git ignore rules
├── package.json                 # Dependencies & scripts
└── README.md                    # This file
```

## Customization Checklist

- [ ] Update `package.json` → `name`, `author`, `description`
- [ ] Update `.github/workflows/security-scan.yml` → branch names, severity thresholds
- [ ] Replace `src/index.js` with your actual application code
- [ ] Update `test/test.js` with your real tests
- [ ] Add your own dependencies to `package.json`
- [ ] Set up branch protection rules requiring the security scan job to pass

## Troubleshooting

### "shai-scanner: command not found"

Make sure shai-scanner is installed globally or use npx:

```bash
npm install -g shai-scanner@4.6.0
# or
npx shai-scanner --scan .
```

### "Scan finds too many results"

Start with lockfile-only mode, then work through findings:

```bash
shai-scanner --scan . --lockfiles-only
```

### "GitHub Action fails to upload SARIF"

Make sure your workflow has these permissions:

```yaml
permissions:
  contents: read
  security-events: write
```

And the repo has Code Scanning enabled in Settings → Code security.

### "Offline scan is stale"

Update the IOC database before scanning:

```bash
shai-scanner --update
```

## Learn More

- [Full Documentation](../../README.md)
- [API Reference](../../docs/API.md)
- [TUI Usage Guide](../../docs/TUI_USAGE_GUIDE.md)
- [Video Tutorial](../../tutorials/VIDEO_SCRIPT.md)
- [Interactive Tutorial](../../tutorials/INTERACTIVE_TUTORIAL.md)
- [Architecture](../../ARCHITECTURE.md)
- [Contributing](../../CONTRIBUTING.md)

---

*Part of [Phase 4: User Onboarding Materials](../../PHASE4_USER_ONBOARDING_PLAN.md)*
