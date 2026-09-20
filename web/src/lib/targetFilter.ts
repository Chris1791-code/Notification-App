import type { AppUser, TargetFilter } from './types';

function fieldMatches(selected: string[] | undefined, value: string | undefined): boolean {
  return !selected || selected.length === 0 || (value !== undefined && selected.includes(value));
}

/**
 * Cùng logic với firebase/functions/src/targetFilter.ts (không dùng chung
 * package được vì web và Cloud Functions là 2 workspace tách biệt) — targetFilter
 * rỗng nghĩa là gửi cho toàn bộ người dùng.
 */
export function matchesTargetFilter(user: Pick<AppUser, 'role' | 'department' | 'program' | 'major' | 'cohort'>, filter: TargetFilter | undefined): boolean {
  if (!filter) return true;
  return (
    fieldMatches(filter.departments, user.department) &&
    fieldMatches(filter.programs, user.program) &&
    fieldMatches(filter.majors, user.major) &&
    fieldMatches(filter.cohorts, user.cohort) &&
    fieldMatches(filter.roles, user.role)
  );
}
