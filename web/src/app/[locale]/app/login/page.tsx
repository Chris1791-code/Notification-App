'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';

// Danh sách tên miền email được tự đăng ký, cách nhau bằng dấu phẩy (vd.
// "hcmut.edu.vn"). Để trống = không giới hạn. Cùng quy tắc với app mobile
// (EXPO_PUBLIC_ALLOWED_EMAIL_DOMAINS) — chỉ là lớp chặn phía client.
const ALLOWED_EMAIL_DOMAINS = (process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS ?? '')
  .split(',')
  .map((d) => d.trim().toLowerCase())
  .filter((d) => d.length > 0);

function isAllowedEmail(email: string) {
  if (ALLOWED_EMAIL_DOMAINS.length === 0) return true;
  const domain = email.trim().toLowerCase().split('@')[1];
  return !!domain && ALLOWED_EMAIL_DOMAINS.some((allowed) => domain === allowed || domain.endsWith(`.${allowed}`));
}

export default function StudentLoginPage() {
  const t = useTranslations('student.auth');
  const locale = useLocale();
  const router = useRouter();
  const { firebaseUser, loading } = useAuth();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && firebaseUser) router.replace(`/${locale}/app`);
  }, [loading, firebaseUser, router, locale]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'signIn') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        if (!isAllowedEmail(email)) {
          setError(t('domainNotAllowed', { domains: ALLOWED_EMAIL_DOMAINS.join(', ') }));
          return;
        }
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(credential.user, { displayName: displayName.trim() });
        // role phải là 'student' — Firestore rules chỉ cho tự đăng ký với vai trò này.
        await setDoc(doc(db, 'users', credential.user.uid), {
          displayName: displayName.trim(),
          email: credential.user.email,
          role: 'student',
          locale
        });
      }
      router.replace(`/${locale}/app`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="" className="h-11 w-11 rounded-xl" />
          <LocaleSwitcher />
        </div>
        <h1 className="text-xl font-semibold text-brand-dark">{mode === 'signIn' ? t('signIn') : t('signUp')}</h1>
        <p className="mb-5 mt-1 text-sm text-slate-500">{t('subtitle')}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signUp' && (
            <div>
              <label className="mb-1 block text-sm font-medium">{t('displayName')}</label>
              <input
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">{t('email')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('password')}</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand py-2.5 font-medium text-white disabled:opacity-60"
          >
            {mode === 'signIn' ? t('signInButton') : t('signUpButton')}
          </button>
        </form>
        <button
          onClick={() => {
            setError(null);
            setMode(mode === 'signIn' ? 'signUp' : 'signIn');
          }}
          className="mt-4 w-full text-center text-sm font-medium text-brand"
        >
          {mode === 'signIn' ? t('switchToSignUp') : t('switchToSignIn')}
        </button>
        <Link href={`/${locale}/app/install`} className="mt-3 block text-center text-xs text-slate-500 underline">
          📲 {t('installLink')}
        </Link>
      </div>
    </main>
  );
}
