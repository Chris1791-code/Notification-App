import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { logger } from 'firebase-functions';

// FCM giới hạn 500 token cho mỗi lần sendEachForMulticast.
const FCM_MULTICAST_LIMIT = 500;

// Mã lỗi cho biết token không còn dùng được (người dùng tắt thông báo, xoá app
// khỏi màn hình chính, xoá dữ liệu trình duyệt…) — cần gỡ khỏi hồ sơ người dùng.
const STALE_TOKEN_ERRORS = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token'
]);

// Payload Web Push tối đa ~4KB; nội dung đầy đủ nằm ở trang chi tiết nên chỉ
// cần đoạn đầu để xem trước trên màn hình khoá.
const MAX_BODY_LENGTH = 400;

function preview(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.length > MAX_BODY_LENGTH ? `${normalized.slice(0, MAX_BODY_LENGTH - 1)}…` : normalized;
}

export interface WebPushMessage {
  title: string;
  body: string;
  /** Đường dẫn tương đối trong web app, mở khi người dùng bấm vào thông báo. */
  url: string;
  notificationId: string;
  urgent: boolean;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * Gửi Web Push qua Firebase Cloud Messaging tới web app (PWA) của sinh viên.
 * Gửi dạng data-only: service worker `web/public/sw.js` tự hiển thị thông báo,
 * nên cùng một định dạng chạy được trên Chrome/Edge/Firefox và Safari iOS 16.4+.
 *
 * @param tokenOwners token → uid, để gỡ token hết hạn khỏi đúng hồ sơ người dùng.
 * @returns số token gửi thành công.
 */
export async function sendWebPushNotifications(
  message: WebPushMessage,
  tokenOwners: Map<string, string>
): Promise<number> {
  const messaging = getMessaging();
  const db = getFirestore();
  let successCount = 0;

  for (const tokens of chunk(Array.from(tokenOwners.keys()), FCM_MULTICAST_LIMIT)) {
    const response = await messaging.sendEachForMulticast({
      tokens,
      data: {
        title: message.title.slice(0, 200),
        body: preview(message.body),
        url: message.url,
        notificationId: message.notificationId
      },
      webpush: {
        headers: {
          Urgency: message.urgent ? 'high' : 'normal',
          TTL: String(3 * 24 * 60 * 60)
        }
      }
    });
    successCount += response.successCount;

    const cleanups: Promise<unknown>[] = [];
    response.responses.forEach((result, index) => {
      const code = result.error?.code;
      if (!code || !STALE_TOKEN_ERRORS.has(code)) return;
      const token = tokens[index];
      const uid = tokenOwners.get(token);
      if (!uid) return;
      cleanups.push(
        db
          .collection('users')
          .doc(uid)
          .update({ webPushTokens: FieldValue.arrayRemove(token) })
          .catch((error: unknown) =>
            logger.warn('sendWebPushNotifications: không gỡ được token hết hạn', {
              uid,
              error: error instanceof Error ? error.message : String(error)
            })
          )
      );
    });
    await Promise.all(cleanups);
  }

  return successCount;
}
