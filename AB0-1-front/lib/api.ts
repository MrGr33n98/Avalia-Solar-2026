// =======================
// Imports
// =======================
import { getApiBaseUrl, getApiRequestHeaders, buildApiUrl } from './api-config';
import { ApiError, toApiError } from './api-error';

// =======================
// API Response Types
// =======================
export interface CompanyButton {
  label: string;
  url: string;
  button_type: 'primary' | 'whatsapp' | 'secondary' | 'custom';
}

export interface CompanyFaq {
  id: number;
  question: string;
  answer: string;
  status?: string;
  position?: number;
}

export interface CompanyFinancingProfile {
  id?: number;
  title?: string | null;
  subtitle?: string | null;
  disclaimer?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
  currency?: string | null;
  status?: string | null;
  default_amount_cents?: number | null;
  min_amount_cents?: number | null;
  max_amount_cents?: number | null;
  default_down_payment_percent?: number | null;
  min_down_payment_percent?: number | null;
  max_down_payment_percent?: number | null;
  default_term_months?: number | null;
  min_term_months?: number | null;
  max_term_months?: number | null;
  default_interest_rate_monthly?: number | null;
  min_interest_rate_monthly?: number | null;
  max_interest_rate_monthly?: number | null;
  grace_months_enabled?: boolean;
  max_grace_months?: number | null;
  amortization_type?: 'price' | 'sac' | string | null;
  show_bank_logos?: boolean;
  show_fee_inputs?: boolean;
}

export interface CompanyFinancingPartner {
  id: number;
  name: string;
  partner_type?: string | null;
  website?: string | null;
  priority?: number;
  position?: number;
  active?: boolean;
  badge?: string | null;
  logo_url?: string | null;
}

export interface CompanyFinancingOffer {
  id: number;
  name: string;
  offer_type?: string | null;
  term_months?: number | null;
  interest_rate_monthly?: number | null;
  min_down_payment_percent?: number | null;
  grace_months?: number | null;
  amortization_type?: 'price' | 'sac' | string | null;
  notes?: string | null;
  active?: boolean;
  position?: number;
}

export interface Company {
  id: number;
  slug?: string;
  name: string;
  description: string;         // Corrigido de 'about' para 'description'
  about?: string;              // Legacy field - some APIs might still use this
  highlights?: string;
  website: string;
  phone: string;
  address: string;
  state?: string;
  city?: string;
  created_at: string;
  updated_at: string;
  banner_url?: string | null;
  logo_url?: string | null;
  buttons?: CompanyButton[];
  rating?: number;
  total_reviews?: number;
  reviews_count?: number;      // Alternative name for total_reviews
  business_hours?: string;
  working_hours?: string;      // Alternative name for business_hours
  payment_methods?: string[];
  category_name?: string;
  category_id?: number;
  categories?: string;         // Some APIs return this as a string
  status?: 'active' | 'inactive';
  featured?: boolean;
  verified?: boolean;
  founded_year?: number;
  employees_count?: number;
  rating_avg?: number;
  average_rating?: number;     // Alternative name for rating_avg
  rating_count?: number;
  certifications?: string | string[];
  awards?: string;
  partner_brands?: string;
  coverage_states?: string;
  coverage_cities?: string;
  latitude?: number;
  longitude?: number;
  minimum_ticket?: number;
  maximum_ticket?: number;
  financing_options?: string;
  services?: string[];
  response_time_sla?: string;
  languages?: string;
  email_public?: string;
  whatsapp?: string;
  phone_alt?: string;
  email?: string | null;
  facebook_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  youtube_url?: string;
  media_gallery?: string;
  cta_primary_label?: string;
  cta_primary_type?: string;
  cta_primary_url?: string;
  cta_secondary_label?: string;
  cta_secondary_type?: string;
  cta_secondary_url?: string;
  cta_whatsapp_template?: string;
  cta_utm_source?: string;
  cta_utm_medium?: string;
  cta_utm_campaign?: string;
  ctas_json?: Record<string, any>;
  cta_whatsapp_enabled?: boolean;
  cta_whatsapp_url?: string | null;
  whatsapp_button_style_json?: Record<string, any> | null;
  plan_status?: 'active' | 'inactive' | 'trial' | 'expired';
  category_info?: {
    id: number;
    name: string;
    seo_url: string;
  };
  plan_id?: number | null;
  has_paid_plan?: boolean;
  plan_features?: Record<string, any>;
  media_upload_allowed?: boolean;
  project_types?: string[];
  services_offered?: string[];
  social_links?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
  };
  ctas?: {
    key: string;
    label: string;
    type: string;
    url: string;
    icon?: string;
    style: string;
    priority: number;
    analytics_event?: string;
  }[];
  faqs?: CompanyFaq[];
  financing_enabled?: boolean;
  financing_feature_allowed?: boolean;
  financing_tab_visible?: boolean;
  financing_profile?: CompanyFinancingProfile | null;
  financing_partners?: CompanyFinancingPartner[];
  financing_offers?: CompanyFinancingOffer[];
}

