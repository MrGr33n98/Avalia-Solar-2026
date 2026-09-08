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
  headers?: string[];
  options: {
    duplicate_strategy?: 'update_blank_fields_only' | 'overwrite_all' | 'skip_duplicates';
  };
  error_summary?: Record<string, any>;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  file_url?: string;
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

export const salesImportsApi = {
  async listImports(page = 1, perPage = 20) {
    const res = await fetch(`/api/v1/sales/imports?page=${page}&per_page=${perPage}`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Falha ao listar importações');
    return res.json() as Promise<{ imports: SalesImport[]; meta: any }>;
  },

  async uploadFile(file: File, entityType = 'lead') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', file.name);
    formData.append('entity_type', entityType);

    const res = await fetch('/api/v1/sales/imports', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Falha ao enviar arquivo de importação');
    }
    return res.json() as Promise<{ import: SalesImport }>;
  },

  async getImport(id: string) {
    const res = await fetch(`/api/v1/sales/imports/${id}`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Falha ao consultar importação');
    return res.json() as Promise<{ import: SalesImport }>;
  },

  async updateMapping(id: string, mapping: Record<string, string>, options: any = {}) {
    const res = await fetch(`/api/v1/sales/imports/${id}/mapping`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ mapping, options }),
    });
    if (!res.ok) throw new Error('Falha ao atualizar mapeamento');
    return res.json() as Promise<{ import: SalesImport }>;
  },

  async commitImport(id: string) {
    const res = await fetch(`/api/v1/sales/imports/${id}/commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Falha ao iniciar processamento');
    return res.json() as Promise<{ import: SalesImport; message: string }>;
  },

  async getRows(id: string, status?: string, page = 1) {
    const statusQuery = status ? `&status=${status}` : '';
    const res = await fetch(`/api/v1/sales/imports/${id}/rows?page=${page}${statusQuery}`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Falha ao buscar linhas');
    return res.json() as Promise<{ rows: SalesImportRow[]; meta: any }>;
  },

  getErrorsCsvUrl(id: string) {
    return `/api/v1/sales/imports/${id}/errors_csv`;
  },
};
