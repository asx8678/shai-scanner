# Shai-Scanner 4.5 review notes

Review date: 2026-05-02

## What was checked

- Syntax check for every JavaScript file with `node --check`.
- Self-test suite with synthetic lockfiles, node_modules packages, package.json ranges, suspicious scripts, workflow indicators, and mocked live advisory responses.
- CLI smoke tests for `--help`, `--check`, offline JSON scans, and offline live-mode behavior.
- Source review of update, scanning, lockfile parsing, advisory querying, reporters, and semver range matching.

## Issues fixed in this build

- Added live advisory mode for exact package versions from lockfiles and installed dependencies:
  - OSV.dev querybatch + vulnerability detail lookup.
  - GitHub Advisory Database REST lookups for reviewed and malware advisories.
- Added dependency inventory output so live sources can be queried without reparsing the result.
- Made manifest self-IOCs count as vulnerabilities, not just informational findings.
- Removed noisy generic artifact matching such as `bundle.js`.
- Avoided flagging `.vscode` and `.claude` by directory name alone; the scanner now looks for suspicious content in relevant config files.
- Hardened semver range matching and removed substring fallback matching that could flag `11.2.30` as matching `1.2.3`.
- Added response-size checks to live advisory JSON parsing.
- Exported live advisory APIs for programmatic use and updated TypeScript declarations.
- Updated CLI help, README, and CI workflow example for live advisory mode.

## Remaining limitations

- The scanner is a detector, not a forensic containment tool.
- `bun.lockb` remains binary and is not parsed.
- The yarn and pnpm parsers are intentionally dependency-free and heuristic; for enterprise use, compare output against package-manager-native inventory when possible.
- Live advisory mode sends package names and exact versions to selected advisory services.
- Live API calls were implemented and unit-tested with mocks in this environment; real network verification depends on the runtime environment where the tool is executed.
