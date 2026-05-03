// src/tui/core/render-coordinator.js
// Central render management for TUI components

import { stdin as processStdin, stdout as processStdout } from 'node:process';
import { Renderer, ANSI } from './renderer.js';
import { VirtualScreen } from './virtual-screen.js';
import { Component } from './component.js';

// ─── Debounce utility ────────────────────────────────────────────────────────

function debounce(fn, ms = 100) {
  let timer = null;
  const wrapper = {
    trigger(...args) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        fn(...args);
      }, ms);
    },
    cancel() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    },
    flush(...args) {
      wrapper.cancel();
      fn(...args);
    },
  };
  return wrapper;
}

// ─── Component Handle ────────────────────────────────────────────────────────

/**
 * Handle for components to interact with the coordinator.
 */
class ComponentHandle {
  /** @type {string} */
  id;
  /** @type {Component} */
  #component;
  /** @type {RenderCoordinator} */
  #coordinator;

  constructor(coordinator, component) {
    this.id = component.id;
    this.#component = component;
    this.#coordinator = coordinator;
  }

  /**
   * Request a re-render for this component.
   */
  requestRender() {
    this.#coordinator.requestRender(this.id);
  }

  /**
   * Get the component instance.
   * @returns {Component}
   */
  getComponent() {
    return this.#component;
  }
}

// ─── Render Context ──────────────────────────────────────────────────────────

/**
 * Context passed to component render methods.
 */
class RenderContext {
  /** @type {{ row: number, col: number, width: number, height: number }} */
  bounds;
  /** @type {{ cols: number, rows: number }} */
  terminalSize;
  /** @type {number} */
  nextRow;

  constructor(terminalSize) {
    this.bounds = { row: 0, col: 0, width: terminalSize.cols, height: 0 };
    this.terminalSize = terminalSize;
    this.nextRow = 0;
  }

  /**
   * Advance to the next row and return bounds for the next component.
   * @param {number} height - Height of the component
   * @returns {{ row: number, col: number, width: number, height: number }}
   */
  allocateRows(height) {
    const bounds = {
      row: this.nextRow,
      col: 0,
      width: this.terminalSize.cols,
      height: Math.min(height, this.terminalSize.rows - this.nextRow),
    };
    this.nextRow += bounds.height;
    return bounds;
  }
}

// ─── Render Coordinator ──────────────────────────────────────────────────────

/**
 * Central render management for TUI components.
 *
 * Responsibilities:
 * - Manages the alternate screen buffer
 * - Coordinates rendering of all components
 * - Handles terminal resize events
 * - Batches render requests for efficiency
 * - Provides a single VirtualScreen for all components
 */
export class RenderCoordinator {
  /** @type {Renderer} */
  #renderer;
  /** @type {VirtualScreen} */
  #virtualScreen;
  /** @type {Map<string, Component>} */
  #components;
  /** @type {Map<string, ComponentHandle>} */
  #handles;
  /** @type {Set<string>} */
  #dirtyRegions;
  /** @type {boolean} */
  #renderScheduled;
  /** @type {boolean} */
  #isRendering;
  /** @type {boolean} */
  #isInAlternateScreen;
  /** @type {{ cols: number, rows: number }} */
  #terminalSize;
  /** @type {ReturnType<typeof debounce>} */
  #resizeDebouncer;
  /** @type {Function | null} */
  #unsubscribeResize;
  /** @type {Function | null} */
  #unsubscribeCleanup;
  /** @type {Array<Function>} */
  #cleanups;

  constructor(options = {}) {
    this.#components = new Map();
    this.#handles = new Map();
    this.#dirtyRegions = new Set();
    this.#renderScheduled = false;
    this.#isRendering = false;
    this.#isInAlternateScreen = false;
    this.#cleanups = [];
    this.#unsubscribeResize = null;
    this.#unsubscribeCleanup = null;

    // Get terminal size
    this.#terminalSize = {
      cols: options.cols || processStdout.columns || 80,
      rows: options.rows || processStdout.rows || 24,
    };

    // Create renderer and virtual screen
    this.#renderer = new Renderer(
      {
        terminalSize: { ...this.#terminalSize },
        onResize(cb) {
          // Resize is handled by #handleResize directly
          return () => {};
        },
      },
      { stdout: options.stdout || processStdout },
    );
    this.#virtualScreen = new VirtualScreen(this.#terminalSize.cols, this.#terminalSize.rows);

