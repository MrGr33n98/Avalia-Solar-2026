/**
 * Analytics Core - Avalia Solar
 * Unified analytics layer integrating Mixpanel + GA4
 * 
 * Features:
 * - LGPD compliant (consent-based)
 * - Event deduplication
 * - UTM persistence
 * - Multi-tenant safe
 * - No PII tracking
 */

import { AnalyticsContext, EventOptions, UserTraits } from './types';
import { hasAnalyticsConsent, onConsentChange } from './consent';
import { getAttribution, getCurrentUTMs, updateAttribution } from './utm';
import { getSessionId, isNewSession } from './session';
import { shouldTrackEvent, generateEventId } from './dedupe';
import {
  isQueuedOfflineMutationResult,
  sendJsonApiMutationWithOfflineQueue,
} from '@/lib/offline/apiMutation';
import { 
  initializeGTag, 
  gtagEvent, 
  gtagPageView, 
  gtagSetUserId,
  gtagSetUserProperties,
  mapToGA4Event 
} from './gtag';

export { DashboardEvents } from './ga4';

// Initialization state
let initialized = false;
let currentUserId: string | null = null;
let currentContext: Partial<AnalyticsContext> = {};
let posthogInstance: any = null;
let initPromise: Promise<void> | null = null;
const EVENT_QUEUE_LIMIT = 100;
const BACKEND_MIN_INTERVAL_MS = 400;
const BACKEND_DEFAULT_RETRY_AFTER_MS = 15_000;
const eventQueue: Array<{
  name: string;
  properties: Record<string, any>;
  options: EventOptions;
  eventId: string;
}> = [];
const GLOBAL_EVENTS = new Set(['page_view', 'search']);
let backendLastSentAt = 0;
let backendBlockedUntil = 0;

/**
 * Initialize analytics SDKs
 */
export function initializeAnalytics(): void {
  if (initialized) return;
  if (typeof window === 'undefined') return;
  
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const ga4Id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  
  if (!posthogKey && !ga4Id) {
    console.warn('[Analytics] No tokens configured');
    return;
  }
  
  // Inicializa attribution UTM (first/last touch) com a URL atual
  updateAttribution();
  
  // Inicializamos SDKs básicos (GA4 via Consent Mode já lida com LGPD)
  // Usamos requestIdleCallback para não bloquear a thread principal
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => void initializeSDKs());
  } else {
    setTimeout(() => void initializeSDKs(), 1000);
  }

  // Listen for consent change to re-initialize or update SDKs
  onConsentChange((consent) => {
    if (consent.analytics) {
      // Se ganhou consentimento, garantimos que o Mixpanel seja iniciado
      initializeSDKs();
      // Track the current page immediately after consent
      setTimeout(() => page(), 500);
    }
  });
}

/**
 * Initialize SDKs (internal)
 */
async function initializeSDKs(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
  const ga4Id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const hasConsent = hasAnalyticsConsent();
  
  // PostHog - APENAS com consentimento
  if (posthogKey && hasConsent && !posthogInstance) {
    try {
      // Dynamic import to reduce initial bundle size
      const posthog = (await import('posthog-js')).default;
      posthog.init(posthogKey, {
        api_host: posthogHost,
        person_profiles: 'identified_only',
        capture_pageview: false, // Manual tracking
        capture_pageleave: true,
        autocapture: false,
        session_recording: {
          maskAllInputs: true,
        },
        loaded: (ph) => {
          console.log('[Analytics] PostHog initialized. Distinct ID:', ph.get_distinct_id());
        }
      });
      posthogInstance = posthog;
    } catch (e) {
      console.error('[Analytics] PostHog init failed:', e);
    }
  }
  
  // GA4 - APENAS com consentimento
  if (ga4Id && hasConsent) {
    try {
      initializeGTag(ga4Id);
      console.log('[Analytics] GA4 initialized');
    } catch (e) {
      console.error('[Analytics] GA4 init failed:', e);
    }
  }
  
  initialized = true;
  flushEventQueue();
  initPromise = null;
  })();

  return initPromise;
}

