'use client';

import { useEffect, useRef } from 'react';
import { publicCreatorTreeApi } from '@/lib/api/creatorTree';

export function CreatorTreeViewTracker({ slug }: { slug: string }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    void publicCreatorTreeApi.trackView(slug);
  }, [slug]);

  return null;
}
