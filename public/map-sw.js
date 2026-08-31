// Caches OpenStreetMap tiles so previously viewed map areas remain visible offline.
const CACHE_NAME = 'map-tiles-v1';
const TILE_HOSTS = ['tile.openstreetmap.org'];

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  let url;
  try {
    url = new URL(event.request.url);
  } catch {
    return;
  }
  if (!TILE_HOSTS.some((h) => url.hostname.endsWith(h))) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) {
        // Refresh the cached tile in the background when online.
        fetch(event.request)
          .then((res) => { if (res.ok) cache.put(event.request, res.clone()); })
          .catch(() => {});
        return cached;
      }
      try {
        const res = await fetch(event.request);
        if (res.ok) cache.put(event.request, res.clone());
        return res;
      } catch (err) {
        return cached || Response.error();
      }
    })
  );
});
