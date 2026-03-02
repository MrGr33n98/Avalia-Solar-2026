'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';

interface Banner {
  id: number;
  image_url: string;
  link?: string;
  title?: string;
  banner_type: 'rectangular_large' | 'rectangular_small';
  position: 'navbar' | 'sidebar' | 'categories_top' | 'home_top' | 'companies_top' | 'companies_footer' | 'article_footer_cta';
  sponsored?: boolean;
  width?: number | null;
  height?: number | null;
  category_ids?: number[];
}

interface UseBannersOptions {
  position?: string;
  limit?: number;
}

export function useBanners(options?: UseBannersOptions) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBanners() {
      try {
        setLoading(true);
        
        // Constrói a URL com parâmetros
        const params = new URLSearchParams();
        if (options?.position) {
          params.append('position', options.position);
        }
        if (options?.limit) {
          params.append('limit', options.limit.toString());
        }
        
        const queryString = params.toString();
        const url = queryString ? `/banners?${queryString}` : '/banners';
        
        console.log('[useBanners] Fetching:', url);
        const data = await fetchApi<Banner[]>(url);
        console.log('[useBanners] Received:', data?.length || 0, 'banners');
        
        setBanners(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error('[useBanners] Error:', err);
        setError(err?.message || 'Erro ao carregar banners');
        setBanners([]);
      } finally {
        setLoading(false);
      }
    }

    fetchBanners();
  }, [options?.position, options?.limit]);

  return { banners, loading, error };
}