function enqueueEvent(
  eventName: string,
  properties: Record<string, any>,
  options: EventOptions
): string {
  const eventId = options.eventId || generateEventId();
  const payload = { name: eventName, properties, options: { ...options, eventId }, eventId };
  if (eventQueue.length >= EVENT_QUEUE_LIMIT) eventQueue.shift();
  eventQueue.push(payload);
  return eventId;
}

function flushEventQueue(): void {
  if (!initialized || eventQueue.length === 0) return;
  const queued = eventQueue.splice(0, eventQueue.length);
  queued.forEach((item) => {
    track(item.name, item.properties, item.options);
  });
}

/**
 * Get common analytics context
 */
export function getAnalyticsContext(): AnalyticsContext {
  if (typeof window === 'undefined') {
    return {
      environment: process.env.NODE_ENV || 'production',
      app_version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      platform: 'web',
      pathname: '',
      referrer: '',
      referrer_host: undefined,
      session_id: '',
      is_logged_in: false,
      source: 'server'
    };
  }
  
  const utms = getCurrentUTMs();
  const attribution = getAttribution();
  
  // Determine traffic source
  let source = 'direct';
  if (utms.utm_source) {
    source = utms.utm_source;
  } else if (document.referrer) {
    try {
      const refUrl = new URL(document.referrer);
      if (refUrl.hostname.includes('google')) source = 'organic';
      else if (refUrl.hostname.includes('facebook') || refUrl.hostname.includes('instagram')) source = 'social';
      else if (!refUrl.hostname.includes(window.location.hostname)) source = 'referral';
    } catch (e) {
      source = 'referral';
    }
  }

  let referrer_host: string | undefined = undefined;
  try {
    referrer_host = document.referrer ? new URL(document.referrer).hostname : undefined;
  } catch {
    referrer_host = undefined;
  }
  
  return {
    environment: process.env.NODE_ENV || 'production',
    app_version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    platform: 'web',
    pathname: window.location.pathname,
    referrer: document.referrer,
    referrer_host,
    session_id: getSessionId(),
    is_logged_in: !!currentUserId,
    user_id: currentUserId || undefined,
    source,
    landing_path: attribution?.last_touch?.landing_path || attribution?.first_touch?.landing_path,
    attribution: attribution || undefined,
    ...utms,
    ...currentContext
  };
}

/**
 * Track event
 */
export function track(
  eventName: string,
  properties: Record<string, any> = {},
  options: EventOptions = {}
): void {
  if (!hasAnalyticsConsent()) {
    console.debug('[Analytics] Event blocked: no consent');
    return;
  }
  
  if (!initialized) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Analytics] Not initialized, queueing event:', eventName);
    }
    enqueueEvent(eventName, properties, options);
    void initializeSDKs();
    return;
  }
  
  // ALWAYS generate event ID for EVERY interaction
  const eventId = options.eventId || generateEventId();
  
  // Dedupe check
  if (!shouldTrackEvent(eventName, eventId, options.critical)) {
    return;
  }
  
  // Merge context
  const context = getAnalyticsContext();
  const eventProps = {
    ...context,
    ...properties,
    event_id: eventId,
    timestamp: new Date().toISOString()
  };
  
  // Envia para backend (fire-and-forget) com payload mínimo
  sendToBackend(eventName, eventId, context, {
    ...properties,
    company_id: properties.company_id ?? context.company_id,
    banner_id: properties.banner_id,
    category_id: properties.category_id,
    timestamp: eventProps.timestamp
  });

  // Remove PII
  const sanitized = sanitizeProperties(eventProps);

  // Determine destinations
  const sendToPosthog = options.sendTo?.posthog !== false;
  // If mixpanel is specified, fallback to posthog behavior
  const legacySendToMixpanel = options.sendTo?.mixpanel !== false;
  const shouldSendToPosthog = sendToPosthog && legacySendToMixpanel;
  
  const sendToGA4 = options.sendTo?.ga4 !== false;
  
  // Push to GTM dataLayer
  try {
    const { name: ga4Name, params: ga4Params } = mapToGA4Event(eventName, sanitized);
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: ga4Name,
        ...ga4Params,
        original_event: eventName,
        gtm_timestamp: new Date().toISOString()
      });
    }
  } catch (e) {
    console.error('[Analytics] GTM dataLayer push failed:', e);
  }
  
  // Send to PostHog
  if (shouldSendToPosthog && posthogInstance) {
    try {
      posthogInstance.capture(eventName, sanitized);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[PostHog] Event:', eventName, sanitized);
      }
    } catch (e) {
      console.error('[Analytics] PostHog track failed:', e);
    }
  }
  
  // Send to GA4
  if (sendToGA4) {
    try {
      const { name, params } = mapToGA4Event(eventName, sanitized);
      gtagEvent(name, params);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[GA4] Event:', name, params);
      }
    } catch (e) {
      console.error('[Analytics] GA4 track failed:', e);
    }
  }
}

