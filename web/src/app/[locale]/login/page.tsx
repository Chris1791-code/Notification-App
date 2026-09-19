import { LoginForm } from '@/components/LoginForm';

// Trang đăng nhập dùng Firebase client SDK, cần chạy động thay vì prerender tĩnh.
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return <LoginForm />;
}
