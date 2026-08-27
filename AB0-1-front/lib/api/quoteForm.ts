import { fetchApi } from '@/lib/api';

export interface QuoteFormDraft {
  id?: number;
  version_number?: number;
  updated_at?: string;
  ui_config: Record<string, unknown>;
  steps: Array<{ id: string; title: string; fields: Array<Record<string, any>> }>;
  thank_you_config: { title: string; message: string };
}

export interface QuoteFormStudioResponse {
  company?: { id: number; name: string; logo_url?: string | null };
  entitlement?: { can_customize?: boolean; can_publish?: boolean; level?: string };
  permissions?: { can_view?: boolean; can_edit?: boolean; can_publish?: boolean };
  draft?: QuoteFormDraft | null;
  published?: { id?: number; version_number?: number; published_at?: string } | null;
}

const base = (companyId: number | string) => `/companies/${companyId}/quote_form`;

export const quoteFormApi = {
  studio: (companyId: number | string) => fetchApi<QuoteFormStudioResponse>(base(companyId)),
  save: (companyId: number | string, body: Record<string, unknown>) =>
    fetchApi<{ draft: QuoteFormDraft; saved_at: string }>(base(companyId), {
      method: 'PATCH', body: JSON.stringify(body),
    }),
  publish: (companyId: number | string) =>
    fetchApi<{ published: QuoteFormStudioResponse['published'] }>(`${base(companyId)}/publish`, {
      method: 'POST', body: JSON.stringify({}),
    }),
};
