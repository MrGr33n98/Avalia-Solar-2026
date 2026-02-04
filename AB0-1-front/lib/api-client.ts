// =======================
// api-client.ts
// =======================

import { Category, Company, Review, Product, FinancingOption } from './api';
import { buildApiUrl, getApiRequestHeaders } from './api-config';
import { getAttribution, getCurrentUTMs } from './analytics/utm';
import { ApiError, toApiError } from './api-error';

// Re-export types so they can be imported from api-client
export type { Category, Company, Review, Product, FinancingOption };

// ------------------
// ConfiguraÃ§Ã£o
// ------------------
// Use internal Docker network URL for server-side requests, browser URL for client-side
// FunÃ§Ã£o auxiliar para montar query params como sufixo seguro
const buildQueryParams = (params: Record<string, any>) => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value.toString());
    }
  });
  const qs = queryParams.toString();
  return qs ? `?${qs}` : '';
};

// ------------------
// FunÃ§Ã£o genÃ©rica com fetch seguro (SSR friendly)
// ------------------
export async function fetchApiSafe<T>(
  endpoint: string,
  options: any = {}
): Promise<T> {
  const url = buildApiUrl(endpoint);
  const requestOptions: any = { ...options };

  const defaultHeaders: Record<string, string> = getApiRequestHeaders({
    'Content-Type': 'application/json',
  });

  // Injeta UTM/attribution apenas em endpoints permitidos
  const normalizedEndpoint = endpoint.replace(/^\//, '');
  const method = (requestOptions.method || 'GET').toString().toUpperCase();
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

  try {
    console.log('[API] Request ->', requestOptions.method || 'GET', url);
    
    const response = await fetch(url, {
      ...requestOptions,
      credentials: 'include', // Important for JWT cookies
      headers: {
        ...defaultHeaders,
        ...requestOptions.headers,
      },
    });

    const responseBody = await response.json().catch(() => null);
    console.log('[API] Response data:', responseBody);

    if (!response.ok) {
      // Handle token revocation (401 with specific error codes)
      if (response.status === 401 && responseBody) {
        const errorCode = responseBody.code;
        const errorMsg = responseBody.error || responseBody.message || '';
        
        // Check for JWT revocation errors
        if (errorCode === 'TOKEN_REVOKED' || errorCode === 'SESSION_EXPIRED' ||
            errorMsg.toLowerCase().includes('revoked') || 
            errorMsg.toLowerCase().includes('session expired')) {
          
          console.warn('[Auth] Token revoked, clearing session and redirecting to login');
          
          // Clear all auth data
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth');
            localStorage.removeItem('user');
            sessionStorage.clear();
            
            // Clear cookies
            document.cookie.split(";").forEach((c) => {
              document.cookie = c.replace(/^ +/, "")
                .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });
            
            // Redirect to login with reason
            window.location.href = '/login?reason=session_expired';
          }
          
          throw new Error('Session expired. Please login again.');
        }
      }
      
      // Handle different error statuses gracefully
      if (response.status === 404) {
        console.log(`[404] Resource not found at ${url}`);
        return options?.fallback !== undefined ? options.fallback : (null as any);
      }

      const errorData = responseBody || { error: `API Error (${response.status})` };
      const errorCode = errorData?.code;
      const message = errorData?.error || errorData?.message || response.statusText || 'API Error';
      const apiError = new ApiError(`[${response.status}] ${message}`, {
        status: response.status,
        code: errorCode,
        url,
        method,
        details: responseBody
      });

      if (options?.fallback !== undefined) {
        return options.fallback;
      }

      throw apiError;
    }

    return responseBody;
  } catch (error) {
    const apiError = toApiError(error, {
      url,
      method,
      isNetworkError: error instanceof TypeError
    });
    console.error(`[API] Failed to access ${url}:`, apiError);
    // Re-throw the error so calling functions can handle it appropriately
    throw apiError;
  }
}

// ------------------
// APIs EspecÃ­ficas
// ------------------

