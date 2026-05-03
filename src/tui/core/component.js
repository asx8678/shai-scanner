// src/tui/core/component.js
// Base component class for TUI components

let nextComponentId = 0;

export class Component {
  /** @type {string} */
  #id;
  /** @type {import('./render-coordinator.js').RenderCoordinator | null} */
  #coordinator;
  /** @type {Component | null} */
  #parent;
  /** @type {Map<string, Component>} */
  #children;
  /** @type {object} */
  #state;
  /** @type {boolean} */
  #dirty;
  /** @type {boolean} */
  #mounted;

  constructor(options = {}) {
    this.#id = options.id || `component-${nextComponentId++}`;
    this.#coordinator = null;
    this.#parent = null;
    this.#children = new Map();
    this.#state = {};
    this.#dirty = true;
    this.#mounted = false;
  }

  /** @readonly */
  get id() {
    return this.#id;
  }

  /** @readonly */
  get isMounted() {
    return this.#mounted;
  }

  /** @readonly */
  get parent() {
    return this.#parent;
  }

  /** @readonly */
  get children() {
    return Array.from(this.#children.values());
  }

  /**
   * Set component state and trigger re-render.
   * @param {object} newState - Partial state to merge
   */
  setState(newState) {
    Object.assign(this.#state, newState);
    this.#dirty = true;
    this.requestRender();
  }

  /** @protected */
  get state() {
    return this.#state;
  }

  /**
   * Mount the component — called when added to the component tree.
   * Override for setup logic.
   */
  mount() {
    this.#mounted = true;
    for (const child of this.#children.values()) {
      child.mount();
    }
  }

  /**
   * Unmount the component — called when removed from the tree.
   * Override for cleanup logic.
   */
  unmount() {
    this.#mounted = false;
    for (const child of this.#children.values()) {
      child.unmount();
    }
  }

  /**
   * Render the component to a VirtualScreen.
   * Override in subclasses.
   *
   * @param {import('./virtual-screen.js').VirtualScreen} screen
   * @param {object} ctx - Render context with bounds and terminal size
   */
  render(screen, ctx) {
    // Default: render children
    for (const child of this.#children.values()) {
      child.render(screen, ctx);
    }
  }

  /**
   * Handle a keypress event.
   * Override in subclasses.
   *
   * @param {object} key - Key object with name, char, raw properties
   * @returns {boolean} true if handled, false to bubble up
   */
  handleKey(key) {
    return false; // Not handled — bubble up
  }

  /**
   * Request a re-render through the coordinator.
   */
  requestRender() {
    this.#coordinator?.requestRender(this.#id);
  }

  /**
   * Add a child component.
   * @param {Component} child
   */
  addChild(child) {
    child.#parent = this;
    this.#children.set(child.id, child);
    if (this.#mounted) child.mount();
  }

  /**
   * Remove a child component.
   * @param {Component} child
   */
  removeChild(child) {
    child.unmount();
    child.#parent = null;
    this.#children.delete(child.id);
  }

  /**
   * Find a child component by ID.
   * @param {string} id
   * @returns {Component | undefined}
   */
  findChild(id) {
    return this.#children.get(id);
  }

  /**
   * Remove all children.
   */
  clearChildren() {
    for (const child of this.#children.values()) {
      child.unmount();
      child.#parent = null;
    }
    this.#children.clear();
  }

  /** @internal */
  __setCoordinator(coordinator) {
    this.#coordinator = coordinator;
  }

  /** @internal */
  __isDirty() {
    return this.#dirty;
  }

  /** @internal */
  __clearDirty() {
    this.#dirty = false;
  }
}
