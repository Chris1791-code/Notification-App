'use client';

import { getMessaging, getToken, deleteToken, isSupported } from 'firebase/messaging';
import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { db, firebaseApp } from '@/lib/firebase';

// Khoá công khai Web Push (VAPID) — Firebase Console → Project settings →
// Cloud Messaging → Web Push certificates. Là khoá công khai, được phép lộ ra client.
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

// Token FCM hiện tại của trình duyệt này, để biết khi nào token đổi (cần thay
// trong Firestore) và để gỡ đúng token khi đăng xuất.
const TOKEN_STORAGE_KEY = 'oisp.webPushToken';

export type PushState =
  | 'unconfigured' // thiếu NEXT_PUBLIC_FIREBASE_VAPID_KEY
  | 'unsupported' // trình duyệt không hỗ trợ Web Push
  | 'needs-install' // iPhone/iPad: phải "Thêm vào MH chính" rồi mở từ biểu tượng
  | 'denied' // người dùng đã chặn thông báo
  | 'default' // chưa hỏi quyền
  | 'granted';

export function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  // iPadOS 13+ tự nhận là Macintosh nhưng có màn hình cảm ứng.
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1);
}

export function isAndroid(): boolean {
  return typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** Phiên bản iOS dạng [major, minor], hoặc null nếu không phải iOS/không đọc được. */
export function iosVersion(): [number, number] | null {
  const match = typeof navigator !== 'undefined' ? navigator.userAgent.match(/OS (\d+)_(\d+)/) : null;
  return match ? [Number(match[1]), Number(match[2])] : null;
}

/** iOS/iPadOS dưới 16.4 không hỗ trợ Web Push cho web app. */
export function iosTooOld(): boolean {
  const version = iosVersion();
  if (!version || !isIos()) return false;
  const [major, minor] = version;
  return major < 16 || (major === 16 && minor < 4);
}

export async function getPushState(): Promise<PushState> {
  if (!VAPID_KEY) return 'unconfigured';
  if (typeof window === 'undefined') return 'unsupported';
  if (isIos() && !isStandalone()) return iosTooOld() ? 'unsupported' : 'needs-install';
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !(await isSupported())) return 'unsupported';
  return Notification.permission;
}

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Không lưu được (chế độ riêng tư…) — lần sau chỉ ghi lại token trùng, không sao.
  }
}

async function fetchToken(): Promise<string> {
  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  return getToken(getMessaging(firebaseApp), { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
}

/**
 * Lưu token vào users/{uid}.webPushTokens (Cloud Function onNotificationPublished
 * đọc mảng này để gửi) cùng ngôn ngữ đang dùng, để thông báo đến đúng ngôn ngữ.
 * Token cũ của trình duyệt này (nếu đổi) được gỡ luôn để không gửi trùng.
 */
async function saveToken(uid: string, token: string, locale: string) {
  const previous = readStoredToken();
  await updateDoc(doc(db, 'users', uid), { webPushTokens: arrayUnion(token), locale });
  if (previous && previous !== token) {
    await updateDoc(doc(db, 'users', uid), { webPushTokens: arrayRemove(previous) }).catch(() => undefined);
  }
  writeStoredToken(token);
}

/** Hỏi quyền (phải gọi từ thao tác bấm của người dùng — iOS bắt buộc) rồi đăng ký. */
export async function enablePush(uid: string, locale: string): Promise<PushState> {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission;
  await saveToken(uid, await fetchToken(), locale);
  return 'granted';
}

/**
 * Gọi mỗi lần mở web app khi đã có quyền: FCM có thể cấp token mới theo thời
 * gian, cần cập nhật lại để không lỡ thông báo.
 */
export async function refreshPushToken(uid: string, locale: string): Promise<void> {
  if ((await getPushState()) !== 'granted') return;
  await saveToken(uid, await fetchToken(), locale);
}

/** Gỡ token khỏi hồ sơ trước khi đăng xuất — máy dùng chung không nhận thông báo của người khác. */
export async function disablePush(uid: string): Promise<void> {
  const token = readStoredToken();
  if (token) {
    await updateDoc(doc(db, 'users', uid), { webPushTokens: arrayRemove(token) }).catch(() => undefined);
  }
  writeStoredToken(null);
  if (VAPID_KEY && (await isSupported().catch(() => false))) {
    await deleteToken(getMessaging(firebaseApp)).catch(() => undefined);
  }
}
