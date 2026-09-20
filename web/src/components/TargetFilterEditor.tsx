'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useUsers } from '@/hooks/useUsers';
import type { AppUser, TargetFilter, UserRole } from '@/lib/types';

const ROLES: UserRole[] = ['admin', 'editor', 'student', 'staff'];

function distinctValues(users: AppUser[], field: 'department' | 'program' | 'major' | 'cohort') {
  const set = new Set(users.map((u) => u[field]).filter((v): v is string => Boolean(v)));
  return Array.from(set).sort();
}

function ChipGroup({
  label,
  options,
  selected,
  onChange
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-gray-500">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(active ? selected.filter((v) => v !== option) : [...selected, option])}
              className={`rounded-full border px-2.5 py-1 text-xs ${
                active ? 'border-brand bg-brand-light text-brand-dark' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
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
      <ChipGroup
        label={t('roles')}
        options={ROLES}
        selected={value.roles ?? []}
        onChange={(roles) => onChange({ ...value, roles: roles as UserRole[] })}
      />
      <ChipGroup
        label={t('departments')}
        options={departments}
        selected={value.departments ?? []}
        onChange={(departments) => onChange({ ...value, departments })}
      />
      <ChipGroup
        label={t('programs')}
        options={programs}
        selected={value.programs ?? []}
        onChange={(programs) => onChange({ ...value, programs })}
      />
      <ChipGroup
        label={t('majors')}
        options={majors}
        selected={value.majors ?? []}
        onChange={(majors) => onChange({ ...value, majors })}
      />
      <ChipGroup
        label={t('cohorts')}
        options={cohorts}
        selected={value.cohorts ?? []}
        onChange={(cohorts) => onChange({ ...value, cohorts })}
      />
    </div>
  );
}
