// Service worker dùng chung cho web quản trị và web app sinh viên.
// - Trang (navigation): luôn lấy từ mạng; mất mạng thì hiện /offline.html.
// - File tĩnh có hash của Next.js (/_next/static): cache-first, vì nội dung không đổi theo URL.
// - Mọi request khác (Firestore, Auth, API) đi thẳng ra mạng, không cache,
//   để không bao giờ hiển thị dữ liệu quản trị cũ hoặc của phiên đăng nhập khác.
// - Thông báo đẩy (Web Push qua Firebase Cloud Messaging): Cloud Function gửi
//   dạng data-only, service worker này tự hiển thị (xem firebase/functions/src/webPush.ts).
const CACHE = 'oisp-v2';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, '/icons/icon-192.png']))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
  }
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }
  // FCM bọc phần data của tin nhắn trong khoá "data".
  const data = payload.data || payload;
  const title = data.title || 'OISP';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.notificationId || undefined,
      data: { url: data.url || '/vi/app' }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || '/vi/app', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.focus().then((focused) => (focused && 'navigate' in focused ? focused.navigate(target) : undefined));
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
