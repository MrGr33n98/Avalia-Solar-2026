import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Category {
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

      const response = await api.get(`/categories?${params.toString()}`);
      return response.data;
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
