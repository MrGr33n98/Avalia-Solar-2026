import * as SecureStore from 'expo-secure-store';
import apolloClient from './apolloClient';
import { gql } from '@apollo/client';

const API_VERSION_PATH = '/api/v1';

// Configuração de ambiente para a URL Base da API.
// No emulador Android, 10.0.2.2 mapeia para o localhost da máquina hospedeira.
const DEFAULT_LOCAL_API = 'http://10.0.2.2:3001';
const DEFAULT_PRODUCTION_API = 'https://api.avaliasolar.com.br';

export const getApiBaseUrl = (): string => {
  const customBase = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (customBase) {
    return customBase;
  }
  const isProduction = process.env.NODE_ENV === 'production';
  const origin = isProduction ? DEFAULT_PRODUCTION_API : DEFAULT_LOCAL_API;
  return `${origin}${API_VERSION_PATH}`;
};

// ==========================================
// Interfaces de Tipos (Compartilhados com backend)
// ==========================================

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  companies_count?: number;
  subcategories?: Category[];
}

export interface Company {
  id: number;
  p2p_chat_enabled?: boolean;
  name: string;
  slug: string;
  description?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
  rating?: number | null;
  review_count?: number | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  verified?: boolean;
  featured?: boolean;
  categories?: Category[];
}

export interface Review {
  id: number;
  company_id: number;
  rating: number;
  title?: string | null;
  comment?: string | null;
  reviewer_name: string;
  created_at: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'consumer' | 'company' | 'admin';
  company_id?: number | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LocalSolarPageResponse {
  location: {
    scope: 'state' | 'city';
    state: string;
    state_name: string;
    city?: string | null;
    canonical_path: string;
  };
  stats: {
    total_companies: number;
    verified_companies: number;
  };
  companies: Company[];
  featured_companies: Company[];
  categories: Category[];
}

// ==========================================
// Cliente de API e Utilitários de Requisição
// ==========================================

const TOKEN_KEY = 'auth_token';

export const getStoredToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('[API] Erro ao ler token do SecureStore:', error);
    return null;
  }
};

export const setStoredToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.error('[API] Erro ao salvar token no SecureStore:', error);
  }
};

export const removeStoredToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('[API] Erro ao remover token do SecureStore:', error);
  }
};

// Construtor de Query Parameters
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

