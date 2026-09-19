'use client';

import { useTranslations } from 'next-intl';
import { useNotifications } from '@/hooks/useNotifications';

export default function TranslationsPage() {
  const t = useTranslations('nav');
  const { notifications } = useNotifications();
  const pending = notifications.filter((n) => n.translationStatus?.en !== 'reviewed');

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">{t('translations')}</h1>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-2">Tiêu đề (VI)</th>
              <th className="px-4 py-2">Trạng thái bản dịch EN</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pending.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-gray-400" colSpan={2}>
                  Không có bản dịch nào đang chờ duyệt.
                </td>
              </tr>
            )}
            {pending.map((n) => (
              <tr key={n.id}>
                <td className="px-4 py-2 font-medium">{n.titleVi}</td>
                <td className="px-4 py-2">{n.translationStatus?.en ?? 'missing'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-400">
        TODO: nút &quot;Tạo bản dịch nháp&quot; gọi Cloud Function bọc Google Cloud Translation API, sau đó biên tập
        viên duyệt/sửa trước khi đánh dấu <code>reviewed</code>.
      </p>
    </div>
  );
}
