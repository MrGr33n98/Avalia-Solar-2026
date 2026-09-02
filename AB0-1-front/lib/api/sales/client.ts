import { ApiAccount, ApiAnalytics, ApiContact, ApiErrorResponse, ApiOpportunity, ApiTask } from './types';

export class SalesApiError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string[]>;

  constructor(status: number, message: string, code = 'API_ERROR', fields?: Record<string, string[]>) {
    super(message);
    this.name = 'SalesApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
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

  let data: any = {};
  try {
    data = await response.json();
  } catch {
    // Empty body or non-JSON
  }

  if (!response.ok) {
    const errorBody: ApiErrorResponse = data;
    const message =
      errorBody?.error?.message ||
      (errorBody?.error?.fields ? Object.values(errorBody.error.fields).flat().join('; ') : null) ||
      `Erro na requisição (${response.status})`;

    const code = errorBody?.error?.code || `HTTP_${response.status}`;
    const fields = errorBody?.error?.fields;

    throw new SalesApiError(response.status, message, code, fields);
  }

  return data as T;
}

export const salesApi = {
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
    name: string;
    stage_key?: string;
    value_cents?: number;
    probability?: number;
    expected_close_date?: string;
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

  // Analytics
  async getAnalytics(period = 'this_month'): Promise<ApiAnalytics> {
    return request<ApiAnalytics>(`/api/v1/sales/analytics?period=${period}`);
  },
};
