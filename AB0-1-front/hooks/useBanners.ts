'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';

interface Banner {
  id: number;
  image_url: string;
  link?: string;
  title?: string;
  banner_type: 'rectangular_large' | 'rectangular_small';
  position: 'navbar' | 'sidebar';
  sponsored?: boolean;
}

export function useBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBanners() {
      try {
        setLoading(true);
        const data = await fetchApi<Banner[]>('/banners');
        setBanners(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBanners();
  }, []);

  return { banners, loading, error };
}
