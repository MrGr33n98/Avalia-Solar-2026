'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { Company, Product, ProductReviewsResponse } from '@/lib/api';
import { track } from '@/lib/analytics/lazy';

interface UseProductTrackingParams {
  product: Product;
  company: Company | null;
  categoryId?: number | null;
  categoryName?: string;
  reviewsData?: ProductReviewsResponse | null;
}

const normalizePrice = (price: Product['price']) => {
  if (typeof price === 'number') return price;
  const parsed = Number(price || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function useProductTracking({
  product,
  company,
  categoryId,
  categoryName,
  reviewsData,
}: UseProductTrackingParams) {
  const hasTrackedViewRef = useRef(false);
  const hasTrackedReviewsVisibleRef = useRef(false);

  const getBasePayload = useCallback(
    () => ({
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      company_id: company?.id ?? product.company_id ?? product.company?.id,
      company_name: company?.name ?? product.company?.name,
      category_id: categoryId ?? product.category_id ?? product.category?.id,
      category_name: categoryName,
      price: normalizePrice(product.price),
    }),
    [categoryId, categoryName, company?.id, company?.name, product]
  );

  useEffect(() => {
    if (hasTrackedViewRef.current || typeof window === 'undefined') return;

    hasTrackedViewRef.current = true;
    track('product_viewed', {
      ...getBasePayload(),
      $current_url: window.location.href,
      referrer: document.referrer,
    });
  }, [getBasePayload]);

  const trackCTA = useCallback(
    (ctaType = 'request_quote') => {
      track('cta_clicked', {
        ...getBasePayload(),
        cta_type: ctaType,
        cta_location: 'product_page_sidebar',
      });
    },
    [getBasePayload]
  );

  const trackCompanyProfile = useCallback(() => {
    if (!company?.id) return;

    track('company_profile_viewed', {
      ...getBasePayload(),
      company_id: company.id,
      company_slug: company.slug,
      source: 'product_page_sidebar',
    });
  }, [company?.id, company?.slug, getBasePayload]);

  const trackTabChange = useCallback(
    (tab: 'description' | 'specifications' | 'reviews' | 'projects') => {
      track('product_tab_changed', {
        ...getBasePayload(),
        tab,
      });
    },
    [getBasePayload]
  );

  const trackReviewsVisible = useCallback(() => {
    if (hasTrackedReviewsVisibleRef.current) return;

    hasTrackedReviewsVisibleRef.current = true;
    track('reviews_section_visible', {
      ...getBasePayload(),
      reviews_count: reviewsData?.summary?.total_reviews ?? reviewsData?.reviews?.length ?? 0,
      average_rating: reviewsData?.summary?.average_rating ?? 0,
    });
  }, [getBasePayload, reviewsData?.reviews?.length, reviewsData?.summary?.average_rating, reviewsData?.summary?.total_reviews]);

  const trackRelatedProduct = useCallback(
    (toProductId: number, position: number) => {
      track('related_product_clicked', {
        ...getBasePayload(),
        from_product_id: product.id,
        to_product_id: toProductId,
        position,
      });
    },
    [getBasePayload, product.id]
  );

  const trackCompatibilityChip = useCallback(
    (chipLabel: string, verified: boolean) => {
      track('compatibility_chip_clicked', {
        ...getBasePayload(),
        company_name: chipLabel,
        verified,
      });
    },
    [getBasePayload]
  );

  return {
    trackCTA,
    trackCompanyProfile,
    trackTabChange,
    trackReviewsVisible,
    trackRelatedProduct,
    trackCompatibilityChip,
  };
}
