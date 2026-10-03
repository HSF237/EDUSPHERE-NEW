// Minimal service worker: makes the app installable and shows a friendly page when offline.
// It never caches signed-in pages, so private school data is not stored by the worker.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  if (e.request.mode !== "navigate") return;
  e.respondWith(fetch(e.request).catch(() => new Response(
    '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title><body style="font-family:system-ui;display:grid;place-items:center;min-height:100vh;margin:0;background:#f5f6fc;color:#1e1b4b;text-align:center"><div><h1>You’re offline</h1><p>Check your internet connection and try again.</p></div>',
    { headers: { "Content-Type": "text/html; charset=utf-8" } })));
});