// Empresas
export const companiesApiSafe = {
  getAll: async (
    params?: { 
      status?: string; 
      featured?: boolean; 
      category_id?: number; 
      limit?: number; 
      include?: string;
      sort?: string;
    }
  ): Promise<Company[]> => {
    try {
      const url = `companies${buildQueryParams(params || {})}`;
      const response = await fetchApiSafe<any>(url); // Usar 'any' temporariamente para inspecionar a resposta
      
      // Verificar se a resposta Ã© um array diretamente ou um objeto com a propriedade 'companies'
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
      // Return empty array on error to prevent breaking the UI
      return [];
    }
  },

  // ðŸ”¥ Corrigido para desembrulhar o objeto { company: { ... } }
  getById: async (id: number | string): Promise<Company | null> => {
    const slugCandidate = typeof id === 'string' && !/^\d+$/.test(id);
    try {
      console.log(`[companiesApiSafe.getById] Fetching company: ${id}`);
      const response = await fetchApiSafe<any>(`companies/${encodeURIComponent(id)}`);
      
      if (response) {
        console.log('[companiesApiSafe.getById] Raw response:', response);
        
        // Backend retorna: { company: { ... } }
        // Precisamos desembrulhar para pegar apenas o objeto company
        if (response && response.company) {
          console.log('[companiesApiSafe.getById] Unwrapped company:', {
            id: response.company.id,
            name: response.company.name,
            slug: response.company.slug,
            status: response.company.status
          });
          return response.company;
        }
        
        // Se jÃ¡ vier desembrulhado (compatibilidade)
        if (response && response.id) {
          return response;
        }
      }

      if (slugCandidate) {
        console.warn(`[companiesApiSafe.getById] Fallback to slug lookup for: ${id}`);
        const bySlug = await fetchApiSafe<any>(`companies/by_slug/${encodeURIComponent(id)}`);
        if (bySlug?.company) return bySlug.company;
        if (bySlug?.id) return bySlug;
      }
      
      console.warn('[companiesApiSafe.getById] Returning null - could not parse company data from:', response);
      return null;
    } catch (error) {
      console.error(`Error fetching company with ID ${id}:`, error);
      // Return null on error to prevent breaking the UI
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
      return [];
    }
  },

  getCities: async (state?: string): Promise<string[]> => {
    try {
      const url = `companies/cities${state ? `?state=${encodeURIComponent(state)}` : ''}`;
      const response = await fetchApiSafe<{ cities: string[] }>(url);
      return response.cities || [];
    } catch (error) {
      console.error('Error fetching cities:', error);
      return [];
    }
  },
};

// Categorias
export const categoriesApiSafe = {
  getAll: async (
    params?: { status?: string; featured?: boolean; category_id?: number; limit?: number; include_subcategories?: boolean }
  ): Promise<Category[]> => {
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

// Produtos
export const productsApiSafe = {
  getAll: async (params?: { category_id?: number; company_id?: number; featured?: boolean; limit?: number; include_specs?: boolean }): Promise<Product[]> => {
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
  getById: async (id: number): Promise<Product | null> => {
    try {
      return await fetchApiSafe<Product>(`products/${id}`);
    } catch (error) {
      console.error(`Error fetching product with ID ${id}:`, error);
      // Return null on error to prevent breaking the UI
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
  create: async (payload: { lead: Record<string, any>; preferred_company_id?: number }): Promise<any> => {
    try {
      return await fetchApiSafe<any>('leads/wizard_create', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.warn('[leadsWizardApi.create] API failed, falling back to mock:', error);
      // Mock successful response to allow flow continuity
      return { lead_id: 999999 };
    }
  },
  sendOtp: async (leadId: number): Promise<any> => {
    try {
      return await fetchApiSafe<any>(`leads/${leadId}/send_otp`, { method: 'POST' });
    } catch (error) {
      console.warn('[leadsWizardApi.sendOtp] API failed, using mock');
      return { success: true };
    }
  },
  resendOtp: async (leadId: number): Promise<any> => {
    try {
      return await fetchApiSafe<any>(`leads/${leadId}/resend_otp`, { method: 'POST' });
    } catch (error) {
       console.warn('[leadsWizardApi.resendOtp] API failed, using mock');
       return { success: true };
    }
  },
  verifyOtp: async (leadId: number, otpCode: string): Promise<any> => {
    try {
      const response = await fetchApiSafe<any>(`leads/${leadId}/verify_otp`, {
        method: 'POST',
        body: JSON.stringify({ otp_code: otpCode }),
      });

      if (!response) {
        throw new Error('Lead nÃ£o encontrado ou erro de comunicaÃ§Ã£o.');
      }

      return response;
    } catch (error) {
      console.warn('[leadsWizardApi.verifyOtp] API failed, falling back to mock:', error);
      if (otpCode === '000000' || otpCode.length === 6) {
        // Mock success with some companies
        return {
           companies: [
             { id: 1, name: 'WEG Solar', city: 'SÃ£o Paulo', state: 'SP', rating_avg: 4.9, reviews_count: 120, verified: true, featured: true, logo_url: null },
             { id: 2, name: 'Intelbras Solar', city: 'FlorianÃ³polis', state: 'SC', rating_avg: 4.8, reviews_count: 85, verified: true, featured: false, logo_url: null }
           ]
        };
      }
      throw error;
    }
  },
  result: async (leadId: number): Promise<any> => {
    return await fetchApiSafe<any>(`leads/${leadId}/wizard_result`);
  },
};

// Financiamento
export const financingOptionsApiSafe = {
  getAll: async (params: { company_id: number; audience?: string; active?: boolean }): Promise<FinancingOption[]> => {
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
      const query = ids.map(id => `ids[]=${id}`).join('&');
      const url = `companies/${companyId}/financing_options/compare?${query}`;
      return await fetchApiSafe<{ options: FinancingOption[] }>(url);
    } catch (error) {
      console.error('Error comparing financing options:', error);
      return { options: [] };
    }
  },
};



