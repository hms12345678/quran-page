// تم تحديث الإصدار لـ v8 لضمان مسح الكاش القديم عند كل المستخدمين
const CACHE_NAME = 'khalis-lillah-v8'; 

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

// 1. تثبيت الصفحات والملفات الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Installing new cache: ' + CACHE_NAME);
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // يجبر الـ Service Worker الجديد على التنشيط فوراً
  self.skipWaiting();
});

// 2. تفعيل وتنظيف الكاش القديم فوراً
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Deleting old cache: ' + key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      // يخلي الـ Service Worker يسيطر على الصفحة الحالية فوراً بدون ريفريش
      return self.clients.claim();
    })
  );
});

// 3. الاستراتيجية الذكية: حفظ الصور والصفحات ومنع الصوت
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // استثناء الراديو والملفات الصوتية من الكاش نهائياً
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
        // تخزين الصور فقط في الكاش التلقائي
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
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
