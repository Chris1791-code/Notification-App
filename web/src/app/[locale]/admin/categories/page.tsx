'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { deleteDoc, doc, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { DEFAULT_CATEGORIES } from '@/lib/categories';
import type { Category } from '@/lib/types';

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function CategoriesPage() {
  const t = useTranslations('categories');
  const { profile } = useAuth();
  const isEditor = profile?.role === 'admin' || profile?.role === 'editor';
  const { categories, loading } = useCategories();

  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  async function handleSeedDefaults() {
    setError(null);
    setSeeding(true);
    try {
      const batch = writeBatch(db);
      for (const c of DEFAULT_CATEGORIES) {
        const { id, ...data } = c;
        batch.set(doc(db, 'categories', id), data, { merge: true });
      }
      await batch.commit();
    } catch {
      setError(t('saveError'));
    } finally {
      setSeeding(false);
    }
  }

  async function handleUpdate(id: string, field: keyof Category, value: string | number) {
    setError(null);
    try {
      await updateDoc(doc(db, 'categories', id), { [field]: value });
    } catch {
      setError(t('saveError'));
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch {
      setError(t('saveError'));
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const nameVi = String(formData.get('nameVi') ?? '').trim();
    const nameEn = String(formData.get('nameEn') ?? '').trim();
    const icon = String(formData.get('icon') ?? '').trim();
    if (!nameVi) return;

    const key = slugify(nameVi);
    try {
      await setDoc(doc(db, 'categories', key), {
        key,
        nameVi,
        nameEn,
        ...(icon ? { icon } : {}),
        order: categories.length + 1
      });
      form.reset();
    } catch {
      setError(t('saveError'));
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('title')}</h1>
        {isEditor && categories.length === 0 && (
          <button
            onClick={handleSeedDefaults}
            disabled={seeding}
            className="rounded border border-brand px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand-light disabled:opacity-50"
          >
            {seeding ? '…' : t('seedDefaults')}
          </button>
        )}
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="w-16 px-4 py-2">{t('order')}</th>
              <th className="w-14 px-4 py-2">{t('icon')}</th>
              <th className="px-4 py-2">{t('nameVi')}</th>
              <th className="px-4 py-2">{t('nameEn')}</th>
              {isEditor && <th className="w-20 px-4 py-2" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td className="px-4 py-3 text-gray-400" colSpan={5}>
                  {t('loading')}
                </td>
              </tr>
            )}
            {!loading && categories.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-gray-400" colSpan={5}>
                  {t('empty')}
                </td>
              </tr>
            )}
            {categories.map((c) => (
              <tr key={c.id}>
                {isEditor ? (
                  <>
                    <td className="px-4 py-1">
                      <input
                        type="number"
                        defaultValue={c.order}
                        onBlur={(e) => {
                          const value = Number(e.target.value);
                          if (value !== c.order) handleUpdate(c.id, 'order', value);
                        }}
                        className="w-14 rounded border border-transparent px-2 py-1 text-sm hover:border-gray-300 focus:border-gray-300 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-1">
                      <input
                        defaultValue={c.icon ?? ''}
                        onBlur={(e) => {
                          if (e.target.value !== (c.icon ?? '')) handleUpdate(c.id, 'icon', e.target.value);
                        }}
                        className="w-12 rounded border border-transparent px-2 py-1 text-center text-sm hover:border-gray-300 focus:border-gray-300 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-1">
                      <input
                        defaultValue={c.nameVi}
                        onBlur={(e) => {
                          if (e.target.value !== c.nameVi) handleUpdate(c.id, 'nameVi', e.target.value);
                        }}
                        className="w-full rounded border border-transparent px-2 py-1 text-sm font-medium hover:border-gray-300 focus:border-gray-300 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-1">
                      <input
                        defaultValue={c.nameEn}
                        onBlur={(e) => {
                          if (e.target.value !== c.nameEn) handleUpdate(c.id, 'nameEn', e.target.value);
                        }}
                        className="w-full rounded border border-transparent px-2 py-1 text-sm text-gray-500 hover:border-gray-300 focus:border-gray-300 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-1 text-right">
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        {t('delete')}
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2">{c.order}</td>
                    <td className="px-4 py-2">{c.icon ?? ''}</td>
                    <td className="px-4 py-2 font-medium">{c.nameVi}</td>
                    <td className="px-4 py-2 text-gray-500">{c.nameEn}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isEditor && (
        <form onSubmit={handleCreate} className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">{t('icon')}</label>
            <input name="icon" className="w-16 rounded border border-gray-300 px-2 py-2 text-sm" placeholder="📌" />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-500">{t('nameVi')}</label>
            <input name="nameVi" required className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-500">{t('nameEn')}</label>
            <input name="nameEn" className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <button
            type="submit"
            className="rounded bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            {t('add')}
          </button>
        </form>
      )}

      {!isEditor && <p className="mt-3 text-xs text-gray-400">{t('readonlyHint')}</p>}
    </div>
  );
}
