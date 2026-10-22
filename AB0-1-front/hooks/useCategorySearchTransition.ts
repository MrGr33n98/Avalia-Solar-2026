'use client';

import { useState, useTransition, useMemo, useCallback } from 'react';
import type { CategoryTreeNode } from '@/types';

export function useCategorySearchTransition(
  categories: CategoryTreeNode[],
  filterFn: (tree: CategoryTreeNode[], query: string) => CategoryTreeNode[]
) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isPending, startTransition] = useTransition();
  const [deferredTerm, setDeferredTerm] = useState('');

  const handleSearchChange = useCallback((value: string) => {
    // 1. Instantaneous input state (120 FPS / INP < 16ms)
    setSearchTerm(value);

    // 2. Deferred non-urgent transition for heavy tree filtering
    startTransition(() => {
      setDeferredTerm(value);
    });
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setDeferredTerm('');
  }, []);

  // Filtered tree responds to deferredTerm without blocking typing
  const filteredCategories = useMemo(() => {
    if (!deferredTerm.trim()) return categories;
    return filterFn(categories, deferredTerm);
  }, [categories, deferredTerm, filterFn]);

  return {
    searchTerm,
    isSearching: isPending,
    filteredCategories,
    handleSearchChange,
    clearSearch,
  };
}
