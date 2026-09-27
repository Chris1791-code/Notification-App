import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { sendExpoPushNotifications, type ExpoPushMessage } from './expoPush';
import { sendWebPushNotifications } from './webPush';
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

  const notificationId = event.params.notificationId;
  const db = getFirestore();
  const usersSnap = await db.collection('users').get();
  const targetFilter = after.targetFilter as TargetFilter | undefined;
  const urgent = after.priority === 'urgent';

  // Expo (app mobile) và Web Push (web app sinh viên) gom token riêng. Web Push
  // chia theo ngôn ngữ người dùng đã chọn trên web app (users/{uid}.locale).
  const expoTokens = new Set<string>();
  const webTokensByLocale: Record<'vi' | 'en', Map<string, string>> = { vi: new Map(), en: new Map() };
  usersSnap.forEach((doc) => {
    const user = doc.data();
    if (!matchesTargetFilter(user, targetFilter)) return;
    (user.expoPushTokens as string[] | undefined)?.forEach((token) => expoTokens.add(token));
    const locale = user.locale === 'en' ? 'en' : 'vi';
    (user.webPushTokens as string[] | undefined)?.forEach((token) => webTokensByLocale[locale].set(token, doc.id));
  });

  const webTokenCount = webTokensByLocale.vi.size + webTokensByLocale.en.size;
  if (expoTokens.size === 0 && webTokenCount === 0) {
    logger.info('onNotificationPublished: không có token nào để gửi push', { notificationId });
    return;
  }

  const withUrgentMark = (title: string) => (urgent ? `🔴 ${title}` : title);

  if (expoTokens.size > 0) {
    const messages: ExpoPushMessage[] = Array.from(expoTokens).map((token) => ({
      to: token,
      title: withUrgentMark(after.titleVi),
      body: after.bodyVi,
      priority: urgent ? 'high' : 'default',
      data: { notificationId, categoryId: after.categoryId }
    }));
    try {
      await sendExpoPushNotifications(messages);
      logger.info('onNotificationPublished: đã gửi Expo push', { notificationId, recipientCount: messages.length });
    } catch (error) {
      logger.error('onNotificationPublished: gửi Expo push thất bại', {
        notificationId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  for (const locale of ['vi', 'en'] as const) {
    const tokenOwners = webTokensByLocale[locale];
    if (tokenOwners.size === 0) continue;
    const useEnglish = locale === 'en' && !!after.titleEn && !!after.bodyEn;
    try {
      const successCount = await sendWebPushNotifications(
        {
          title: withUrgentMark(useEnglish ? after.titleEn : after.titleVi),
          body: useEnglish ? after.bodyEn : after.bodyVi,
          url: `/${locale}/app/n/${notificationId}`,
          notificationId,
          urgent
        },
        tokenOwners
      );
      logger.info('onNotificationPublished: đã gửi Web Push', {
        notificationId,
        locale,
        tokenCount: tokenOwners.size,
        successCount
      });
    } catch (error) {
      logger.error('onNotificationPublished: gửi Web Push thất bại', {
        notificationId,
        locale,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
});
