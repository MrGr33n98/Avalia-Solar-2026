'use client';

import { useEffect, useRef } from 'react';
import { 
  trackFormHesitation, 
  trackHoverIntent, 
  trackScrollPause 
} from '../analytics/micro-interactions';

// Form Hesitation Hook
export const useFormHesitation = (fieldName: string) => {
  const startTime = useRef<number | null>(null);
  const valueHistory = useRef<string[]>([]);

  const onFocus = () => {
    startTime.current = Date.now();
  };

  const onChange = (value: string) => {
    valueHistory.current.push(value);
  };

  const onBlur = (value: string) => {
    if (!startTime.current) return;
    
    const duration = Date.now() - startTime.current;
    const hadHesitation = valueHistory.current.length > 3; // Changed mind 3+ times
    
    if (hadHesitation || duration > 30000) { // 30s threshold
      trackFormHesitation(fieldName, duration);
    }
    
    startTime.current = null;
    valueHistory.current = [];
  };

  return { onFocus, onChange, onBlur };
};

// Hover Intent Hook
export const useHoverIntent = (elementId: string) => {
  const hoverStart = useRef<number | null>(null);

  const onMouseEnter = () => {
    hoverStart.current = Date.now();
  };

  const onMouseLeave = () => {
    if (!hoverStart.current) return;
    
    const duration = Date.now() - hoverStart.current;
    trackHoverIntent(elementId, duration);
    
    hoverStart.current = null;
  };

  return { onMouseEnter, onMouseLeave };
};

// Scroll Pause Hook
export const useScrollPause = (sectionId: string) => {
  const pauseStart = useRef<number | null>(null);
  const pauseTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      // Reset timer on scroll
      if (pauseTimer.current) {
        clearTimeout(pauseTimer.current);
      }
      
      pauseStart.current = Date.now();
      
      // Set 3s timer
      pauseTimer.current = setTimeout(() => {
        const duration = Date.now() - (pauseStart.current || 0);
        trackScrollPause(sectionId, duration);
      }, 3000);
    };

    const element = document.getElementById(sectionId);
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            pauseStart.current = Date.now();
            window.addEventListener('scroll', handleScroll);
          } else {
            window.removeEventListener('scroll', handleScroll);
            if (pauseTimer.current) clearTimeout(pauseTimer.current);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
      if (pauseTimer.current) clearTimeout(pauseTimer.current);
    };
  }, [sectionId]);
};
