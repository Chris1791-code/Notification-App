export interface TargetFilter {
  departments?: string[];
  programs?: string[];
  majors?: string[];
  cohorts?: string[];
  roles?: string[];
}

interface TargetableUser {
  role?: string;
  department?: string;
  program?: string;
  major?: string;
  cohort?: string;
}

function fieldMatches(selected: string[] | undefined, value: string | undefined): boolean {
  return !selected || selected.length === 0 || (value !== undefined && selected.includes(value));
}

/**
 * targetFilter rỗng (mọi trường đều undefined/[]) nghĩa là gửi cho toàn bộ
 * người dùng — giữ đúng hành vi mặc định trước khi có tính năng lọc nhóm.
 */
export function matchesTargetFilter(user: TargetableUser, filter: TargetFilter | undefined): boolean {
  if (!filter) return true;
  return (
    fieldMatches(filter.departments, user.department) &&
    fieldMatches(filter.programs, user.program) &&
    fieldMatches(filter.majors, user.major) &&
    fieldMatches(filter.cohorts, user.cohort) &&
    fieldMatches(filter.roles, user.role)
  );
}
