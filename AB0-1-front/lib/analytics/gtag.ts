/**
 * Google Analytics 4 (GA4) Integration
 * Wrapper for gtag.js with type safety
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

/**
 * Initialize gtag
 */
export function initializeGTag(measurementId: string): void {
  if (typeof window === 'undefined') return;
  if (window.gtag) return; // Already initialized
  
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: any[]) {
    window.dataLayer!.push(args);
  };
  
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false // Manual page view tracking
  });
}

/**
 * Track GA4 event
 */
export function gtagEvent(
  eventName: string,
  params?: Record<string, any>
): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  try {
    window.gtag('event', eventName, params);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[GA4] Event:', eventName, params);
    }
  } catch (e) {
    console.error('[GA4] Failed to track event:', e);
  }
}

/**
 * Track page view
 */
export function gtagPageView(
  url: string,
  title?: string,
  params?: Record<string, any>
): void {
  gtagEvent('page_view', {
    page_path: url,
    page_title: title,
    ...params
  });
}

/**
 * Set user properties
 */
export function gtagSetUserProperties(properties: Record<string, any>): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  try {
    window.gtag('set', 'user_properties', properties);
  } catch (e) {
    console.error('[GA4] Failed to set user properties:', e);
  }
}

/**
 * Set user ID
 */
export function gtagSetUserId(userId: string | null): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  try {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
      user_id: userId
    });
  } catch (e) {
    console.error('[GA4] Failed to set user ID:', e);
  }
}

/**
 * Map custom event to GA4 recommended event
 */
export function mapToGA4Event(
  eventName: string,
  properties: Record<string, any>
): { name: string; params: Record<string, any> } {
  // Map common events to GA4 recommended events
  const eventMap: Record<string, string> = {
    'Page Viewed': 'page_view',
    'Company Viewed': 'view_item',
    'Search Performed': 'search',
    'Lead Submitted': 'generate_lead',
    'Sign Up Completed': 'sign_up',
    'Login Completed': 'login',
    'Review Submitted': 'generate_lead', // Also considered a lead
    'Product Viewed': 'view_item',
    'CTA Clicked': 'select_content'
  };
  
  const ga4EventName = eventMap[eventName] || eventName.toLowerCase().replace(/ /g, '_');
  
  // Map properties to GA4 parameters
  const params: Record<string, any> = {};
  
  // Standard GA4 parameters
  if (properties.company_id) params.item_id = properties.company_id;
  if (properties.company_name) params.item_name = properties.company_name;
  if (properties.category_id) params.item_category = properties.category_name || properties.category_id;
  if (properties.search_term || properties.query) params.search_term = properties.search_term || properties.query;
  if (properties.cta_type) params.content_type = properties.cta_type;
  if (properties.placement) params.creative_slot = properties.placement;
  
  // Pass through other properties
  for (const [key, value] of Object.entries(properties)) {
    if (!params[key] && value !== undefined && value !== null) {
      params[key] = value;
    }
  }
  
  return { name: ga4EventName, params };
}
