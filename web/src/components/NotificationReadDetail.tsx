'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useNotifications } from '@/hooks/useNotifications';
import { useUsers } from '@/hooks/useUsers';
import { useNotificationReads } from '@/hooks/useNotificationReads';
import { matchesTargetFilter } from '@/lib/targetFilter';
import { StatCard } from '@/components/StatCard';

function formatDate(date: Date) {
  return date.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function NotificationReadDetail() {
  const t = useTranslations('reportsPage.detail');
  const { notifications } = useNotifications();
  const { users } = useUsers();
  const { reads } = useNotificationReads();

  const published = useMemo(
    () =>
      notifications
        .filter((n) => n.status === 'published')
        .sort((a, b) => (b.publishAt ?? '').localeCompare(a.publishAt ?? '')),
    [notifications]
  );
  const [notificationId, setNotificationId] = useState('');
  const selected = published.find((n) => n.id === notificationId) ?? published[0];

  const audience = useMemo(() => {
    if (!selected) return [];
    return users.filter((u) => matchesTargetFilter(u, selected.targetFilter));
  }, [users, selected]);

  const readsForSelected = useMemo(() => {
    if (!selected) return [];
    return reads.filter((r) => r.notificationId === selected.id);
  }, [reads, selected]);

  const readerUids = useMemo(() => new Set(readsForSelected.map((r) => r.uid)), [readsForSelected]);

  const readers = useMemo(
    () =>
      readsForSelected
        .map((r) => ({ read: r, user: users.find((u) => u.uid === r.uid) }))
        .sort((a, b) => (b.read.readAt && a.read.readAt ? b.read.readAt.toDate().getTime() - a.read.readAt.toDate().getTime() : 0)),
    [readsForSelected, users]
  );

  const unread = useMemo(() => audience.filter((u) => !readerUids.has(u.uid)), [audience, readerUids]);

  const openRate = audience.length === 0 ? null : (readers.length / audience.length) * 100;

  if (published.length === 0) {
    return <p className="text-sm text-gray-400">{t('noPublished')}</p>;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-700">{t('title')}</h2>
        <select
          value={selected?.id ?? ''}
          onChange={(e) => setNotificationId(e.target.value)}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm"
        >
          {published.map((n) => (
            <option key={n.id} value={n.id}>
              {n.titleVi}
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard label={t('openRate')} value={openRate === null ? t('noAudience') : `${openRate.toFixed(0)}%`} />
            <StatCard label={t('readCountLabel')} value={readers.length} />
            <StatCard label={t('audienceLabel')} value={audience.length} />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium text-gray-500">
              {t('readCount', { count: readers.length, total: audience.length })}
            </p>
            <div className="max-h-72 overflow-y-auto rounded border border-gray-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-3 py-1.5">{t('name')}</th>
                    <th className="px-3 py-1.5">{t('readAt')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {readers.length === 0 && (
                    <tr>
                      <td className="px-3 py-2 text-gray-400" colSpan={2}>
                        {t('noReaders')}
                      </td>
                    </tr>
                  )}
                  {readers.map(({ read, user }) => (
                    <tr key={read.id}>
                      <td className="px-3 py-1.5">
                        <p className="font-medium">{user?.displayName ?? read.uid}</p>
                        <p className="text-gray-400">{user?.email}</p>
                      </td>
                      <td className="px-3 py-1.5 text-gray-500">{read.readAt ? formatDate(read.readAt.toDate()) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-gray-500">{t('unreadCount', { count: unread.length })}</p>
            <div className="max-h-72 overflow-y-auto rounded border border-gray-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-3 py-1.5">{t('name')}</th>
                    <th className="px-3 py-1.5">{t('department')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {unread.length === 0 && (
                    <tr>
                      <td className="px-3 py-2 text-gray-400" colSpan={2}>
                        {t('allRead')}
                      </td>
                    </tr>
                  )}
                  {unread.map((u) => (
                    <tr key={u.uid}>
                      <td className="px-3 py-1.5">
                        <p className="font-medium">{u.displayName ?? u.uid}</p>
                        <p className="text-gray-400">{u.email}</p>
                      </td>
                      <td className="px-3 py-1.5 text-gray-500">{u.department ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        </>
      )}
    </div>
  );
}
