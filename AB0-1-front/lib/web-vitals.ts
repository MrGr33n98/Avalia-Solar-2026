// ✅ Core Web Vitals monitoring for performance tracking

type MetricHandler = (metric: {
  name: string;
  value: number;
  id: string;
  rating?: string;
}) => void;

/**
 * Monitor Cumulative Layout Shift
 */
export function observeCLS(onReport: MetricHandler) {
  try {
    let clsValue = 0;
    const observer = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if ((entry as any).hadRecentInput) continue;
        clsValue += (entry as any).value;
        onReport({
          name: 'CLS',
          value: Math.round(clsValue * 1000) / 1000,
          id: `cls-${Date.now()}`,
          rating: getRating('CLS', clsValue)
        });
      }
    });
    observer.observe({ type: 'layout-shift', buffered: true });
  } catch (e) {
    console.warn('CLS observation failed:', e);
  }
}

/**
 * Monitor First Input Delay
 */
export function observeFID(onReport: MetricHandler) {
  try {
    const observer = new PerformanceObserver((entryList) => {
      const firstInputEvent = entryList.getEntries()[0] as PerformanceEventTiming;
      if (firstInputEvent) {
        const fid = firstInputEvent.processingEnd - firstInputEvent.startTime;
        onReport({
          name: 'FID',
          value: Math.round(fid),
          id: `fid-${Date.now()}`,
          rating: getRating('FID', fid)
        });
      }
    });
    observer.observe({ type: 'first-input', buffered: true });
  } catch (e) {
    console.warn('FID observation failed:', e);
  }
}

/**
 * Monitor Largest Contentful Paint
 */
export function observeLCP(onReport: MetricHandler) {
  try {
    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry;
      const lcp = lastEntry.startTime;
      onReport({
        name: 'LCP',
        value: Math.round(lcp),
        id: `lcp-${Date.now()}`,
        rating: getRating('LCP', lcp)
      });
    });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {
    console.warn('LCP observation failed:', e);
  }
}

/**
 * Monitor First Contentful Paint
 */
export function observeFCP(onReport: MetricHandler) {
  try {
    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const fcpEntry = entries.find((entry) => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        const fcp = fcpEntry.startTime;
        onReport({
          name: 'FCP',
          value: Math.round(fcp),
          id: `fcp-${Date.now()}`,
          rating: getRating('FCP', fcp)
        });
      }
    });
    observer.observe({ type: 'paint', buffered: true });
  } catch (e) {
    console.warn('FCP observation failed:', e);
  }
}

/**
 * Monitor Time to First Byte
 */
export function observeTTFB(onReport: MetricHandler) {
  try {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      const ttfb = navigation.responseStart - navigation.fetchStart;
      onReport({
        name: 'TTFB',
        value: Math.round(ttfb),
        id: `ttfb-${Date.now()}`,
        rating: getRating('TTFB', ttfb)
      });
    }
  } catch (e) {
    console.warn('TTFB observation failed:', e);
  }
}

/**
 * Get performance rating based on Core Web Vitals thresholds
 */
function getRating(metric: string, value: number): string {
  const thresholds: Record<string, [number, number]> = {
    'LCP': [2500, 4000],
    'FID': [100, 300],
    'CLS': [0.1, 0.25],
    'TTFB': [600, 1200],
    'FCP': [1800, 3000]
  };

  const [good, poor] = thresholds[metric] || [Infinity, Infinity];
  
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Initialize all Web Vitals monitoring
 */
export function initWebVitalsMonitoring(onMetric?: MetricHandler) {
  if (typeof window === 'undefined') return;

  const handleMetric = (metric: any) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`${metric.name}: ${metric.value}ms (${metric.rating})`);
    }

    // Send to analytics if available
    if (onMetric) {
      onMetric(metric);
    }

    // Send to Google Analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', metric.name, {
        value: Math.round(metric.value),
        event_category: 'Web Vitals',
        event_label: metric.id,
        non_interaction: true,
      });
    }
  };

  // Observe all metrics
  observeLCP(handleMetric);
  observeFID(handleMetric);
  observeCLS(handleMetric);
  observeFCP(handleMetric);
  observeTTFB(handleMetric);
}

/**
 * Report metrics to external service
 */
export async function reportWebVitals(metrics: any[]) {
  if (typeof window === 'undefined') return;

  // Send batch to your analytics endpoint
  try {
    await fetch('/api/v1/analytics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metrics }),
      keepalive: true
    });
  } catch (e) {
    console.warn('Failed to report web vitals:', e);
  }
}
