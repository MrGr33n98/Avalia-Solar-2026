import { useCallback, useEffect, useState } from 'react';
import { leadsApi, type Lead } from '@/lib/api';

export function useReviewerProposals({ enabled = true }: { enabled?: boolean } = {}) {
  const [proposals, setProposals] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProposals(await leadsApi.mine());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar suas propostas.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    void refetch();
  }, [enabled, refetch]);
  return { proposals, loading, error, refetch };
}
