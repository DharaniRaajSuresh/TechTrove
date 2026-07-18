const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

/* Simple shared password auth */
const APP_PASSWORD = process.env.APP_PASSWORD || 'rent123';

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

/* Auth middleware for API routes */
function requireAuth(req, res, next) {
  if (req.path === '/api/login') return next();
  const pw = req.headers['x-password'] || req.body?.password;
  if (pw !== APP_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  next();
}
app.use('/api', requireAuth);

/* Database setup — supports Render persistent disk via DATA_DIR env */
const DATA_DIR = process.env.DATA_DIR || __dirname;
const DATA_FILE = path.join(DATA_DIR, 'data.json');

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) { console.error('Error reading data file', e); }
  return { customers: [], items: [], rentals: [], payments: [] };
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) { console.error('Error writing data file', e); }
}

/* Login endpoint */
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === APP_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

/* Data endpoints */
app.get('/api/data', (req, res) => {
  res.json(loadData());
});

app.post('/api/data', (req, res) => {
  const { customers, items, rentals, payments } = req.body;
  if (!customers || !items || !rentals || !payments) {
    return res.status(400).json({ error: 'Invalid data format' });
  }
  saveData(req.body);
  res.json({ success: true });
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
