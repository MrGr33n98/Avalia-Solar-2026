'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { track } from '@/lib/analytics/lazy';
import { useRef } from 'react';

/**
 * Web Vitals Reporter Component
 * 
 * Tracks Core Web Vitals metrics and sends to:
 * 1. Analytics (Mixpanel/GA4) after consent
 * 2. Backend endpoint through the shared analytics pipeline
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

    const eventId =
      metric.id ||
      (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `wv-${metric.name}-${Date.now()}`);
    const trackedAt = new Date().toISOString();
    const eventType = 'web_vital';

    // Guardrail: never send malformed tracking payloads
    if (!eventType || !eventId || !trackedAt) return;

    // Send to analytics (respects consent via lazy analytics)
    try {
      track('web_vital', {
        event_id: eventId,
        tracked_at: trackedAt,
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
