'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { iosTooOld, isAndroid, isIos, isStandalone } from '@/lib/webPush';

type Platform = 'ios' | 'android' | 'desktop';

function Steps({ title, steps, highlight }: { title: string; steps: string[]; highlight: boolean }) {
  return (
    <section className={`rounded-xl border bg-white p-4 ${highlight ? 'border-brand ring-1 ring-brand' : 'border-slate-200'}`}>
      <h2 className="mb-3 font-semibold text-slate-900">{title}</h2>
      <ol className="space-y-2 text-sm text-slate-700">
        {steps.map((step, index) => (
          <li key={index} className="flex gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

// Trang hướng dẫn cài web app: tự nhận biết iPhone/Android/máy tính và đưa
// hướng dẫn phù hợp lên đầu. Không cần đăng nhập để xem (gửi link cho SV).
export default function StudentInstallPage() {
  const t = useTranslations('student.install');
  const locale = useLocale();
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [oldIos, setOldIos] = useState(false);

  useEffect(() => {
    setPlatform(isIos() ? 'ios' : isAndroid() ? 'android' : 'desktop');
    setStandalone(isStandalone());
    setOldIos(iosTooOld());
  }, []);

  const sections: Record<Platform, { title: string; steps: string[] }> = {
    ios: { title: t('iosTitle'), steps: [t('ios1'), t('ios2'), t('ios3'), t('ios4')] },
    android: { title: t('androidTitle'), steps: [t('android1'), t('android2'), t('android3')] },
    desktop: { title: t('desktopTitle'), steps: [t('desktop1'), t('desktop2')] }
  };
  const order: Platform[] = platform ? [platform, ...(['ios', 'android', 'desktop'] as Platform[]).filter((p) => p !== platform)] : ['ios', 'android', 'desktop'];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-lg space-y-4">
        <div className="flex items-center justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="" className="h-12 w-12 rounded-xl" />
          <LocaleSwitcher />
        </div>
        <h1 className="text-xl font-semibold text-brand-dark">{t('title')}</h1>
        <p className="text-sm text-slate-600">{t('intro')}</p>

        {standalone && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">✅ {t('installed')}</p>}
        {oldIos && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{t('iosOld')}</p>}

        {order.map((p) => (
          <Steps key={p} title={sections[p].title} steps={sections[p].steps} highlight={p === platform} />
        ))}

        <Link href={`/${locale}/app`} className="block w-full rounded-lg bg-brand py-2.5 text-center font-medium text-white">
          {t('continue')}
        </Link>
      </div>
    </main>
  );
}
