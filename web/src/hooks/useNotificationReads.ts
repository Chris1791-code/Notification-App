'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ReadReceipt {
  id: string;
  uid: string;
  notificationId: string;
  categoryId?: string;
  readAt: { toDate: () => Date } | null;
}

// TODO: khi số lượng bản ghi lớn, thay bằng số liệu tổng hợp sẵn (ví dụ một
// Cloud Function ghi vào collection `notificationStats` mỗi khi có lượt đọc
// mới) thay vì tải toàn bộ notificationReads về client như hiện tại.
export function useNotificationReads() {
  const [reads, setReads] = useState<ReadReceipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'notificationReads'), orderBy('readAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => {
        setReads(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              uid: data.uid,
              notificationId: data.notificationId,
              categoryId: data.categoryId,
              readAt: data.readAt ?? null
            };
          })
        );
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, []);

  return { reads, loading };
}
