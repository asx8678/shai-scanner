# Changelog

All notable changes to the shai-scanner project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.6.0] - 2026-05-02

### 🎉 Phase 4 Complete: Testing, Polish & Documentation

#### Added
- **Complete TUI Component Architecture** - Modern, maintainable terminal UI system
- **Enhanced Scan Configuration** - All CLI options now available in TUI
- **Comprehensive Test Suite** - Visual regression, cross-platform, and performance benchmarks
- **Full Documentation** - Usage guides, migration guides, and architecture docs
- **Phase 2 Documentation Complete** - Community and security documentation
  - `CONTRIBUTING.md` - Developer contribution guidelines
  - `CODE_OF_CONDUCT.md` - Community standards (Contributor Covenant v2.1)
  - `SECURITY.md` - Enhanced security policy with vulnerability reporting process
  - `docs/API.md` - Comprehensive API documentation

### 📋 Phase 2: Documentation Enhancement Complete

This completes the BD (Business Development) readiness plan with comprehensive documentation:

#### Documentation Files Created/Updated
- **CONTRIBUTING.md** - Comprehensive developer contribution guidelines with clear onboarding process
- **CODE_OF_CONDUCT.md** - Community standards based on Contributor Covenant v2.1
- **SECURITY.md** - Enhanced security policy with vulnerability reporting process and response timeline
- **docs/API.md** - Complete API documentation for programmatic usage

#### BD Readiness Achievement
- ✅ Community guidelines established for open-source contribution
- ✅ Code of conduct ensures inclusive community environment
- ✅ Security policy provides clear vulnerability reporting process
- ✅ API documentation enables developer adoption and integration
- ✅ All Phase 2 documentation requirements satisfied

#### Phase 1: TUI Foundation & Architecture
- **Core Infrastructure**: Created `src/tui/core/` directory with modular architecture
  - `EventBus` class with subscribe/unsubscribe/event emission
  - Enhanced `VirtualScreen` with region tracking and dirty row management
  - Enhanced `Renderer` with double-buffer differential rendering
  - `Component` base class with lifecycle management (mount/unmount/render)
  - `RenderCoordinator` for centralized render batching and resize handling
- **Public API**: Barrel file exports all new core classes
- **Backward Compatibility**: All existing functionality preserved

#### Phase 2: Component Migration (11 Components)
- **Stage 1**: Box, TextInput, Confirm components migrated to new architecture
- **Stage 2**: Spinner, ProgressBar components migrated
- **Stage 3**: SelectMenu, CheckboxMenu components migrated
- **Stage 4**: FileBrowser, LiveProgress components migrated
- **Stage 5**: FindingsBrowser composite component migrated
- **Stage 6**: ScannerTUI main application component migrated
- **Legacy Refactoring**: 
  - `src/tui.js` reduced from 942 → 559 lines
  - `src/tui-findings.js` removed (imports updated)
  - `app.js` split into 4 focused modules (app-config, app-scan, app-results, app-utils)
  - `findings.js` split into 2 modules (findings-browse, findings-helpers)

#### Phase 3: Enhanced Scan Configuration
- **Extended scan options**: Live sources, query limits, audit toggle, scan depth
- **6-section configuration flow** replacing 3-step simple config
- **Live advisory support**: OSV.dev + GitHub Advisory Database integration
- **Audit integration**: npm/pnpm/yarn audit support
- **Scan tuning**: Max depth, fail on advisory/warning options
- **Visual summary**: Confirmation box with all settings

#### Phase 4: Testing & Polish
- **Test Suites**:
  - `npm test` - Core functionality validation
  - `npm run test:tui` - TUI component tests
  - `npm run test:visual` - Visual regression testing
  - `npm run test:benchmark` - Performance benchmarks
  - `npm run test:cross-platform` - Cross-platform compatibility
- **Documentation**:
  - `docs/TUI_USAGE_GUIDE.md` - Complete TUI usage guide
  - `docs/MIGRATION_GUIDE.md` - Migration from legacy code
  - `docs/CROSS_PLATFORM_TESTING.md` - Cross-platform testing docs
  - `ARCHITECTURE.md` - System architecture overview

### Fixed
- Race conditions in render batching
- Resize handling conflicts
- Component lifecycle cleanup
- Legacy file references

### Security
- No runtime dependencies maintained
- Private file permissions for cached IOCs

## [4.5.0] - 2026-01-01

### Initial Release with TUI Foundation

#### Added
- **Zero runtime dependencies** - No React, Ink, Commander, or Chalk
- **Component-based TUI architecture** - Modern terminal UI foundation
- **Broader dependency coverage** - Multiple lockfile formats supported
- **New Mini Shai-Hulud coverage** - April 2026 npm packages
- **Artifact detection** - Setup scripts, configuration files, workflow patterns
- **Live advisory mode** - OSV.dev and GitHub Advisory Database integration
- **CI output** - JSON and SARIF formats
- **Custom IOCs** - Import custom CSV files

## [4.0.0] - 2025-12-01

### Major Release

#### Added
- **Core scanner functionality** - Shai-Hulud, Mini Shai-Hulud detection
- **Package scanning** - node_modules analysis
- **Lockfile scanning** - npm, pnpm, yarn, bun support
- **GitHub Actions detection** - Workflow pattern analysis
- **Database caching** - SQLite-based IOC storage
- **CLI interface** - Command-line scanning options
