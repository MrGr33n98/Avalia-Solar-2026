export type PublicationStatus = 'draft' | 'published' | 'archived';
export type PublicationType = 'article' | 'case_study' | 'tip' | 'project';
export type PublicationAttachment = {
  id: string | number;
  filename: string;
  content_type: string;
  byte_size: number;
  url: string;
};
export type ReviewerPublication = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  body: string;
  status: PublicationStatus;
  publication_type: PublicationType;
  category?: string;
  comments_enabled: boolean;
  lead_capture_enabled: boolean;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
  cover_image?: PublicationAttachment | null;
  attachments: PublicationAttachment[];
  metrics?: { views: number; comments: number; leads: number };
};
export type PublicationListResponse = {
  items: ReviewerPublication[];
  summary: Record<string, number>;
};
