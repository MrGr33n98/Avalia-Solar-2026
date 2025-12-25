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
  companies_count: number;
  products_count: number;
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

interface UseCategoriesQueryOptions {
  view?: 'cards' | 'default';
  featured?: boolean;
  limit?: number;
  enabled?: boolean;
}

/**
 * Custom hook para buscar categorias com React Query
 * 
 * @param options - Opções de filtro e configuração
 * @returns Query result com dados, loading, error
 * 
 * @example
 * // Todas as categorias em modo cards
 * const { data, isLoading } = useCategoriesQuery({ view: 'cards' });
 * 
 * @example
 * // Apenas categorias em destaque
 * const { data } = useCategoriesQuery({ view: 'cards', featured: true, limit: 8 });
 */
export function useCategoriesQuery(options: UseCategoriesQueryOptions = {}) {
  const { view = 'cards', featured, limit, enabled = true } = options;

  return useQuery<Category[]>({
    queryKey: ['categories', { view, featured, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (view) params.append('view', view);
      if (featured !== undefined) params.append('featured', String(featured));
      if (limit) params.append('limit', String(limit));

      // Usar api.request ao invés de api.get
      const response = await api.request<CategoryCardData[]>({
        url: `/categories?${params.toString()}`,
        method: 'GET'
      });
      
      // Adaptar dados da API para formato Category completo
      return response.data.map(adaptCategoryData);
    },
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos - dados são considerados "frescos"
    gcTime: 10 * 60 * 1000, // 10 minutos - tempo em cache
    retry: 2, // Retry 2x em caso de falha
    refetchOnWindowFocus: false, // Não refetch ao focar janela
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
export function useAllCategoriesQuery() {
  return useCategoriesQuery({
    view: 'cards',
  });
}
