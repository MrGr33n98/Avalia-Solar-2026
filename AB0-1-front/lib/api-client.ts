// =======================
// api-client.ts
// =======================

import {
  CampaignReviewProject,
  Category,
  Company,
  CompanyCatalogResponse,
  FinancingOption,
  Product,
  ProductReviewsResponse,
  Review,
  SocialProofReview,
  Banner,
  FinancialInstitution,
} from './api';
import { buildApiUrl, getApiRequestHeaders } from './api-config';
import { getAttribution, getCurrentUTMs } from './analytics/utm';
import { ApiError, toApiError } from './api-error';
import { refreshAuthSession } from './api';

// Re-export types so they can be imported from api-client
export type {
  CampaignReviewProject,
  Category,
  Company,
  CompanyCatalogResponse,
  FinancingOption,
  Product,
  ProductReviewsResponse,
  Review,
  SocialProofReview,
  Banner,
  FinancialInstitution,
};

export interface LocalSolarCategory {
  id: number;
  name: string;
  seo_url?: string | null;
  companies_count: number;
}

export interface LocalSolarProjectType {
  name: string;
  companies_count: number;
}

export interface LocalSolarLocation {
  scope: 'state' | 'city';
  state: string;
  state_name: string;
  city?: string | null;
  city_slug?: string | null;
  canonical_path: string;
}

export interface LocalSolarPageResponse {
  location: LocalSolarLocation;
  seo: {
    title: string;
    description: string;
    indexable: boolean;
  };
  stats: {
    total_companies: number;
    verified_companies: number;
    featured_companies: number;
    sponsored_companies: number;
    generated_at: string;
  };
  categories: LocalSolarCategory[];
  project_types?: LocalSolarProjectType[];
  featured_companies: Company[];
  companies: Company[];
  nearby_locations: Array<{
    state: string;
    city: string;
    href: string;
    companies_count: number;
  }>;
  filters: {
    q?: string;
    category_ids?: number[];
    project_types?: string[];
    featured?: string;
    verified?: string;
    min_rating?: string;
    sort?: string;
  };
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    first_page: boolean;
    last_page: boolean;
    prev_page?: number | null;
    next_page?: number | null;
  };
}

const SAFE_API_CACHE = new Map<string, { expiresAt: number; data: unknown }>();
const SAFE_API_IN_FLIGHT = new Map<string, Promise<unknown>>();
const SAFE_API_DEFAULT_TTL_MS = 5 * 60 * 1000;
const SAFE_API_MAX_RETRIES = 3;
const SAFE_API_RATE_LIMIT_BLOCK_MS = 3_000; // Reduced from 15s to 3s
const SAFE_API_NETWORK_BLOCK_MS = 2_000; // Reduced from 5s to 2s
const SAFE_API_BLOCKED_UNTIL = new Map<string, number>();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isPublicCacheableEndpoint = (endpoint: string) =>
  /^(categories|companies|local_solar_pages|products|states|banners)/i.test(
    endpoint.replace(/^\/+/, '')
  );

// Utility functions to manage rate limiting
export const clearRateLimitBlock = (endpoint?: string) => {
  if (endpoint) {
    SAFE_API_BLOCKED_UNTIL.delete(`GET:${endpoint}`);
    console.log(`[API] Cleared rate limit block for: ${endpoint}`);
  } else {
    SAFE_API_BLOCKED_UNTIL.clear();
    console.log('[API] Cleared all rate limit blocks');
  }
};

export const getRateLimitStatus = () => {
  const blocked: Array<{ endpoint: string; until: Date }> = [];
  SAFE_API_BLOCKED_UNTIL.forEach((until, key) => {
    if (until > Date.now()) {
      blocked.push({ endpoint: key, until: new Date(until) });
    }
  });
  return blocked;
};

