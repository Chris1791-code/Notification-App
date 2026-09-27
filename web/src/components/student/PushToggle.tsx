'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { enablePush, getPushState, type PushState } from '@/lib/webPush';

const DISMISS_KEY = 'oisp.pushBannerDismissed';

function usePushState() {
  const [state, setState] = useState<PushState | null>(null);
  useEffect(() => {
    getPushState().then(setState).catch(() => setState('unsupported'));
  }, []);
  return [state, setState] as const;
}

/** Trạng thái và nút bật thông báo đẩy — dùng ở trang Tài khoản. */
export function PushToggle({ uid }: { uid: string }) {
  const t = useTranslations('student.push');
  const locale = useLocale();
  const [state, setState] = usePushState();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEnable() {
    setBusy(true);
    setError(null);
    try {
      // Gọi requestPermission ngay trong thao tác bấm — iOS từ chối nếu không phải do người dùng bấm.
      setState(await enablePush(uid, locale));
    } catch (err) {
      setError(t('error', { message: (err as Error).message }));
    } finally {
      setBusy(false);
    }
  }

  if (!state) return null;

  return (
    <div className="space-y-2 text-sm">
      {state === 'default' && (
        <button
          onClick={handleEnable}
          disabled={busy}
          className="w-full rounded-lg bg-brand py-2.5 font-medium text-white disabled:opacity-60"
        >
          {busy ? t('enabling') : t('enable')}
        </button>
      )}
      {state === 'granted' && <p className="text-emerald-700">✅ {t('granted')}</p>}
      {state === 'denied' && <p className="text-amber-700">{t('denied')}</p>}
      {state === 'unsupported' && <p className="text-slate-500">{t('unsupported')}</p>}
      {state === 'unconfigured' && <p className="text-slate-500">{t('unconfigured')}</p>}
      {state === 'needs-install' && (
        <p className="text-slate-600">
          {t('needsInstall')}{' '}
          <Link href={`/${locale}/app/install`} className="font-medium text-brand underline">
            {t('bannerInstallAction')}
          </Link>
        </p>
      )}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}

/** Lời nhắc trên trang chủ khi chưa bật thông báo; ẩn được và nhớ theo trình duyệt. */
export function PushBanner({ uid }: { uid: string }) {
  const t = useTranslations('student.push');
  const locale = useLocale();
  const [state, setState] = usePushState();
  const [dismissed, setDismissed] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === '1');
    } catch {
      setDismissed(false);
    }
  }, []);

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Không lưu được thì lần sau hiện lại, không sao.
    }
  }

  async function handleEnable() {
    setBusy(true);
    try {
      setState(await enablePush(uid, locale));
    } catch {
      setState('unsupported');
    } finally {
      setBusy(false);
    }
  }

  if (dismissed || (state !== 'default' && state !== 'needs-install')) return null;

  return (
    <div className="relative mb-3 rounded-xl border border-brand/20 bg-brand-light p-4 text-sm">
      <button onClick={dismiss} className="absolute right-2 top-1 px-2 text-lg text-slate-400" aria-label="✕">
        ×
      </button>
      <p className="pr-6 font-semibold text-brand-dark">🔔 {t('bannerTitle')}</p>
      {state === 'default' ? (
        <>
          <p className="mt-1 text-slate-600">{t('bannerBody')}</p>
          <button
            onClick={handleEnable}
            disabled={busy}
            className="mt-3 rounded-lg bg-brand px-4 py-2 font-medium text-white disabled:opacity-60"
          >
            {busy ? t('enabling') : t('enable')}
          </button>
        </>
      ) : (
        <>
          <p className="mt-1 text-slate-600">{t('bannerInstall')}</p>
          <Link href={`/${locale}/app/install`} className="mt-3 inline-block rounded-lg bg-brand px-4 py-2 font-medium text-white">
            {t('bannerInstallAction')}
          </Link>
        </>
      )}
    </div>
  );
}
