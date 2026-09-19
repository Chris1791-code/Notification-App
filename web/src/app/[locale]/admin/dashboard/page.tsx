'use client';

import { useTranslations } from 'next-intl';
import { useNotifications } from '@/hooks/useNotifications';
import { StatCard } from '@/components/StatCard';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const { notifications, loading } = useNotifications();

  const published = notifications.filter((n) => n.status === 'published').length;
  const draft = notifications.filter((n) => n.status === 'draft').length;

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">{t('title')}</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={t('totalNotifications')} value={loading ? '…' : notifications.length} />
        <StatCard label={t('published')} value={loading ? '…' : published} />
        <StatCard label={t('draft')} value={loading ? '…' : draft} />
      </div>
    </div>
  );
}
