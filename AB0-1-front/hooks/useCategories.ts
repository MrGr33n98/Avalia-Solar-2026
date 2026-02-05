'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { categoriesApiSafe } from '@/lib/api-client';
import { Category } from '@/lib/api';

type UseCategoriesOptions = {
  initialCategories?: Category[];
  skipFetch?: boolean;
};

export function useCategories(fetchAll: boolean = false, options?: UseCategoriesOptions) {
  const initialCategories = options?.initialCategories ?? [];
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [loading, setLoading] = useState(initialCategories.length === 0);
  const [error, setError] = useState<Error | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = fetchAll 
        ? { status: 'active' } 
        : { featured: true, status: 'active', limit: 8 };
      
      console.log('[useCategories] Loading with params:', params);
      const data = await categoriesApiSafe.getAll(params);
      console.log('[useCategories] Received data:', data);
      
      if (!data || data.length === 0) {
        console.warn('Nenhuma categoria encontrada');
        setCategories([]);
        return;
      }
      setCategories(data);
    } catch (err) {
      console.error('Falha ao carregar categorias:', err);
      setError(err instanceof Error ? err : new Error('Erro interno no servidor'));
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [fetchAll]);

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
