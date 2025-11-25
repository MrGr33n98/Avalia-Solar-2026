'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';

interface BannerGlobal {
  id: number;
  title: string;
  link: string;
  image_url: string;
}

export function useBannerGlobal() {
  const [bannerGlobal, setBannerGlobal] = useState<BannerGlobal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBannerGlobal() {
      try {
        setLoading(true);
        const data = await fetchApi<BannerGlobal[]>('/banner_globals');
        setBannerGlobal(data.length > 0 ? data[0] : null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBannerGlobal();
  }, []);

  return { bannerGlobal, loading, error };
}
