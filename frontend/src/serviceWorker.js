// Service worker for offline support and caching
const CACHE_NAME = 'chatapp-v1';
const urlsToCache = ['/', '/static/js/bundle.js', '/static/css/main.css', '/manifest.json'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener('fetch', event => {
  event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
});
