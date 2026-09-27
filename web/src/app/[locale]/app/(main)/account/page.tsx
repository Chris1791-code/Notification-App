'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { disablePush } from '@/lib/webPush';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { useStudentSession } from '@/components/student/StudentSession';
import { PushToggle } from '@/components/student/PushToggle';

export default function StudentAccountPage() {
  const t = useTranslations('student.account');
  const locale = useLocale();
  const router = useRouter();
  const { user, profile } = useStudentSession();
  const [signingOut, setSigningOut] = useState(false);

  async function handleLogout() {
    setSigningOut(true);
    // Gỡ token trước khi đăng xuất (lúc còn quyền ghi hồ sơ) để máy dùng chung
    // không tiếp tục nhận thông báo của tài khoản này.
    await disablePush(user.uid);
    await signOut(auth);
    router.replace(`/${locale}/app/login`);
  }

  return (
    <div className="space-y-4 px-4 pt-4">
      <h1 className="text-xl font-semibold text-brand-dark">{t('title')}</h1>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="font-medium text-slate-900">{profile?.displayName ?? user.displayName ?? user.email}</p>
        <p className="text-sm text-slate-500">{user.email}</p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="mb-3 text-sm font-semibold text-slate-700">{t('push')}</p>
        <PushToggle uid={user.uid} />
        <Link href={`/${locale}/app/install`} className="mt-3 inline-block text-sm font-medium text-brand underline">
          {t('installGuide')}
        </Link>
      </section>

      <section className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-700">{t('language')}</p>
        <LocaleSwitcher />
      </section>

      <button
        onClick={handleLogout}
        disabled={signingOut}
        className="w-full rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 disabled:opacity-60"
      >
        {t('logout')}
      </button>
    </div>
  );
}
