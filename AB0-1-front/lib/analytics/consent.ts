/**
 * LGPD Consent Management
 * Manages user consent for analytics tracking
 */

import { ConsentState } from './types';

const CONSENT_STORAGE_KEY = 'avaliasolar_consent';

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
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('consent', 'update', {
      'ad_storage': updated.marketing ? 'granted' : 'denied',
      'analytics_storage': updated.analytics ? 'granted' : 'denied',
      'ad_user_data': updated.marketing ? 'granted' : 'denied',
      'ad_personalization': updated.marketing ? 'granted' : 'denied'
    });
  }
  
  // Emit event for listeners
  window.dispatchEvent(new CustomEvent('consent-changed', { detail: updated }));
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
