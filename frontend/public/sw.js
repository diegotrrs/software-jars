// Software Jars service worker.
//
// Strategy: runtime caching, not precaching — this caches a response the
// first time it's actually requested, and serves from cache on repeat
// visits or when offline. It does NOT guarantee an unvisited page works
// offline (that would need a build-time precache manifest of every hashed
// asset filename — see docs/features/pwa.md for why that's out of scope
// for now). Bump CACHE_NAME on any change here so old caches get cleaned up.
const CACHE_NAME = 'software-jars-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Sync (and any future API route) must always hit the real network —
  // caching these would serve stale data and make a device think it's in
  // sync when it isn't. Explicitly not intercepted at all.
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const responseCopy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy));
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached ?? Response.error()))
  );
});
