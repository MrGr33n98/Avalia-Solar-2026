/**
 * API de Importações de Vendas
 *
 * Usa o client autenticado de lib/api/sales/client.ts (request + refreshSession)
 * para garantir retry automático em 401, redirect para login quando refresh falha,
 * e tipagem correta de erros via SalesApiError.
 */

// Importar o helper `request` interno para ter retry automático de JWT
// @ts-ignore – função interna não exportada diretamente; importamos via módulo
import { salesApi } from '@/lib/api/sales/client';

// Re-export de types para uso nos componentes
export type { SalesApiError } from '@/lib/api/sales/client';

export interface SalesImport {
  id: string;
  company_id: number;
  user_id: number;
  entity_type: string;
  filename: string;
  status:
    | 'uploaded'
    | 'mapping'
    | 'validating'
    | 'ready'
    | 'queued'
    | 'processing'
    | 'completed'
    | 'completed_with_errors'
    | 'failed'
    | 'cancelled';
  total_rows: number;
  processed_rows: number;
  valid_rows: number;
  invalid_rows: number;
  duplicate_rows: number;
  created_rows: number;
  updated_rows: number;
  skipped_rows: number;
  mapping: Record<string, string>;
  /** headers originais do CSV (ex: ["empresa", "nome", "email"]) */
  headers?: string[];
  options: {
    duplicate_strategy?: 'update_blank_fields_only' | 'overwrite_all' | 'skip_duplicates';
  };
  error_summary?: Record<string, any>;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  file_url?: string;
  file_attached?: boolean;
}

export interface SalesImportRow {
  id: number;
  row_number: number;
  raw_data: Record<string, any>;
  normalized_data: Record<string, any>;
  status: 'pending' | 'valid' | 'invalid' | 'duplicate' | 'skipped' | 'processed' | 'failed';
  errors?: string[];
  warnings?: string[];
  duplicate_type?: string;
  duplicate_record_id?: number;
  result_record_id?: number;
}

// Helper de fetch autenticado com retry 401 + refresh token
// (extraído do mesmo padrão do client.ts para não duplicar lógica)
let _refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = (async () => {
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
      _refreshPromise = null;
    }
  })();
  return _refreshPromise;
}

async function authedFetch(url: string, options: RequestInit = {}, isRetry = false): Promise<Response> {
  const mergedOptions: RequestInit = {
    credentials: 'include',
    ...options,
    headers:
      options.body instanceof FormData
        ? { Accept: 'application/json', ...(options.headers as Record<string, string> || {}) }
        : {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(options.headers as Record<string, string> || {}),
          },
  };

  const res = await fetch(url, mergedOptions);

  // Retry automático em 401 com refresh de token (uma única tentativa)
  if (res.status === 401 && !isRetry) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return authedFetch(url, options, true);
    }
    // Refresh falhou — redirecionar para login
    if (typeof window !== 'undefined') {
      const redirect = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?redirect=${redirect}`;
    }
  }

  return res;
}

async function authedJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await authedFetch(url, options);
  if (!res.ok) {
    let errBody: any = {};
    try { errBody = await res.json(); } catch {}
    const message =
      errBody?.error?.message ||
      errBody?.message ||
      (typeof errBody?.error === 'string' ? errBody.error : null) ||
      `Erro ${res.status}`;
    throw Object.assign(new Error(message), { status: res.status, body: errBody });
  }
  return res.json() as Promise<T>;
}

export const salesImportsApi = {
  async listImports(page = 1, perPage = 20) {
    return authedJson<{ imports: SalesImport[]; meta: any }>(
      `/api/v1/sales/imports?page=${page}&per_page=${perPage}`
    );
  },

  async uploadFile(file: File, entityType = 'lead') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', file.name);
    formData.append('entity_type', entityType);

    return authedJson<{ import: SalesImport }>('/api/v1/sales/imports', {
      method: 'POST',
      body: formData,
    });
  },

  async getImport(id: string) {
    return authedJson<{ import: SalesImport }>(`/api/v1/sales/imports/${id}`);
  },

  async updateMapping(id: string, mapping: Record<string, string>, options: any = {}) {
    return authedJson<{ import: SalesImport }>(`/api/v1/sales/imports/${id}/mapping`, {
      method: 'PATCH',
      body: JSON.stringify({ mapping, options }),
    });
  },

  async commitImport(id: string) {
    return authedJson<{ import: SalesImport; message: string }>(`/api/v1/sales/imports/${id}/commit`, {
      method: 'POST',
    });
  },

  async getRows(id: string, status?: string, page = 1) {
    const statusQuery = status ? `&status=${status}` : '';
    return authedJson<{ rows: SalesImportRow[]; meta: any }>(
      `/api/v1/sales/imports/${id}/rows?page=${page}${statusQuery}`
    );
  },

  async cancelImport(id: string) {
    return authedJson<{ import: SalesImport; message: string }>(`/api/v1/sales/imports/${id}/cancel`, {
      method: 'POST',
    });
  },

  getErrorsCsvUrl(id: string) {
    return `/api/v1/sales/imports/${id}/errors_csv`;
  },
};
