'use client';

import { useEffect } from 'react';

// Đăng ký service worker (public/sw.js) — điều kiện để trình duyệt coi web là
// PWA cài được. Chỉ bật ở bản production để không cache nhầm khi đang dev.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Không đăng ký được thì web vẫn chạy bình thường, chỉ thiếu trang offline.
    });
  }, []);
  return null;
}