    // Debounced resize handler
    this.#resizeDebouncer = debounce((size) => {
      this.#handleResize(size);
    }, 100);
  }

  /**
   * Initialize the coordinator — enters alternate screen mode
   * and sets up the rendering pipeline.
   */
  initialize() {
    if (this.#isInAlternateScreen) return;

    // Enter alternate screen
    if (processStdout.isTTY) {
      processStdout.write(ANSI.enterAlternateScreen);
      processStdout.write(ANSI.cursorHide);
      processStdout.write(ANSI.clear);
      processStdout.write(ANSI.cursorHome);
    }
    this.#isInAlternateScreen = true;

    // Register resize handler
    const onResize = () => {
      const newSize = {
        cols: processStdout.columns || 80,
        rows: processStdout.rows || 24,
      };
      this.#resizeDebouncer.trigger(newSize);
    };
    processStdout.on('resize', onResize);
    this.#unsubscribeResize = () => processStdout.off('resize', onResize);

    // Register cleanup
    this.#unsubscribeCleanup = () => this.destroy();
  }

  /**
   * Register a component with the coordinator.
   * Returns a ComponentHandle for interacting with the component.
   *
   * @param {Component} component
   * @returns {ComponentHandle}
   */
  registerComponent(component) {
    const handle = new ComponentHandle(this, component);
    this.#components.set(component.id, component);
    this.#handles.set(component.id, handle);
    this.#dirtyRegions.add(component.id);

    // Set coordinator reference on component
    component.__setCoordinator(this);

    // Mount component if coordinator is initialized
    if (this.#isInAlternateScreen) {
      component.mount();
    }

    return handle;
  }

  /**
   * Unregister a component from the coordinator.
   * @param {Component} component
   */
  unregisterComponent(component) {
    const handle = this.#handles.get(component.id);
    if (handle) {
      component.unmount();
      component.__setCoordinator(null);
      this.#components.delete(component.id);
      this.#handles.delete(component.id);
      this.#dirtyRegions.delete(component.id);
    }
  }

  /**
   * Request a re-render. Renders are batched — multiple requests
   * within the same tick result in a single render pass.
   *
   * @param {string} componentId - Optional: specific component to re-render
   */
  requestRender(componentId = null) {
    if (componentId) {
      this.#dirtyRegions.add(componentId);
    }

    if (!this.#renderScheduled) {
      this.#renderScheduled = true;
      // Use queueMicrotask for render batching
      queueMicrotask(() => this.#performRender());
    }
  }

  /**
   * Perform the actual render pass.
   * @private
   */
  #performRender() {
    if (this.#isRendering) return;
    this.#isRendering = true;
    this.#renderScheduled = false;

    try {
      // Clear virtual screen
      this.#virtualScreen.clear();

      // Create render context
      const ctx = new RenderContext(this.#terminalSize);

      // Let all registered components render to the virtual screen
      for (const component of this.#components.values()) {
        component.render(this.#virtualScreen, ctx);
      }

      // Single differential render to terminal
      this.#renderer.render(this.#virtualScreen);
    } finally {
      this.#isRendering = false;
      this.#dirtyRegions.clear();
    }
  }

  /**
   * Handle terminal resize.
   * @private
   * @param {{ cols: number, rows: number }} size
   */
  #handleResize({ cols, rows }) {
    this.#terminalSize = { cols, rows };
    this.#renderer.resize(cols, rows);
    this.#virtualScreen.resize(cols, rows);
    this.requestRender(); // Full re-render on resize
  }

  /**
   * Get current terminal dimensions.
   * @returns {{ cols: number, rows: number }}
   */
  get size() {
    return { ...this.#terminalSize };
  }

  /**
   * Get the virtual screen (for testing).
   * @returns {VirtualScreen}
   */
  get screen() {
    return this.#virtualScreen;
  }

  /**
   * Get the renderer (for testing).
   * @returns {Renderer}
   */
  get renderer() {
    return this.#renderer;
  }

  /**
   * Check if we're in alternate screen mode.
   * @returns {boolean}
   */
  get isInAlternateScreen() {
    return this.#isInAlternateScreen;
  }

  /**
   * Clean up and restore terminal state.
   */
  destroy() {
    // Unregister resize handler
    if (this.#unsubscribeResize) {
      this.#unsubscribeResize();
      this.#unsubscribeResize = null;
    }

    // Unmount all components
    for (const component of this.#components.values()) {
      component.unmount();
      component.__setCoordinator(null);
    }
    this.#components.clear();
    this.#handles.clear();

    // Exit alternate screen
    if (this.#isInAlternateScreen) {
      if (processStdout.isTTY) {
        processStdout.write(ANSI.cursorShow);
        processStdout.write(ANSI.exitAlternateScreen);
      }
      this.#isInAlternateScreen = false;
    }

    // Run cleanup handlers
    for (const cleanup of this.#cleanups) {
      try {
        cleanup();
      } catch {
        /* ignore */
      }
    }
    this.#cleanups.length = 0;

    // Unregister from global cleanup
    if (this.#unsubscribeCleanup) {
      this.#unsubscribeCleanup();
      this.#unsubscribeCleanup = null;
    }
  }

  /**
   * Register a cleanup function.
   * @param {Function} fn
   */
  onCleanup(fn) {
    this.#cleanups.push(fn);
  }
}
