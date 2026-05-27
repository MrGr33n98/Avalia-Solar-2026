'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { companiesApi, type CompanyFeatureAccessResponse, type FeatureAccessEntry } from '@/lib/api';

type FeatureAccessMap = Record<string, FeatureAccessEntry>;

const CACHE_TTL_MS = 300_000;
const cache = new Map<string, { data: CompanyFeatureAccessResponse; timestamp: number }>();

export function invalidateCompanyFeaturesCache(companyId?: number | string | null) {
  if (companyId === null || companyId === undefined) {
    cache.clear();
    return;
  }

  cache.delete(String(companyId));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('company-features-changed', {
        detail: { companyId: String(companyId) },
      })
    );
  }
}

export function useCompanyFeatures(companyId?: number | string | null) {
  const [features, setFeatures] = useState<FeatureAccessMap>({});
  const [response, setResponse] = useState<CompanyFeatureAccessResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(companyId));
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const loadFeatures = useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      if (!companyId) {
        setFeatures({});
        setResponse(null);
        setLoading(false);
        return null;
      }

      const cacheKey = String(companyId);
      const cached = cache.get(cacheKey);
      if (!force && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        setFeatures(cached.data.features || {});
        setResponse(cached.data);
        setError(null);
        setLoading(false);
        return cached.data;
      }

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setLoading(true);
      setError(null);

      try {
        const data = await companiesApi.getFeatureAccess(companyId);
        if (requestIdRef.current !== requestId) return data;

        cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
        });
        setFeatures(data.features || {});
        setResponse(data);
        return data;
      } catch (err: any) {
        if (requestIdRef.current === requestId) {
          console.error('[useCompanyFeatures] Failed to fetch company feature access:', err);
          setError(err?.message || 'Failed to load feature access.');
          setFeatures({});
          setResponse(null);
        }
        return null;
      } finally {
        if (requestIdRef.current === requestId) {
          setLoading(false);
        }
      }
    },
    [companyId]
  );

  useEffect(() => {
    loadFeatures();
  }, [loadFeatures]);

  useEffect(() => {
    if (!companyId || typeof window === 'undefined') return;

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ companyId?: string }>).detail;
      if (!detail?.companyId || detail.companyId === String(companyId)) {
        loadFeatures({ force: true });
      }
    };

    window.addEventListener('company-features-changed', handler);
    return () => window.removeEventListener('company-features-changed', handler);
  }, [companyId, loadFeatures]);

  return {
    features,
    response,
    loading,
    error,
    refetch: () => loadFeatures({ force: true }),
  };
}
