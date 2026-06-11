import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Banner {
  id: number;
  title: string;
  image_url?: string | null;
  link?: string | null;
  link_url?: string | null;
  sponsored?: boolean;
  banner_type?: string;
  position?: string;
  company_id?: number | null;
  width?: number | null;
  height?: number | null;
  active?: boolean;
}

interface UseBannersQueryOptions {
  position?: string;
  limit?: number;
  category_id?: number | string;
  company_id?: number | string;
  slot_key?: string;
  state?: string;
  city?: string;
  enabled?: boolean;
  initialData?: Banner[];
}

/**
 * Custom hook para buscar banners com React Query
 * 
 * @param options - Opções de filtro e configuração
 * @returns Query result com dados, loading, error
 */
export function useBannersQuery(options: UseBannersQueryOptions = {}) {
  const { 
    position, 
    limit, 
    category_id, 
    company_id, 
    slot_key, 
    state,
    city,
    enabled = true,
    initialData 
  } = options;

  return useQuery<Banner[]>({
    queryKey: ['banners', { position, limit, category_id, company_id, slot_key, state, city }],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (position) params.append('position', position);
      if (limit) params.append('limit', String(limit));
      if (category_id) params.append('category_id', String(category_id));
      if (company_id) params.append('company_id', String(company_id));
      if (slot_key) params.append('slot_key', slot_key);
      if (state) params.append('state', state);
      if (city) params.append('city', city);

      const response = await api.request<Banner[]>({
        url: `/banners?${params.toString()}`,
        method: 'GET'
      });
      return response.data;
    },
    enabled,
    initialData,
    staleTime: 5 * 60 * 1000, 
    gcTime: 15 * 60 * 1000, 
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
export function useCategoriesBannersQuery(categoryId?: number | string) {
  return useBannersQuery({
    position: 'categories_top',
    category_id: categoryId
  });
}
