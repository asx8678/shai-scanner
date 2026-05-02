# Security policy

## Reporting issues

Please report scanner bugs, false negatives, and false positives through your private security process or issue tracker before publishing sensitive details. Include:

- package name and version
- lockfile snippet or package path
- scanner command and output
- whether network updates were enabled

Do not include live credentials, tokens, private repository dumps, or secret-scanner output.

## Safe operation

- Prefer `--lockfiles-only` before installing dependencies.
- In CI, install with `npm ci --ignore-scripts` when investigating a possible compromise.
- Run `--offline --no-auto-update` for deterministic builds.
- Run `--update` from a controlled environment to refresh Datadog IOC data and commit/export the cache only if your policy allows it.

## Threat model

The scanner reads local project files and optionally fetches IOC CSV files over HTTPS from a fixed allowlist. It does not execute package lifecycle scripts, import scanned packages, or upload scan results.
