const CACHE = 'schedule-v29';
const INDEX = new URL('./index.html', self.location).pathname;

self.addEventListener('install', e => e.waitUntil(
  caches.open(CACHE).then(c => c.addAll([INDEX, './manifest.json'])).then(() => self.skipWaiting())
));

self.addEventListener('activate', e => e.waitUntil(
  caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
));

const networkFirst = (request, key) => fetch(request)
  .then(res => {
    if (res.ok) caches.open(CACHE).then(c => c.put(key, res.clone()));
    return res;
  })
  .catch(() => caches.match(key));

self.addEventListener('fetch', e => {
  if (e.request.mode === 'navigate') e.respondWith(networkFirst(e.request, INDEX));
  else if (new URL(e.request.url).pathname.endsWith('.json')) e.respondWith(networkFirst(e.request, e.request));
});
