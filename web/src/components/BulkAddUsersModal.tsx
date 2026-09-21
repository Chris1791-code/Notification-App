'use client';

import { ChangeEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { parseCsv } from '@/lib/csv';
import type { UserRole } from '@/lib/types';

const ROLE_ALIASES: Record<string, UserRole> = {
  admin: 'admin',
  'quản trị viên': 'admin',
  'quan tri vien': 'admin',
  editor: 'editor',
  'biên tập viên': 'editor',
  'bien tap vien': 'editor',
  student: 'student',
  'sinh viên': 'student',
  'sinh vien': 'student',
  staff: 'staff',
  'nhân viên': 'staff',
  'nhan vien': 'staff'
};

const HEADER_ALIASES: Record<'displayName' | 'email' | 'password' | 'role' | 'department' | 'program' | 'major' | 'cohort', string[]> = {
  displayName: ['họ tên', 'ho ten', 'tên', 'ten', 'name', 'displayname', 'full name', 'fullname'],
  email: ['email'],
  password: ['mật khẩu', 'mật khẩu tạm thời', 'mat khau', 'password'],
  role: ['vai trò', 'vai tro', 'role'],
  department: ['khoa/đơn vị', 'khoa/don vi', 'department'],
  program: ['chương trình', 'chuong trinh', 'program'],
  major: ['ngành học', 'nganh hoc', 'ngành', 'nganh', 'major'],
  cohort: ['khóa', 'khoa', 'cohort']
};

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const MAX_ROWS = 300;

interface ParsedRow {
  rowNumber: number;
  displayName: string;
  email: string;
  password?: string;
  role: UserRole;
  department?: string;
  program?: string;
  major?: string;
  cohort?: string;
  blockingError?: string;
  note?: string;
}

interface BulkResult {
  email: string;
  uid?: string;
  tempPassword?: string;
  error?: string;
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function buildColumnMap(headerRow: string[]) {
  const map: Partial<Record<keyof typeof HEADER_ALIASES, number>> = {};
  headerRow.forEach((cell, index) => {
    const normalized = normalizeHeader(cell);
    for (const field of Object.keys(HEADER_ALIASES) as (keyof typeof HEADER_ALIASES)[]) {
      if (HEADER_ALIASES[field].includes(normalized)) {
        map[field] = index;
      }
    }
  });
  return map;
}

function parseRows(text: string): { rows: ParsedRow[]; fileError?: string } {
  const table = parseCsv(text);
  if (table.length === 0) {
    return { rows: [], fileError: 'File trống hoặc không đọc được.' };
  }

  const columnMap = buildColumnMap(table[0]);
  if (columnMap.email === undefined || columnMap.displayName === undefined) {
    return { rows: [], fileError: 'File cần có cột "Họ tên" và "Email" (xem file mẫu).' };
  }

  const dataRows = table.slice(1);
  if (dataRows.length > MAX_ROWS) {
    return { rows: [], fileError: `Chỉ hỗ trợ tối đa ${MAX_ROWS} dòng mỗi lần import.` };
  }

  const seenEmails = new Set<string>();
  const rows: ParsedRow[] = dataRows.map((cells, index) => {
    const get = (field: keyof typeof HEADER_ALIASES) => {
      const col = columnMap[field];
      return col === undefined ? '' : (cells[col] ?? '').trim();
    };

    const displayName = get('displayName');
    const email = get('email');
    const rawPassword = get('password');
    const rawRole = normalizeHeader(get('role'));
    const department = get('department');
    const program = get('program');
    const major = get('major');
    const cohort = get('cohort');

    const row: ParsedRow = {
      rowNumber: index + 2,
      displayName,
      email,
      role: ROLE_ALIASES[rawRole] ?? 'student',
      department: department || undefined,
      program: program || undefined,
      major: major || undefined,
      cohort: cohort || undefined
    };

    if (!displayName || !email) {
      row.blockingError = 'Thiếu họ tên hoặc email.';
    } else if (!EMAIL_REGEX.test(email)) {
      row.blockingError = 'Email không hợp lệ.';
    } else if (seenEmails.has(email.toLowerCase())) {
      row.blockingError = 'Email trùng trong file.';
    }

    if (!row.blockingError) {
      seenEmails.add(email.toLowerCase());
      if (rawPassword && rawPassword.length >= 6) {
        row.password = rawPassword;
      } else if (rawPassword) {
        row.note = 'Mật khẩu quá ngắn — sẽ tự tạo mật khẩu tạm.';
      }
      if (rawRole && !ROLE_ALIASES[rawRole]) {
        row.note = row.note ? `${row.note} Vai trò không nhận dạng được — mặc định Sinh viên.` : 'Vai trò không nhận dạng được — mặc định Sinh viên.';
      }
    }

    return row;
  });

  return { rows };
}

function downloadCsv(filename: string, headerRow: string[], dataRows: (string | undefined)[][]) {
  const escape = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
  const lines = [headerRow, ...dataRows.map((r) => r.map((cell) => cell ?? ''))].map((r) => r.map((cell) => escape(String(cell))).join(','));
  const blob = new Blob([`﻿${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function BulkAddUsersModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('users');
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<BulkResult[] | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validRows = rows.filter((r) => !r.blockingError);

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setResults(null);
    setSubmitError(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const { rows: parsed, fileError: err } = parseRows(String(reader.result ?? ''));
      setRows(parsed);
      setFileError(err ?? null);
    };
    reader.readAsText(file, 'utf-8');
  }

  function handleDownloadTemplate() {
    downloadCsv(
      'mau-them-nguoi-dung.csv',
      ['Họ tên', 'Email', 'Mật khẩu', 'Vai trò', 'Khoa/Đơn vị', 'Chương trình', 'Ngành học', 'Khóa'],
      [['Nguyễn Văn A', 'vana@hcmut.edu.vn', '', 'Sinh viên', 'Khoa Máy tính', 'Chính quy', 'Khoa học máy tính', 'K2026']]
    );
  }

  function handleDownloadResults() {
    if (!results) return;
    downloadCsv(
      'ket-qua-them-nguoi-dung.csv',
      ['Email', 'Trạng thái', 'Mật khẩu tạm'],
      results.map((r) => [r.email, r.error ? `Lỗi: ${r.error}` : 'Đã tạo', r.tempPassword ?? ''])
    );
  }

  async function handleImport() {
    setSubmitError(null);
    setImporting(true);
    try {
      const bulkCreateUserAccounts = httpsCallable<{ users: unknown[] }, { results: BulkResult[] }>(
        functions,
        'bulkCreateUserAccounts'
      );
      const res = await bulkCreateUserAccounts({
        users: validRows.map((r) => ({
          email: r.email,
          password: r.password,
          displayName: r.displayName,
          role: r.role,
          department: r.department,
          program: r.program,
          major: r.major,
          cohort: r.cohort
        }))
      });
      setResults(res.data.results);
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setImporting(false);
    }
  }

  const successCount = results?.filter((r) => !r.error).length ?? 0;
  const errorCount = results?.filter((r) => r.error).length ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-1 text-lg font-semibold">{t('bulkAdd.title')}</h2>
        <p className="mb-4 text-sm text-gray-500">{t('bulkAdd.instructions')}</p>

        {!results && (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
              >
                {t('bulkAdd.downloadTemplate')}
              </button>
              <label className="cursor-pointer rounded bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark">
                {t('bulkAdd.chooseFile')}
                <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
              </label>
              {fileName && <span className="text-sm text-gray-500">{fileName}</span>}
            </div>

            {fileError && <p className="mb-3 text-sm text-red-600">{fileError}</p>}
            {submitError && <p className="mb-3 text-sm text-red-600">{submitError}</p>}

            {rows.length > 0 && !fileError && (
              <>
                <p className="mb-2 text-sm text-gray-600">
                  {t('bulkAdd.summary', { valid: validRows.length, total: rows.length })}
                </p>
                <div className="mb-4 max-h-64 overflow-y-auto rounded border border-gray-200">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-gray-50 text-gray-500">
                      <tr>
                        <th className="px-2 py-1">#</th>
                        <th className="px-2 py-1">{t('table.name')}</th>
                        <th className="px-2 py-1">{t('table.email')}</th>
                        <th className="px-2 py-1">{t('table.role')}</th>
                        <th className="px-2 py-1">{t('bulkAdd.status')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {rows.map((r) => (
                        <tr key={r.rowNumber}>
                          <td className="px-2 py-1 text-gray-400">{r.rowNumber}</td>
                          <td className="px-2 py-1">{r.displayName || '—'}</td>
                          <td className="px-2 py-1">{r.email || '—'}</td>
                          <td className="px-2 py-1">{t(`role.${r.role}`)}</td>
                          <td className="px-2 py-1">
                            {r.blockingError ? (
                              <span className="text-red-600">{r.blockingError}</span>
                            ) : r.note ? (
                              <span className="text-amber-600">{r.note}</span>
                            ) : (
                              <span className="text-green-600">OK</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}

        {results && (
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium">
              {t('bulkAdd.resultSummary', { success: successCount, error: errorCount })}
            </p>
            <div className="mb-3 max-h-64 overflow-y-auto rounded border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-2 py-1">{t('table.email')}</th>
                    <th className="px-2 py-1">{t('bulkAdd.status')}</th>
                    <th className="px-2 py-1">{t('bulkAdd.tempPassword')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.map((r) => (
                    <tr key={r.email}>
                      <td className="px-2 py-1">{r.email}</td>
                      <td className="px-2 py-1">
                        {r.error ? <span className="text-red-600">{r.error}</span> : <span className="text-green-600">OK</span>}
                      </td>
                      <td className="px-2 py-1 font-mono">{r.tempPassword ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={handleDownloadResults}
              className="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
            >
              {t('bulkAdd.downloadResults')}
            </button>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
            {results ? t('bulkAdd.done') : t('addUser.cancel')}
          </button>
          {!results && (
            <button
              type="button"
              onClick={handleImport}
              disabled={importing || validRows.length === 0}
              className="rounded bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
            >
              {importing ? '…' : t('bulkAdd.submit', { count: validRows.length })}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
