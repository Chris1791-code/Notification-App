'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useNotifications } from '@/hooks/useNotifications';
import { useCategories } from '@/hooks/useCategories';
import { useUsers } from '@/hooks/useUsers';
import { useNotificationReads } from '@/hooks/useNotificationReads';
import { StatCard } from '@/components/StatCard';
import { CategoryReadBarChart } from '@/components/charts/CategoryReadBarChart';
import { DailyReadsSparkline } from '@/components/charts/DailyReadsSparkline';

const TREND_DAYS = 14;

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const t = useTranslations('reportsPage');
  const { notifications } = useNotifications();
  const { categories } = useCategories();
  const { users } = useUsers();
  const { reads } = useNotificationReads();

  const publishedCount = useMemo(() => notifications.filter((n) => n.status === 'published').length, [notifications]);

  const byCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of reads) {
      if (!r.categoryId) continue;
      counts.set(r.categoryId, (counts.get(r.categoryId) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([categoryId, value]) => ({
        id: categoryId,
        label: categories.find((c) => c.id === categoryId)?.nameVi ?? categoryId,
        value
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [reads, categories]);

  const byDay = useMemo(() => {
    const counts = new Map<string, number>();
    const today = new Date();
    const days: { date: string; value: number }[] = [];
    for (let i = TREND_DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({ date: toDateKey(d), value: 0 });
    }
    for (const r of reads) {
      if (!r.readAt) continue;
      const key = toDateKey(r.readAt.toDate());
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return days.map((d) => ({ ...d, value: counts.get(d.date) ?? 0 }));
  }, [reads]);

  const avgReadRate = useMemo(() => {
    if (publishedCount === 0 || users.length === 0) return null;
    const published = notifications.filter((n) => n.status === 'published');
    const readsPerNotification = new Map<string, number>();
    for (const r of reads) {
      readsPerNotification.set(r.notificationId, (readsPerNotification.get(r.notificationId) ?? 0) + 1);
    }
    const rates = published.map((n) => (readsPerNotification.get(n.id) ?? 0) / users.length);
    return (rates.reduce((sum, r) => sum + r, 0) / rates.length) * 100;
  }, [notifications, publishedCount, reads, users]);

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">{t('title')}</h1>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label={t('totalReads')} value={reads.length} />
        <StatCard label={t('publishedCount')} value={publishedCount} />
        <StatCard label={t('avgReadRate')} value={avgReadRate === null ? t('noData') : `${avgReadRate.toFixed(0)}%`} />
        <StatCard label={t('topCategory')} value={byCategory[0]?.label ?? t('noData')} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">{t('byCategoryTitle')}</h2>
          {byCategory.length === 0 ? (
            <p className="text-sm text-gray-400">{t('byCategoryEmpty')}</p>
          ) : (
            <CategoryReadBarChart data={byCategory} />
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">{t('trendTitle')}</h2>
          <DailyReadsSparkline data={byDay} />
        </div>
      </div>
    </div>
  );
}
