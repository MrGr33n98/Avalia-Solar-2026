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
    ga4?: boolean;
  };
  eventId?: string;
}

export interface AnalyticsContext {
  // Environment
  environment: string;
  app_version: string;
  platform: 'web' | 'mobile';
  
  // Page
  pathname: string;
  referrer: string;
  
  // Session
  session_id: string;
  
  // UTM Parameters
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  
  // Geo (when available)
  city?: string;
  state?: string;
  country?: string;
  
  // User state
  is_logged_in: boolean;
  user_id?: string;
  company_id?: string;
  tier?: string;
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
}
