/**
 * Analytics Core - Avalia Solar
 * Canonical frontend analytics layer: PostHog + backend
 *
 * Features:
 * - LGPD compliant (consent-based)
 * - Event deduplication
 * - UTM persistence
 * - Multi-tenant safe
 * - No PII tracking
 *
 * Nota: A inicialização do PostHog é feita pelo PostHogProvider em
 * components/PostHogProvider.tsx. Este módulo usa o singleton posthog-js
 * diretamente, sem chamar posthog.init() novamente.
 */

import posthog from 'posthog-js';
import { AnalyticsContext, EventOptions, UserTraits } from './types';
import { hasAnalyticsConsent, onConsentChange } from './consent';
import { getAttribution, getCurrentUTMs, updateAttribution } from './utm';
import { getSessionId } from './session';
import { shouldTrackEvent, generateEventId } from './dedupe';
import {
  isQueuedOfflineMutationResult,
  sendJsonApiMutationWithOfflineQueue,
} from '@/lib/offline/apiMutation';

// Initialization state
let initialized = false;
let currentUserId: string | null = null;
let currentContext: Partial<AnalyticsContext> = {};
let initPromise: Promise<void> | null = null;
const EVENT_QUEUE_LIMIT = 100;
const BACKEND_MIN_INTERVAL_MS = 400;
const BACKEND_DEFAULT_RETRY_AFTER_MS = 15_000;
const DEFAULT_APP_KEY = process.env.NEXT_PUBLIC_APP_KEY || 'avalia-solar-web';
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
 * Initialize analytics — configura attribution e marca como pronto.
 * A inicialização do PostHog SDK é feita pelo PostHogProvider (components/PostHogProvider.tsx).
 */
export function initializeAnalytics(): void {
  if (initialized) return;
  if (typeof window === 'undefined') return;

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NODE_ENV === 'development') {
    console.warn('[Analytics] NEXT_PUBLIC_POSTHOG_KEY não configurado; tracking somente via backend.');
  }

  // Persiste attribution apenas após consentimento explícito (LGPD)
  if (hasAnalyticsConsent()) {
    updateAttribution();
  }

  // Marca como inicializado e processa fila de eventos
  initialized = true;
  flushEventQueue();

  // Escuta mudança de consentimento para atualizar attribution
  onConsentChange((consent) => {
    if (consent.analytics) {
      updateAttribution();
    }
  });
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
 * Get common analytics context (Matrix VAR-001 to VAR-019)
 */
export function getAnalyticsContext(): AnalyticsContext {
  if (typeof window === 'undefined') {
    return {
      environment: process.env.NODE_ENV || 'production',
      app_version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      platform: 'web',
      app_key: DEFAULT_APP_KEY,
      pathname: '',
      referrer: '',
      source: 'server',
      session_id: '',
      is_logged_in: false,
    };
  }
  
  const utms = getCurrentUTMs();
  const attribution = getAttribution();
  
  // Matrix VAR-003 & Source Logic
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

  return {
    // VAR-001, VAR-002, VAR-003
    page_url: window.location.href,
    pathname: window.location.pathname,
    referrer: document.referrer,
    
    // VAR-005, VAR-006
    event_id: generateEventId(),
    session_id: getSessionId(),
    
    environment: process.env.NODE_ENV || 'production',
    app_version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    platform: 'web',
    app_key: DEFAULT_APP_KEY,
    is_logged_in: !!currentUserId,
    is_internal: typeof window !== 'undefined' ? localStorage.getItem('is_internal_team') === 'true' || window.location.search.includes('internal=true') || window.location.search.includes('is_internal=true') : false,
    user_id: currentUserId || undefined,
    source,
    
    // UTMs
    ...utms,
    ...currentContext
  };
}

/**
 * Track event - Unified Matrix Logic
 */
