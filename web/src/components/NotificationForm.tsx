'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useCategories } from '@/hooks/useCategories';
import type { NotificationPriority, NotificationStatus } from '@/lib/types';

export function NotificationForm() {
  const t = useTranslations('notifications.form');
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { categories } = useCategories();

  const [titleVi, setTitleVi] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [bodyVi, setBodyVi] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [priority, setPriority] = useState<NotificationPriority>('normal');
  const [status, setStatus] = useState<NotificationStatus>('draft');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await addDoc(collection(db, 'notifications'), {
        titleVi,
        titleEn,
        bodyVi,
        bodyEn,
        categoryId,
        priority,
        status,
        targetGroups: [],
        attachments: [],
        publishAt: status === 'published' ? new Date().toISOString() : null,
        createdBy: auth.currentUser?.uid ?? 'unknown',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        translationStatus: { en: titleEn || bodyEn ? 'draft' : 'missing' }
      });
      router.push(`/${locale}/admin/notifications`);
    } finally {
      setSaving(false);
    }
  }

  // TODO: gọi Cloud Function bọc Google Cloud Translation API để tạo bản dịch
  // nháp titleEn/bodyEn từ titleVi/bodyVi, sau đó biên tập viên duyệt trước khi lưu.

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4 rounded-lg border border-gray-200 bg-white p-6">
      <div>
        <label className="mb-1 block text-sm font-medium">{t('titleVi')}</label>
        <input
          required
          value={titleVi}
          onChange={(e) => setTitleVi(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">{t('titleEn')}</label>
        <input
          value={titleEn}
          onChange={(e) => setTitleEn(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">{t('bodyVi')}</label>
        <textarea
          required
          rows={4}
          value={bodyVi}
          onChange={(e) => setBodyVi(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">{t('bodyEn')}</label>
        <textarea
          rows={4}
          value={bodyEn}
          onChange={(e) => setBodyEn(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">{t('category')}</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameVi}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{t('priority')}</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as NotificationPriority)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="normal">Bình thường</option>
            <option value="urgent">Khẩn cấp</option>
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">{t('status')}</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as NotificationStatus)}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="draft">Bản nháp</option>
          <option value="scheduled">Đã lên lịch</option>
          <option value="published">Đã đăng</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {t('save')}
      </button>
    </form>
  );
}
