const CACHE_NAME = 'sanvieh-cache-v5';
const urlsToCache = [
    './',
    './index.html',
    './404.html',
    './js/script.js',
    './js/db.json'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(clients.claim());
    
    // Limpa caches antigos
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', event => {
    // Ignorar non-GET e non-HTTP
    if (event.request.method !== 'GET') return;
    if (!event.request.url.startsWith('http')) return;

    const url = new URL(event.request.url);

    // Bypass total para Maps, APIs e extensões
    if (url.hostname.includes('google.com') || url.hostname.includes('adminic.com.br')) {
        return; 
    }

    // Estratégia 1: HTML, JS e JSON locais -> Network First (Para ter sempre as atualizações imediatas)
    if (event.request.mode === 'navigate' || url.pathname.endsWith('.js') || url.pathname.endsWith('.html') || url.pathname.endsWith('.json')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    if (response && response.status === 200) {
                        const resClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request).then(cached => cached || caches.match('./404.html'));
                })
        );
        return;
    }

    // Estratégia 2: CDNs (Tailwind, GSAP, Fontes) e Imagens -> Stale-While-Revalidate (Super rápido)
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            const fetchPromise = fetch(event.request).then(response => {
                if (response && response.status === 200) {
                    const resClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
                }
                return response;
            }).catch(() => {});

            return cachedResponse || fetchPromise;
        })
    );
});
