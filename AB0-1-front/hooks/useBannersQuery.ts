import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Banner {
  id: number;
  title: string;
  image_url?: string | null;
  link?: string | null;
  link_url?: string | null;
  sponsored?: boolean;
  banner_type?: 'rectangular_large' | 'rectangular_small';
  position?: 'navbar' | 'sidebar' | 'categories_top' | 'home_top' | 'companies_top';
  width?: number | null;
  height?: number | null;
  active?: boolean;
}

interface UseBannersQueryOptions {
  position?: string;
  limit?: number;
  enabled?: boolean;
}

/**
 * Custom hook para buscar banners com React Query
 * 
 * @param options - Opções de filtro e configuração
 * @returns Query result com dados, loading, error
 * 
 * @example
 * // Banners da página de categorias
 * const { data, isLoading } = useBannersQuery({ position: 'categories_top' });
 * 
 * @example
 * // Banners com limite
 * const { data } = useBannersQuery({ position: 'categories_top', limit: 3 });
 */
export function useBannersQuery(options: UseBannersQueryOptions = {}) {
  const { position, limit, enabled = true } = options;

  return useQuery<Banner[]>({
    queryKey: ['banners', { position, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (position) params.append('position', position);
      if (limit) params.append('limit', String(limit));

      // Usar api.request ao invés de api.get
      const response = await api.request<Banner[]>({
        url: `/banners?${params.toString()}`,
        method: 'GET'
      });
      return response.data;
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutos - banners mudam menos
    gcTime: 30 * 60 * 1000, // 30 minutos em cache
    retry: (failureCount, error: any) => {
      const status = error?.status ?? error?.context?.status;
      if (status === 429) return false;
      return failureCount < 1;
    },
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook para buscar banners da página de categorias
 */
export function useCategoriesBannersQuery() {
  return useBannersQuery({
    position: 'categories_top',
  });
}
