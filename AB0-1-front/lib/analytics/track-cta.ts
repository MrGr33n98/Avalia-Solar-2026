/**
 * CTA Tracking Helper - Real Analytics Implementation
 * 
 * Tracks CTA clicks through the unified analytics layer.
 * The shared layer handles consent, backend forwarding and GA4/GTM dispatch.
 */

import { track } from '@/lib/analytics/lazy';

interface CTAClickProperties {
  ctaType: 'whatsapp' | 'email' | 'phone' | 'website' | 'quote';
  ctaLocation: 'hero' | 'sidebar' | 'footer' | 'floating' | 'overview' | 'reviews' | 'other';
  companyId: string;
  companyName: string;
  destinationUrl?: string;
  phoneNumber?: string;
  email?: string;
}

interface TrackingMetadata {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  device_type: 'desktop' | 'mobile' | 'tablet';
  timestamp: string;
  page_url: string;
  full_url: string;
  referrer: string;
}

/**
 * Extract UTM parameters from current URL
 */
function getUTMParams(): Omit<TrackingMetadata, 'device_type' | 'timestamp' | 'page_url' | 'referrer'> {
  if (typeof window === 'undefined') {
    return {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
    };
  }

  const searchParams = new URLSearchParams(window.location.search);
  return {
    utm_source: searchParams.get('utm_source'),
    utm_medium: searchParams.get('utm_medium'),
    utm_campaign: searchParams.get('utm_campaign'),
    utm_content: searchParams.get('utm_content'),
    utm_term: searchParams.get('utm_term'),
  };
}

/**
 * Detect device type from user agent
 */
function getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  
  const ua = navigator.userAgent;
  
  // Tablet detection
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  
  // Mobile detection
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  
  return 'desktop';
}

/**
 * Get tracking metadata (UTM + context)
 */
function getTrackingMetadata(): TrackingMetadata {
  return {
    ...getUTMParams(),
    device_type: getDeviceType(),
    timestamp: new Date().toISOString(),
    page_url: typeof window !== 'undefined' ? window.location.pathname : '',
    full_url: typeof window !== 'undefined' ? window.location.href : '',
    referrer: typeof window !== 'undefined' ? document.referrer : '',
  };
}

/**
 * Main CTA tracking function
 * Sends events to Mixpanel, GA4, and Backend API
 */
export async function trackCTAClick(props: CTAClickProperties): Promise<void> {
  try {
    const metadata = getTrackingMetadata();
    
    // Prepare base event properties
    const baseProperties = {
      cta_type: props.ctaType,
      cta_location: props.ctaLocation,
      company_id: props.companyId,
      company_name: props.companyName,
      destination_url: props.destinationUrl,
      phone_number: props.phoneNumber,
      email: props.email,
      ...metadata,
    };

    // 1. Track generic CTA click event (Unified snake_case)
    await track('company_cta_clicked', baseProperties);

    // 2. Track specific CTA type event
    const specificEvents: Record<string, string> = {
      whatsapp: 'company_cta_whatsapp',
      email: 'company_cta_email',
      phone: 'company_cta_phone',
      website: 'company_cta_website',
      quote: 'company_cta_quote',
    };

    const specificEventName = specificEvents[props.ctaType];
    if (specificEventName) {
      await track(specificEventName, {
        company_id: props.companyId,
        company_name: props.companyName,
        cta_location: props.ctaLocation,
        ...metadata,
      });
    }

    // Debug log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] CTA Tracked', {
        event: specificEventName || 'CTA Clicked',
        properties: baseProperties,
      });
    }
  } catch (error) {
    console.error('[Analytics] Failed to track CTA click:', error);
    // Don't throw - tracking failures should not break user experience
  }
}

/**
 * Track company profile view
 * Call this on company profile page mount
 */
export async function trackCompanyProfileView(
  companyId: string,
  companyName: string,
  categoryId?: string
): Promise<void> {
  try {
    const metadata = getTrackingMetadata();
    
    await track('Company Profile Viewed', {
      company_id: companyId,
      company_name: companyName,
      category_id: categoryId,
      ...metadata,
    });

  } catch (error) {
    console.error('[Analytics] Failed to track profile view:', error);
  }
}

/**
 * Track lead form submission
 */
export async function trackLeadFormSubmit(
  companyId: string,
  companyName: string,
  formType: 'quote' | 'contact' | 'callback'
): Promise<void> {
  try {
    const metadata = getTrackingMetadata();
    
    await track('Lead Form Submitted', {
      company_id: companyId,
      company_name: companyName,
      form_type: formType,
      lead_source: metadata.utm_source || 'organic',
      ...metadata,
    });

  } catch (error) {
    console.error('[Analytics] Failed to track lead form:', error);
  }
}

/**
 * Add UTM parameters to a URL
 * Use this for external links (WhatsApp, website, etc)
 */
export function addUTMToUrl(baseUrl: string, ctaType: string): string {
  try {
    const url = new URL(baseUrl);
    const params = new URLSearchParams(url.search);
    
    // Add Avalia Solar UTM tags
    params.set('utm_source', 'avaliasolar');
    params.set('utm_medium', 'company_profile');
    params.set('utm_campaign', 'profile_cta');
    params.set('utm_content', ctaType);
    
    url.search = params.toString();
    return url.toString();
  } catch (error) {
    // If URL parsing fails, return original
    console.warn('[Analytics] Failed to add UTM to URL:', baseUrl, error);
    return baseUrl;
  }
}
