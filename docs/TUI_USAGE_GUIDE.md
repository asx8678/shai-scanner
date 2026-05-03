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

## Architecture Overview

The TUI is built with a **Component-based architecture** that provides:

- **Lifecycle management** — components mount, render, handle input, and unmount cleanly
- **Differential rendering** — only changed content is sent to the terminal
- **Component hierarchy** — parent-child relationships for organized rendering
- **Event-driven updates** — state changes trigger automatic re-renders

### Core Components

#### Component Base Class

All TUI components extend the `Component` base class (`src/tui/core/component.js`):

```javascript
import { Component } from 'shai-scanner/tui/core/component.js'

class MyComponent extends Component {
  constructor(options = {}) {
    super(options)
    // Initialize component
  }

  mount() {
    // Called when component is added to the tree
    super.mount()
    // Setup resources, event listeners
  }

  render(screen, ctx) {
    // Called to render to VirtualScreen
    // screen: VirtualScreen instance
    // ctx: { bounds: { row, col, width, height }, terminalSize: { cols, rows } }
  }

  handleKey(key) {
    // Handle keypress events
    // key: { name, char, raw }
    // Return true if handled, false to bubble up
    return false
  }

  unmount() {
    // Called when component is removed from tree
    super.unmount()
    // Cleanup resources
  }
}
```

#### VirtualScreen

A 2D character buffer for differential rendering:

```javascript
import { VirtualScreen } from 'shai-scanner/tui/core/virtual-screen.js'

const screen = new VirtualScreen(80, 24) // cols, rows
screen.setLine(0, 'Hello World', 'bold')
screen.setCell(1, 0, '┌', 'green')
screen.markDirty(0) // Mark row as changed
```

#### RenderCoordinator

Coordinates rendering across all components:

```javascript
import { RenderCoordinator } from 'shai-scanner/tui/core/render-coordinator.js'

const coordinator = new RenderCoordinator()
coordinator.initialize() // Enter alternate screen

// Register components
const handle = coordinator.registerComponent(myComponent)

// Request re-render (batched automatically)
handle.requestRender()

// Cleanup
coordinator.destroy() // Exit alternate screen, unmount components
```

---

## Component Lifecycle

1. **Constructor** — Initialize component state and options
2. **mount()** — Called when component is added to the component tree
   - Setup event listeners
   - Initialize resources
   - Child components are automatically mounted
3. **render(screen, ctx)** — Called on each render pass
   - Write to VirtualScreen
   - Use ctx.bounds for positioning
4. **handleKey(key)** — Called for keypress events
   - Return `true` if handled
   - Return `false` to bubble to parent
5. **unmount()** — Called when component is removed from tree
   - Cleanup resources
   - Remove event listeners
   - Child components are automatically unmounted

---

## Available Components

### 1. Box

Bordered container with title and colored borders.

```javascript
import { Box } from 'shai-scanner/tui/components/box.js'

// Static usage (backward compatible)
const boxStr = Box.draw({
  title: 'Status',
  lines: ['Line 1', 'Line 2'],
  borderColor: 'green'
})

// Component usage
const box = new Box({ title: 'Status' })
box.setLines(['Line 1', 'Line 2'])
box.addLine('Line 3')
box.setTitle('New Title')
```

### 2. TextInput

Text input with history, completion, and validation.

```javascript
import { TextInput } from 'shai-scanner/tui/components/input.js'

const input = new TextInput({
  prompt: 'Enter path: ',
  defaultValue: '.',
  history: true
})

input.mount()
input.render(screen, { bounds: { row: 0, col: 0, width: 80, height: 3 } })
const value = await input.getValue()
input.unmount()
```

### 3. SelectMenu

Single-item selection from a list.

```javascript
import { SelectMenu } from 'shai-scanner/tui/components/menu.js'

const menu = new SelectMenu({
  title: 'Choose option:',
  items: [
    { label: 'Option 1', value: 'opt1', description: 'First option' },
    { label: 'Option 2', value: 'opt2', description: 'Second option' }
  ]
})

// Static usage (backward compatible)
const result = await SelectMenu.run({ title: 'Pick:', items: [...] })
```

