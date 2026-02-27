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
  | 'company_card_impression';

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

  sortChange: (payload: SortChangeEvent) =>
    trackEvent('sort_change', payload),

  filterToolbarRemove: (payload: FilterToolbarRemoveEvent) =>
    trackEvent('filter_toolbar_remove', payload),

  companyCardImpression: (payload: CompanyCardImpressionEvent) =>
    trackEvent('company_card_impression', payload),
};
