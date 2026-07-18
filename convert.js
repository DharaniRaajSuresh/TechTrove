const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const wb = XLSX.readFile(path.join(__dirname, 'public', 'Monthly Payment.xlsx'));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const today = () => { const d = new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };

function parseDate(s) {
  if (!s && s !== 0) return '';
  s = String(s).trim();
  if (s.includes('-') && s.length === 10) return s;
  const m = s.match(/(\d{1,2})[.\/](\d{1,2})[.\/](\d{2,4})/);
  if (m) {
    const d = m[1].padStart(2,'0'), mo = m[2].padStart(2,'0');
    const y = m[3].length === 2 ? '20'+m[3] : m[3];
    return y+'-'+mo+'-'+d;
  }
  return '';
}

/* Clean a name */
function normalize(name) {
  return name.toLowerCase()
    .replace(/[\(\[\{].*?[\)\]\}]/g, ' ')
    .replace(/[-–,/_]/g, ' ')
    .replace(/\d{7,}/g, ' ')
    .replace(/\b(workstation|monitor|laptop|cpu|projector|printer|tab|speaker|mike|follow|extra|return|closed|added|given|replacement|sale|week|days|only|end|of|the)\b/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

/* UNIFIED key: first 5 chars of first word */
function keyOf(name) {
  const n = normalize(name);
  const w = n.split(' ').filter(w => w.length > 1);
  return (w[0] || '').slice(0, 5);
}

/* Build clean display name */
function displayName(name) {
  return name
    .replace(/[\(\[].*?[\)\]]/g, '')
    .replace(/\d{7,}/g, '')
    .replace(/\s*[-–].*$/, '')
    .replace(/\s+/g, ' ').trim();
}

/* === STEP 1: Build canonical customer list === */
const custMap = {}; // key -> {id, name, phone}

/* 1a: Payment sheet */
const payWs = wb.Sheets['Payment'];
const payRows = XLSX.utils.sheet_to_json(payWs, { header: 1 });
for (const row of payRows) {
  const name = String(row[1] || '').trim();
  if (!name || name === 'Customer' || name === 'Customer ') continue;
  const key = keyOf(name);
  if (!key || key.length < 3) continue;
  if (!custMap[key]) {
    custMap[key] = { id: uid(), name: displayName(name), phone: '' };
  }
}

/* 1b: IN-OUT OUT records */
const inoutWs = wb.Sheets['IN-OUT'];
if (inoutWs) {
  const inoutRows = XLSX.utils.sheet_to_json(inoutWs, { header: 1 });
  const start = inoutRows.findIndex(r => String(r[0] || '').trim().toLowerCase() === 'cutomer name');
  for (let i = start + 1; i < inoutRows.length; i++) {
    const row = inoutRows[i];
    const name = String(row[0] || '').trim();
    const reason = String(row[7] || '').trim().toUpperCase();
    if (!name || name === 'total') continue;
    if (reason === 'OUT' || reason.startsWith('OUT')) {
      const key = keyOf(name);
      if (key && !custMap[key]) {
        const phone = String(row[3] || '').replace(/[^0-9]/g, '');
        custMap[key] = { id: uid(), name: displayName(name), phone };
      }
    }
  }
}

/* 1c: Monthly sheets — add any customer with payment amounts */
for (const sheetName of wb.SheetNames) {
  if (['IN-OUT','Payment'].includes(sheetName)) continue;
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  for (const row of rows) {
    const raw = String(row[0] || '').trim();
    if (!raw || raw.length < 3) continue;
    const lc = raw.toLowerCase();
    if (['customer','name','sl no','s.no','si no','total','grand','cutomer','invoice payment','date'].includes(lc)) continue;
    if (/^\d/.test(raw)) continue;
    const amount = parseFloat(row[4]) || 0;
    if (amount <= 0) continue;
    const key = keyOf(raw);
    if (!key || key.length < 3) continue;
    if (!custMap[key]) {
      custMap[key] = { id: uid(), name: displayName(raw), phone: '' };
    }
  }
}

console.log('Total customers: ' + Object.keys(custMap).length);

/* === STEP 2: Build customers, rentals, payments === */
const customers = [], items = [], rentals = [], payments = [];
const rentMap = {};

/* Filter: only keep customers with 3+ payment rows or in Payment sheet */
const payKeys = new Set();
for (const row of payRows) {
  const name = String(row[1] || '').trim();
  if (!name || name === 'Customer' || name === 'Customer ') continue;
  payKeys.add(keyOf(name));
}
const rowCount = {};
for (const sheetName of wb.SheetNames) {
  if (['IN-OUT','Payment'].includes(sheetName)) continue;
  for (const row of XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 })) {
    const key = keyOf(String(row[0] || ''));
    if (key && parseFloat(row[4]) > 0) rowCount[key] = (rowCount[key] || 0) + 1;
  }
}
for (const [key, info] of Object.entries(custMap)) {
  if (payKeys.has(key) || (rowCount[key] || 0) >= 2) {
    customers.push({ id: info.id, name: info.name, phone: info.phone, address: '', createdAt: today() });
  } else {
    delete custMap[key];
  }
}

