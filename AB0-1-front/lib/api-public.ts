import { ApiError, toApiError } from './api-error';
import { buildApiUrl, getApiRequestHeaders } from './api-config';
import type { Banner, Category, Company, Review } from './api';
import type { LocalSolarPageResponse } from './api-client';

type QueryValue =
  | string
  | number
  | boolean
  | Array<string | number | boolean>
  | null
  | undefined;

type PublicFetchOptions<TFallback = undefined> = {
  params?: Record<string, QueryValue>;
  revalidate?: number;
  tags?: string[];
  fallback?: TFallback;
  silent?: boolean;
  timeoutMs?: number;
};

export type RecommendationReason = {
  code: string;
  label: string;
};

export type RecommendationItem = {
  id: number;
  name: string;
  slug?: string | null;
  logo_url?: string | null;
  segment?: string | null;
  comparable_group?: string | null;
  verified?: boolean | null;
  sponsored?: boolean | null;
  recommendation_reason?: RecommendationReason | null;
  coverage?: {
    type?: string | null;
    label?: string | null;
  } | null;
  rating?: {
    average?: number | null;
    count?: number | null;
    label?: string | null;
  } | null;
  response_time?: {
    value?: string | null;
    label?: string | null;
  } | null;
  projects?: {
    count?: number | null;
    label?: string | null;
  } | null;
  primary_cta?: {
    type?: string | null;
    label?: string | null;
    action?: string | null;
    url?: string | null;
  } | null;
  secondary_cta?: {
    type?: string | null;
    label?: string | null;
    action?: string | null;
    url?: string | null;
  } | null;
  comparison?: {
    enabled?: boolean | null;
    group?: string | null;
  } | null;
  ranking?: {
    position?: number | null;
    organic_score?: number | null;
    sponsored?: boolean | null;
  } | null;
};

export type RecommendationMeta = {
  request_id?: string | null;
  recommendation_version?: string | null;
  generated_at?: string | null;
  location?: {
    city?: string | null;
    state?: string | null;
    source?: string | null;
    confidence?: number | null;
  } | null;
  filters?: {
    category_slug?: string | null;
    segment?: string | null;
  } | null;
  slots?: {
    total?: number | null;
    organic_count?: number | null;
    sponsored_count?: number | null;
  } | null;
};

export type RecommendationResponse = {
  meta?: RecommendationMeta | null;
  data: RecommendationItem[];
};

const DEFAULT_PUBLIC_REVALIDATE_SECONDS = 600;
const DEFAULT_PUBLIC_API_TIMEOUT_MS = 8_000;

const getPublicApiTimeoutMs = (timeoutMs?: number) => {
  if (Number.isFinite(timeoutMs) && (timeoutMs || 0) > 0) return timeoutMs as number;

  const envTimeout = Number(process.env.PUBLIC_API_TIMEOUT_MS);
  return Number.isFinite(envTimeout) && envTimeout >= 1_000
    ? envTimeout
    : DEFAULT_PUBLIC_API_TIMEOUT_MS;
};

type PublicCompanyListParams = {
  status?: string;
  featured?: boolean;
  category_id?: number;
  category_ids?: number[];
  limit?: number;
  include?: string;
  sort?: string;
  q?: string;
  state?: string[] | string;
  city?: string[] | string;
  serves_state?: string[] | string;
  serves_city?: string[] | string;
  min_rating?: number;
  verified?: boolean;
  page?: number;
  per_page?: number;
  fields?: 'card';
};

const buildPublicQueryParams = (params: Record<string, QueryValue> = {}) => {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== '') {
          queryParams.append(`${key}[]`, String(item));
        }
      });
      return;
    }

    queryParams.append(key, String(value));
  });

  const query = queryParams.toString();
  return query ? `?${query}` : '';
};

const appendParams = (endpoint: string, params?: Record<string, QueryValue>) => {
  const query = buildPublicQueryParams(params);
  if (!query) return endpoint;
  return `${endpoint}${endpoint.includes('?') ? '&' : '?'}${query.slice(1)}`;
};

const unwrapArray = <T>(payload: unknown, key: string): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  const record = toRecord(payload);
  if (record) {
    const data = record.data;
    const keyed = record[key];
    if (Array.isArray(data)) return data as T[];
    if (Array.isArray(keyed)) return keyed as T[];
  }
  return [];
};

const toRecord = (payload: unknown): Record<string, unknown> | null =>
  payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;

const getRecordArray = <T>(record: Record<string, unknown>, key: string): T[] | null => {
  const value = record[key];
  return Array.isArray(value) ? (value as T[]) : null;
};

const getRecordValue = (record: Record<string, unknown>, key: string) => record[key];

