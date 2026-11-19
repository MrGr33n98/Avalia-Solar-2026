'use client';

import { useEffect, useRef } from 'react';
import { track } from '@/lib/analytics/lazy';

/**
 * Observes the first React paint following arrival of visible API data.
 * This is a post-hydration upper bound, not a substitute for LCP/element timing.
 */
export function useFirstDataVisible(route: string, count: number, eventName: string) {
  const sentForRoute = useRef<string | null>(null);
  useEffect(() => {
    if (!count || sentForRoute.current === route || typeof window === 'undefined') return;
    const frame = requestAnimationFrame(() => {
      performance.mark('first_data_visible');
      track('first_data_visible', {
        route,
        visible_count: count,
        source: 'post_hydration_animation_frame',
      });
      track(eventName, { route, visible_count: count, source: 'post_hydration_animation_frame' });
      sentForRoute.current = route;
    });
    return () => cancelAnimationFrame(frame);
  }, [route, count, eventName]);
}
