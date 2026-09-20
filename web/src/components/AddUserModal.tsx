'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import type { UserRole } from '@/lib/types';

const ROLES: UserRole[] = ['admin', 'editor', 'student', 'staff'];

interface CreateUserAccountResult {
  uid: string;
}

export function AddUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const t = useTranslations('users');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [department, setDepartment] = useState('');
  const [program, setProgram] = useState('');
  const [major, setMajor] = useState('');
  const [cohort, setCohort] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const createUserAccount = httpsCallable<unknown, CreateUserAccountResult>(functions, 'createUserAccount');
      await createUserAccount({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        role,
        department: department.trim() || undefined,
        program: program.trim() || undefined,
        major: major.trim() || undefined,
        cohort: cohort.trim() || undefined
      });
      onCreated();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">{t('addUser.title')}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('table.name')}</label>
            <input
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('table.email')}</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('addUser.password')}</label>
            <input
              required
              type="text"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('addUser.passwordHint')}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('table.role')}</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(`role.${r}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">{t('table.department')}</label>
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t('table.cohort')}</label>
              <input
                value={cohort}
                onChange={(e) => setCohort(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t('table.program')}</label>
              <input
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t('table.major')}</label>
              <input
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              {t('addUser.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
            >
              {saving ? '…' : t('addUser.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
