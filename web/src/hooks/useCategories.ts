'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DEFAULT_CATEGORIES } from '@/lib/categories';
import type { Category } from '@/lib/types';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
    return onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          setCategories(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Category, 'id'>) })));
        }
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, []);

  return { categories, loading };
}
