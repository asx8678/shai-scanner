// ─── shai-scanner TUI toolkit ───────────────────────────────────────────────
// Zero-dependency terminal UI helpers using only Node.js built-ins (Node ≥18).
// All components gracefully degrade when stdout/stderr is not a TTY.
//
// Phase 9 additions:
//   • SIGWINCH-aware resize callbacks
//   • Input debouncing for rapid keypress handling
//   • Accessibility text alternatives alongside color coding
//   • Proper event-listener cleanup to prevent memory leaks
//   • Terminal size tracking
// ───────────────────────────────────────────────────────────────────────────────

import {
  stdin as processStdin,
  stdout as processStdout,
  stderr as processStderr,
} from 'node:process';
import { createInterface } from 'node:readline/promises';
import { colorize, stripAnsi } from './utils.js';

// Import core infrastructure from dedicated modules
import {
  registerCleanup,
  cleanupTerminal as coreCleanupTerminal,
  resetCleanupState as coreResetCleanupState,
  getCleanupHandlers,
  markCleanupRegistered,
  isCleanupRegistered,
} from './tui/core/cleanup.js';
import {
  onResize as coreOnResize,
  getTerminalSize as coreGetTerminalSize,
  debounce as coreDebounce,
  getResizeListeners,
} from './tui/core/terminal.js';
import { ANSI } from './tui/core/renderer.js';
import { ScreenManager } from './tui/core/screen-manager.js';
import { KeyReader } from './tui/core/key-reader.js';

// Re-export core functions with original names for backward compatibility
export const onResize = coreOnResize;
export const getTerminalSize = coreGetTerminalSize;
export const debounce = coreDebounce;

// Re-export classes
export { ScreenManager, KeyReader, ANSI };

// ───────────────────────────────────────────────────────────────────────────────
//  3-4. Spinner & ProgressBar — re-exported from component modules
// ───────────────────────────────────────────────────────────────────────────────

export { Spinner, ProgressBar, LiveProgress } from './tui/components/progress.js';

// ───────────────────────────────────────────────────────────────────────────────
//  5-6. SelectMenu & CheckboxMenu — migrated to src/tui/components/menu.js
// ───────────────────────────────────────────────────────────────────────────────

// Re-export from migrated component for backward compatibility
export { SelectMenu, CheckboxMenu } from './tui/components/menu.js';

// ───────────────────────────────────────────────────────────────────────────────
//  7. TextInput & confirm — migrated to src/tui/components/input.js
// ───────────────────────────────────────────────────────────────────────────────

// Re-export from migrated component for backward compatibility
export { TextInput, confirm } from './tui/components/input.js';

// ───────────────────────────────────────────────────────────────────────────────
//  9. FileBrowser — re-exported from new component location
// ───────────────────────────────────────────────────────────────────────────────
export { FileBrowser } from './tui/components/browser.js';

// ───────────────────────────────────────────────────────────────────────────────
//  10. Box — re-exported from component module
// ───────────────────────────────────────────────────────────────────────────────

export { Box } from './tui/components/box.js';

// ───────────────────────────────────────────────────────────────────────────────
//  11. FindingsBrowser — re-exported from component module
// ───────────────────────────────────────────────────────────────────────────────

export { FindingsBrowser } from './tui/components/findings.js';

// ───────────────────────────────────────────────────────────────────────────────
//  VirtualScreen ── re-exported from src/tui/core/ for backward compat
// ───────────────────────────────────────────────────────────────────────────────

export { VirtualScreen } from './tui/core/virtual-screen.js';

// ───────────────────────────────────────────────────────────────────────────────
//  Renderer ── re-exported from src/tui/core/ for backward compat
// ───────────────────────────────────────────────────────────────────────────────

export { Renderer } from './tui/core/renderer.js';

// ───────────────────────────────────────────────────────────────────────────────
//  11. cleanupTerminal ── safety function
// ───────────────────────────────────────────────────────────────────────────────

export function cleanupTerminal() {
  // Restore stdin raw mode before calling core cleanup
  if (KeyReader.isRaw) {
    try {
      processStdin.setRawMode(false);
    } catch {
      /* ignore */
    }
    KeyReader.isRaw = false;
  }

  // Destroy any active KeyReader (its cleanup handler is already unsubscribed
  // so we won't double-destroy).
  try {
    KeyReader.destroyActive();
  } catch {
    /* ignore */
  }

  // Call the core cleanup function
  coreCleanupTerminal();
}

/**
 * Reset cleanup state — useful for testing.
 * @internal
 */
export function resetCleanupState() {
  coreResetCleanupState();
}

// ─── Module-level setup ────────────────────────────────────────────────────────
// Hook into process events only once to ensure terminal is always restored.
// We DON'T register cleanupTerminal itself as a handler (that was circular).
// Instead, we call cleanupTerminal directly from process events.

if (!isCleanupRegistered()) {
  markCleanupRegistered();

  // We need a reference to #activeInstance, which is a private field.
  // cleanupTerminal already handles everything, so just call it directly.
  const onExit = () => cleanupTerminal();

  // Use a WeakRef pattern so the handler doesn't keep objects alive.
  processStdin.on('close', onExit);
  process.on('SIGINT', () => {
    // SIGINT: show cursor, reset terminal, then exit with a signal-appropriate code.
    cleanupTerminal();
    // Re-raise with default handler so the parent process sees the signal
    process.removeListener('SIGINT', onExit);
    process.kill(process.pid, 'SIGINT');
  });
  process.on('SIGTERM', () => {
    cleanupTerminal();
    process.exit(128 + 15); // conventional exit code for SIGTERM
  });
  process.on('exit', onExit);

  // ── SIGWINCH: notify all registered resize listeners ─────────────────────
  process.on('SIGWINCH', () => {
    for (const cb of getResizeListeners().slice()) {
      try {
        cb(coreGetTerminalSize());
      } catch {
        /* swallow */
      }
    }
  });
}
