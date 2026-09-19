'use client';

import { useTranslations } from 'next-intl';

export default function UsersPage() {
  const t = useTranslations('users');

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">{t('title')}</h1>
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
        TODO: danh sách người dùng đọc từ collection <code>users</code> trong Firestore, kèm bộ lọc theo khoa/khóa/vai
        trò và thao tác phân quyền (admin / editor / student / staff).
      </div>
    </div>
  );
}
