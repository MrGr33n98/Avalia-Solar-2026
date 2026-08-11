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

const withBannerTimeout = <T>(promise: Promise<T>, timeoutMs = BANNER_REQUEST_TIMEOUT_MS) => {
  let timeoutId: number | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error('Banner request timed out')), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  });
};

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

  return useQuery<Banner[]>({
    queryKey: [
      'banners',
      { position, limit, category_id, company_id, slot_key, state, city, audienceKey },
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

      const response = await withBannerTimeout(
        api.request<unknown>({
          url: `/banners?${params.toString()}`,
          method: 'GET',
        })
      );
      return normalizeBanners(response.data);
    },
    enabled,
    initialData,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
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
