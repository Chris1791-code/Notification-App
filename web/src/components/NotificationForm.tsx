'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useCategories } from '@/hooks/useCategories';
import { TargetFilterEditor } from '@/components/TargetFilterEditor';
import type { NotificationPriority, NotificationStatus, TargetFilter } from '@/lib/types';

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
  const [scheduledAt, setScheduledAt] = useState('');
  const [targetFilter, setTargetFilter] = useState<TargetFilter>({});
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setScheduleError(null);

    let publishAt: string | null = null;
    if (status === 'published') {
      publishAt = new Date().toISOString();
    } else if (status === 'scheduled') {
      if (!scheduledAt) {
        setScheduleError('Chọn thời gian hẹn gửi.');
        return;
      }
      const scheduledDate = new Date(scheduledAt);
      if (scheduledDate.getTime() <= Date.now()) {
        setScheduleError('Thời gian hẹn gửi phải ở tương lai.');
        return;
      }
      publishAt = scheduledDate.toISOString();
    }

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
        targetFilter,
        attachments: [],
        publishAt,
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

  async function handleTranslateDraft() {
    setTranslateError(null);
    if (!titleVi.trim() || !bodyVi.trim()) {
      setTranslateError('Nhập tiêu đề và nội dung tiếng Việt trước khi tạo bản dịch nháp.');
      return;
    }
    setTranslating(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titleVi, bodyVi })
      });
      const json = (await res.json()) as { titleEn?: string; bodyEn?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Không tạo được bản dịch nháp.');
      setTitleEn(json.titleEn ?? '');
      setBodyEn(json.bodyEn ?? '');
    } catch (err) {
      setTranslateError((err as Error).message);
    } finally {
      setTranslating(false);
    }
  }

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
        <label className="mb-1 block text-sm font-medium">{t('bodyVi')}</label>
        <textarea
          required
          rows={4}
          value={bodyVi}
          onChange={(e) => setBodyVi(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center gap-3 border-t border-dashed border-gray-200 pt-4">
        <button
          type="button"
          onClick={handleTranslateDraft}
          disabled={translating}
          className="rounded border border-brand px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand-light disabled:opacity-50"
        >
          {translating ? '…' : t('translateDraft')}
        </button>
        {translateError && <p className="text-sm text-red-600">{translateError}</p>}
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
      {status === 'scheduled' && (
        <div>
          <label className="mb-1 block text-sm font-medium">{t('scheduledAt')}</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-gray-400">{t('scheduledAtHint')}</p>
          {scheduleError && <p className="mt-1 text-sm text-red-600">{scheduleError}</p>}
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium">{t('targeting.title')}</label>
        <TargetFilterEditor value={targetFilter} onChange={setTargetFilter} />
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
