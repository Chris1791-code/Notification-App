'use client';

import Link from 'next/link';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

const ITEMS = [
  { href: 'dashboard', key: 'dashboard', icon: '📊' },
  { href: 'notifications', key: 'notifications', icon: '📝' },
  { href: 'categories', key: 'categories', icon: '🗂️' },
  { href: 'users', key: 'users', icon: '👥' },
  { href: 'translations', key: 'translations', icon: '🌐' },
  { href: 'reports', key: 'reports', icon: '📈' },
  { href: 'settings', key: 'settings', icon: '⚙️' }
] as const;

export function Sidebar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const { firebaseUser, profile } = useAuth();

  async function handleLogout() {
    await signOut(auth);
    router.push(`/${locale}/login`);
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-5">
        <p className="text-sm font-semibold text-brand-dark">VP. ĐTQT — OISP</p>
        <p className="text-xs text-gray-500">Notification Admin</p>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {ITEMS.map((item) => {
          const href = `/${locale}/admin/${item.href}`;
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={item.href}
              href={href}
              className={`flex items-center gap-2 rounded px-3 py-2 text-sm ${
                active ? 'bg-brand-light font-medium text-brand-dark' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{item.icon}</span>
              {t(item.key)}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-200 px-4 py-3">
        {firebaseUser && (
          <p className="mb-2 truncate text-xs text-gray-500" title={firebaseUser.email ?? undefined}>
            {profile?.displayName ?? firebaseUser.email}
          </p>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          <span>🚪</span>
          {t('logout')}
        </button>
      </div>
    </aside>
  );
}
