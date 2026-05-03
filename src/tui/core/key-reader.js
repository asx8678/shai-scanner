// src/tui/core/key-reader.js
// KeyReader — raw-mode keypress reader

import { stdin as processStdin } from 'node:process';
import { registerCleanup } from './cleanup.js';

export class KeyReader {
  static isRaw = false;
  /** @type {KeyReader|null} Track the active instance to prevent leaks */
  static #activeInstance = null;

  #destroyed = false;
  #buf = [];
  #resolvers = [];
  #onData = null;
  #unsubscribeCleanup = null;

  constructor() {
    if (!processStdin.isTTY) return;

    // Ensure only one active KeyReader at a time — destroy the previous one
    if (KeyReader.#activeInstance && KeyReader.#activeInstance !== this) {
      KeyReader.#activeInstance.destroy();
    }
    KeyReader.#activeInstance = this;

    this.#onData = (data) => {
      if (this.#resolvers.length > 0) {
        const resolve = this.#resolvers.shift();
        resolve(this.#parse(data));
      } else {
        this.#buf.push(data);
      }
    };

    processStdin.on('data', this.#onData);

    if (!KeyReader.isRaw) {
      processStdin.setRawMode(true);
      KeyReader.isRaw = true;
    }

    this.#unsubscribeCleanup = registerCleanup(() => this.destroy());
  }

  /** Read a single keypress, returning a parsed key object. */
  readKey() {
    return new Promise((resolve) => {
      if (this.#buf.length > 0) {
        resolve(this.#parse(this.#buf.shift()));
      } else {
        this.#resolvers.push(resolve);
      }
    });
  }

  /** Parse a raw Buffer into a key object. */
  #parse(buf) {
    const raw = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
    const hex = raw.toString('hex');
    const char = raw.toString('utf8');

    // Escape sequences for arrow keys
    if (hex === '1b5b41') return { name: 'up', raw, char: '' };
    if (hex === '1b5b42') return { name: 'down', raw, char: '' };
    if (hex === '1b5b44') return { name: 'left', raw, char: '' };
    if (hex === '1b5b43') return { name: 'right', raw, char: '' };

    // Named keys
    if (hex === '0d') return { name: 'return', raw, char: '\r' };
    if (hex === '20') return { name: 'space', raw, char: ' ' };
    if (hex === '1b') return { name: 'escape', raw, char: '' };
    if (hex === '7f') return { name: 'backspace', raw, char: '\x7f' };
    if (hex === '09') return { name: 'tab', raw, char: '\t' };
    if (char === 'q' || char === 'Q') return { name: 'q', raw, char };

    return { name: char || 'unknown', raw, char };
  }

  /** Destroy the currently active KeyReader instance (called during cleanup). */
  static destroyActive() {
    if (KeyReader.#activeInstance) {
      KeyReader.#activeInstance.destroy();
    }
  }

  /** Restore stdin to normal mode and clean up. */
  destroy() {
    if (this.#destroyed) return;
    this.#destroyed = true;

    if (this.#onData) {
      processStdin.off('data', this.#onData);
      this.#onData = null;
    }

    if (KeyReader.isRaw) {
      try {
        processStdin.setRawMode(false);
      } catch {
        /* ignore */
      }
      KeyReader.isRaw = false;
    }

    // Unsubscribe from cleanup tracker to prevent memory leaks
    if (this.#unsubscribeCleanup) {
      this.#unsubscribeCleanup();
      this.#unsubscribeCleanup = null;
    }

    if (KeyReader.#activeInstance === this) {
      KeyReader.#activeInstance = null;
    }

    // Reject any pending resolvers so callers aren't stuck forever
    for (const r of this.#resolvers) r({ name: 'escape', raw: Buffer.alloc(0), char: '' });
    this.#resolvers.length = 0;
    this.#buf.length = 0;
  }
}
