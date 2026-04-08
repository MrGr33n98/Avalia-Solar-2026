'use client';

import React, { useState } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import Link from 'next/link';
import {
  Carousel,
} from '@/components/ui/carousel';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from '@/lib/utils';
import { PremiumBannerCarousel } from '@/components/PremiumBannerCarousel';

interface BannerData {
  id: number | string;
  banner_type?: string;
  position?: string;
  image_url: string | null;
  title: string;
  link?: string | null;
  link_url?: string | null;
  sponsored?: boolean;
  width?: number | null;
  height?: number | null;
}

interface BannerContainerProps {
  banners: BannerData[];
  position?: string;
  className?: string;
}

const FALLBACK_BANNER_SRC = '/images/banner-placeholder.svg';

function BannerImage({
  banner,
  sizes,
  priority,
}: {
  banner: BannerData;
  sizes: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const src = !banner.image_url || failed ? FALLBACK_BANNER_SRC : banner.image_url;

  return (
    <Image
      src={src}
      alt={banner.title}
      fill
      priority={priority}
      sizes={sizes}
      className="object-cover object-center w-full h-full"
      onError={() => {
        if (failed || !banner.image_url) return;
        console.warn('[BannerContainer] Failed to load banner image, showing fallback:', banner.image_url);
        setFailed(true);
      }}
    />
  );
}

export function BannerContainer({ banners, position, className }: BannerContainerProps) {
  if (!banners || !Array.isArray(banners) || banners.length === 0) {
    return null;
  }

  try {
    const displayBanners = banners;

    const getAspectRatio = (pos?: string) => {
      switch (pos) {
        case 'navbar': return 'aspect-[10/1]';
        case 'sidebar': return 'aspect-[1/1]';
        case 'categories_top': return 'aspect-[3/1] sm:aspect-[21/5]';
        case 'companies_footer': 
        case 'article_footer_cta':
          return 'aspect-[3/1] sm:aspect-[21/5]';
        default: return 'aspect-[21/5] sm:aspect-[4/1]';
      }
    };

    const aspectRatio = getAspectRatio(position);

    const renderBannerItem = (banner: BannerData, isPriority = false) => (
      <div className="relative w-full h-full bg-muted/20">
        <Link 
          href={banner.link_url || banner.link || '#'} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="block w-full h-full"
        >
          <BannerImage
            banner={banner}
            priority={isPriority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
          />
          {banner.sponsored && (
            <span className="absolute bottom-2 right-2 z-10 bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 rounded backdrop-blur-sm">
              Patrocinado
            </span>
          )}
        </Link>
      </div>
    );

    if (displayBanners.length === 1) {
      return (
        <div className={cn("w-full py-2", className)}>
          <div className={cn("relative overflow-hidden rounded-xl", aspectRatio)}>
            {renderBannerItem(displayBanners[0], true)}
          </div>
        </div>
      );
    }

    const items = displayBanners.map((banner, idx) => renderBannerItem(banner, idx === 0));

    return (
      <div className={cn("w-full py-2", className)}>
        <PremiumBannerCarousel 
          items={items}
          aspectRatio={aspectRatio}
          autoplayDelay={4000}
        />
      </div>
    );

  } catch (error) {
    console.error('[BannerContainer] Error rendering banners:', error);
    return null;
  }
}
