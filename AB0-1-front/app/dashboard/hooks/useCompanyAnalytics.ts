'use client';

import { useEffect, useState } from 'react';
import { companyDashboardApi, CompanyAnalyticsOverview } from '@/lib/api';

interface UseCompanyAnalyticsOptions {
  companyId?: string | number;
  autoRefresh?: boolean;
  refreshInterval?: number;
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
}: UseCompanyAnalyticsOptions = {}): UseCompanyAnalyticsResult {
  const [data, setData] = useState<CompanyAnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const result = await companyDashboardApi.getAnalyticsOverview(companyId);
      setData(result);
    } catch (err: any) {
      console.error('[useCompanyAnalytics] Error fetching analytics:', err);
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setLoading(true);
    await fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, companyId]);

  return { data, loading, error, refresh };
}
