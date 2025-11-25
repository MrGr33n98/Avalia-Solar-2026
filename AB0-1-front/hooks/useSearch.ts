'use client';

import { useState } from 'react';
import { searchApi, Company, Product, Article } from '@/lib/api';

export interface SearchResults {
  companies: Company[];
  products: Product[];
  articles: Article[];
  categories?: any[];
}

export function useSearch() {
  const [results, setResults] = useState<SearchResults>({
    companies: [],
    products: [],
    articles: [],
    categories: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (query: string) => {
    if (!query.trim()) {
      setResults({ companies: [], products: [], articles: [], categories: [] });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await searchApi.all(query);
      
      setResults({
        companies: response.companies || [],
        products: response.products || [],
        articles: response.articles || [],
        categories: response.categories || [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const getTotalResults = () => {
    return results.companies.length + results.products.length + results.articles.length;
  };

  return {
    results,
    loading,
    error,
    search,
    getTotalResults,
  };
}