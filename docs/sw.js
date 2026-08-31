const CACHE = 'schedule-v26';
const IMG_CACHE = 'schedule-imgs-v1';
const INDEX = new URL('./index.html', self.location).pathname;
const MANIFEST = new URL('./manifest.json', self.location).pathname;

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll([INDEX, MANIFEST]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE && k !== IMG_CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

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

  const isScheduleImg = url.pathname.includes('/schedule/') &&
    (url.pathname.endsWith('.png') || url.pathname.endsWith('.jpg'));

  if (isScheduleImg) {
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(IMG_CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request, { cacheName: IMG_CACHE }))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
