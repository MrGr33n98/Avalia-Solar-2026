/**
 * Contrato de Catálogo de Fabricantes (Brands) — Fase F1
 * Integrado com GET /api/v1/brands
 */

import { fetchApi } from '@/lib/api';

export interface BrandCatalogItem {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  logo_alt: string;
  initials: string;
  status: 'active' | 'disabled' | 'archived';
}

export interface BrandCatalogResponse {
  data: BrandCatalogItem[];
  meta: {
    limit: number;
    total: number;
    next_cursor: number | null;
  };
}

export interface FetchBrandCatalogOptions {
  q?: string;
  limit?: number;
  cursor?: number;
  signal?: AbortSignal;
}

/**
 * Busca fabricantes no catálogo público / rate-limited
 */
export async function fetchBrandCatalog(
  options: FetchBrandCatalogOptions = {}
): Promise<BrandCatalogResponse> {
  const { q, limit = 20, cursor, signal } = options;

  const params: Record<string, string | number> = {};
  if (q && q.trim().length > 0) {
    params.q = q.trim();
  }
  if (limit) {
    params.limit = Math.min(Math.max(limit, 1), 50);
  }
  if (cursor) {
    params.cursor = cursor;
  }

  return fetchApi<BrandCatalogResponse>('/brands', {
    method: 'GET',
    params,
    signal,
  });
}

/**
 * Obtém detalhes de um fabricante específico por ID ou slug
 */
export async function fetchBrandDetails(
  idOrSlug: string | number,
  signal?: AbortSignal
): Promise<{ data: BrandCatalogItem }> {
  return fetchApi<{ data: BrandCatalogItem }>(`/brands/${idOrSlug}`, {
    method: 'GET',
    signal,
  });
}
