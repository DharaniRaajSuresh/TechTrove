const CACHE = 'techtrove-v20-fleet-sync';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/vendor/pdf.min.js',
  '/vendor/pdf.worker.min.js',
  '/manifest.json',
  '/icon.svg',
  '/icon.png'
];


self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

function stripQuery(url) {
  const idx = url.indexOf('?');
  return idx >= 0 ? url.substring(0, idx) : url;
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(fetch(e.request).catch(() => new Response(JSON.stringify({ error: 'offline' }), { status: 503, headers: { 'Content-Type': 'application/json' } })));
  } else {
    // Network-First strategy: Always fetch fresh code when online, fallback to cache when offline
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(stripQuery(e.request.url), clone));
          }
          return res;
        })
        .catch(() => caches.match(stripQuery(e.request.url)).then((cached) => cached || caches.match('/index.html') || caches.match('/')))
    );
  }
});
