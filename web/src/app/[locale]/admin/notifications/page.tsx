'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useNotifications } from '@/hooks/useNotifications';
import { useCategories } from '@/hooks/useCategories';
import { CategoryBadge } from '@/components/CategoryBadge';

export default function NotificationsPage() {
  const t = useTranslations('notifications');
  const params = useParams();
  const locale = params.locale as string;
  const { notifications, loading } = useNotifications();
  const { categories } = useCategories();

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.nameVi ?? id;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('title')}</h1>
        <Link
          href={`/${locale}/admin/notifications/new`}
          className="rounded bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          {t('create')}
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-2">Tiêu đề</th>
              <th className="px-4 py-2">Danh mục</th>
              <th className="px-4 py-2">Trạng thái</th>
              <th className="px-4 py-2">Ưu tiên</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td className="px-4 py-3 text-gray-400" colSpan={4}>
                  Đang tải…
                </td>
              </tr>
            )}
            {!loading && notifications.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-gray-400" colSpan={4}>
                  Chưa có thông báo nào. Kết nối Firestore hoặc tạo mới để bắt đầu.
                </td>
              </tr>
            )}
            {notifications.map((n) => (
              <tr key={n.id}>
                <td className="px-4 py-2 font-medium">{n.titleVi}</td>
                <td className="px-4 py-2">
                  <CategoryBadge label={categoryName(n.categoryId)} />
                </td>
                <td className="px-4 py-2">{t(`status.${n.status}`)}</td>
                <td className="px-4 py-2">{t(`priority.${n.priority}`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
