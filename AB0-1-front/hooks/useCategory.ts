'use client';

import { useState, useEffect } from 'react';
import { Category } from '@/lib/api';
import { categoriesApiSafe } from '@/lib/api-client';

export function useCategory(identifier: number | string) {
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true);
        let data;
        if (typeof identifier === 'number') {
          data = await categoriesApiSafe.getById(identifier);
        } else {
          data = await categoriesApiSafe.getBySlug(identifier);
        }
        setCategory(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(`Falha ao buscar categoria ${identifier}`));
        console.error(`Erro ao buscar categoria ${identifier}:`, err);
      } finally {
        setLoading(false);
      }
    };

    if (identifier) {
      fetchCategory();
    } else {
      setLoading(false);
      setCategory(null);
    }
  }, [identifier]);

  return { category, loading, error };
}
