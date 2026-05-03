/**
 * Quick Start Template — test/test.js
 *
 * Basic test suite using Node.js built-in test runner (node:test).
 * Run with: npm test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sha256, generateToken, deepClone, safeGet, isValidEmail, isValidVersion } from '../src/utils.js';

// ── Hashing Tests ──────────────────────────────────────────────────────────

describe('sha256()', () => {
  it('returns a 64-character hex string', () => {
    const hash = sha256('hello');
    assert.equal(hash.length, 64);
    assert.match(hash, /^[0-9a-f]{64}$/);
  });

  it('is deterministic', () => {
    const a = sha256('test-input');
    const b = sha256('test-input');
    assert.equal(a, b);
  });

  it('produces different hashes for different inputs', () => {
    const a = sha256('foo');
    const b = sha256('bar');
    assert.notEqual(a, b);
  });
});

// ── Token Generation Tests ─────────────────────────────────────────────────

describe('generateToken()', () => {
  it('generates a token of the specified length', () => {
    const token = generateToken(16);
    assert.equal(token.length, 32); // hex doubles the byte count
  });

  it('generates unique tokens', () => {
    const t1 = generateToken();
    const t2 = generateToken();
    assert.notEqual(t1, t2);
  });

  it('defaults to 32 bytes', () => {
    const token = generateToken();
    assert.equal(token.length, 64); // 32 bytes = 64 hex chars
  });
});

// ── Deep Clone Tests ───────────────────────────────────────────────────────

describe('deepClone()', () => {
  it('creates a deep copy', () => {
    const original = { a: { b: { c: 42 } } };
    const cloned = deepClone(original);
    assert.deepEqual(cloned, original);
    cloned.a.b.c = 99;
    assert.equal(original.a.b.c, 42); // original unchanged
  });

  it('handles arrays', () => {
    const arr = [1, [2, [3]]];
    const cloned = deepClone(arr);
    assert.deepEqual(cloned, arr);
  });
});

// ── Safe Get Tests ─────────────────────────────────────────────────────────

describe('safeGet()', () => {
  const obj = { a: { b: { c: 'found' } } };

  it('gets nested values', () => {
    assert.equal(safeGet(obj, 'a.b.c'), 'found');
  });

  it('returns default for missing paths', () => {
    assert.equal(safeGet(obj, 'a.x.y', 'default'), 'default');
  });

  it('returns undefined when no default', () => {
    assert.equal(safeGet(obj, 'nope'), undefined);
  });
});

// ── Validation Tests ───────────────────────────────────────────────────────

describe('isValidEmail()', () => {
  it('accepts valid emails', () => {
    assert.ok(isValidEmail('user@example.com'));
    assert.ok(isValidEmail('admin@company.co.uk'));
  });

  it('rejects invalid emails', () => {
    assert.ok(!isValidEmail('not-an-email'));
    assert.ok(!isValidEmail('@no-local.com'));
    assert.ok(!isValidEmail('spaces in@email.com'));
  });
});

describe('isValidVersion()', () => {
  it('accepts valid semver strings', () => {
    assert.ok(isValidVersion('1.0.0'));
    assert.ok(isValidVersion('12.34.56'));
  });

  it('rejects non-semver strings', () => {
    assert.ok(!isValidVersion('latest'));
    assert.ok(!isValidVersion('v1'));
    assert.ok(!isValidVersion('not-a-version'));
  });
});
