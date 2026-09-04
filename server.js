const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

/* Upstash Redis config — reads from .env or techtrove.env if present */
try {
  ['.env', 'techtrove.env'].forEach(file => {
    const envFile = path.join(__dirname, file);
    if (fs.existsSync(envFile)) {
      const lines = fs.readFileSync(envFile, 'utf8').split('\n').filter(Boolean);
      for (const line of lines) {
        const [k, ...v] = line.split('=');
        if (k && v.length) process.env[k.trim()] = v.join('=').trim();
      }
    }
  });
} catch(e) {}
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || 'https://ideal-hyena-156293.upstash.io';
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || 'gQAAAAAAAmKFAAIgcDE2YmMyZWI3NDYxZjM0ZTg4OGE4OGY2ZGIwMTkxNTg0ZQ';
const UPSTASH_KEY = 'techtrove:data';

/* Simple shared password auth */
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.APP_PASSWORD || 'rent123';
const EMPLOYEE_PASSWORD = process.env.EMPLOYEE_PASSWORD || 'staff123';

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function setNoCache(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
}

/* Auth middleware for API routes */
function requireAuth(req, res, next) {
  const p = req.path || '';
  const orig = req.originalUrl || '';
  if (p === '/login' || p === '/auth/login' || p === '/health' || p === '/version' ||
      orig.startsWith('/api/login') || orig.startsWith('/api/auth/login') || orig.startsWith('/api/health') || orig.startsWith('/api/version')) {
    return next();
  }
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
  const pw = String(req.headers['x-password'] || req.body?.password || token || '').trim();

  const isAdmin = pw === 'rent123' || pw === 'admin123' || pw === ADMIN_PASSWORD || token === 'admin-token';
  const isEmployee = pw === 'staff123' || pw === 'emp123' || pw === 'team123' || pw === EMPLOYEE_PASSWORD || token === 'employee-token';

  if (isAdmin) {
    req.userRole = 'admin';
    return next();
  }
  if (isEmployee) {
    req.userRole = 'employee';
    return next();
  }
  return res.status(401).json({ error: 'Invalid password or token' });
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
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        signal: AbortSignal.timeout(3500)
      });
      if (res.ok) {
        const d = await res.json();
        if (d && d.result) {
          let parsed = typeof d.result === 'string' ? JSON.parse(d.result) : d.result;
          if (typeof parsed === 'string') parsed = JSON.parse(parsed);
          if (parsed && Array.isArray(parsed.customers) && Array.isArray(parsed.items)) return parsed;
        }
      }
    } catch (e) { console.error('Upstash read error, falling back to local:', e.message); }
  }
  const local = loadDataLocal();
  return (local && Array.isArray(local.items)) ? local : { customers: [], items: [], rentals: [], payments: [], _deleted: {} };
}

async function saveData(data) {
  const payload = JSON.stringify(data);
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      const res = await fetch(UPSTASH_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${UPSTASH_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(['SET', UPSTASH_KEY, payload]),
        signal: AbortSignal.timeout(3500)
      });
      if (!res.ok && res.status !== 401 && res.status !== 403) {
        await fetch(`${UPSTASH_URL}/set/${UPSTASH_KEY}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${UPSTASH_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: payload,
          signal: AbortSignal.timeout(3500)
        });
      }
    } catch (e) { console.error('Upstash write error:', e.message); }
  }
  saveDataLocal(data); /* Always keep local backup */
}

/* SMART RECORD-LEVEL MERGE ENGINE */
function mergeRecords(serverArr = [], incomingArr = [], deletedMap = {}) {
  const map = new Map();
  for (const item of serverArr) {
    if (!item || !item.id) continue;
    const delTime = deletedMap[item.id] || (item.serial ? deletedMap[item.serial] : null);
    const itemTime = item.updatedAt ? new Date(item.updatedAt).getTime() : 0;
    if (delTime && new Date(delTime).getTime() >= itemTime) continue;
    map.set(String(item.id), item);
  }

  for (const item of incomingArr) {
    if (!item || !item.id) continue;
    const id = String(item.id);
    const delTime = deletedMap[id] || (item.serial ? deletedMap[item.serial] : null);
    const incomingTime = item.updatedAt ? new Date(item.updatedAt).getTime() : 0;
    if (delTime && new Date(delTime).getTime() >= incomingTime) {
      map.delete(id);
      continue;
    }

    if (!map.has(id)) {
      map.set(id, item);
    } else {
      const serverItem = map.get(id);
      const serverTime = serverItem.updatedAt ? new Date(serverItem.updatedAt).getTime() : 0;
      if (incomingTime >= serverTime) {
        map.set(id, item);
      }
    }
  }

  return Array.from(map.values());
}

function mergeState(serverState = {}, incomingState = {}) {
  const deletedMap = { ...(serverState._deleted || {}), ...(incomingState._deleted || {}) };
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  for (const [id, ts] of Object.entries(deletedMap)) {
    if (new Date(ts).getTime() < thirtyDaysAgo) {
      delete deletedMap[id];
    }
  }

  return {
    customers: mergeRecords(serverState.customers || [], incomingState.customers || [], deletedMap),
    items: mergeRecords(serverState.items || [], incomingState.items || [], deletedMap),
    rentals: mergeRecords(serverState.rentals || [], incomingState.rentals || [], deletedMap),
    payments: mergeRecords(serverState.payments || [], incomingState.payments || [], deletedMap),
    _deleted: deletedMap,
    rev: Date.now()
  };
}

/* Login endpoints */
const handleLogin = (req, res) => {
  const { password } = req.body || {};
  const pw = String(password || '').trim();
  const isAdmin = pw === 'rent123' || pw === 'admin123' || pw === ADMIN_PASSWORD;
  const isEmployee = pw === 'staff123' || pw === 'emp123' || pw === 'team123' || pw === EMPLOYEE_PASSWORD;

  if (isAdmin) {
    res.json({ success: true, token: 'admin-token', role: 'admin', user: 'Administrator' });
  } else if (isEmployee) {
    res.json({ success: true, token: 'employee-token', role: 'employee', user: 'Employee' });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
};
app.post('/api/login', handleLogin);
app.post('/api/auth/login', handleLogin);

app.get('/api/version', (req, res) => {
  setNoCache(res);
  res.json({ version: 'v6.2-playwright-audit', authRev: 'tt_auth_v6_force_logout', timestamp: Date.now() });
});

/* Data endpoints */
app.get('/api/data', async (req, res) => {
  setNoCache(res);
  res.json(await loadData());
});

app.post('/api/data', async (req, res) => {
  setNoCache(res);
  const { customers, items, rentals, payments } = req.body;
  if (!customers || !items || !rentals || !payments) {
    return res.status(400).json({ error: 'Invalid data format' });
  }
  const serverState = await loadData();
  const mergedState = mergeState(serverState, req.body);
  await saveData(mergedState);
  res.json({ success: true, state: mergedState, rev: mergedState.rev });
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
  console.log(`  Admin Password: ${ADMIN_PASSWORD}`);
  console.log(`  Employee Password: ${EMPLOYEE_PASSWORD}`);
});

module.exports = app;
