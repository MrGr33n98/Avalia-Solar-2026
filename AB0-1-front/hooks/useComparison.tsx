'use client';

import { useState, useEffect, useCallback, useRef, useMemo, useSyncExternalStore } from 'react';
import { companiesApi, type Company } from '@/lib/api';
import { toast } from 'sonner';
import { CheckCircle2, Info, AlertTriangle, Trash2 } from 'lucide-react';
import {
  COMPARISON_LIMITS,
  COMPARISON_LIMIT_MESSAGES,
  getComparisonLimit,
  getComparisonExperience,
  ComparisonExperience,
} from '@/lib/comparison/config';

import {
  COMPARISON_STORAGE_KEY,
  parseStoredComparisonIds,
  serializeComparisonIds,
} from '@/lib/comparison/comparison-storage';

const STORAGE_KEY = COMPARISON_STORAGE_KEY;

// Event system for cross-component communication
const comparisonEvents = new EventTarget();

const MOBILE_QUERY = '(max-width: 767px)';

function subscribeComparisonViewport(onChange: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const media = window.matchMedia(MOBILE_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

const getIsMobileComparison = () =>
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia(MOBILE_QUERY).matches
    : false;

const getServerIsMobileComparison = () => false;

export function useComparison() {
  const [comparisonList, setComparisonList] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hydrationError, setHydrationError] = useState(false);
  const [hydrationAttempt, setHydrationAttempt] = useState(0);
  const retryHydration = useCallback(() => setHydrationAttempt((attempt) => attempt + 1), []);
  const isMobile = useSyncExternalStore(
    subscribeComparisonViewport,
    getIsMobileComparison,
    getServerIsMobileComparison
  );
  const skipEmitRef = useRef(false);

  const experience: ComparisonExperience = isMobile ? 'mobile' : 'desktop';
  const maxComparison = isMobile ? COMPARISON_LIMITS.mobile : COMPARISON_LIMITS.desktop;

  // Legacy JSON arrays are migrated to IDs, then fetched from the API.
  // Never trust browser-stored financial terms, ratings, or entitlements.
  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      setIsLoading(true);

      try {
        const storedIds = parseStoredComparisonIds(localStorage.getItem(STORAGE_KEY));
        if (storedIds.length === 0) {
          if (!active) return;
          setComparisonList([]);
          setHydrationError(false);
          return;
        }

        // During a staggered deploy the new batch route may not be live yet.
        // Existing detail endpoints still return fresh backend-owned data.
        const snapshot = await companiesApi.getComparisonSnapshots(storedIds)
          .catch(async () => {
            const details = await Promise.all(
              storedIds.map((id) => companiesApi.getById(id))
            );
            // An old backend can resolve public company details, but a partial
            // network failure must never silently delete saved selections.
            if (details.some((item) => !item || item.status !== 'active')) {
              throw new Error('Incomplete comparison fallback');
            }
            return {
              schema_version: 1,
              companies: details as Company[],
              missing_ids: [] as number[],
              refreshed_at: new Date().toISOString(),
            };
          });
        if (!active) return;
        if (snapshot.schema_version !== 1 || !Array.isArray(snapshot.companies)) {
          throw new Error('Unsupported comparison snapshot');
        }

        const available = new Map(snapshot.companies.map((company) => [company.id, company]));
        const restored = storedIds
          .map((id) => available.get(id))
          .filter((company): company is Company => Boolean(company));

        setComparisonList(restored);
        setHydrationError(false);

        if (snapshot.missing_ids?.length) {
          toast.info('Seleção atualizada', {
            description: 'Empresas indisponíveis foram retiradas da comparação.',
          });
        }
      } catch {
        if (!active) return;
        // Do not overwrite the saved IDs or display stale company data.
        setHydrationError(true);
        toast.error('Não foi possível atualizar a comparação.', {
          description: 'Sua seleção foi preservada. Verifique sua conexão e tente novamente.',
          action: { label: 'Tentar novamente', onClick: retryHydration },
        });
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void hydrate();
    return () => { active = false; };
  }, [hydrationAttempt, retryHydration]);

  // Save to localStorage when list changes
  useEffect(() => {
    if (isLoading || hydrationError) return;

    if (skipEmitRef.current) {
      skipEmitRef.current = false;
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, serializeComparisonIds(comparisonList));
      window.dispatchEvent(new Event('avalia:comparison-updated'));
      comparisonEvents.dispatchEvent(
        new CustomEvent('comparison-updated', {
          detail: { companies: comparisonList },
        })
      );
    } catch (e) {
      console.error('Failed to save comparison list', e);
    }
  }, [comparisonList, isLoading, hydrationError]);

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
      if (hydrationError) {
        toast.error('Atualize a comparação antes de adicionar outra empresa.', {
          action: { label: 'Tentar novamente', onClick: retryHydration },
        });
        return;
      }
      setComparisonList((prev) => {
        if (prev.find((c) => c.id === company.id)) {
          toast.info('Empresa já adicionada', {
            description: `${company.name} já está na sua lista de comparação.`,
            duration: 3500,
            icon: <Info className="h-5 w-5 text-blue-600" />,
          });
          return prev;
        }

        const currentLimit = getComparisonLimit();
        const currentExp = getComparisonExperience();

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
    [hydrationError, retryHydration]
  );

  const removeFromComparison = useCallback((companyId: number) => {
    setComparisonList((prev) => {
      const company = prev.find((c) => c.id === companyId);
      const newList = prev.filter((c) => c.id !== companyId);
      const currentLimit = getComparisonLimit();

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
    setHydrationError(false);
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
    setHydrationError(false);
    const currentLimit = getComparisonLimit();
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
    hydrationError,
    retryHydration,
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