export interface FinancingOption {
  id: number;
  company_id: number;
  institution_name: string;
  credit_line: string;
  target_audience: 'PF' | 'PJ' | 'Rural';
  max_term_months?: number;
  grace_period_months?: number;
  interest_rate_percent?: number;
  interest_rate_details?: string;
  active: boolean;
  service_filters?: string[];
  project_filters?: string[];
  category_filters?: string[];
  created_at: string;
  updated_at: string;
  // UI-friendly derived fields
  name?: string;
  institution?: string;
  min_rate?: number;
  max_months?: number;
  grace_period_days?: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  short_description?: string;  // Short version of description
  price: number;
  company_id?: number;
  category_id?: number;
  status?: string;
  featured?: boolean;
  created_at: string;
  updated_at: string;
  image_url?: string;
  sku?: string;
  company?: any;  // Associated company data
  category?: any; // Associated category data
  specs?: Array<{
    key: string;
    label: string;
    type: string;
    unit?: string;
    value: any;
    filterable?: boolean;
    sortable?: boolean;
    comparable?: boolean;
    seo_weight?: number;
  }>;
}

export interface Lead {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  company_obj?: {
    id: number | string;
    name: string;
    logo_url: string | null;
  };
  message?: string;
  status?: string;
  category?: string;
  product_vertical?: string;
  company_logo_url?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Review {
  id: number;
  rating: number;
  comment?: string;
  body?: string; // for compatibility
  user_id?: number;
  product_id?: number;
  company_id?: number;
  created_at: string;
  updated_at?: string;
  user?: { id: number; name: string; avatar_url?: string | null };
  product?: { id: number; name: string };
  company?: { id: number; name: string; logo_url?: string | null; slug?: string };
  reply?: string;
  replied_at?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'draft';
  verified?: boolean;
  featured?: boolean;
  helpful_count?: number;
}

export interface CompanyAccessMembership {
  company_id: number;
  company_name: string;
  company_slug?: string;
  member_role?: string | number;
  member_status?: string;
}

export interface CompanyAccessPendingRequest {
  id: number;
  company_id: number;
  company_name: string;
  status: string;
  requested_at?: string;
}

export interface CompanyAccessSuggestedCompany {
  company_id: number;
  company_name: string;
  company_slug?: string;
  match_reason?: string;
}

export interface CompanyAccessContext {
  active_memberships: CompanyAccessMembership[];
  pending_requests: CompanyAccessPendingRequest[];
  suggested_companies: CompanyAccessSuggestedCompany[];
}

export interface Category {
  id: number;
  name: string;
  seo_url: string;
  seo_title: string;
  short_description?: string;
  description?: string;
  parent_id?: number | null;
  parent?: { id: number; name: string; seo_url: string } | null;
  companies_count?: number;
  products_count?: number;
  subcategories?: Category[];
  companies?: Company[];
  products?: Product[];
  kind: string;
  status: string;
  featured: boolean;
  banner_url?: string | null;
  icon_url?: string | null;
  average_rating?: number;
  average_price?: number;
  views_count?: number;
  reviews_count?: number;
  tags?: string[];
  badges?: Array<{
    name: string;
    description?: string;
    image_url?: string | null;
  }>;
  logo: {
    url: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface Banner {
  id: number;
  title: string;
  description?: string | null;
  link?: string | null;
  image_url?: string | null;
  banner_type?: string;
  position?: string;
  width?: number | null;
  height?: number | null;
  category_ids?: number[];
  sponsored?: boolean;
  active?: boolean;
  start_date?: string | null;
  end_date?: string | null;
}

export interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  features: string;
  created_at: string;
  updated_at: string;
}

export interface Article {
  id: number;
  title: string;
  content: string;
  category_id: number;
  product_id: number;
  created_at: string;
  updated_at: string;
}

export interface SearchAllResponse {
  companies: Company[];
  products: Product[];
  categories: Category[];
  articles: Article[];
  meta?: {
    total_count?: number;
    page?: number;
    per_page?: number;
    total_pages?: number;
  };
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  position: number;
  year: number;
  edition: string;
  category_id: number;
  products: string;
  image: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  companies_count: number;
  products_count: number;
  leads_count: number;
  reviews_count: number;
  active_campaigns: number;
  monthly_revenue: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: 'review' | 'company' | 'admin';
  company_id?: number | null;
  approved_by_admin?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface State {
  id: number;
  name: string;
  abbreviation: string;
  created_at: string;
  updated_at: string;
}

export interface City {
  id: number;
  name: string;
  state_id: number;
  created_at: string;
  updated_at: string;
}

// =======================
// Axios Config
// =======================
const API_BASE_URL = getApiBaseUrl();

// Update the api configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1s
const TIMEOUT = 60000; // Aumentado para 60s para evitar timeouts em conexões lentas ou cold start

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const attemptRefresh = async (): Promise<boolean> => {
  try {
    const url = buildApiUrl('/auth/refresh');
    const response = await fetch(url, {
      method: 'POST',
      headers: getApiRequestHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
    });
    return response.ok;
  } catch (error) {
    console.warn('[API] Refresh failed:', error);
    return false;
  }
};

export const api = {
  baseUrl: API_BASE_URL,
  
  request: async function<T>(config: any): Promise<{ data: T }> {
    let lastError: any;
    const silentStatusCodes = Array.isArray(config?.silentStatusCodes) ? config.silentStatusCodes : [];
    const isRequestSilent = config?.silent === true;
    const requestTag = config?.tag ? ` ${config.tag}` : '';
    
    const maxRetries = config.retries ?? MAX_RETRIES;
    const timeoutDuration = config.timeout ?? TIMEOUT;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      let url = '';
      try {
        // Use buildApiUrl to ensure consistent and normalized URL construction
        url = buildApiUrl(config.url);
        
        // Handle query parameters
        if (config.params) {
          const searchParams = new URLSearchParams();
          Object.keys(config.params).forEach(key => {
            if (config.params[key] !== null && config.params[key] !== undefined) {
              searchParams.append(key, config.params[key]);
            }
          });
          const queryString = searchParams.toString();
          if (queryString) {
            url += (url.includes('?') ? '&' : '?') + queryString;
          }
        }
        
        console.log(`[API] Request (Attempt ${attempt + 1}) ->`, config.method, url, config.params || '');
        
        const isFormData = config.data instanceof FormData;
        const baseHeaders = getApiRequestHeaders(
          isFormData ? {} : { 'Content-Type': 'application/json' }
        );

        // Add timeout support using AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          const errorMessage = `[API] Request timed out after ${timeoutDuration}ms: ${config.method} ${url}`;
          console.warn(errorMessage);
          const timeoutError = new Error(errorMessage);
          controller.abort(timeoutError);
        }, timeoutDuration);

        try {
          const response = await fetch(url, {
            method: config.method,
            headers: {
              ...baseHeaders,
              ...config.headers,
            },
            body: config.data
              ? isFormData
                ? config.data
                : JSON.stringify(config.data)
              : undefined,
            ...(config.next ? { next: config.next } : {}),
            ...(config.cache ? { cache: config.cache } : {}),
            signal: controller.signal,
            credentials: 'include' // Add this line to send cookies
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            if (response.status === 401 && !config._retry && !String(config.url).includes('/auth/refresh')) {
              const refreshed = await attemptRefresh();
              if (refreshed) {
                return await api.request({ ...config, _retry: true });
              }
            }

            let details: any = null;
            try {
              details = await response.json();
            } catch {}
            
            const message = details?.errors?.join(', ') || details?.error || details?.message || response.statusText;
            const errorContext = {
              status: response.status,
              statusText: response.statusText,
              url,
              method: config.method,
              params: config.params,
              details
            };
            const shouldSilence = isRequestSilent || silentStatusCodes.includes(response.status);
            if (!shouldSilence) {
              console.error(`[API] Request failed${requestTag}:`, errorContext);
            } else {
              console.info(`[API] Request failed (silenced)${requestTag}:`, {
                status: response.status,
                url,
                method: config.method
              });
            }
            
            // Don't retry on most 4xx errors (client errors), except 429 (Too Many Requests)
            // We also allow retrying 404 once in case of transient backend issues during deployments
            if (response.status >= 400 && response.status < 500 && 
                response.status !== 429 && response.status !== 404) {
              const err = new ApiError(`[${response.status}] ${message}`, {
                status: response.status,
                code: details?.code,
                url,
                method: config.method,
                details
              });
              (err as any).context = errorContext;
              throw err;
            }
            
            const err = new ApiError(`[${response.status}] ${message}`, {
              status: response.status,
              code: details?.code,
              url,
              method: config.method,
              details
            });
            (err as any).context = errorContext;
            throw err;
          }

          const data = await response.json();
          return { data };
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            throw new ApiError('Request timeout', {
              status: 0,
              url,
              method: config.method,
              isTimeout: true
            });
          }
          throw fetchError;
        }

      } catch (error: any) {
        lastError = error;
        
        // Retry if it's a timeout, network failure, or 5xx/429 (avoid retrying 4xx like 403/404)
        const isRetryable = error.message === 'Request timeout' || 
                           error.message.includes('Network request failed') ||
                           error.message.match(/\[(5\d{2}|429)\]/);
                           
        if (!isRetryable || attempt === maxRetries - 1) {
          const errorStatus = error?.context?.status;
          const shouldSilence = isRequestSilent || silentStatusCodes.includes(errorStatus);
          if (errorStatus === 404) {
            console.warn(`[API] Resource not found (404) after ${attempt + 1} attempts: ${url}`);
          } else if (!shouldSilence) {
            console.error('[API] Final Error:', error);
          } else {
            console.info('[API] Final Error (silenced):', {
              status: errorStatus,
              url,
              method: config.method
            });
          }
          throw error;
        }
        
        const delay = RETRY_DELAY * Math.pow(2, attempt);
        console.warn(`[API] Attempt ${attempt + 1} failed (${error.message}), retrying in ${delay}ms...`);
        await sleep(delay); // Exponential backoff
      }
    }
    
