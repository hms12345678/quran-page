const CACHE_NAME = 'khalis-lillah-v4'; // تحديث الإصدار مهم جداً
const STATIC_ASSETS = [
  './',
  './index.html',
  './page1.html',
  './index1.html',
  './azkar.html',
  './ebtehalat.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 1. تثبيت الصفحات الأساسية (الهيكل)
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

// 3. الاستراتيجية الذكية: حفظ السور والصور تلقائياً
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // لو الملف (سورة أو صورة) موجود في الكاش، هاته فوراً
      if (cachedResponse) return cachedResponse;

      // لو مش موجود، روحه هاته من السيرفر
      return fetch(event.request).then((networkResponse) => {
        // بنشيك: هل ده ملف صوتي (mp3) أو صورة (jpg/webp/png)؟
        const isAudio = event.request.url.endsWith('.mp3') || event.request.destination === 'audio';
        const isImage = event.request.url.endsWith('.jpg') || 
                        event.request.url.endsWith('.webp') || 
                        event.request.destination === 'image';

        if (isAudio || isImage) {
          return caches.open(CACHE_NAME).then((cache) => {
            // خد نسخة من الملف وحطها في الكاش "للأبد"
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }

        return networkResponse;
      }).catch(() => {
        // لو مفيش نت والملف مش في الكاش، اظهر صفحة خطأ أو سيبها فاضية
      });
    })
  );
});