// ------------------
// ConfiguraÃ§Ã£o
// ------------------
// Use internal Docker network URL for server-side requests, browser URL for client-side
// FunÃ§Ã£o auxiliar para montar query params como sufixo seguro
const buildQueryParams = (params: Record<string, any>) => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((v) => {
          if (v !== undefined && v !== null) {
            queryParams.append(`${key}[]`, v.toString());
          }
        });
      } else {
        queryParams.append(key, value.toString());
      }
    }
  });
  const qs = queryParams.toString();
  return qs ? `?${qs}` : '';
};

// ------------------
// FunÃ§Ã£o genÃ©rica com fetch seguro (SSR friendly)
// ------------------
export async function fetchApiSafe<T>(endpoint: string, options: any = {}): Promise<T> {
  const url = buildApiUrl(endpoint);
  const requestOptions: any = { ...options };
  const normalizedEndpoint = endpoint.replace(/^\//, '');
  const method = (requestOptions.method || 'GET').toString().toUpperCase();
  const maxRetries = Number.isFinite(requestOptions.retries)
    ? Number(requestOptions.retries)
    : SAFE_API_MAX_RETRIES;
  const cacheTtlMs = Number.isFinite(requestOptions.cacheTtlMs)
    ? Number(requestOptions.cacheTtlMs)
    : SAFE_API_DEFAULT_TTL_MS;
  const shouldUseCache =
    method === 'GET' &&
    cacheTtlMs > 0 &&
    requestOptions.noCache !== true &&
    isPublicCacheableEndpoint(normalizedEndpoint);
  const cacheKey = `${method}:${url}`;
  const throttleKey = `${method}:${normalizedEndpoint}`;
  const blockedUntil = SAFE_API_BLOCKED_UNTIL.get(throttleKey) || 0;
  if (Date.now() < blockedUntil) {
    console.warn(
      `[API] Rate limited until ${new Date(blockedUntil).toISOString()}, trying cached data`
    );

    // Try to use cached data if available
    if (shouldUseCache) {
      const cached = SAFE_API_CACHE.get(cacheKey);
      if (cached) {
        console.log('[API] Using cached data due to rate limit');
        return cached.data as T;
      }
    }

    // If no cache and it's a public endpoint, wait and retry once
    if (isPublicCacheableEndpoint(normalizedEndpoint)) {
      const waitTime = Math.min(blockedUntil - Date.now(), 3000); // Max 3s wait
      console.log(`[API] Waiting ${waitTime}ms before retry...`);
      await sleep(waitTime);
      SAFE_API_BLOCKED_UNTIL.delete(throttleKey); // Clear block after wait
    } else {
      throw new ApiError('[429] Muitas solicitações. Por favor, tente novamente mais tarde.', {
        status: 429,
        url,
        method,
      });
    }
  }

  if (shouldUseCache) {
    const cached = SAFE_API_CACHE.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data as T;
    }
    if (cached && cached.expiresAt <= Date.now()) {
      SAFE_API_CACHE.delete(cacheKey);
    }
  }

  if (method === 'GET') {
    const inFlight = SAFE_API_IN_FLIGHT.get(cacheKey);
    if (inFlight) {
      return inFlight as Promise<T>;
    }
  }

  const defaultHeaders: Record<string, string> = getApiRequestHeaders({
    'Content-Type': 'application/json',
  });

  const shouldAttachUtm =
    method !== 'GET' &&
    (normalizedEndpoint.startsWith('leads/wizard_create') ||
      normalizedEndpoint.startsWith('analytics') ||
      normalizedEndpoint.startsWith('banner_events'));

  if (shouldAttachUtm && typeof window !== 'undefined') {
    const utm = getCurrentUTMs();
    const attribution = getAttribution();

    let bodyPayload: any = requestOptions.body;
    if (typeof bodyPayload === 'string') {
      try {
        bodyPayload = JSON.parse(bodyPayload);
      } catch {
        bodyPayload = {};
      }
    }

    if (bodyPayload === null || bodyPayload === undefined) {
      bodyPayload = {};
    }

    if (typeof bodyPayload === 'object') {
      if (Object.keys(utm).length > 0 && !bodyPayload.utm) {
        bodyPayload.utm = utm;
      }
      if (attribution && !bodyPayload.attribution) {
        bodyPayload.attribution = attribution;
      }
    }

    requestOptions.body = JSON.stringify(bodyPayload);
  }

  const executeRequest = async (): Promise<T> => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log('[API] Request ->', method, url);

        const response = await fetch(url, {
          ...requestOptions,
          headers: {
            ...defaultHeaders,
            ...requestOptions.headers,
          },
          credentials: requestOptions.credentials || 'include',
        });

        const responseBody = await response.json().catch(() => null);
        if (!response.ok) {
          if (response.status === 429) {
            const retryAfterRaw = response.headers.get('retry-after');
            const retryAfterSeconds = retryAfterRaw ? Number(retryAfterRaw) : NaN;
            const retryAfterMs =
              Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
                ? retryAfterSeconds * 1000
                : SAFE_API_RATE_LIMIT_BLOCK_MS;
            SAFE_API_BLOCKED_UNTIL.set(throttleKey, Date.now() + retryAfterMs);
          }

          if (response.status === 401 && responseBody) {
            if (options.skipAuthRefresh !== true && !options._retry && (await refreshAuthSession())) {
              return fetchApiSafe<T>(endpoint, { ...options, _retry: true });
            }

            const errorCode = responseBody.code;
            const errorMsg = responseBody.error || responseBody.message || '';
            if (
              errorCode === 'TOKEN_REVOKED' ||
              errorCode === 'SESSION_EXPIRED' ||
              errorMsg.toLowerCase().includes('revoked') ||
              errorMsg.toLowerCase().includes('session expired')
            ) {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('auth');
                localStorage.removeItem('user');
                sessionStorage.clear();
                document.cookie.split(';').forEach((c) => {
                  document.cookie = c
                    .replace(/^ +/, '')
                    .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
                });
                window.location.href = '/login?reason=session_expired';
              }
              throw new Error('Session expired. Please login again.');
            }
          }

          const errorData = responseBody || { error: `API Error (${response.status})` };
          const message =
            errorData?.error || errorData?.message || response.statusText || 'API Error';
          const apiError = new ApiError(`[${response.status}] ${message}`, {
            status: response.status,
            code: errorData?.code,
            url,
            method,
            details: responseBody,
          });

          const isIdempotent = ['GET', 'HEAD', 'OPTIONS'].includes(method);
          const retryableStatus =
            response.status === 401 || response.status === 404 || response.status >= 500;
          const shouldRetry = isIdempotent && retryableStatus && attempt < maxRetries - 1;
          if (shouldRetry) {
            const delay = 300 * Math.pow(2, attempt) + Math.floor(Math.random() * 150);
            await sleep(delay);
            continue;
          }

          if (response.status === 404 && options?.fallback !== undefined) {
            return options.fallback;
          }
          if (options?.fallback !== undefined) {
            return options.fallback;
          }
          throw apiError;
        }

        if (shouldUseCache) {
          SAFE_API_CACHE.set(cacheKey, {
            expiresAt: Date.now() + cacheTtlMs,
            data: responseBody,
          });
        }

        return responseBody;
      } catch (error) {
        const apiError = toApiError(error, {
          url,
          method,
          isNetworkError: error instanceof TypeError,
        });

        if (apiError.isNetworkError) {
          SAFE_API_BLOCKED_UNTIL.set(throttleKey, Date.now() + SAFE_API_NETWORK_BLOCK_MS);
        }

        const status = (apiError as any)?.status;
        const isIdempotent = ['GET', 'HEAD', 'OPTIONS'].includes(method);
        const shouldRetryNetwork =
          isIdempotent && apiError.isNetworkError && attempt < maxRetries - 1;
        const shouldRetryStatus =
          isIdempotent &&
          attempt < maxRetries - 1 &&
          (status === 401 || status === 404 || (typeof status === 'number' && status >= 500));

        if (shouldRetryNetwork || shouldRetryStatus) {
          const delay = 300 * Math.pow(2, attempt) + Math.floor(Math.random() * 150);
          await sleep(delay);
          continue;
        }

        console.error(`[API] Failed to access ${url}:`, apiError);
        throw apiError;
      }
    }

    throw new ApiError('API request failed after retries', { url, method });
  };

  if (method === 'GET') {
    const promise = executeRequest().finally(() => {
      SAFE_API_IN_FLIGHT.delete(cacheKey);
    });
    SAFE_API_IN_FLIGHT.set(cacheKey, promise as Promise<unknown>);
    return promise;
  }

  return executeRequest();
}

