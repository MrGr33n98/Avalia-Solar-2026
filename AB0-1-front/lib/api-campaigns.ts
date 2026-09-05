export interface CampaignSummary {
  id: number;
  name: string;
  campaign_key: string;
  campaign_type: 'email_broadcast' | 'sequence' | 'drip' | 'event_triggered';
  status: 'draft' | 'scheduled' | 'dispatching' | 'paused' | 'completed' | 'cancelled';
  active: boolean;
  total_recipients: number;
  processed_recipients: number;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  unsubscribed_count: number;
  revenue_attributed_cents: number;
  scheduled_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  email_template_id?: number | null;
  template_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignDetailed extends CampaignSummary {
  audience_filter: Record<string, any>;
  user_name?: string;
}

export interface CampaignMetrics {
  total_recipients: number;
  processed_recipients: number;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  unsubscribed_count: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
  attributed_revenue_cents: number;
  attributed_revenue_formatted: number;
}

export interface CampaignRecipientLog {
  id: number;
  email: string;
  first_name?: string | null;
  status: 'pending' | 'queued' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'unsubscribed';
  error_message?: string | null;
  sent_at?: string | null;
  delivered_at?: string | null;
  opened_at?: string | null;
  clicked_at?: string | null;
}

export interface AudiencePreviewResult {
  total_count: number;
  page: number;
  per_page: number;
  total_pages: number;
  sample_contacts: Array<{
    id: number;
    first_name: string;
    last_name?: string | null;
    email: string;
    job_title?: string | null;
    account_name?: string | null;
    city?: string | null;
    state?: string | null;
  }>;
}

export interface AudienceSegmentsOptions {
  states: string[];
  cities: string[];
  company_types: string[];
  tags: Array<{ id: number; name: string; color?: string | null }>;
}

async function requestApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/v1/sales${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include',
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.message || `Erro HTTP ${res.status}`);
  }

  return res.json();
}

export const fetchCampaigns = async (params: {
  page?: number;
  per_page?: number;
  status?: string;
  campaign_type?: string;
  q?: string;
}): Promise<{ campaigns: CampaignSummary[]; meta: { page: number; total_count: number; total_pages: number } }> => {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.per_page) query.set('per_page', String(params.per_page));
  if (params.status) query.set('status', params.status);
  if (params.campaign_type) query.set('campaign_type', params.campaign_type);
  if (params.q) query.set('q', params.q);

  return requestApi<{ campaigns: CampaignSummary[]; meta: { page: number; total_count: number; total_pages: number } }>(
    `/campaigns?${query.toString()}`
  );
};

export const fetchCampaign = async (
  id: number
): Promise<{ campaign: CampaignDetailed; metrics: CampaignMetrics; recipients: CampaignRecipientLog[] }> => {
  return requestApi<{ campaign: CampaignDetailed; metrics: CampaignMetrics; recipients: CampaignRecipientLog[] }>(
    `/campaigns/${id}`
  );
};

export const createCampaign = async (payload: {
  name: string;
  campaign_type?: string;
  email_template_id?: number | null;
  scheduled_at?: string | null;
  audience_filter?: Record<string, any>;
}): Promise<{ campaign: CampaignSummary }> => {
  return requestApi<{ campaign: CampaignSummary }>('/campaigns', {
    method: 'POST',
    body: JSON.stringify({ campaign: payload }),
  });
};

export const snapshotCampaign = async (id: number): Promise<{ campaign: CampaignSummary; snapshot: { recipients_count: number } }> => {
  return requestApi<{ campaign: CampaignSummary; snapshot: { recipients_count: number } }>(`/campaigns/${id}/snapshot`, {
    method: 'POST',
  });
};

export const dispatchCampaign = async (id: number): Promise<{ campaign: CampaignSummary }> => {
  return requestApi<{ campaign: CampaignSummary }>(`/campaigns/${id}/dispatch`, {
    method: 'POST',
  });
};

export const pauseCampaign = async (id: number): Promise<{ campaign: CampaignSummary }> => {
  return requestApi<{ campaign: CampaignSummary }>(`/campaigns/${id}/pause`, {
    method: 'POST',
  });
};

export const resumeCampaign = async (id: number): Promise<{ campaign: CampaignSummary }> => {
  return requestApi<{ campaign: CampaignSummary }>(`/campaigns/${id}/resume`, {
    method: 'POST',
  });
};

export const retryFailedCampaign = async (id: number): Promise<{ campaign: CampaignSummary }> => {
  return requestApi<{ campaign: CampaignSummary }>(`/campaigns/${id}/retry_failed`, {
    method: 'POST',
  });
};

export const previewAudience = async (
  audienceFilter: Record<string, any>,
  page = 1,
  per_page = 20
): Promise<AudiencePreviewResult> => {
  return requestApi<AudiencePreviewResult>('/audiences/preview', {
    method: 'POST',
    body: JSON.stringify({ audience_filter: audienceFilter, page, per_page }),
  });
};

export const fetchAudienceSegments = async (): Promise<AudienceSegmentsOptions> => {
  return requestApi<AudienceSegmentsOptions>('/audiences/segments');
};
