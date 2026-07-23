'use client';

import { track } from '@/lib/analytics/lazy';
import type { RecommendationItem, RecommendationMeta } from '@/lib/api-public';

const getDeviceType = (): 'mobile' | 'desktop' => {
  if (typeof window === 'undefined') return 'desktop';
  return window.innerWidth < 768 ? 'mobile' : 'desktop';
};

const extractBaseProperties = (item?: RecommendationItem | null, meta?: RecommendationMeta | null) => {
  return {
    request_id: meta?.request_id,
    company_id: item?.id,
    position: item?.ranking?.position,
    organic_position: item?.ranking?.position,
    sponsored: Boolean(item?.sponsored),
    segment: item?.segment || meta?.filters?.segment,
    category_slug: meta?.filters?.category_slug,
    city: meta?.location?.city,
    state: meta?.location?.state,
    location_source: meta?.location?.source,
    recommendation_reason: item?.recommendation_reason?.code,
    algorithm_version: meta?.recommendation_version || 'v1.0',
    device_type: getDeviceType(),
  };
};

export const trackRecommendedSectionViewed = (meta?: RecommendationMeta | null) => {
  track('recommended_section_viewed', extractBaseProperties(null, meta));
};

export const trackRecommendedFilterChanged = (tabId: string, segment?: string, meta?: RecommendationMeta | null) => {
  track('recommended_filter_changed', {
    ...extractBaseProperties(null, meta),
    tab_id: tabId,
    filter_segment: segment,
  });
};

export const trackRecommendedCompanyImpression = (item: RecommendationItem, meta?: RecommendationMeta | null) => {
  track('recommended_company_impression', extractBaseProperties(item, meta));
};

export const trackRecommendedPrimaryCtaClicked = (item: RecommendationItem, meta?: RecommendationMeta | null) => {
  track('recommended_primary_cta_clicked', {
    ...extractBaseProperties(item, meta),
    cta_type: item.primary_cta?.type,
    cta_label: item.primary_cta?.label,
    cta_action: item.primary_cta?.action,
  });
};

export const trackRecommendedProfileOpened = (item: RecommendationItem, meta?: RecommendationMeta | null) => {
  track('recommended_profile_opened', extractBaseProperties(item, meta));
};

export const trackRecommendedCompareSelected = (item: RecommendationItem, meta?: RecommendationMeta | null) => {
  track('recommended_compare_selected', extractBaseProperties(item, meta));
};

export const trackRecommendedCompareRemoved = (item: RecommendationItem, meta?: RecommendationMeta | null) => {
  track('recommended_compare_removed', extractBaseProperties(item, meta));
};

export const trackRecommendedCompareOpened = (meta?: RecommendationMeta | null) => {
  track('recommended_compare_opened', extractBaseProperties(null, meta));
};
