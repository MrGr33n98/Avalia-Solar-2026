'use client';

import { useCallback, useEffect, useState } from 'react';
import { companyDashboardApi, CompanyAnalyticsOverview } from '@/lib/api';

interface UseCompanyAnalyticsOptions {
  companyId?: string | number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  from?: string;
  to?: string;
}

interface UseCompanyAnalyticsResult {
  data: CompanyAnalyticsOverview | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCompanyAnalytics({
  companyId,
  autoRefresh = true,
  refreshInterval = 30000,
  from,
  to,
}: UseCompanyAnalyticsOptions = {}): UseCompanyAnalyticsResult {
  const [data, setData] = useState<CompanyAnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const result = from && to
        ? await companyDashboardApi.getAnalyticsOverview(companyId, { from, to })
        : await companyDashboardApi.getAnalyticsOverview(companyId);
      setData(result);
    } catch (err: unknown) {
      console.error('[useCompanyAnalytics] Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Não foi possível carregar os dados de analytics');
    } finally {
      setLoading(false);
    }
  }, [companyId, from, to]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      void fetchData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  return { data, loading, error, refresh };
}
