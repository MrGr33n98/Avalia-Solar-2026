'use client';

import { useState, useEffect, useCallback } from 'react';
import { Company } from '@/lib/api';
import { toast } from 'sonner';

const STORAGE_KEY = 'ab01_comparison_list';
const MAX_COMPARISON = 3;

export function useComparison() {
  const [comparisonList, setComparisonList] = useState<Company[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setComparisonList(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse comparison list', e);
      }
    }
  }, []);

  // Save to localStorage when list changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comparisonList));
  }, [comparisonList]);

  const addToComparison = useCallback((company: Company) => {
    setComparisonList((prev) => {
      if (prev.find((c) => c.id === company.id)) {
        toast.info(`${company.name} já está na lista de comparação.`);
        return prev;
      }
      if (prev.length >= MAX_COMPARISON) {
        toast.warning(`Você só pode comparar até ${MAX_COMPARISON} empresas.`);
        return prev;
      }
      toast.success(`${company.name} adicionada à comparação.`);
      return [...prev, company];
    });
  }, []);

  const removeFromComparison = useCallback((companyId: number) => {
    setComparisonList((prev) => prev.filter((c) => c.id !== companyId));
  }, []);

  const clearComparison = useCallback(() => {
    setComparisonList([]);
  }, []);

  const isInComparison = useCallback((companyId: number) => {
    return comparisonList.some((c) => c.id === companyId);
  }, [comparisonList]);

  return {
    comparisonList,
    addToComparison,
    removeFromComparison,
    clearComparison,
    isInComparison,
    isFull: comparisonList.length >= MAX_COMPARISON
  };
}
