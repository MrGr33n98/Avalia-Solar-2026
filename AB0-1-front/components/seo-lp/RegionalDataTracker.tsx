'use client';

import { useEffect, useRef } from 'react';
import { track } from '@/lib/analytics/lazy';

interface Props {
  location: string;
  category: string;
  estimatedPayback?: number;
}

export function RegionalDataTracker({ location, category, estimatedPayback }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          track('regional_data_exposed', {
            location,
            category,
            estimated_payback: estimatedPayback
          });
          // Track depth too
          track('scroll_depth_reached', {
            depth: 50,
            page_type: 'seo_landing_page',
            location
          });
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [location, category, estimatedPayback]);

  const handleRoiInteraction = () => {
    track('roi_expand', {
      location,
      estimated_payback: estimatedPayback
    });
  };

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 pointer-events-none" 
      onClick={handleRoiInteraction}
      aria-hidden="true"
    />
  );
}
