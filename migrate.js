const fs = require('fs');
const path = require('path');

/* Load env */
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

const URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = 'techtrove:data';

async function migrate() {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8'));
  const payload = JSON.stringify(data);
  const res = await fetch(`${URL}/set/${KEY}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const d = await res.json();
  if (d.result === 'OK') {
    console.log('Migration successful! ' + data.customers.length + ' customers, ' + data.rentals.length + ' rentals, ' + data.payments.length + ' payments pushed to Upstash.');
  } else {
    console.log('Response:', JSON.stringify(d));
  }
}
migrate().catch(e => console.error('Error:', e));
