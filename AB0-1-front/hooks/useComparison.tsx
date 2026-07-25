'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Company } from '@/lib/api';
import { toast } from 'sonner';
import { CheckCircle2, Info, AlertTriangle, Trash2 } from 'lucide-react';

const STORAGE_KEY = 'ab01_comparison_list';
const MAX_COMPARISON = 4;

// Event system for cross-component communication
const comparisonEvents = new EventTarget();

export function useComparison() {
  const [comparisonList, setComparisonList] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const skipEmitRef = useRef(false); // evita loop de eventos entre instâncias

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate the data structure - more flexible validation
        if (Array.isArray(parsed)) {
          const validCompanies = parsed.filter(
            (item) =>
              item &&
              (typeof item.id === 'number' || typeof item.id === 'string') &&
              typeof item.name === 'string'
          );
          setComparisonList(validCompanies.slice(0, MAX_COMPARISON));
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      console.error('Failed to parse comparison list', e);
      localStorage.removeItem(STORAGE_KEY); // Clear corrupted data
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save to localStorage when list changes (evitando re-emissão em updates sincronizados)
  useEffect(() => {
    if (isLoading) return;

    // Atualização veio de outro hook via evento, apenas consome e sai
    if (skipEmitRef.current) {
      skipEmitRef.current = false;
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(comparisonList));
      comparisonEvents.dispatchEvent(
        new CustomEvent('comparison-updated', {
          detail: { companies: comparisonList },
        })
      );
    } catch (e) {
      console.error('Failed to save comparison list', e);
    }
  }, [comparisonList, isLoading]);

  // Sincroniza instâncias do hook na mesma aba via EventTarget
  useEffect(() => {
    const handleSync = (event: Event) => {
      const detail = (event as CustomEvent)?.detail?.companies as Company[] | undefined;
      if (!detail) return;

      // Evita sobrescrever quando lista já está igual
      const sameLength = detail.length === comparisonList.length;
      const sameIds = sameLength && detail.every((c, idx) => comparisonList[idx]?.id === c.id);
      if (sameLength && sameIds) return;

      skipEmitRef.current = true;
      setComparisonList(detail);
    };

    comparisonEvents.addEventListener('comparison-updated', handleSync as EventListener);
    return () => {
      comparisonEvents.removeEventListener('comparison-updated', handleSync as EventListener);
    };
  }, [comparisonList]);

  const addToComparison = useCallback((company: Company) => {
    setComparisonList((prev) => {
      // Check if already exists
      if (prev.find((c) => c.id === company.id)) {
        toast.info('Empresa já adicionada', {
          description: `${company.name} já está na sua lista de comparação.`,
          duration: 3500,
          icon: <Info className="h-5 w-5 text-blue-600" />,
        });
        return prev;
      }

      // Check limit
      if (prev.length >= MAX_COMPARISON) {
        toast.warning('Limite atingido', {
          description: `Você só pode comparar até ${MAX_COMPARISON} empresas. Remova uma antes.`,
          duration: 4500,
          icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
        });
        return prev;
      }

      // Add company
      const newList = [...prev, company];

      // Success message - compacta, sem botões, auto-dismiss 2s
      toast.success('Empresa adicionada à comparação', {
        description: `${company.name} • ${newList.length}/${MAX_COMPARISON}`,
        duration: 2000,
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
        classNames: {
          toast: '!rounded-lg !border-emerald-100 !shadow-sm',
        },
      });

      return newList;
    });
  }, []);

  const removeFromComparison = useCallback((companyId: number) => {
    setComparisonList((prev) => {
      const company = prev.find((c) => c.id === companyId);
      const newList = prev.filter((c) => c.id !== companyId);

      if (company) {
        toast.info('Empresa removida', {
          description: `${company.name} foi removida • ${newList.length}/${MAX_COMPARISON} restantes`,
          duration: 3000,
        });
      }

      return newList;
    });
  }, []);

  const clearComparison = useCallback(() => {
    setComparisonList([]);
    toast.success('Lista de comparação limpa', {
      description: 'Todas as empresas foram removidas.',
      duration: 3000,
      icon: (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 ring-2 ring-slate-500/20">
          <Trash2 className="h-5 w-5 text-slate-600" />
        </div>
      ),
    });
  }, []);

  const replaceComparison = useCallback((companies: Company[]) => {
    const uniqueCompanies = companies
      .filter(
        (company, index, list) =>
          company && list.findIndex((item) => item.id === company.id) === index
      )
      .slice(0, MAX_COMPARISON);

    setComparisonList(uniqueCompanies);
  }, []);

  const isInComparison = useCallback(
    (companyId: number) => {
      return comparisonList.some((c) => c.id === companyId);
    },
    [comparisonList]
  );

  const toggleComparison = useCallback(
    (company: Company) => {
      if (isInComparison(company.id)) {
        removeFromComparison(company.id);
      } else {
        addToComparison(company);
      }
    },
    [isInComparison, removeFromComparison, addToComparison]
  );

  const getCompanyPosition = useCallback(
    (companyId: number) => {
      return comparisonList.findIndex((c) => c.id === companyId) + 1;
    },
    [comparisonList]
  );

  const canAddMore = comparisonList.length < MAX_COMPARISON;
  const isEmpty = comparisonList.length === 0;
  const isFull = comparisonList.length >= MAX_COMPARISON;

  // Get premium companies count
  const premiumCount = comparisonList.filter(
    (company) => company.featured || company.plan_status === 'active' || company.has_paid_plan
  ).length;

  return {
    comparisonList,
    addToComparison,
    removeFromComparison,
    clearComparison,
    replaceComparison,
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
    remainingSlots: MAX_COMPARISON - comparisonList.length,
  };
}

// Hook for listening to comparison events
export function useComparisonEvents() {
  type ComparisonEvent =
    | { type: 'update'; data: { companies?: Company[] } }
    | { type: 'open-modal'; data: null };

  const [lastEvent, setLastEvent] = useState<ComparisonEvent | null>(null);

  useEffect(() => {
    const handleComparisonUpdate = (e: CustomEvent<{ companies?: Company[] }>) => {
      setLastEvent({ type: 'update', data: e.detail });
    };

    const handleOpenModal = () => {
      setLastEvent({ type: 'open-modal', data: null });
    };

    comparisonEvents.addEventListener(
      'comparison-updated',
      handleComparisonUpdate as EventListener
    );
    comparisonEvents.addEventListener('open-comparison-modal', handleOpenModal);

    return () => {
      comparisonEvents.removeEventListener(
        'comparison-updated',
        handleComparisonUpdate as EventListener
      );
      comparisonEvents.removeEventListener('open-comparison-modal', handleOpenModal);
    };
  }, []);

  return { lastEvent };
}
