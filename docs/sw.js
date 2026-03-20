const CACHE = 'schedule-v14';
const ROOT = new URL('./', self.location).pathname;
const INDEX = new URL('./index.html', self.location).pathname;
const MANIFEST = new URL('./manifest.json', self.location).pathname;
const FILES = [INDEX, MANIFEST];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(INDEX, copy));
        return res;
      }).catch(() => caches.match(INDEX))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
