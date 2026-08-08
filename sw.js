const CACHE_NAME = 'petadonor-cache-v14';
const ASSETS = [
  './index.html', './manifest.json', './icon-192.png', './icon-512.png',
  './css/styles.css',
  './js/config.js', './js/state.js', './js/storage.js', './js/map.js', './js/geocoding.js',
  './js/search.js', './js/overpass.js', './js/helpers.js', './js/combo-select.js',
  './js/auth.js', './js/tabs.js',
  './js/topbar.js', './js/setting.js', './js/master-data.js', './js/kegiatan.js',
  './js/laporan.js', './js/init.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Network-first for map tiles & geocoding (perlu data terbaru), cache-first untuk shell app
  const url = e.request.url;
  if (url.includes('tile.openstreetmap.org') || url.includes('nominatim.openstreetmap.org') || url.includes('overpass-api.de') || url.includes('.supabase.co')) {
    return; // biarkan browser menangani langsung (butuh online; data terpusat Supabase harus selalu live, bukan dari cache)
  }
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).catch(() => cached))
  );
});
