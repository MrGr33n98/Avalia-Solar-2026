import { buildApiUrl, getApiRequestHeaders } from '@/lib/api-config';
import { Article } from '@/types/article';

export interface PostsResponse {
  data: Article[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface CategoryWithCount {
  id: number;
  name: string;
  slug?: string;
  seo_url?: string | null;
  count?: number;
  articles_count?: number;
}

export const blogApi = {
  async fetchPosts(params: { page?: number; per_page?: number; q?: string; category?: string; sort?: string } = {}): Promise<PostsResponse> {
    try {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.append('page', String(params.page));
      if (params.per_page) searchParams.append('per_page', String(params.per_page));
      if (params.q) searchParams.append('q', params.q);
      if (params.category) searchParams.append('category_id', params.category); // Adapting to existing API likely expecting category_id
      if (params.sort) searchParams.append('sort', params.sort);

      const res = await fetch(buildApiUrl(`articles?${searchParams.toString()}`), {
        headers: getApiRequestHeaders(),
        next: { revalidate: 300 }
      });

      if (!res.ok) throw new Error('Failed to fetch posts');
      const payload = await res.json();
      const data = Array.isArray(payload) ? payload : payload?.data || [];
      const metaRaw = payload?.meta?.pagination || payload?.meta || {};
      const meta = {
        page: metaRaw.page ?? 1,
        per_page: metaRaw.per_page ?? metaRaw.perPage ?? params.per_page ?? 10,
        total: metaRaw.total ?? 0,
        total_pages: metaRaw.total_pages ?? metaRaw.totalPages ?? 0,
      };
      return { data, meta };
    } catch (error) {
      console.error(error);
      return { data: [], meta: { page: 1, per_page: 10, total: 0, total_pages: 0 } };
    }
  },

  async fetchFeatured(): Promise<Article[]> {
    try {
      const res = await fetch(buildApiUrl('articles?featured=true&per_page=3'), {
        headers: getApiRequestHeaders(),
        next: { revalidate: 300 }
      });
      if (!res.ok) return [];
      const payload = await res.json();
      if (Array.isArray(payload)) return payload;
      return payload?.data || [];
    } catch (error) {
      // Fallback to fetching latest posts if featured endpoint missing
      const latest = await this.fetchPosts({ per_page: 3 });
      return latest.data as Article[];
    }
  },

  async fetchCategories(): Promise<CategoryWithCount[]> {
    try {
      const res = await fetch(buildApiUrl('categories?view=cards&limit=200'), {
        headers: getApiRequestHeaders(),
        next: { revalidate: 3600 }
      });
      if (!res.ok) return [];
      const payload = await res.json();
      const list = Array.isArray(payload) ? payload : payload?.data || [];
      return list.map((item: any) => ({
        id: item.id,
        name: item.name,
        slug: item.seo_url || item.slug || undefined,
        seo_url: item.seo_url || null,
        articles_count: item.articles_count ?? 0,
        count: item.articles_count ?? 0
      }));
    } catch (error) {
      return [];
    }
  },

  async fetchChecklist() {
    // Mock or real endpoint
    return {
      title: 'Checklist Energia Solar',
      description: 'O guia definitivo para não errar na compra.',
      image_url: '/images/checklist-cover.jpg',
      download_url: '#'
    };
  },

  async fetchVerifiedCompanies() {
    // Mock or real endpoint
    try {
      const res = await fetch(buildApiUrl('companies?verified=true&limit=3'), {
        headers: getApiRequestHeaders(),
        next: { revalidate: 3600 }
      });
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [
        { id: 1, name: 'Solarium Energy', rating: 4.9, city: 'São Paulo, SP' },
        { id: 2, name: 'EcoPower', rating: 4.8, city: 'Campinas, SP' },
        { id: 3, name: 'GreenLight', rating: 4.7, city: 'Rio de Janeiro, RJ' }
      ];
    }
  }
};
