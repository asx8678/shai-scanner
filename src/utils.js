import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync, chmodSync, lstatSync, readdirSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULTS } from './constants.js';

const ANSI_ESCAPE_RE = /[\u001B\u009B][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
const CONTROL_RE = /[\u0000-\u001F\u007F]/g;

export function sanitize(input, maxLength = 1000) {
  const value = String(input ?? '');
  const cleaned = value.replace(ANSI_ESCAPE_RE, '').replace(CONTROL_RE, '').trim();
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength - 1)}…` : cleaned;
}

export function stripAnsi(input) {
  return String(input ?? '').replace(ANSI_ESCAPE_RE, '');
}

export function hasControlChars(value) {
  return /[\u0000-\u001F\u007F]/.test(String(value ?? ''));
}

export function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function safeReadText(filePath, maxBytes = DEFAULTS.MAX_TEXT_FILE_BYTES) {
  try {
    const st = statSync(filePath);
    if (!st.isFile() || st.size > maxBytes) return null;
    return readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

export function safeReadJson(filePath, maxBytes = DEFAULTS.MAX_TEXT_FILE_BYTES) {
  const text = safeReadText(filePath, maxBytes);
  if (text === null) return null;
  return safeJsonParse(text);
}

export function ensureDirPrivate(dirPath) {
  if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true, mode: DEFAULTS.DIR_MODE_PRIVATE });
  try { chmodSync(dirPath, DEFAULTS.DIR_MODE_PRIVATE); } catch {}
}

export function writeFileAtomic(filePath, content, mode = DEFAULTS.FILE_MODE_PRIVATE) {
  ensureDirPrivate(dirname(filePath));
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  try {
    writeFileSync(tmpPath, content, { mode });
    try { chmodSync(tmpPath, mode); } catch {}
    renameSync(tmpPath, filePath);
  } finally {
    try { unlinkSync(tmpPath); } catch {}
  }
}

export function getCacheDir() {
  const home = homedir();
  if (process.env.SHAI_SCANNER_CACHE_DIR) return resolve(process.env.SHAI_SCANNER_CACHE_DIR);
  if (process.platform === 'win32') {
    return join(process.env.LOCALAPPDATA || join(home, 'AppData', 'Local'), 'shai-scanner');
  }
  if (process.platform === 'darwin') {
    return join(home, 'Library', 'Caches', 'shai-scanner');
  }
  return join(process.env.XDG_CACHE_HOME || join(home, '.cache'), 'shai-scanner');
}

export function getCachePath() {
  return join(getCacheDir(), 'vulndb-v4.json');
}

export function envFlag(name) {
  const value = process.env[name];
  if (!value) return false;
  return ['1', 'true', 'yes', 'y', 'on'].includes(String(value).toLowerCase());
}

export function safeRealpath(filePath) {
  try { return realpathSync(filePath); } catch { return resolve(filePath); }
}

export function safeStat(filePath) {
  try { return statSync(filePath); } catch { return null; }
}

export function safeLstat(filePath) {
  try { return lstatSync(filePath); } catch { return null; }
}

export function safeIsDirectory(filePath) {
  const st = safeStat(filePath);
  return !!st?.isDirectory();
}

export function safeReaddir(filePath, withFileTypes = true) {
  try { return readdirSync(filePath, { withFileTypes }); } catch { return []; }
}

export function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const v = Math.trunc(n);
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

export function uniqueBy(items, keyFn) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function parsePackageSpec(spec) {
  const input = String(spec ?? '').trim();
  if (!input) return null;
  if (input.startsWith('@')) {
    const lastAt = input.lastIndexOf('@');
    if (lastAt <= 0) return null;
    const name = input.slice(0, lastAt);
    const version = input.slice(lastAt + 1);
    return name && version ? { name, version } : null;
  }
  const at = input.lastIndexOf('@');
  if (at <= 0) return null;
  const name = input.slice(0, at);
  const version = input.slice(at + 1);
  return name && version ? { name, version } : null;
}

export function parseNameVersionFromPackageKey(rawKey) {
  if (!rawKey) return null;
  let key = String(rawKey).trim().replace(/^['"]|['"]$/g, '');
  if (!key || key === '.') return null;
  key = key.replace(/^\//, '');
  key = key.replace(/^node_modules\//, '');
  key = key.replace(/\([^)]*\)$/g, '');
  key = key.replace(/_\w+$/g, '');
  key = key.replace(/@npm:/g, '@');
  key = decodeURIComponent(key);

  const lastAt = key.lastIndexOf('@');
  if (lastAt <= 0) return null;
  const name = key.slice(0, lastAt);
  let version = key.slice(lastAt + 1);
  version = version.replace(/^npm:/, '').replace(/\([^)]*\).*$/, '').replace(/,.*/, '');
  if (!name || !version || version.includes('/')) return null;
  return { name, version };
}

export function packageNameFromNodeModulesPath(pkgPath) {
  const normalized = String(pkgPath).replace(/\\/g, '/');
  const parts = normalized.split('/');
  const idx = parts.lastIndexOf('node_modules');
  if (idx < 0 || idx + 1 >= parts.length) return null;
  const first = parts[idx + 1];
  if (first?.startsWith('@')) {
    const second = parts[idx + 2];
    return second ? `${first}/${second}` : null;
  }
  return first || null;
}

export function sha256File(filePath, maxBytes = DEFAULTS.MAX_TEXT_FILE_BYTES) {
  try {
    const st = statSync(filePath);
    if (!st.isFile() || st.size > maxBytes) return null;
    const hash = createHash('sha256');
    hash.update(readFileSync(filePath));
    return hash.digest('hex');
  } catch {
    return null;
  }
}

export function moduleRootDir() {
  return dirname(fileURLToPath(import.meta.url));
}

export function colorize(enabled = true) {
  const wrap = (codeOpen, codeClose = '\u001b[0m') => (text) => enabled ? `${codeOpen}${text}${codeClose}` : String(text);
  return {
    red: wrap('\u001b[31m'),
    green: wrap('\u001b[32m'),
    yellow: wrap('\u001b[33m'),
    blue: wrap('\u001b[34m'),
    magenta: wrap('\u001b[35m'),
    cyan: wrap('\u001b[36m'),
    gray: wrap('\u001b[90m'),
    bold: wrap('\u001b[1m'),
    dim: wrap('\u001b[2m')
  };
}
