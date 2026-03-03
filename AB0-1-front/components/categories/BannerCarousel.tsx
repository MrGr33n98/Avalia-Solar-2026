'use client';

import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getFullImageUrl } from '@/utils/image';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { track } from '@/lib/analytics/lazy';
import { PremiumBannerCarousel } from '@/components/PremiumBannerCarousel';

export interface Banner {
  id: number;
  title: string;
  link_url?: string;
  image_url: string;
  position?: string;
  description?: string;
}

interface BannerCarouselProps {
  banners: Banner[];
  loading?: boolean;
  className?: string;
}

export function BannerCarousel({ banners, loading, className }: BannerCarouselProps) {
  if (loading) {
    return (
      <div className={cn("w-full h-[180px] md:h-[240px] rounded-xl overflow-hidden", className)}>
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (!banners || banners.length === 0) {
    return null;
  }

  const items = banners.map((banner, index) => (
    <div key={banner.id} className="relative w-full h-full group">
      {banner.link_url ? (
        <a
          href={banner.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full h-full"
          onClick={() => {
            track('banner_click', {
              banner_id: banner.id,
              banner_title: banner.title,
              banner_position: banner.position || 'categories_hero',
              element_type: 'banner',
              action_type: 'click',
              destination_url: banner.link_url
            });
          }}
        >
          <BannerImageContent banner={banner} isFirst={index === 0} />
        </a>
      ) : (
        <div 
          className="w-full h-full"
          onMouseEnter={() => {
            track('banner_hover', {
              banner_id: banner.id,
              banner_title: banner.title,
              banner_position: banner.position || 'categories_hero',
              element_type: 'banner',
              action_type: 'hover'
            });
          }}
        >
          <BannerImageContent banner={banner} isFirst={index === 0} />
        </div>
      )}
    </div>
  ));

  return (
    <div className={cn("w-full py-2", className)}>
      <PremiumBannerCarousel 
        items={items}
        aspectRatio="aspect-[16/10] md:aspect-[4/1]"
        autoplayDelay={5000}
      />
    </div>
  );
}

function BannerImageContent({ banner, isFirst }: { banner: Banner; isFirst: boolean }) {
  const imageUrl = getFullImageUrl(banner.image_url);
  const [error, setError] = React.useState(false);

  return (
    <>
      <OptimizedImage
        src={error ? '/images/default-banner.svg' : (imageUrl || '/images/default-banner.svg')}
        alt={banner.title}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        priority={isFirst}
        quality={90}
        fallbackSrc="/images/default-banner.svg"
        onError={() => setError(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 p-4 md:p-6 text-white pointer-events-none w-full">
        <h3 className="text-lg md:text-2xl font-bold mb-1 drop-shadow-lg tracking-tight">{banner.title}</h3>
        {banner.description && (
          <p className="text-sm md:text-base text-white/90 drop-shadow-md max-w-2xl line-clamp-1">
            {banner.description}
          </p>
        )}
      </div>
    </>
  );
}
