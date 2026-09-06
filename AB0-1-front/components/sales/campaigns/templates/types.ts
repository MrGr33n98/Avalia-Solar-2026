export type TemplateStatus = 'draft' | 'active' | 'archived';

export type BlockType = 'heading' | 'text' | 'image' | 'button' | 'divider' | 'spacer' | 'html';

export interface TemplateBlockProps {
  text?: string;
  level?: 1 | 2 | 3;
  html?: string;
  url?: string;
  src?: string;
  alt?: string;
  label?: string;
  align?: 'left' | 'center' | 'right';
  height?: number;
  code?: string;
}

export interface TemplateBlock {
  id: string;
  type: BlockType;
  props: TemplateBlockProps;
}

export interface TemplateBodyJson {
  version: number;
  settings?: {
    content_width?: number;
  };
  blocks: TemplateBlock[];
}

export interface EmailTemplate {
  id: number;
  name: string;
  subject_template: string;
  preheader?: string | null;
  body_json?: TemplateBodyJson | null;
  body_html?: string | null;
  category?: string | null;
  status: TemplateStatus;
  schema_version: number;
  shared: boolean;
  user_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplatePayload {
  name: string;
  subject_template: string;
  preheader?: string;
  category?: string;
  status?: TemplateStatus;
  private?: boolean;
  body_html?: string;
  body_json?: TemplateBodyJson;
}

export interface TemplateStats {
  total: number;
  active: number;
  draft: number;
  archived: number;
  shared: number;
  in_use: number;
}

export interface VariableItem {
  token: string;
  label: string;
  example?: string;
}

export interface VariableGroup {
  key: string;
  label: string;
  variables: VariableItem[];
}

export interface TemplateListParams {
  page?: number;
  per_page?: number;
  q?: string;
  category?: string;
  status?: string;
  scope?: 'all' | 'mine' | 'shared';
  sort?: 'name' | 'updated_at' | 'created_at' | 'category' | 'status';
  direction?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface TemplateListResponse {
  templates: EmailTemplate[];
  meta: PaginationMeta;
}

export interface TemplatePreviewResult {
  subject: string;
  preheader?: string | null;
  body_html: string;
  body_text?: string;
}

export interface EmailTemplateDraftPayload {
  name?: string;
  subject_template?: string;
  preheader?: string;
  category?: string;
  status?: TemplateStatus;
  body_json?: TemplateBodyJson;
  body_html?: string;
}

export interface EmailTemplatePreviewRequest {
  draft?: EmailTemplateDraftPayload;
  context_ids?: Record<string, number>;
  to_email?: string;
}

export interface EmailTemplatePreviewResponse {
  preview: TemplatePreviewResult;
  context_mode?: 'sample' | 'real';
  warnings?: Array<{ type: string; token: string }>;
}
