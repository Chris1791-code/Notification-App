import { randomBytes } from 'crypto';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

type UserRole = 'admin' | 'editor' | 'student' | 'staff';
const ROLES: UserRole[] = ['admin', 'editor', 'student', 'staff'];
const MAX_ROWS = 300;

interface BulkUserRow {
  email: string;
  password?: string;
  displayName: string;
  role: UserRole;
  department?: string;
  program?: string;
  major?: string;
  cohort?: string;
}

interface BulkCreateUserAccountsRequest {
  users: BulkUserRow[];
}

interface BulkCreateResult {
  email: string;
  uid?: string;
  tempPassword?: string;
  error?: string;
}

function generateTempPassword(): string {
  return randomBytes(9).toString('base64url');
}

/**
 * Tạo hàng loạt tài khoản từ danh sách đã được client kiểm tra sơ bộ (email/họ
 * tên hợp lệ, không trùng trong file). Xử lý tuần tự — không dùng Promise.all —
 * để một dòng lỗi (vd. email đã tồn tại) không làm hỏng các dòng còn lại, và để
 * không vượt quota tạo user/phút của Firebase Auth khi file lớn.
 */
export const bulkCreateUserAccounts = onCall<BulkCreateUserAccountsRequest>(
  { timeoutSeconds: 300 },
  async (request) => {
    const callerUid = request.auth?.uid;
    if (!callerUid) {
      throw new HttpsError('unauthenticated', 'Bạn cần đăng nhập để thực hiện thao tác này.');
    }

    const db = getFirestore();
    const callerDoc = await db.collection('users').doc(callerUid).get();
    if (callerDoc.data()?.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Chỉ Quản trị viên mới được tạo tài khoản người dùng.');
    }

    const rows = request.data?.users ?? [];
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new HttpsError('invalid-argument', 'Danh sách người dùng trống.');
    }
    if (rows.length > MAX_ROWS) {
      throw new HttpsError('invalid-argument', `Chỉ được tạo tối đa ${MAX_ROWS} tài khoản mỗi lần.`);
    }

    const auth = getAuth();
    const results: BulkCreateResult[] = [];

    for (const row of rows) {
      const email = row.email?.trim();
      const displayName = row.displayName?.trim();
      const role = ROLES.includes(row.role) ? row.role : 'student';

      if (!email || !displayName) {
        results.push({ email: email || '(thiếu email)', error: 'Thiếu email hoặc họ tên.' });
        continue;
      }

      const suppliedPassword = row.password && row.password.length >= 6 ? row.password : undefined;
      const tempPassword = suppliedPassword ?? generateTempPassword();

      try {
        const newUser = await auth.createUser({ email, password: tempPassword, displayName });
        await db
          .collection('users')
          .doc(newUser.uid)
          .set({
            email,
            displayName,
            role,
            ...(row.department?.trim() ? { department: row.department.trim() } : {}),
            ...(row.program?.trim() ? { program: row.program.trim() } : {}),
            ...(row.major?.trim() ? { major: row.major.trim() } : {}),
            ...(row.cohort?.trim() ? { cohort: row.cohort.trim() } : {})
          });
        results.push({ email, uid: newUser.uid, tempPassword: suppliedPassword ? undefined : tempPassword });
      } catch (error) {
        const code = (error as { code?: string }).code;
        const message = code === 'auth/email-already-exists' ? 'Email này đã có tài khoản.' : (error as Error).message;
        results.push({ email, error: message });
      }
    }

    return { results };
  }
);
