const CACHE_NAME = "nodere-intelligence-v19-secure-backend";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=secure-backend-2",
  "./app.js?v=secure-backend-2",
  "./manifest.webmanifest",
  "./nodere-icon.png",
  "./nodere-logo-wordmark.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
