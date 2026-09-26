import type { ReactNode } from 'react';
import { AdminShell } from '@/components/AdminShell';

// Trang quản trị đọc dữ liệu qua Firebase client SDK sau khi đăng nhập,
// nên không thể prerender tĩnh lúc build (chưa có phiên đăng nhập/env thật).
export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
