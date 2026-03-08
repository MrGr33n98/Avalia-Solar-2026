/**
 * Analytics Event Tracking for Category Page v2
 * Centralized event definitions and tracking functions
 */

export type AnalyticsEventName =
  | 'category_page_view'
  | 'quick_filter_click'
  | 'company_card_click'
  | 'lead_open_internal'
  | 'lead_submit_internal'
  | 'lead_success'
  | 'lead_click_direct'
  | 'sort_change'
  | 'filter_toolbar_remove'
  | 'company_card_impression'
  | 'phone_click'
  | 'whatsapp_click'
  | 'wizard_started'
  | 'wizard_step_completed'
  | 'search_no_results'
  | 'roi_expand'
  | 'regional_companies_view'
  | 'faq_vote'
  | 'category_menu_hover'
  | 'scroll_depth_reached';

export interface AnalyticsEventPayload {
  [key: string]: any;
  timestamp?: number;
}

export interface CategoryPageViewEvent {
  category: string;
  filters_applied?: string;
  user_id?: string;
}

export interface QuickFilterClickEvent {
  filter_name: string;
  state: 'on' | 'off';
  category?: string;
}

export interface CompanyCardClickEvent {
  company_id: number;
  company_name?: string;
  placement: 'top' | 'sponsored' | 'organic';
  card_variant?: 'compact' | 'rich';
  category?: string;
}

export interface LeadOpenInternalEvent {
  company_id: number;
  company_name?: string;
  placement: 'card' | 'modal' | 'hero';
  category?: string;
}

export interface LeadSubmitInternalEvent {
  company_id: number;
  company_name?: string;
  category?: string;
  project_type?: string;
  success?: boolean;
}

export interface LeadSuccessEvent {
  company_id: number;
  company_name?: string;
  category?: string;
  lead_id?: string;
}

export interface LeadClickDirectEvent {
  company_id: number;
  company_name?: string;
  category?: string;
  url?: string;
}

export interface SortChangeEvent {
  sort_by: 'rating_desc' | 'reviews_desc' | 'name_asc' | 'recent';
  category?: string;
}

export interface FilterToolbarRemoveEvent {
  filter_key: string;
  filter_value?: string;
  category?: string;
}

export interface CompanyCardImpressionEvent {
  company_id: number;
  company_name?: string;
  placement: 'top' | 'sponsored' | 'organic';
  position?: number;
  category?: string;
}

/**
 * Track event with automatic timestamp
 */
export function trackEvent(
  name: AnalyticsEventName,
  payload: AnalyticsEventPayload = {}
): void {
  const event = {
    name,
    payload: {
      ...payload,
      timestamp: Date.now(),
    },
  };

  // Console log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', event);
  }

  // Send to analytics service (implement based on your provider)
  // Example: gtag, mixpanel, segment, etc.
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', name, event.payload);
  }

  // Custom event dispatch for app-wide listening
  if (typeof window !== 'undefined') {
    const customEvent = new CustomEvent('analytics:event', { detail: event });
    window.dispatchEvent(customEvent);
  }
}

/**
 * Convenience tracking functions
 */
export const analytics = {
  categoryPageView: (payload: CategoryPageViewEvent) =>
    trackEvent('category_page_view', payload),

  quickFilterClick: (payload: QuickFilterClickEvent) =>
    trackEvent('quick_filter_click', payload),

  companyCardClick: (payload: CompanyCardClickEvent) =>
    trackEvent('company_card_click', payload),

  leadOpenInternal: (payload: LeadOpenInternalEvent) =>
    trackEvent('lead_open_internal', payload),

  leadSubmitInternal: (payload: LeadSubmitInternalEvent) =>
    trackEvent('lead_submit_internal', payload),

  leadSuccess: (payload: LeadSuccessEvent) =>
    trackEvent('lead_success', payload),

  leadClickDirect: (payload: LeadClickDirectEvent) =>
    trackEvent('lead_click_direct', payload),

  phoneClick: (payload: { company_id: number; company_name?: string; category?: string }) =>
    trackEvent('phone_click', payload),

  whatsappClick: (payload: { company_id: number; company_name?: string; category?: string }) =>
    trackEvent('whatsapp_click', payload),

  wizardStarted: (payload: { wizard_id: string; category_id?: number; region_slug?: string }) =>
    trackEvent('wizard_started', payload),

  wizardStepCompleted: (payload: { 
    wizard_id: string; 
    step_name: string; 
    step_number: number;
    category_id?: number;
    region_slug?: string 
  }) => trackEvent('wizard_step_completed', payload),

  searchNoResults: (payload: { search_term: string; search_category?: string }) =>
    trackEvent('search_no_results', payload),

  roiExpand: (payload: { location: string; estimated_payback?: number }) =>
    trackEvent('roi_expand', payload),

  regionalCompaniesView: (payload: { location: string; category?: string }) =>
    trackEvent('regional_companies_view', payload),

  faqVote: (payload: { question: string; vote: 'up' | 'down'; location?: string }) =>
    trackEvent('faq_vote', payload),

  categoryMenuHover: (payload: { category_name: string }) =>
    trackEvent('category_menu_hover', payload),

  scrollDepthReached: (payload: { depth: number; page_type: string }) =>
    trackEvent('scroll_depth_reached', payload),

  sortChange: (payload: SortChangeEvent) =>
    trackEvent('sort_change', payload),

  filterToolbarRemove: (payload: FilterToolbarRemoveEvent) =>
    trackEvent('filter_toolbar_remove', payload),

  companyCardImpression: (payload: CompanyCardImpressionEvent) =>
    trackEvent('company_card_impression', payload),
};