    throw lastError;
  }
};

// Removed axios interceptor code that was causing errors

// =======================
// Generic fetch wrapper
// =======================
export async function fetchApi<T = any>(
  endpoint: string,
  options: any = {}
): Promise<T> {
  const url = buildApiUrl(endpoint);
  const silentStatusCodes = Array.isArray(options?.silentStatusCodes) ? options.silentStatusCodes : [];
  const isSilent = options?.silent === true;

  try {
    const response = await api.request<T>({
      url: endpoint,
      method: options.method || 'GET',
      data: options.body
        ? options.body instanceof FormData
          ? options.body
          : typeof options.body === 'string' 
            ? JSON.parse(options.body)
            : options.body
        : undefined,
      headers: { ...options.headers },
      params: options.params,
      next: options.next,
      cache: options.cache,
      silent: options.silent,
      silentStatusCodes: options.silentStatusCodes,
      tag: options.tag,
    });
    return response.data;
  } catch (error: any) {
    const status = error?.status || error?.context?.status;
    if (options?.fallbackOnStatus && status !== undefined) {
      const fallbackForStatus = options.fallbackOnStatus[status];
      if (fallbackForStatus !== undefined) {
        console.warn(`[API] Using fallback for ${url} due to status ${status}`);
        return fallbackForStatus;
      }
    }

    // If a fallback is provided, return it instead of throwing
    if (options.fallback !== undefined) {
      console.warn(`[API] Using fallback for ${url} due to error:`, error.message);
      return options.fallback;
    }

    // Log the error with full context
    const errorContext = error.context || {
      url,
      method: options.method || 'GET',
      params: options.params
    };
    
    const shouldSilence = isSilent || silentStatusCodes.includes(status);
    if (!shouldSilence) {
      console.error(`[API] fetchApi Error for ${url}:`, {
        message: error.message,
        context: errorContext,
        stack: error.stack
      });
    } else {
      console.info(`[API] fetchApi Error (silenced) for ${url}:`, {
        status,
        context: errorContext
      });
    }

    if (error instanceof ApiError) {
      if (!(error as any).context) {
        (error as any).context = errorContext;
      }
      throw error;
    }

    // Specific handling for 404 Not Found
    if (error.message?.includes('[404]') || error.context?.status === 404) {
      const customMessage = `[404] O recurso solicitado não foi encontrado (${url}). Por favor, verifique se o endereço está correto. Se o problema persistir, entre em contato com o suporte do Avalia Solar.`;
      console.warn(`[API] 404 Error: ${customMessage}`);
      
      const enhancedError = new ApiError(customMessage, {
        status: 404,
        url,
        method: options.method || 'GET',
        details: errorContext
      });
      (enhancedError as any).context = errorContext;
      throw enhancedError;
    }

    if (error?.response) {
      const msg =
        error.response.data?.error ||
        `Erro na API (${error.response.status}): ${error.message}`;
      const enhancedError = new ApiError(msg, {
        status: error.response.status,
        url,
        method: options.method || 'GET',
        details: error.response.data
      });
      (enhancedError as any).context = errorContext;
      throw enhancedError;
    }

    const detailedMessage = error?.message || error?.toString?.() || 'Erro desconhecido na API';
    const enhancedError = toApiError(error, {
      status: errorContext?.status,
      url,
      method: options.method || 'GET',
      details: errorContext
    });
    enhancedError.message = `${detailedMessage} (Endpoint: ${endpoint})`;
    (enhancedError as any).context = errorContext;
    throw enhancedError;
  }
}

