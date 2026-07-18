const express = require('express');
const path = require('path');
const fs = require('fs');
const { OAuth2Client } = require('google-auth-library');
const app = express();
const PORT = process.env.PORT || 3000;

/* Upstash Redis config — also reads from techtrove.env if present */
try {
  const envFile = path.join(__dirname, 'techtrove.env');
  if (fs.existsSync(envFile)) {
    const lines = fs.readFileSync(envFile, 'utf8').split('\n').filter(Boolean);
    for (const line of lines) {
      const [k, ...v] = line.split('=');
      if (k && v.length) process.env[k.trim()] = v.join('=').trim();
    }
  }
} catch(e) {}
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || '';
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';
const UPSTASH_KEY = 'techtrove:data';

/* Simple shared password auth */
const APP_PASSWORD = process.env.APP_PASSWORD || 'rent123';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

/* Auth middleware for API routes */
async function requireAuth(req, res, next) {
  if (req.path === '/api/login' || req.path === '/api/google-login' || req.path === '/api/config') return next();
  const pw = req.headers['x-password'];
  if (pw === APP_PASSWORD) return next();
  /* Check for Google auth token */
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

/* Local file fallback */
const DATA_FILE = path.join(__dirname, 'data.json');

function loadDataLocal() {
  try {
    if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) { console.error('Error reading local data file', e); }
  return null;
}

function saveDataLocal(data) {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8'); } catch (e) {}
}

/* Upstash Redis storage */
async function loadData() {
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      const res = await fetch(`${UPSTASH_URL}/get/${UPSTASH_KEY}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
      });
      const d = await res.json();
      if (d.result) {
        const parsed = JSON.parse(d.result);
        if (parsed.customers) return parsed;
      }
    } catch (e) { console.error('Upstash read error, falling back to local:', e.message); }
  }
  const local = loadDataLocal();
  return local || { customers: [], items: [], rentals: [], payments: [] };
}

async function saveData(data) {
  const payload = JSON.stringify(data);
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      await fetch(`${UPSTASH_URL}/set/${UPSTASH_KEY}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${UPSTASH_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: payload
      });
    } catch (e) { console.error('Upstash write error:', e.message); }
  }
  saveDataLocal(data); /* Always keep local backup */
}

/* Login endpoint */
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === APP_PASSWORD) {
    res.json({ success: true, method: 'password', name: 'Admin' });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

/* Google login endpoint */
app.post('/api/google-login', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential || !googleClient) {
      /* Fall back to password-based token if Google not configured */
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
    res.json({
      success: true,
      method: 'google',
      name: payload.name || email,
      email: email,
      picture: payload.picture
    });
  } catch (e) {
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

/* Data endpoints */
app.get('/api/data', async (req, res) => {
  res.json(await loadData());
});

app.post('/api/data', async (req, res) => {
  const { customers, items, rentals, payments } = req.body;
  if (!customers || !items || !rentals || !payments) {
    return res.status(400).json({ error: 'Invalid data format' });
  }
  await saveData(req.body);
  res.json({ success: true });
});

/* Config endpoint */
app.get('/api/config', (req, res) => {
  res.json({ googleClientId: GOOGLE_CLIENT_ID || '' });
});

/* Serve frontend */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  const network = require('os').networkInterfaces();
  let ip = 'localhost';
  for (const name of Object.keys(network)) {
    for (const iface of network[name]) {
      if (iface.family === 'IPv4' && !iface.internal) { ip = iface.address; break; }
    }
    if (ip !== 'localhost') break;
  }
  console.log(`  TechTrove Rental Tracker running!`);
  console.log(`  Local:    http://localhost:${PORT}`);
  console.log(`  Network:  http://${ip}:${PORT}  (phone on same WiFi)`);
  console.log(`  Password: ${APP_PASSWORD}`);
});
