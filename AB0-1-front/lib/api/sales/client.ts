import {
  ApiAccount,
  ApiAnalytics,
  ApiContact,
  ApiErrorResponse,
  ApiOpportunity,
  ApiPipeline,
  ApiSavedView,
  ApiTag,
  ApiTask,
} from './types';

export class SalesApiError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string[]>;
  requestId?: string;

  constructor(
    status: number,
    message: string,
    code = 'API_ERROR',
    fields?: Record<string, string[]>,
    requestId?: string
  ) {
    super(message);
    this.name = 'SalesApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.requestId = requestId;
  }
}

// Single-promise deduplication for auth refresh
let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function handleAuthRedirect() {
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname + window.location.search;
    window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
  }
}

async function request<T>(url: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers:
      options.body instanceof FormData
        ? { Accept: 'application/json', ...options.headers }
        : {
            ...defaultHeaders,
            ...options.headers,
          },
  });

  if (response.status === 204) {
    return {} as T;
  }

  // Handle 401 Unauthorized with Refresh Token Retry once
  if (response.status === 401 && !isRetry) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return request<T>(url, options, true);
    } else {
      handleAuthRedirect();
      throw new SalesApiError(401, 'Sessão expirada. Faça login novamente.', 'UNAUTHORIZED');
    }
  }

  let data: any = {};
  try {
    data = await response.json();
  } catch {
    // Empty body or non-JSON
  }

  if (!response.ok) {
    const errorBody: ApiErrorResponse = data;
    let message = typeof data?.error === 'string' ? data.error : errorBody?.error?.message;

    if (!message && errorBody?.error?.fields) {
      message = Object.values(errorBody.error.fields).flat().join('; ');
    }

    if (response.status === 403) {
      message = message || 'Você não possui permissão para esta operação.';
    } else if (response.status === 401) {
      message = message || 'Sessão não autorizada.';
    } else {
      message = message || `Erro na requisição (${response.status}).`;
    }

    const code = (typeof data?.error === 'object' ? data?.error?.code : data?.code) || `HTTP_${response.status}`;
    const fields = errorBody?.error?.fields;
    const requestId = errorBody?.error?.request_id;

    throw new SalesApiError(response.status, message, code, fields, requestId);
  }

  return data as T;
}

