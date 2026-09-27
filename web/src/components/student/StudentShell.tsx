'use client';

import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { refreshPushToken } from '@/lib/webPush';
import { StudentSessionContext } from '@/components/student/StudentSession';

const TABS = [
  { href: '', key: 'home', icon: '🏠' },
  { href: '/categories', key: 'categories', icon: '🗂️' },
  { href: '/saved', key: 'saved', icon: '🔖' },
  { href: '/account', key: 'account', icon: '👤' }
] as const;

// Khung web app sinh viên: chặn khi chưa đăng nhập, thanh tab dưới cùng kiểu
// app di động, đồng bộ ngôn ngữ và làm mới token thông báo đẩy mỗi lần mở.
export function StudentShell({ children }: { children: ReactNode }) {
  const t = useTranslations('student.tabs');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { firebaseUser, profile, loading } = useAuth();
  const base = `/${locale}/app`;

  useEffect(() => {
    if (!loading && !firebaseUser) router.replace(`${base}/login`);
  }, [loading, firebaseUser, router, base]);

  useEffect(() => {
    if (!firebaseUser || !profile) return;
    // Ngôn ngữ trong hồ sơ quyết định thông báo đẩy gửi bản tiếng Việt hay tiếng Anh.
    if (profile.locale !== locale) {
      updateDoc(doc(db, 'users', firebaseUser.uid), { locale }).catch(() => undefined);
    }
    refreshPushToken(firebaseUser.uid, locale).catch(() => undefined);
  }, [firebaseUser, profile, locale]);

  if (loading || !firebaseUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  return (
    <StudentSessionContext.Provider value={{ user: firebaseUser, profile }}>
      <div className="min-h-screen bg-slate-50 pb-20">
        <div className="mx-auto max-w-2xl">{children}</div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-2xl">
          {TABS.map((tab) => {
            const href = `${base}${tab.href}`;
            const active = tab.href === '' ? pathname === base || pathname.startsWith(`${base}/n/`) : pathname.startsWith(href);
            return (
              <Link
                key={tab.key}
                href={href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${
                  active ? 'font-semibold text-brand' : 'text-slate-500'
                }`}
              >
                <span className="text-lg leading-none">{tab.icon}</span>
                {t(tab.key)}
              </Link>
            );
          })}
        </div>
      </nav>
    </StudentSessionContext.Provider>
  );
}
