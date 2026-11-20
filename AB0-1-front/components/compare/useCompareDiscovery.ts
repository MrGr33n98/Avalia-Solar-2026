'use client';

import { useQuery } from '@tanstack/react-query';
import { api, type Company } from '@/lib/api';
import type { CompareCompany } from './mapCompanyToCompareCompany';
import { COMPARE_CANDIDATE_POOL_LIMIT, COMPARE_RECOMMENDATION_LIMIT } from '@/lib/comparison/config';

type CompaniesPayload = Company[] | { data?: Company[]; companies?: Company[] };

const unwrapCompanies = (payload: CompaniesPayload): Company[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.companies)) return payload.companies;
  return [];
};

async function fetchCompanies(params: Record<string, string | number>): Promise<Company[]> {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => search.set(key, String(value)));
  const response = await api.request<CompaniesPayload>({
    url: `/companies?${search.toString()}`,
    method: 'GET',
  });
  return unwrapCompanies(response.data);
}

export function useRecommendedCompanyCandidates(
  selectedCompanies: CompareCompany[],
  city?: string | null
) {
  const categoryIds = Array.from(
    new Set(selectedCompanies.flatMap((company) => company.categoryIds))
  ).sort((a, b) => a - b);
  const normalizedCity = city?.trim() || '';

  return useQuery<Company[]>({
    queryKey: ['compare-recommendations', categoryIds, normalizedCity],
    queryFn: async () => {
      const baseParams: Record<string, string | number> = {
        status: 'active',
        sort: 'recommended',
        limit: COMPARE_CANDIDATE_POOL_LIMIT,
      };
      const hasContext = categoryIds.length > 0 || Boolean(normalizedCity);
      if (!hasContext) return fetchCompanies(baseParams);

      const contextualParams = { ...baseParams };
      if (categoryIds.length > 0) contextualParams.category_ids = categoryIds.join(',');
      if (normalizedCity) contextualParams.city = normalizedCity;

      let contextual: Company[] = [];
      try {
        contextual = await fetchCompanies(contextualParams);
        if (contextual.length >= COMPARE_RECOMMENDATION_LIMIT) return contextual;
      } catch {
        // Try global public candidates if contextual discovery fails.
      }

      try {
        const general = await fetchCompanies(baseParams);
        const unique = new Map<number, Company>();
        [...contextual, ...general].forEach((company) => {
          if (!unique.has(company.id)) unique.set(company.id, company);
        });
        return [...unique.values()];
      } catch (error) {
        // Preserve contextual discoveries when the fallback network request fails.
        if (contextual.length > 0) return contextual;
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useCompareCompanySearch(query: string, selectedIds: number[]) {
  const normalizedQuery = query.trim();
  return useQuery<Company[]>({
    queryKey: ['compare-company-search', normalizedQuery],
    queryFn: () =>
      fetchCompanies({ status: 'active', q: normalizedQuery, sort: 'recommended', limit: 8 }),
    enabled: normalizedQuery.length >= 2,
    select: (companies) => companies.filter((company) => !selectedIds.includes(company.id)),
    staleTime: 2 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
