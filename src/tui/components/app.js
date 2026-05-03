// src/tui/components/app.js
// ScannerTUI — full-screen TUI application as a Component subclass.
// Replicates the state machine from src/tui-app.js in the new Component model.
// Maintains backward compatibility with the legacy async-loop API.
//
// Screen implementations are split into focused modules:
//   app-config.js  — Scan Configuration screen
//   app-scan.js    — Scanning screen + phase helpers
//   app-results.js — Results screen + report export
//
// This file contains: class definition, lifecycle, main menu, check-package,
// update-db, search-db screens, state persistence, and the public runTUI entry point.

import { Component } from '../core/component.js';
import { colorize, sanitize, getCacheDir } from '../../utils.js';
import {
  SelectMenu,
  cleanupTerminal,
  onResize,
  debounce,
} from '../../tui.js';
import { EXIT_CODES } from '../../constants.js';

import { stdin as processStdin, stdout as processStdout } from 'node:process';
import { writeFile, readFile, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

// Sub-module imports
import { renderScanConfigToScreen, runLegacyScanConfig } from './app-config.js';
import { renderScanningToScreen, runLegacyScanning } from './app-scan.js';
import { renderResultsToScreen, runLegacyResults } from './app-results.js';
import {
  renderCheckPackageToScreen,
  runLegacyCheckPackage,
  renderUpdateDbToScreen,
  runLegacyUpdateDb,
  renderSearchDbToScreen,
  runLegacySearchDb,
} from './app-utils.js';

// ─── Lazy-loaded modules ─────────────────────────────────────────────────────
let _database, _findingsBrowser;

async function getDatabaseModule() {
  return (_database ??= await import('../../database.js'));
}
async function getFindingsBrowserModule() {
  return (_findingsBrowser ??= await import('./findings.js'));
}

// ─── State file path for crash recovery ──────────────────────────────────────
function getStateFilePath() {
  return join(getCacheDir(), 'tui-state.json');
}

// ─── Screen names ────────────────────────────────────────────────────────────
/** @enum {string} */
const SCREENS = Object.freeze({
  MAIN_MENU: 'main-menu',
  SCAN_CONFIG: 'scan-config',
  SCANNING: 'scanning',
  RESULTS: 'results',
  CHECK_PACKAGE: 'check-package',
  UPDATE_DB: 'update-db',
  SEARCH_DB: 'search-db',
});

// ─── Default scan options ────────────────────────────────────────────────────
const DEFAULT_SCAN_OPTIONS = {
  paths: ['.'],
  includeNodeModules: true,
  includeLockfiles: true,
  includeManifests: true,
  includeIocFiles: true,
  live: false,
  liveSources: [],
  liveLimit: 5000,
  audit: false,
  maxDepth: 10,
  failOnAdvisory: false,
  failOnWarning: false,
};

// ─── ScannerTUI ──────────────────────────────────────────────────────────────
/**
 * Full-screen TUI application for shai-scanner.
 *
 * Extends Component for the new rendering architecture while maintaining
 * backward compatibility with the legacy async-loop API.
 *
 * Component mode:  render(screen, ctx) / handleKey(key)
 * Legacy mode:     run() / init() / cleanup()
 */
export class ScannerTUI extends Component {
  /** @type {string} Current screen identifier */
  currentScreen = SCREENS.MAIN_MENU;

  /** @type {object} Accumulated scan options from the config screen */
  scanOptions = { ...DEFAULT_SCAN_OPTIONS };

  /** @type {object|null} Last scan result */
  results = null;

  /** @type {number} Exit code — set by fail conditions after scanning */
  exitCode = EXIT_CODES.SUCCESS;

  /** @type {boolean} Whether the app should keep running */
  running = false;

  // ── Private fields ──────────────────────────────────────────────────────
  #rendering = false;
  #db = null;
  #c = null;
  #useColor = false;
  #cleanups = [];

  // Component-mode UI state
  #mainMenuIndex = 0;
  #resultsIndex = 0;
  #resultsLines = [];

  /** @enum {string[]} Main menu item values (mirrors renderMainMenu items) */
  static MAIN_MENU_ITEMS = ['scan', 'check', 'update-db', 'search-db', 'quit'];

  /** @enum {string[]} Results action values */
  static RESULTS_ITEMS = [
    'detail',
    'export-json',
    'export-sarif',
    'scan-again',
    'new-scan',
    'back',
  ];

  /**
   * @param {object} [options]
   * @param {boolean} [options.color] - Enable ANSI colors (default: true)
   */
  constructor(options = {}) {
    super(options);
    this.#useColor = options.color !== false && !process.env.NO_COLOR;
    this.#c = colorize(this.#useColor);
    this.#db = null;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  Component interface — render / handleKey
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Render the current screen to a VirtualScreen.
   * @param {import('../core/virtual-screen.js').VirtualScreen} screen
   * @param {object} ctx - Render context with bounds and terminal size
   */
  render(screen, ctx) {
    const c = this.#c;
    if (!c) return;

    const startRow = ctx?.bounds?.row ?? 0;
    const maxCols = screen.cols;
    const row = startRow;

    switch (this.currentScreen) {
      case SCREENS.MAIN_MENU:
        this.#renderMainMenuToScreen(screen, ctx, row, c, maxCols);
        break;
      case SCREENS.RESULTS:
        renderResultsToScreen(
          screen,
          ctx,
          row,
          c,
          this.results,
          this.#resultsIndex,
          ScannerTUI.RESULTS_ITEMS,
        );
        break;
      case SCREENS.SCAN_CONFIG:
        renderScanConfigToScreen(screen, ctx, row, c, this.scanOptions);
        break;
      case SCREENS.SCANNING:
        renderScanningToScreen(screen, ctx, row, c);
        break;
      case SCREENS.CHECK_PACKAGE:
        renderCheckPackageToScreen(screen, ctx, row, c);
        break;
      case SCREENS.UPDATE_DB:
        renderUpdateDbToScreen(screen, ctx, row, c);
        break;
      case SCREENS.SEARCH_DB:
        renderSearchDbToScreen(screen, ctx, row, c);
        break;
    }
  }

  /**
   * Handle a keypress event in component mode.
   * @param {object} key
   * @returns {boolean} true if handled
   */
  handleKey(key) {
    switch (this.currentScreen) {
      case SCREENS.MAIN_MENU:
        return this.#handleMainMenuKey(key);
      case SCREENS.RESULTS:
        return this.#handleResultsKey(key);
      default:
        if (key.name === 'escape' || key.char === 'q') {
          this.navigateTo(SCREENS.MAIN_MENU);
          return true;
        }
        return false;
    }
  }

  // ── Private: Component-mode screen renderers ─────────────────────────────

  #writeLine(screen, row, text) {
    if (row >= 0 && row < screen.rows) {
      screen.setLine(row, text);
    }
    return row + 1;
  }

  #renderMainMenuToScreen(_screen, _ctx, row, c, _maxCols) {
    row = this.#writeLine(_screen, row, '');
    row = this.#writeLine(
      _screen,
      row,
      c.cyan('  ╔═══════════════════════════════════════════════════════╗'),
    );
    row = this.#writeLine(
      _screen,
      row,
      c.cyan('  ║') +
        c.bold('        🐍 Shai-Scanner TUI — Dependency Scanner       ') +
        c.cyan('║'),
    );
    row = this.#writeLine(
      _screen,
      row,
      c.cyan('  ╚═══════════════════════════════════════════════════════╝'),
    );
    row = this.#writeLine(_screen, row, '');

    if (this.#db) {
      const dbInfo = this.#db.getInfo();
      row = this.#writeLine(
        _screen,
        row,
        `  ${c.bold('Database:')}    ${c.cyan(String(dbInfo.versionCount))} IOCs loaded`,
      );
      row = this.#writeLine(
        _screen,
        row,
        `  ${c.bold('Last update:')} ${dbInfo.lastUpdate ? new Date(dbInfo.lastUpdate).toLocaleString() : c.dim('never')}`,
      );
    }

    row = this.#writeLine(_screen, row, '');
    row = this.#writeLine(_screen, row, c.bold('  Main Menu'));
    row = this.#writeLine(_screen, row, '');

    const menuItems = [
      { label: '📦  Scan project', value: 'scan' },
      { label: '🔍  Check package', value: 'check' },
      { label: '🔄  Update database', value: 'update-db' },
      { label: '🔎  Search database', value: 'search-db' },
      { label: '🚪  Quit', value: 'quit' },
    ];

    for (let i = 0; i < menuItems.length; i++) {
      const prefix = i === this.#mainMenuIndex ? c.cyan(' ▸ ') : '   ';
      row = this.#writeLine(_screen, row, `${prefix}${menuItems[i].label}`);
    }

    row = this.#writeLine(_screen, row, '');
    row = this.#writeLine(_screen, row, c.dim('  ↑/↓ navigate • Enter select • q quit'));
    return row;
  }

  // ── Private: Component-mode key handlers ─────────────────────────────────

  #handleMainMenuKey(key) {
    const items = ScannerTUI.MAIN_MENU_ITEMS;
    if (key.name === 'up') {
      this.#mainMenuIndex = (this.#mainMenuIndex - 1 + items.length) % items.length;
      this.requestRender();
      return true;
    }
    if (key.name === 'down') {
      this.#mainMenuIndex = (this.#mainMenuIndex + 1) % items.length;
      this.requestRender();
      return true;
    }
    if (key.name === 'return') {
      const value = items[this.#mainMenuIndex];
      switch (value) {
        case 'scan':
          this.navigateTo(SCREENS.SCAN_CONFIG);
          break;
        case 'check':
          this.navigateTo(SCREENS.CHECK_PACKAGE);
          break;
        case 'update-db':
          this.navigateTo(SCREENS.UPDATE_DB);
          break;
        case 'search-db':
          this.navigateTo(SCREENS.SEARCH_DB);
          break;
        case 'quit':
          this.running = false;
          break;
      }
      this.requestRender();
      return true;
    }
    if (key.char === 'q') {
      this.running = false;
      this.requestRender();
      return true;
    }
    return false;
  }

  #handleResultsKey(key) {
    const actions =
      this.results?.findings?.length > 0
        ? ScannerTUI.RESULTS_ITEMS
        : ScannerTUI.RESULTS_ITEMS.filter((a) => a !== 'detail');

    if (key.name === 'up') {
      this.#resultsIndex = (this.#resultsIndex - 1 + actions.length) % actions.length;
      this.requestRender();
      return true;
    }
    if (key.name === 'down') {
      this.#resultsIndex = (this.#resultsIndex + 1) % actions.length;
      this.requestRender();
      return true;
    }
    if (key.name === 'return') {
      const value = actions[this.#resultsIndex];
      this.#resultsIndex = 0;
      switch (value) {
        case 'scan-again':
          this.navigateTo(SCREENS.SCANNING);
          break;
        case 'new-scan':
          this.navigateTo(SCREENS.SCAN_CONFIG);
          break;
        case 'back':
          this.navigateTo(SCREENS.MAIN_MENU);
          break;
        default:
          break;
      }
      this.requestRender();
      return true;
    }
    if (key.name === 'escape' || key.char === 'q') {
      this.navigateTo(SCREENS.MAIN_MENU);
      this.requestRender();
      return true;
    }
    return false;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  Legacy API — backward-compatible async-loop methods
  // ══════════════════════════════════════════════════════════════════════════

  /** @param {string} screen - One of the SCREENS values. */
  navigateTo(screen) {
    this.currentScreen = screen;
  }

  /**
   * Initialize the app — creates the database and sets up signal handlers.
   */
  async init() {
    const { VulnerabilityDatabase } = await getDatabaseModule();
    this.#db = new VulnerabilityDatabase();

    const debouncedResize = debounce(() => {
      if (this.running && !this.#rendering) {
        this.#dispatchScreen().catch(() => {});
      }
    }, 150);

    const unsubResize = onResize(() => debouncedResize.trigger());
    this.#cleanups.push(unsubResize);
    this.#cleanups.push(() => debouncedResize.cancel());
  }

  /**
   * Start the TUI event loop.
   */
  async run() {
    this.running = true;

    while (this.running) {
      try {
        this.#rendering = true;
        await this.#dispatchScreen();
      } catch (error) {
        const msg = sanitize(error?.message || String(error));
        const c = this.#c;
        processStdout.write(`\n${c.red('Error:')} ${msg}\n`);

        if (msg.includes('EACCES') || msg.includes('permission')) {
          processStdout.write(
            c.yellow('  Hint: Check file permissions or run with appropriate access.\n'),
          );
        } else if (msg.includes('ENOSPC')) {
          processStdout.write(c.yellow('  Hint: Disk full. Free up space and try again.\n'));
        } else if (msg.includes('ENOTDIR') || msg.includes('ENOENT')) {
          processStdout.write(
            c.yellow('  Hint: Path not found. Use --scan <path> with CLI flags instead.\n'),
          );
        } else if (
          msg.includes('network') ||
          msg.includes('ENOTFOUND') ||
          msg.includes('ECONNREFUSED')
        ) {
          processStdout.write(
            c.yellow(
              '  Hint: Network error. Try --offline or use CLI flags: shai-scanner --help\n',
            ),
          );
        }

        this.navigateTo(SCREENS.MAIN_MENU);
      } finally {
        this.#rendering = false;
      }
    }
  }

  async #dispatchScreen() {
    switch (this.currentScreen) {
      case SCREENS.MAIN_MENU:
        return this.renderMainMenu();
      case SCREENS.SCAN_CONFIG:
        return this.renderScanConfig();
      case SCREENS.SCANNING:
        return this.renderScanning();
      case SCREENS.RESULTS:
        return this.renderResults();
      case SCREENS.CHECK_PACKAGE:
        return this.renderCheckPackage();
      case SCREENS.UPDATE_DB:
        return this.renderUpdateDb();
      case SCREENS.SEARCH_DB:
        return this.renderSearchDb();
      default:
        this.navigateTo(SCREENS.MAIN_MENU);
    }
  }

  // ── Legacy: Main Menu ───────────────────────────────────────────────────
  async renderMainMenu() {
    const dbInfo = this.#db.getInfo();
    const c = this.#c;

    let version = '4.6.5';
    try {
      const { dirname } = await import('node:path');
      const { fileURLToPath } = await import('node:url');
      const __dirname = dirname(fileURLToPath(import.meta.url));
      const pkg = JSON.parse(
        await readFile(join(__dirname, '..', '..', '..', 'package.json'), 'utf8'),
      );
      version = pkg.version || version;
    } catch {
      /* use default */
    }

    const headerLines = [
      c.cyan('  ╔═══════════════════════════════════════════════════════╗'),
      c.cyan('  ║') +
        c.bold('        🐍 Shai-Scanner TUI — Dependency Scanner       ') +
        c.cyan('║'),
      c.cyan('  ╚═══════════════════════════════════════════════════════╝'),
      '',
      `  ${c.bold('Version:')}     v${version}`,
      `  ${c.bold('Database:')}    ${c.cyan(String(dbInfo.versionCount))} package-version IOCs loaded`,
      `  ${c.bold('Last update:')} ${dbInfo.lastUpdate ? new Date(dbInfo.lastUpdate).toLocaleString() : c.dim('never')}`,
    ];

    processStdout.write('\n');
    processStdout.write(headerLines.join('\n'));
    processStdout.write('\n\n');

    const selection = await SelectMenu.run({
      title: '  Main Menu',
      items: [
        { label: '  📦  Scan project', description: 'Scan directories for IOCs', value: 'scan' },
        {
          label: '  🔍  Check package',
          description: 'Look up a single package@version',
          value: 'check',
        },
        {
          label: '  🔄  Update database',
          description: 'Fetch latest IOC feeds',
          value: 'update-db',
        },
        {
          label: '  🔎  Search database',
          description: 'Search known IOCs by name',
          value: 'search-db',
        },
        { label: '  🚪  Quit', description: 'Exit the TUI', value: 'quit' },
      ],
    });

    switch (selection) {
      case 'scan':
        this.navigateTo(SCREENS.SCAN_CONFIG);
        break;
      case 'check':
        this.navigateTo(SCREENS.CHECK_PACKAGE);
        break;
      case 'update-db':
        this.navigateTo(SCREENS.UPDATE_DB);
        break;
      case 'search-db':
        this.navigateTo(SCREENS.SEARCH_DB);
        break;
      case 'quit':
      case null:
        this.running = false;
        break;
    }
  }

  // ── Legacy: Scan Config — delegated to app-config.js ────────────────────
  async renderScanConfig() {
    await runLegacyScanConfig(this.#c, this.scanOptions, (s) => this.navigateTo(s));
  }

  // ── Legacy: Scanning — delegated to app-scan.js ─────────────────────────
  async renderScanning() {
    const { results, exitCode } = await runLegacyScanning({
      scanOptions: this.scanOptions,
      db: this.#db,
      c: this.#c,
      navigateTo: (s) => this.navigateTo(s),
      onSaveState: () => this.#saveState(),
    });
    if (results) this.results = results;
    this.exitCode = exitCode;
  }

  // ── Legacy: Results — delegated to app-results.js ───────────────────────
  async renderResults() {
    await runLegacyResults({
      results: this.results,
      scanOptions: this.scanOptions,
      db: this.#db,
      c: this.#c,
      useColor: this.#useColor,
      navigateTo: (s) => this.navigateTo(s),
      resultsItems: ScannerTUI.RESULTS_ITEMS,
      getFindingsBrowserModule,
    });
  }

  // ── Legacy: Check Package — delegated to app-utils.js ─────────────────
  async renderCheckPackage() {
    await runLegacyCheckPackage({
      db: this.#db,
      c: this.#c,
      navigateTo: (s) => this.navigateTo(s),
    });
  }

  // ── Legacy: Update Database — delegated to app-utils.js ────────────────
  async renderUpdateDb() {
    await runLegacyUpdateDb({ db: this.#db, c: this.#c, navigateTo: (s) => this.navigateTo(s) });
  }

  // ── Legacy: Search Database — delegated to app-utils.js ────────────────
  async renderSearchDb() {
    await runLegacySearchDb({ db: this.#db, c: this.#c, navigateTo: (s) => this.navigateTo(s) });
  }

  // ── Legacy: State persistence ───────────────────────────────────────────
  async #saveState() {
    if (!this.results) return;
    try {
      await writeFile(
        getStateFilePath(),
        JSON.stringify(
          {
            timestamp: new Date().toISOString(),
            exitCode: this.exitCode,
            scanOptions: { ...this.scanOptions },
            findingsCount: this.results.findings?.length || 0,
            packagesScanned: this.results.stats?.packagesScanned || 0,
          },
          null,
          2,
        ),
        'utf8',
      );
    } catch {
      /* Non-critical */
    }
  }

  async loadSavedState() {
    try {
      const path = getStateFilePath();
      if (!existsSync(path)) return null;
      return JSON.parse(await readFile(path, 'utf8'));
    } catch {
      return null;
    }
  }

  async #clearSavedState() {
    try {
      await unlink(getStateFilePath());
    } catch {
      /* ignore */
    }
  }

  // ── Legacy: Cleanup ─────────────────────────────────────────────────────
  async cleanup() {
    this.running = false;
    for (const fn of this.#cleanups) {
      try {
        fn();
      } catch {
        /* ignore */
      }
    }
    this.#cleanups.length = 0;
    await this.#saveState();
    cleanupTerminal();
  }

  async cleanupAndClearState() {
    await this.cleanup();
    await this.#clearSavedState();
  }
}

// ─── Public entry point ──────────────────────────────────────────────────────
/**
 * Initialise and run the shai-scanner TUI application.
 * @returns {Promise<number>} Exit code
 */
export async function runTUI() {
  if (!processStdin.isTTY || !processStdout.isTTY) {
    process.stderr.write(
      [
        'The TUI requires an interactive terminal (stdin and stdout must be TTYs).',
        '',
        'Use the CLI flags instead:',
        '  shai-scanner --scan .                         Scan current directory',
        '  shai-scanner --scan . --live --fail-on-advisory  Scan with live CVE checks',
        '  shai-scanner --check lodash@4.17.20          Check a single package',
        '  shai-scanner --update                        Update IOC database',
        '  shai-scanner --search-db lodash              Search known IOCs',
        '  shai-scanner --help                          Full usage information',
        '',
      ].join('\n'),
    );
    return EXIT_CODES.SUCCESS;
  }

  const app = new ScannerTUI();
  try {
    await app.init();
  } catch (error) {
    process.stderr.write(
      `Failed to initialize TUI: ${sanitize(error?.message || String(error))}\n`,
    );
    return EXIT_CODES.SCAN_ERROR;
  }

  let shuttingDown = false;
  const handleShutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    processStdout.write(`\nReceived ${signal}. Shutting down gracefully...\n`);
    await app.cleanup();
    process.removeListener('SIGINT', handleShutdown);
    process.removeListener('SIGTERM', handleShutdown);
    if (signal === 'SIGINT') process.kill(process.pid, 'SIGINT');
    else process.exit(128 + 15);
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  try {
    await app.run();
  } catch (error) {
    process.stderr.write(`Fatal error: ${sanitize(error?.message || String(error))}\n`);
    process.stderr.write('If this persists, try CLI flags instead: shai-scanner --help\n');
    return EXIT_CODES.SCAN_ERROR;
  } finally {
    if (!shuttingDown) await app.cleanupAndClearState();
    process.removeListener('SIGINT', handleShutdown);
    process.removeListener('SIGTERM', handleShutdown);
  }

  return app.exitCode;
}
