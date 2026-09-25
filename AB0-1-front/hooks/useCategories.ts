'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { categoriesApiSafe } from '@/lib/api-client';
import { Category } from '@/lib/api';

type UseCategoriesOptions = {
  initialCategories?: Category[];
  skipFetch?: boolean;
};

const categoriesCache = new Map<string, Category[]>();
const categoriesInFlight = new Map<string, Promise<Category[]>>();

export function useCategories(fetchAll: boolean = false, options?: UseCategoriesOptions) {
  const cacheKey = fetchAll ? 'all' : 'featured';
  const initialCategories = useMemo(
    () => options?.initialCategories ?? categoriesCache.get(cacheKey) ?? [],
    [cacheKey, options?.initialCategories]
  );
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [loading, setLoading] = useState(initialCategories.length === 0);
  const [error, setError] = useState<Error | null>(null);

  const loadCategories = useCallback(async (force = false) => {
    if (!force && categoriesCache.has(cacheKey)) {
      setCategories(categoriesCache.get(cacheKey)!);
      setLoading(false);
      return;
    }

    if (categoriesInFlight.has(cacheKey)) {
      try {
        const data = await categoriesInFlight.get(cacheKey)!;
        setCategories(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erro interno no servidor'));
      } finally {
        setLoading(false);
      }
      return;
    }

    const fetchPromise = (async () => {
      const params = fetchAll 
        ? { status: 'active' } 
        : { featured: true, status: 'active', limit: 8 };
      
      const data = await categoriesApiSafe.getAll(params);
      const safeData = Array.isArray(data) ? data : [];
      categoriesCache.set(cacheKey, safeData);
      return safeData;
    })();

    categoriesInFlight.set(cacheKey, fetchPromise);

    try {
      setLoading(true);
      setError(null);
      const data = await fetchPromise;
      setCategories(data);
    } catch (err) {
      console.error('Falha ao carregar categorias:', err);
      setError(err instanceof Error ? err : new Error('Erro interno no servidor'));
      setCategories([]);
    } finally {
      categoriesInFlight.delete(cacheKey);
      setLoading(false);
    }
  }, [cacheKey, fetchAll]);

  useEffect(() => {
    if (initialCategories.length > 0) {
      setCategories(initialCategories);
      setLoading(false);
    }
  }, [initialCategories]);

  const didRunRef = useRef(false);
  const shouldSkipFetch = Boolean(options?.skipFetch || initialCategories.length > 0);
  useEffect(() => {
    if (shouldSkipFetch) return;
    if (didRunRef.current) return;
    didRunRef.current = true;
    loadCategories();
  }, [loadCategories, shouldSkipFetch]);

  // The search functionality was broken and has been temporarily removed.
  const [searchTerm, setSearchTerm] = useState('');
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    console.warn('Search functionality is temporarily disabled.');
  };

  return {
    categories,
    loading,
    error,
    searchTerm,
    handleSearch,
    refresh: loadCategories
  };
}
