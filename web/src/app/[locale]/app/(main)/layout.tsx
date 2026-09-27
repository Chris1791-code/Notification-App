import type { ReactNode } from 'react';
import { StudentShell } from '@/components/student/StudentShell';

export default function StudentMainLayout({ children }: { children: ReactNode }) {
  return <StudentShell>{children}</StudentShell>;
}
