'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchApiSafe } from '@/lib/api-client';
import { CategoryTreeNode } from '@/types';
export type { CategoryTreeNode };

export function useCategoriesTree() {
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTree = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Chamada protegida para evitar crashes globais
      // Passamos um catch interno para logar o tipo de erro e retornar array vazio se falhar
      const data = await fetchApiSafe<CategoryTreeNode[]>('/categories/tree').catch(err => {
        const isUpstream = err?.status === 502 || err?.status === 504;
        const isNotFound = err?.status === 404;
        
        console.warn(`[useCategoriesTree] ${isUpstream ? 'Upstream/API Error' : isNotFound ? 'Route Not Found' : 'Fetch Error'}:`, {
          status: err?.status,
          message: err?.message,
          endpoint: '/categories/tree'
        });
        
        // Se for erro temporário de API (502/504/500), mantemos o erro no state para feedback
        // mas o hook continua a execução para retornar o que tiver (mesmo que seja [])
        if (err?.status >= 500) {
          setError(err);
        }
        
        return [];
      });
      
      // Garantir que data seja sempre um array antes de ordenar
      // Se data for null ou undefined (pode vir de comportamentos inesperados do fetchApiSafe), fallback para []
      const safeData = Array.isArray(data) ? data : [];
      
      // Ordenação segura (com proteção para campos nulos)
      const sortedData = [...safeData].sort((a, b) => {
        const aCount = a?.companies_count || 0;
        const bCount = b?.companies_count || 0;
        return bCount - aCount;
      });
      
      setCategories(sortedData);
    } catch (err) {
      console.error('[useCategoriesTree] Critical error in hook logic:', err);
      // Erros críticos de lógica (ex: erro no sort ou parse)
      setError(err instanceof Error ? err : new Error('Failed to process categories tree'));
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
