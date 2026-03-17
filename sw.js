const CACHE_NAME = 'marble-race-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/src/physics/engine.js',
    '/src/physics/marble.js',
    '/src/physics/collision.js',
    '/src/physics/forces.js',
    '/src/physics/materials.js',
    '/src/render/renderer.js',
    '/src/render/camera.js',
    '/src/render/effects.js',
    '/src/procedural/track.js',
    '/src/procedural/obstacles.js',
    '/src/ai/behavior.js',
    '/src/mobile/touch.js',
    '/src/mobile/performance.js',
    '/src/audio/audio.js',
    '/src/replay/replay.js',
    '/icon.svg',
    '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
});
