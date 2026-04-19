import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ── Service worker registration ────────────────────────────────────────────
//
// Strategy (mirrors public/sw.js):
// - Register after load, so the initial render isn't blocked by SW setup.
// - If a new worker takes control (e.g. after a deploy) reload ONCE so the
//   page runs against the new bundle immediately. Without this, the old tab
//   keeps running the old SW/bundle until the user manually refreshes.
// - On a chunk-load error (typical symptom of a stale cached index.html
//   referencing bundles that no longer exist on the server — the exact
//   failure mode that left mobile users stuck on the loading screen), wipe
//   caches, unregister the worker, and do a cache-busting reload. One-shot
//   to avoid reload loops.
// - In development we proactively unregister any previously-installed SW so
//   hot reload isn't intercepted by stale cached assets.

if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
    caches?.keys?.().then((keys) => keys.forEach((k) => caches.delete(k)));
  } else {
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
}

// ── Self-healing for broken deploys ────────────────────────────────────────
// If a lazy chunk fails to load we're almost certainly running against a
// stale index.html. Clear everything and reload. The `?fresh=<ts>` param
// guarantees the HTML request bypasses any intermediary cache.

const SELF_HEAL_KEY = 'artrocare-self-heal-ts';

async function selfHeal() {
  const last = Number(sessionStorage.getItem(SELF_HEAL_KEY) || 0);
  if (Date.now() - last < 30_000) return; // guard against reload loops
  sessionStorage.setItem(SELF_HEAL_KEY, String(Date.now()));

  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if (typeof caches !== 'undefined') {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* fall through to reload */
  }

  const url = new URL(window.location.href);
  url.searchParams.set('fresh', String(Date.now()));
  window.location.replace(url.toString());
}

function isChunkLoadError(err) {
  if (!err) return false;
  const msg = String(err.message || err);
  return (
    err.name === 'ChunkLoadError' ||
    /Loading chunk \d+ failed/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg)
  );
}

window.addEventListener('error', (e) => {
  if (isChunkLoadError(e.error)) selfHeal();
});

window.addEventListener('unhandledrejection', (e) => {
  if (isChunkLoadError(e.reason)) selfHeal();
});

// Manual kill switch. If a user ends up stuck on a broken build (stale SW,
// bad cached bundle, corrupt Supabase session on mobile) they can open
// `/?reset=1` to fully wipe client state and start fresh.
(() => {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('reset')) return;

  try {
    Object.keys(localStorage).forEach((k) => localStorage.removeItem(k));
    sessionStorage.clear();
  } catch {
    /* ignore */
  }

  (async () => {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if (typeof caches !== 'undefined') {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {
      /* continue anyway */
    }
    const url = new URL(window.location.href);
    url.searchParams.delete('reset');
    url.searchParams.set('fresh', String(Date.now()));
    window.location.replace(url.toString());
  })();
})();