/**
 * Sanitize properties to remove PII and normalize data
 */
function sanitizeProperties(properties: Record<string, any>): Record<string, any> {
  const sanitized = { ...properties };
  
  // List of keys that might contain PII
  const piiKeys = [
    'email', 'phone', 'name', 'first_name', 'last_name', 
    'address', 'zipcode', 'cnpj', 'cpf', 'password',
    'address_full', 'full_address'
  ];
  
  piiKeys.forEach(key => {
    if (key in sanitized) {
      delete sanitized[key];
    }
  });
  
  // Also check nested metadata if present
  if (sanitized.metadata && typeof sanitized.metadata === 'object') {
    sanitized.metadata = sanitizeProperties(sanitized.metadata);
  }
  
  return sanitized;
}

function compact(obj: Record<string, any>): Record<string, any> {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined && value !== null));
}

/**
 * Envia o evento também para o backend (fire-and-forget)
 */
function sendToBackend(
  eventName: string,
  eventId: string,
  context: AnalyticsContext,
  properties: Record<string, any>
): void {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  if (now < backendBlockedUntil) return;
  if (now - backendLastSentAt < BACKEND_MIN_INTERVAL_MS) return;
  const backendEndpoint = '/api/v1/analytics/track';

  const companyId = properties.company_id ?? context.company_id ?? null;
  if (!companyId && !GLOBAL_EVENTS.has(eventName)) return;
  const trackedAt =
    typeof properties.tracked_at === 'string'
      ? properties.tracked_at
      : typeof properties.timestamp === 'string'
        ? properties.timestamp
        : new Date().toISOString();

  // Guardrail: never send malformed backend tracking payloads.
  if (!eventName || !eventId || !trackedAt) return;

  const utm = getCurrentUTMs();
  const attribution = getAttribution();

  const metadata = compact({
    ...properties,
    session_id: context.session_id,
    source: context.source,
    utm_source: utm.utm_source,
    utm_medium: utm.utm_medium,
    utm_campaign: utm.utm_campaign,
    utm_content: utm.utm_content,
    utm_term: utm.utm_term,
    gclid: utm.gclid,
    fbclid: utm.fbclid,
    msclkid: utm.msclkid,
    attribution,
    path: context.pathname,
    landing_path: attribution?.last_touch?.landing_path || attribution?.first_touch?.landing_path || context.pathname,
    referrer_host: context.referrer_host,
  });

  const body = {
    event_id: eventId,
    event_type: eventName,
    company_id: companyId,
    tracked_at: trackedAt,
    metadata,
  };

  const serializedBody = JSON.stringify(body);
  if (!serializedBody || serializedBody === '{}') return;

  try {
    backendLastSentAt = now;
    void sendJsonApiMutationWithOfflineQueue(backendEndpoint, {
      method: 'POST',
      body,
      headers: {
        Accept: 'application/json',
      },
      keepalive: true,
      conflictKey: `analytics:${eventId}`,
      metadata: {
        eventName,
        queue: 'analytics-backend',
      },
    })
      .then((response) => {
        if (isQueuedOfflineMutationResult(response)) {
          return;
        }
        if (response.status !== 429) return;
        const retryAfterRaw = response.headers.get('retry-after');
        const retryAfterSeconds = retryAfterRaw ? Number(retryAfterRaw) : NaN;
        const retryAfterMs =
          Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
            ? retryAfterSeconds * 1000
            : BACKEND_DEFAULT_RETRY_AFTER_MS;
        backendBlockedUntil = Date.now() + retryAfterMs;
      })
      .catch((err) => {
        // Never surface unhandled promise rejections for analytics.
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Analytics] Failed to send to backend', err);
        }
      });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Analytics] Failed to send to backend', err);
    }
  }
}

