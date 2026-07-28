'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { track } from '@/lib/analytics/lazy';
import type { Product } from '../types';

export type CatalogFilters = {
  q?: string;
  status?: string;
  category_id?: string;
  media?: 'with_images' | 'without_images';
  stock?: 'available' | 'unavailable';
};

export type CatalogStats = {
  total: number;
  published: number;
  drafts: number;
  archived: number;
  disabled: number;
  without_images: number;
  without_specifications: number;
  without_price: number;
  unavailable_stock: number;
};

export type ProductInput = {
  name: string;
  sku: string;
  description: string;
  short_description?: string;
  price: number;
  stock?: number;
  status: 'draft' | 'active' | 'archived' | 'disabled';
  category_ids: string[];
  image_url?: string;
  images?: File[];
};

type ProductsResponse = {
  data?: Product[];
  meta?: { stats?: CatalogStats; pagination?: { total?: number; page?: number; total_pages?: number } };
};

const EMPTY_STATS: CatalogStats = {
  total: 0,
  published: 0,
  drafts: 0,
  archived: 0,
  disabled: 0,
  without_images: 0,
  without_specifications: 0,
  without_price: 0,
  unavailable_stock: 0,
};

function toFormData(input: ProductInput) {
  const payload = new FormData();
  payload.append('product[name]', input.name);
  payload.append('product[sku]', input.sku);
  payload.append('product[description]', input.description);
  payload.append('product[short_description]', input.short_description || '');
  payload.append('product[price]', String(input.price));
  payload.append('product[stock]', String(input.stock ?? 0));
  payload.append('product[featured]', String(Boolean(input.featured)));
  if (input.image_url !== undefined) {
    payload.append('product[image_url]', input.image_url);
  }
  input.category_ids.forEach((id) => payload.append('product[category_ids][]', id));
  input.images?.forEach((image) => payload.append('product[images][]', image));
  return payload;
}

export function useProducts(_companyId: string) {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<CatalogStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CatalogFilters>({});

  const fetchProducts = useCallback(async (nextFilters: CatalogFilters = filters) => {
    try {
      setLoading(true);
      const data = await fetchApi<ProductsResponse>('/dashboard/products', {
        params: { per_page: 100, ...nextFilters },
      });
      setProducts((data?.data || []).map((product) => ({ ...product, id: String(product.id) })));
      setStats(data?.meta?.stats || EMPTY_STATS);
    } catch {
      setProducts([]);
      setStats(EMPTY_STATS);
      toast({
        title: 'Não foi possível carregar o catálogo',
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    fetchProducts(filters);
  // A atualização deve ocorrer somente quando os filtros aplicados mudarem.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const applyFilters = useCallback((nextFilters: CatalogFilters) => {
    setFilters(nextFilters);
  }, []);

  const addProduct = async (input: ProductInput) => {
    const response = await fetchApi<{ product: Product }>('/dashboard/products', {
      method: 'POST',
      body: toFormData(input),
    });
    track('Product Action', { action: 'create', product_id: response.product.id });
    await fetchProducts(filters);
    return response.product;
  };

  const updateProduct = async (productId: string, input: ProductInput) => {
    const response = await fetchApi<{ product: Product }>(`/dashboard/products/${productId}`, {
      method: 'PATCH',
      body: toFormData(input),
    });
    track('Product Action', { action: 'update', product_id: productId });
    await fetchProducts(filters);
    return response.product;
  };

  const archiveProduct = async (productId: string) => {
    await fetchApi(`/dashboard/products/${productId}`, { method: 'DELETE' });
    track('Product Action', { action: 'archive', product_id: productId });
    await fetchProducts(filters);
  };

  return {
    products,
    stats,
    loading,
    filters,
    refresh: () => fetchProducts(filters),
    applyFilters,
    addProduct,
    updateProduct,
    archiveProduct,
  };
}