// ------------------
// APIs EspecÃ­ficas
// ------------------

// Empresas
export const companiesApiSafe = {
  getAll: async (params?: {
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
    has_reviews?: boolean;
    page?: number;
    per_page?: number;
    fields?: 'card' | 'map';
    signal?: AbortSignal;
  }): Promise<Company[]> => {
    try {
      const url = `companies${buildQueryParams(params || {})}`;
      const response = await fetchApiSafe<any>(url); // Usar 'any' temporariamente para inspecionar a resposta

      // Verificar se a resposta é um array diretamente ou um objeto com a propriedade 'companies'
      if (Array.isArray(response)) {
        return response;
      } else if (response && Array.isArray(response.data)) {
        return response.data;
      } else if (response && Array.isArray(response.companies)) {
        return response.companies;
      }
      return [];
    } catch (error) {
      console.error('Error fetching companies:', error);
      // Return empty array on error to prevent breaking the UI during build or runtime
      return [];
    }
  },

  getAllPaginated: async (params?: {
    status?: string;
    featured?: boolean;
    category_id?: number;
    category_ids?: number[];
    sort?: string;
    q?: string;
    state?: string[] | string;
    city?: string[] | string;
    serves_state?: string[] | string;
    serves_city?: string[] | string;
    min_rating?: number;
    verified?: boolean;
    has_reviews?: boolean;
    page?: number;
    per_page?: number;
    fields?: 'card' | 'map';
    financing_enabled?: boolean;
    whatsapp_enabled?: boolean;
    latitude?: number;
    longitude?: number;
    radius_km?: number;
    lat?: number;
    lng?: number;
    signal?: AbortSignal;
  }): Promise<{ data: Company[]; meta?: { pagination?: any } }> => {
    try {
      const { signal, ...queryParams } = params || {};
      const url = `companies${buildQueryParams(queryParams)}`;
      console.log('[companiesApiSafe.getAllPaginated] Fetching:', url);

      const response = await fetchApiSafe<any>(url, { signal });

      console.log('[companiesApiSafe.getAllPaginated] Response structure:', {
        isArray: Array.isArray(response),
        hasData: response?.data !== undefined,
        dataIsArray: Array.isArray(response?.data),
        dataLength: response?.data?.length || 0,
        hasMeta: response?.meta !== undefined,
      });

      if (response && Array.isArray(response.data)) {
        console.log(
          '[companiesApiSafe.getAllPaginated] Returning data array with',
          response.data.length,
          'items'
        );
        return { data: response.data, meta: response.meta };
      }
      if (Array.isArray(response)) {
        console.log(
          '[companiesApiSafe.getAllPaginated] Returning direct array with',
          response.length,
          'items'
        );
        return { data: response };
      }

      console.warn(
        '[companiesApiSafe.getAllPaginated] Unexpected response format, returning empty array'
      );
      return { data: [] };
    } catch (error) {
      console.error('[companiesApiSafe.getAllPaginated] Error:', error);
      // Return empty data on error to prevent breaking the UI during build or runtime
      return { data: [] };
    }
  },

  getTotalCount: async (params?: {
    status?: string;
    featured?: boolean;
    category_id?: number;
    category_ids?: number[];
    sort?: string;
    q?: string;
    state?: string[] | string;
    city?: string[] | string;
    serves_state?: string[] | string;
    serves_city?: string[] | string;
    min_rating?: number;
    verified?: boolean;
    has_reviews?: boolean;
    fields?: 'card' | 'map';
    financing_enabled?: boolean;
    whatsapp_enabled?: boolean;
    latitude?: number;
    longitude?: number;
    radius_km?: number;
    lat?: number;
    lng?: number;
    signal?: AbortSignal;
  }): Promise<number | null> => {
    try {
      const { signal, ...countParams } = params || {};
      const response = await companiesApiSafe.getAllPaginated({
        ...countParams,
        page: 1,
        per_page: 1,
        signal,
      });

      const total = Number(response?.meta?.pagination?.total);
      if (Number.isFinite(total) && total >= 0) {
        return total;
      }

      return null;
    } catch (error) {
      console.error('[companiesApiSafe.getTotalCount] Error:', error);
      return null;
    }
  },

  getById: async (id: number | string): Promise<Company | null> => {
    const slugCandidate = typeof id === 'string' && !/^\d+$/.test(id);

    try {
      console.log(`[companiesApiSafe.getById] Fetching company by ID: ${id}`);
      const response = await fetchApiSafe<any>(`companies/${encodeURIComponent(id)}`, {
        retries: 1,
      });

      if (response) {
        console.log('[companiesApiSafe.getById] Raw response:', response);

        // Backend retorna: { company: { ... } }
        // Precisamos desembrulhar para pegar apenas o objeto company
        if (response.company) {
          console.log('[companiesApiSafe.getById] Unwrapped company:', {
            id: response.company.id,
            name: response.company.name,
            slug: response.company.slug,
            status: response.company.status,
          });
          return response.company;
        }

        // Se já vier desembrulhado (compatibilidade)
        if (response.id) {
          return response;
        }
      }

      if (slugCandidate) {
        console.warn(
          `[companiesApiSafe.getById] Direct lookup returned empty for slug candidate, checking by_slug: ${id}`
        );
        const bySlug = await fetchApiSafe<any>(`companies/by_slug/${encodeURIComponent(id)}`, {
          retries: 1,
        });
        if (bySlug?.company) return bySlug.company;
        if (bySlug?.id) return bySlug;
      }

      console.warn('[companiesApiSafe.getById] Returning null - could not parse company data');
      return null;
    } catch (error) {
      if (slugCandidate) {
        console.warn(
          `[companiesApiSafe.getById] Direct ID lookup failed for slug candidate ${id}, attempting by_slug fallback:`,
          error
        );
        try {
          const bySlug = await fetchApiSafe<any>(`companies/by_slug/${encodeURIComponent(id)}`, {
            retries: 1,
          });
          if (bySlug?.company) return bySlug.company;
          if (bySlug?.id) return bySlug;
        } catch (fallbackError) {
          console.error(
            `[companiesApiSafe.getById] Fallback to by_slug also failed for ${id}:`,
            fallbackError
          );
        }
      } else {
        console.error(`Error fetching company with ID ${id}:`, error);
      }
      return null;
    }
  },

  getBySlug: async (slug: string): Promise<Company | null> => {
    try {
      const response = await fetchApiSafe<any>(`companies/by_slug/${encodeURIComponent(slug)}`);
      if (response?.company) return response.company;
      if (response?.id) return response;
      return null;
    } catch (error) {
      console.error(`Error fetching company with slug ${slug}:`, error);
      return null;
    }
  },

  getStates: async (): Promise<string[]> => {
    try {
      const response = await fetchApiSafe<{ states: string[] }>('companies/states');
      return response.states || [];
    } catch (error) {
      console.error('Error fetching states:', error);
      throw error;
    }
  },

  getCities: async (state?: string): Promise<string[]> => {
    try {
      const url = `companies/cities${state ? `?state=${encodeURIComponent(state)}` : ''}`;
      const response = await fetchApiSafe<{ cities: string[] }>(url);
      return response.cities || [];
    } catch (error) {
      console.error('Error fetching cities:', error);
      throw error;
    }
  },

  getCatalog: async (
    companyId: number,
    category: string | number
  ): Promise<CompanyCatalogResponse | null> => {
    try {
      return await fetchApiSafe<CompanyCatalogResponse>(
        `companies/${companyId}/catalog${buildQueryParams({ category })}`
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      console.error(`Error fetching catalog for company ${companyId}:`, error);
      throw error;
    }
  },

  getSocialProof: async (
    companyId: number,
    params?: { limit?: number }
  ): Promise<{
    company_id: number;
    company_slug?: string;
    total_featured_reviews: number;
    generated_at: string;
    reviews: SocialProofReview[];
  }> => {
    const query = buildQueryParams(params || {});
    return fetchApiSafe<{
      company_id: number;
      company_slug?: string;
      total_featured_reviews: number;
      generated_at: string;
      reviews: SocialProofReview[];
    }>(`companies/${companyId}/social_proof${query}`);
  },
};

// Categorias
export const categoriesApiSafe = {
  getAll: async (params?: {
    status?: string;
    featured?: boolean;
    category_id?: number;
    limit?: number;
    include_subcategories?: boolean;
  }): Promise<Category[]> => {
    try {
      const url = `categories${buildQueryParams(params || {})}`;
      const response = await fetchApiSafe<any>(url);
      if (Array.isArray(response)) {
        return response;
      }
      if (response && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Return empty array on error to prevent breaking the UI
      return [];
    }
  },
  getById: async (id: number): Promise<Category | null> => {
    try {
      const response = await fetchApiSafe<Category>(`categories/${id}`);
      return response || null;
    } catch (error) {
      console.error(`Error fetching category with ID ${id}:`, error);
      // Return null on error to prevent breaking the UI
      return null;
    }
  },
  getBySlug: async (slug: string): Promise<Category | null> => {
    try {
      const response = await fetchApiSafe<Category>(`categories/by_slug/${slug}`);
      return response || null;
    } catch (error) {
      console.error(`Error fetching category with slug ${slug}:`, error);
      // Return null on error to prevent breaking the UI
      return null;
    }
  },
  getTree: async (): Promise<Category[]> => {
    try {
      const response = await fetchApiSafe<any>('categories/tree');
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.data)) return response.data;
      if (response && Array.isArray(response.categories)) return response.categories;
      return [];
    } catch (error) {
      console.error('Error fetching category tree:', error);
      return [];
    }
  },
};

