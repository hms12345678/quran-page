const CACHE_NAME = 'khalis-lillah-v10'; // تحديث لـ v10
const STATIC_ASSETS = [
  './',
  './index.html',
  './page1.html',
  './index1.html',
  './azkar.html',
  './radio.html',
  './ebtehalat.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './widget.html' // ضفنا ملف الودجت هنا
];

// تثبيت الملفات الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// تفعيل وتنظيف الكاش القديم مع حماية ملفات الصوت المستقبلية
self.addEventListener('activate', (event) => {
  const KEEPLIST = [CACHE_NAME]; 
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (!KEEPLIST.includes(key)) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// التعامل مع الطلبات (Fetch)
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // استثناء الراديو والصوتيات من الكاش
  if (
    url.includes('radiojar.com') || 
    url.includes('stream') || 
    url.includes('icecast') || 
    url.endsWith('.mp3') || 
    url.includes('mp3quran.net')
  ) {
    return; 
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then((networkResponse) => {
        const isImage = event.request.destination === 'image' || 
                        url.match(/\.(jpg|jpeg|png|gif|webp|svg)$|^https:\/\/static\.surah\.com/);
        if (isImage && networkResponse.status === 200) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }
        return networkResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
