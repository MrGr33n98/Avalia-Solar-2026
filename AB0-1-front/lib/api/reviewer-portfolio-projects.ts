/**
 * Contratos de API para Projetos e Experiência do Reviewer (Fase PR6)
 * Integrado com /api/v1/reviewer/portfolio_projects
 */

import { fetchApi } from '@/lib/api';

export type PortfolioProjectType =
  | 'residential'
  | 'commercial'
  | 'rural'
  | 'industrial'
  | 'ev_charging'
  | 'bess_storage';

export interface ProjectBrandItem {
  id: string;
  brand_id: number;
  brand_name: string;
  brand_slug: string;
  initials: string;
  logo_url: string | null;
}

export interface ReviewerPortfolioProject {
  id: string;
  title: string;
  project_type: PortfolioProjectType;
  project_type_label: string;
  city: string | null;
  state: string | null;
  started_at: string | null;
  completed_at: string | null;
  capacity_kwp: number | null;
  visibility: 'private' | 'public';
  verification_status: 'self_declared' | 'under_review' | 'evidence_verified' | 'rejected';
  status: 'draft' | 'active' | 'disabled';
  description: string | null;
  lock_version: number;
  brands: ProjectBrandItem[];
  created_at: string;
  updated_at: string;
}

export interface ReviewerProjectSummary {
  total_projects: number;
  total_capacity_kwp: number;
  verified_projects: number;
  public_projects: number;
  by_type: Record<PortfolioProjectType, number>;
}

export interface FetchProjectsParams {
  status?: string;
  project_type?: string;
  limit?: number;
  offset?: number;
}

export interface CreateProjectPayload {
  title: string;
  project_type: PortfolioProjectType;
  city?: string;
  state?: string;
  started_at?: string;
  completed_at?: string;
  capacity_kwp?: number;
  visibility?: 'private' | 'public';
  description?: string;
  brand_usage_ids?: string[];
  consent_confirmed?: boolean;
  consent_version?: string;
}

export interface UpdateProjectPayload {
  title?: string;
  project_type?: PortfolioProjectType;
  city?: string;
  state?: string;
  started_at?: string;
  completed_at?: string;
  capacity_kwp?: number;
  visibility?: 'private' | 'public';
  description?: string;
  brand_usage_ids?: string[];
  consent_confirmed?: boolean;
  consent_version?: string;
  lock_version: number;
}

export async function fetchReviewerProjects(params?: FetchProjectsParams) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.project_type) query.set('project_type', params.project_type);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));

  const endpoint = `/reviewer/portfolio_projects${query.toString() ? `?${query.toString()}` : ''}`;
  return fetchApi<{ data: ReviewerPortfolioProject[]; meta: { total: number; limit: number; offset: number } }>(endpoint);
}

export async function fetchReviewerProjectSummary() {
  return fetchApi<{ data: ReviewerProjectSummary }>('/reviewer/portfolio_projects/summary');
}

export async function createReviewerProject(payload: CreateProjectPayload) {
  const { brand_usage_ids, consent_confirmed, consent_version, ...project } = payload;
  return fetchApi<{ data: ReviewerPortfolioProject }>('/reviewer/portfolio_projects', {
    method: 'POST',
    body: JSON.stringify({
      project,
      brand_usage_ids,
      consent_confirmed,
      consent_version,
    }),
  });
}

export async function updateReviewerProject(id: string, payload: UpdateProjectPayload) {
  const { brand_usage_ids, consent_confirmed, consent_version, ...project } = payload;
  return fetchApi<{ data: ReviewerPortfolioProject }>(`/reviewer/portfolio_projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      project,
      brand_usage_ids,
      consent_confirmed,
      consent_version,
    }),
  });
}

export async function deleteReviewerProject(id: string) {
  return fetchApi<void>(`/reviewer/portfolio_projects/${id}`, {
    method: 'DELETE',
  });
}
