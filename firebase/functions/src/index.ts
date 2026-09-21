import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { sendExpoPushNotifications, type ExpoPushMessage } from './expoPush';
import { matchesTargetFilter, type TargetFilter } from './targetFilter';

initializeApp();

export { createUserAccount } from './createUserAccount';
export { bulkCreateUserAccounts } from './bulkCreateUserAccounts';
export { publishScheduledNotifications } from './publishScheduledNotifications';

/**
 * Gửi push khi một thông báo chuyển trạng thái sang "published" lần đầu.
 * Người nhận được lọc theo `targetFilter` của thông báo (department/program/
 * major/cohort/role) — rỗng nghĩa là gửi cho toàn bộ người dùng.
 *
 * Quy mô hiện tại (một trường đại học) đủ nhỏ để quét toàn bộ collection
 * `users` mỗi lần đăng bài; nếu số người dùng lớn hơn nhiều, nên tách token
 * ra một collection riêng được index theo các trường lọc thay vì quét users.
 */
export const onNotificationPublished = onDocumentWritten('notifications/{notificationId}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();

  if (!after) return; // Thông báo bị xoá.
  if (after.status !== 'published') return;
  if (before?.status === 'published') return; // Đã gửi push trước đó, tránh gửi trùng khi chỉnh sửa nhẹ.

  const db = getFirestore();
  const usersSnap = await db.collection('users').get();
  const targetFilter = after.targetFilter as TargetFilter | undefined;

  const tokens = new Set<string>();
  usersSnap.forEach((doc) => {
    const user = doc.data();
    if (!matchesTargetFilter(user, targetFilter)) return;
    const userTokens = user.expoPushTokens as string[] | undefined;
    userTokens?.forEach((token) => tokens.add(token));
  });

  if (tokens.size === 0) {
    logger.info('onNotificationPublished: không có token nào để gửi push', {
      notificationId: event.params.notificationId
    });
    return;
  }

  const title = after.priority === 'urgent' ? `🔴 ${after.titleVi}` : after.titleVi;
  const messages: ExpoPushMessage[] = Array.from(tokens).map((token) => ({
    to: token,
    title,
    body: after.bodyVi,
    priority: after.priority === 'urgent' ? 'high' : 'default',
    data: { notificationId: event.params.notificationId, categoryId: after.categoryId }
  }));

  try {
    await sendExpoPushNotifications(messages);
    logger.info('onNotificationPublished: đã gửi push', {
      notificationId: event.params.notificationId,
      recipientCount: messages.length
    });
  } catch (error) {
    logger.error('onNotificationPublished: gửi push thất bại', {
      notificationId: event.params.notificationId,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});
