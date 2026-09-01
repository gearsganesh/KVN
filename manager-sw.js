const CACHE = "kvn-manager-v1";
const APP_SHELL = [
  "/manager.html",
  "/config.js",
  "/manager-manifest.json",
  "/assets/logo.webp",
  "/assets/kvn-header-logo.png",
  "/assets/kvn-icon-192.png",
  "/assets/kvn-icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(APP_SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  // Never cache Supabase / API responses; manager needs live data.
  if (url.hostname.includes("supabase.co") ||
      url.pathname.startsWith("/rest/") ||
      url.pathname.startsWith("/auth/") ||
      url.pathname.startsWith("/realtime/")) return;
  event.respondWith(
    fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy)).catch(() => {});
      return response;
    }).catch(() => caches.match(event.request).then(r => r || caches.match("/manager.html")))
  );
});
