const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';
const EXPO_PUSH_BATCH_SIZE = 100;

export interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  priority?: 'default' | 'normal' | 'high';
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * Gửi push qua Expo Push Service (tự chuyển tiếp qua FCM cho Android, APNs
 * cho iOS) — không cần cấu hình riêng credentials FCM/APNs ở phía Cloud
 * Function, EAS quản lý phần đó khi build app.
 */
export async function sendExpoPushNotifications(messages: ExpoPushMessage[]): Promise<void> {
  for (const batch of chunk(messages, EXPO_PUSH_BATCH_SIZE)) {
    const response = await fetch(EXPO_PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(batch)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Expo push request failed (${response.status}): ${text}`);
    }
  }
}
