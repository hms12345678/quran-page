const CACHE_NAME = 'khalis-lillah-v5'; // تحديث الإصدار لمسح الكاش القديم
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
  './icon-512.png'
];

// 1. تثبيت الصفحات الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. تفعيل وتنظيف الكاش القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

// 3. الاستراتيجية الذكية مع استثناء الراديو
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // الحيلة هنا: لو الرابط تبع الراديو، اطلبه من النت مباشرة ومتحاولش تلمسه
  if (url.includes('radiojar.com') || url.includes('stream') || url.includes('icecast')) {
    return; // بيخلي المتصفح يتعامل معاه عادي بعيداً عن الـ Service Worker
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        // بنحفظ السور (MP3) والصور فقط، وبنستبعد أي بث مباشر
        const isAudioFile = url.endsWith('.mp3'); // الملفات المنتهية بـ mp3 فقط
        const isImage = event.request.destination === 'image' || 
                        url.endsWith('.jpg') || 
                        url.endsWith('.webp');

        if (isAudioFile || isImage) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }

        return networkResponse;
      }).catch(() => {
        // التعامل مع الخطأ في حالة الأوفلاين
      });
    })
  );
});
