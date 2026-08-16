import type { Company, CompanyAccessSuggestedCompany } from '@/lib/api';

export type CompanySelectionApiResponse = Pick<
  Company,
  'id' | 'name' | 'slug' | 'city' | 'state' | 'verified' | 'logo_url' | 'rating_avg'
>;

export const normalizeCompanySelection = (
  company: CompanySelectionApiResponse
): CompanyAccessSuggestedCompany => ({
  company_id: company.id,
  company_name: company.name,
  company_slug: company.slug,
  city: company.city,
  state: company.state,
  verified: company.verified,
  logo_url: company.logo_url ?? null,
  rating: company.rating_avg ?? null,
});

export const normalizeCompanySelectionList = (
  companies: CompanySelectionApiResponse[]
): CompanyAccessSuggestedCompany[] => companies.map(normalizeCompanySelection);
