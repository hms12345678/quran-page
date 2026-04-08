const CACHE_NAME = 'khalis-lillah-final-v1'; 
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

// 1. تثبيت الهيكل الأساسي (بدون الراديو)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching essential assets (excluding radio)...');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. تفعيل وتنظيف أي كاش قديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

// 3. التحكم في جلب البيانات (Fetch)
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // تجاهل أي شيء يخص الراديو تماماً (صفحات أو روابط بث)
  if (url.includes('radio.html') || url.includes('radiojar.com') || url.includes('stream')) {
    return; // اتركه للمتصفح يتعامل مع الإنترنت مباشرة
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // إذا كان الملف في الكاش (صفحات، صور، سور مخزنة)
      if (cachedResponse) return cachedResponse;

      // إذا لم يكن موجوداً، اطلبه من الشبكة
      return fetch(event.request).then((networkResponse) => {
        
        // حفظ ملفات السور (mp3) والصور (jpg/webp) فقط
        const isAudioFile = url.endsWith('.mp3'); 
        const isImage = event.request.destination === 'image' || 
                        url.endsWith('.jpg') || 
                        url.endsWith('.webp');

        if (isAudioFile || isImage) {
          return caches.open(CACHE_NAME).then((cache) => {
            // تخزين نسخة للاستخدام أوفلاين لاحقاً
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }

        return networkResponse;
      }).catch(() => {
        // حالة انقطاع الإنترنت لملفات غير مخزنة
      });
    })
  );
});
