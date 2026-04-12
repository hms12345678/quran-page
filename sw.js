const CACHE_NAME = 'khalis-lillah-v6'; // تحديث الإصدار لضمان تطبيق التعديلات
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

// 1. تثبيت الصفحات والملفات الأساسية (الواجهة)
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

// 3. الاستراتيجية الذكية: حفظ الصور والصفحات ومنع الصوت
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // استثناء الراديو والبث المباشر وأي ملفات صوتية MP3
  // التعديل هنا: منع تخزين الـ MP3 نهائياً في الكاش التلقائي
  if (
    url.includes('radiojar.com') || 
    url.includes('stream') || 
    url.includes('icecast') || 
    url.endsWith('.mp3') || 
    url.includes('mp3quran.net')
  ) {
    return; // المتصفح يتعامل معاها Streaming فقط
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // لو الملف موجود في الكاش (زي الصور أو الصفحات) رجعه فوراً
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        // التحقق من أن الملف صورة فقط ليتم تخزينها
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
        // لو مفيش نت والملف مش في الكاش
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
