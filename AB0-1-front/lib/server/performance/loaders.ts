import 'server-only';

import { cache } from 'react';
import type { Company, Product, SearchAllResponse } from '@/lib/api';
import { fetchApiPublic, publicCompaniesApi } from '@/lib/api-public';
import { parseQueryParams } from '@/components/filters/query';
import type {
  InitialCompaniesPayload,
  InitialProductsPayload,
  InitialSearchPayload,
} from './types';

/** Anonymous public catalog only. Never pass authenticated cookies or user profile fields. */
const parseObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const takeString = (params: URLSearchParams, key: string, limit = 120): string =>
  (params.get(key) || '').trim().slice(0, limit);
const takeNumber = (params: URLSearchParams, key: string, min = 1, max = 100_000): number => {
  const n = Number(params.get(key));
  return Number.isFinite(n) && n >= min && n <= max ? Math.floor(n) : min;
};
const numericFilter = (params: URLSearchParams, key: string): number | undefined => {
  const raw = params.get(key);
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

/** React.cache deduplicates repeated loader calls in the same RSC request. */
export const loadCompaniesInitial = cache(async (serialized: string): Promise<InitialCompaniesPayload> => {
  const url = new URLSearchParams(serialized);
  const filters = parseQueryParams(url);
  const isMap = url.get('view') === 'map';
  const query = {
    status: 'active',
    page: filters.page || 1,
    per_page: isMap ? 100 : 12,
    q: filters.search || undefined,
    state: filters.state.length ? filters.state : undefined,
    city: filters.city.length ? filters.city : undefined,
    category_ids: filters.category_ids.length ? filters.category_ids : undefined,
    min_rating: filters.min_rating || undefined,
    has_reviews: filters.has_reviews || undefined,
    verified: filters.verified || undefined,
    featured: filters.featured || undefined,
    financing_enabled: filters.financing_enabled || undefined,
    whatsapp_enabled: filters.whatsapp_enabled || undefined,
    sort: filters.sort || undefined,
    latitude: filters.lat || undefined,
    longitude: filters.lng || undefined,
    radius_km: filters.radius_km || undefined,
    fields: isMap ? 'map' : 'card',
  } as const;

  // The cards API already limits payload via fields=card.
  const payload = await fetchApiPublic<unknown>('companies', {
    params: query,
    revalidate: 300,
    tags: ['companies'],
  });
  const record = parseObject(payload);
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(record.data)
      ? record.data
      : Array.isArray(record.companies)
        ? record.companies
        : [];

  return {
    key: JSON.stringify(query),
    response: {
      data: list as Company[],
      meta: record.meta as InitialCompaniesPayload['response']['meta'],
    },
  };
});

export const loadProductsInitial = cache(async (serialized: string): Promise<InitialProductsPayload> => {
  const url = new URLSearchParams(serialized);
  const query = {
    q: takeString(url, 'search') || undefined,
    category_id: numericFilter(url, 'category_id') ?? numericFilter(url, 'category'),
    company_id: numericFilter(url, 'company_id') ?? numericFilter(url, 'company'),
    brand_id: numericFilter(url, 'brand_id'),
    price_min: numericFilter(url, 'price_min') || undefined,
    price_max: numericFilter(url, 'price_max') && numericFilter(url, 'price_max') !== 50000
      ? numericFilter(url, 'price_max')
      : undefined,
    sort: takeString(url, 'sort') && url.get('sort') !== 'relevance' ? takeString(url, 'sort') : undefined,
    page: takeNumber(url, 'page'),
    per_page: 12,
    include_specs: undefined,
  };

  const [rawProducts, rawFilters] = await Promise.all([
    fetchApiPublic<unknown>('products', { params: { ...query, include_specs: false }, revalidate: 300, tags: ['products'] }),
    fetchApiPublic<unknown>('products/filters', { revalidate: 900, tags: ['product-filters'] }),
  ]);

  const productRecord = parseObject(rawProducts);
  const products = Array.isArray(rawProducts) ? rawProducts : Array.isArray(productRecord.data) ? productRecord.data : [];
  const meta = parseObject(productRecord.meta);
  const filters = parseObject(rawFilters);

  return {
    key: JSON.stringify(query),
    response: {
      data: products as Product[],
      meta: {
        total: Number(meta.total ?? products.length),
        page: Number(meta.page ?? query.page),
        per_page: Number(meta.per_page ?? 12),
        total_pages: Number(meta.total_pages ?? 1),
      },
    },
    filters,
  };
});

export const loadSearchInitial = cache(async (serialized: string): Promise<InitialSearchPayload> => {
  const url = new URLSearchParams(serialized);
  const query = takeString(url, 'q');
  const sort = takeString(url, 'sort');
  const apiSort = sort === 'rating' ? 'rating_desc' : (sort === 'relevance' || !sort) ? 'recommended' : sort;
  const page = takeNumber(url, 'page');
  const perPage = takeNumber(url, 'per_page', 1, 100);
  const response = await fetchApiPublic<SearchAllResponse>('search/all', {
    params: {
      q: query,
      ...(takeString(url, 'city') ? { city: takeString(url, 'city') } : {}),
      ...(takeString(url, 'state') ? { state: takeString(url, 'state') } : {}),
      ...(url.get('verified') === 'true' ? { verified: true } : {}),
      ...(takeString(url, 'category') ? { category: takeString(url, 'category') } : {}),
      sort: apiSort,
      page,
      per_page: url.get('per_page') ? perPage : 12,
    },
    revalidate: 120,
    tags: ['search'],
  });

  const firstCompanies = response.companies || [];
  const isVerified = url.get('verified') === 'true';
  const category = takeString(url, 'category');
  const fallback = query && !firstCompanies.length && !isVerified && !category
    ? await publicCompaniesApi.getAll({
        q: query,
        ...(takeString(url, 'city') ? { city: takeString(url, 'city') } : {}),
        ...(takeString(url, 'state') ? { state: takeString(url, 'state') } : {}),
        status: 'active', sort: apiSort, page, limit: url.get('per_page') ? perPage : 12, fields: 'card',
      }, { revalidate: 120, tags: ['companies'] })
    : [];

  const seen = new Set<number | string>();
  const companies = [...firstCompanies, ...fallback].filter((company) => {
    if (seen.has(company.id)) return false;
    seen.add(company.id);
    return true;
  });
  const totalCountRaw = response.counts?.companies ?? (
    typeof response.meta?.total_count === 'object'
      ? response.meta.total_count.companies
      : response.meta?.total_count
  );
  const totalCount = typeof totalCountRaw === 'number' ? totalCountRaw : companies.length;
  const effectivePerPage = url.get('per_page') ? perPage : 12;

  return {
    key: serialized,
    response: { ...response, companies },
    pagination: {
      page,
      total_pages: response.pagination?.total_pages || response.meta?.total_pages ||
        Math.max(1, Math.ceil(totalCount / effectivePerPage)),
      total_count: Math.max(totalCount, companies.length),
    },
  };
});
