import type { Company } from '@/lib/api';

// Public /companies response from the Rails `fields=card` endpoint.
export interface InitialCompaniesPage {
  data: Company[];
  meta?: { pagination?: unknown };
}

// The API contract remains the source of truth for card fields; this is a
// projection boundary, not permission to remove CTA or ranking entitlements.
// Additional public DTOs must be verified against actual render consumers.
export type PublicCompanyCard = Company;
