import {
  ApiAccount,
  ApiAnalytics,
  ApiContact,
  ApiErrorResponse,
  ApiOpportunity,
  ApiPipeline,
  ApiTask,
} from './types';

export class SalesApiError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string[]>;
  requestId?: string;

  constructor(status: number, message: string, code = 'API_ERROR', fields?: Record<string, string[]>, requestId?: string) {
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
    headers: {
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
    let message = errorBody?.error?.message;

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

    const code = errorBody?.error?.code || `HTTP_${response.status}`;
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

  // Opportunities
  async getOpportunities(params?: { status?: string; account_id?: number }): Promise<ApiOpportunity[]> {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.account_id) qs.set('account_id', String(params.account_id));
    const res = await request<{ opportunities: ApiOpportunity[] }>(`/api/v1/sales/opportunities?${qs.toString()}`);
    return res.opportunities ?? [];
  },

  async createOpportunity(payload: {
    sales_account_id: number;
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
  }): Promise<ApiOpportunity> {
    const res = await request<{ opportunity: ApiOpportunity }>('/api/v1/sales/opportunities', {
      method: 'POST',
      body: JSON.stringify({ opportunity: payload }),
    });
    return res.opportunity;
  },

  async updateOpportunityStage(id: number, stageKey: string): Promise<ApiOpportunity> {
    const res = await request<{ opportunity: ApiOpportunity }>(`/api/v1/sales/opportunities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ opportunity: { stage_key: stageKey } }),
    });
    return res.opportunity;
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

  // Accounts
  async getAccounts(query?: string): Promise<ApiAccount[]> {
    const qs = new URLSearchParams();
    if (query) qs.set('q', query);
    const res = await request<{ accounts: ApiAccount[] }>(`/api/v1/sales/accounts?${qs.toString()}`);
    return res.accounts ?? [];
  },

  async createAccount(payload: Partial<ApiAccount>): Promise<ApiAccount> {
    const res = await request<{ account: ApiAccount }>('/api/v1/sales/accounts', {
      method: 'POST',
      body: JSON.stringify({ account: payload }),
    });
    return res.account;
  },

  // Contacts
  async getContacts(params?: { q?: string; sales_account_id?: number }): Promise<ApiContact[]> {
    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    if (params?.sales_account_id) qs.set('sales_account_id', String(params.sales_account_id));
    const res = await request<{ contacts: ApiContact[] }>(`/api/v1/sales/contacts?${qs.toString()}`);
    return res.contacts ?? [];
  },

  async createContact(payload: {
    sales_account_id: number;
    first_name: string;
    last_name?: string;
    email?: string;
    phone?: string;
    job_title?: string;
  }): Promise<ApiContact> {
    const res = await request<{ contact: ApiContact }>('/api/v1/sales/contacts', {
      method: 'POST',
      body: JSON.stringify({ contact: payload }),
    });
    return res.contact;
  },

  // Analytics
  async getAnalytics(period = 'this_month'): Promise<ApiAnalytics> {
    return request<ApiAnalytics>(`/api/v1/sales/analytics?period=${period}`);
  },
};
