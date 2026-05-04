/* eslint-env serviceworker */
const VERSION = 'ms-estoque-v1';
const APP_SHELL = [
    './',
    './index.html',
    './app.js',
    './manifest.json',
    './icon.svg',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(VERSION).then((cache) => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);
    const isAppShell = url.origin === self.location.origin;
    const isCdn = url.hostname === 'cdn.tailwindcss.com' || url.hostname === 'unpkg.com';

    if (isAppShell) {
        event.respondWith(
            caches.match(req).then((cached) => {
                const networkFetch = fetch(req).then((resp) => {
                    if (resp && resp.ok) {
                        const copy = resp.clone();
                        caches.open(VERSION).then((cache) => cache.put(req, copy));
                    }
                    return resp;
                }).catch(() => cached || caches.match('./index.html'));
                return cached || networkFetch;
            })
        );
        return;
    }

    if (isCdn) {
        event.respondWith(
            caches.match(req).then((cached) => cached || fetch(req).then((resp) => {
                if (resp && resp.ok && resp.type !== 'opaque') {
                    const copy = resp.clone();
                    caches.open(VERSION).then((cache) => cache.put(req, copy));
                }
                return resp;
            }).catch(() => cached))
        );
    }
});