export const salesApi = {
  // Pipelines & Stages
  async getPipelines(): Promise<ApiPipeline[]> {
    const res = await request<{ pipelines: ApiPipeline[] }>('/api/v1/sales/pipelines');
    return res.pipelines ?? [];
  },

  async getSavedViews(
    resourceType: ApiSavedView['resource_type'] = 'opportunity'
  ): Promise<ApiSavedView[]> {
    const res = await request<{ saved_views: ApiSavedView[] }>(
      `/api/v1/sales/saved_views?resource_type=${resourceType}`
    );
    return res.saved_views ?? [];
  },

  async createSavedView(
    payload: Pick<ApiSavedView, 'name' | 'resource_type' | 'filters' | 'sort' | 'columns'>
  ): Promise<ApiSavedView> {
    const res = await request<{ saved_view: ApiSavedView }>('/api/v1/sales/saved_views', {
      method: 'POST',
      body: JSON.stringify({ saved_view: payload }),
    });
    return res.saved_view;
  },

  async deleteSavedView(id: number): Promise<void> {
    await request(`/api/v1/sales/saved_views/${id}`, { method: 'DELETE' });
  },

  async pinSavedView(id: number, pinned: boolean): Promise<ApiSavedView> {
    const res = await request<{ saved_view: ApiSavedView }>(`/api/v1/sales/saved_views/${id}/pin`, {
      method: 'POST',
      body: JSON.stringify({ pinned }),
    });
    return res.saved_view;
  },

  async getTags(entityType = 'Opportunity'): Promise<ApiTag[]> {
    const res = await request<{ tags: ApiTag[] }>(`/api/v1/sales/tags?entity_type=${entityType}`);
    return res.tags ?? [];
  },

  async createTag(
    payload: Pick<ApiTag, 'name' | 'color' | 'entity_type'> & { description?: string }
  ): Promise<ApiTag> {
    const res = await request<{ tag: ApiTag }>('/api/v1/sales/tags', {
      method: 'POST',
      body: JSON.stringify({ tag: payload }),
    });
    return res.tag;
  },

  async archiveTag(id: number): Promise<void> {
    await request(`/api/v1/sales/tags/${id}`, { method: 'DELETE' });
  },

  async applyTag(
    id: number,
    taggableType: 'Opportunity' | 'Account' | 'Contact',
    recordId: number
  ): Promise<void> {
    await request(`/api/v1/sales/tags/${id}/apply`, {
      method: 'POST',
      body: JSON.stringify({ taggable_type: taggableType, taggable_id: recordId }),
    });
  },

  async removeTag(
    id: number,
    taggableType: 'Opportunity' | 'Account' | 'Contact',
    recordId: number
  ): Promise<void> {
    await request(`/api/v1/sales/tags/${id}/remove`, {
      method: 'DELETE',
      body: JSON.stringify({ taggable_type: taggableType, taggable_id: recordId }),
    });
  },

  // Leads & Opportunities
  async getLeads(params?: any): Promise<ApiOpportunity[]> {
    const qs = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') qs.set(key, Array.isArray(value) ? value.join(',') : String(value));
    });
    const res = await request<{ leads?: ApiOpportunity[]; opportunities?: ApiOpportunity[] }>(`/api/v1/sales/leads?${qs.toString()}`);
    return res.leads ?? res.opportunities ?? [];
  },

  async createLead(payload: any): Promise<ApiOpportunity> {
    const res = await request<{ lead?: ApiOpportunity; opportunity?: ApiOpportunity }>('/api/v1/sales/leads', {
      method: 'POST',
      body: JSON.stringify({ lead: payload }),
    });
    return (res.lead || res.opportunity)!;
  },

  async getSources(): Promise<Array<{ id: number; name: string; slug: string }>> {
    const res = await request<{ sources: Array<{ id: number; name: string; slug: string }> }>('/api/v1/sales/sources');
    return res.sources ?? [];
  },

  async getCompetitors(): Promise<Array<{ id: number; name: string; website?: string }>> {
    const res = await request<{ competitors: Array<{ id: number; name: string; website?: string }> }>('/api/v1/sales/competitors');
    return res.competitors ?? [];
  },

  async createCompetitor(payload: { name: string; website?: string }): Promise<{ id: number; name: string; website?: string }> {
    const res = await request<{ competitor: { id: number; name: string; website?: string } }>('/api/v1/sales/competitors', {
      method: 'POST',
      body: JSON.stringify({ competitor: payload }),
    });
    return res.competitor;
  },

  async getOpportunities(params?: {
    q?: string;
    status?: string;
    account_id?: number;
    pipeline_id?: number;
    stage_id?: number | number[];
    stage_key?: string;
    owner_id?: number | 'unassigned';
    value_min?: number;
    value_max?: number;
    close_from?: string;
    close_to?: string;
    sort?: string;
    direction?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
  }): Promise<ApiOpportunity[]> {
    const qs = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '')
        qs.set(key, Array.isArray(value) ? value.join(',') : String(value));
    });
    const res = await request<{ opportunities: ApiOpportunity[] }>(
      `/api/v1/sales/opportunities?${qs.toString()}`
    );
    return res.opportunities ?? [];
  },

  async createOpportunity(payload: {
    sales_account_id?: number | null;
    primary_contact_id?: number | null;
    sales_pipeline_id?: number | null;
    name: string;
    stage_key?: string;
    value_cents?: number;
    currency?: string;
    probability?: number;
    expected_close_date?: string;
    priority?: string;
    source?: string;
    account?: { name: string; domain?: string } | null;
    contact?: { first_name: string; email?: string } | null;
  }): Promise<ApiOpportunity> {
    const { account, contact, ...oppPayload } = payload;
    const bodyObj: any = { opportunity: oppPayload };
    if (account) bodyObj.account = account;
    if (contact) bodyObj.contact = contact;

    const res = await request<{ opportunity: ApiOpportunity }>('/api/v1/sales/opportunities', {
      method: 'POST',
      body: JSON.stringify(bodyObj),
    });
    return res.opportunity;
  },

  async bulkUpdateOpportunities(
    ids: number[],
    action: 'status' | 'owner' | 'stage' | 'tag' | 'remove_tag',
    value: string | number
  ): Promise<void> {
    await request('/api/v1/sales/opportunities/bulk', {
      method: 'POST',
      body: JSON.stringify({ ids, action, value }),
    });
  },

  async updateOpportunityStage(id: number, stageKey: string): Promise<ApiOpportunity> {
    const res = await request<{ opportunity: ApiOpportunity }>(
      `/api/v1/sales/opportunities/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ opportunity: { stage_key: stageKey } }),
      }
    );
    return res.opportunity;
  },

  async getOpportunity(id: number): Promise<ApiOpportunity> {
    const res = await request<{ opportunity: ApiOpportunity }>(`/api/v1/sales/opportunities/${id}`);
    return res.opportunity;
  },

  async getOpportunityTimeline(id: number): Promise<any[]> {
    const res = await request<{ timeline: any[] }>(`/api/v1/sales/opportunities/${id}/timeline`);
    return res.timeline ?? [];
  },

  async markOpportunityWon(id: number): Promise<void> {
    await request(`/api/v1/sales/opportunities/${id}/won`, { method: 'POST' });
  },

  async markOpportunityLost(id: number, reason?: string): Promise<void> {
    await request(`/api/v1/sales/opportunities/${id}/lost`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Tasks
  async getTasks(params?: { status?: string; q?: string }): Promise<ApiTask[]> {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.q) qs.set('q', params.q);
    const res = await request<{ tasks: ApiTask[] }>(`/api/v1/sales/tasks?${qs.toString()}`);
    return res.tasks ?? [];
  },

  async createTask(payload: {
    title: string;
    task_type: string;
    priority: string;
    due_at?: string | null;
    description?: string | null;
    sales_account_id?: number | null;
    sales_opportunity_id?: number | null;
  }): Promise<ApiTask> {
    const res = await request<{ task: ApiTask }>('/api/v1/sales/tasks', {
      method: 'POST',
      body: JSON.stringify({ task: payload }),
    });
    return res.task;
  },

  async updateTask(id: number, payload: Partial<ApiTask>): Promise<ApiTask> {
    const res = await request<{ task: ApiTask }>(`/api/v1/sales/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ task: payload }),
    });
    return res.task;
  },

  // Activities / Notes
  async createActivity(payload: {
    activity_type: string;
    subject: string;
    body?: string;
    description?: string;
    occurred_at?: string;
    sales_account_id?: number;
    sales_contact_id?: number;
    sales_opportunity_id?: number;
  }): Promise<void> {
    await request('/api/v1/sales/activities', {
      method: 'POST',
      body: JSON.stringify({ activity: payload }),
    });
  },

  // Accounts
  async getAccounts(
    params?: string | { q?: string; options?: boolean; limit?: number }
  ): Promise<ApiAccount[]> {
    const qs = new URLSearchParams();
    if (typeof params === 'string') {
      if (params) qs.set('q', params);
    } else if (params) {
      if (params.q) qs.set('q', params.q);
      if (params.options) qs.set('options', 'true');
      if (params.limit) qs.set('limit', String(params.limit));
    }
    const res = await request<{ accounts: ApiAccount[] }>(
      `/api/v1/sales/accounts?${qs.toString()}`
    );
    return res.accounts ?? [];
  },

  async createAccount(payload: Partial<ApiAccount> & { primary_contact?: any }): Promise<ApiAccount> {
    const { primary_contact, ...accountFields } = payload;
    const res = await request<{ account: ApiAccount }>('/api/v1/sales/accounts', {
      method: 'POST',
      body: JSON.stringify({ account: accountFields, primary_contact }),
    });
    return res.account;
  },

  // Contacts
  async getContacts(params?: {
    q?: string;
    sales_account_id?: number | string;
    options?: boolean;
    limit?: number;
  }): Promise<ApiContact[]> {
    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    if (params?.sales_account_id) qs.set('sales_account_id', String(params.sales_account_id));
    if (params?.options) qs.set('options', 'true');
    if (params?.limit) qs.set('limit', String(params.limit));
    const res = await request<{ contacts: ApiContact[] }>(
      `/api/v1/sales/contacts?${qs.toString()}`
    );
    return res.contacts ?? [];
  },

  async createContact(payload: {
    sales_account_id?: number | null;
    company_name?: string;
    first_name: string;
    last_name?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    job_title?: string;
    decision_role?: string;
  }): Promise<ApiContact> {
    const res = await request<{ contact: ApiContact }>('/api/v1/sales/contacts', {
      method: 'POST',
      body: JSON.stringify({ contact: payload }),
    });
    return res.contact;
  },

  // Analytics
  async getAnalytics(period = '30d'): Promise<ApiAnalytics> {
    const res = await request<ApiAnalytics>(`/api/v1/sales/analytics?period=${period}`);
    return res;
  },

  async getEmailTemplates(): Promise<any[]> {
    const res = await request<{ templates: any[] }>('/api/v1/sales/email_templates');
    return res.templates ?? [];
  },

  async createEmailTemplate(payload: {
    name: string;
    subject_template: string;
    body_html?: string;
    body_json?: Record<string, unknown>;
    category?: string;
    private?: boolean;
  }): Promise<any> {
    const res = await request<{ template: any }>('/api/v1/sales/email_templates', {
      method: 'POST',
      body: JSON.stringify({ template: payload }),
    });
    return res.template;
  },

  async previewEmailTemplate(id: number, context: Record<string, unknown> = {}): Promise<any> {
    const res = await request<{ preview: any }>(`/api/v1/sales/email_templates/${id}/preview`, {
      method: 'POST',
      body: JSON.stringify({ context }),
    });
    return res.preview;
  },

  async sendEmail(payload: {
    to_email: string;
    subject: string;
    body_text?: string;
    body_html?: string;
    body_json?: Record<string, unknown>;
    sales_contact_id?: number;
    sales_account_id?: number;
    sales_opportunity_id?: number;
    cc?: string[];
    bcc?: string[];
    open_tracking_enabled?: boolean;
    click_tracking_enabled?: boolean;
    attachments?: File[];
  }): Promise<{ message: string; email: any }> {
    const { attachments, ...fields } = payload;
    const body = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      if (Array.isArray(value)) value.forEach((item) => body.append(`email[${key}][]`, item));
      else if (value !== undefined && value !== null)
        body.append(`email[${key}]`, key === 'body_json' ? JSON.stringify(value) : String(value));
    });
    attachments?.forEach((file) => body.append('email[attachments][]', file));
    const res = await request<{ message: string; email: any }>('/api/v1/sales/emails', {
      method: 'POST',
      body: attachments?.length ? body : JSON.stringify({ email: fields }),
    });
    return res;
  },
};
