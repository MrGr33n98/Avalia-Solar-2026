'use client';

import * as React from 'react';
import { track } from '@/lib/analytics';
import { useParams } from 'next/navigation';

export function ReadingProgress() {
  const [progress, setProgress] = React.useState(0);
  const trackedThresholds = React.useRef<Set<number>>(new Set());
  const params = useParams();
  const slug = params?.slug as string;

  React.useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      
      const scrollPercent = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));
      setProgress(scrollPercent);

      // Track milestones: 25%, 50%, 75%, 90%, 100%
      const thresholds = [25, 50, 75, 90, 100];
      thresholds.forEach(threshold => {
        if (scrollPercent >= threshold && !trackedThresholds.current.has(threshold)) {
          trackedThresholds.current.add(threshold);
          track('blog_scroll_depth', {
            post_slug: slug,
            scroll_percentage: threshold,
            scroll_milestone: `${threshold}%`
          });
        }
      });
    };

    window.addEventListener('scroll', updateProgress, { passive: true });
    return () => window.removeEventListener('scroll', updateProgress);
  }, [slug]);

  return (
    <div className="fixed top-0 left-0 w-full z-50 h-1 bg-transparent">
      <div 
        className="h-full bg-primary transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
