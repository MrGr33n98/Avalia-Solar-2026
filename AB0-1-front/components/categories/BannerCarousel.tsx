'use client';

import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getFullImageUrl } from '@/utils/image';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { track } from '@/lib/analytics/lazy';
import { analyticsApi } from '@/lib/api-analytics';
import { PremiumBannerCarousel } from '@/components/PremiumBannerCarousel';

export interface Banner {
  id: number;
  delivery_id?: string | null;
  title: string;
  link_url?: string | null;
  image_url?: string | null;
  position?: string;
  description?: string | null;
}

interface BannerCarouselProps {
  banners: Banner[];
  loading?: boolean;
  className?: string;
}

export function BannerCarousel({ banners, loading, className }: BannerCarouselProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const impressionTrackedRef = React.useRef<Set<string>>(new Set());

  const trackImpression = React.useCallback((banner: Banner) => {
    const deliveryKey = banner.delivery_id || 'legacy';
    const impressionInstanceId = `${banner.id}:${deliveryKey}:${banner.position || 'categories_hero'}`;
    if (impressionTrackedRef.current.has(impressionInstanceId)) return;
    impressionTrackedRef.current.add(impressionInstanceId);
    void analyticsApi.trackBannerEvent({
      banner_id: banner.id,
      event_type: 'impression',
      impression_instance_id: impressionInstanceId,
      delivery_id: banner.delivery_id || undefined,
      metadata: { position: banner.position || 'categories_hero' },
    });
    track('banner_view', {
      banner_id: banner.id,
      banner_title: banner.title,
      banner_position: banner.position || 'categories_hero',
      element_type: 'banner',
      action_type: 'view',
    });
  }, []);

  React.useEffect(() => {
    if (loading || !banners.length) return;
    const firstBanner = banners[0];
    if (typeof IntersectionObserver === 'undefined') {
      trackImpression(firstBanner);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.5) return;
        trackImpression(firstBanner);
        observer.disconnect();
      },
      { threshold: [0.5] }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [banners, loading, trackImpression]);

  if (loading) {
    return (
      <div className={cn('h-[126px] w-full overflow-hidden rounded-none md:h-[168px]', className)}>
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
          href={`/api/v1/banner_clicks/${banner.id}`}
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
              destination_url: banner.link_url,
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
              action_type: 'hover',
            });
          }}
        >
          <BannerImageContent banner={banner} isFirst={index === 0} />
        </div>
      )}
    </div>
  ));

  return (
    <div ref={containerRef} className={cn('w-full py-2', className)}>
      <PremiumBannerCarousel
        items={items}
        aspectRatio="aspect-[16/7] md:aspect-[40/7]"
        autoplayDelay={5000}
        onActiveIndexChange={(index) => {
          const banner = banners[index];
          if (banner) trackImpression(banner);
        }}
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
        src={error ? '/images/default-banner.svg' : imageUrl || '/images/default-banner.svg'}
        alt=""
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        priority={isFirst}
        quality={90}
        fallbackSrc="/images/default-banner.svg"
        onError={() => setError(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 p-4 md:p-6 text-white pointer-events-none w-full">
        <h3 className="text-lg md:text-2xl font-bold mb-1 drop-shadow-lg tracking-tight">
          {banner.title}
        </h3>
        {banner.description && (
          <p className="text-sm md:text-base text-white/90 drop-shadow-md max-w-2xl line-clamp-1">
            {banner.description}
          </p>
        )}
      </div>
    </>
  );
}
