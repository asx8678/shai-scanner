# Shai-Scanner 4.6 Architecture

## Overview

Shai-Scanner is a dependency-light npm supply-chain scanner designed for offline and CI environments. It provides both a CLI and an interactive TUI for scanning projects, lockfiles, and installed packages against known malicious indicators.

## Core Components

### Scanner Engine (`src/scanner.js`)
- **Scanner**: Main scanning orchestrator that coordinates vulnerability checks, lockfile analysis, and package scanning
- **VulnerabilityDatabase**: Handles IOC database management, updates, and lookups
- **Live Advisory Integration**: OSV.dev and GitHub Advisory Database lookups

### TUI Architecture (`src/tui/`)

The TUI is built with a component-based architecture that supports differential rendering and minimal flicker:

#### Core Infrastructure (`src/tui/core/`)
- **Component Base Class**: Base class for all TUI components with lifecycle management
- **VirtualScreen**: Screen buffer abstraction for differential rendering
- **RenderCoordinator**: Coordinates rendering across components to minimize I/O
- **Renderer**: Double-buffer differential terminal renderer
- **ScreenManager**: Alternate screen buffer lifecycle management
- **KeyReader**: Raw-mode keypress reader with cleanup handling
- **Event Bus**: Component communication
- **Terminal Utilities**: Resize handling, debounce, ANSI constants

#### Components (`src/tui/components/`)
- **Box**: Basic container component
- **TextInput**: Text input with history and completion
- **Spinner/ProgressBar/LiveProgress**: Progress indicators
- **SelectMenu/CheckboxMenu**: Menu components with keyboard navigation
- **FileBrowser**: File system browser with filtering
- **Findings/FindingsBrowse**: Vulnerability results display
- **App Components**: Top-level application screens

### Data Flow
1. User initiates scan via TUI or CLI
2. Scanner engine processes targets (projects, lockfiles, packages)
3. Vulnerability database performs lookups (offline and live)
4. Results are formatted and displayed (TUI interactive, CLI output, JSON/SARIF)

## Module Organization

```
src/
├── cli.js              # CLI entry point
├── scanner.js          # Core scanning logic
├── database.js         # Vulnerability database management
├── embedded-db.js      # Embedded IOC database
├── lockfiles.js        # Lockfile parsing
├── live-sources.js     # OSV/GitHub advisory integration
├── utils.js            # Shared utilities
├── constants.js        # Configuration constants
├── csv.js              # CSV parsing
├── reporters.js        # Output formatters
├── audit.js            # Package audit integration
├── semver-lite.js      # Lightweight semver comparison
└── tui/                # Interactive terminal UI
    ├── index.js        # TUI entry point
    ├── tui.js          # Legacy entry point (backward compat)
    ├── core/           # Core infrastructure
    └── components/     # UI components
```

## Key Design Principles

1. **Zero Runtime Dependencies**: All functionality uses Node.js built-ins only
2. **Graceful Degradation**: TUI components work in non-TTY environments
3. **Backward Compatibility**: Existing APIs and import paths maintained
4. **Testability**: Component isolation and mock-friendly interfaces
5. **Performance**: Differential rendering and minimal I/O operations

## Testing Strategy

- **Unit Tests**: Individual component and utility tests
- **Integration Tests**: Full TUI flow testing
- **Visual Regression Tests**: Terminal output validation
- **Performance Tests**: Rendering and I/O benchmarks

## Data Sources

### Embedded Database
- Datadog IOC CSVs (Shai-Hulud indicators)
- April 2026 Mini Shai-Hulud npm entries

### Live Advisory Sources
- OSV.dev vulnerability database
- GitHub Advisory Database (including malware advisories)
- NVD (optional enrichment via CVE IDs)

## Configuration

Configuration is handled through:
- CLI arguments
- Environment variables
- Project-level `.shai-scanner` config
- Hardcoded defaults for security-critical settings