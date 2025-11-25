import { useState, useEffect } from 'react';
import type { Product } from '@/lib/api';
import { productsApi } from '@/lib/api';

export function useProduct(id: number | string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      let productId: number | null = null;
      if (typeof id === 'string') {
        const idPart = id.split('-')[0];
        const parsed = parseInt(idPart, 10);
        productId = isNaN(parsed) ? null : parsed;
      } else {
        productId = id;
      }
      
      if (!productId || isNaN(productId)) {
        setError('Invalid product ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await productsApi.getById(productId);
        setProduct(data as Product);
        setError(null);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  return { product, loading, error };
}
