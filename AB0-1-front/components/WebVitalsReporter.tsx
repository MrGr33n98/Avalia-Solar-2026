'use client';

import { getDeviceClass, getPageTemplateInfo } from '@/lib/analytics/page-template';
import { useReportWebVitals } from 'next/web-vitals';
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();

  useReportWebVitals((metric) => {
    // Prevent duplicate sends
    if (sentMetrics.current.has(metric.id)) return;
    sentMetrics.current.add(metric.id);

    const pagePath = pathname || (typeof window !== 'undefined' ? window.location.pathname : '/');
    const pageTemplate = getPageTemplateInfo(pagePath);
    const deviceClass = getDeviceClass(
      typeof window !== 'undefined' ? window.innerWidth : undefined
    );
    const displayMode =
      typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches
        ? 'standalone'
        : 'browser';
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : undefined;
    const dashboardTab =
      typeof window !== 'undefined' && pagePath.startsWith('/dashboard')
        ? new URLSearchParams(window.location.search).get('tab') || 'overview'
        : undefined;
    const eventId =
      metric.id ||
      (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `wv-${metric.name}-${Date.now()}`);
    const trackedAt = new Date().toISOString();
    const eventType = 'web_vitals';

    // Guardrail: never send malformed tracking payloads
    if (!eventType || !eventId || !trackedAt) return;

    // Send to analytics (respects consent via lazy analytics)
    try {
      track(
        'web_vitals',
        {
          event_id: eventId,
          tracked_at: trackedAt,
          metric_name: metric.name,
          metric_value: metric.value,
          metric_rating: metric.rating,
          metric_id: metric.id,
          navigation_type: metric.navigationType,
          page_template: pageTemplate.template,
          page_path: pagePath,
          normalized_path: pageTemplate.normalizedPath,
          device_class: deviceClass,
          display_mode: displayMode,
          viewport_width: viewportWidth,
          dashboard_tab: dashboardTab,
        },
        { critical: false, sendTo: { backend: false } }
      );
    } catch (error) {
      console.warn('[WebVitals] Failed to track:', error);
    }

    const payload = {
      id: metric.id,
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      navigationType: metric.navigationType,
      url: pagePath,
      pageTemplate: pageTemplate.template,
      normalizedPath: pageTemplate.normalizedPath,
      deviceClass,
      displayMode,
      viewportWidth,
      dashboardTab,
      timestamp: Date.now(),
    };

    try {
      const body = JSON.stringify(payload);

      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        navigator.sendBeacon(
          '/api/v1/analytics/web-vitals',
          new Blob([body], { type: 'application/json' })
        );
      } else {
        void fetch('/api/v1/analytics/web-vitals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        }).catch(() => {
          // Ignore network errors silently
        });
      }
    } catch {
      // Ignore beacon errors silently
    }

    // Development logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[WebVitals] ${metric.name}:`, {
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
        pageTemplate: pageTemplate.template,
        normalizedPath: pageTemplate.normalizedPath,
        deviceClass,
      });
    }
  });

  return null;
}
