import type { ReactNode } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';

// Trang quản trị đọc dữ liệu qua Firebase client SDK sau khi đăng nhập,
// nên không thể prerender tĩnh lúc build (chưa có phiên đăng nhập/env thật).
export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <header className="flex items-center justify-end border-b border-gray-200 bg-white px-6 py-3">
          <LocaleSwitcher />
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
