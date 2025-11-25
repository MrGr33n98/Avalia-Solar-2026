import { useState, useEffect, useCallback } from 'react';
import { categoriesApiSafe } from '@/lib/api-client';
import { Category } from '@/lib/api';

export function useCategoryByIdOrSlug(identifier: string | number | null) {
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadCategory = useCallback(async () => {
    if (!identifier) {
      setCategory(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      let fetchedCategory: Category | null = null;

      if (typeof identifier === 'number' || (typeof identifier === 'string' && !isNaN(Number(identifier)))) {
        // Assume it's an ID if it's a number or a string that can be converted to a number
        fetchedCategory = await categoriesApiSafe.getById(Number(identifier));
      } else if (typeof identifier === 'string') {
        // Otherwise, assume it's a slug
        fetchedCategory = await categoriesApiSafe.getBySlug(identifier);
      }
      
      setCategory(fetchedCategory);
    } catch (err) {
      console.error(`Falha ao carregar categoria com identificador ${identifier}:`, err);
      setError(err instanceof Error ? err : new Error('Erro interno no servidor'));
      setCategory(null);
    } finally {
      setLoading(false);
    }
  }, [identifier]);

  useEffect(() => {
    loadCategory();
  }, [loadCategory]);

  return {
    category,
    loading,
    error,
    refresh: loadCategory,
  };
}