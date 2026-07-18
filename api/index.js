const express = require('express');
const path = require('path');
const fs = require('fs');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const UPSTASH_KEY = 'techtrove:data';

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || '';
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';
const APP_PASSWORD = process.env.APP_PASSWORD || 'rent123';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

app.use(express.json({ limit: '10mb' }));

async function requireAuth(req, res, next) {
  if (req.path === '/api/login' || req.path === '/api/google-login' || req.path === '/api/config') return next();
  const pw = req.headers['x-password'];
  if (pw === APP_PASSWORD) return next();
  const googleToken = req.headers['x-google-token'];
  if (googleToken && googleClient) {
    try {
      const ticket = await googleClient.verifyIdToken({ idToken: googleToken, audience: GOOGLE_CLIENT_ID });
      if (ticket.getPayload()) return next();
    } catch (e) {}
  }
  return res.status(401).json({ error: 'Unauthorized' });
}
app.use('/api', requireAuth);

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

app.post('/api/login', (req, res) => {
  if (req.body.password === APP_PASSWORD) res.json({ success: true, method: 'password', name: 'Admin' });
  else res.status(401).json({ error: 'Invalid password' });
});

app.post('/api/google-login', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential || !googleClient) {
      if (credential === APP_PASSWORD) {
        return res.json({ success: true, method: 'password', name: 'Admin' });
      }
      return res.status(401).json({ error: 'Google login not configured' });
    }
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const email = (payload.email || '').toLowerCase();
    if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(email)) {
      return res.status(403).json({ error: 'This email is not authorized. Contact admin.' });
    }
    res.json({ success: true, method: 'google', name: payload.name || email, email, picture: payload.picture });
  } catch (e) {
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

app.get('/api/config', (req, res) => {
  res.json({ googleClientId: GOOGLE_CLIENT_ID || '' });
});

app.get('/api/data', async (req, res) => { res.json(await loadData()); });

app.post('/api/data', async (req, res) => {
  const { customers, items, rentals, payments } = req.body;
  if (!customers || !items || !rentals || !payments) return res.status(400).json({ error: 'Invalid data format' });
  await saveData(req.body);
  res.json({ success: true });
});

module.exports = app;
