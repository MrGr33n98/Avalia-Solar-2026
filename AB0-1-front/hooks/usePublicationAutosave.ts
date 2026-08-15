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
    let active = true;
    setStatus('saving');
    const timer = window.setTimeout(() => {
      reviewerPublicationsApi
        .update(draftId, payload)
        .then(() => active && setStatus('saved'))
        .catch(() => active && setStatus('error'));
    }, 1200);
    return () => { active = false; window.clearTimeout(timer); };
  }, [draftId, enabled, payload]);
  return status;
}
