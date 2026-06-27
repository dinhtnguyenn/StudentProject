const CACHE_NAME = 'unifolio-images-b94402b';
const SAME_ORIGIN_PREFIXES = ['/assets/', '/images/'];
const EXTERNAL_IMAGE_HOSTS = new Set(['i.ytimg.com', 'img.youtube.com']);

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function isCacheableImageRequest(request) {
  if (request.method !== 'GET') return false;

  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    return SAME_ORIGIN_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
  }

  return EXTERNAL_IMAGE_HOSTS.has(url.hostname) && request.destination === 'image';
}

self.addEventListener('fetch', (event) => {
  if (!isCacheableImageRequest(event.request)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) {
        event.waitUntil(
          fetch(event.request)
            .then((response) => {
              if (response.ok) return cache.put(event.request, response);
            })
            .catch(() => {})
        );
        return cached;
      }

      const response = await fetch(event.request);
      if (response.ok) {
        await cache.put(event.request, response.clone());
      }
      return response;
    })
  );
});
