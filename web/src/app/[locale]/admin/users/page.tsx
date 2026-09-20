'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useUsers';
import { AddUserModal } from '@/components/AddUserModal';
import type { AppUser, UserRole } from '@/lib/types';

const ROLES: UserRole[] = ['admin', 'editor', 'student', 'staff'];
type EditableField = 'department' | 'program' | 'major' | 'cohort';

export default function UsersPage() {
  const t = useTranslations('users');
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const { users, loading } = useUsers();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const departments = useMemo(() => {
    const set = new Set(users.map((u) => u.department).filter((d): d is string => Boolean(d)));
    return Array.from(set).sort();
  }, [users]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesSearch =
        !term || u.email?.toLowerCase().includes(term) || u.displayName?.toLowerCase().includes(term);
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesDepartment = departmentFilter === 'all' || u.department === departmentFilter;
      return matchesSearch && matchesRole && matchesDepartment;
    });
  }, [users, search, roleFilter, departmentFilter]);

  async function handleRoleChange(uid: string, role: UserRole) {
    setError(null);
    setUpdatingUid(uid);
    try {
      await updateDoc(doc(db, 'users', uid), { role });
    } catch {
      setError(t('updateError'));
    } finally {
      setUpdatingUid(null);
    }
  }

  async function handleFieldChange(uid: string, field: EditableField, value: string) {
    setError(null);
    try {
      await updateDoc(doc(db, 'users', uid), { [field]: value });
    } catch {
      setError(t('updateError'));
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('title')}</h1>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            {t('addUser.title')}
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('search')}
          className="w-64 rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="all">{t('allRoles')}</option>
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {t(`role.${role}`)}
            </option>
          ))}
        </select>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="all">{t('allDepartments')}</option>
          {departments.map((dep) => (
            <option key={dep} value={dep}>
              {dep}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-2">{t('table.name')}</th>
              <th className="px-4 py-2">{t('table.email')}</th>
              <th className="px-4 py-2">{t('table.role')}</th>
              <th className="px-4 py-2">{t('table.department')}</th>
              <th className="px-4 py-2">{t('table.program')}</th>
              <th className="px-4 py-2">{t('table.major')}</th>
              <th className="px-4 py-2">{t('table.cohort')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td className="px-4 py-3 text-gray-400" colSpan={7}>
                  {t('loading')}
                </td>
              </tr>
            )}
            {!loading && filteredUsers.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-gray-400" colSpan={7}>
                  {t('empty')}
                </td>
              </tr>
            )}
            {filteredUsers.map((u) => (
              <tr key={u.uid}>
                <td className="px-4 py-2 font-medium">{u.displayName ?? '—'}</td>
                <td className="px-4 py-2 text-gray-600">{u.email}</td>
                <td className="px-4 py-2">
                  {isAdmin ? (
                    <select
                      value={u.role}
                      disabled={updatingUid === u.uid}
                      onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                      className="rounded border border-gray-300 px-2 py-1 text-sm disabled:opacity-50"
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {t(`role.${role}`)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    t(`role.${u.role}`)
                  )}
                </td>
                {(['department', 'program', 'major', 'cohort'] as const).map((field) => (
                  <td key={field} className="px-4 py-2">
                    {isAdmin ? (
                      <EditableCell
                        value={u[field as keyof AppUser] as string | undefined}
                        onSave={(value) => handleFieldChange(u.uid, field, value)}
                      />
                    ) : (
                      (u[field as keyof AppUser] as string | undefined) ?? '—'
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!isAdmin && <p className="mt-3 text-xs text-gray-400">{t('readonlyHint')}</p>}

      {showAddModal && <AddUserModal onClose={() => setShowAddModal(false)} onCreated={() => setShowAddModal(false)} />}
    </div>
  );
}

function EditableCell({ value, onSave }: { value: string | undefined; onSave: (value: string) => void }) {
  const [draft, setDraft] = useState(value ?? '');

  return (
    <input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft !== (value ?? '')) onSave(draft);
      }}
      className="w-28 rounded border border-transparent px-2 py-1 text-sm hover:border-gray-300 focus:border-gray-300 focus:outline-none"
    />
  );
}
