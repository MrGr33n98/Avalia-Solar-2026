'use client';

import type { AnalyticsContext, EventOptions, UserTraits } from './types';

type AnalyticsModule = typeof import('./index');

let analyticsPromise: Promise<AnalyticsModule> | null = null;

const loadAnalytics = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  if (!analyticsPromise) {
    analyticsPromise = import('./index');
  }
  return analyticsPromise;
};

const withAnalytics = (fn: (mod: AnalyticsModule) => void) => {
  const promise = loadAnalytics();
  if (!promise) return;
  void promise.then(fn).catch((err) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Analytics] Lazy load failed', err);
    }
  });
};

export const preloadAnalytics = () => {
  void loadAnalytics();
};

export const initializeAnalytics = () => {
  withAnalytics((mod) => mod.initializeAnalytics());
};

export const page = (pageName?: string, properties: Record<string, any> = {}) => {
  withAnalytics((mod) => mod.page(pageName, properties));
};

export const track = (
  eventName: string,
  properties: Record<string, any> = {},
  options: EventOptions = {}
) => {
  withAnalytics((mod) => mod.track(eventName, properties, options));
};

export const identify = (userId: string, traits: UserTraits = {}) => {
  withAnalytics((mod) => mod.identify(userId, traits));
};

export const setUserProperties = (traits: UserTraits = {}) => {
  withAnalytics((mod) => mod.setUserProperties(traits));
};

export const updateContext = (context: Partial<AnalyticsContext>) => {
  withAnalytics((mod) => mod.updateContext(context));
};

export const alias = (newId: string) => {
  withAnalytics((mod) => mod.alias(newId));
};

export const reset = () => {
  withAnalytics((mod) => mod.reset());
};
