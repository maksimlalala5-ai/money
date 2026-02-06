// service-worker.js
const CACHE_NAME = 'money-in-sight-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/modern-style.css',
  '/css/components.css',
  '/js/ui-utils.js',
  '/js/firebase.js',
  '/js/modal-manager.js',
  '/js/auth.js',
  '/js/auth-verification.js',
  '/js/data.js',
  '/js/savings.js',
  '/js/mobile-menu.js',
  '/js/ui.js',
  '/js/payments.js',
  '/js/app.js',
  '/manifest.json'
];

// Сетевые ресурсы с кэшированием (старые версии)
const NETWORK_FIRST_URLS = [
  'https://www.gstatic.com/firebasejs/',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Кэшируем только локальные ассеты
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // CDN и сетевые ресурсы - сначала пытаемся сеть, потом кэш
  if (NETWORK_FIRST_URLS.some(prefix => request.url.includes(prefix))) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const cache = caches.open(CACHE_NAME);
            cache.then(c => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Локальные файлы - сначала кэш, потом сеть
  event.respondWith(
    caches.match(request)
      .then((response) => {
        return response || fetch(request)
          .then(response => {
            // Кэшируем успешные ответы локальных файлов
            if (response.ok && request.method === 'GET') {
              const cache = caches.open(CACHE_NAME);
              cache.then(c => c.put(request, response.clone()));
            }
            return response;
          });
      })
      .catch(() => {
        // Fallback для offline
        if (request.destination === 'image') {
          return new Response('', { status: 404 });
        }
        return fetch(request);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
    .then(() => self.clients.claim())
  );
});