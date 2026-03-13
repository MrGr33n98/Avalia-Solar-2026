'use client';

import { page, track } from './lazy';

export { alias, identify, initializeAnalytics, preloadAnalytics, reset, setUserProperties, updateContext } from './lazy';
export type { AnalyticsContext, EventOptions, UserTraits } from './types';

/**
 * Consolidated Analytics Layer V2
 * Centralizes all event tracking logic for PostHog and GTM
 */

export interface GTMEvent {
  event: string;
  [key: string]: any;
}

export interface PageData {
  type: 'homepage' | 'category' | 'company_detail' | 'comparison' | 'wizard_step' | 'lead_conversion' | 'general';
  path: string;
  title: string;
  referrer?: string;
  language: 'pt-BR';
  sections?: string[];
}

export interface UserData {
  id?: string | number;
  type?: 'user' | 'company_admin' | 'admin';
  tier?: 'free' | 'premium' | 'enterprise';
}

// --------------------------------------------------------------------------
// CORE BUSINESS EVENTS (Funil de Demanda)
// --------------------------------------------------------------------------

/**
 * Track Landing Page view (Home)
 */
export function trackLandingViewed(properties: Record<string, any> = {}): void {
  track('landing_viewed', {
    ...properties,
    content_type: 'homepage',
  });
}

/**
 * Track Category Selection
 */
export function trackCategorySelected(categoryId: string | number, categorySlug: string, properties: Record<string, any> = {}): void {
  track('category_selected', {
    category_id: String(categoryId),
    category_slug: categorySlug,
    ...properties,
  });
}

/**
 * Track Company Profile View
 */
export function trackCompanyProfileViewed(companyId: string | number, companyName: string, planTier?: string): void {
  track('company_profile_viewed', {
    company_id: String(companyId),
    company_name: companyName,
    plan_tier: planTier || 'free',
  });
}

/**
 * Track Company CTA Click (Primary Conversion)
 */
export function trackCompanyCtaClicked(companyId: string | number, ctaType: string, properties: Record<string, any> = {}): void {
  track('company_cta_clicked', {
    company_id: String(companyId),
    cta_type: ctaType,
    ...properties,
  });
}

/**
 * Track Wizard Start
 */
export function trackWizardStart(wizardId: string, source: string, categoryId?: string | number) {
  track('wizard_started', {
    wizard_id: wizardId,
    entry_point: source,
    category_id: categoryId ? String(categoryId) : undefined,
  });
}

/**
 * Track Contact Submission (Pre-OTP)
 */
export function trackWizardContactSubmitted(leadId: string, categoryId: string | number) {
  track('wizard_contact_submitted', {
    lead_id: leadId,
    category_id: String(categoryId),
  });
}

/**
 * Track OTP Verification Success
 * Note: This might be triggered from backend as well, but frontend can track client-side success
 */
export function trackOtpVerified(userId: string, method: string = 'sms') {
  track('otp_verified', {
    user_id: userId,
    auth_method: method,
  });
}

/**
 * Track Lead Success (Lead Created)
 */
export function trackLeadSuccess(data: {
  lead_id?: string;
  company_id?: string | number;
  value?: number;
  currency?: string;
  category?: string;
  city?: string;
}) {
  track('lead_created', {
    ...data,
    lead_id: data.lead_id,
    company_id: data.company_id ? String(data.company_id) : undefined,
  });
}

/**
 * Track Lead Dispatched
 */
export function trackLeadDispatched(leadId: string, recipientId?: string | number) {
  track('lead_dispatched', {
    lead_id: leadId,
    recipient_id: recipientId ? String(recipientId) : undefined,
  });
}

// --------------------------------------------------------------------------
// JOURNEY & SUPPORTING EVENTS
// --------------------------------------------------------------------------

/**
 * Track Page View (General)
 */
export function trackPageView(
  pageData: PageData,
  user?: UserData,
  additionalData?: Record<string, any>
): void {
  // If it's homepage, also trigger the semantic event
  if (pageData.type === 'homepage') {
    trackLandingViewed(additionalData);
  }

  page(pageData.title, {
    page_type: pageData.type,
    pathname: pageData.path,
    page_title: pageData.title,
    referrer: pageData.referrer,
    language: pageData.language,
    sections: pageData.sections,
    user_properties: user,
    ...additionalData,
  });
}

export function trackContactClick(
  method: 'whatsapp' | 'phone',
  company: { id: string | number; name: string }
) {
  // Map to new taxonomy: company_cta_clicked
  trackCompanyCtaClicked(company.id, method, {
    company_name: company.name,
    content_type: 'company_contact',
  });
  
  // Keep legacy for backward compatibility if needed, but the primary is now CTA click
  track(method === 'whatsapp' ? 'whatsapp_click' : 'phone_click', {
    company_id: String(company.id),
    company_name: company.name,
    contact_type: method,
  });
}

export function trackSearchPerformance(term: string, resultsCount: number) {
  track('search_performed', {
    search_term: term,
    results_count: resultsCount,
    has_results: resultsCount > 0,
  });

  if (resultsCount === 0) {
    track('search_no_results', {
      search_term: term,
    });
  }
}

export function trackFaqEngagement(action: 'expand' | 'vote_up' | 'vote_down', question: string) {
  track('faq_interaction', {
    action_type: action,
    faq_question: question,
  });
}

export function trackDashboardViewed(companyId: string | number, tab: string, properties: Record<string, any> = {}) {
  track('dashboard_viewed', {
    company_id: String(companyId),
    tab,
    ...properties
  });
}

// --------------------------------------------------------------------------
// RETENTION & LOYALTY (Retenção)
// --------------------------------------------------------------------------

/**
 * Track user returning to the app
 */
export function trackUserReturned(daysSinceLastVisit?: number): void {
  track('user_returned', {
    days_since_last_visit: daysSinceLastVisit,
  });
}

// --------------------------------------------------------------------------
// MONETIZATION (Monetização)
// --------------------------------------------------------------------------

/**
 * Track when a user starts a plan upgrade flow
 */
export function trackCheckoutStarted(planId: string | number, currentPlanId?: string | number): void {
  track('checkout_started', {
    target_plan_id: String(planId),
    current_plan_id: currentPlanId ? String(currentPlanId) : undefined,
  });
}

/**
 * Track successful plan upgrade
 */
export function trackPlanUpgraded(planId: string | number, previousPlanId?: string | number, revenue?: number): void {
  track('plan_upgraded', {
    new_plan_id: String(planId),
    previous_plan_id: previousPlanId ? String(previousPlanId) : undefined,
    revenue: revenue,
  });
}

/**
 * Track churn intent (e.g. visiting cancellation page)
 */
export function trackChurnIntent(reason?: string): void {
  track('churn_intent', {
    reason: reason,
  });
}

// --------------------------------------------------------------------------
// UTILS
// --------------------------------------------------------------------------

export function pushToDataLayer(data: GTMEvent): void {
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    ...data,
    gtm_timestamp: new Date().toISOString(),
  });
}

export function getGtmSessionId(): string {
  if (typeof window === 'undefined') return '';

  let id = sessionStorage.getItem('gtm_session_id');
  if (!id) {
    id = `gtm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('gtm_session_id', id);
  }
  return id;
}
