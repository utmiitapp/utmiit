const CACHE = 'schedule-v26';
const IMG_CACHE = 'schedule-imgs-v1';
const FONT_CACHE = 'schedule-fonts-v1';
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
      Promise.all(keys.filter(k => k !== CACHE && k !== IMG_CACHE && k !== FONT_CACHE).map(k => caches.delete(k)))
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

  // Шрифты Google: cache-first, чтобы оффлайн не терять шрифт.
  // Отдельный кэш — переживает обновления основного.
  const isFont = url.origin === 'https://fonts.googleapis.com' ||
                 url.origin === 'https://fonts.gstatic.com';

  if (isFont) {
    e.respondWith(
      caches.open(FONT_CACHE).then(c =>
        c.match(e.request).then(hit => hit || fetch(e.request).then(res => {
          if (res.ok) c.put(e.request, res.clone());
          return res;
        }))
      )
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
