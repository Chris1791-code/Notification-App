import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

type UserRole = 'admin' | 'editor' | 'student' | 'staff';

interface CreateUserAccountRequest {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  department?: string;
  program?: string;
  major?: string;
  cohort?: string;
}

const ROLES: UserRole[] = ['admin', 'editor', 'student', 'staff'];

/**
 * Tạo tài khoản người dùng thay cho admin — bắt buộc dùng Callable Function
 * thay vì createUserWithEmailAndPassword ở client, vì gọi hàm đó trực tiếp từ
 * web admin sẽ đăng nhập vào tài khoản mới và đăng xuất admin ra khỏi phiên
 * hiện tại (hành vi mặc định của Firebase Auth client SDK).
 */
export const createUserAccount = onCall<CreateUserAccountRequest>(async (request) => {
  const callerUid = request.auth?.uid;
  if (!callerUid) {
    throw new HttpsError('unauthenticated', 'Bạn cần đăng nhập để thực hiện thao tác này.');
  }

  const db = getFirestore();
  const callerDoc = await db.collection('users').doc(callerUid).get();
  if (callerDoc.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Chỉ Quản trị viên mới được tạo tài khoản người dùng.');
  }

  const { email, password, displayName, role, department, program, major, cohort } = request.data ?? {};

  if (!email || !password || !displayName) {
    throw new HttpsError('invalid-argument', 'Thiếu email, mật khẩu hoặc họ tên.');
  }
  if (password.length < 6) {
    throw new HttpsError('invalid-argument', 'Mật khẩu phải có ít nhất 6 ký tự.');
  }
  if (!ROLES.includes(role)) {
    throw new HttpsError('invalid-argument', 'Vai trò không hợp lệ.');
  }

  const auth = getAuth();
  let newUser;
  try {
    newUser = await auth.createUser({ email, password, displayName });
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'Email này đã có tài khoản.');
    }
    throw new HttpsError('internal', (error as Error).message);
  }

  await db
    .collection('users')
    .doc(newUser.uid)
    .set({
      email,
      displayName,
      role,
      ...(department ? { department } : {}),
      ...(program ? { program } : {}),
      ...(major ? { major } : {}),
      ...(cohort ? { cohort } : {})
    });

  return { uid: newUser.uid };
});
