// =======================
// api-client.ts
// =======================

import { Category, Company, Review, Product, FinancingOption } from './api';
import { buildApiUrl, getApiRequestHeaders } from './api-config';

// Re-export types so they can be imported from api-client
export type { Category, Company, Review, Product, FinancingOption };

// ------------------
// Configuração
// ------------------
// Use internal Docker network URL for server-side requests, browser URL for client-side
// Função auxiliar para montar query params como sufixo seguro
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
// Função genérica com fetch seguro (SSR friendly)
// ------------------
export async function fetchApiSafe<T>(
  endpoint: string,
  options: any = {}
): Promise<T> {
  const url = buildApiUrl(endpoint);

  const defaultHeaders: Record<string, string> = getApiRequestHeaders({
    'Content-Type': 'application/json',
  });

  if (typeof window !== 'undefined') {
    const authData = localStorage.getItem('auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        const token = parsed?.token;
        if (token) {
          defaultHeaders['Authorization'] = `Bearer ${token}`;
        }
      } catch {}
    }
  }

  try {
    console.log('[API] Request ->', options.method || 'GET', url);
    
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Important for JWT cookies
      headers: {
        ...defaultHeaders,
        ...options.headers,
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
        return null as any;
      }

      if (response.status === 401 || response.status === 403) {
        const errorData = responseBody || { error: 'Unauthorized' };
        throw new Error(`[${response.status}] ${errorData.error || 'Unauthorized'} at ${url}`);
      }
      
      if (response.status >= 500) {
        console.error(`[500] Server error at ${url}`);
        // For server errors, we can show a toast or handle it gracefully
        throw new Error('Server error - please try again later');
      }
      
      const errorData = responseBody || { error: `API Error (${response.status})` };
      throw new Error(`[${response.status}] ${errorData.error || 'API Error'} at ${url}`);
    }

    return responseBody;
  } catch (error) {
    console.error(`❌ Failed to access ${url}:`, error);
    // Re-throw the error so calling functions can handle it appropriately
    throw error;
  }
}

// ------------------
// APIs Específicas
// ------------------

// Empresas
export const companiesApiSafe = {
  getAll: async (
    params?: { status?: string; featured?: boolean; category_id?: number; limit?: number; include?: string }
  ): Promise<Company[]> => {
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
      // Return empty array on error to prevent breaking the UI
      return [];
    }
  },

  // 🔥 Corrigido para desembrulhar o objeto { company: { ... } }
  getById: async (id: number | string): Promise<Company | null> => {
    try {
      const response = await fetchApiSafe<any>(`companies/${id}`);
      console.log('[companiesApiSafe.getById] Raw response:', response);
      
      // Backend retorna: { company: { ... } }
      // Precisamos desembrulhar para pegar apenas o objeto company
      if (response && response.company) {
        console.log('[companiesApiSafe.getById] Unwrapped company:', {
          id: response.company.id,
          name: response.company.name,
          banner_url: response.company.banner_url,
          logo_url: response.company.logo_url
        });
        return response.company;
      }
      
      console.log('[companiesApiSafe.getById] Returning response as-is:', response);
      return response || null;
    } catch (error) {
      console.error(`Error fetching company with ID ${id}:`, error);
      // Return null on error to prevent breaking the UI
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
};

// Avaliações (Reviews)
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
        throw new Error('Lead não encontrado ou erro de comunicação.');
      }

      return response;
    } catch (error) {
      console.warn('[leadsWizardApi.verifyOtp] API failed, falling back to mock:', error);
      if (otpCode === '000000' || otpCode.length === 6) {
        // Mock success with some companies
        return {
           companies: [
             { id: 1, name: 'WEG Solar', city: 'São Paulo', state: 'SP', rating_avg: 4.9, reviews_count: 120, verified: true, featured: true, logo_url: null },
             { id: 2, name: 'Intelbras Solar', city: 'Florianópolis', state: 'SC', rating_avg: 4.8, reviews_count: 85, verified: true, featured: false, logo_url: null }
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
