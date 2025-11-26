// =======================
// api-client.ts
// =======================

import axios from 'axios';
import { Category, Company, Review, Product } from './api';

// Re-export types so they can be imported from api-client
export type { Category, Company, Review, Product };

// ------------------
// Configuração
// ------------------
// Use internal Docker network URL for server-side requests, browser URL for client-side
const getApiBaseUrl = () => {
  const isDev = process.env.NODE_ENV === 'development';
  if (typeof window === 'undefined') {
    if (isDev) {
      const devUrl = 'http://localhost:3001/api/v1';
      console.log('[API Client] Server-side: Using dev URL:', devUrl);
      return devUrl;
    }
    const internalUrl = process.env.API_URL_INTERNAL;
    if (internalUrl) {
      console.log('[API Client] Using internal URL:', internalUrl);
      return internalUrl;
    }
    const publicUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    console.log('[API Client] Server-side: Using public URL:', publicUrl);
    return `${publicUrl}/api/v1`;
  }
  if (isDev) {
    const devClientUrl = 'http://localhost:3001/api/v1';
    console.log('[API Client] Client-side: Using dev URL:', devClientUrl);
    return devClientUrl;
  }
  const clientUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1`;
  console.log('[API Client] Client-side: Using URL:', clientUrl);
  return clientUrl;
};

const API_BASE_URL = getApiBaseUrl();

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
  // Fix URL construction to prevent double slashes
  const baseUrl = API_BASE_URL.replace(/\/+$/, ''); // Remove trailing slashes
  const cleanEndpoint = endpoint.replace(/^\/+/, ''); // Remove leading slashes
  const url = `${baseUrl}/${cleanEndpoint}`;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

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
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    const responseBody = await response.json().catch(() => null);
    console.log('[API] Response data:', responseBody);

    if (!response.ok) {
      // Handle different error statuses gracefully
      if (response.status === 404) {
        console.log(`[404] Resource not found at ${url}`);
        // For 404s, we return a default empty value based on the expected type
        return undefined as any;
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
    params?: { status?: string; featured?: boolean; category_id?: number; limit?: number }
  ): Promise<Company[]> => {
    try {
      const url = `companies${buildQueryParams(params || {})}`;
      const response = await fetchApiSafe<any>(url); // Usar 'any' temporariamente para inspecionar a resposta
      
      // Verificar se a resposta é um array diretamente ou um objeto com a propriedade 'companies'
      if (Array.isArray(response)) {
        return response;
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
  getById: async (id: number): Promise<Company | null> => {
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
};

// Categorias
export const categoriesApiSafe = {
  getAll: async (
    params?: { status?: string; featured?: boolean; category_id?: number; limit?: number; include_subcategories?: boolean }
  ): Promise<Category[]> => {
    try {
      const url = `categories${buildQueryParams(params || {})}`;
      return await fetchApiSafe<Category[]>(url);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Return empty array on error to prevent breaking the UI
      return [];
    }
  },
  getById: async (id: number): Promise<Category | null> => {
    try {
      return await fetchApiSafe<Category>(`categories/${id}`);
    } catch (error) {
      console.error(`Error fetching category with ID ${id}:`, error);
      // Return null on error to prevent breaking the UI
      return null;
    }
  },
  getBySlug: async (slug: string): Promise<Category | null> => {
    try {
      return await fetchApiSafe<Category>(`categories/by_slug/${slug}`);
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
      return await fetchApiSafe<Review[]>(url);
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
};

// Produtos
export const productsApiSafe = {
  getAll: async (params?: { category_id?: number; company_id?: number; featured?: boolean; limit?: number }): Promise<Product[]> => {
    try {
      const url = `products${buildQueryParams(params || {})}`;
      return await fetchApiSafe<Product[]>(url);
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
