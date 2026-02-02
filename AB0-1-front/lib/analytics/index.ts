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

import mixpanel from 'mixpanel-browser';
import { AnalyticsContext, EventOptions, UserTraits } from './types';
import { hasAnalyticsConsent, onConsentChange } from './consent';
import { getCurrentUTMs, initializeUTMs } from './utm';
import { getSessionId, isNewSession } from './session';
import { shouldTrackEvent, generateEventId } from './dedupe';
import { 
  initializeGTag, 
  gtagEvent, 
  gtagPageView, 
  gtagSetUserId,
  gtagSetUserProperties,
  mapToGA4Event 
} from './gtag';

// Initialization state
let initialized = false;
let currentUserId: string | null = null;
let currentContext: Partial<AnalyticsContext> = {};

/**
 * Initialize analytics SDKs
 */
export function initializeAnalytics(): void {
  if (initialized) return;
  if (typeof window === 'undefined') return;
  
  const mixpanelToken = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  const ga4Id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  
  if (!mixpanelToken && !ga4Id) {
    console.warn('[Analytics] No tokens configured');
    return;
  }
  
  // Initialize UTMs
  initializeUTMs();
  
  // Only initialize if consent granted
  if (!hasAnalyticsConsent()) {
    console.log('[Analytics] Waiting for consent');
    
    // Listen for consent change
    onConsentChange((consent) => {
      if (consent.analytics && !initialized) {
        initializeSDKs();
        // Track the current page immediately after consent
        setTimeout(() => page(), 500);
      }
    });
    
    return;
  }
  
  initializeSDKs();
}

/**
 * Initialize SDKs (internal)
 */
function initializeSDKs(): void {
  const mixpanelToken = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  const ga4Id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  
  // Mixpanel
  if (mixpanelToken) {
    try {
      mixpanel.init(mixpanelToken, {
        debug: process.env.NODE_ENV === 'development',
        track_pageview: false, // Manual tracking
        persistence: 'localStorage',
        ignore_dnt: false,
        opt_out_tracking_by_default: false,
        loaded: () => {
          console.log('[Analytics] Mixpanel initialized');
        }
      });
    } catch (e) {
      console.error('[Analytics] Mixpanel init failed:', e);
    }
  }
  
  // GA4
  if (ga4Id) {
    try {
      initializeGTag(ga4Id);
      console.log('[Analytics] GA4 initialized');
    } catch (e) {
      console.error('[Analytics] GA4 init failed:', e);
    }
  }
  
  initialized = true;
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
      session_id: '',
      is_logged_in: false,
      source: 'server'
    };
  }
  
  const utms = getCurrentUTMs();
  
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
  
  return {
    environment: process.env.NODE_ENV || 'production',
    app_version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    platform: 'web',
    pathname: window.location.pathname,
    referrer: document.referrer,
    session_id: getSessionId(),
    is_logged_in: !!currentUserId,
    user_id: currentUserId || undefined,
    source,
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
    console.warn('[Analytics] Not initialized, queueing event:', eventName);
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
  
  // Remove PII
  const sanitized = sanitizeProperties(eventProps);

  // Determine destinations
  const sendToMixpanel = options.sendTo?.mixpanel !== false;
  const sendToGA4 = options.sendTo?.ga4 !== false;
  
  // Send to Mixpanel
  if (sendToMixpanel) {
    try {
      // Convert to Title Case for Mixpanel
      const mixpanelEventName = toTitleCase(eventName);
      mixpanel.track(mixpanelEventName, sanitized);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Mixpanel] Event:', mixpanelEventName, sanitized);
      }
    } catch (e) {
      console.error('[Analytics] Mixpanel track failed:', e);
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
  
  // Mixpanel
  try {
    mixpanel.track_pageview(sanitized);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Mixpanel] Page View:', sanitized);
    }
  } catch (e) {
    console.error('[Analytics] Mixpanel page view failed:', e);
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
  
  // Mixpanel
  try {
    mixpanel.identify(userId);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Mixpanel] Identify:', userId, sanitizedTraits);
    }
  } catch (e) {
    console.error('[Analytics] Mixpanel identify failed:', e);
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
  
  // Mixpanel
  try {
    mixpanel.people.set(sanitized);
  } catch (e) {
    console.error('[Analytics] Mixpanel set user properties failed:', e);
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
  
  try {
    mixpanel.alias(newId);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Mixpanel] Alias:', newId);
    }
  } catch (e) {
    console.error('[Analytics] Mixpanel alias failed:', e);
  }
}

/**
 * Reset user (logout)
 */
export function reset(): void {
  if (!initialized) return;
  
  currentUserId = null;
  currentContext = {};
  
  try {
    mixpanel.reset();
  } catch (e) {
    console.error('[Analytics] Mixpanel reset failed:', e);
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