// =======================
// API Endpoints
// =======================
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    try {
      return await fetchApi('/dashboard/stats');
    } catch (error) {
      console.warn('[dashboardApi.getStats] Falling back to company stats due to error:', error);
      return await fetchApi('/company_dashboard/stats');
    }
  },
};

export const reviewDashboardApi = {
  getSummary: () => fetchApi('/review_dashboard/summary'),
};

export const companiesApi = {
  getAll: async (params: { status?: string; featured?: boolean; limit?: number; include?: string; mine?: boolean; q?: string; } = {}): Promise<Company[]> => {
    try {
      const response = await fetchApi<any>('/companies', { params });
      if (Array.isArray(response)) {
        return response;
      }
      if (response && Array.isArray(response.companies)) {
        return response.companies;
      }
      return [];
    } catch (error) {
      console.error('Error fetching companies:', error);
      return [];
    }
  },
  mine: async (params?: any): Promise<Company[]> => {
    try {
      // Try /companies/mine first (RESTful)
      const response = await fetchApi<any>('/companies/mine', { params });
      if (Array.isArray(response)) return response;
      if (response?.data && Array.isArray(response.data)) return response.data;
      
      // Fallback to /users/me_companies if needed
      const altResponse = await fetchApi<any>('/users/me_companies', { params });
      return altResponse?.companies || altResponse || [];
    } catch (error) {
      console.error('Error fetching mine companies:', error);
      return [];
    }
  },
  getById: async (id: number | string): Promise<Company | null> => {
    const slugCandidate = typeof id === 'string' && !/^\d+$/.test(id);
    try {
      const response = await fetchApi<{ company: Company }>(`/companies/${encodeURIComponent(id)}`);
      if (response?.company) return response.company;
      return (response as any)?.id ? (response as any) : null;
    } catch (error) {
      if (slugCandidate) {
        try {
          const response = await fetchApi<{ company: Company }>(`/companies/by_slug/${encodeURIComponent(id)}`);
          if (response?.company) return response.company;
          return (response as any)?.id ? (response as any) : null;
        } catch (slugError) {
          console.error(`Error fetching company with slug ${id}:`, slugError);
        }
      }
      console.error(`Error fetching company with ID ${id}:`, error);
      // Return null on error to prevent breaking the UI
      return null;
    }
  },

  getBySlug: async (slug: string): Promise<Company | null> => {
    try {
      const response = await fetchApi<{ company: Company }>(`/companies/by_slug/${encodeURIComponent(slug)}`);
      if (response?.company) return response.company;
      return (response as any)?.id ? (response as any) : null;
    } catch (error) {
      console.error(`Error fetching company with slug ${slug}:`, error);
      return null;
    }
  },
  getReviews: (id: number, params?: any) => {
    try {
      return fetchApi(`/companies/${id}/reviews`, { params });
    } catch (error) {
      console.error(`Error fetching reviews for company with ID ${id}:`, error);
      // Return empty array on error to prevent breaking the UI
      return Promise.resolve([]);
    }
  },
  getProducts: (id: number, params?: any) => {
    try {
      return fetchApi(`/companies/${id}/products`, { params });
    } catch (error) {
      console.error(`Error fetching products for company with ID ${id}:`, error);
      // Return empty array on error to prevent breaking the UI
      return Promise.resolve([]);
    }
  },
  create: (company: Partial<Company>) => {
    try {
      return fetchApi('/companies', {
        method: 'POST',
        body: JSON.stringify({ company }),
      });
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  },
  update: (id: number, company: Partial<Company>) => {
    try {
      return fetchApi(`/companies/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ company }),
      });
    } catch (error) {
      console.error(`Error updating company with ID ${id}:`, error);
      throw error;
    }
  },
  delete: (id: number) => {
    try {
      return fetchApi(`/companies/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error(`Error deleting company with ID ${id}:`, error);
      throw error;
    }
  },
  search: (query: string, filters?: any) => {
    try {
      return fetchApi('/companies/search', {
        params: { q: query, ...filters },
      });
    } catch (error) {
      console.error('Error searching companies:', error);
      // Return empty array on error to prevent breaking the UI
      return Promise.resolve({ companies: [], meta: {} });
    }
  },
};

export const productsApi = {
  getAll: (params?: any) => fetchApi('/products', { params }),
  getById: (id: number) => fetchApi(`/products/${id}`),
  getReviews: (id: number, params?: any) =>
    fetchApi(`/products/${id}/reviews`, { params }),
  create: (product: Partial<Product>) =>
    fetchApi('/products', {
      method: 'POST',
      body: JSON.stringify({ product }),
    }),
  update: (id: number, product: Partial<Product>) =>
    fetchApi(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ product }),
    }),
  delete: (id: number) => fetchApi(`/products/${id}`, { method: 'DELETE' }),
  search: (query: string, filters?: any) =>
    fetchApi('/products/search', {
      params: { q: query, ...filters },
    }),
};

