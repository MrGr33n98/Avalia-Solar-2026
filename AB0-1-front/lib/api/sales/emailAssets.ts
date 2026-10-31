import { SalesApiError } from './client';
import type { EmailAsset } from '@/components/sales/campaigns/templates/types';

export interface EmailAssetsResponse {
  assets: EmailAsset[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export async function getEmailAssets(params?: {
  kind?: string;
  q?: string;
  status?: string;
  page?: number;
  per_page?: number;
}): Promise<EmailAssetsResponse> {
  const query = new URLSearchParams();
  if (params?.kind && params.kind !== 'all') query.set('kind', params.kind);
  if (params?.q) query.set('q', params.q);
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.per_page) query.set('per_page', String(params.per_page));

  const url = `/api/v1/sales/email_assets${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new SalesApiError(res.status, error.message || 'Falha ao buscar imagens da biblioteca');
  }

  return res.json();
}

export async function uploadEmailAsset(formData: FormData): Promise<EmailAsset> {
  const res = await fetch('/api/v1/sales/email_assets', {
    method: 'POST',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    body: formData,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data.error?.message || data.message || 'Falha ao enviar arquivo de imagem';
    throw new SalesApiError(res.status, message, data.error?.code || 'UPLOAD_FAILED');
  }

  return data.asset;
}

export async function updateEmailAsset(
  id: number,
  payload: { name?: string; alt_text?: string; kind?: string }
): Promise<EmailAsset> {
  const res = await fetch(`/api/v1/sales/email_assets/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ asset: payload }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data.error?.message || data.message || 'Falha ao atualizar imagem';
    throw new SalesApiError(res.status, message);
  }

  return data.asset;
}

export async function deleteEmailAsset(id: number): Promise<void> {
  const res = await fetch(`/api/v1/sales/email_assets/${id}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data.error?.message || data.message || 'Falha ao arquivar imagem';
    throw new SalesApiError(res.status, message, data.error?.code);
  }
}

