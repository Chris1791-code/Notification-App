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
  attachments: Attachment[];
  publishAt: string | null;
  updatedAt: string;
}