export const categoriesApi = {
  getAll: (params: { include?: string; } = {}) => fetchApi<Category[]>('/categories', { params }),
  getById: (id: number) => fetchApi<Category>(`/categories/${id}`),
  getBySlug: (slug: string) => fetchApi<Category>(`/categories/by_slug/${encodeURIComponent(slug)}`),
  getCompanies: async (id: number, params?: any): Promise<Company[]> => {
    try {
      console.time(`[API] Fetch companies for category ${id}`);
      const response = await fetchApi<any>(`/categories/${id}/companies`, { params });
      console.timeEnd(`[API] Fetch companies for category ${id}`);
      if (Array.isArray(response)) {
        return response as Company[];
      }
      if (response && Array.isArray(response.companies)) {
        return response.companies as Company[];
      }
      return [];
    } catch (error) {
      console.error('Error fetching category companies:', error);
      return [];
    }
  },
  getCompaniesPaginated: async (
    id: number,
    params?: any
  ): Promise<{ companies: Company[]; meta: any | null }> => {
    try {
      const response = await fetchApi<any>(`/categories/${id}/companies`, { params });

      if (Array.isArray(response)) {
        return { companies: response as Company[], meta: null };
      }

      const companies: Company[] = Array.isArray(response?.companies) ? response.companies : [];

      // Some endpoints return { meta: { pagination: ... } }, others return meta directly.
      const meta = response?.meta?.pagination || response?.meta || null;
      return { companies, meta };
    } catch (error) {
      console.error('Error fetching category companies (paginated):', error);
      return { companies: [], meta: null };
    }
  },
  getBanners: async (id: number, params?: any): Promise<Banner[]> => {
    try {
      const response = await fetchApi<any>(`/categories/${id}/banners`, { params });
      if (Array.isArray(response)) {
        return response as Banner[];
      }
      if (response && Array.isArray(response.banners)) {
        return response.banners as Banner[];
      }
      return [];
    } catch (error) {
      console.error('Error fetching category banners:', error);
      return [];
    }
  },
  getTree: async (): Promise<Category[]> => {
    try {
      const response = await fetchApi<any>('/categories/tree');
      if (Array.isArray(response)) return response;
      if (response?.data && Array.isArray(response.data)) return response.data;
      if (response?.categories && Array.isArray(response.categories)) return response.categories;
      return [];
    } catch (error) {
      console.error('Error fetching category tree:', error);
      return [];
    }
  },
  create: (category: Partial<Category>) =>
    fetchApi('/categories', {
      method: 'POST',
      body: JSON.stringify({ category }),
    }),
  update: (id: number, category: Partial<Category>) =>
    fetchApi(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ category }),
    }),
  delete: (id: number) => fetchApi(`/categories/${id}`, { method: 'DELETE' }),
  search: (query: string) =>
    fetchApi('/categories/search', {
      params: { q: query }
    }),
};

