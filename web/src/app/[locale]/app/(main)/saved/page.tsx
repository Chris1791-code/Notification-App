'use client';

import { useTranslations } from 'next-intl';
import { usePublishedNotifications } from '@/hooks/usePublishedNotifications';
import { useSavedNotifications } from '@/hooks/useSavedNotifications';
import { useCategories } from '@/hooks/useCategories';
import { useStudentSession } from '@/components/student/StudentSession';
import { NotificationCard } from '@/components/student/NotificationCard';

export default function StudentSavedPage() {
  const t = useTranslations('student.saved');
  const { user } = useStudentSession();
  const { notifications, loading } = usePublishedNotifications();
  const { savedIds, loading: savedLoading } = useSavedNotifications(user.uid);
  const { categories } = useCategories();

  // Bookmark của thông báo đã bị gỡ (không còn published) tự ẩn đi.
  const saved = notifications.filter((n) => savedIds.has(n.id));

  return (
    <div className="px-4 pt-4">
      <h1 className="mb-3 text-xl font-semibold text-brand-dark">{t('title')}</h1>
      <div className="space-y-2.5">
        {saved.map((n) => (
          <NotificationCard key={n.id} notification={n} categories={categories} />
        ))}
      </div>
      {!loading && !savedLoading && saved.length === 0 && (
        <p className="mt-10 text-center text-sm text-slate-400">{t('empty')}</p>
      )}
    </div>
  );
}
