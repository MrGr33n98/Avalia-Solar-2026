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
  categoryIds: number[];
  categoryNames: string[];
  recommendationRate: number | null;
  premium: boolean;
  sponsored: boolean;
  verificationStatus: string | null;
  cnpjVerified: boolean | null;
  documentsVerified: boolean | null;
  addressVerified: boolean | null;
  respondsToReviews: boolean | null;
  slaMinutes: number | null;
  responseTimeLabel: string | null;
  freeQuoteAvailable: boolean | null;
  whatsappAvailable: boolean | null;
  coverageCities: string[];
  coverageStates: string[];
  deliveredProjects: number | null;
  warrantyYears: number | null;
  postSalesSupport: boolean | null;
  paymentMethods: string[];
  specialties: {
    residentialSolar: boolean | null;
    commercialSolar: boolean | null;
    electricMobility: boolean | null;
    wallbox: boolean | null;
    batteryStorage: boolean | null;
  };
};

const finiteNumber = (value: unknown): number => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const optionalNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const stringList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }
  if (typeof value !== 'string') return [];
  return value.split(',').map((item) => item.trim()).filter(Boolean);
};

const optionalMatch = (haystack: string, expressions: RegExp[]): boolean | null => {
  if (!haystack) return null;
  return expressions.some((expression) => expression.test(haystack));
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
  const categoryIds = Array.from(
    new Set([
      ...(source.category_ids || []),
      ...(source.categories || []).map((category) => category.id),
      ...(source.category_id ? [source.category_id] : []),
    ])
  );
  const categoryNames = Array.from(
    new Set(
      [
        source.primary_category,
        source.category_name,
        source.category,
        source.category_info?.name,
        ...(source.categories || []).map((category) => category.name),
      ].filter((value): value is string => Boolean(value?.trim()))
    )
  );
  const verificationStatus =
    source.trust?.verification_status || source.business_verification_status || null;
  const verificationMethod =
    source.trust?.verification_method || source.business_verification_method || '';
  const isBusinessVerified = verificationStatus === 'verified' || verified;
  const normalizedVerificationMethod = verificationMethod.toLowerCase();
  const serviceText = [
    ...(source.services_offered || []),
    ...(source.services || []),
    ...(source.project_types || []),
    ...categoryNames,
  ]
    .join(' ')
    .toLowerCase();
  const coverageCities = Array.from(
    new Set([...stringList(source.coverage?.cities), ...stringList(source.coverage_cities)])
  );
  const coverageStates = Array.from(
    new Set([...stringList(source.coverage?.states), ...stringList(source.coverage_states)])
  );
  const whatsappFlag =
    source.actions?.whatsapp_enabled ??
    source.cta_whatsapp_enabled ??
    (source.whatsapp || source.cta_whatsapp_url ? true : undefined);

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
    categoryIds,
    categoryNames,
    recommendationRate: optionalNumber(
      source.reputation?.recommendation_rate ?? source.recommendation_rate
    ),
    premium: Boolean(source.featured || source.has_paid_plan || source.plan_status === 'active'),
    sponsored: Boolean(source.sponsored),
    verificationStatus,
    cnpjVerified: normalizedVerificationMethod.includes('cnpj') ? isBusinessVerified : null,
    documentsVerified: /document|documento/.test(normalizedVerificationMethod)
      ? isBusinessVerified
      : null,
    addressVerified: null,
    respondsToReviews: null,
    slaMinutes: optionalNumber(source.operations?.sla_minutes ?? source.response_sla_minutes),
    responseTimeLabel:
      source.operations?.sla_label || source.response_time_sla || null,
    freeQuoteAvailable: null,
    whatsappAvailable: whatsappFlag === undefined ? null : Boolean(whatsappFlag),
    coverageCities,
    coverageStates,
    deliveredProjects: optionalNumber(
      source.operations?.delivered_projects ??
        source.delivered_projects_count ??
        source.delivered_projects_score
    ),
    warrantyYears: optionalNumber(
      source.operations?.warranty_years ??
        source.warranty_years ??
        source.installation_warranty_years
    ),
    postSalesSupport:
      source.post_sales_support === null || source.post_sales_support === undefined
        ? null
        : Boolean(source.post_sales_support),
    paymentMethods: stringList(source.payment_methods),
    specialties: {
      residentialSolar: optionalMatch(serviceText, [/solar residencial/, /residencial/]),
      commercialSolar: optionalMatch(serviceText, [/solar comercial/, /comercial/]),
      electricMobility: optionalMatch(serviceText, [/mobilidade/, /elétric/, /eletric/]),
      wallbox: optionalMatch(serviceText, [/wallbox/, /carregador/]),
      batteryStorage: optionalMatch(serviceText, [/bateria/, /armazenamento/, /storage/]),
    },
  };
}
