'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AppUser } from '@/lib/types';

export function useUsers() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('email', 'asc'));
    return onSnapshot(
      q,
      (snap) => {
        setUsers(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<AppUser, 'uid'>) })));
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, []);

  return { users, loading };
}
