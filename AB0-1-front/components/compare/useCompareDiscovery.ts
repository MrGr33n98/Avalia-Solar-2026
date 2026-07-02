'use client';

import { useQuery } from '@tanstack/react-query';
import { api, type Company } from '@/lib/api';
import type { CompareCompany } from './mapCompanyToCompareCompany';

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
      const requests: Array<Promise<Company[]>> = [
        fetchCompanies({ status: 'active', sort: 'recommended', limit: 30 }),
      ];
      if (categoryIds.length > 0) {
        requests.push(
          fetchCompanies({
            status: 'active',
            sort: 'recommended',
            category_ids: categoryIds.join(','),
            limit: 30,
          })
        );
      }
      if (normalizedCity) {
        requests.push(
          fetchCompanies({
            status: 'active',
            sort: 'recommended',
            city: normalizedCity,
            limit: 30,
          })
        );
      }

      const results = await Promise.allSettled(requests);
      const successful = results.filter(
        (result): result is PromiseFulfilledResult<Company[]> => result.status === 'fulfilled'
      );
      if (successful.length === 0) throw new Error('Não foi possível carregar recomendações.');

      return Array.from(
        new Map(
          successful.flatMap((result) => result.value).map((company) => [company.id, company])
        ).values()
      );
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
