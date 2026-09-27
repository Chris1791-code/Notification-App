'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useCategories } from '@/hooks/useCategories';

export default function StudentCategoriesPage() {
  const t = useTranslations('student.categories');
  const locale = useLocale();
  const { categories } = useCategories();

  return (
    <div className="px-4 pt-4">
      <h1 className="mb-3 text-xl font-semibold text-brand-dark">{t('title')}</h1>
      <div className="space-y-2">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/${locale}/app?category=${encodeURIComponent(c.id)}`}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-900 active:bg-slate-50"
          >
            {c.icon && <span className="text-lg">{c.icon}</span>}
            {locale === 'en' ? c.nameEn : c.nameVi}
            <span className="ml-auto text-slate-400">›</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
