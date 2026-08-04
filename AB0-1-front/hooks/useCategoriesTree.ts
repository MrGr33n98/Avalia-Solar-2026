'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchApiSafe } from '@/lib/api-client';
import { CategoryTreeNode } from '@/types';
import { getFallbackCategories } from '@/lib/constants/fallback-categories';
export type { CategoryTreeNode };

type ApiLikeError = Error & { status?: number };

type CategoryCardLike = {
  id?: number;
  name?: string;
  seo_url?: string;
  slug?: string;
  companies_count?: number;
  products_count?: number;
  icon_url?: string | null;
  average_rating?: number;
  reviews_count?: number;
  children?: CategoryTreeNode[];
};

const DEFAULT_PUBLIC_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://api.avaliasolar.com.br';

const sortByCompaniesCount = (items: CategoryTreeNode[]) =>
  [...items].sort((a, b) => (b?.companies_count || 0) - (a?.companies_count || 0));

const normalizeTreeNode = (item: any): CategoryTreeNode | null => {
  if (!item || typeof item !== 'object') return null;

  const id = Number(item.id);
  const name = String(item.name || '').trim();
  const slug = String(item.slug || item.seo_url || '').trim();

  if (!Number.isFinite(id) || !name || !slug) return null;

  const children = Array.isArray(item.children)
    ? item.children.map(normalizeTreeNode).filter(Boolean)
    : [];

  return {
    id,
    name,
    slug,
    seo_url: item.seo_url ? String(item.seo_url) : undefined,
    parent_id: item.parent_id ?? null,
    companies_count: Number(item.companies_count || 0),
    products_count: Number(item.products_count || 0),
    icon_url: item.icon_url ? String(item.icon_url) : undefined,
    average_rating: item.average_rating !== undefined ? Number(item.average_rating) : undefined,
    reviews_count: item.reviews_count !== undefined ? Number(item.reviews_count) : undefined,
    children: children as CategoryTreeNode[],
  };
};

const normalizeTreePayload = (payload: unknown): CategoryTreeNode[] => {
  if (!Array.isArray(payload)) return [];
  return sortByCompaniesCount(payload.map(normalizeTreeNode).filter(Boolean) as CategoryTreeNode[]);
};

const normalizeCardsPayload = (payload: unknown): CategoryTreeNode[] => {
  const rawItems = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as any).data)
      ? (payload as any).data
      : [];

  return sortByCompaniesCount(
    rawItems
      .map((item: CategoryCardLike) => {
        const id = Number(item?.id);
        const name = String(item?.name || '').trim();
        const slug = String(item?.seo_url || item?.slug || '').trim();

        if (!Number.isFinite(id) || !name || !slug) return null;

        return {
          id,
          name,
          slug,
          seo_url: item?.seo_url ? String(item.seo_url) : undefined,
          parent_id: null,
          companies_count: Number(item?.companies_count || 0),
          products_count: Number(item?.products_count || 0),
          icon_url: item?.icon_url ? String(item.icon_url) : undefined,
          average_rating: item?.average_rating !== undefined ? Number(item.average_rating) : undefined,
          reviews_count: item?.reviews_count !== undefined ? Number(item.reviews_count) : undefined,
          children: [],
        };
      })
      .filter(Boolean) as CategoryTreeNode[]
  );
};

const getStaticFallbackTree = (): CategoryTreeNode[] =>
  getFallbackCategories(12).map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.seo_url || `categoria-${category.id}`,
    seo_url: category.seo_url,
    parent_id: null,
    companies_count: Number(category.companies_count || 0),
    products_count: Number(category.products_count || 0),
    icon_url: category.icon_url || undefined,
    children: [],
  }));

const buildDirectApiUrl = (path: string) =>
  `${DEFAULT_PUBLIC_API_BASE.replace(/\/+$/, '')}/api/v1/${path.replace(/^\/+/, '')}`;

const fetchDirectJson = async (path: string) => {
  const response = await fetch(buildDirectApiUrl(path), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    const err = new Error(`Direct API request failed for ${path}`) as ApiLikeError;
    err.status = response.status;
    throw err;
  }

  return response.json();
};

const logFetchFailure = (label: string, err: unknown) => {
  console.warn(`[useCategoriesTree] ${label}:`, {
    status: (err as ApiLikeError)?.status,
    message: err instanceof Error ? err.message : String(err),
  });
};

export function useCategoriesTree() {
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTree = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let capturedError: Error | null = null;
      let resolvedCategories: CategoryTreeNode[] = [];

      try {
        resolvedCategories = normalizeTreePayload(await fetchApiSafe<CategoryTreeNode[]>('/categories/tree'));
      } catch (err) {
        capturedError = err instanceof Error ? err : new Error('Failed to fetch categories tree');
        logFetchFailure('Primary tree endpoint failed', err);
      }

      if (resolvedCategories.length === 0) {
        try {
          resolvedCategories = normalizeTreePayload(await fetchDirectJson('/categories/tree'));
        } catch (err) {
          if (!capturedError) capturedError = err instanceof Error ? err : new Error('Failed to fetch direct tree');
          logFetchFailure('Direct tree endpoint failed', err);
        }
      }

      if (resolvedCategories.length === 0) {
        try {
          resolvedCategories = normalizeCardsPayload(
            await fetchApiSafe('/categories?view=cards&status=active&sort_by=companies_count_desc&limit=18')
          );
        } catch (err) {
          if (!capturedError) capturedError = err instanceof Error ? err : new Error('Failed to fetch categories cards');
          logFetchFailure('Cards endpoint fallback failed', err);
        }
      }

      if (resolvedCategories.length === 0) {
        try {
          resolvedCategories = normalizeCardsPayload(
            await fetchDirectJson('/categories?view=cards&status=active&sort_by=companies_count_desc&limit=18')
          );
        } catch (err) {
          if (!capturedError) capturedError = err instanceof Error ? err : new Error('Failed to fetch direct category cards');
          logFetchFailure('Direct cards endpoint fallback failed', err);
        }
      }

      if (resolvedCategories.length === 0) {
        resolvedCategories = getStaticFallbackTree();
      }

      if (capturedError) {
        setError(capturedError);
      }

      setCategories(resolvedCategories);
    } catch (err) {
      console.error('[useCategoriesTree] Critical error in hook logic:', err);
      setError(err instanceof Error ? err : new Error('Failed to process categories tree'));
      setCategories(getStaticFallbackTree());
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
