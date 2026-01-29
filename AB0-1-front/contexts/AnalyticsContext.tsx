'use client';

/**
 * Analytics Provider
 * Initializes and manages analytics SDK lifecycle
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  initializeAnalytics,
  track,
  page,
  identify,
  setUserProperties,
  reset,
  updateContext,
  hasAnalyticsConsent,
  optIn,
  optOut,
  type UserTraits
} from '@/lib/analytics';

interface AnalyticsContextValue {
  track: typeof track;
  page: typeof page;
  identify: typeof identify;
  setUserProperties: typeof setUserProperties;
  reset: typeof reset;
  updateContext: typeof updateContext;
  hasConsent: boolean;
  grantConsent: () => void;
  revokeConsent: () => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [hasConsent, setHasConsent] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize analytics on mount
  useEffect(() => {
    if (initialized) return;
    
    initializeAnalytics();
    setHasConsent(hasAnalyticsConsent());
    setInitialized(true);
    
    // Listen for consent changes
    const handleConsentChange = () => {
      setHasConsent(hasAnalyticsConsent());
    };
    
    window.addEventListener('consent-changed', handleConsentChange);
    
    return () => {
      window.removeEventListener('consent-changed', handleConsentChange);
    };
  }, [initialized]);

  // Track page views on route change
  useEffect(() => {
    if (!hasConsent || !initialized) return;
    
    // Avoid double-tracking on initial mount
    const timer = setTimeout(() => {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      page(url, {
        path: pathname,
        search: searchParams?.toString() || ''
      });
    }, 100); // Small delay to avoid StrictMode double-fire
    
    return () => clearTimeout(timer);
  }, [pathname, searchParams, hasConsent, initialized]);

  const value: AnalyticsContextValue = {
    track,
    page,
    identify,
    setUserProperties,
    reset,
    updateContext,
    hasConsent,
    grantConsent: () => {
      optIn();
      setHasConsent(true);
      if (!initialized) {
        initializeAnalytics();
        setInitialized(true);
      }
    },
    revokeConsent: () => {
      optOut();
      setHasConsent(false);
      reset();
    }
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

/**
 * Hook to access analytics
 */
export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }
  
  return context;
}
