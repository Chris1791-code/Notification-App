'use client';

import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage() {
  const t = useTranslations('nav');
  const { firebaseUser, profile, profileError, loading } = useAuth();

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">{t('settings')}</h1>

      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Cấu hình Firebase đang dùng</h2>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-gray-500">Project ID</dt>
            <dd className="select-all break-all rounded bg-gray-50 px-2 py-1 font-mono">
              {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || (
                <span className="text-red-600">(chưa thiết lập — env var trống)</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Auth Domain</dt>
            <dd className="select-all break-all rounded bg-gray-50 px-2 py-1 font-mono">
              {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || (
                <span className="text-red-600">(chưa thiết lập — env var trống)</span>
              )}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-gray-400">
          Project ID phải trùng khớp với project bạn đang xem trong Firebase Console (góc trên bên trái).
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Tài khoản đang đăng nhập</h2>
        {loading ? (
          <p className="text-sm text-gray-400">Đang tải…</p>
        ) : !firebaseUser ? (
          <p className="text-sm text-red-600">Chưa đăng nhập.</p>
        ) : (
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-500">Email</dt>
              <dd className="font-mono">{firebaseUser.email}</dd>
            </div>
            <div>
              <dt className="text-gray-500">UID (Authentication)</dt>
              <dd className="select-all break-all rounded bg-gray-50 px-2 py-1 font-mono">{firebaseUser.uid}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Hồ sơ trong Firestore (users/{'{UID}'})</dt>
              <dd>
                {profileError ? (
                  <span className="text-red-600">
                    Lỗi khi đọc Firestore: <code className="break-all">{profileError}</code>
                  </span>
                ) : profile ? (
                  <span className="text-emerald-700">
                    Tìm thấy — role: <strong>{profile.role}</strong>
                  </span>
                ) : (
                  <span className="text-red-600">
                    Không tìm thấy document nào trong collection <code>users</code> có ID trùng với UID ở trên (và
                    không có lỗi quyền — Firestore trả về rỗng thật sự).
                  </span>
                )}
              </dd>
            </div>
          </dl>
        )}
        <p className="mt-3 text-xs text-gray-400">
          So sánh dòng UID ở trên với Document ID trong Firestore Console (Firestore Database → Data → users) —
          phải giống nhau tuyệt đối từng ký tự.
        </p>
      </div>

      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
        TODO: cấu hình vai trò, kênh gửi (App/Email), ngôn ngữ mặc định của hệ thống.
      </div>
    </div>
  );
}
