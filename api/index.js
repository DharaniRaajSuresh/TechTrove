const express = require('express');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

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
  const queryToken = req.query?.token || req.query?.key || '';
  const pw = String(req.headers['x-password'] || req.body?.password || token || queryToken || '').trim();

  const isAdmin = pw === 'rent123' || pw === 'admin123' || pw === ADMIN_PASSWORD || token === 'admin-token' || queryToken === 'admin-token';
  const isEmployee = pw === 'staff123' || pw === 'emp123' || pw === 'team123' || pw === EMPLOYEE_PASSWORD || token === 'employee-token' || queryToken === 'employee-token';

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
    version: '1.9',
    versionCode: 10,
    releaseDate: '2026-09-05',
    features: [
      'Excel Multi-Sheet Workbook Extraction (.xlsx & .csv)',
      'Reliable Database Snapshot Export & Sharing',
      'Authoritative Database Restore Engine',
      'Asset Number + Serial Number Primary Key'
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

/* Comprehensive Multi-Sheet Excel Generator */
function buildExcelWorkbook(state) {
  const wb = XLSX.utils.book_new();

  const customerMap = new Map((state.customers || []).map(c => [String(c.id), c]));
  const itemMap = new Map((state.items || []).map(i => [String(i.id), i]));
  const rentalByItem = new Map();
  (state.rentals || []).forEach(r => {
    const s = String(r.status || '').toLowerCase();
    if (s === 'active' || s === 'overdue') rentalByItem.set(String(r.itemId), r);
  });

  const setAutoWidth = (sheet, rows) => {
    if (!rows || !rows.length) return;
    const colKeys = Object.keys(rows[0]);
    sheet['!cols'] = colKeys.map(k => {
      let maxLen = String(k).length;
      for (const r of rows) {
        const val = r[k] != null ? String(r[k]) : '';
        if (val.length > maxLen) maxLen = Math.min(val.length, 50);
      }
      return { wch: Math.max(maxLen + 3, 12) };
    });
  };

  // 1. Inventory Fleet
  const invRows = (state.items || []).map((it, idx) => {
    const r = rentalByItem.get(String(it.id));
    const cust = r ? customerMap.get(String(r.customerId)) : null;
    const daily = Number(it.dailyRate) || 0;
    const monthly = Math.round(daily * 26);
    return {
      'S.No': idx + 1,
      'Asset No': it.assetNo || '-',
      'Serial No': it.serial || '-',
      'Device Title': it.title || '-',
      'Category': (it.category || 'laptop').toUpperCase(),
      'Specifications': it.specs || '-',
      'Daily Rate (₹)': daily,
      'Monthly Rate (₹)': monthly,
      'Status': it.status === 'rented' ? 'RENTED' : (it.status === 'repair' ? 'IN REPAIR' : 'AVAILABLE'),
      'Current Customer': cust ? cust.name : '-',
      'Customer Phone': cust ? cust.phone : '-',
      'Challan #': r ? (r.challanNo || '-') : '-',
      'Return Date': r ? (r.expectedReturnDate || '-') : '-'
    };
  });
  const invSheet = XLSX.utils.json_to_sheet(invRows.length ? invRows : [{ 'Notice': 'No inventory items recorded' }]);
  setAutoWidth(invSheet, invRows);
  XLSX.utils.book_append_sheet(wb, invSheet, 'Fleet Inventory');

  // 2. Rentals & Challans
  const rentRows = (state.rentals || []).map((r, idx) => {
    const cust = customerMap.get(String(r.customerId));
    const it = itemMap.get(String(r.itemId));
    const total = Number(r.totalAmount) || 0;
    const paid = Number(r.paidAmount) || 0;
    const bal = Math.max(0, total - paid);
    return {
      'S.No': idx + 1,
      'Challan #': r.challanNo || `RNT-${r.id.slice(0,6)}`,
      'Customer Name': cust ? cust.name : '-',
      'Phone': cust ? cust.phone : '-',
      'Company': cust?.company || '-',
      'Device Name': it ? it.title : (r.itemTitle || '-'),
      'Asset No': it?.assetNo || r.assetNo || '-',
      'Serial No': it?.serial || r.serial || '-',
      'Start Date': r.startDate || '-',
      'Return Due Date': r.expectedReturnDate || '-',
      'Daily Rate (₹)': Number(r.dailyRate) || 0,
      'Total Amount (₹)': total,
      'Paid Amount (₹)': paid,
      'Balance Due (₹)': bal,
      'Status': (r.status || 'active').toUpperCase(),
      'Notes': r.notes || '-'
    };
  });
  const rentSheet = XLSX.utils.json_to_sheet(rentRows.length ? rentRows : [{ 'Notice': 'No rentals recorded' }]);
  setAutoWidth(rentSheet, rentRows);
  XLSX.utils.book_append_sheet(wb, rentSheet, 'Rentals & Challans');

  // 3. Customers
  const custRows = (state.customers || []).map((c, idx) => {
    const cRentals = (state.rentals || []).filter(r => String(r.customerId) === String(c.id));
    const activeCount = cRentals.filter(r => {
      const s = String(r.status || '').toLowerCase();
      return s === 'active' || s === 'overdue';
    }).length;
    const totalVal = cRentals.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
    const totalPaid = cRentals.reduce((sum, r) => sum + (Number(r.paidAmount) || 0), 0);
    return {
      'S.No': idx + 1,
      'Customer Name': c.name || '-',
      'Phone': c.phone || '-',
      'Email': c.email || '-',
      'Company': c.company || '-',
      'Address': c.address || '-',
      'Active Rentals': activeCount,
      'Lifetime Rentals': cRentals.length,
      'Total Rent Value (₹)': totalVal,
      'Total Paid (₹)': totalPaid,
      'Outstanding Balance (₹)': Math.max(0, totalVal - totalPaid)
    };
  });
  const custSheet = XLSX.utils.json_to_sheet(custRows.length ? custRows : [{ 'Notice': 'No customers recorded' }]);
  setAutoWidth(custSheet, custRows);
  XLSX.utils.book_append_sheet(wb, custSheet, 'Customers');

  // 4. Payments
  const payRows = (state.payments || []).map((p, idx) => {
    const cust = customerMap.get(String(p.customerId));
    const r = (state.rentals || []).find(rnt => String(rnt.id) === String(p.rentalId));
    return {
      'S.No': idx + 1,
      'Payment Date': p.date || '-',
      'Customer Name': cust ? cust.name : '-',
      'Challan #': r?.challanNo || '-',
      'Amount Paid (₹)': Number(p.amount) || 0,
      'Method': (p.method || 'Cash').toUpperCase(),
      'Notes / Reference': p.notes || '-'
    };
  });
  const paySheet = XLSX.utils.json_to_sheet(payRows.length ? payRows : [{ 'Notice': 'No payments recorded' }]);
  setAutoWidth(paySheet, payRows);
  XLSX.utils.book_append_sheet(wb, paySheet, 'Payments Ledger');

  // 5. Summary
  const totalFleet = (state.items || []).length;
  const totalRented = (state.items || []).filter(i => i.status === 'rented').length;
  const totalRepair = (state.items || []).filter(i => i.status === 'repair').length;
  const totalAvailable = totalFleet - totalRented - totalRepair;
  const totalCollections = (state.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalOutstanding = (state.rentals || []).reduce((sum, r) => {
    const s = String(r.status || '').toLowerCase();
    if (s === 'active' || s === 'overdue') {
      return sum + Math.max(0, (Number(r.totalAmount) || 0) - (Number(r.paidAmount) || 0));
    }
    return sum;
  }, 0);

  const summaryRows = [
    { 'Metric / KPI': 'Total Fleet Units', 'Value': totalFleet },
    { 'Metric / KPI': 'Available Units in Stock', 'Value': totalAvailable },
    { 'Metric / KPI': 'Currently on Rent', 'Value': totalRented },
    { 'Metric / KPI': 'Under Repair / Maintenance', 'Value': totalRepair },
    { 'Metric / KPI': 'Registered Clients', 'Value': (state.customers || []).length },
    { 'Metric / KPI': 'Total Rentals / Challans', 'Value': (state.rentals || []).length },
    { 'Metric / KPI': 'Total Payments Collected (₹)', 'Value': totalCollections },
    { 'Metric / KPI': 'Current Outstanding Dues (₹)', 'Value': totalOutstanding },
    { 'Metric / KPI': 'Report Generated At', 'Value': new Date().toLocaleString() }
  ];
  const sumSheet = XLSX.utils.json_to_sheet(summaryRows);
  setAutoWidth(sumSheet, summaryRows);
  XLSX.utils.book_append_sheet(wb, sumSheet, 'Executive Summary');

  return wb;
}

/* 1. Direct Excel Export Endpoint */
app.get('/api/export-excel', async (req, res) => {
  try {
    const data = await loadData();
    const wb = buildExcelWorkbook(data);
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const todayStr = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="TechTrove_Master_Report_${todayStr}.xlsx"`);
    setNoCache(res);
    res.send(buf);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate Excel report: ' + err.message });
  }
});

/* 2. Direct JSON Snapshot Backup Endpoint */
app.get('/api/backup', async (req, res) => {
  try {
    const data = await loadData();
    const todayStr = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="techtrove_backup_${todayStr}.json"`);
    setNoCache(res);
    res.send(JSON.stringify(data, null, 2));
  } catch (err) {
    res.status(500).json({ error: 'Failed to export backup: ' + err.message });
  }
});
app.get('/api/export-json', async (req, res) => {
  res.redirect('/api/backup');
});

/* 3. Authoritative Database Restore Endpoint */
app.post('/api/restore', async (req, res) => {
  try {
    const { customers, items, rentals, payments, _deleted } = req.body || {};
    if (!Array.isArray(customers) || !Array.isArray(items) || !Array.isArray(rentals) || !Array.isArray(payments)) {
      return res.status(400).json({ error: 'Invalid backup file format: missing required data collections (customers, items, rentals, payments).' });
    }

    // Authoritative replacement: Cleanly overwrite cloud database
    const restoredState = {
      customers,
      items,
      rentals,
      payments,
      _deleted: _deleted && typeof _deleted === 'object' ? _deleted : {},
      rev: Date.now(),
      restoredAt: new Date().toISOString()
    };

    await saveData(restoredState);
    setNoCache(res);
    res.json({
      success: true,
      message: 'Database successfully restored from backup snapshot.',
      state: restoredState,
      rev: restoredState.rev
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to restore database: ' + err.message });
  }
});

module.exports = app;
