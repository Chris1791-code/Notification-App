import type { MetadataRoute } from 'next';

// Web App Manifest — cho phép "Thêm vào Màn hình chính" trên iOS/Android và
// mở web quản trị ở chế độ toàn màn hình như một app riêng.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'OISP Notification Admin',
    short_name: 'OISP Admin',
    description: 'Quản trị thông báo — VP. Đào tạo Quốc tế, ĐHBK – ĐHQG-HCM',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#E8F1FA',
    theme_color: '#00529B',
    lang: 'vi',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  };
}
