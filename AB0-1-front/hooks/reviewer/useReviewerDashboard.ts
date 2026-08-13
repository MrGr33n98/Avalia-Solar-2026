import { useCallback, useEffect, useState } from 'react';
import { reviewDashboardApi } from '@/lib/api';
import type { ReviewerDashboard } from '@/types/reviewer';

export function useReviewerDashboard() {
  const [data, setData] = useState<ReviewerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cacheKey = 'reviewer-dashboard-snapshot-v1';

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fresh = await reviewDashboardApi.getDashboard();
      setData(fresh);
      if (typeof window !== 'undefined') window.localStorage.setItem(cacheKey, JSON.stringify(fresh));
    } catch (err) {
      const cached = typeof window !== 'undefined' ? window.localStorage.getItem(cacheKey) : null;
      if (cached) setData(JSON.parse(cached));
      setError(err instanceof Error ? err.message : 'Não foi possível carregar seu dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}
