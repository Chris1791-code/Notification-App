'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Sidebar } from '@/components/Sidebar';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';

// Khung trang quản trị: màn hình rộng (≥ md) giữ sidebar cố định bên trái;
// màn hình hẹp (iPhone, PWA, app iOS) thu sidebar thành menu trượt mở bằng nút ☰.
export function AdminShell({ children }: { children: ReactNode }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className="md:flex">
      {menuOpen && (
        <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setMenuOpen(false)} aria-hidden />
      )}
      <Sidebar open={menuOpen} />
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:justify-end md:px-6">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="rounded px-2 py-1 text-xl text-gray-700 hover:bg-gray-50 md:hidden"
            aria-label={t('openMenu')}
          >
            ☰
          </button>
          <LocaleSwitcher />
        </header>
        <main className="overflow-x-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
