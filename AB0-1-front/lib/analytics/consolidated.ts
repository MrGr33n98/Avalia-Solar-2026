'use client';

import { page, track } from './lazy';

export { alias, identify, initializeAnalytics, preloadAnalytics, reset, setUserProperties, updateContext } from './lazy';
export type { AnalyticsContext, EventOptions, UserTraits } from './types';

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

export function pushToDataLayer(data: GTMEvent): void {
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    ...data,
    gtm_timestamp: new Date().toISOString(),
  });
}

export function trackPageView(
  pageData: PageData,
  user?: UserData,
  additionalData?: Record<string, any>
): void {
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

export function trackLeadSuccess(data: {
  lead_id?: string;
  value?: number;
  currency?: string;
  category?: string;
  city?: string;
}) {
  track('lead_created', data);
}

export function trackContactClick(
  method: 'whatsapp' | 'phone',
  company: { id: string | number; name: string }
) {
  track(method === 'whatsapp' ? 'whatsapp_click' : 'phone_click', {
    company_id: company.id,
    company_name: company.name,
    contact_type: method,
    content_type: 'company_contact',
  });
}

export function trackWizardStart(wizardId: string, source: string) {
  track('wizard_started', {
    wizard_id: wizardId,
    source_location: source,
  });
}

export function trackSearchPerformance(term: string, resultsCount: number) {
  track('search_performance', {
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

export function trackValueDataInteraction(type: 'roi_expand' | 'radiation_view', region: string) {
  track('value_data_interaction', {
    interaction_type: type,
    region,
  });
}

export function trackMenuIntent(categoryName: string) {
  track('menu_intent', {
    category_name: categoryName,
  });
}

export function trackCompanyListImpression(companies: any[], listName: string) {
  track('company_list_impression', {
    item_list_name: listName,
    items: companies.map((company, index) => ({
      item_id: String(company.id),
      item_name: company.name,
      index: index + 1,
      item_category: company.category,
    })),
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
