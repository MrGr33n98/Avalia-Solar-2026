 'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { track } from '@/lib/analytics/lazy';

export function FeedCardFrame({ children, reason, itemId, itemType }: { children: ReactNode; reason?: string; itemId?: string; itemType?: string }) {
  const cardRef = useRef<HTMLElement>(null);
  const tracked = useRef(false);
  const dwellTracked = useRef(false);

  useEffect(() => {
    if (!cardRef.current || tracked.current || !itemId) return;
    let dwellTimer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !tracked.current) {
        tracked.current = true;
        track('post_impression', { feed_item_id: itemId, item_type: itemType });
        observer.disconnect();
      }
      if (entry.isIntersecting && !dwellTracked.current) {
        dwellTimer = setTimeout(() => {
          dwellTracked.current = true;
          track('post_dwell_10s', { feed_item_id: itemId, item_type: itemType });
        }, 10000);
      } else if (!entry.isIntersecting && dwellTimer) {
        clearTimeout(dwellTimer);
        dwellTimer = undefined;
      }
    }, { threshold: 0.5 });
    observer.observe(cardRef.current);
    return () => {
      observer.disconnect();
      if (dwellTimer) clearTimeout(dwellTimer);
    };
  }, [itemId, itemType]);

  return (
    <article
      ref={cardRef}
      onClick={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest('button')) return;
        if (target.closest('a')) track('feed_item_opened', { item_id: itemId, item_type: itemType });
      }}
      className="space-y-3 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm"
    >
      {reason && <p className="text-xs font-medium text-muted-foreground">{reason}</p>}
      {children}
    </article>
  );
}
