'use client';

import { useState, useEffect, useRef } from 'react';
import type { Product } from '@/lib/api';
import { productsApiSafe } from '@/lib/api-client';

interface UseProductsParams {
  q?: string;
  category_id?: number | null;
  company_id?: number | null;
  sort?: string;
  page?: number;
  per_page?: number;
  include_specs?: boolean;
}

interface UseProductsResult {
  products: Product[];
  filtersMeta: any[];
  loading: boolean;
  error: string | null;
  total: number;
  totalPages: number;
}

export function useProducts(params?: UseProductsParams): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtersMeta, setFiltersMeta] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const filtersMetaFetched = useRef(false);

  // Stable key for params to avoid infinite loop
  const paramsKey = JSON.stringify(params || {});

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      try {
        setLoading(true);

        // Strip null values before passing to API
        const cleanParams: Record<string, any> = {};
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            if (v !== null && v !== undefined) cleanParams[k] = v;
          });
        }

        const [result, filters] = await Promise.all([
          productsApiSafe.getAllPaginated({ include_specs: false, ...cleanParams }),
          filtersMetaFetched.current ? Promise.resolve(null) : productsApiSafe.getFilters(),
        ]);

        if (cancelled) return;

        setProducts(result.data);
        setTotal(result.meta.total);
        setTotalPages(result.meta.total_pages);

        if (filters) {
          setFiltersMeta(filters?.filters || []);
          filtersMetaFetched.current = true;
        }

        setError(null);
      } catch (err) {
        if (cancelled) return;
        console.error('Error fetching products:', err);
        setError((err as any)?.message || 'An unknown error occurred');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  return { products, filtersMeta, loading, error, total, totalPages };
}
