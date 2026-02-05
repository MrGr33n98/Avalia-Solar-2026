import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { api, Category } from '@/lib/api';

// Response da API (modo cards) - subset de campos
export interface CategoryCardData {
  id: number;
  name: string;
  seo_url: string;
  seo_title: string;
  short_description: string;
  featured: boolean;
  banner_url: string | null;
  icon_url?: string | null;
  articles_count?: number;
  companies_count: number;
  products_count: number;
  reviews_count?: number;
  average_rating?: number;
  average_price?: number;
  views_count?: number;
  tags?: string[];
  badges?: Array<{
    name: string;
    description?: string;
    image_url?: string | null;
  }>;
}

// Adapter: converte CategoryCardData para Category completo
function adaptCategoryData(data: CategoryCardData): Category {
  return {
    ...data,
    description: data.short_description,
    kind: 'standard',
    status: 'active',
    parent_id: null,
    logo: null,
    articles_count: data.articles_count,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export interface CategoryFilterParams {
  view?: 'cards' | 'default';
  featured?: boolean;
  limit?: number;
  enabled?: boolean;
  page?: number;
  per_page?: number;
  region?: string;
  min_rating?: number;
   max_price?: number;
   kind?: string;
   sort_by?: string;
   search?: string;
 }
 
export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

export interface CategoriesResult {
  data: Category[];
  meta?: PaginationMeta;
}

 /**
  * Custom hook para buscar categorias com React Query
 * 
 * @param options - Opções de filtro e configuração
 * @returns Query result com dados, loading, error
 */
export function useCategoriesQuery(options: CategoryFilterParams = {}) {
  const { 
    view = 'cards', 
    featured, 
    limit, 
    enabled = true,
    page,
    per_page,
    region,
    min_rating,
    max_price,
    kind,
    sort_by,
    search
  } = options;

  return useQuery<CategoriesResult>({
    queryKey: ['categories', { view, featured, limit, page, per_page, region, min_rating, max_price, kind, sort_by, search }],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (view) params.append('view', view);
      if (featured !== undefined) params.append('featured', String(featured));
      if (limit) params.append('limit', String(limit));
      if (page) params.append('page', String(page));
      if (per_page) params.append('per_page', String(per_page));
      if (region) params.append('region', region);
      if (min_rating) params.append('min_rating', String(min_rating));
      if (max_price) params.append('max_price', String(max_price));
      if (kind) params.append('kind', kind);
      if (sort_by) params.append('sort_by', sort_by);
      if (search) params.append('search', search);

      // Usar api.request ao invés de api.get
      const response = await api.request<any>({
        url: `/categories?${params.toString()}`,
        method: 'GET'
      });
      
      // Handle pagination response format { data, meta }
      const items = Array.isArray(response.data) ? response.data : response.data.data;
      const meta = !Array.isArray(response.data) ? response.data.meta : undefined;
      
      // Adaptar dados da API para formato Category completo
      return {
        data: items.map(adaptCategoryData),
        meta
      };
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook para buscar apenas categorias em destaque
 */
export function useFeaturedCategoriesQuery(limit: number = 8) {
  return useCategoriesQuery({
    view: 'cards',
    featured: true,
    limit,
  });
}

/**
 * Hook para buscar todas as categorias
 */
export function useAllCategoriesQuery(params: CategoryFilterParams = {}) {
  return useCategoriesQuery({
    view: 'cards',
    ...params
  });
}
