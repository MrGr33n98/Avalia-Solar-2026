'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useReportWebVitals } from 'next/web-vitals';
import { track } from '@/lib/analytics/lazy';

/** Observability only: this component must never hold up the route tree. */
export function RouteVitalsReporter() {
  const pathname = usePathname();
  const initialRoute = useRef<string | null>(null);

  useReportWebVitals((metric) => {
    if (!['LCP', 'INP', 'CLS', 'FCP', 'TTFB'].includes(metric.name)) return;
    track('web_vital', {
      metric_name: metric.name,
      metric_id: metric.id,
      metric_value: metric.value,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      route: typeof window !== 'undefined' ? window.location.pathname : '/',
      source: 'next_web_vitals',
    });
  });

  useEffect(() => {
    if (!pathname || typeof window === 'undefined') return;
    if (initialRoute.current === null) initialRoute.current = pathname;
    const isColdRoute = initialRoute.current === pathname;
    const firstPaint = isColdRoute
      ? performance.getEntriesByName('first-contentful-paint')[0]
      : undefined;
    performance.mark('route_shell_visible');
    track('route_shell_visible', {
      route: pathname,
      source: firstPaint ? 'fcp_entry' : 'post_hydration_route_effect',
      paint_ms: firstPaint?.startTime,
    });
    const frame = requestAnimationFrame(() => {
      performance.mark('route_interactive');
      track('route_interactive', { route: pathname, source: 'post_hydration_animation_frame' });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}
