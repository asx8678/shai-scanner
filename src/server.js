import { createServer } from 'node:http';
import { VulnerabilityDatabase } from './database.js';
import { Scanner } from './scanner.js';

const VERSION = '4.6.0';
const PORT = Number(process.env.PORT) || 3000;

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    const MAX_BODY = 1024 * 1024; // 1 MB

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        req.destroy();
        reject(new Error('Request body too large (max 1 MB)'));
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve(null);
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON in request body'));
      }
    });

    req.on('error', reject);
  });
}

function json(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function error(res, status, message) {
  json(res, status, { error: message });
}

function log(method, url, status, ms) {
  console.log(`${new Date().toISOString()} ${method} ${url} ${status} ${ms}ms`);
}

// ─── Database & Scanner (lazy singleton) ────────────────────────────────────

let db;
let scanner;

function ensureScanner() {
  if (!db) {
    db = new VulnerabilityDatabase();
    scanner = new Scanner(db);
  }
  return scanner;
}

// ─── Route Handlers ─────────────────────────────────────────────────────────

async function handleScan(req, res) {
  let body;
  try {
    body = await parseBody(req);
  } catch (err) {
    return error(res, 400, err.message);
  }

  if (!body || typeof body !== 'object') {
    return error(res, 400, 'Request body must be a JSON object');
  }

  const paths = Array.isArray(body.paths) ? body.paths : undefined;
  const options = body.options && typeof body.options === 'object' ? body.options : {};

  const scanOptions = {
    includeNodeModules: options.includeNodeModules !== false,
    includeLockfiles: options.includeLockfiles !== false,
    includeManifests: options.includeManifests !== false,
    includeIocFiles: options.includeIocFiles !== false,
    maxSearchDepth: typeof options.maxSearchDepth === 'number' ? options.maxSearchDepth : undefined,
    maxLockfileDepth:
      typeof options.maxLockfileDepth === 'number' ? options.maxLockfileDepth : undefined,
    maxManifestDepth:
      typeof options.maxManifestDepth === 'number' ? options.maxManifestDepth : undefined,
  };

  try {
    const s = ensureScanner();
    const result = await s.scan(
      paths && paths.length ? paths : ['.'],
      scanOptions,
      () => {}, // silent progress – no console spam from server
    );
    json(res, 200, result);
  } catch (err) {
    console.error('Scan error:', err);
    error(res, 500, `Scan failed: ${err.message}`);
  }
}

function handleHealth(_req, res) {
  ensureScanner();
  json(res, 200, {
    status: 'ok',
    uptime: process.uptime(),
    database: db.getInfo(),
  });
}

function handleVersion(_req, res) {
  json(res, 200, {
    name: 'shai-scanner',
    version: VERSION,
    node: process.version,
    protocol: '1.0',
  });
}

// ─── Server ─────────────────────────────────────────────────────────────────

const server = createServer(async (req, res) => {
  const start = Date.now();
  const { method, url } = req;

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    });
    res.end();
    log(method, url, 204, Date.now() - start);
    return;
  }

  try {
    if (method === 'GET' && url === '/health') {
      handleHealth(req, res);
    } else if (method === 'GET' && url === '/version') {
      handleVersion(req, res);
    } else if (method === 'POST' && url === '/scan') {
      await handleScan(req, res);
    } else {
      error(res, 404, `Unknown endpoint: ${method} ${url}`);
    }
  } catch (err) {
    console.error('Unhandled error:', err);
    error(res, 500, 'Internal server error');
  }

  log(method, url, res.statusCode, Date.now() - start);
});

// ─── Start ──────────────────────────────────────────────────────────────────

server.listen(PORT, () => {
  console.log(`Shai-Scanner HTTP server v${VERSION} listening on http://localhost:${PORT}`);
  console.log('  POST /scan    – Run a scan');
  console.log('  GET  /health  – Health check');
  console.log('  GET  /version – Version info');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Set PORT env variable to use a different port.`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

export { server };
