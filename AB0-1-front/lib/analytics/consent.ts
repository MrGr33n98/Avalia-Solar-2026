/**
 * LGPD Consent Management
 * Manages user consent for analytics tracking
 */

import { ConsentState } from './types';
import { deleteCookie } from './cookies';
import {
  sendJsonApiMutationWithOfflineQueue,
} from '@/lib/offline/apiMutation';

const CONSENT_STORAGE_KEY = 'avaliasolar_consent';
const ATTRIBUTION_STORAGE_KEY = 'avaliasolar_attribution_v2';

/**
 * Get current consent state
 */
export function getConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!stored) return null;
    
    return JSON.parse(stored) as ConsentState;
  } catch (e) {
    console.warn('[Consent] Failed to parse consent state', e);
    return null;
  }
}

/**
 * Set consent state
 */
export function setConsent(consent: Partial<ConsentState>): void {
  if (typeof window === 'undefined') return;
  
  const current = getConsent() || {
    analytics: false,
    marketing: false,
    lastUpdated: Date.now()
  };
  
  const updated: ConsentState = {
    ...current,
    ...consent,
    lastUpdated: Date.now()
  };
  
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(updated));
  
  // Update Google Consent Mode if available
  if (typeof window !== 'undefined') {
    // Ensure gtag exists if dataLayer is present (GTM might be loading)
    if (!(window as any).gtag && (window as any).dataLayer) {
      (window as any).gtag = function () {
        (window as any).dataLayer.push(arguments);
      };
    }

    if ((window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        'ad_storage': updated.marketing ? 'granted' : 'denied',
        'analytics_storage': updated.analytics ? 'granted' : 'denied',
        'ad_user_data': updated.marketing ? 'granted' : 'denied',
        'ad_personalization': updated.marketing ? 'granted' : 'denied'
      });
    }
  }
  
  // Emit event for listeners
  window.dispatchEvent(new CustomEvent('consent-changed', { detail: updated }));
}

/**
 * Set consent state WITH audit trail logging to backend
 * LGPD Compliance: Logs consent decisions for audit purposes
 */
export async function setConsentWithAudit(
  consent: Partial<ConsentState>,
  options?: {
    consentMethod?: 'banner' | 'settings' | 'api' | 'default';
    metadata?: Record<string, any>;
  }
): Promise<void> {
  // First, update local consent state
  setConsent(consent);
  
  if (typeof window === 'undefined') return;
  
  try {
    // Determine consent type
    let consentType: string;
    if (consent.analytics && consent.marketing) {
      consentType = 'all';
    } else if (consent.analytics) {
      consentType = 'analytics';
    } else if (consent.marketing) {
      consentType = 'marketing';
    } else {
      consentType = 'none';
    }
    
    // Get current URL and referrer
    const pageUrl = window.location.href;
    const referrer = document.referrer || '';
    
    // Get session ID from cookies
    const sessionId = document.cookie
      .split('; ')
      .find(row => row.startsWith('_session_id='))
      ?.split('=')[1] || generateSessionId();
    
    // Prepare payload
    const payload = {
      consent_type: consentType,
      consent_given: !!(consent.analytics || consent.marketing),
      policy_version: 'v1.0',
      consent_method: options?.consentMethod || 'banner',
      page_url: pageUrl,
      referrer: referrer,
      metadata: options?.metadata || {}
    };
    
    // Log to backend API
    const response = await sendJsonApiMutationWithOfflineQueue('/consent/log', {
      method: 'POST',
      body: payload,
      conflictKey: `consent:log:${sessionId}:${consentType}`,
      metadata: {
        queue: 'consent-log',
        consentType,
      },
    });
    
    if (response instanceof Response && !response.ok) {
      console.warn('[Consent] Failed to log consent to backend:', response.statusText);
    }
  } catch (error) {
    // Don't block user experience if logging fails
    console.error('[Consent] Error logging consent:', error);
  }
}

// Helper to generate session ID if not present
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Check consent status from backend
 */
export async function getConsentStatus(): Promise<ConsentState | null> {
  if (typeof window === 'undefined') return null;
  
  try {
    const response = await fetch('/api/v1/consent/status', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.status === 404) {
      return null; // No consent recorded
    }
    
    if (!response.ok) {
      throw new Error(`Failed to get consent status: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Convert backend format to frontend format
    return {
      analytics: data.consent_type === 'all' || data.consent_type === 'analytics',
      marketing: data.consent_type === 'all' || data.consent_type === 'marketing',
      lastUpdated: new Date(data.consented_at).getTime()
    };
  } catch (error) {
    console.error('[Consent] Error fetching consent status:', error);
    return null;
  }
}

/**
 * Revoke all consent
 */
export async function revokeConsent(reason?: string): Promise<void> {
  if (typeof window === 'undefined') return;
  
  // First, update local state
  optOut();
  
  try {
    const response = await sendJsonApiMutationWithOfflineQueue('/consent/revoke', {
      method: 'POST',
      body: {
        revoke_reason: reason || 'user_request'
      },
      conflictKey: `consent:revoke:${reason || 'user_request'}`,
      metadata: {
        queue: 'consent-revoke',
      },
    });
    
    if (response instanceof Response && !response.ok) {
      console.warn('[Consent] Failed to revoke consent on backend:', response.statusText);
    }
  } catch (error) {
    console.error('[Consent] Error revoking consent:', error);
  }
}

/**
 * Check if analytics tracking is allowed
 */
export function hasAnalyticsConsent(): boolean {
  const consent = getConsent();
  return consent?.analytics === true;
}

/**
 * Check if marketing tracking is allowed
 */
export function hasMarketingConsent(): boolean {
  const consent = getConsent();
  return consent?.marketing === true;
}

/**
 * Opt-in to analytics
 */
export function optIn(): void {
  setConsent({ analytics: true, marketing: true });
}

/**
 * Opt-out of analytics (and clear persistence)
 */
export function optOut(): void {
  setConsent({ analytics: false, marketing: false });

  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(ATTRIBUTION_STORAGE_KEY);
      sessionStorage.removeItem(ATTRIBUTION_STORAGE_KEY);
      deleteCookie(ATTRIBUTION_STORAGE_KEY);
    } catch (e) {
      console.warn('[Consent] Failed to clear attribution storage', e);
    }
  }
  
  // Clear Mixpanel persistence
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('mp_avaliasolar_mixpanel');
      document.cookie.split(";").forEach(c => {
        if (c.trim().startsWith('mp_')) {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
        }
      });
    } catch (e) {
      console.warn('[Consent] Failed to clear tracking cookies', e);
    }
  }
}

/**
 * Listen to consent changes
 */
export function onConsentChange(callback: (consent: ConsentState) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<ConsentState>;
    callback(customEvent.detail);
  };
  
  window.addEventListener('consent-changed', handler);
  
  // Return cleanup function
  return () => window.removeEventListener('consent-changed', handler);
}
