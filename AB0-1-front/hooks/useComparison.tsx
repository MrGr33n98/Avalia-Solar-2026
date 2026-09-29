'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Company } from '@/lib/api';
import { toast } from 'sonner';
import { CheckCircle2, Info, AlertTriangle, Trash2 } from 'lucide-react';
import {
  COMPARISON_LIMITS,
  COMPARISON_LIMIT_MESSAGES,
  getComparisonLimit,
  getComparisonExperience,
  ComparisonExperience,
} from '@/lib/comparison/config';

const STORAGE_KEY = 'ab01_comparison_list';

// Event system for cross-component communication
const comparisonEvents = new EventTarget();

export function useComparison() {
  const [comparisonList, setComparisonList] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  const skipEmitRef = useRef(false);

  // Monitor viewport width
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const experience: ComparisonExperience = getComparisonExperience(windowWidth);
  const maxComparison = getComparisonLimit(windowWidth);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const validCompanies = parsed.filter(
            (item) =>
              item &&
              (typeof item.id === 'number' || typeof item.id === 'string') &&
              typeof item.name === 'string'
          );
          // Deduplicate by id and limit to max desktop allowed (3)
          const deduped: Company[] = [];
          const seen = new Set();
          for (const item of validCompanies) {
            if (!seen.has(item.id)) {
              seen.add(item.id);
              deduped.push(item);
            }
          }
          setComparisonList(deduped.slice(0, COMPARISON_LIMITS.desktop));
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      console.error('Failed to parse comparison list', e);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save to localStorage when list changes
  useEffect(() => {
    if (isLoading) return;

    if (skipEmitRef.current) {
      skipEmitRef.current = false;
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(comparisonList));
      window.dispatchEvent(new Event('avalia:comparison-updated'));
      comparisonEvents.dispatchEvent(
        new CustomEvent('comparison-updated', {
          detail: { companies: comparisonList },
        })
      );
    } catch (e) {
      console.error('Failed to save comparison list', e);
    }
  }, [comparisonList, isLoading]);

  // Sync hook instances across components
  useEffect(() => {
    const handleSync = (event: Event) => {
      const detail = (event as CustomEvent)?.detail?.companies as Company[] | undefined;
      if (!detail) return;

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

  const addToComparison = useCallback(
    (company: Company) => {
      setComparisonList((prev) => {
        if (prev.find((c) => c.id === company.id)) {
          toast.info('Empresa já adicionada', {
            description: `${company.name} já está na sua lista de comparação.`,
            duration: 3500,
            icon: <Info className="h-5 w-5 text-blue-600" />,
          });
          return prev;
        }

        const currentLimit = getComparisonLimit(
          typeof window !== 'undefined' ? window.innerWidth : 1024
        );
        const currentExp = getComparisonExperience(
          typeof window !== 'undefined' ? window.innerWidth : 1024
        );

        if (prev.length >= currentLimit) {
          toast.warning('Limite atingido', {
            description: COMPARISON_LIMIT_MESSAGES[currentExp],
            duration: 4500,
            icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
          });
          return prev;
        }

        const newList = [...prev, company];

        toast.success('Empresa adicionada à comparação', {
          description: `${company.name} • ${newList.length}/${currentLimit}`,
          duration: 2000,
          icon: <CheckCircle2 className="h-4 w-4 text-blue-600" />,
          classNames: {
            toast:
              '!rounded-lg !border-blue-200 !bg-blue-50 !text-blue-950 !shadow-sm',
            description: '!text-blue-700',
          },
        });

        return newList;
      });
    },
    []
  );

  const removeFromComparison = useCallback((companyId: number) => {
    setComparisonList((prev) => {
      const company = prev.find((c) => c.id === companyId);
      const newList = prev.filter((c) => c.id !== companyId);
      const currentLimit = getComparisonLimit(
        typeof window !== 'undefined' ? window.innerWidth : 1024
      );

      if (company) {
        toast.info('Empresa removida', {
          description: `${company.name} foi removida • ${newList.length}/${currentLimit} restantes`,
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
    const currentLimit = getComparisonLimit(
      typeof window !== 'undefined' ? window.innerWidth : 1024
    );
    const uniqueCompanies = companies
      .filter(
        (company, index, list) =>
          company && list.findIndex((item) => item.id === company.id) === index
      )
      .slice(0, currentLimit);

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

  const visibleList = useMemo(
    () => comparisonList.slice(0, maxComparison),
    [comparisonList, maxComparison]
  );

  const hiddenCount = Math.max(0, comparisonList.length - maxComparison);
  const canAddMore = comparisonList.length < maxComparison;
  const isEmpty = comparisonList.length === 0;
  const isFull = comparisonList.length >= maxComparison;

  const premiumCount = comparisonList.filter(
    (company) => company.featured || company.plan_status === 'active' || company.has_paid_plan
  ).length;

  return {
    comparisonList,
    visibleList,
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
    maxComparison,
    experience,
    count: comparisonList.length,
    visibleCount: visibleList.length,
    hiddenCount,
    premiumCount,
    progressPercentage: Math.min(100, (comparisonList.length / maxComparison) * 100),
    remainingSlots: Math.max(0, maxComparison - comparisonList.length),
  };
}

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

