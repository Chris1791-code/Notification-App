export type UserRole = 'admin' | 'editor' | 'student' | 'staff';

export interface AppUser {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  department?: string;
  program?: string;
  major?: string;
  cohort?: string;
  locale?: 'vi' | 'en';
  expoPushTokens?: string[];
}

export interface TargetFilter {
  departments?: string[];
  programs?: string[];
  majors?: string[];
  cohorts?: string[];
  roles?: UserRole[];
}

export interface Category {
  id: string;
  key: string;
  nameVi: string;
  nameEn: string;
  icon?: string;
  order: number;
}

export type NotificationStatus = 'draft' | 'scheduled' | 'published' | 'revoked';
export type NotificationPriority = 'normal' | 'urgent';

export interface Attachment {
  name: string;
  url: string;
  size: number;
  contentType: string;
}

export interface AppNotification {
  id: string;
  titleVi: string;
  titleEn?: string;
  bodyVi: string;
  bodyEn?: string;
  categoryId: string;
  status: NotificationStatus;
  priority: NotificationPriority;
  targetFilter: TargetFilter;
  attachments: Attachment[];
  publishAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  translationStatus: {
    en: 'missing' | 'draft' | 'reviewed';
  };
}