// AvaliaÃ§Ãµes (Reviews)
export const reviewsApiSafe = {
  getAll: async (params?: { limit?: number; company_id?: number }): Promise<Review[]> => {
    try {
      const url = `reviews${buildQueryParams(params || {})}`;
      const response = await fetchApiSafe<any>(url);
      if (Array.isArray(response)) {
        return response;
      }
      if (response && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // Return empty array on error to prevent breaking the UI
      return [];
    }
  },
  getById: async (id: number): Promise<Review | null> => {
    try {
      return await fetchApiSafe<Review>(`reviews/${id}`);
    } catch (error) {
      console.error(`Error fetching review with ID ${id}:`, error);
      // Return null on error to prevent breaking the UI
      return null;
    }
  },
  getByCompany: async (companyId: number): Promise<Review[]> => {
    try {
      const url = `reviews${buildQueryParams({ company_id: companyId })}`;
      const response = await fetchApiSafe<any>(url);
      if (Array.isArray(response)) {
        return response;
      }
      if (response && Array.isArray(response.data)) {
        return response.data;
      }
      if (response && Array.isArray(response.reviews)) {
        return response.reviews;
      }
      return [];
    } catch (error) {
      console.error(`Error fetching reviews for company ${companyId}:`, error);
      return [];
    }
  },
};

export const localSolarPagesApi = {
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
    }
  ): Promise<LocalSolarPageResponse | null> => {
    try {
      const endpoint = city
        ? `local_solar_pages/${encodeURIComponent(state)}/${encodeURIComponent(city)}`
        : `local_solar_pages/${encodeURIComponent(state)}`;

      return await fetchApiSafe<LocalSolarPageResponse>(
        `${endpoint}${buildQueryParams(params || {})}`
      );
    } catch (error: any) {
      console.error('[localSolarPagesApi.get] Error:', error);
      if (error?.status === 404) {
        return null;
      }
      throw error;
    }
  },
};