export const leadsApi = {
  getAll: () => fetchApi('/leads'),
  mine: () => fetchApi<Lead[]>('/leads/mine'),
  getById: (id: number) => fetchApi(`/leads/${id}`),
  create: (lead: Partial<Lead>) =>
    fetchApi('/leads', {
      method: 'POST',
      body: JSON.stringify({ lead }),
    }),
  update: (id: number, lead: Partial<Lead>) =>
    fetchApi(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ lead }),
    }),
  delete: (id: number) => fetchApi(`/leads/${id}`, { method: 'DELETE' }),
};

export const reviewsApi = {
  getAll: (params: any = {}) => fetchApi('/reviews', { params }),
  listMine: (params: any = {}) => fetchApi('/reviews/mine', { params }),
  getById: (id: number) => fetchApi(`/reviews/${id}`),
  create: (review: Partial<Review>) =>
    fetchApi('/reviews', {
      method: 'POST',
      body: JSON.stringify({ review }),
    }),
  update: (id: number, review: Partial<Review>) =>
    fetchApi(`/reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ review }),
    }),
  delete: (id: number) => fetchApi(`/reviews/${id}`, { method: 'DELETE' }),
};

export const companyAccessApi = {
  context: () => fetchApi<CompanyAccessContext>('/company_access/context'),
  createRequest: (company_id: number, message?: string) =>
    fetchApi('/company_access_requests', {
      method: 'POST',
      body: JSON.stringify({ company_id, message }),
    }),
  cancelRequest: (id: number) =>
    fetchApi(`/company_access_requests/${id}`, { method: 'DELETE' }),
  selectActiveCompany: (company_id: number) =>
    fetchApi('/company_access/select_active_company', {
      method: 'POST',
      body: JSON.stringify({ company_id }),
    }),
};

export const plansApi = {
  getAll: () => fetchApi('/plans'),
  getById: (id: number) => fetchApi(`/plans/${id}`),
  create: (plan: Partial<Plan>) =>
    fetchApi('/plans', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    }),
  update: (id: number, plan: Partial<Plan>) =>
    fetchApi(`/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ plan }),
    }),
  delete: (id: number) => fetchApi(`/plans/${id}`, { method: 'DELETE' }),
};

