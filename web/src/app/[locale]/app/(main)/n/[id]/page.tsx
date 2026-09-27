'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AppNotification } from '@/lib/types';
import { useCategories } from '@/hooks/useCategories';
import { useSavedNotifications } from '@/hooks/useSavedNotifications';
import { useStudentSession } from '@/components/student/StudentSession';
import {
  categoryName,
  formatPublishAt,
  localizedBody,
  localizedTitle
} from '@/components/student/NotificationCard';

export default function StudentNotificationDetailPage() {
  const t = useTranslations('student.detail');
  const tHome = useTranslations('student.home');
  const locale = useLocale();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user } = useStudentSession();
  const { categories } = useCategories();
  const { savedIds, toggleSaved } = useSavedNotifications(user.uid);
  const [notification, setNotification] = useState<AppNotification | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    getDoc(doc(db, 'notifications', id))
      .then((snap) => {
        if (!snap.exists()) {
          setStatus('missing');
          return;
        }
        setNotification({ id: snap.id, ...(snap.data() as Omit<AppNotification, 'id'>) });
        setStatus('ready');
      })
      // Rules từ chối đọc bản chưa đăng/đã gỡ — coi như không tìm thấy.
      .catch(() => setStatus('missing'));
  }, [id]);

  useEffect(() => {
    if (!notification) return;
    // Giống app mobile: chỉ tính "đã đọc" khi mở chi tiết liên tục ≥10 giây.
    // Id cố định uid_notificationId nên mở lại chỉ cập nhật readAt.
    const timer = setTimeout(() => {
      void setDoc(doc(db, 'notificationReads', `${user.uid}_${notification.id}`), {
        uid: user.uid,
        notificationId: notification.id,
        categoryId: notification.categoryId,
        readAt: serverTimestamp()
      });
    }, 10_000);
    return () => clearTimeout(timer);
  }, [notification, user.uid]);

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push(`/${locale}/app`);
  }

  const saved = notification ? savedIds.has(notification.id) : false;

  return (
    <div className="px-4 pt-3">
      <button onClick={goBack} className="mb-3 text-sm font-medium text-brand">
        ‹ {t('back')}
      </button>

      {status === 'loading' && <div className="h-40 animate-pulse rounded-xl bg-slate-200" />}
      {status === 'missing' && <p className="mt-10 text-center text-sm text-slate-500">{t('notFound')}</p>}

      {notification && (
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          {notification.priority === 'urgent' && (
            <span className="mb-2 inline-block rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">
              {tHome('urgent')}
            </span>
          )}
          <h1 className="text-lg font-bold text-slate-900">{localizedTitle(notification, locale)}</h1>
          <p className="mt-1 text-xs text-slate-500">
            {categoryName(categories, notification.categoryId, locale)} · {formatPublishAt(notification.publishAt, locale)}
          </p>
          <div className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-slate-700">
            {localizedBody(notification, locale)}
          </div>

          {notification.attachments?.length > 0 && (
            <div className="mt-5 border-t border-slate-200 pt-3">
              <p className="mb-2 text-xs font-semibold text-slate-500">{t('attachments')}</p>
              {notification.attachments.map((a) => (
                <a
                  key={a.url}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-1 block text-sm text-brand underline"
                >
                  📎 {a.name}
                </a>
              ))}
            </div>
          )}

          <button
            onClick={() => void toggleSaved(notification.id)}
            className={`mt-5 rounded-lg border px-4 py-2 text-sm font-medium ${
              saved ? 'border-brand bg-brand-light text-brand-dark' : 'border-slate-300 text-slate-700'
            }`}
          >
            🔖 {saved ? t('saved') : t('save')}
          </button>
        </article>
      )}
    </div>
  );
}
