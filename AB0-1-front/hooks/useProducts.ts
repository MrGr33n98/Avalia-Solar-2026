'use client';

import { useState, useEffect, useRef } from 'react';
import type { Product } from '@/lib/api';
import { productsApiSafe } from '@/lib/api-client';

interface UseProductsParams {
  q?: string;
  category_id?: number | null;
  company_id?: number | null;
  brand_id?: number | null;
  price_min?: number | null;
  price_max?: number | null;
  featured?: boolean;
  sort?: string;
  page?: number;
  per_page?: number;
  include_specs?: boolean;
}

export type ProductSpecFilterValue = string | number | boolean | [number, number] | null;

export interface ProductSpecFilterMeta {
  key: string;
  label: string;
  type: string;
  unit?: string | null;
  product_type?: string | null;
  seo_weight?: number | null;
  options?: string[] | boolean[] | { min?: number | null; max?: number | null } | null;
}

export interface ProductCategoryFilter {
  id: number;
  name: string;
  seo_url?: string | null;
  slug?: string | null;
  products_count: number;
}

export interface ProductCompanyFilter {
  id: number;
  name: string;
  slug?: string | null;
  logo_url?: string | null;
  city?: string | null;
  state?: string | null;
  verified?: boolean;
  rating_avg?: number | null;
  reviews_count?: number | null;
  products_count: number;
}

export interface ProductBrandFilter {
  id: number;
  name: string;
  slug?: string | null;
  products_count: number;
}

export interface ProductPriceRange {
  min: number;
  max: number;
}

interface UseProductsResult {
  products: Product[];
  filtersMeta: ProductSpecFilterMeta[];
  categoriesMeta: ProductCategoryFilter[];
  companiesMeta: ProductCompanyFilter[];
  brandsMeta: ProductBrandFilter[];
  priceRangeMeta: ProductPriceRange;
  loading: boolean;
  error: string | null;
  total: number;
  totalPages: number;
}

export function useProducts(params?: UseProductsParams): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtersMeta, setFiltersMeta] = useState<ProductSpecFilterMeta[]>([]);
  const [categoriesMeta, setCategoriesMeta] = useState<ProductCategoryFilter[]>([]);
  const [companiesMeta, setCompaniesMeta] = useState<ProductCompanyFilter[]>([]);
  const [brandsMeta, setBrandsMeta] = useState<ProductBrandFilter[]>([]);
  const [priceRangeMeta, setPriceRangeMeta] = useState<ProductPriceRange>({ min: 0, max: 0 });
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
        const cleanParams: Record<string, string | number | boolean> = {};
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
          setCategoriesMeta(filters?.categories || []);
          setCompaniesMeta(filters?.companies || []);
          setBrandsMeta(filters?.brands || []);
          setPriceRangeMeta(filters?.price_range || { min: 0, max: 0 });
          filtersMetaFetched.current = true;
        }

        setError(null);
      } catch (err) {
        if (cancelled) return;
        console.error('Error fetching products:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
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

  return {
    products,
    filtersMeta,
    categoriesMeta,
    companiesMeta,
    brandsMeta,
    priceRangeMeta,
    loading,
    error,
    total,
    totalPages,
  };
}
