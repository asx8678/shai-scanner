// src/tui/core/event-bus.js
// Event system for TUI components

export class EventBus {
  #listeners;
  #onceListeners;

  constructor() {
    this.#listeners = new Map();
    this.#onceListeners = new Map();
  }

  /**
   * Subscribe to an event.
   * @param {string} event
   * @param {Function} callback
   * @returns {Function} unsubscribe
   */
  on(event, callback) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, []);
    }
    this.#listeners.get(event).push(callback);

    return () => this.off(event, callback);
  }

  /**
   * Subscribe to an event once.
   * @param {string} event
   * @param {Function} callback
   */
  once(event, callback) {
    if (!this.#onceListeners.has(event)) {
      this.#onceListeners.set(event, []);
    }
    this.#onceListeners.get(event).push(callback);
  }

  /**
   * Unsubscribe from an event.
   * @param {string} event
   * @param {Function} callback
   */
  off(event, callback) {
    const listeners = this.#listeners.get(event);
    if (listeners) {
      const idx = listeners.indexOf(callback);
      if (idx !== -1) listeners.splice(idx, 1);
    }
  }

  /**
   * Emit an event.
   * @param {string} event
   * @param {...any} args
   */
  emit(event, ...args) {
    const listeners = this.#listeners.get(event) || [];
    for (const listener of listeners) {
      try {
        listener(...args);
      } catch (error) {
        console.error(`EventBus: Error in listener for "${event}":`, error);
      }
    }

    const onceListeners = this.#onceListeners.get(event) || [];
    this.#onceListeners.delete(event);
    for (const listener of onceListeners) {
      try {
        listener(...args);
      } catch (error) {
        console.error(`EventBus: Error in once-listener for "${event}":`, error);
      }
    }
  }

  /**
   * Remove all listeners.
   */
  clear() {
    this.#listeners.clear();
    this.#onceListeners.clear();
  }
}
