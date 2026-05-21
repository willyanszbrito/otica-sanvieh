const CACHE_NAME = 'sanvieh-cache-v3';
const urlsToCache = [
    './',
    './index.html',
    './404.html',
    './js/script.js',
    './js/db.json'
];

self.addEventListener('install', event => {
    // Skip waiting so the new SW takes over immediately
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('activate', event => {
    // Claim clients so the new SW applies immediately
    event.waitUntil(clients.claim());
    
    // Delete old caches
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Network First strategy
self.addEventListener('fetch', event => {
    // We only apply Network First for GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Se a rede respondeu, clonamos e guardamos no cache, depois retornamos
                const resClone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, resClone);
                });
                return response;
            })
            .catch(() => {
                // Se a rede falhar, tentamos o cache
                return caches.match(event.request)
                    .then(cachedResponse => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // Se falhou rede e cache, e for HTML, retorna 404
                        if (event.request.mode === 'navigate') {
                            return caches.match('./404.html');
                        }
                    });
            })
    );
});
