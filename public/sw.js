// Service worker: makes the app installable, shows a friendly page when offline, and shows push notifications.
// It never caches signed-in pages, so private school data is not stored by the worker.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  if (e.request.mode !== "navigate") return;
  e.respondWith(fetch(e.request).catch(() => new Response(
    '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title><body style="font-family:system-ui;display:grid;place-items:center;min-height:100vh;margin:0;background:#f5f6fc;color:#1e1b4b;text-align:center"><div><h1>You’re offline</h1><p>Check your internet connection and try again.</p></div>',
    { headers: { "Content-Type": "text/html; charset=utf-8" } })));
});
self.addEventListener("push", (e) => {
  e.waitUntil((async () => {
    let n = null;
    try { if (e.data) n = e.data.json(); } catch (_) {}
    if (!n) {
      // Older subscriptions: the push carries no text, so ask the server for the latest one.
      n = { title: "EduSphere", body: "You have a new update.", link: "/notifications" };
      try { const r = await fetch("/api/push/latest", { credentials: "same-origin" }); if (r.ok) n = await r.json(); } catch (_) {}
    }
    await self.registration.showNotification(n.title || "EduSphere", { body: n.body || "", icon: "/pwa-icon/192", badge: "/pwa-icon/192", tag: n.tag || undefined, renotify: !!n.tag, data: { link: n.link || "/notifications" } });
  })());
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const link = (e.notification.data && e.notification.data.link) || "/notifications";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => { for (const c of cs) { if ("focus" in c) { c.navigate(link); return c.focus(); } } return self.clients.openWindow(link); }));
});
