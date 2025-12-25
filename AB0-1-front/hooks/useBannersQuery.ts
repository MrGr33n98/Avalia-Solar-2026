import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Banner {
  id: number;
  title: string;
  image_url: string;
  link_url: string;
  sponsored: boolean;
  position: string;
  active: boolean;
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

      const response = await api.get(`/banners?${params.toString()}`);
      return response.data;
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutos - banners mudam menos
    gcTime: 30 * 60 * 1000, // 30 minutos em cache
    retry: 3, // Retry 3x (banners são críticos para monetização)
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
