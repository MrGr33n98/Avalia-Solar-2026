/**
 * Analytics Types & Interfaces
 * Centralized type definitions for analytics tracking
 */

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  options?: EventOptions;
}

export interface EventOptions {
  critical?: boolean;
  sendTo?: {
    mixpanel?: boolean;
    posthog?: boolean;
    ga4?: boolean;
    backend?: boolean;
  };
  eventId?: string;
}

export interface AnalyticsContext {
  // Environment & Versioning
  environment: string;
  event_version?: string;
  schema_version?: string;
  frontend_version?: string;
  api_version?: string;
  app_version: string;
  platform: 'web' | 'mobile';
  app_key?: string;

  // Page
  page_url?: string;
  pathname: string;
  referrer: string;
  referrer_host?: string;

  // Session & Event
  session_id: string;
  event_id?: string;

  // UTM Parameters
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
  landing_path?: string;
  attribution?: Attribution;

  // Geo (when available)
  city?: string;
  state?: string;
  country?: string;

  // User state
  is_logged_in: boolean;
  is_internal?: boolean;
  is_admin?: boolean;
  is_employee?: boolean;
  user_id?: string;
  company_id?: string;
  company_name?: string;
  category_id?: string;
  tier?: string;
  brand_id?: number | string;
  brand_slug?: string;
}

export interface UserTraits {
  name?: string;
  email?: string;
  role?: 'user' | 'company' | 'admin' | 'review';
  company_id?: string;
  company_name?: string;
  city?: string;
  state?: string;
  created_at?: string;
  tier?: string;
}

export interface ConsentState {
  analytics: boolean;
  marketing: boolean;
  lastUpdated: number;
}

export interface UTMParameters {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
}

export type AttributionTouch = {
  values: UTMParameters;
  landing_path: string;
  referrer_host?: string;
  ts: string;
};

export type Attribution = {
  first_touch: AttributionTouch;
  last_touch: AttributionTouch;
  ttl_days: number;
};