export const articlesApi = {
  getAll: () => fetchApi('/articles'),
  getById: (id: number) => fetchApi(`/articles/${id}`),
  create: (article: Partial<Article>) =>
    fetchApi('/articles', {
      method: 'POST',
      body: JSON.stringify({ article }),
    }),
  update: (id: number, article: Partial<Article>) =>
    fetchApi(`/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ article }),
    }),
  delete: (id: number) => fetchApi(`/articles/${id}`, { method: 'DELETE' }),
};

export const badgesApi = {
  getAll: () => fetchApi('/badges'),
  getById: (id: number) => fetchApi(`/badges/${id}`),
  create: (badge: Partial<Badge>) =>
    fetchApi('/badges', {
      method: 'POST',
      body: JSON.stringify({ badge }),
    }),
  update: (id: number, badge: Partial<Badge>) =>
    fetchApi(`/badges/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ badge }),
    }),
  delete: (id: number) => fetchApi(`/badges/${id}`, { method: 'DELETE' }),
};

export const usersApi = {
  getAll: () => fetchApi('/users'),
  getById: (id: number) => fetchApi(`/users/${id}`),
  create: (user: Partial<User>) =>
    fetchApi('/users', {
      method: 'POST',
      body: JSON.stringify({ user }),
    }),
  update: (id: number, user: Partial<User>) =>
    fetchApi(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ user }),
    }),
  delete: (id: number) => fetchApi(`/users/${id}`, { method: 'DELETE' }),
};