### 4. CheckboxMenu

Multi-item selection with checkboxes.

```javascript
import { CheckboxMenu } from 'shai-scanner/tui/components/menu.js'

const checkbox = new CheckboxMenu({
  title: 'Select phases:',
  items: [
    { label: 'node_modules', value: 'node_modules', checked: true },
    { label: 'Lockfiles', value: 'lockfiles', checked: true }
  ]
})
```

### 5. ProgressBar

Visual progress indicator with percentage.

```javascript
import { ProgressBar } from 'shai-scanner/tui/components/progress.js'

const progress = new ProgressBar({
  title: 'Scanning...',
  total: 100
})

progress.mount()
progress.setValue(50) // 50%
progress.render(screen, { bounds: { row: 0 } })
```

### 6. Spinner

Animated spinner for indeterminate operations.

```javascript
import { Spinner } from 'shai-scanner/tui/components/progress.js'

const spinner = new Spinner({ text: 'Loading...' })
spinner.mount()
spinner.render(screen, { bounds: { row: 0 } })
```

### 7. LiveProgress

Combined spinner/progress for operations with known progress.

```javascript
import { LiveProgress } from 'shai-scanner/tui/components/progress.js'

const liveProgress = new LiveProgress({
  title: 'Processing...',
  total: 100
})
```

### 8. FileBrowser

Interactive file/directory browser with filtering.

```javascript
import { FileBrowser } from 'shai-scanner/tui/components/browser.js'

const browser = new FileBrowser({
  root: process.cwd(),
  multiSelect: true,
  showHidden: false
})

browser.mount()
browser.render(screen, { bounds: { row: 0, col: 0, width: 80, height: 20 } })
```

### 9. FindingsBrowser

Paginated display of scan findings with filtering.

```javascript
import { FindingsBrowser } from 'shai-scanner/tui/components/findings.js'

const findings = new FindingsBrowser({
  findings: scanResults.findings,
  pageSize: 10
})

findings.mount()
findings.setFilter('severity', 'high')
```

### 10. ScannerTUI

Top-level application component coordinating all screens.

```javascript
import { ScannerTUI } from 'shai-scanner/tui/components/app.js'

const app = new ScannerTUI()
app.mount() // Launches the full TUI experience
```

### 11. App Screens

Specialized screens for different TUI flows:

- **AppConfig** — Scan configuration screen
- **AppScan** — Scanning progress screen  
- **AppResults** — Results display screen
- **AppUtils** — Utility functions

```javascript
import { AppConfig, AppScan, AppResults } from 'shai-scanner/tui/components/app-*.js'
```

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
- **Differential rendering** — minimal terminal I/O for smooth updates
- **Component lifecycle** — clean mount/unmount with automatic cleanup

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

### Programmatic TUI Usage

```javascript
import { RenderCoordinator, Component } from 'shai-scanner/tui'

class MyScreen extends Component {
  render(screen, ctx) {
    screen.setLine(ctx.bounds.row, 'Hello from MyScreen!')
  }
  
  handleKey(key) {
    if (key.name === 'escape') return true // Handled
    return false
  }
}

// Create coordinator and components
const coordinator = new RenderCoordinator()
coordinator.initialize()

const screen = new MyScreen()
coordinator.registerComponent(screen)

// Handle keypresses
process.stdin.on('data', (data) => {
  const key = parseKey(data) // Your key parsing logic
  screen.handleKey(key)
})

// Cleanup on exit
process.on('SIGINT', () => {
  coordinator.destroy()
  process.exit(0)
})
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
| Component not rendering          | Check if mounted and registered with coordinator   |
| State updates not reflecting     | Call setState() or requestRender()                |
| Memory leaks                     | Ensure unmount() cleans up all resources          |