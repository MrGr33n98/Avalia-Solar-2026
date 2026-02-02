'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchApiSafe } from '@/lib/api-client';

export interface CategoryTreeNode {
  id: number;
  name: string;
  slug: string;
  seo_url?: string;
  parent_id: number | null;
  companies_count: number;
  products_count: number;
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
      
      // Ordenar categorias raiz por companies_count desc
      const sortedData = (data || []).sort((a, b) => (b.companies_count || 0) - (a.companies_count || 0));
      
      setCategories(sortedData);
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

  // Filtragem e busca memoizada
  const filterCategories = useCallback((tree: CategoryTreeNode[], query: string): CategoryTreeNode[] => {
    if (!query) return tree;
    
    const lowerQuery = query.toLowerCase();
    
    return tree.map(node => {
      // Se a própria categoria bate na busca
      const matches = node.name.toLowerCase().includes(lowerQuery);
      
      // Filtrar filhos recursivamente
      const filteredChildren = filterCategories(node.children || [], query);
      
      // Retornar o nó se ele bate ou se algum filho bate
      if (matches || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren
        };
      }
      return null;
    }).filter(Boolean) as CategoryTreeNode[];
  }, []);

  return {
    categories,
    loading,
    error,
    refresh: fetchTree,
    filterCategories
  };
}
