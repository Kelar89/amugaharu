/* AMU GAHARU - Service Worker Sederhana (sw.js) */

const CACHE_NAME = 'amu-gaharu-cache-v1'; // Nama cache (ubah jika ada update besar)
const STATIC_ASSETS = [ // File inti yang akan dicache saat instalasi
  '/', // Alias untuk index.html
  '/index.html',
  '/style.css',
  '/app.js',
  '/img/logo1.ico',
  '/img/cat-kayu.jpg',
  '/img/cat-minyak.jpg',
  '/img/cat-aksesoris.jpg',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Playfair+Display:wght@400;700&display=swap', // Contoh cache font eksternal
  // Tambahkan gambar produk utama atau gambar lain yang sering diakses jika perlu
  '/img/p1.jpg',
  '/img/gallery-1.jpg'
];
const DATA_URL = '/products.json'; // URL data produk

// Event: Install
// Dipicu saat service worker pertama kali diinstal atau diperbarui
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  // Pre-cache aset statis inti
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(error => {
        console.error('[Service Worker] Failed to cache static assets during install:', error);
      })
  );
  self.skipWaiting(); // Aktifkan service worker baru segera
});

// Event: Activate
// Dipicu saat service worker aktif (setelah instalasi/update)
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  // Hapus cache lama jika nama CACHE_NAME berubah
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Ambil alih kontrol halaman yang terbuka
});

// Event: Fetch
// Dipicu setiap kali halaman meminta resource (CSS, JS, gambar, data, dll.)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Strategi 1: Network Falling Back to Cache (untuk products.json)
  if (url.pathname === DATA_URL) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return fetch(event.request)
          .then((response) => {
            // Jika berhasil dari network, update cache
            console.log(`[Service Worker] Fetched ${url.pathname} from network & caching`);
            cache.put(event.request, response.clone());
            return response;
          })
          .catch(() => {
            // Jika network gagal, coba ambil dari cache
            console.log(`[Service Worker] Network failed for ${url.pathname}, trying cache`);
            return cache.match(event.request);
          });
      })
    );
  }
  // Strategi 2: Cache First (untuk semua request lain, termasuk aset statis & gambar)
  else {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            // Ditemukan di cache
            // console.log(`[Service Worker] Fetched ${url.pathname} from cache`);
            return response;
          }
          // Tidak ada di cache, ambil dari network
          // console.log(`[Service Worker] Fetched ${url.pathname} from network`);
          return fetch(event.request).then((networkResponse) => {
             // Opsional: Simpan response baru ke cache untuk request berikutnya
             // Hanya cache request GET yang berhasil
             if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
                 // Clone response karena response hanya bisa dibaca sekali
                 const responseToCache = networkResponse.clone();
                 caches.open(CACHE_NAME).then((cache) => {
                    // console.log(`[Service Worker] Caching new resource: ${event.request.url}`);
                    cache.put(event.request, responseToCache);
                 });
             }
             return networkResponse;
          }).catch(error => {
              console.error(`[Service Worker] Fetch failed for ${url.pathname}:`, error);
              // Opsional: Sediakan fallback offline jika diperlukan
          });
        })
    );
  }
});