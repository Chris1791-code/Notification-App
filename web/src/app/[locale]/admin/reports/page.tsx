'use client';

import { useTranslations } from 'next-intl';

export default function ReportsPage() {
  const t = useTranslations('nav');

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">{t('reports')}</h1>
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
        TODO: biểu đồ tỷ lệ đọc/click theo danh mục và theo thời gian, tổng hợp từ collection{' '}
        <code>notificationReads</code>; xuất báo cáo Excel/PDF.
      </div>
    </div>
  );
}
