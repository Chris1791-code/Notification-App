'use client';

import { useTranslations } from 'next-intl';
import { useCategories } from '@/hooks/useCategories';

export default function CategoriesPage() {
  const t = useTranslations('categories');
  const { categories } = useCategories();

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">{t('title')}</h1>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-2">Thứ tự</th>
              <th className="px-4 py-2">Tên (VI)</th>
              <th className="px-4 py-2">Name (EN)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-2">{c.order}</td>
                <td className="px-4 py-2 font-medium">{c.nameVi}</td>
                <td className="px-4 py-2 text-gray-500">{c.nameEn}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-400">
        Danh sách mặc định dùng seed data cục bộ khi Firestore chưa có dữ liệu — xem web/src/lib/categories.ts.
      </p>
    </div>
  );
}
