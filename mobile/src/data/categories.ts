import type { Category } from '@/types';

/**
 * Khung danh mục gợi ý, đồng bộ với web/src/lib/categories.ts — cần đối chiếu
 * với danh mục chính thức của HCMUT trước khi dùng trong môi trường thật.
 */
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'academic', key: 'academic', nameVi: 'Đào tạo', nameEn: 'Academic Affairs', order: 1 },
  { id: 'exams', key: 'exams', nameVi: 'Khảo thí & ĐBCL', nameEn: 'Examinations & QA', order: 2 },
  { id: 'student-affairs', key: 'student-affairs', nameVi: 'Công tác sinh viên', nameEn: 'Student Affairs', order: 3 },
  { id: 'finance', key: 'finance', nameVi: 'Tài chính - Học phí', nameEn: 'Finance & Tuition', order: 4 },
  { id: 'admissions', key: 'admissions', nameVi: 'Tuyển sinh', nameEn: 'Admissions', order: 5 },
  { id: 'graduate', key: 'graduate', nameVi: 'Sau đại học', nameEn: 'Graduate Studies', order: 6 },
  { id: 'international', key: 'international', nameVi: 'Hợp tác quốc tế', nameEn: 'International Programs', order: 7 },
  { id: 'student-union', key: 'student-union', nameVi: 'Đoàn - Hội - CLB', nameEn: 'Student Union & Clubs', order: 8 },
  { id: 'dormitory', key: 'dormitory', nameVi: 'Ký túc xá', nameEn: 'Dormitory', order: 9 },
  { id: 'research', key: 'research', nameVi: 'Nghiên cứu khoa học', nameEn: 'Research', order: 10 },
  { id: 'career', key: 'career', nameVi: 'Việc làm - Thực tập', nameEn: 'Career & Internships', order: 11 },
  { id: 'library', key: 'library', nameVi: 'Thư viện', nameEn: 'Library', order: 12 },
  { id: 'health', key: 'health', nameVi: 'Y tế - Bảo hiểm', nameEn: 'Health & Insurance', order: 13 },
  { id: 'facilities', key: 'facilities', nameVi: 'Cơ sở vật chất', nameEn: 'Facilities', order: 14 },
  { id: 'emergency', key: 'emergency', nameVi: 'Khẩn cấp', nameEn: 'Emergency', order: 15 }
];
