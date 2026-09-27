'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AppNotification } from '@/lib/types';

/**
 * Thông báo đã đăng, mới nhất trước — dùng cho web app sinh viên. Firestore
 * rules chỉ cho người không phải editor đọc bản `published`, nên truy vấn phải
 * lọc đúng status (dùng index status + publishAt có sẵn).
 */
export function usePublishedNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'notifications'), where('status', '==', 'published'), orderBy('publishAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => {
        setNotifications(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AppNotification, 'id'>) })));
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
  }, []);

  return { notifications, loading, error };
}