// Banners API
export const bannersApiSafe = {
  getByPosition: async (position: string, categoryId?: number): Promise<Banner[]> => {
    try {
      const params: Record<string, any> = { position };
      if (categoryId) params.category_id = categoryId;
      const url = `banners${buildQueryParams(params)}`;
      const response = await fetchApiSafe<any>(url);
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.data)) return response.data;
      if (response && Array.isArray(response.banners)) return response.banners;
      return [];
    } catch (error) {
      console.error('Error fetching banners:', error);
      return [];
    }
  },
};

// Produtos
export const productsApiSafe = {
  getAll: async (params?: {
    category_id?: number;
    company_id?: number;
    brand_id?: number;
    price_min?: number;
    price_max?: number;
    featured?: boolean;
    limit?: number;
    include_specs?: boolean;
    q?: string;
    sort?: string;
    page?: number;
    per_page?: number;
  }): Promise<Product[]> => {
    try {
      const url = `products${buildQueryParams(params || {})}`;
      const response = await fetchApiSafe<any>(url);
      if (Array.isArray(response)) {
        return response;
      }
      if (response && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching products:', error);
      // Return empty array on error to prevent breaking the UI
      return [];
    }
  },
  getAllPaginated: async (params?: {
    category_id?: number;
    company_id?: number;
    brand_id?: number;
    price_min?: number;
    price_max?: number;
    featured?: boolean;
    limit?: number;
    include_specs?: boolean;
    q?: string;
    sort?: string;
    page?: number;
    per_page?: number;
  }): Promise<{
    data: Product[];
    meta: { total: number; page: number; per_page: number; total_pages: number };
  }> => {
    try {
      const url = `products${buildQueryParams(params || {})}`;
      const response = await fetchApiSafe<any>(url);
      if (response && Array.isArray(response.data)) {
        return {
          data: response.data,
          meta: response.meta || {
            total: response.data.length,
            page: 1,
            per_page: response.data.length,
            total_pages: 1,
          },
        };
      }
      if (Array.isArray(response)) {
        return {
          data: response,
          meta: { total: response.length, page: 1, per_page: response.length, total_pages: 1 },
        };
      }
      return { data: [], meta: { total: 0, page: 1, per_page: 12, total_pages: 0 } };
    } catch (error) {
      console.error('Error fetching products paginated:', error);
      return { data: [], meta: { total: 0, page: 1, per_page: 12, total_pages: 0 } };
    }
  },
  getById: async (id: number): Promise<Product | null> => {
    try {
      return await fetchApiSafe<Product>(`products/${id}`);
    } catch (error) {
      console.error(`Error fetching product with ID ${id}:`, error);
      // Return null on error to prevent breaking the UI
      return null;
    }
  },
  getReviews: async (
    id: number,
    params?: { limit?: number; category_id?: number }
  ): Promise<ProductReviewsResponse | null> => {
    try {
      return await fetchApiSafe<ProductReviewsResponse>(
        `products/${id}/reviews${buildQueryParams(params || {})}`
      );
    } catch (error) {
      console.error(`Error fetching reviews for product ${id}:`, error);
      return null;
    }
  },
  getByCompany: async (companyId: number): Promise<Product[]> => {
    try {
      const url = `products${buildQueryParams({ company_id: companyId })}`;
      const response = await fetchApiSafe<any>(url);
      if (Array.isArray(response)) {
        return response;
      }
      if (response && Array.isArray(response.data)) {
        return response.data;
      }
      if (response && Array.isArray(response.products)) {
        return response.products;
      }
      return [];
    } catch (error) {
      console.error(`Error fetching products for company ${companyId}:`, error);
      return [];
    }
  },
  getFilters: async (): Promise<any> => {
    try {
      return await fetchApiSafe<any>('products/filters');
    } catch (error) {
      console.error('Error fetching product filters:', error);
      return { filters: [] };
    }
  },
  compare: async (ids: number[]): Promise<any> => {
    try {
      const url = `products/compare${buildQueryParams({ ids })}`;
      return await fetchApiSafe<any>(url);
    } catch (error) {
      console.error('Error comparing products:', error);
      return { products: [], comparisons: [] };
    }
  },
};

export const campaignReviewsApiSafe = {
  getAll: async (params?: {
    company_id?: number;
    product_id?: number;
    sponsored?: boolean;
    limit?: number;
  }): Promise<CampaignReviewProject[]> => {
    try {
      const url = `campaign_reviews${buildQueryParams(params || {})}`;
      const response = await fetchApiSafe<any>(url);
      const items = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];
      const limit = params?.limit;
      return typeof limit === 'number' && limit > 0 ? items.slice(0, limit) : items;
    } catch (error) {
      console.error('Error fetching campaign reviews:', error);
      return [];
    }
  },
  getById: async (id: number): Promise<CampaignReviewProject | null> => {
    try {
      return await fetchApiSafe<CampaignReviewProject>(`campaign_reviews/${id}`);
    } catch (error) {
      console.error(`Error fetching campaign review with ID ${id}:`, error);
      return null;
    }
  },
};

