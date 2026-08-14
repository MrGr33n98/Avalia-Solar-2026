'use client';
import { useEffect, useState } from 'react';
import { reviewerPublicationsApi } from '@/lib/api/reviewerPublications';
export function usePublicationAutosave({
  draftId,
  payload,
  enabled,
}: {
  draftId?: number;
  payload: Record<string, unknown>;
  enabled: boolean;
}) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  useEffect(() => {
    if (!draftId || !enabled) return;
    setStatus('saving');
    const timer = window.setTimeout(() => {
      reviewerPublicationsApi
        .update(draftId, payload)
        .then(() => setStatus('saved'))
        .catch(() => setStatus('error'));
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [draftId, enabled, payload]);
  return status;
}
