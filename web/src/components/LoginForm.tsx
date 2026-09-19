'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';

export function LoginForm() {
  const t = useTranslations('login');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('admin/dashboard');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      router.push('admin/dashboard');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-light px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        <div className="mb-6 flex justify-end">
          <LocaleSwitcher />
        </div>
        <h1 className="text-xl font-semibold text-brand-dark">{t('title')}</h1>
        <p className="mb-6 text-sm text-gray-500">{t('subtitle')}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('email')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('password')}</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="w-full rounded bg-brand py-2 text-sm font-medium text-white hover:bg-brand-dark">
            {t('submit')}
          </button>
        </form>
        <button
          onClick={handleGoogleSignIn}
          className="mt-3 w-full rounded border border-gray-300 py-2 text-sm font-medium hover:bg-gray-50"
        >
          {t('google')}
        </button>
      </div>
    </main>
  );
}
