# Shai-Scanner 4.5

Dependency-light scanner for Shai-Hulud, Shai-Hulud 2.0/3.0, and Mini Shai-Hulud npm supply-chain indicators.

This version is a ground-up hardening pass over the older React/Ink TUI bundle. It keeps the useful scanner API, but removes runtime dependencies, adds broader lockfile coverage, detects install-time payload artifacts, and supports CI-friendly JSON and SARIF output.

## What improved

- **Zero runtime dependencies**: no React, Ink, Commander, Chalk, or transitive install risk.
- **Broader dependency coverage**:
  - `node_modules` package scanning
  - `package-lock.json` / `npm-shrinkwrap.json`
  - `pnpm-lock.yaml`
  - `yarn.lock` v1 and Berry-style entries
  - `bun.lock` JSON/text; `bun.lockb` is reported as a warning because it is binary
  - `package.json` dependency ranges, workspaces, and lifecycle scripts
- **New Mini Shai-Hulud coverage** for the April 2026 npm packages reported by multiple security teams:
  - `mbt@1.2.48`
  - `@cap-js/sqlite@2.2.2`
  - `@cap-js/postgres@2.2.2`
  - `@cap-js/db-service@2.10.1`
  - `intercom-client@7.0.4`
- **Artifact and persistence detection**:
  - `setup_bun.js`, `bun_environment.js`
  - `bun_installer.js`, `environment_source.js`
  - `setup.mjs`, `execution.js`, `router_runtime.js`
  - `.dev-env`, `.claude/settings.json`, `.vscode/tasks.json`
  - suspicious GitHub Actions workflow patterns
- **Safer update path**: fetches Datadog’s consolidated IOC CSV and confirmed IOC CSV over HTTPS, caches with private file permissions, and can run offline.
- **Live advisory mode**: optional exact-version checks against OSV.dev and the GitHub Advisory Database, including malware advisories.
- **CI output**: JSON and SARIF supported.
- **Custom IOCs**: import your own CSV without modifying source.

## Install / run

From this zip:

```bash
cd shai-scanner-4.6.1
node src/cli.js --help
node src/cli.js --scan . --offline --no-auto-update
```

Install globally from the folder:

```bash
npm install -g .
shai-scanner --scan .
```

Run with `npx` after publishing or from a Git URL:

```bash
npx shai-scanner --scan .
```

## Commands

### Scan a project

```bash
shai-scanner --scan .
```

### Scan lockfiles before installing dependencies

```bash
shai-scanner --lockfiles-only --scan .
```

This is the safest first check because it does not require `npm install` and does not execute lifecycle scripts.

### Check a single package

```bash
shai-scanner --check @asyncapi/parser@3.4.1
shai-scanner --check intercom-client@7.0.4
```

### Query live CVE/GHSA/malware advisories

Local IOC scanning is fast and works offline. For current npm vulnerability intelligence, add live advisory queries:

```bash
# Query OSV.dev and GitHub Advisory Database for exact installed/locked versions
shai-scanner --scan . --live

# Query OSV.dev only
shai-scanner --scan . --live-osv

# Query GitHub Advisory Database only, including type=malware
shai-scanner --scan . --live-github

# Make CI fail on live CVE/GHSA/malware matches
shai-scanner --scan . --live --fail-on-advisory

# Limit live queries for very large repositories/monorepos
shai-scanner --scan . --live --live-limit 1000
```

Live mode uses the scanner's exact dependency inventory from lockfiles and installed packages. It is skipped automatically in `--offline` mode. `--audit` is still available for the package-manager-native audit path.

### JSON output

```bash
shai-scanner --scan . --json > shai-scan.json
```

### SARIF output for GitHub code scanning

```bash
shai-scanner --scan . --sarif --output shai-scanner.sarif
```

### Update the IOC database

```bash
shai-scanner --update
```

The scanner auto-refreshes before scans when the cache is older than six hours. Disable this in deterministic CI runs:

```bash
shai-scanner --scan . --no-auto-update --offline
```

### Import a custom CSV

CSV formats accepted:

```csv
package_name,package_version
@scope/package,1.2.3
```

or:

```csv
package_name,package_versions,vendors
@scope/package,"1.2.3, 1.2.4",internal
```

Run:

```bash
shai-scanner --import-csv ./internal-iocs.csv --scan .
```

### Generate a GitHub Actions workflow

```bash
shai-scanner --init-ci > .github/workflows/shai-scanner.yml
```

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | No package/version IOCs found |
| 1 | Known malicious package/version found, `--fail-on-advisory` matched live advisories, or `--fail-on-warning` matched suspicious artifacts |
| 2 | Scan/runtime error |
| 3 | Database update failed |
| 4 | Invalid arguments |

## Programmatic use

```js
import { VulnerabilityDatabase, Scanner, queryLiveAdvisories } from 'shai-scanner';

const db = new VulnerabilityDatabase({ offline: true });
const scanner = new Scanner(db);
const result = await scanner.scan(['.'], {
  includeNodeModules: true,
  includeLockfiles: true,
  includeManifests: true,
  includeIocFiles: true
});

// Optional: run live lookups when you are not in offline mode.
const live = await queryLiveAdvisories(result.inventory, { sources: ['osv', 'github'] });
console.log(result.findings, live.findings);
```

## Recommended incident response when findings are present

1. Stop builds and installs in the affected dependency tree.
2. Remove affected package versions from `package.json` and lockfiles.
3. Delete `node_modules` and regenerate lockfiles from known-safe versions.
4. Reinstall with lifecycle scripts disabled until trust is restored:

   ```bash
   npm ci --ignore-scripts
   ```

5. Rotate exposed credentials: npm tokens, GitHub PATs, GitHub Actions/OIDC trust, cloud keys, Vault tokens, and any API keys reachable from developer or CI environments.
6. Audit GitHub repositories and workflows for unexpected commits, branches, discussion-trigger workflows, `.claude/settings.json`, `.vscode/tasks.json`, and self-hosted runner setup.

## Data sources

The embedded database is intentionally compact so the package remains small. For current Shai-Hulud coverage, run `shai-scanner --update` to pull Datadog’s IOC files:

- `DataDog/indicators-of-compromise/shai-hulud-2.0/consolidated_iocs.csv`
- `DataDog/indicators-of-compromise/shai-hulud-2.0/shai-hulud-2.0.csv`

The embedded April 2026 Mini Shai-Hulud npm entries are based on public reporting by Aikido, Wiz, StepSecurity, Socket, and Upwind.

For general CVEs, GHSAs, and npm malware advisories, use `--live`, `--live-osv`, or `--live-github`. Live mode is intentionally opt-in so offline forensic scans and deterministic CI runs remain possible.

NVD is not used as the primary npm matcher because its API is centered on CVE/CPE records, while npm dependency trees are package-name and semantic-version based. A safer design is to query OSV/GitHub by exact npm package versions first, then use NVD only as optional enrichment for CVE IDs returned by those sources.

## Notes and limitations

- A finding is an indicator, not a full forensic conclusion.
- `package.json` range matching is conservative and may flag a range that could resolve to a malicious version even if your lockfile resolved safely.
- `bun.lockb` is binary and not parsed. Use `bun.lock` or scan installed `node_modules`.
- Live advisory mode sends package names and exact versions to OSV.dev and/or GitHub, depending on the selected source.
- The scanner does not upload telemetry or scan file contents for secrets.

## Development

```bash
npm test
node src/cli.js --scan test/fixtures --offline --no-auto-update
```

No runtime dependencies are required.
