// =======================
// Imports
// =======================
import axios from 'axios';

// =======================
// API Response Types
// =======================
export interface Company {
  id: number;
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
  certifications?: string;
  awards?: string;
  partner_brands?: string;
  coverage_states?: string;
  coverage_cities?: string;
  latitude?: number;
  longitude?: number;
  minimum_ticket?: number;
  maximum_ticket?: number;
  financing_options?: string;
  response_time_sla?: string;
  languages?: string;
  email_public?: string;
  whatsapp?: string;
  phone_alt?: string;
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
  plan_id?: number | null;
  has_paid_plan?: boolean;
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
  company?: any;  // Associated company data
  category?: any; // Associated category data
}

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  user_id: number;
  product_id: number;
  created_at: string;
  updated_at: string;
  user?: { id: number; name: string };
  product?: { id: number; name: string };
  company?: { name: string };
}

export interface Category {
  id: number;
  name: string;
  seo_url: string;
  seo_title: string;
  short_description?: string;
  description?: string;
  parent_id?: number | null;
  companies_count?: number;
  products_count?: number;
  subcategories?: Category[];
  companies?: Company[];
  products?: Product[];
  kind: string;
  status: string;
  featured: boolean;
  banner_url?: string | null;
  logo: {
    url: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface Banner {
  id: number;
  title: string;
  link?: string | null;
  image_url?: string | null;
  banner_type?: string;
  position?: string;
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
  role: 'user' | 'admin' | 'company';
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
// Use internal Docker network URL for server-side requests, browser URL for client-side
const getApiBaseUrl = () => {
  const isDev = process.env.NODE_ENV === 'development';
  if (typeof window === 'undefined') {
    if (isDev) {
      const devUrl = 'http://localhost:3001/api/v1';
      console.log('[API] Server-side: Using dev URL:', devUrl);
      return devUrl;
    }
    const internalUrl = process.env.API_URL_INTERNAL;
    if (internalUrl) {
      console.log('[API] Using internal URL:', internalUrl);
      return internalUrl;
    }
    const publicUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    console.log('[API] Server-side: Using public URL:', publicUrl);
    return `${publicUrl}/api/v1`;
  }
  if (isDev) {
    const devClientUrl = 'http://localhost:3001/api/v1';
    console.log('[API] Client-side: Using dev URL:', devClientUrl);
    return devClientUrl;
  }
  const clientUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1`;
  console.log('[API] Client-side: Using URL:', clientUrl);
  return clientUrl;
};

const API_BASE_URL = getApiBaseUrl();

// Update the api configuration
export const api = {
  baseUrl: API_BASE_URL,
  
  request: async function<T>(config: any): Promise<{ data: T }> {
    try {
      // Fix URL construction to prevent double slashes
      const basePath = this.baseUrl.replace(/\/+$/, ''); // Remove trailing slashes
      const endpoint = config.url.replace(/^\/+/, ''); // Remove leading slashes
      let url = `${basePath}/${endpoint}`;
      
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
      
      console.log('[API] Request ->', config.method, url, config.params || '');
      
      // Attach auth token if present
      let token = null;
      if (typeof window !== 'undefined') {
        const authData = localStorage.getItem('auth');
        if (authData) {
          try {
            const parsed = JSON.parse(authData);
            token = parsed.token;
            console.log('[API] Token attached:', token ? `${token.substring(0, 20)}...` : 'null');
          } catch (e) {
            console.warn('[API] Failed to parse auth data:', e);
          }
        } else {
          console.warn('[API] No auth data in localStorage');
        }
      }
      
      const isFormData = config.data instanceof FormData;
      const response = await fetch(url, {
        method: config.method,
        headers: {
          ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...config.headers,
        },
        body: config.data
          ? isFormData
            ? config.data
            : JSON.stringify(config.data)
          : undefined,
      });

      if (!response.ok) {
        let details: any = null;
        try {
          details = await response.json();
        } catch {}
        const message = details?.errors?.join(', ') || details?.error || details?.message || response.statusText;
        throw new Error(`[${response.status}] ${message}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('[API] Error:', error);
      throw error;
    }
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
  try {
    const cleanEndpoint = endpoint.replace(/^\/+/, '');
    console.log('[API] Fetching:', `${API_BASE_URL}/${cleanEndpoint}`, options.params);
    const response = await api.request<T>({
      url: cleanEndpoint,
      method: options.method || 'GET',
      data: options.body
        ? options.body instanceof FormData
          ? options.body
          : JSON.parse(options.body)
        : undefined,
      headers: { ...options.headers },
      params: options.params,
    });
    return response.data;
  } catch (error: any) {
    console.error('API error:', error);
    if (error.response) {
      throw new Error(
        error.response.data?.error ||
          `API error (${error.response.status})`
      );
    }
    throw new Error(error.message || 'Unknown API error');
  }
}

// =======================
// API Endpoints
// =======================
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    if (typeof window !== 'undefined') {
      try {
        const authStr = localStorage.getItem('auth');
        const auth = authStr ? JSON.parse(authStr) : null;
        const role = auth?.user?.role;
        if (role === 'admin') {
          return await fetchApi('/dashboard/stats');
        }
        return await fetchApi('/company_dashboard/stats');
      } catch {
        return await fetchApi('/company_dashboard/stats');
      }
    }
    return await fetchApi('/dashboard/stats');
  },
};

export const companiesApi = {
  getAll: async (params?: any): Promise<Company[]> => {
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
  getById: async (id: number): Promise<Company | null> => {
    try {
      const response = await fetchApi<{ company: Company }>(`/companies/${id}`);
      return response?.company || null;
    } catch (error) {
      console.error(`Error fetching company with ID ${id}:`, error);
      // Return null on error to prevent breaking the UI
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
  getAll: () => fetchApi<Category[]>('/categories'),
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
  getAll: (params?: any) => fetchApi('/reviews', { params }),
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
  register: (userData: { name: string; email: string; password: string; password_confirmation?: string; date_of_birth?: string; terms_accepted?: boolean }) =>
    fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ user: userData, terms_accepted: userData.terms_accepted ?? true }),
    }),
  logout: async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    try {
      await fetchApi('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.warn('Logout endpoint error:', error);
    }
  },
  me: async (): Promise<User> => {
    // Check if we have authentication data before making the request
    if (typeof window !== 'undefined') {
      const authData = localStorage.getItem('auth');
      const token = localStorage.getItem('auth_token');
      
      if (!authData && !token) {
        console.log('[authApi.me] No authentication data found, throwing error');
        throw new Error('No authentication data available');
      }
    }
    
    const resp = await fetchApi<{ user: User }>('/auth/me');
    return resp.user;
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
    // Fallback: get all categories and find by seo_url
    const categories = await categoriesApi.getAll();
    const category = categories.find(c => c.seo_url === slug);
    if (!category) {
      throw new Error(`Category with slug "${slug}" not found`);
    }
    return category;
  }
};

export const fetchCompanies = (params?: any): Promise<Company[]> => companiesApi.getAll(params);
