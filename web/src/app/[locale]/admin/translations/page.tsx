'use client';

import { useTranslations } from 'next-intl';
import { useNotifications } from '@/hooks/useNotifications';
import { TranslationReviewRow } from '@/components/TranslationReviewRow';

export default function TranslationsPage() {
  const t = useTranslations('translationsPage');
  const { notifications } = useNotifications();
  const pending = notifications.filter((n) => n.translationStatus?.en !== 'reviewed');

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">{t('title')}</h1>
      <p className="mb-6 text-sm text-gray-500">{t('pendingCount', { count: pending.length })}</p>

      {pending.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
          {t('empty')}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {pending.map((n) => (
            <TranslationReviewRow key={n.id} notification={n} />
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-gray-400">{t('hint')}</p>
    </div>
  );
}
