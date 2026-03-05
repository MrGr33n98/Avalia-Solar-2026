'use client';

import { useState, useEffect, useCallback } from 'react';
import { Company } from '@/lib/api';
import { toast } from 'sonner';

const STORAGE_KEY = 'ab01_comparison_list';
const MAX_COMPARISON = 3;

// Event system for cross-component communication
const comparisonEvents = new EventTarget();

export function useComparison() {
  const [comparisonList, setComparisonList] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setIsLoading(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate the data structure
        if (Array.isArray(parsed) && parsed.every(item => item && typeof item.id === 'number')) {
          setComparisonList(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to parse comparison list', e);
      localStorage.removeItem(STORAGE_KEY); // Clear corrupted data
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save to localStorage when list changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(comparisonList));
        // Emit event for other components
        comparisonEvents.dispatchEvent(new CustomEvent('comparison-updated', { 
          detail: { companies: comparisonList } 
        }));
      } catch (e) {
        console.error('Failed to save comparison list', e);
      }
    }
  }, [comparisonList, isLoading]);

  const addToComparison = useCallback((company: Company) => {
    setComparisonList((prev) => {
      // Check if already exists
      if (prev.find((c) => c.id === company.id)) {
        toast.info(`${company.name} já está na lista de comparação.`, {
          description: 'Esta empresa já foi adicionada à sua comparação.'
        });
        return prev;
      }
      
      // Check limit
      if (prev.length >= MAX_COMPARISON) {
        toast.warning(`Você só pode comparar até ${MAX_COMPARISON} empresas.`, {
          description: 'Remova uma empresa primeiro para adicionar outra.'
        });
        return prev;
      }
      
      // Add company
      const newList = [...prev, company];
      
      // Success message with action
      toast.success(`${company.name} adicionada à comparação.`, {
        description: `${newList.length}/${MAX_COMPARISON} empresas selecionadas`,
        action: {
          label: "Ver Comparação",
          onClick: () => {
            // This could trigger the modal or navigate to comparison page
            comparisonEvents.dispatchEvent(new CustomEvent('open-comparison-modal'));
          }
        }
      });
      
      return newList;
    });
  }, []);

  const removeFromComparison = useCallback((companyId: number) => {
    setComparisonList((prev) => {
      const company = prev.find(c => c.id === companyId);
      const newList = prev.filter((c) => c.id !== companyId);
      
      if (company) {
        toast.info(`${company.name} removida da comparação.`, {
          description: `${newList.length}/${MAX_COMPARISON} empresas restantes`
        });
      }
      
      return newList;
    });
  }, []);

  const clearComparison = useCallback(() => {
    setComparisonList([]);
    toast.success('Lista de comparação limpa.', {
      description: 'Todas as empresas foram removidas da comparação.'
    });
  }, []);

  const isInComparison = useCallback((companyId: number) => {
    return comparisonList.some((c) => c.id === companyId);
  }, [comparisonList]);

  const toggleComparison = useCallback((company: Company) => {
    if (isInComparison(company.id)) {
      removeFromComparison(company.id);
    } else {
      addToComparison(company);
    }
  }, [isInComparison, removeFromComparison, addToComparison]);

  const getCompanyPosition = useCallback((companyId: number) => {
    return comparisonList.findIndex(c => c.id === companyId) + 1;
  }, [comparisonList]);

  const canAddMore = comparisonList.length < MAX_COMPARISON;
  const isEmpty = comparisonList.length === 0;
  const isFull = comparisonList.length >= MAX_COMPARISON;

  // Get premium companies count
  const premiumCount = comparisonList.filter(company => 
    company.featured || company.plan_status === 'active' || company.has_paid_plan
  ).length;

  return {
    comparisonList,
    addToComparison,
    removeFromComparison,
    clearComparison,
    isInComparison,
    toggleComparison,
    getCompanyPosition,
    isLoading,
    canAddMore,
    isEmpty,
    isFull,
    maxComparison: MAX_COMPARISON,
    count: comparisonList.length,
    premiumCount,
    // Computed properties for UI
    progressPercentage: (comparisonList.length / MAX_COMPARISON) * 100,
    remainingSlots: MAX_COMPARISON - comparisonList.length
  };
}

// Hook for listening to comparison events
export function useComparisonEvents() {
  const [lastEvent, setLastEvent] = useState<any>(null);

  useEffect(() => {
    const handleComparisonUpdate = (e: any) => {
      setLastEvent({ type: 'update', data: e.detail });
    };

    const handleOpenModal = (e: any) => {
      setLastEvent({ type: 'open-modal', data: null });
    };

    comparisonEvents.addEventListener('comparison-updated', handleComparisonUpdate);
    comparisonEvents.addEventListener('open-comparison-modal', handleOpenModal);

    return () => {
      comparisonEvents.removeEventListener('comparison-updated', handleComparisonUpdate);
      comparisonEvents.removeEventListener('open-comparison-modal', handleOpenModal);
    };
  }, []);

  return { lastEvent };
}