// Chamada genérica de Fetch API
export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit & { params?: Record<string, any> } = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  const queryString = options.params ? buildQueryParams(options.params) : '';
  const url = `${baseUrl}/${cleanEndpoint}${queryString}`;

  const token = await getStoredToken();
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client': 'android',
    ...options.headers,
  });

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  console.log(`[API Request] -> ${options.method || 'GET'} ${url}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const responseText = await response.text();
    let responseData: any = null;
    
    if (responseText) {
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }
    }

    if (!response.ok) {
      const errorMessage = responseData?.error || responseData?.message || `Erro de API (${response.status})`;
      console.error(`[API Error] <- status: ${response.status}, message: ${errorMessage}`, responseData);
      throw {
        status: response.status,
        message: errorMessage,
        details: responseData,
      };
    }

    return responseData as T;
  } catch (error: any) {
    if (error.status) {
      throw error;
    }
    console.error(`[API Network Error] <- ${url}:`, error);
    throw {
      status: 0,
      message: 'Falha de conexão com a rede. Verifique seu acesso à internet ou o status da API.',
      details: error,
    };
  }
}

// ==========================================
// Módulos Específicos de API
// ==========================================

export const authApi = {
  login: async (credentials: { email: string; password?: string; code?: string }): Promise<AuthResponse> => {
    return fetchApi<AuthResponse>('auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
  register: async (data: { email: string; name: string; password?: string; role: string }): Promise<AuthResponse> => {
    return fetchApi<AuthResponse>('auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  getCurrentUser: async (): Promise<User> => {
    try {
      const { data } = await apolloClient.query({
        query: gql`
          query GetMe {
            me {
              id
              name
              email
              role
            }
          }
        `,
        fetchPolicy: 'network-only',
      });
      if (data && data.me) {
        return data.me;
      }
    } catch (err) {
      console.warn('[getCurrentUser] GraphQL query failed, falling back to REST:', err);
    }
    return fetchApi<User>('auth/me');
  },
};

export const companiesApi = {
  getAll: async (params?: {
    featured?: boolean;
    category_id?: number;
    q?: string;
    state?: string;
    city?: string;
    verified?: boolean;
    page?: number;
    per_page?: number;
  }): Promise<Company[]> => {
    const res = await fetchApi<any>('companies', { params });
    // Tratar o formato embrulhado da API se necessário
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    if (res && Array.isArray(res.companies)) return res.companies;
    return [];
  },
  
  getByIdOrSlug: async (idOrSlug: number | string): Promise<Company> => {
    const res = await fetchApi<any>(`companies/${idOrSlug}`);
    if (res && res.company) return res.company;
    return res;
  },

  getStates: async (): Promise<string[]> => {
    const res = await fetchApi<{ states: string[] }>('companies/states');
    return res.states || [];
  },

  getCities: async (state: string): Promise<string[]> => {
    const res = await fetchApi<{ cities: string[] }>('companies/cities', {
      params: { state },
    });
    return res.cities || [];
  },
};

export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    const res = await fetchApi<any>('categories');
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
  },
  getTree: async (): Promise<Category[]> => {
    const res = await fetchApi<any>('categories/tree');
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    if (res && Array.isArray(res.categories)) return res.categories;
    return [];
  },
};

export const leadsApi = {
  create: async (leadData: {
    company_id: number;
    name: string;
    email: string;
    phone: string;
    message?: string;
    category_id?: number;
    city?: string;
    state?: string;
    project_type?: string;
  }): Promise<{ success: boolean; lead_id: number; message?: string }> => {
    return fetchApi('leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
  },
  
  getByUser: async (): Promise<any[]> => {
    try {
      const { data } = await apolloClient.query({
        query: gql`
          query GetMyLeads {
            myLeads(page: 1, perPage: 100) {
              nodes {
                id
                status
                message
                city
                state
                product_vertical: service_type
                created_at: createdAt
                company {
                  id
                  name
                  logo_url: logoUrl
                }
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
      });
      return data?.myLeads?.nodes || [];
    } catch (err) {
      console.warn('[leadsApi.getByUser] GraphQL query failed, falling back to REST:', err);
    }
    return fetchApi<any[]>('leads');
  },
};

export const reviewsApi = {
  getByCompany: async (companyId: number): Promise<Review[]> => {
    const res = await fetchApi<any>('reviews', { params: { company_id: companyId } });
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
  },
  create: async (reviewData: {
    company_id: number;
    rating: number;
    title?: string;
    comment?: string;
    reviewer_name: string;
  }): Promise<Review> => {
    return fetchApi('reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  },
};

export const localSolarPagesApi = {
  get: async (state: string, city?: string | null, params?: { vertical?: string }): Promise<LocalSolarPageResponse | null> => {
    const endpoint = city ? `local_solar_pages/${state}/${city}` : `local_solar_pages/${state}`;
    try {
      return await fetchApi<LocalSolarPageResponse>(endpoint, { params });
    } catch (err: any) {
      if (err.status === 404) {
        return null;
      }
      throw err;
    }
  },
};

export const conversationsApi = {
  getAll: () => fetchApi<any[]>('conversations'),
  create: (companyId: number) => fetchApi<any>('conversations', {
    method: 'POST',
    body: JSON.stringify({ company_id: companyId })
  }),
  getMessages: (conversationId: number) => fetchApi<any[]>(`conversations/${conversationId}/direct_messages`),
  sendMessage: (conversationId: number, body: string) => fetchApi<any>(`conversations/${conversationId}/direct_messages`, {
    method: 'POST',
    body: JSON.stringify({ body })
  })
};
