'use client';

import { createContext, useContext } from 'react';
import type { User } from 'firebase/auth';
import type { AppUser } from '@/lib/types';

export interface StudentSession {
  user: User;
  profile: AppUser | null;
}

export const StudentSessionContext = createContext<StudentSession | null>(null);

/** Chỉ dùng bên trong StudentShell — shell đảm bảo đã đăng nhập trước khi render trang. */
export function useStudentSession(): StudentSession {
  const session = useContext(StudentSessionContext);
  if (!session) throw new Error('useStudentSession phải nằm trong StudentShell');
  return session;
}