// Leads
export const leadsApiSafe = {
  create: async (lead: any): Promise<any> => {
    try {
      return await fetchApiSafe<any>('leads', {
        method: 'POST',
        body: JSON.stringify({ lead }),
      });
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  },
};

export const leadsWizardApi = {
  create: async (payload: {
    lead: Record<string, any>;
    preferred_company_id?: number;
    decision_context?: Record<string, unknown>;
  }): Promise<any> => {
    return await fetchApiSafe<any>('leads/wizard_create', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  sendEmailCode: async (leadId: number): Promise<any> => {
    return await fetchApiSafe<any>(`leads/${leadId}/send_otp`, { method: 'POST' });
  },
  resendEmailCode: async (leadId: number): Promise<any> => {
    return await fetchApiSafe<any>(`leads/${leadId}/resend_otp`, { method: 'POST' });
  },
  verifyEmailCode: async (leadId: number, verificationCode: string): Promise<any> => {
    const normalizedCode = verificationCode.trim();
    if (!/^\d{6}$/.test(normalizedCode)) {
      throw new Error('Codigo de verificacao invalido');
    }

    return await fetchApiSafe<any>(`leads/${leadId}/verify_otp`, {
      method: 'POST',
      body: JSON.stringify({ otp_code: normalizedCode }),
    });
  },
  result: async (leadId: number): Promise<any> => {
    return await fetchApiSafe<any>(`leads/${leadId}/wizard_result`);
  },
};

// Financiamento
export const financingOptionsApiSafe = {
  getAll: async (params: {
    company_id: number;
    audience?: string;
    active?: boolean;
  }): Promise<FinancingOption[]> => {
    try {
      const url = `companies/${params.company_id}/financing_options${buildQueryParams({ audience: params.audience, active: params.active })}`;
      return await fetchApiSafe<FinancingOption[]>(url);
    } catch (error) {
      console.error('Error fetching financing options:', error);
      return [];
    }
  },
  compare: async (companyId: number, ids: number[]): Promise<{ options: FinancingOption[] }> => {
    try {
      const query = ids.map((id) => `ids[]=${id}`).join('&');
      const url = `companies/${companyId}/financing_options/compare?${query}`;
      return await fetchApiSafe<{ options: FinancingOption[] }>(url);
    } catch (error) {
      console.error('Error comparing financing options:', error);
      return { options: [] };
    }
  },
};

export const financialInstitutionsApiSafe = {
  getAll: async (): Promise<FinancialInstitution[]> => {
    try {
      return await fetchApiSafe<FinancialInstitution[]>('financial_institutions');
    } catch (error) {
      console.error('Error fetching financial institutions:', error);
      return [];
    }
  },
};
