import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/firebase';
import { DEFAULT_CATEGORIES } from '@/data/categories';
import type { Category } from '@/types';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
    return onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          setCategories(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Category, 'id'>) })));
        }
      },
      () => {
        // Không kết nối được Firestore (ví dụ chưa cấu hình env) — giữ seed data mặc định.
      }
    );
  }, []);

  return { categories };
}