export async function fetchApiPublic<T, TFallback = undefined>(
  endpoint: string,
  options: PublicFetchOptions<TFallback> = {}
): Promise<T | TFallback> {
  const endpointWithParams = appendParams(endpoint, options.params);
  const url = buildApiUrl(endpointWithParams);
  const revalidate = options.revalidate ?? DEFAULT_PUBLIC_REVALIDATE_SECONDS;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getPublicApiTimeoutMs(options.timeoutMs));

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getApiRequestHeaders(),
      credentials: 'omit',
      signal: controller.signal,
      next: {
        revalidate,
        ...(options.tags ? { tags: options.tags } : {}),
      },
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const message = payload?.error || payload?.message || response.statusText || 'API Error';
      throw new ApiError(`[${response.status}] ${message}`, {
        status: response.status,
        url,
        method: 'GET',
        details: payload,
      });
    }

    return payload as T;
  } catch (error) {
    if (options.fallback !== undefined) {
      if (!options.silent) {
        console.warn(`[Public API] Using fallback for ${url}:`, error);
      }
      return options.fallback;
    }

    const apiError = toApiError(error, {
      url,
      method: 'GET',
      isNetworkError: error instanceof TypeError,
    });

    if (!options.silent) {
      console.error(`[Public API] Failed to fetch ${url}:`, apiError);
    }

    throw apiError;
  } finally {
    clearTimeout(timeout);
  }
}

export const publicCompaniesApi = {
  getAll: async (
    params?: PublicCompanyListParams,
    options?: PublicFetchOptions<Company[]>
  ): Promise<Company[]> => {
    const payload = await fetchApiPublic<unknown, Company[]>('companies', {
      params,
      revalidate: options?.revalidate,
      tags: options?.tags || ['companies'],
      fallback: options?.fallback || [],
      silent: options?.silent,
    });
    return unwrapArray<Company>(payload, 'companies');
  },

  getAllPaginated: async (
    params?: PublicCompanyListParams,
    options?: PublicFetchOptions<{ data: Company[]; meta?: { pagination?: unknown } }>
  ): Promise<{ data: Company[]; meta?: { pagination?: unknown } }> => {
    const payload = await fetchApiPublic<unknown, { data: Company[]; meta?: { pagination?: unknown } }>(
      'companies',
      {
        params,
        revalidate: options?.revalidate,
        tags: options?.tags || ['companies'],
        fallback: options?.fallback || { data: [] },
        silent: options?.silent,
      }
    );

    const record = toRecord(payload);
    const data = record ? getRecordArray<Company>(record, 'data') : null;
    if (record && data) {
      return {
        data,
        meta: getRecordValue(record, 'meta') as { pagination?: unknown } | undefined,
      };
    }

    if (Array.isArray(payload)) return { data: payload as Company[] };
    const companies = record ? getRecordArray<Company>(record, 'companies') : null;
    if (record && companies) {
      return {
        data: companies,
        meta: getRecordValue(record, 'meta') as { pagination?: unknown } | undefined,
      };
    }

    return { data: [] };
  },

  getRecommendations: async (
    params?: { city?: string; state?: string; category_slug?: string; segment?: string; limit?: number },
    options?: PublicFetchOptions<RecommendationResponse>
  ): Promise<RecommendationResponse> => {
    const payload = await fetchApiPublic<unknown, RecommendationResponse>('recommendations', {
      params,
      revalidate: options?.revalidate ?? 120,
      tags: options?.tags || ['recommendations'],
      fallback: options?.fallback || { data: [] },
      silent: options?.silent,
    });
    return (payload as RecommendationResponse) || { data: [] };
  },

  getTotalCount: async (params?: PublicCompanyListParams) => {
    const response = await publicCompaniesApi.getAllPaginated(
      {
        ...(params || {}),
        page: 1,
        per_page: 1,
      },
      { revalidate: 600, silent: true }
    );

    const meta = toRecord(response.meta);
    const pagination = toRecord(meta?.pagination);
    const total = Number(pagination?.total ?? meta?.total);
    return Number.isFinite(total) && total >= 0 ? total : null;
  },

  getById: async (id: number | string, options?: PublicFetchOptions<Company | null>) => {
    const encoded = encodeURIComponent(String(id));
    const slugCandidate = typeof id === 'string' && !/^\d+$/.test(id);

    const payload = await fetchApiPublic<unknown, null>(`companies/${encoded}`, {
      revalidate: options?.revalidate,
      tags: options?.tags || [`company-${encoded}`, 'companies'],
      fallback: null,
      silent: true,
    });

    const record = toRecord(payload);
    if (record) {
      const company = getRecordValue(record, 'company');
      if (company) return company as Company;
      if (getRecordValue(record, 'id')) return payload as Company;
    }

    if (!slugCandidate) return options?.fallback ?? null;
    return publicCompaniesApi.getBySlug(String(id), options);
  },

  getBySlug: async (slug: string, options?: PublicFetchOptions<Company | null>) => {
    const encoded = encodeURIComponent(slug);
    const payload = await fetchApiPublic<unknown, null>(`companies/by_slug/${encoded}`, {
      revalidate: options?.revalidate,
      tags: options?.tags || [`company-${encoded}`, 'companies'],
      fallback: null,
      silent: options?.silent ?? true,
    });

    const record = toRecord(payload);
    if (record) {
      const company = getRecordValue(record, 'company');
      if (company) return company as Company;
      if (getRecordValue(record, 'id')) return payload as Company;
    }

    return options?.fallback ?? null;
  },
};

