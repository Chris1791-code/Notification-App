'use client';

import { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { usePublishedNotifications } from '@/hooks/usePublishedNotifications';
import { useCategories } from '@/hooks/useCategories';
import { matchesTargetFilter } from '@/lib/targetFilter';
import { useStudentSession } from '@/components/student/StudentSession';
import { NotificationCard } from '@/components/student/NotificationCard';
import { PushBanner } from '@/components/student/PushToggle';

function HomeContent() {
  const t = useTranslations('student.home');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get('category');
  const { user, profile } = useStudentSession();
  const { notifications, loading, error } = usePublishedNotifications();
  const { categories } = useCategories();

  // Chỉ hiện thông báo gửi tới nhóm của người dùng — cùng quy tắc lọc người
  // nhận thông báo đẩy ở Cloud Function (targetFilter rỗng = gửi mọi người).
  const visible = useMemo(() => {
    const me = profile ?? { role: 'student' as const };
    return notifications.filter(
      (n) => matchesTargetFilter(me, n.targetFilter) && (!categoryFilter || n.categoryId === categoryFilter)
    );
  }, [notifications, profile, categoryFilter]);

  const usedCategories = categories.filter((c) => notifications.some((n) => n.categoryId === c.id));

  return (
    <div className="px-4 pt-4">
      <h1 className="mb-3 text-xl font-semibold text-brand-dark">{t('title')}</h1>
      <PushBanner uid={user.uid} />

      {usedCategories.length > 0 && (
        <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
          <Link
            href={`/${locale}/app`}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs ${
              !categoryFilter ? 'border-brand bg-brand text-white' : 'border-slate-300 bg-white text-slate-600'
            }`}
          >
            {t('allCategories')}
          </Link>
          {usedCategories.map((c) => (
            <Link
              key={c.id}
              href={`/${locale}/app?category=${encodeURIComponent(c.id)}`}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs ${
                categoryFilter === c.id ? 'border-brand bg-brand text-white' : 'border-slate-300 bg-white text-slate-600'
              }`}
            >
              {locale === 'en' ? c.nameEn : c.nameVi}
            </Link>
          ))}
        </div>
      )}

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{t('loadError')}</p>}
      <div className="space-y-2.5">
        {visible.map((n) => (
          <NotificationCard key={n.id} notification={n} categories={categories} />
        ))}
      </div>
      {!loading && !error && visible.length === 0 && <p className="mt-10 text-center text-sm text-slate-400">{t('empty')}</p>}
    </div>
  );
}

export default function StudentHomePage() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
