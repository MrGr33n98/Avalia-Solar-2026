'use client';

import { track } from '@/lib/analytics/lazy';
import type { RecommendationItem, RecommendationMeta } from '@/lib/api-public';

const conversionEventsV2 = process.env.NEXT_PUBLIC_CONVERSION_EVENTS_V2_ENABLED === 'true';

const nextEventId = (prefix: string): string => {
  const random = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${random}`;
};

const getDeviceType = (): 'mobile' | 'desktop' => {
  if (typeof window === 'undefined') return 'desktop';
  if (window.matchMedia) {
    return window.matchMedia('(max-width: 767px)').matches ? 'mobile' : 'desktop';
  }
  return 'desktop';
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
    surface: 'homepage',
    placement: 'recommendation_card',
    surface_id: 'CV-HOME-REC',
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
  const properties = extractBaseProperties(item, meta);
  track('recommended_company_impression', properties);
  // Called only after 50% visibility sustained for >=1s by RecommendedCompanyCard.
  // Registry metrics are deliberately opt-in until E2E event certification.
  if (conversionEventsV2 && item.id) {
    track('surface_impression', {
      ...properties, qualified: true,
      event_id: nextEventId('surface_impression'),
    });
  }
};

export const trackRecommendedPrimaryCtaClicked = (item: RecommendationItem, meta?: RecommendationMeta | null) => {
  const props = {
    ...extractBaseProperties(item, meta),
    cta_type: item.primary_cta?.type,
    cta_label: item.primary_cta?.label,
    cta_action: item.primary_cta?.action,
  };
  track('recommended_primary_cta_clicked', props);
  const channel = item.primary_cta?.type === 'request_quote' ? 'quote'
    : item.primary_cta?.type === 'whatsapp' ? 'whatsapp' : null;
  if (conversionEventsV2 && channel && item.has_paid_plan === true &&
      item.cta_visibility?.effective?.[channel] === true) {
    // Single canonical event, no second company_cta_clicked event from this card.
    track('company_cta_clicked', {
      ...props,
      cta_type: channel,
      event_id: nextEventId('surface_cta_click'),
    });
  }
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
