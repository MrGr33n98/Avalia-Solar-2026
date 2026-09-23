'use client';

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { companyDashboardApi, CompanyAnalyticsOverview } from '@/lib/api';

interface UseCompanyAnalyticsOptions {
  companyId?: string | number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  from?: string;
  to?: string;
  preset?: '7d' | '30d' | '90d' | 'custom';
  timezone?: string;
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
  preset,
  timezone = 'America/Sao_Paulo',
}: UseCompanyAnalyticsOptions = {}): UseCompanyAnalyticsResult {
  const query = useQuery<CompanyAnalyticsOverview, Error>({
    queryKey: ['analytics-overview', companyId ?? null, from ?? null, to ?? null, preset ?? null, timezone],
    queryFn: () =>
      from && to
        ? companyDashboardApi.getAnalyticsOverview(companyId, { from, to, preset, timezone })
        : companyDashboardApi.getAnalyticsOverview(companyId),
    enabled: Boolean(companyId),
    staleTime: 30_000,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  const refresh = useCallback(async () => {
    await query.refetch();
  }, [query]);

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refresh,
  };
}
