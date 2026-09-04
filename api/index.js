const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const UPSTASH_KEY = 'techtrove:data';

const UPSTASH_URL = 'https://ideal-hyena-156293.upstash.io';
const UPSTASH_TOKEN = 'gQAAAAAAAmKFAAIgcDE2YmMyZWI3NDYxZjM0ZTg4OGE4OGY2ZGIwMTkxNTg0ZQ';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.APP_PASSWORD || 'rent123';
const EMPLOYEE_PASSWORD = process.env.EMPLOYEE_PASSWORD || 'staff123';

app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-password, Accept, Origin, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

function setNoCache(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
}

function requireAuth(req, res, next) {
  if (req.method === 'OPTIONS') return next();
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

const DATA_FILE = path.join('/tmp', 'data.json');
const ROOT_DATA_FILE = path.join(__dirname, '..', 'data.json');
let seedModule = null;
try { seedModule = require('./seed'); } catch(e) {}

function getSeedData() {
  if (seedModule && seedModule.DEFAULT_SEED_ITEMS) {
    return {
      customers: seedModule.DEFAULT_SEED_CUSTOMERS || [],
      items: seedModule.DEFAULT_SEED_ITEMS || [],
      rentals: seedModule.DEFAULT_SEED_RENTALS || [],
      payments: [],
      _deleted: {}
    };
  }
  try {
    if (fs.existsSync(ROOT_DATA_FILE)) {
      const d = JSON.parse(fs.readFileSync(ROOT_DATA_FILE, 'utf8'));
      if (d && Array.isArray(d.items) && d.items.length > 0) return d;
    }
  } catch(e) {}
  return { customers: [], items: [], rentals: [], payments: [], _deleted: {} };
}

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
    } catch(e) { console.error('Upstash read error:', e.message); }
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
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(['SET', UPSTASH_KEY, payload]),
        signal: AbortSignal.timeout(3500)
      });
      if (!res.ok && res.status !== 401 && res.status !== 403) {
        await fetch(`${UPSTASH_URL}/set/${UPSTASH_KEY}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, 'Content-Type': 'application/json' },
          body: payload,
          signal: AbortSignal.timeout(3500)
        });
      }
    } catch(e) { console.error('Upstash write error:', e.message); }
  }
  saveDataLocal(data);
}

/* SMART RECORD-LEVEL MERGE ENGINE */
function isTombstonedRecord(item, deletedMap) {
  if (!item || !item.id) return false;
  const id = String(item.id);
  const delTs = deletedMap[id] || (item.serial && deletedMap[item.serial]) || (item.assetNo && deletedMap[item.assetNo]);
  if (!delTs) return false;

  const itemTs = new Date(item.updatedAt || item.createdAt || 0).getTime();
  const delTime = new Date(delTs).getTime();
  // If item was created or updated strictly after the deletion tombstone,
  // it is a newly added or re-imported item! Do NOT delete it.
  if (itemTs > delTime) {
    delete deletedMap[id];
    if (item.serial) delete deletedMap[item.serial];
    if (item.assetNo) delete deletedMap[item.assetNo];
    return false;
  }
  return true;
}

function mergeRecords(serverArr = [], incomingArr = [], deletedMap = {}) {
  const map = new Map();
  // 1. Load server records
  for (const item of serverArr) {
    if (!item || !item.id) continue;
    if (isTombstonedRecord(item, deletedMap)) continue;
    map.set(String(item.id), item);
  }

  // 2. Reconcile with incoming records
  for (const item of incomingArr) {
    if (!item || !item.id) continue;
    const id = String(item.id);
    if (isTombstonedRecord(item, deletedMap)) {
      map.delete(id); // Tombstone confirmed
      continue;
    }

    if (!map.has(id)) {
      map.set(id, item); // Fresh entity from client
    } else {
      const serverItem = map.get(id);
      const incomingTime = item.updatedAt ? new Date(item.updatedAt).getTime() : 0;
      const serverTime = serverItem.updatedAt ? new Date(serverItem.updatedAt).getTime() : 0;
      if (incomingTime >= serverTime) {
        map.set(id, item); // Incoming update wins
      }
    }
  }

  return Array.from(map.values());
}

function mergeState(serverState = {}, incomingState = {}) {
  const deletedMap = { ...(serverState._deleted || {}), ...(incomingState._deleted || {}) };
  // Prune tombstones older than 30 days
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  for (const [id, ts] of Object.entries(deletedMap)) {
    if (new Date(ts).getTime() < thirtyDaysAgo) {
      delete deletedMap[id];
    }
  }

  let customers = mergeRecords(serverState.customers || [], incomingState.customers || [], deletedMap);
  let rentals = mergeRecords(serverState.rentals || [], incomingState.rentals || [], deletedMap);
  let payments = mergeRecords(serverState.payments || [], incomingState.payments || [], deletedMap);
  let items = mergeRecords(serverState.items || [], incomingState.items || [], deletedMap);

  // Deduplicate items by Composite Primary Key (Asset Number + Serial Number)
  const seenCompositeKeys = new Map();
  const dedupedItems = [];
  for (const it of items) {
    const assetKey = (it.assetNo || '').trim().toLowerCase();
    const serialKey = (it.serial || '').trim().toLowerCase();
    // Primary composite key: assetNo + ":::" + serial
    const compositeKey = (assetKey && serialKey)
      ? `${assetKey}:::${serialKey}`
      : (assetKey ? `asset:::${assetKey}` : (serialKey ? `serial:::${serialKey}` : `id:::${it.id}`));

    if (seenCompositeKeys.has(compositeKey)) {
      const existing = seenCompositeKeys.get(compositeKey);
      const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
      const itTime = new Date(it.updatedAt || it.createdAt || 0).getTime();
      if (itTime >= existingTime) {
        Object.assign(existing, it);
      }
      continue;
    }
    seenCompositeKeys.set(compositeKey, it);
    dedupedItems.push(it);
  }
  items = dedupedItems;

  // Cascading tombstone enforcement:
  // 1. Purge rentals if customer is deleted
  rentals = rentals.filter(r => !deletedMap[r.id] && !deletedMap[r.customerId]);
  // 2. Purge payments if rental or customer is deleted
  payments = payments.filter(p => !deletedMap[p.id] && !deletedMap[p.rentalId] && !deletedMap[p.customerId]);
  // 3. Reconcile item rental status based on surviving active rentals
  const activeRentalItemIds = new Set(
    rentals.filter(r => {
      const s = String(r.status || 'active').toLowerCase().trim();
      return s === 'active' || s === 'overdue';
    }).map(r => String(r.itemId))
  );

  items = items.map(it => {
    const s = String(it.status || '').toLowerCase().trim();
    if (s === 'repair') return it;
    const isRented = activeRentalItemIds.has(String(it.id));
    return { ...it, status: isRented ? 'rented' : 'available' };
  });

  return {
    customers,
    items,
    rentals,
    payments,
    _deleted: deletedMap,
    rev: Date.now()
  };
}

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
  res.json({
    version: '1.8',
    versionCode: 9,
    releaseDate: '2026-09-04',
    features: [
      'Asset Number Primary Key Deduplication',
      'Native Device Contacts Autocomplete',
      'Live Cloud Auto-Sync Active'
    ],
    apkDownloadUrl: 'https://ttstts.vercel.app/TechTrove-Rental-Tracker.apk',
    timestamp: Date.now()
  });
});

app.get('/api/data', async (req, res) => {
  setNoCache(res);
  const data = await loadData();
  res.json(data);
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

  // Return authoritative merged state back to caller
  res.json({ success: true, state: mergedState, rev: mergedState.rev });
});

module.exports = app;
