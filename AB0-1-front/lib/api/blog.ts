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
  slug: string;
  count: number;
}

export interface FeaturedPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  cover_image_url: string | null;
  category?: { name: string; slug: string; id: number };
  author?: { name: string; avatar_url: string | null };
  published_at: string;
  reading_time?: number;
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
      return res.json();
    } catch (error) {
      console.error(error);
      return { data: [], meta: { page: 1, per_page: 10, total: 0, total_pages: 0 } };
    }
  },

  async fetchFeatured(): Promise<FeaturedPost[]> {
    try {
      const res = await fetch(buildApiUrl('articles/featured'), {
        headers: getApiRequestHeaders(),
        next: { revalidate: 300 }
      });
      if (!res.ok) return [];
      return res.json();
    } catch (error) {
      // Fallback to fetching latest posts if featured endpoint missing
      const latest = await this.fetchPosts({ per_page: 3 });
      return latest.data as unknown as FeaturedPost[];
    }
  },

  async fetchCategories(): Promise<CategoryWithCount[]> {
    try {
      const res = await fetch(buildApiUrl('categories'), {
        headers: getApiRequestHeaders(),
        next: { revalidate: 3600 }
      });
      if (!res.ok) return [];
      return res.json();
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
      const res = await fetch(buildApiUrl('companies/verified?limit=3'), {
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
