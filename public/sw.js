/* NEXT | HR & Recruitment — minimal service worker.
 * Purpose: installable app + a friendly offline page + fast repeat loads of static assets.
 * It deliberately never caches pages, API calls, auth routes or anything personal. */
const VERSION = "next-v1";
const STATIC = `${VERSION}-static`;
const SHELL = ["/offline.html", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isStaticAsset = (url) =>
  url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/fonts/") ||
  url.pathname.startsWith("/brand/") || url.pathname.startsWith("/icons/");

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Pages: always the network (fresh, per-user). Only when offline, show the offline page.
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match("/offline.html")));
    return;
  }

  // Immutable static files: cache-first.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(STATIC).then((c) => c.put(req, copy)); }
        return res;
      })),
    );
  }
  // Everything else (API, auth, data) goes straight to the network, untouched.
});
