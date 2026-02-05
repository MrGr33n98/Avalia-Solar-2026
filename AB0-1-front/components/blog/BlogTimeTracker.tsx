'use client';

import * as React from 'react';
import { track } from '@/lib/analytics/lazy';
import { useParams } from 'next/navigation';

export function BlogTimeTracker() {
  const startTime = React.useRef<number>(Date.now());
  const params = useParams();
  const slug = params?.slug as string;
  const trackedThresholds = React.useRef<Set<number>>(new Set());

  React.useEffect(() => {
    startTime.current = Date.now();
    trackedThresholds.current.clear();

    const trackTime = (isCompleted = false) => {
      const timeSpent = Math.floor((Date.now() - startTime.current) / 1000);
      if (timeSpent <= 0) return;

      track('blog_time_on_page', {
        post_slug: slug,
        time_seconds: timeSpent,
        is_completed: isCompleted
      });
    };

    const interval = setInterval(() => {
      const timeSpent = Math.floor((Date.now() - startTime.current) / 1000);
      
      // Track milestones: 30s, 60s, 120s, 300s
      const thresholds = [30, 60, 120, 300];
      thresholds.forEach(threshold => {
        if (timeSpent >= threshold && !trackedThresholds.current.has(threshold)) {
          trackedThresholds.current.add(threshold);
          track('blog_time_milestone', {
            post_slug: slug,
            time_seconds: threshold,
            milestone: `${threshold}s`
          });
        }
      });
    }, 5000);

    const handleBeforeUnload = () => {
      trackTime();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        trackTime();
      } else {
        // Reset start time when coming back to page to avoid counting background time
        // This is a simplification, but better than over-counting
        startTime.current = Date.now();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      trackTime();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [slug]);

  return null;
}
