import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';

/**
 * Cứ mỗi 5 phút, quét các thông báo status == 'scheduled' đã tới hoặc qua
 * publishAt và chuyển sang 'published'. Việc chuyển trạng thái này tự kích
 * hoạt onNotificationPublished (Firestore write trigger) để gửi push — không
 * cần lặp lại logic gửi push ở đây.
 */
export const publishScheduledNotifications = onSchedule('every 5 minutes', async () => {
  const db = getFirestore();
  const nowIso = new Date().toISOString();

  const dueSnap = await db.collection('notifications').where('status', '==', 'scheduled').where('publishAt', '<=', nowIso).get();

  if (dueSnap.empty) return;

  const batch = db.batch();
  dueSnap.forEach((doc) => {
    batch.update(doc.ref, { status: 'published', updatedAt: FieldValue.serverTimestamp() });
  });
  await batch.commit();

  logger.info('publishScheduledNotifications: đã đăng thông báo tới hạn', { count: dueSnap.size });
});
