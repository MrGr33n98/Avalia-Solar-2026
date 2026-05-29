'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { analyticsApi } from '@/lib/api-analytics';
import { track } from '@/lib/analytics/lazy';
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
  company_id?: number | null;
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
  const baseUrl = !banner.image_url || failed ? FALLBACK_BANNER_SRC : banner.image_url;
  // Cache buster for Next.js Image Optimization and Cloudflare
  const src = baseUrl === FALLBACK_BANNER_SRC 
    ? baseUrl 
    : `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}v=3`;

  return (
    <Image
      src={src}
      alt={banner.title}
      fill
      priority={priority}
      sizes={sizes}
      quality={95}
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
  const containerRef = React.useRef<HTMLDivElement>(null);
  const viewedBannerIdsRef = React.useRef<Set<string>>(new Set());
  const displayBanners = React.useMemo(() => (
    Array.isArray(banners) ? banners : []
  ), [banners]);

  const trackBannerView = React.useCallback((banner: BannerData) => {
    const bannerId = Number(banner.id);
    if (!Number.isFinite(bannerId)) return;

    const eventKey = `${bannerId}:view:${position || banner.position || 'unknown'}`;
    if (viewedBannerIdsRef.current.has(eventKey)) return;
    viewedBannerIdsRef.current.add(eventKey);

    analyticsApi.trackBannerEvent({
      banner_id: bannerId,
      company_id: banner.company_id || undefined,
      event_type: 'view',
      metadata: {
        banner_title: banner.title,
        banner_position: position || banner.position,
        destination_url: banner.link_url || banner.link || null,
      },
      tracked_at: new Date().toISOString(),
    });

    track('banner_view', {
      banner_id: bannerId,
      banner_title: banner.title,
      banner_position: position || banner.position,
      element_type: 'banner',
      action_type: 'view',
    });
  }, [position]);

  const trackBannerClick = React.useCallback((banner: BannerData) => {
    const bannerId = Number(banner.id);
    if (!Number.isFinite(bannerId)) return;

    const destinationUrl = banner.link_url || banner.link || null;

    analyticsApi.trackBannerEvent({
      banner_id: bannerId,
      company_id: banner.company_id || undefined,
      event_type: 'click',
      metadata: {
        banner_title: banner.title,
        banner_position: position || banner.position,
        destination_url: destinationUrl,
      },
      tracked_at: new Date().toISOString(),
    });

    track('banner_click', {
      banner_id: bannerId,
      banner_title: banner.title,
      banner_position: position || banner.position,
      element_type: 'banner',
      action_type: 'click',
      destination_url: destinationUrl,
    });
  }, [position]);

  React.useEffect(() => {
    const node = containerRef.current;
    if (!node || displayBanners.length === 0) return;

    if (typeof IntersectionObserver === 'undefined') {
      displayBanners.forEach(trackBannerView);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.35)) return;

        displayBanners.forEach(trackBannerView);
        observer.disconnect();
      },
      { threshold: 0.35 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [displayBanners, trackBannerView]);

  if (displayBanners.length === 0) {
    return null;
  }

  try {
    const getAspectRatio = (pos?: string) => {
      switch (pos) {
        case 'navbar': return 'aspect-[10/1]';
        case 'sidebar': return 'aspect-[1/1]';
        case 'categories_top': return 'aspect-[3/1] sm:aspect-[21/5]';
        case 'search_top': return 'aspect-[20/3]';
        case 'search_mid': return 'aspect-[15/2]';
        case 'categories_filter_sidebar': return 'aspect-[6/5]';
        case 'categories_right_rail':
        case 'companies_right_rail':
          return 'aspect-[1/2]';
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
          onClick={() => trackBannerClick(banner)}
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

    const items = displayBanners.map((banner, idx) => renderBannerItem(banner, idx === 0));

    return (
      <div ref={containerRef} className={cn("w-full py-2", className)}>
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
