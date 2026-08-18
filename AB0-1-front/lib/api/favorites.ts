import { fetchApi } from '@/lib/api';

export type FavoritableType = 'Company' | 'Product';

export type FavoriteCompany = {
  id: number;
  slug?: string | null;
  name: string;
  logo_url?: string | null;
  city?: string | null;
  state?: string | null;
  verified?: boolean;
  average_rating?: number | null;
  rating_count?: number | null;
};

export type FavoriteProduct = {
  id: number;
  slug?: string | null;
  name: string;
  image_url?: string | null;
  company?: { id: number; slug?: string | null; name: string; logo_url?: string | null } | null;
  category?: { id: number; name: string; seo_url?: string | null } | null;
};

export type Favorite = {
  id: number;
  favoritable_type: FavoritableType;
  favorited_at: string;
  item: FavoriteCompany | FavoriteProduct;
};

export type FavoritesResponse = {
  data: Favorite[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    by_type: Record<string, number>;
  };
};

const encodeType = (type: FavoritableType) => encodeURIComponent(type);

export const favoritesApi = {
  list: (params: { type?: FavoritableType; page?: number; per_page?: number } = {}) =>
    fetchApi<FavoritesResponse>('/favorites', {
      params: { ...params, type: params.type },
    }),
  create: (type: FavoritableType, id: number) =>
    fetchApi<Favorite>('/favorites', {
      method: 'POST',
      body: JSON.stringify({ favoritable_type: type, favoritable_id: id }),
    }),
  remove: (id: number) => fetchApi<void>(`/favorites/${id}`, { method: 'DELETE' }),
  removeByItem: (type: FavoritableType, id: number) =>
    fetchApi<void>('/favorites/by_item', {
      method: 'DELETE',
      body: JSON.stringify({ favoritable_type: type, favoritable_id: id }),
    }),
  status: (type: FavoritableType, ids: number[]) => {
    const query = ids.map((id) => `ids%5B%5D=${id}`).join('&');
    return fetchApi<{ favorites: Record<string, boolean> }>(
      `/favorites/status?type=${encodeType(type)}&${query}`
    );
  },
};