/**
 * Convert snake_case or spinal-case to Title Case for Mixpanel
 */
function toTitleCase(str: string): string {
  return str
    .split(/[_-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Track page view
 */
export function page(
  pageName?: string,
  properties: Record<string, any> = {}
): void {
  if (!hasAnalyticsConsent()) return;
  if (!initialized) return;
  
  const context = getAnalyticsContext();
  const eventId = generateEventId();
  
  const pageProps = {
    ...context,
    ...properties,
    page_name: pageName || context.pathname,
    event_id: eventId,
    timestamp: new Date().toISOString()
  };
  
  const sanitized = sanitizeProperties(pageProps);

  sendToBackend('page_view', eventId, context, {
    ...properties,
    page_name: pageProps.page_name,
    company_id: properties.company_id ?? context.company_id,
    timestamp: pageProps.timestamp
  });
  
  // PostHog
  if (posthogInstance) {
    try {
      posthogInstance.capture('$pageview', {
        $current_url: window.location.href,
        ...sanitized
      });
      if (process.env.NODE_ENV === 'development') {
        console.log('[PostHog] Page View:', sanitized);
      }
    } catch (e) {
      console.error('[Analytics] PostHog page view failed:', e);
    }
  }
  
  // GA4
  try {
    gtagPageView(context.pathname, pageName, sanitized);
  } catch (e) {
    console.error('[Analytics] GA4 page view failed:', e);
  }
}

/**
 * Identify user
 */
export function identify(
  userId: string,
  traits: UserTraits = {}
): void {
  if (!hasAnalyticsConsent()) return;
  if (!initialized) return;
  
  currentUserId = userId;
  
  // Sanitize traits (no PII)
  const sanitizedTraits = sanitizeProperties(traits);
  
  // PostHog
  if (posthogInstance) {
    try {
      posthogInstance.identify(userId, sanitizedTraits);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[PostHog] Identify:', userId, sanitizedTraits);
      }
    } catch (e) {
      console.error('[Analytics] PostHog identify failed:', e);
    }
  }
  
  // GA4
  try {
    gtagSetUserId(userId);
  } catch (e) {
    console.error('[Analytics] GA4 set user ID failed:', e);
  }
  
  // Set user properties
  if (Object.keys(sanitizedTraits).length > 0) {
    setUserProperties(sanitizedTraits);
  }
}

/**
 * Set user properties
 */
export function setUserProperties(traits: UserTraits): void {
  if (!hasAnalyticsConsent()) return;
  if (!initialized) return;
  
  const sanitized = sanitizeProperties(traits);
  
  // PostHog
  if (posthogInstance) {
    try {
      posthogInstance.capture('$set', { $set: sanitized });
    } catch (e) {
      console.error('[Analytics] PostHog set user properties failed:', e);
    }
  }
  
  // GA4
  try {
    gtagSetUserProperties(sanitized);
  } catch (e) {
    console.error('[Analytics] GA4 set user properties failed:', e);
  }
}

/**
 * Alias user (link anonymous to identified)
 */
export function alias(newId: string): void {
  if (!hasAnalyticsConsent()) return;
  if (!initialized) return;
  
  if (posthogInstance) {
    try {
      posthogInstance.alias(newId);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[PostHog] Alias:', newId);
      }
    } catch (e) {
      console.error('[Analytics] PostHog alias failed:', e);
    }
  }
}

/**
 * Reset user (logout)
 */
export function reset(): void {
  if (!initialized) return;
  
  currentUserId = null;
  currentContext = {};
  
  if (posthogInstance) {
    try {
      posthogInstance.reset();
    } catch (e) {
      console.error('[Analytics] PostHog reset failed:', e);
    }
  }
  
  try {
    gtagSetUserId(null);
  } catch (e) {
    console.error('[Analytics] GA4 reset failed:', e);
  }
}

/**
 * Update context (for multi-tenant)
 */
export function updateContext(context: Partial<AnalyticsContext>): void {
  currentContext = { ...currentContext, ...context };
}

// Export all utilities
export * from './types';
export * from './consent';
export * from './utm';
export * from './session';
export * from './dedupe';