export function track(
  eventName: string,
  properties: Record<string, any> = {},
  options: EventOptions = {}
): void {
  if (!hasAnalyticsConsent()) return;
  
  if (!initialized) {
    enqueueEvent(eventName, properties, options);
    return;
  }
  
  const context = getAnalyticsContext();
  const eventId = options.eventId || context.event_id || generateEventId();
  
  // Dedupe check
  if (!shouldTrackEvent(eventName, eventId, options.critical)) return;
  
  // Matrix Property Mapping (VAR-007 to VAR-016)
  const matrixProps = {
    ...context,
    ...properties,
    is_internal: context.is_internal || properties.is_internal,
    original_event: eventName, // VAR-004: Required for GTM triggers
    event_id: eventId,
    gtm_timestamp: Date.now(), // VAR-019
    company_id: properties.company_id || context.company_id,
    company_name: properties.company_name || context.company_name,
    category_id: properties.category_id || context.category_id,
    search_term: properties.search_term || properties.query, // VAR-010
    results_count: properties.results_count, // VAR-011
    cta_type: properties.cta_type, // VAR-012
    cta_location: properties.cta_location || properties.placement, // VAR-013
    item_id: properties.company_id, // VAR-014 (GA4 Style)
    item_name: properties.company_name, // VAR-015
    item_category: properties.category_name, // VAR-016
    app_key: properties.app_key || context.app_key,
    brand_id: properties.brand_id || context.brand_id,
    brand_slug: properties.brand_slug || context.brand_slug,
  };
  
  // 1. Centraliza no PostHog (Canonical Data) — usa o singleton inicializado pelo PostHogProvider
  if (options.sendTo?.posthog !== false && posthog.__loaded) {
    try {
      const sanitized = sanitizeProperties(matrixProps);
      posthog.capture(eventName, sanitized);

      if (process.env.NODE_ENV === 'development') {
        console.log('[PostHog] Unified Event:', eventName, sanitized);
      }
    } catch (e) {
      console.error('[Analytics] PostHog capture failed:', e);
    }
  }

  // 2. Dispatch to GTM DataLayer (For Meta/Google Pixels)
  if (typeof window !== 'undefined' && (window as any).dataLayer) {
    // Mapeia o evento para o padrão GA4 conforme a Matrix (TRG-003 a TRG-009)
    const gtmEventName = mapToGtmEvent(eventName);
    (window as any).dataLayer.push({
      event: gtmEventName,
      ...matrixProps
    });
  }

  // 3. Sync with Backend
  sendToBackend(eventName, eventId, context, matrixProps);
}

/**
 * Map canonical events to GTM/GA4 standard names (Matrix Triggers)
 */
function mapToGtmEvent(name: string): string {
  const map: Record<string, string> = {
    'search_performance': 'search',
    'search_submitted': 'search',
    'company_card_click': 'select_item',
    'whatsapp_click': 'contact',
    'wizard_started': 'begin_checkout',
    'wizard_step_completed': 'checkout_progress',
    'wizard_success': 'wizard_success', // TRG-009
  };
  return map[name] || name;
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
  
  // PostHog — usa o singleton inicializado pelo PostHogProvider
  if (posthog.__loaded) {
    try {
      posthog.capture('page_view', {
        page_url: window.location.href,
        ...sanitized,
      });
      if (process.env.NODE_ENV === 'development') {
        console.log('[PostHog] Page View:', sanitized);
      }
    } catch (e) {
      console.error('[Analytics] PostHog page view failed:', e);
    }
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
  if (posthog.__loaded) {
    try {
      posthog.identify(userId, sanitizedTraits);

      if (process.env.NODE_ENV === 'development') {
        console.log('[PostHog] Identify:', userId, sanitizedTraits);
      }
    } catch (e) {
      console.error('[Analytics] PostHog identify failed:', e);
    }
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
  if (posthog.__loaded) {
    try {
      posthog.capture('$set', { $set: sanitized });
    } catch (e) {
      console.error('[Analytics] PostHog set user properties failed:', e);
    }
  }
}

/**
 * Alias user (link anonymous to identified)
 */
export function alias(newId: string): void {
  if (!hasAnalyticsConsent()) return;
  if (!initialized) return;
  
  if (posthog.__loaded) {
    try {
      posthog.alias(newId);

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
  
  if (posthog.__loaded) {
    try {
      posthog.reset();
    } catch (e) {
      console.error('[Analytics] PostHog reset failed:', e);
    }
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
