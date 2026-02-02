'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchApiSafe } from '@/lib/api-client';

export interface CategoryTreeNode {
  id: number;
  name: string;
  slug: string;
  icon_url?: string;
  children: CategoryTreeNode[];
}

export function useCategoriesTree() {
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTree = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchApiSafe<CategoryTreeNode[]>('/categories/tree');
      setCategories(data || []);
    } catch (err) {
      console.error('[useCategoriesTree] Error fetching categories tree:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch categories tree'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  return {
    categories,
    loading,
    error,
    refresh: fetchTree
  };
}