export const authApi = {
  login: (email: string, password: string) =>
    fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  signup: (userData: { name: string; email: string; password: string; password_confirmation?: string; date_of_birth?: string; terms_accepted?: boolean }) =>
    fetchApi('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ user: userData, terms_accepted: userData.terms_accepted ?? true }),
    }),
  register: (userData: { name: string; email: string; password: string; password_confirmation?: string; date_of_birth?: string; terms_accepted?: boolean }) =>
    fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ user: userData, terms_accepted: userData.terms_accepted ?? true }),
    }),
  forgotPassword: (email: string) =>
    fetchApi('/auth/forgot_password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, password: string, password_confirmation?: string) =>
    fetchApi('/auth/reset_password', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        password,
        password_confirmation: password_confirmation || password,
      }),
    }),
  resendConfirmation: (email: string) =>
    fetchApi('/auth/resend_confirmation', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  logout: async () => {
    try {
      await fetchApi('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.warn('Logout endpoint error:', error);
    }
  },
  me: async (): Promise<User | null> => {
    try {
      // First try the unified /auth/me endpoint
      const resp = await fetchApi<{ user: User } | null>('/auth/me', {
        silentStatusCodes: [401],
        fallbackOnStatus: { 401: null },
        tag: 'auth.me',
      });
      if (resp && (resp as any).user) return (resp as any).user;
      
      // Fallback to /users/me if /auth/me doesn't return the user object directly
      const userResp = await fetchApi<User | null>('/users/me', {
        silentStatusCodes: [401],
        fallbackOnStatus: { 401: null },
        tag: 'auth.me.fallback',
      });
      return userResp as User | null;
    } catch (error: any) {
      const status = error?.status || error?.context?.status;
      const msg = error?.message || '';
      
      if (status === 401 || msg.includes('[401]') || msg.toLowerCase().includes('not authenticated')) {
        console.warn('[authApi.me] Not authenticated or session expired');
        return null;
      }
      
      console.error('[authApi.me] Unexpected error:', error);
      throw error;
    }
  },
};

export const statesApi = {
  getAll: () => fetchApi('/states'),
  getById: (id: number) => fetchApi(`/states/${id}`),
  getCities: (id: number) => fetchApi(`/states/${id}/cities`),
};

export const citiesApi = {
  getAll: () => fetchApi('/cities'),
  getById: (id: number) => fetchApi(`/cities/${id}`),
  getByState: (stateId: number) =>
    fetchApi(`/states/${stateId}/cities`),
};

export const searchApi = {
  all: async (query: string, filters?: any): Promise<SearchAllResponse> => {
    try {
      const params = { q: query, ...filters };
      return await fetchApi<SearchAllResponse>('/search/all', { params });
    } catch (error) {
      console.error('Search error:', error);
      return {
        companies: [],
        products: [],
        categories: [],
        articles: [],
        meta: {
          total_count: 0,
          page: 1,
          per_page: 10,
          total_pages: 0,
        },
      };
    }
  },
  suggest: async (query: string) => {
    try {
      return await fetchApi('/search/suggest', {
        params: { q: query }
      });
    } catch (error) {
      console.error('[searchApi.suggest] Error:', error);
      return { companies: [], products: [], categories: [], articles: [] };
    }
  },
};

export const financingOptionsApi = {
  getAll: async (companyId: number, params?: { audience?: string; active?: boolean }): Promise<FinancingOption[]> => {
    try {
      const response = await fetchApi<any>(`/companies/${companyId}/financing_options`, { params });
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.options)) return response.options;
      return [];
    } catch (error) {
      console.error('Error fetching financing options:', error);
      return [];
    }
  },
  compare: (companyId: number, ids: number[]) =>
    fetchApi<{ options: FinancingOption[] }>(
      `/companies/${companyId}/financing_options/compare`,
      { params: { ids } }
    ),
  simulate: (companyId: number, params: { amount: number; audience?: string; months?: number }) =>
    fetchApi<{
      best: any;
      options: Array<
        FinancingOption & {
          monthly_payment: number;
          total_cost: number;
          cet_annual_percent: number;
        }
      >;
      ranking: Array<{ id: number; score: number; reason: string }>;
    }>(`/companies/${companyId}/financing_options/simulate`, { params }),
};

export const financingProposalsApi = {
  submit: (
    companyId: number,
    payload: {
      option_id?: number;
      amount: number;
      months: number;
      audience?: string;
      entry?: number;
      use_type?: string;
      project_amount?: number;
      name?: string;
      email?: string;
      phone?: string;
    }
  ) =>
    fetchApi<{ proposal_id: number; status: string }>(
      `/companies/${companyId}/financing_proposals`,
      { method: 'POST', body: JSON.stringify(payload) }
    ),
  status: (companyId: number, proposalId: number) =>
    fetchApi<{ proposal_id: number; status: string }>(
      `/companies/${companyId}/financing_proposals/${proposalId}/status`
    ),
};

export const adminApi = {
  importCategories: (formData: FormData) =>
    fetchApi('/admin/categories/import', {
      method: 'POST',
      body: formData,
    }),
};

// End of API endpoints

// =======================
// Convenience Functions
// =======================
export const fetchCategories = (): Promise<Category[]> => categoriesApi.getAll();

export const fetchCategoryById = (id: number): Promise<Category> => categoriesApi.getById(id);

export const fetchCategoryBySlug = async (slug: string): Promise<Category> => {
  try {
    // First try the API endpoint for slug
    return await categoriesApi.getBySlug(slug);
  } catch (error) {
    console.warn('Slug API not available, trying fallback...');

    // Fallback: get all categories and find by seo_url/slug/name
    const categories = await categoriesApi.getAll();
    const normalize = (value?: string) =>
      (value || '')
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const target = normalize(slug);
    const category = categories.find((c) => {
      const directMatch = c.seo_url === slug || (c as any).slug === slug;
      if (directMatch) return true;
      const normalizedSeo = normalize(c.seo_url);
      const normalizedName = normalize(c.name);
      return normalizedSeo === target || normalizedName === target;
    });
    if (!category) {
      throw new Error(`Category with slug "${slug}" not found`);
    }
    return category;
  }
};

export const fetchCompanies = (params?: any): Promise<Company[]> => companiesApi.getAll(params);
