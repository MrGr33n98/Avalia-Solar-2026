import type { Company } from '@/lib/api';

export const COMPARE_COMPANY_LOGO_FALLBACK = '/images/logo-placeholder.svg';

type NullableCompany = Partial<Company> & {
  is_verified?: boolean | null;
  logo?: string | null;
};

export type CompareCompany = Company & {
  rating: number;
  reviewsCount: number;
  verified: boolean;
  logoUrl: string;
};

const finiteNumber = (value: unknown): number => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

/** Normaliza exclusivamente os dados usados em /compare. */
export function mapCompanyToCompareCompany(
  company: NullableCompany | null | undefined
): CompareCompany {
  const source = company ?? {};
  const rating = finiteNumber(source.rating || source.average_rating || source.rating_avg || 0);
  const reviewsCount = finiteNumber(
    source.reviews_count || source.rating_count || source.total_reviews || 0
  );
  const verified = Boolean(source.verified || source.is_verified || false);
  const logoUrl = source.logo_url || source.logo || COMPARE_COMPANY_LOGO_FALLBACK;

  return {
    ...source,
    id: finiteNumber(source.id),
    slug: source.slug || String(source.id || ''),
    name: source.name || 'Empresa sem nome',
    city: source.city || '',
    state: source.state || '',
    status: source.status || '',
    category: source.category || source.category_name || '',
    description: source.description || source.about || '',
    website: source.website || '',
    phone: source.phone || '',
    address: source.address || '',
    created_at: source.created_at || '',
    updated_at: source.updated_at || '',
    rating,
    average_rating: finiteNumber(source.average_rating || source.rating_avg || source.rating || 0),
    rating_avg: finiteNumber(source.rating_avg || source.average_rating || source.rating || 0),
    reviews_count: reviewsCount,
    rating_count: reviewsCount,
    verified,
    logo_url: logoUrl,
    logoUrl,
    reviewsCount,
  };
}
