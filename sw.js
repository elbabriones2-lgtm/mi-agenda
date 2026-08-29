const CACHE_NAME = 'mi-agenda-v1';
const urlsToCache = [
  '/mi-agenda/',
  '/mi-agenda/index.html',
  '/mi-agenda/styles.css',
  '/mi-agenda/app.js',
  '/mi-agenda/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});
