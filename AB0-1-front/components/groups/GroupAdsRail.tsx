'use client';

import React from 'react';
import { useBannersQuery } from '@/hooks/useBannersQuery';
import BannerByLocation from '@/components/BannerByLocation';

interface GroupAdsRailProps {
  categoryId?: number | string | null;
}

export function GroupAdsRail({ categoryId }: GroupAdsRailProps) {
  const { data: banners, isLoading } = useBannersQuery({
    position: 'groups_right_rail',
    fallbackPositions: ['sidebar'],
    category_id: categoryId || undefined,
    limit: 1,
  });

  const banner = banners?.[0];

  if (!banner && !isLoading) return null;

  return (
    <div className="w-full space-y-4" aria-label="Patrocinado">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Patrocinado</span>
      </div>
      <BannerByLocation
        location="groups_right_rail"
        fallbackLocations={['sidebar']}
        categoryId={categoryId || undefined}
        limit={1}
        initialBanners={banner ? [banner] : undefined}
        className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 border border-slate-200/50"
      />
    </div>
  );
}
