const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const UPSTASH_KEY = 'techtrove:data';

/* Load env from parent (Vercel provides env vars directly) */
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || '';
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';
const APP_PASSWORD = process.env.APP_PASSWORD || 'rent123';

app.use(express.json({ limit: '10mb' }));

function requireAuth(req, res, next) {
  if (req.path === '/api/login') return next();
  const pw = req.headers['x-password'] || req.body?.password;
  if (pw !== APP_PASSWORD) return res.status(401).json({ error: 'Invalid password' });
  next();
}
app.use('/api', requireAuth);

/* Local fallback */
const DATA_FILE = path.join('/tmp', 'data.json');
function loadDataLocal() {
  try { if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch(e) {}
  return null;
}
function saveDataLocal(data) {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8'); } catch(e) {}
}

async function loadData() {
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      const res = await fetch(`${UPSTASH_URL}/get/${UPSTASH_KEY}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
      });
      const d = await res.json();
      if (d.result) { const parsed = JSON.parse(d.result); if (parsed.customers) return parsed; }
    } catch(e) { console.error('Upstash read error:', e.message); }
  }
  return loadDataLocal() || { customers: [], items: [], rentals: [], payments: [] };
}

async function saveData(data) {
  const payload = JSON.stringify(data);
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      await fetch(`${UPSTASH_URL}/set/${UPSTASH_KEY}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, 'Content-Type': 'application/json' },
        body: payload
      });
    } catch(e) { console.error('Upstash write error:', e.message); }
  }
  saveDataLocal(data);
}

/* API routes */
app.post('/api/login', (req, res) => {
  if (req.body.password === APP_PASSWORD) res.json({ success: true });
  else res.status(401).json({ error: 'Invalid password' });
});

app.get('/api/data', async (req, res) => { res.json(await loadData()); });

app.post('/api/data', async (req, res) => {
  const { customers, items, rentals, payments } = req.body;
  if (!customers || !items || !rentals || !payments) return res.status(400).json({ error: 'Invalid data format' });
  await saveData(req.body);
  res.json({ success: true });
});

module.exports = app;