/* Process monthly sheets for rental/payment data */
for (const sheetName of wb.SheetNames) {
  if (['IN-OUT','Payment'].includes(sheetName)) continue;
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  for (const row of rows) {
    const raw = String(row[0] || '').trim();
    if (!raw || raw.length < 3) continue;
    const key = keyOf(raw);
    if (!key || !custMap[key]) continue;
    const cid = custMap[key].id;

    const phone = String(row[1] || '').replace(/[^0-9]/g, '');
    if (phone && phone.length >= 10) {
      const c = customers.find(x => x.id === cid);
      if (c && !c.phone) c.phone = phone;
    }

    const amount = parseFloat(row[4]) || 0;
    const date1 = parseDate(row[3]);
    const date2 = parseDate(row[5]);
    const paidTo = String(row[6] || '').trim();
    const note = String(row[7] || '').trim();
    const col8 = String(row[8] || '').trim();
    const isClosed = /closed|returned/i.test(note + ' ' + col8);

    if (amount > 0) {
      const rKey = cid + '-' + amount;
      const payDate = date2 || date1;
      if (!rentMap[rKey]) {
        rentMap[rKey] = {
          id: uid(), customerId: cid, itemId: '',
          rentAmount: amount, billingCycle: 'monthly', customDays: null,
          startDate: payDate || today(),
          endDate: isClosed ? payDate : null,
          status: isClosed ? 'closed' : 'active',
          createdAt: today()
        };
        rentals.push(rentMap[rKey]);
      } else {
        const r = rentMap[rKey];
        if (payDate && payDate > r.startDate) r.startDate = payDate;
        if (isClosed) { r.status = 'closed'; if (!r.endDate) r.endDate = payDate || r.startDate; }
      }

      if (payDate) {
        const dup = payments.some(p => p.rentalId === rentMap[rKey].id && p.date === payDate && p.amount === amount);
        if (!dup) {
          payments.push({
            id: uid(), rentalId: rentMap[rKey].id, amount,
            date: payDate,
            method: paidTo || 'cash',
            remarks: note && !isClosed ? note : '',
            createdAt: today()
          });
        }
      }
    }
  }
}

/* IN-OUT items */
if (inoutWs) {
  const inoutRows = XLSX.utils.sheet_to_json(inoutWs, { header: 1 });
  const start = inoutRows.findIndex(r => String(r[0] || '').trim().toLowerCase() === 'cutomer name');
  for (let i = start + 1; i < inoutRows.length; i++) {
    const row = inoutRows[i];
    const rawName = String(row[0] || '').trim();
    if (!rawName || rawName === 'total') continue;
    const key = keyOf(rawName);
    if (!key || !custMap[key]) continue;
    const brand = String(row[5] || '').trim();
    const serial = String(row[2] || '').trim();
    if (!brand) continue;
    const item = { id: uid(), type: brand.toLowerCase().includes('laptop') ? 'laptop' : 'desktop', brand, serial: serial || 'SN-'+uid().slice(-6), status: 'rented', createdAt: today() };
    if (!items.find(i => i.serial === item.serial)) items.push(item);
    const cid = custMap[key].id;
    const ex = rentals.find(r => r.customerId === cid && !r.itemId);
    if (ex) ex.itemId = item.id;
  }
}

const output = { customers, items, rentals, payments };
fs.writeFileSync(path.join(__dirname, 'import-data.json'), JSON.stringify(output, null, 2));
console.log('\n=== IMPORT DATA READY ===');
console.log('Customers: ' + customers.length);
console.log('Items:     ' + items.length);
console.log('Rentals:   ' + rentals.length);
console.log('Payments:  ' + payments.length);
console.log('\nCustomers:');
customers.forEach((c, i) => console.log(String(i+1).padStart(3) + '. ' + c.name + (c.phone ? ' ['+c.phone+']' : '')));
