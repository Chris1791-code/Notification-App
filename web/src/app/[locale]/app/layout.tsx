import type { ReactNode } from 'react';
import type { Metadata } from 'next';

// Web app cho sinh viên/giảng viên — cài được lên màn hình chính (PWA) và nhận
// thông báo đẩy qua Firebase Cloud Messaging, không cần App Store/CH Play.
// Dữ liệu đọc qua Firebase client SDK sau khi đăng nhập nên không prerender.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'OISP Thông báo',
  applicationName: 'OISP',
  manifest: '/student.webmanifest',
  appleWebApp: { capable: true, title: 'OISP', statusBarStyle: 'default' }
};

export default function StudentAppLayout({ children }: { children: ReactNode }) {
  return children;
}
