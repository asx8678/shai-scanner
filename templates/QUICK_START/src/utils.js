/**
 * Quick Start Template — src/utils.js
 *
 * Example utility module demonstrating import patterns
 * that shai-scanner monitors for supply-chain IOCs.
 */

import { createHash, randomBytes } from 'node:crypto';
import lodash from 'lodash';
import axios from 'axios';

// ── Hashing Utilities ──────────────────────────────────────────────────────

/**
 * Generate a SHA-256 hash of the input string.
 * @param {string} input
 * @returns {string} Hex-encoded hash
 */
export function sha256(input) {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Generate a random token of the specified length.
 * @param {number} [length=32]
 * @returns {string} Hex-encoded random token
 */
export function generateToken(length = 32) {
  return randomBytes(length).toString('hex');
}

// ── Data Utilities ─────────────────────────────────────────────────────────

/**
 * Deep clone an object using structuredClone or lodash fallback.
 * @param {*} obj
 * @returns {*}
 */
export function deepClone(obj) {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }
  return lodash.cloneDeep(obj);
}

/**
 * Safely get a nested property value.
 * @param {Object} obj
 * @param {string} path - Dot-separated path (e.g., 'a.b.c')
 * @param {*} defaultValue
 * @returns {*}
 */
export function safeGet(obj, path, defaultValue = undefined) {
  return lodash.get(obj, path, defaultValue);
}

/**
 * Debounce a function call.
 * @param {Function} fn
 * @param {number} ms
 * @returns {Function}
 */
export function debounce(fn, ms = 300) {
  return lodash.debounce(fn, ms);
}

// ── HTTP Utilities ─────────────────────────────────────────────────────────

/**
 * Safe HTTP GET with timeout and error handling.
 * @param {string} url
 * @param {Object} [options]
 * @returns {Promise<{data: any, status: number} | {error: string}>}
 */
export async function safeFetch(url, options = {}) {
  const { timeout = 5000, headers = {} } = options;

  try {
    const response = await axios.get(url, { timeout, headers });
    return { data: response.data, status: response.status };
  } catch (err) {
    return { error: err.message };
  }
}

// ── Validation Utilities ───────────────────────────────────────────────────

/**
 * Validate an email address (basic check).
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validate a semver-ish version string.
 * @param {string} version
 * @returns {boolean}
 */
export function isValidVersion(version) {
  return /^\d+\.\d+\.\d+/.test(version);
}
