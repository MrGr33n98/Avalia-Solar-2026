/**
 * Performance Optimization Configuration
 * 
 * This file contains build and runtime optimizations for the dashboard
 * to improve Core Web Vitals metrics and overall performance.
 */

export const PERF_CONFIG = {
  // Bundle optimization settings
  bundle: {
    // Enable code splitting for dashboard tabs
    codeSpitting: true,
    // Compress JavaScript and CSS
    minify: true,
    // Remove console logs in production
    removeConsole: true,
    // Enable gzip compression
    compression: 'gzip',
  },

  // Image optimization
  images: {
    // Responsive image sizes
    sizes: [320, 640, 1024, 1280, 1920],
    // Enable WebP and AVIF formats
    formats: ['image/avif', 'image/webp'],
    // Cache images for 30 days
    cacheTTL: 30 * 24 * 60 * 60,
  },

  // Data fetching optimization
  queries: {
    // Default stale time for cached queries
    defaultStaleTime: 5 * 60 * 1000, // 5 minutes
    // Garbage collection time
    defaultGcTime: 10 * 60 * 1000, // 10 minutes
    // Enable request batching
    batchRequests: true,
  },

  // Lazy loading thresholds
  lazyLoad: {
    // Images load when 50% visible
    imageThreshold: 0.5,
    // Components load when 25% visible
    componentThreshold: 0.25,
    // Preload images 2000ms before they become visible
    imagePreloadDelay: 2000,
  },

  // Core Web Vitals targets
  webVitals: {
    // Largest Contentful Paint < 2.5s (good)
    lcp: 2500,
    // First Input Delay < 100ms (good)
    fid: 100,
    // Cumulative Layout Shift < 0.1 (good)
    cls: 0.1,
    // Time to First Byte < 600ms (good)
    ttfb: 600,
    // First Contentful Paint < 1.8s (good)
    fcp: 1800,
  },
};

// ✅ Preload critical resources
export const PRELOAD_RESOURCES = [
  // Fonts
  { rel: 'preload', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap', as: 'style' },
  
  // Critical styles
  { rel: 'preload', href: '/styles/critical.css', as: 'style' },
];

// ✅ DNS prefetch for external services
export const DNS_PREFETCH = [
  'https://www.googletagmanager.com',
  'https://www.google-analytics.com',
  'https://us.i.posthog.com',
  'https://f.avaliasolar.com.br',
  'https://api.avaliasolar.com.br',
];

// ✅ Preconnect to critical origins
export const PRECONNECT = [
  'https://api.avaliasolar.com.br',
  'https://nyc3.digitaloceanspaces.com',
];
