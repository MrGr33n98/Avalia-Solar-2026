'use client';

import { track } from './lazy';

export function trackCompanyCategoryEmptyViewed(payload: {
  company_id: number | string;
  company_name: string;
  category_id: number | string;
  category_name: string;
  has_suggestions: boolean;
  suggestion_count: number;
}) {
  track('company_category_empty_viewed', payload);
}

export function trackCompanyCategorySuggestionClicked(payload: {
  company_id: number | string;
  company_name: string;
  category_id: number | string;
  category_name: string;
  suggestion_type: 'product' | 'category' | 'competitor' | 'quote';
  target_id?: number | string;
  target_name?: string;
}) {
  track('company_category_suggestion_clicked', payload);
}

export function trackCompanyCategoryQuoteStarted(payload: {
  company_id: number | string;
  company_name: string;
  category_id: number | string;
  category_name: string;
  source: string;
}) {
  track('company_category_quote_started', payload);
}

export function trackCompanyCategorySearch(payload: {
  company_id: number | string;
  company_name: string;
  category_id: number | string;
  category_name: string;
  query: string;
  result_count: number;
}) {
  track('company_category_search', payload);
}

export function trackCompanyCategoryFavoriteToggled(payload: {
  company_id: number | string;
  product_id: number | string;
  product_name: string;
  is_favorite: boolean;
}) {
  track('company_category_favorite_toggled', payload);
}

export function trackCompanyProfileCategoryDropdownOpened(payload: {
  company_id: number | string;
  company_name: string;
}) {
  track('company_profile_category_dropdown_opened', payload);
}

export function trackCompanyProfileCategorySelected(payload: {
  company_id: number | string;
  company_name: string;
  category_id: number | string;
  category_name: string;
}) {
  track('company_category_selected', {
    ...payload,
    source: 'company_profile_dropdown',
  });
}
