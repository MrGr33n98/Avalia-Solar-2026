'use client';

import { useEffect } from 'react';
import { track } from '@/lib/analytics/lazy';

export function CreatorAnalytics({ slug, creatorId }: { slug: string; creatorId?: string | number }) {
  useEffect(() => { track('creator_profile_viewed', { creator_slug: slug, creator_id: creatorId }); }, [creatorId, slug]);
  return null;
}
