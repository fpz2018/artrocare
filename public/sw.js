// Artrocare service worker.
//
// Strategy:
// - NEVER cache HTML / navigation responses. Always go to network, fall back
//   to a tiny inline offline page. Caching HTML in an SPA with hashed asset
//   names causes "infinite loading" after a deploy: the cached index.html
//   references bundles that no longer exist on the server.
// - Cache-first ONLY for hashed assets under /assets/*. Because Vite hashes
//   those filenames, a stale cache entry is still valid; new deploys produce
//   new URLs and the browser simply fetches them.
// - The cache name is stamped at build time (see scripts/stamp-sw.js) so every
//   deploy invalidates old caches.
// - On activation we delete every cache that isn't the current one and claim
//   all open clients, so stuck users self-heal on the next page load.

const CACHE_VERSION = '__BUILD_ID__';
const CACHE_NAME = `artrocare-${CACHE_VERSION}`;

const OFFLINE_HTML = `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title><style>body{font-family:system-ui,sans-serif;background:#f0f9ff;color:#0f172a;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:1rem;text-align:center}button{margin-top:1rem;padding:.75rem 1.25rem;border:0;border-radius:.5rem;background:#2563eb;color:#fff;font-weight:600;cursor:pointer}</style></head><body><div><h1>Geen verbinding</h1><p>Probeer het opnieuw zodra u weer online bent.</p><button onclick="location.reload()">Opnieuw proberen</button></div></body></html>`;

self.addEventListener('install', (event) => {
  // Take over as soon as the new worker is installed. Combined with
  // clients.claim() below this ensures users don't keep running an old SW
  // that might serve stale HTML.
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

// Allow the page to force an update ("unregister + clear caches") without a
// full reinstall cycle. Used by the chunk-error self-healer in main.jsx.
self.addEventListener('message', (event) => {
  if (event.data === 'PURGE_CACHES') {
    event.waitUntil(
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
    );
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Cross-origin: let the browser handle it (Supabase, Stripe, fonts, etc.)
  if (url.origin !== self.location.origin) return;

  // HTML / navigation: always network, never cache. Fallback is a tiny
  // offline page so users don't see a dead tab if their phone is offline.
  const isNavigation =
    request.mode === 'navigate' ||
    request.destination === 'document' ||
    (request.headers.get('accept') || '').includes('text/html');

  if (isNavigation) {
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(OFFLINE_HTML, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          })
      )
    );
    return;
  }

  // API / functions: always network (no caching of dynamic data).
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/.netlify')) {
    event.respondWith(fetch(request));
    return;
  }

  // Hashed static assets: cache-first. Safe because filenames change per build.
  const isHashedAsset =
    url.pathname.startsWith('/assets/') ||
    /\.(?:js|css|woff2?)$/.test(url.pathname);

  if (isHashedAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Images / icons / manifest: stale-while-revalidate so users see something
  // instantly but we pick up updates in the background.
  if (/\.(?:png|jpg|jpeg|webp|svg|gif|ico)$/.test(url.pathname) || url.pathname === '/manifest.json') {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            if (response.ok && response.type === 'basic') {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
    return;
  }

  // Default: pass through.
});
