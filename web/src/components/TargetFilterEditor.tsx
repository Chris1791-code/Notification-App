'use client';

import { KeyboardEvent, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useUsers } from '@/hooks/useUsers';
import type { AppUser, TargetFilter, UserRole } from '@/lib/types';

const ROLES: UserRole[] = ['admin', 'editor', 'student', 'staff'];

function distinctValues(users: AppUser[], field: 'department' | 'program' | 'major' | 'cohort') {
  const set = new Set(users.map((u) => u[field]).filter((v): v is string => Boolean(v)));
  return Array.from(set).sort();
}

// Chọn vai trò từ danh sách cố định — không cần nhập tay vì chỉ có 4 giá trị hợp lệ.
function RoleChipGroup({
  label,
  selected,
  onChange
}: {
  label: string;
  selected: UserRole[];
  onChange: (next: UserRole[]) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-gray-500">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {ROLES.map((role) => {
          const active = selected.includes(role);
          return (
            <button
              key={role}
              type="button"
              onClick={() => onChange(active ? selected.filter((v) => v !== role) : [...selected, role])}
              className={`rounded-full border px-2.5 py-1 text-xs ${
                active ? 'border-brand bg-brand-light text-brand-dark' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {role}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Khoa/Đơn vị, Chương trình, Ngành học, Khóa là trường tự do (không có danh sách cố định) —
// cho phép gõ tay giá trị bất kỳ (ví dụ nhắm tới sinh viên chưa có tài khoản), đồng thời gợi ý
// nhanh những giá trị đã thấy trong dữ liệu người dùng hiện có nếu có.
function TagInputGroup({
  label,
  hint,
  knownValues,
  selected,
  onChange
}: {
  label: string;
  hint: string;
  knownValues: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  const suggestions = knownValues.filter((v) => !selected.includes(v));

  function addValue(raw: string) {
    const value = raw.trim();
    if (!value || selected.includes(value)) return;
    onChange([...selected, value]);
    setDraft('');
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addValue(draft);
    }
  }

  return (
    <div>
      <p className="mb-1 text-xs font-medium text-gray-500">{label}</p>

      {selected.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          {selected.map((value) => (
            <span
              key={value}
              className="flex items-center gap-1 rounded-full border border-brand bg-brand-light px-2.5 py-1 text-xs text-brand-dark"
            >
              {value}
              <button
                type="button"
                onClick={() => onChange(selected.filter((v) => v !== value))}
                className="text-brand-dark hover:text-red-600"
                aria-label={`Bỏ ${value}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={hint}
          className="flex-1 rounded border border-gray-300 px-2.5 py-1 text-xs"
          list={`suggestions-${label}`}
        />
        <button
          type="button"
          onClick={() => addValue(draft)}
          className="rounded border border-gray-300 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50"
        >
          Thêm
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {suggestions.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => addValue(value)}
              className="rounded-full border border-dashed border-gray-300 px-2.5 py-1 text-xs text-gray-500 hover:border-brand hover:text-brand-dark"
            >
              + {value}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function TargetFilterEditor({
  value,
  onChange
}: {
  value: TargetFilter;
  onChange: (next: TargetFilter) => void;
}) {
  const t = useTranslations('notifications.form.targeting');
  const { users } = useUsers();

  const departments = useMemo(() => distinctValues(users, 'department'), [users]);
  const programs = useMemo(() => distinctValues(users, 'program'), [users]);
  const majors = useMemo(() => distinctValues(users, 'major'), [users]);
  const cohorts = useMemo(() => distinctValues(users, 'cohort'), [users]);

  const isEmpty =
    !value.departments?.length && !value.programs?.length && !value.majors?.length && !value.cohorts?.length && !value.roles?.length;

  return (
    <div className="space-y-3 rounded border border-gray-200 p-3">
      <p className="text-xs text-gray-500">{isEmpty ? t('everyoneHint') : t('filteredHint')}</p>
      <p className="text-xs text-gray-400">{t('exactMatchHint')}</p>

      <RoleChipGroup
        label={t('roles')}
        selected={(value.roles as UserRole[]) ?? []}
        onChange={(roles) => onChange({ ...value, roles })}
      />
      <TagInputGroup
        label={t('departments')}
        hint={t('typeHint')}
        knownValues={departments}
        selected={value.departments ?? []}
        onChange={(departments) => onChange({ ...value, departments })}
      />
      <TagInputGroup
        label={t('programs')}
        hint={t('typeHint')}
        knownValues={programs}
        selected={value.programs ?? []}
        onChange={(programs) => onChange({ ...value, programs })}
      />
      <TagInputGroup
        label={t('majors')}
        hint={t('typeHint')}
        knownValues={majors}
        selected={value.majors ?? []}
        onChange={(majors) => onChange({ ...value, majors })}
      />
      <TagInputGroup
        label={t('cohorts')}
        hint={t('typeHint')}
        knownValues={cohorts}
        selected={value.cohorts ?? []}
        onChange={(cohorts) => onChange({ ...value, cohorts })}
      />
    </div>
  );
}
