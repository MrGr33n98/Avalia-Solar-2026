import { useEffect, useRef } from 'react';
import { initWebVitalsMonitoring } from '@/lib/web-vitals';

/**
 * Hook to initialize Web Vitals monitoring on component mount
 * Tracks LCP, FID, CLS, FCP, TTFB and reports to analytics
 */
export function useWebVitals() {
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    if (typeof window === 'undefined') return;

    // Initialize monitoring with custom handler
    initWebVitalsMonitoring((metric) => {
      // Send to PostHog if available
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('web_vital', {
          metric_name: metric.name,
          metric_value: metric.value,
          metric_rating: metric.rating,
        });
      }

      // Send to custom analytics endpoint
      if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true') {
        // Batch metrics to avoid excessive requests
        navigator.sendBeacon('/api/v1/analytics/web-vitals', JSON.stringify({
          metric: metric.name,
          value: metric.value,
          rating: metric.rating,
          timestamp: new Date().toISOString(),
          url: window.location.href,
        }));
      }
    });
  }, []);
}

/**
 * Hook to measure component render performance
 * Useful for tracking render times of critical components
 */
export function useRenderMetrics(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (process.env.NODE_ENV === 'development' || renderTime > 50) {
        console.log(`[${componentName}] render time: ${renderTime.toFixed(2)}ms`);
      }

      // Track slow renders
      if (renderTime > 200 && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'slow_component_render', {
          component_name: componentName,
          render_time: Math.round(renderTime),
        });
      }
    };
  }, [componentName]);
}

/**
 * Hook to track data fetching performance
 */
export function useFetchMetrics(queryKey: string[], duration: number) {
  useEffect(() => {
    if (duration > 1000) {
      // Log slow fetches
      console.warn(`Slow fetch detected: ${queryKey.join('.')} took ${duration}ms`);

      // Send to analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'slow_fetch', {
          query_key: queryKey.join('.'),
          duration: Math.round(duration),
        });
      }
    }
  }, [queryKey, duration]);
}
