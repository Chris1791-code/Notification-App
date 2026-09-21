'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { authHeader } from '@/lib/authFetch';
import type { AppNotification } from '@/lib/types';

export function TranslationReviewRow({ notification }: { notification: AppNotification }) {
  const t = useTranslations('translationsPage');
  const [titleEn, setTitleEn] = useState(notification.titleEn ?? '');
  const [bodyEn, setBodyEn] = useState(notification.bodyEn ?? '');
  const [status, setStatus] = useState(notification.translationStatus?.en ?? 'missing');
  const [busy, setBusy] = useState<'generate' | 'save' | 'approve' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function persist(nextStatus: typeof status) {
    await updateDoc(doc(db, 'notifications', notification.id), {
      titleEn,
      bodyEn,
      translationStatus: { en: nextStatus }
    });
    setStatus(nextStatus);
  }

  async function handleGenerateDraft() {
    setError(null);
    setBusy('generate');
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify({ titleVi: notification.titleVi, bodyVi: notification.bodyVi })
      });
      const json = (await res.json()) as { titleEn?: string; bodyEn?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? t('error'));
      setTitleEn(json.titleEn ?? '');
      setBodyEn(json.bodyEn ?? '');
      await persist('draft');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function handleSave() {
    setError(null);
    setBusy('save');
    try {
      await persist(status === 'missing' ? 'draft' : status);
    } catch {
      setError(t('error'));
    } finally {
      setBusy(null);
    }
  }

  async function handleApprove() {
    setError(null);
    setBusy('approve');
    try {
      await persist('reviewed');
    } catch {
      setError(t('error'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            status === 'reviewed'
              ? 'bg-emerald-100 text-emerald-700'
              : status === 'draft'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-gray-100 text-gray-600'
          }`}
        >
          {t(`status.${status}`)}
        </span>
      </div>

      <p className="mb-1 text-xs font-medium text-gray-500">{t('titleViLabel')}</p>
      <p className="mb-3 text-sm text-gray-800">{notification.titleVi}</p>

      <label className="mb-1 block text-xs font-medium text-gray-500">{t('titleEnLabel')}</label>
      <input
        value={titleEn}
        onChange={(e) => setTitleEn(e.target.value)}
        className="mb-3 w-full rounded border border-gray-300 px-3 py-2 text-sm"
      />

      <label className="mb-1 block text-xs font-medium text-gray-500">{t('bodyEnLabel')}</label>
      <textarea
        rows={3}
        value={bodyEn}
        onChange={(e) => setBodyEn(e.target.value)}
        className="mb-3 w-full rounded border border-gray-300 px-3 py-2 text-sm"
      />

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleGenerateDraft}
          disabled={busy !== null}
          className="rounded border border-brand px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand-light disabled:opacity-50"
        >
          {busy === 'generate' ? '…' : t('generateDraft')}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={busy !== null}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {busy === 'save' ? '…' : t('save')}
        </button>
        <button
          type="button"
          onClick={handleApprove}
          disabled={busy !== null || !titleEn.trim() || !bodyEn.trim()}
          className="rounded bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {busy === 'approve' ? '…' : t('approve')}
        </button>
      </div>
    </div>
  );
}
