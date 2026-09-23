// VidhiScan Offline-First Service Worker (v4 - Gov Mark 01 Logo Update)
const CACHE_NAME = 'vidhiscan-pwa-v4';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon.svg',
  '/icon.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/scan',
  '/inspector',
  '/admin'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Bypass API routes, static image uploads, and Next.js HMR
  if (
    url.pathname.startsWith('/api') || 
    url.pathname.startsWith('/static') || 
    url.pathname.startsWith('/_next/webpack-hmr')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for same-origin static requests
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(async () => {
        // Look for exact request match in cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // Try pathname match in cache
        const pathCached = await caches.match(url.pathname);
        if (pathCached) {
          return pathCached;
        }

        // Return clean offline indicator WITHOUT redirecting to homepage
        return new Response(
          '<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:50px;background:#EDEDFB;color:#1A1A33;"><h2>VidhiScan Offline</h2><p>Network connection interrupted. Please tap retry to reload the page.</p><button onclick="location.reload()" style="background:#10B981;color:#1A1A33;border:none;padding:10px 20px;border-radius:8px;font-weight:bold;cursor:pointer;">Retry Connection</button></body></html>',
          {
            status: 503,
            headers: { 'Content-Type': 'text/html' },
          }
        );
      })
  );
});
