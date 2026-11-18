/**
 * Contratos de API para Marcas Utilizadas por Reviewers (Fase F3)
 * Integrado com /api/v1/reviewer/brand_usages
 */

import { fetchApi } from '@/lib/api';
import type { BrandCatalogItem } from './brands';

export type BrandUsageContext =
  | 'personal_owner'
  | 'integrator_install'
  | 'designer_specification'
  | 'maintenance'
  | 'reseller';

export type BrandUsageSource = 'manual' | 'review_form' | 'import_reviewed';

export type BrandUsageVerificationStatus =
  | 'self_declared'
  | 'under_review'
  | 'evidence_verified'
  | 'rejected'
  | 'revoked';

export type BrandUsageVisibility = 'private' | 'public';

export type BrandUsageStatus = 'active' | 'disabled';

export interface ReviewerBrandUsage {
  id: string;
  brand: BrandCatalogItem;
  usage_context: BrandUsageContext;
  usage_context_label: string;
  experience_since: string | null;
  source: BrandUsageSource;
  verification_status: BrandUsageVerificationStatus;
  visibility: BrandUsageVisibility;
  status: BrandUsageStatus;
  description: string | null;
  consent_version: string | null;
  opted_in_at: string | null;
  lock_version: number;
  created_at: string;
  updated_at: string;
}

export interface ReviewerBrandUsagesResponse {
  data: ReviewerBrandUsage[];
  meta: {
    limit: number;
    total: number;
    next_cursor: number | null;
  };
}

export interface ReviewerBrandSummary {
  total_brands: number;
  total_usages: number;
  verified_usages: number;
  public_usages: number;
  by_context: Record<BrandUsageContext, number>;
}

export interface CreateBrandUsagePayload {
  brand_id: number;
  usage_context: BrandUsageContext;
  experience_since?: string;
  description?: string;
  visibility?: BrandUsageVisibility;
  consent_confirmed?: boolean;
  consent_version?: string;
}

export interface UpdateBrandUsagePayload {
  usage_context?: BrandUsageContext;
  experience_since?: string;
  description?: string;
  visibility?: BrandUsageVisibility;
  consent_confirmed?: boolean;
  consent_version?: string;
  lock_version?: number;
}

export interface FetchBrandUsagesOptions {
  status?: BrandUsageStatus;
  limit?: number;
  cursor?: number;
  signal?: AbortSignal;
}

/**
 * Lista marcas utilizadas pelo reviewer autenticado
 */
export async function fetchReviewerBrandUsages(
  options: FetchBrandUsagesOptions = {}
): Promise<ReviewerBrandUsagesResponse> {
  const { status = 'active', limit = 20, cursor, signal } = options;

  const params: Record<string, string | number> = { status };
  if (limit) params.limit = Math.min(Math.max(limit, 1), 50);
  if (cursor) params.cursor = cursor;

  return fetchApi<ReviewerBrandUsagesResponse>('/reviewer/brand_usages', {
    method: 'GET',
    params,
    signal,
  });
}

/**
 * Obtém detalhe de um vínculo de marca do reviewer
 */
export async function fetchReviewerBrandUsageDetails(
  id: string | number,
  signal?: AbortSignal
): Promise<{ data: ReviewerBrandUsage }> {
  return fetchApi<{ data: ReviewerBrandUsage }>(`/reviewer/brand_usages/${id}`, {
    method: 'GET',
    signal,
  });
}

/**
 * Cadastra ou reativa uma marca utilizada pelo reviewer
 */
export async function createReviewerBrandUsage(
  payload: CreateBrandUsagePayload
): Promise<{ data: ReviewerBrandUsage }> {
  return fetchApi<{ data: ReviewerBrandUsage }>('/reviewer/brand_usages', {
    method: 'POST',
    body: { brand_usage: payload },
  });
}

/**
 * Atualiza contexto, experiência ou visibilidade de uma marca do reviewer
 */
export async function updateReviewerBrandUsage(
  id: string | number,
  payload: UpdateBrandUsagePayload
): Promise<{ data: ReviewerBrandUsage }> {
  return fetchApi<{ data: ReviewerBrandUsage }>(`/reviewer/brand_usages/${id}`, {
    method: 'PATCH',
    body: { brand_usage: payload },
  });
}

/**
 * Desativa (soft delete) uma marca utilizada pelo reviewer
 */
export async function deleteReviewerBrandUsage(
  id: string | number
): Promise<void> {
  return fetchApi<void>(`/reviewer/brand_usages/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Retorna contadores reais consolidados de marcas e experiências do reviewer
 */
export async function fetchReviewerBrandSummary(
  signal?: AbortSignal
): Promise<{ data: ReviewerBrandSummary }> {
  return fetchApi<{ data: ReviewerBrandSummary }>('/reviewer/brand_experience_summary', {
    method: 'GET',
    signal,
  });
}
