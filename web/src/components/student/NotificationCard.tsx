'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import type { AppNotification, Category } from '@/lib/types';

export function localizedTitle(n: AppNotification, locale: string) {
  return locale === 'en' && n.titleEn ? n.titleEn : n.titleVi;
}

export function localizedBody(n: AppNotification, locale: string) {
  return locale === 'en' && n.bodyEn ? n.bodyEn : n.bodyVi;
}

export function categoryName(categories: Category[], id: string, locale: string) {
  const category = categories.find((c) => c.id === id);
  if (!category) return id;
  return locale === 'en' ? category.nameEn : category.nameVi;
}

export function formatPublishAt(publishAt: string | null, locale: string) {
  if (!publishAt) return '';
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh'
  }).format(new Date(publishAt));
}

export function NotificationCard({ notification, categories }: { notification: AppNotification; categories: Category[] }) {
  const t = useTranslations('student.home');
  const locale = useLocale();

  return (
    <Link
      href={`/${locale}/app/n/${notification.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-4 active:bg-slate-50"
    >
      {notification.priority === 'urgent' && (
        <span className="mb-1.5 inline-block rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">
          {t('urgent')}
        </span>
      )}
      <p className="font-semibold text-slate-900">{localizedTitle(notification, locale)}</p>
      <p className="mt-1 text-xs text-slate-500">
        {categoryName(categories, notification.categoryId, locale)} · {formatPublishAt(notification.publishAt, locale)}
      </p>
    </Link>
  );
}