export const publicReviewsApi = {
  getAll: async (
    params?: { limit?: number; company_id?: number },
    options?: PublicFetchOptions<Review[]>
  ): Promise<Review[]> => {
    const payload = await fetchApiPublic<unknown, Review[]>('reviews', {
      params,
      revalidate: options?.revalidate,
      tags: options?.tags || ['reviews'],
      fallback: options?.fallback || [],
      silent: options?.silent,
    });
    return unwrapArray<Review>(payload, 'reviews');
  },
};

export const publicCategoriesApi = {
  getAll: async (
    params?: { status?: string; featured?: boolean; category_id?: number; limit?: number; include_subcategories?: boolean },
    options?: PublicFetchOptions<Category[]>
  ): Promise<Category[]> => {
    const payload = await fetchApiPublic<unknown, Category[]>('categories', {
      params,
      revalidate: options?.revalidate ?? 3600,
      tags: options?.tags || ['categories'],
      fallback: options?.fallback || [],
      silent: options?.silent,
    });
    return unwrapArray<Category>(payload, 'categories');
  },

  getBySlug: async (slug: string, options?: PublicFetchOptions<Category | null>) => {
    const encoded = encodeURIComponent(slug);
    const payload = await fetchApiPublic<unknown, null>(`categories/by_slug/${encoded}`, {
      revalidate: options?.revalidate ?? 3600,
      tags: options?.tags || [`category-${encoded}`, 'categories'],
      fallback: null,
      silent: options?.silent ?? true,
    });

    const record = toRecord(payload);
    if (record) {
      const category = getRecordValue(record, 'category');
      if (category) return category as Category;
      if (getRecordValue(record, 'id')) return payload as Category;
    }

    return options?.fallback ?? null;
  },

  getCompaniesPaginated: async (
    id: number,
    params?: Record<string, QueryValue>,
    options?: PublicFetchOptions<{ companies: Company[]; meta: unknown | null }>
  ): Promise<{ companies: Company[]; meta: unknown | null }> => {
    const payload = await fetchApiPublic<unknown, { companies: Company[]; meta: unknown | null }>(
      `categories/${id}/companies`,
      {
        params,
        revalidate: options?.revalidate ?? 600,
        tags: options?.tags || [`category-${id}`, 'companies'],
        fallback: options?.fallback || { companies: [], meta: null },
        silent: options?.silent,
      }
    );

    if (Array.isArray(payload)) return { companies: payload as Company[], meta: null };
    const record = toRecord(payload);
    if (record) {
      const meta = toRecord(getRecordValue(record, 'meta'));
      const pagination = meta ? getRecordValue(meta, 'pagination') : undefined;
      return {
        companies: getRecordArray<Company>(record, 'companies') || [],
        meta: pagination || meta || null,
      };
    }

    return { companies: [], meta: null };
  },

  getBanners: async (
    id: number,
    params?: Record<string, QueryValue>,
    options?: PublicFetchOptions<Banner[]>
  ): Promise<Banner[]> => {
    const payload = await fetchApiPublic<unknown, Banner[]>(`categories/${id}/banners`, {
      params,
      revalidate: options?.revalidate ?? 600,
      tags: options?.tags || [`category-${id}`, 'banners'],
      fallback: options?.fallback || [],
      silent: options?.silent,
    });
    return unwrapArray<Banner>(payload, 'banners');
  },
};

export const publicBannersApi = {
  getByPosition: async (
    position: string,
    options?: PublicFetchOptions<Banner[]>
  ): Promise<Banner[]> => {
    const payload = await fetchApiPublic<unknown, Banner[]>('banners', {
      params: { position },
      revalidate: options?.revalidate ?? 600,
      tags: options?.tags || ['banners'],
      fallback: options?.fallback || [],
      silent: options?.silent,
    });
    return unwrapArray<Banner>(payload, 'banners');
  },
};

export const publicLocalSolarPagesApi = {
  get: async (
    state: string,
    city?: string | null,
    params?: {
      vertical?: string;
      q?: string;
      category_ids?: number[] | string[] | string;
      project_types?: string[] | string;
      featured?: boolean | string;
      verified?: boolean | string;
      min_rating?: number | string;
      sort?: string;
      page?: number | string;
      per_page?: number | string;
    },
    options?: PublicFetchOptions<LocalSolarPageResponse | null>
  ): Promise<LocalSolarPageResponse | null> => {
    const endpoint = city
      ? `local_solar_pages/${encodeURIComponent(state)}/${encodeURIComponent(city)}`
      : `local_solar_pages/${encodeURIComponent(state)}`;

    return fetchApiPublic<LocalSolarPageResponse, null>(endpoint, {
      params,
      revalidate: options?.revalidate ?? 900,
      tags: options?.tags || [`local-solar-${state}`, 'local-solar-pages'],
      fallback: null,
      silent: options?.silent ?? true,
    });
  },
};
