import { auth } from '@/lib/firebase';

/**
 * Header Authorization mang ID token của người dùng đang đăng nhập, dùng cho
 * các API route nội bộ (vd. /api/translate) cần xác thực server-side trước
 * khi gọi dịch vụ trả phí bên ngoài.
 */
export async function authHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}
