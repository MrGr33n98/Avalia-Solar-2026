'use client';

import React, { useEffect } from 'react';
import { useBannersQuery } from '@/hooks/useBannersQuery';
import BannerByLocation from '@/components/BannerByLocation';
import type { Banner } from '@/lib/api';

interface CategoryAdsRailProps {
  categoryId: number | string;
  initialFilterBanners?: Banner[];
  initialRightRailBanners?: Banner[];
  onHasBannersChange?: (hasBanners: boolean) => void;
}

export default function CategoryAdsRail({
  categoryId,
  initialFilterBanners,
  initialRightRailBanners,
  onHasBannersChange,
}: CategoryAdsRailProps) {
  // Query 1: Filter sidebar banner (NO fallback to sidebar!)
  const { data: filterBanners } = useBannersQuery({
    position: 'categories_filter_sidebar',
    category_id: categoryId,
    limit: 1,
  });

  // Query 2: Right rail banner (with fallback to sidebar)
  const { data: rightRailBanners } = useBannersQuery({
    position: 'categories_right_rail',
    fallbackPositions: ['sidebar'],
    category_id: categoryId,
    limit: 1,
  });

  // Resolve banners (use query data or fallback to initial data)
  const filterBanner = filterBanners?.[0] || initialFilterBanners?.[0];
  const rightRailBanner = rightRailBanners?.[0] || initialRightRailBanners?.[0];

  // Apply priority and deduplication rules
  // Rule: categories_right_rail > categories_filter_sidebar > sidebar fallback
  let finalFilterBanner: Banner | undefined = filterBanner;
  let finalRightRailBanner: Banner | undefined = rightRailBanner;

  if (filterBanner && rightRailBanner && filterBanner.id === rightRailBanner.id) {
    const isRightRailSpecific = rightRailBanner.position === 'categories_right_rail';
    const isFilterSpecific = filterBanner.position === 'categories_filter_sidebar';

    if (isRightRailSpecific) {
      // Right rail specific has higher priority than filter sidebar
      finalFilterBanner = undefined;
    } else if (isFilterSpecific) {
      // Filter sidebar specific has higher priority than sidebar fallback
      finalRightRailBanner = undefined;
    } else {
      // If both resolved to fallback (though filter doesn't have it anymore), keep right rail
      finalFilterBanner = undefined;
    }
  }

  // Development logger
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        '[CategoryAds]\n' +
        `filter_sidebar:\n` +
        `  banner_id: ${filterBanner?.id || 'none'}\n` +
        `  source: ${filterBanner?.position || 'none'}\n` +
        `right_rail:\n` +
        `  banner_id: ${rightRailBanner?.id || 'none'}\n` +
        `  source: ${rightRailBanner?.position || 'none'}`
      );
    }
  }, [filterBanner, rightRailBanner]);

  // Inform parent client component about banner existence for grid layout adjustment
  const hasBanners = !!(finalFilterBanner || finalRightRailBanner);
  useEffect(() => {
    if (onHasBannersChange) {
      onHasBannersChange(hasBanners);
    }
  }, [hasBanners, onHasBannersChange]);

  return (
    <>
      {/* Mobile Placement */}
      {finalFilterBanner && (
        <div data-testid="category-filter-banner-mobile" className="lg:hidden">
          <BannerByLocation
            location="categories_filter_sidebar"
            categoryId={categoryId}
            limit={1}
            initialBanners={[finalFilterBanner]}
            className="mx-auto max-w-[300px]"
          />
        </div>
      )}

      {/* Desktop Placement (Ads Rail) */}
      {hasBanners && (
        <aside
          data-testid="category-ads-rail"
          className="hidden space-y-6 lg:block"
          aria-label="Publicidade da categoria"
        >
          {finalFilterBanner && (
            <BannerByLocation
              location="categories_filter_sidebar"
              categoryId={categoryId}
              limit={1}
              initialBanners={[finalFilterBanner]}
            />
          )}
          {finalRightRailBanner && (
            <BannerByLocation
              location="categories_right_rail"
              fallbackLocations={['sidebar']}
              categoryId={categoryId}
              limit={1}
              initialBanners={[finalRightRailBanner]}
            />
          )}
        </aside>
      )}
    </>
  );
}
