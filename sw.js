const CACHE = 'lume-fit-static-v18-lume-hub-glass';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './experience.css',
  './experience.js',
  './routines.js',
  './personalization.js',
  './personalization.css',
  './exercise-catalog.js',
  './automatic-routines.js',
  './automatic-routines.css',
  './frequency.js',
  './frequency.css',
  './controls.js',
  './controls.css',
  './auth.js',
  './config.js',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './lume-symbol.png',
  './weights-bg.webp'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('lume-fit-static-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match('./index.html')))
  );
});
