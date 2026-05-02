export function parseVersion(version) {
  const raw = String(version ?? '').trim().replace(/^v/i, '');
  const match = raw.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:[-+].*)?$/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2] ?? 0), Number(match[3] ?? 0)];
}

export function compareVersions(a, b) {
  const av = Array.isArray(a) ? a : parseVersion(a);
  const bv = Array.isArray(b) ? b : parseVersion(b);
  if (!av || !bv) return NaN;
  for (let i = 0; i < 3; i++) {
    if (av[i] < bv[i]) return -1;
    if (av[i] > bv[i]) return 1;
  }
  return 0;
}

function comparatorMatches(comp, version) {
  const match = comp.trim().match(/^(<=|>=|<|>|=)?\s*v?(\d+(?:\.\d+){0,2}(?:[-+][\w.-]+)?)$/);
  if (!match) return false;
  const op = match[1] || '=';
  const c = compareVersions(version, match[2]);
  if (Number.isNaN(c)) return false;
  if (op === '=') return c === 0;
  if (op === '>=') return c >= 0;
  if (op === '<=') return c <= 0;
  if (op === '>') return c > 0;
  if (op === '<') return c < 0;
  return false;
}

function caretRangeMatches(base, version) {
  const b = parseVersion(base);
  const v = parseVersion(version);
  if (!b || !v) return false;
  if (compareVersions(v, b) < 0) return false;
  if (b[0] > 0) return v[0] === b[0];
  if (b[1] > 0) return v[0] === 0 && v[1] === b[1];
  return v[0] === 0 && v[1] === 0 && v[2] === b[2];
}

function tildeRangeMatches(base, version) {
  const b = parseVersion(base);
  const v = parseVersion(version);
  if (!b || !v) return false;
  if (compareVersions(v, b) < 0) return false;
  return v[0] === b[0] && v[1] === b[1];
}

function wildcardRangeMatches(spec, version) {
  const v = parseVersion(version);
  if (!v) return false;
  const cleaned = spec.replace(/^v/i, '').trim();
  const parts = cleaned.split('.');
  if (!parts.some((p) => /^(?:x|X|\*)$/.test(p))) return false;
  for (let i = 0; i < parts.length; i++) {
    if (/^(?:x|X|\*)$/.test(parts[i])) return true;
    if (Number(parts[i]) !== v[i]) return false;
  }
  return true;
}

function normalizeComparatorExpression(expr) {
  return expr
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function looksLikeComparatorSet(parts) {
  return parts.length > 0 && parts.every((comp) => /^(<=|>=|<|>|=)?\s*v?\d+(?:\.\d+){0,2}(?:[-+][\w.-]+)?$/.test(comp));
}

export function rangeMayIncludeVersion(range, version) {
  const spec = String(range ?? '').trim();
  if (!spec || spec === '*' || spec.toLowerCase() === 'latest') return true;
  if (/^(file:|link:|workspace:|git\+|https?:|ssh:)/i.test(spec)) return false;
  if (spec === version || spec === `=${version}` || spec === `v${version}`) return true;

  for (const alternative of spec.split('||')) {
    const alt = normalizeComparatorExpression(alternative);
    if (!alt) continue;
    if (alt === '*' || alt.toLowerCase() === 'x') return true;

    if (alt.startsWith('^')) {
      if (caretRangeMatches(alt.slice(1).trim(), version)) return true;
      continue;
    }
    if (alt.startsWith('~')) {
      if (tildeRangeMatches(alt.slice(1).trim(), version)) return true;
      continue;
    }
    if (wildcardRangeMatches(alt, version)) return true;

    const hyphen = alt.match(/^(\d+(?:\.\d+){0,2})\s+-\s+(\d+(?:\.\d+){0,2})$/);
    if (hyphen) {
      if (compareVersions(version, hyphen[1]) >= 0 && compareVersions(version, hyphen[2]) <= 0) return true;
      continue;
    }

    const comparators = alt.match(/(?:<=|>=|<|>|=)?\s*v?\d+(?:\.\d+){0,2}(?:[-+][\w.-]+)?/g) || [];
    if (looksLikeComparatorSet(comparators) && comparators.every((comp) => comparatorMatches(comp, version))) return true;
  }

  return false;
}
