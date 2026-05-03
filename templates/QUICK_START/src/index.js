/**
 * Quick Start Template — src/index.js
 *
 * A simple Express server that demonstrates shai-scanner integration.
 * This file intentionally imports packages that may trigger IOC checks
 * so you can see shai-scanner in action.
 */

import express from 'express';
import { randomBytes } from 'node:crypto';

// Example: importing packages that shai-scanner monitors
// (These are safe, popular packages — just examples!)
import lodash from 'lodash';
import axios from 'axios';

// ── App Setup ──────────────────────────────────────────────────────────────

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────────────────

/**
 * GET / — Health check
 */
app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: '🚀 Quick Start app is running!',
    scanner: 'Run `npm run scan` to check for supply-chain IOCs',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /health — Detailed health check
 */
app.get('/health', async (_req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    timestamp: Date.now(),
  };

  try {
    // Example: use lodash for data transformation
    const transformed = lodash.pick(healthCheck, ['uptime', 'timestamp']);
    res.json({ status: 'healthy', ...transformed });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', error: err.message });
  }
});

/**
 * POST /api/data — Example endpoint using axios
 */
app.post('/api/data', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'url is required' });
  }

  try {
    // Example: fetch external data with axios
    const response = await axios.get(url, { timeout: 5000 });
    res.json({
      success: true,
      data: response.data,
      requestId: randomBytes(8).toString('hex'),
    });
  } catch (err) {
    res.status(502).json({ error: `Failed to fetch: ${err.message}` });
  }
});

// ── Start Server ───────────────────────────────────────────────────────────

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`\n🐕 Quick Start server listening on http://localhost:${PORT}`);
    console.log(`   Run \`npm run scan\` to check for supply-chain IOCs\n`);
  });
}

export default app;
