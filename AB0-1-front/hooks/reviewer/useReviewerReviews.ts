import { useCallback, useEffect, useState } from 'react';
import { reviewsApi, type Review } from '@/lib/api';

export function useReviewerReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const result = await reviewsApi.listMine({ per_page: 50 });
      setReviews(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar suas avaliações.');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void refetch(); }, [refetch]);
  return { reviews, loading, error, refetch };
}
