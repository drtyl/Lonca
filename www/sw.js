/* Lonca - Service Worker
   Uygulamayı önbelleğe alır, böylece internetsizken de açılabilir. */

const ONBELLEK_ADI = "lonca-v8";

const ONBELLEKLENECEKLER = [
  "./index.html",
  "./style.css",
  "./js/app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (olay) => {
  olay.waitUntil(caches.open(ONBELLEK_ADI).then((onbellek) => onbellek.addAll(ONBELLEKLENECEKLER)));
  self.skipWaiting();
});

self.addEventListener("activate", (olay) => {
  olay.waitUntil(
    caches.keys().then((anahtarlar) =>
      Promise.all(anahtarlar.filter((a) => a !== ONBELLEK_ADI).map((a) => caches.delete(a)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (olay) => {
  if (olay.request.method !== "GET") return;
  olay.respondWith(
    caches.match(olay.request).then((onbellekteki) => {
      const agdanGetir = fetch(olay.request)
        .then((yanit) => {
          const kopya = yanit.clone();
          caches.open(ONBELLEK_ADI).then((onbellek) => onbellek.put(olay.request, kopya));
          return yanit;
        })
        .catch(() => onbellekteki);
      return onbellekteki || agdanGetir;
    })
  );
});
