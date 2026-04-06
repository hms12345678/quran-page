const CACHE_NAME = 'quran-app-v2';
const DATA_CACHE_NAME = 'quran-audio-cache';

const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// التثبيت الأولي
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// استراتيجية جلب البيانات (Network First, then Cache)
self.addEventListener('fetch', event => {
  // لو الطلب ملف صوتي MP3
  if (event.request.url.includes('.mp3')) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return cache.match(event.request).then(response => {
          // لو السورة موجودة في الكاش، شغلها فوراً
          if (response) return response;

          // لو مش موجودة، هاتها من النت واحفظ نسخة منها للمرة الجاية
          return fetch(event.request).then(networkResponse => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
  } else {
    // للملفات العادية (الواجهة)
    event.respondWith(
      caches.match(event.request).then(response => response || fetch(event.request))
    );
  }
});
