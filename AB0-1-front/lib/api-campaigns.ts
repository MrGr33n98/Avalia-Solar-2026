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
  audience_filter: Record<string, unknown>;
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

export interface PreflightItem {
  code: string;
  message: string;
}

/** Structured domain error from the Campaign API. */
export class ApiDomainError extends Error {
  readonly code: string;
  readonly blockers: PreflightItem[];

  constructor(code: string, message: string, blockers: PreflightItem[] = []) {
    super(message);
    this.name = 'ApiDomainError';
    this.code = code;
    this.blockers = blockers;
  }

  /** User-friendly message: first blocker message, falling back to this.message */
  get userMessage(): string {
    if (this.blockers.length > 0) {
      return this.blockers.map((b) => b.message).join('; ');
    }
    return this.message;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractBlockers(body: Record<string, unknown>): PreflightItem[] {
  const preflight = body.preflight ?? body.dispatch;
  if (isRecord(preflight) && Array.isArray(preflight.blockers)) {
    return (preflight.blockers as unknown[]).filter(isRecord).map((b) => ({
      code: typeof b.code === 'string' ? b.code : 'UNKNOWN',
      message: typeof b.message === 'string' ? b.message : 'Erro desconhecido',
    }));
  }
  return [];
}

export async function requestApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  options.signal?.addEventListener('abort', abort, { once: true });
  if (options.signal?.aborted) controller.abort();
  const timeout = setTimeout(abort, 20000);
  let res: Response;
  let body: unknown;
  try {
    res = await fetch(`/api/v1/sales${path}`, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...options.headers },
      credentials: 'include',
    });
    if (res.status === 204) return undefined as T;
    try {
      body = await res.json();
    } catch {
      if (!res.ok) throw new ApiDomainError(`HTTP_${res.status}`, `Erro HTTP ${res.status}`);
      throw new ApiDomainError('INVALID_RESPONSE', 'Resposta inválida do servidor. Tente novamente.');
    }
  } catch (error) {
    if (controller.signal.aborted) {
      throw new ApiDomainError('REQUEST_ABORTED', 'Solicitação interrompida ou tempo limite excedido. Tente novamente.');
    }
    if (error instanceof SyntaxError) {
      throw new ApiDomainError('INVALID_RESPONSE', 'Resposta inválida do servidor. Tente novamente.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', abort);
  }

  // Extract domain error from body — may be at root or nested in dispatch/snapshot
  function findDomainError(parsed: Record<string, unknown>): { code: string; message: string; blockers: PreflightItem[] } | null {
    // Root-level error (legacy or direct)
    if (typeof parsed.error === 'string') {
      return {
        code: parsed.error,
        message: typeof parsed.message === 'string' ? parsed.message : parsed.error,
        blockers: extractBlockers(parsed),
      };
    }
    // Nested in dispatch envelope
    const dispatch = parsed.dispatch;
    if (isRecord(dispatch) && typeof dispatch.error === 'string') {
      return {
        code: dispatch.error,
        message: typeof dispatch.message === 'string' ? dispatch.message : dispatch.error,
        blockers: extractBlockers(dispatch),
      };
    }
    // Nested in snapshot envelope
    const snapshot = parsed.snapshot;
    if (isRecord(snapshot) && typeof snapshot.error === 'string') {
      return {
        code: snapshot.error,
        message: typeof snapshot.message === 'string' ? snapshot.message : snapshot.error,
        blockers: extractBlockers(snapshot),
      };
    }
    return null;
  }

  if (!res.ok) {
    if (isRecord(body)) {
      const domainErr = findDomainError(body);
      if (domainErr) {
        throw new ApiDomainError(domainErr.code, domainErr.message, domainErr.blockers);
      }
      throw new ApiDomainError(`HTTP_${res.status}`, `Erro HTTP ${res.status}`);
    }
    throw new Error(`Erro HTTP ${res.status}`);
  }

  // Defensive guard: backend may return 200 with domain error envelope (legacy)
  if (isRecord(body)) {
    const domainErr = findDomainError(body);
    if (domainErr) {
      throw new ApiDomainError(domainErr.code, domainErr.message, domainErr.blockers);
    }
  }

  return body as T;
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
  audience_filter?: Record<string, unknown>;
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

export const cancelCampaign = async (id: number): Promise<{ campaign: CampaignSummary }> => {
  return requestApi<{ campaign: CampaignSummary }>(`/campaigns/${id}/cancel`, {
    method: 'POST',
  });
};

export const fetchPreflight = async (id: number): Promise<{ campaign_id: number; preflight: { ready: boolean; blockers: PreflightItem[]; warnings: PreflightItem[] } }> => {
  return requestApi<{ campaign_id: number; preflight: { ready: boolean; blockers: PreflightItem[]; warnings: PreflightItem[] } }>(`/campaigns/${id}/preflight`, {
    method: 'POST',
  });
};

export const previewAudience = async (
  audienceFilter: Record<string, unknown>,
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


export const fetchCampaignRecipients = async (id: number, params: { page?: number; per_page?: number; status?: string } = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.per_page) query.set('per_page', String(params.per_page));
  if (params.status) query.set('status', params.status);
  return requestApi<{ recipients: CampaignRecipientLog[]; meta: { page: number; per_page: number; total_count: number; total_pages: number } }>(`/campaigns/${id}/recipients?${query}`);
};

export const fetchCampaignActivity = (id: number) => requestApi<{ activity: Array<{ id: number; type: string; occurred_at: string; provider_event_id?: string | null; recipient_id?: number | null }> }>(`/campaigns/${id}/activity`);
