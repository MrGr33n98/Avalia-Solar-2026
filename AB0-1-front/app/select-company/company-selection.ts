import type { CompanyAccessSuggestedCompany, CompanySelectionApiResponse } from '@/lib/api';

export const normalizeCompanySelection = (
  company: CompanySelectionApiResponse
): CompanyAccessSuggestedCompany => ({
  company_id: company.id,
  company_name: company.name,
  company_slug: company.slug ?? undefined,
  city: company.city ?? undefined,
  state: company.state ?? undefined,
  verified: Boolean(company.verified),
  logo_url: company.logo_url ?? null,
  rating: company.rating_avg ?? null,
});

export const normalizeCompanySelectionList = (
  companies: CompanySelectionApiResponse[]
): CompanyAccessSuggestedCompany[] => companies.map(normalizeCompanySelection);
