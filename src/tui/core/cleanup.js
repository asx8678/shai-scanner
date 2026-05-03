// src/tui/core/cleanup.js
// Terminal cleanup and process signal handling

import { stdin as processStdin, stdout as processStdout } from 'node:process';
import { ANSI } from './renderer.js';

// ─── Cleanup tracker ──────────────────────────────────────────────────────────
// Centralized to prevent duplicate handler registration.
// Each entry is { id, fn } so we can remove specific handlers later.
const CLEANUP_HANDLERS = [];
let CLEANUP_REGISTERED = false;
let CLEANUP_ID_SEQ = 0;

/**
 * Register a cleanup function. Returns an unsubscribe function.
 * @param {Function} fn
 * @returns {Function} unsubscribe — call to remove this handler
 */
export function registerCleanup(fn) {
  const id = ++CLEANUP_ID_SEQ;
  CLEANUP_HANDLERS.push({ id, fn });
  // Return unsubscribe for explicit teardown (memory-leak prevention)
  return () => {
    const idx = CLEANUP_HANDLERS.findIndex((h) => h.id === id);
    if (idx !== -1) CLEANUP_HANDLERS.splice(idx, 1);
  };
}

// ─── Cleanup state ─────────────────────────────────────────────────────────────
let CLEANUP_DONE = false;

/**
 * Cleanup terminal state — restore cursor, exit alternate screen, etc.
 * Called during normal exit, SIGINT, SIGTERM, etc.
 */
export function cleanupTerminal() {
  if (CLEANUP_DONE) return;
  CLEANUP_DONE = true;

  // Exit alternate screen buffer if we're in it (defensive — ScreenManager.exit
  // should already be registered as a cleanup handler, but belt-and-suspenders).
  // We write this FIRST so the cursor show happens on the main screen.
  try {
    processStdout.write(ANSI.exitAlternateScreen);
  } catch {
    /* ignore */
  }

  // Show cursor
  try {
    processStdout.write(ANSI.cursorShow);
  } catch {
    /* ignore */
  }

  // Restore stdin raw mode
  // Note: We don't import KeyReader here to avoid circular dependencies.
  // The KeyReader.destroyActive() is called from cleanupTerminal in tui.js
  // which is the main entry point. If we need to be self-contained,
  // we could move the raw mode restoration here, but for now we rely
  // on the cleanup handler registered by KeyReader.

  // Run all registered cleanup handlers (snapshot to avoid mutation during iteration)
  const handlers = CLEANUP_HANDLERS.slice();
  CLEANUP_HANDLERS.length = 0;
  for (const { fn } of handlers) {
    try {
      fn();
    } catch {
      /* swallow */
    }
  }
}

/**
 * Reset cleanup state — useful for testing.
 * @internal
 */
export function resetCleanupState() {
  CLEANUP_DONE = false;
}

/**
 * Get whether cleanup is registered.
 * @returns {boolean}
 */
export function isCleanupRegistered() {
  return CLEANUP_REGISTERED;
}

/**
 * Mark cleanup as registered.
 */
export function markCleanupRegistered() {
  CLEANUP_REGISTERED = true;
}

/**
 * Get the cleanup handlers (for testing).
 * @internal
 */
export function getCleanupHandlers() {
  return CLEANUP_HANDLERS;
}
