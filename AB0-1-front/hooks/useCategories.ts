'use client';

import { useState, useEffect, useCallback } from 'react';
import { categoriesApiSafe } from '@/lib/api-client';
import { Category } from '@/lib/api';

export function useCategories(fetchAll: boolean = false) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
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
    loadCategories();
  }, [loadCategories]);

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
