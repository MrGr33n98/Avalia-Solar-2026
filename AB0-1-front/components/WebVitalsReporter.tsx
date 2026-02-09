'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { track } from '@/lib/analytics/lazy';
import { useEffect, useRef } from 'react';

/**
 * Web Vitals Reporter Component
 * 
 * Tracks Core Web Vitals metrics and sends to:
 * 1. Analytics (Mixpanel/GA4) after consent
 * 2. Backend endpoint via sendBeacon (non-blocking)
 * 
 * Metrics tracked:
 * - LCP (Largest Contentful Paint)
 * - INP (Interaction to Next Paint)
 * - CLS (Cumulative Layout Shift)
 * - FCP (First Contentful Paint)
 * - TTFB (Time to First Byte)
 */
export default function WebVitalsReporter() {
  const sentMetrics = useRef(new Set<string>());

  useReportWebVitals((metric) => {
    // Prevent duplicate sends
    if (sentMetrics.current.has(metric.id)) return;
    sentMetrics.current.add(metric.id);

    const payload = {
      event_type: 'web_vital',
      metadata: {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
        navigationType: metric.navigationType,
        url: typeof window !== 'undefined' ? window.location.href : '',
        timestamp: Date.now()
      }
    };
    const body = JSON.stringify(payload);

    // Send to backend (non-blocking, survives page unload)
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      try {
        navigator.sendBeacon('/api/v1/analytics/track', body);
      } catch (error) {
        console.warn('[WebVitals] Failed to send beacon:', error);
      }
    }

    // Send to analytics (respects consent via lazy analytics)
    try {
      track('web_vital', {
        metric_name: metric.name,
        metric_value: metric.value,
        metric_rating: metric.rating,
        metric_id: metric.id,
        navigation_type: metric.navigationType
      }, { critical: false });
    } catch (error) {
      console.warn('[WebVitals] Failed to track:', error);
    }

    // Development logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[WebVitals] ${metric.name}:`, {
        value: metric.value,
        rating: metric.rating,
        id: metric.id
      });
    }
  });

  return null;
}
