import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getBannerAudienceKey } from '@/lib/banner-audience';

export interface Banner {
  id: number;
  delivery_id?: string | null;
  title: string;
  alt_text?: string | null;
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
  audience_key?: string;
}

/**
 * Custom hook para buscar banners com React Query
 *
 * @param options - Opções de filtro e configuração
 * @returns Query result com dados, loading, error
 */
const BANNER_REQUEST_TIMEOUT_MS = 5000;
const BANNER_STALE_TIME_MS = 60 * 1000;
const BANNER_GC_TIME_MS = 10 * 60 * 1000;

function normalizeBanners(payload: unknown): Banner[] {
  if (Array.isArray(payload)) return payload as Banner[];
  if (payload && typeof payload === 'object') {
    const envelope = payload as { data?: unknown; banners?: unknown };
    if (Array.isArray(envelope.data)) return envelope.data as Banner[];
    if (Array.isArray(envelope.banners)) return envelope.banners as Banner[];
  }

  throw new Error('Invalid banner response format');
}

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
    initialData,
    audience_key,
  } = options;
  const audienceKey = audience_key || getBannerAudienceKey();

  // Detecta parâmetro de teste para ignorar frequency cap
  let testAdsBypass = false;
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    testAdsBypass = urlParams.get('bypass_caps') === 'true' || urlParams.get('test_ads') === 'true';
  }

  return useQuery<Banner[]>({
    queryKey: [
      'banners',
      { position, limit, category_id, company_id, slot_key, state, city, audienceKey, testAdsBypass },
    ],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (position) params.append('position', position);
      if (limit) params.append('limit', String(limit));
      if (category_id) params.append('category_id', String(category_id));
      if (company_id) params.append('company_id', String(company_id));
      if (slot_key) params.append('slot_key', slot_key);
      if (state) params.append('state', state);
      if (city) params.append('city', city);
      if (audienceKey) params.append('audience_key', audienceKey);
      if (testAdsBypass) params.append('frequency_cap_seconds', '1');

      const response = await api.request<unknown>({
        url: `/banners?${params.toString()}`,
        method: 'GET',
        timeout: BANNER_REQUEST_TIMEOUT_MS,
        cacheTtlMs: BANNER_STALE_TIME_MS,
      });
      return normalizeBanners(response.data);
    },
    enabled,
    initialData,
    staleTime: BANNER_STALE_TIME_MS,
    gcTime: BANNER_GC_TIME_MS,
    retry: (failureCount, error: unknown) => {
      const requestError = error as { status?: number; context?: { status?: number } };
      const status = requestError.status ?? requestError.context?.status;
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
    category_id: categoryId,
  });
}
