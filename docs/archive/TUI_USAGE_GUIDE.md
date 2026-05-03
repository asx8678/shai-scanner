# Shai-Scanner TUI — Usage Guide

Interactive terminal UI for the shai-scanner security tool. Navigate menus
with arrow keys, confirm with Enter, go back with Esc or q.

---

## Launching the TUI

```bash
# From a terminal (TTY required):
shai-scanner --tui

# Or via npm:
npm start -- --tui

# Direct node:
node src/cli.js --tui
```

> **Non-TTY environments** (piped stdin, CI, etc.) automatically get a
> plain-text fallback message with equivalent CLI commands.

---

## Main Menu

The TUI opens to a main menu with a visual header showing:

- **Version** — current shai-scanner version
- **Database** — number of package-version IOCs loaded
- **Last update** — when the IOC database was last refreshed

Menu options:

| Option             | Description                               |
| ------------------ | ----------------------------------------- |
| **Scan project**   | Configure and run a full project scan     |
| **Check package**  | Look up a single `package@version`        |
| **Update database**| Fetch the latest IOC (malware) feeds      |
| **Search database**| Search known IOCs by package name         |
| **Quit**           | Exit the TUI                              |

Navigate with **↑/↓** arrow keys and press **Enter** to select.
Press **Esc** or **q** from the main menu to quit.

---

## Screens

### 1. Scan Configuration

Walks you through every scan option interactively:

1. **Scan phases** — multi-select which checks to run:
   - node_modules inspection
   - Lock file analysis (package-lock.json, yarn.lock, etc.)
   - Manifest scanning (package.json dependency ranges)
   - IOC file matching (known malicious filenames/workflows)

2. **Scan path** — enter the directory to scan (defaults to `.`)

3. **Live advisories** — optionally query live vulnerability databases:
   - **OSV.dev** — CVEs and open-source vulnerabilities
   - **GitHub Advisory Database** — GitHub Security Advisories
   - Set a query limit (default: 5000 packages)

4. **npm audit** — optionally run package-manager audit as well

5. **Scan tuning**:
   - Max search depth (1–100, default: 10)
   - Fail on advisory (exit code 1 if CVEs found)
   - Fail on warning (exit code 1 for suspicious findings)

6. **Confirm & scan** — review your settings and start

### 2. Scanning (Progress)

While scanning, a live progress display shows:

- Current phase (IOC check, lockfiles, manifests, live advisories, audit)
- Progress bar with percentage
- Spinner with status text
- Results count as they're found

Press **Ctrl+C** to abort. Partial results are saved automatically.

### 3. Results (Findings Browser)

After scanning, results are shown in an interactive browser:

- **Paginated** — 10 findings per page with ← → navigation
- **Filter by severity** — Critical, High, Medium, Low
- **Filter by type** — Malware, CVE, Suspicious, etc.
- **Search** — text search across package names and descriptions
- **Detail view** — select a finding to see full details
- **Export** — write results to JSON, SARIF, or CSV

Severity indicators use both color and text labels for accessibility:
`[CRIT]`, `[HIGH]`, `[MED]`, `[LOW]`

### 4. Check Package

Enter a package spec (e.g., `lodash@4.17.20`) to look it up against the
IOC database and optionally run a live advisory query.

### 5. Update Database

Fetches the latest Datadog IOC feeds and caches them locally.
Shows progress and completion status.

### 6. Search Database

Enter a search term to find known IOCs by package name.
Results are paginated and filterable.

---

## File Browser

The scan configuration now includes an interactive file/folder browser
for selecting scan paths. Features:

- **Navigate** — use ↑/↓ to move through files and folders
- **Open directories** — press Enter or → to enter a folder
- **Go back** — press ← or select ".." to go up a directory
- **Multi-select** — press Space to select/deselect files or folders
- **Select all** — press "a" to toggle selection of all visible items
- **Hidden files** — press "h" to toggle visibility of dotfiles
- **Finish** — press Esc or "q" to confirm and return to scan config

Selected paths are shown at the bottom of the browser.
If nothing is selected, the current directory is used.

Icons:
- 📁 — directory
- 📄 — file
- 👻 — hidden file (dotfile)
- ⬆ — parent directory ("..")

---

## Keyboard Controls

| Key              | Action                              |
| ---------------- | ----------------------------------- |
| **↑ / ↓**        | Navigate menu items                 |
| **Enter**        | Select / confirm                    |
| **Esc / q**      | Go back / cancel                    |
| **← / →**        | Previous / next page (results)      |
|                  | Go up / enter directory (browser)   |
| **Space**        | Toggle checkbox / select item       |
| **h**            | Toggle hidden files (browser)       |
| **a**            | Select/deselect all (browser/check) |
| **Ctrl+C**       | Abort scan / force quit             |
| **/**            | Open search (in findings browser)   |

---

## Features

- **Resize-aware** — re-renders on terminal resize (SIGWINCH)
- **Graceful shutdown** — restores terminal on SIGINT/SIGTERM
- **Crash recovery** — saves partial scan state; restores on next launch
- **Non-TTY fallback** — shows CLI equivalents when no terminal is available
- **Zero dependencies** — built entirely with Node.js built-ins
- **Accessible** — text labels alongside color; works without emoji support
- **Lazy loading** — heavy modules loaded on demand for fast startup

---

## Examples

```bash
# Quick scan of current project via TUI
shai-scanner --tui

# Equivalent CLI commands (for scripting/CI):
shai-scanner --scan .
shai-scanner --scan . --live --fail-on-advisory
shai-scanner --check lodash@4.17.20
shai-scanner --update
shai-scanner --search-db lodash

# JSON output for tooling integration:
shai-scanner --scan . --json

# SARIF for GitHub code scanning:
shai-scanner --scan . --sarif -o results.sarif
```

---

## Troubleshooting

| Issue                            | Solution                                           |
| -------------------------------- | -------------------------------------------------- |
| "requires an interactive terminal" | Run in a real terminal, not piped stdin           |
| Scan seems slow                  | Reduce scope: `--no-node-modules --lockfiles-only` |
| Permission errors                | Check directory permissions or run with appropriate access |
| Memory errors                    | Reduce `--max-depth` or use `--lockfiles-only`    |
| TUI looks garbled                | Ensure terminal supports ANSI; try `--no-color`    |
