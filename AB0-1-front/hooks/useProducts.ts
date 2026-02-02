'use client';

import { useState, useEffect } from 'react';
import type { Product } from '@/lib/api';
import { productsApiSafe } from '@/lib/api-client';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtersMeta, setFiltersMeta] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const [data, filters] = await Promise.all([
          productsApiSafe.getAll({ include_specs: true }),
          productsApiSafe.getFilters()
        ]);
        setProducts((data as unknown as Product[]) || []);
        setFiltersMeta(filters?.filters || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError((err as any)?.message || 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, filtersMeta, loading, error };
}
