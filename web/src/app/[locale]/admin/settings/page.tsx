'use client';

import { useTranslations } from 'next-intl';

export default function SettingsPage() {
  const t = useTranslations('nav');

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">{t('settings')}</h1>
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
        TODO: cấu hình vai trò, kênh gửi (App/Email), ngôn ngữ mặc định của hệ thống.
      </div>
    </div>
  );
}
