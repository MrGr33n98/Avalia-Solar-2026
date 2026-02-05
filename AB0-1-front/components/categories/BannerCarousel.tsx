'use client';

import * as React from 'react';
import Autoplay from 'embla-carousel-autoplay';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';
import { getFullImageUrl } from '@/utils/image';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { track } from '@/lib/analytics';

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
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  if (loading) {
    return (
      <div className={cn("w-full h-[280px] md:h-[400px] rounded-xl overflow-hidden", className)}>
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <Carousel
      plugins={[plugin.current]}
      className={cn("w-full rounded-xl overflow-hidden shadow-lg", className)}
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
      opts={{
        align: "start",
        loop: true,
      }}
    >
      <CarouselContent>
        {banners.map((banner, index) => (
          <CarouselItem key={banner.id}>
            <div className="relative w-full h-[280px] md:h-[400px] group">
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
                  <BannerImage banner={banner} isFirst={index === 0} />
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
                  <BannerImage banner={banner} isFirst={index === 0} />
                </div>
              )}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {banners.length > 1 && (
        <>
          <CarouselPrevious className="left-4 bg-white/20 hover:bg-white/40 border-none text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          <CarouselNext className="right-4 bg-white/20 hover:bg-white/40 border-none text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </>
      )}
    </Carousel>
  );
}

function BannerImage({ banner, isFirst }: { banner: Banner; isFirst: boolean }) {
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
      <div className="absolute bottom-0 left-0 p-6 md:p-10 text-white pointer-events-none w-full">
        <h3 className="text-xl md:text-3xl font-bold mb-2 drop-shadow-lg tracking-tight">{banner.title}</h3>
        {banner.description && (
          <p className="text-sm md:text-lg text-white/90 drop-shadow-md max-w-2xl line-clamp-2">
            {banner.description}
          </p>
        )}
      </div>
    </>
  );
}