'use client';

import { useCallback, useEffect, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Bookmark của người dùng (savedNotifications/{uid}_{notificationId}). Đọc bằng
 * truy vấn theo uid thay vì getDoc từng bản ghi: rules kiểm tra
 * resource.data.uid, nên getDoc một bản ghi chưa tồn tại sẽ bị từ chối.
 */
export function useSavedNotifications(uid: string | undefined) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, 'savedNotifications'), where('uid', '==', uid));
    return onSnapshot(
      q,
      (snap) => {
        setSavedIds(new Set(snap.docs.map((d) => d.data().notificationId as string)));
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, [uid]);

  const toggleSaved = useCallback(
    async (notificationId: string) => {
      if (!uid) return;
      const ref = doc(db, 'savedNotifications', `${uid}_${notificationId}`);
      if (savedIds.has(notificationId)) {
        await deleteDoc(ref);
      } else {
        await setDoc(ref, { uid, notificationId, savedAt: serverTimestamp() });
      }
    },
    [uid, savedIds]
  );

  return { savedIds, loading, toggleSaved };
}
