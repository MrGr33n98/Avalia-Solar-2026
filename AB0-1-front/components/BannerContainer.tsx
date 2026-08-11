'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { analyticsApi } from '@/lib/api-analytics';
import { track } from '@/lib/analytics/lazy';
import { getBannerAudienceKey } from '@/lib/banner-audience';
import { cn } from '@/lib/utils';
import { PremiumBannerCarousel } from '@/components/PremiumBannerCarousel';

interface BannerData {
  id: number | string;
  delivery_id?: string | null;
  alt_text?: string | null;
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
  priority?: boolean;
  page?: string;
}

const FALLBACK_BANNER_SRC = '/images/banner-placeholder.svg';

/**
 * Shared by the banner renderer and its loading state so the slot never
 * changes height when API data arrives.
 */
export function getBannerAspectRatio(position?: string) {
  switch (position) {
    case 'navbar':
      return 'aspect-[10/1]';
    case 'financing_simulator_micro_banner':
      return 'aspect-[3/1]';
    case 'sidebar':
      return 'aspect-[1/1]';
    case 'categories_top':
      return 'aspect-[12/2.5] sm:aspect-[12/1] md:aspect-[14/1]';
    case 'compare_hero':
      return 'aspect-[16/7] md:aspect-[40/7]';
    case 'compare_page_sidebar':
      return 'aspect-[1/2]';
    case 'compare_page_top':
      return 'h-[88px] sm:h-[104px]';
    case 'compare_page_inline':
    case 'compare_page_bottom':
      return 'aspect-[3/1] sm:aspect-[15/2]';
    case 'search_top':
      return 'aspect-[20/3]';
    case 'home_top':
      return 'aspect-[15/2]';
    case 'companies_top':
      return 'h-[88px] max-h-[88px] w-full sm:h-[104px] sm:max-h-[104px] md:h-[120px] md:max-h-[120px] lg:h-[136px] lg:max-h-[136px]';
    case 'search_mid':
      return 'aspect-[15/2]';
    case 'categories_filter_sidebar':
      return 'aspect-[6/5]';
    case 'categories_right_rail':
    case 'companies_right_rail':
      return 'aspect-[1/2]';
    case 'companies_footer':
    case 'article_footer_cta':
      return 'aspect-[15/2]';
    default:
      return 'aspect-[21/5] sm:aspect-[4/1]';
  }
}

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
      unoptimized={src !== FALLBACK_BANNER_SRC}
      alt={banner.alt_text?.trim() || banner.title || 'Banner promocional'}
      fill
      priority={priority}
      sizes={sizes}
      quality={95}
      // Banners usam dimensões comerciais fixas; contain preserva a arte completa no responsivo.
      className="object-contain object-center w-full h-full"
      onError={() => {
        if (failed || !banner.image_url) return;
        console.warn(
          '[BannerContainer] Failed to load banner image, showing fallback:',
          banner.image_url
        );
        setFailed(true);
      }}
    />
  );
}

export function BannerContainer({
  banners,
  position,
  className,
  priority = false,
  page,
}: BannerContainerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const viewedBannerIdsRef = React.useRef<Set<string>>(new Set());
  const impressionIdsRef = React.useRef<Map<string, string>>(new Map());
  const activeIndexRef = React.useRef(0);
  const containerVisibleRef = React.useRef(false);

  const createEventId = React.useCallback(() => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
      return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }, []);
  const displayBanners = React.useMemo(() => (Array.isArray(banners) ? banners : []), [banners]);

  const trackBannerView = React.useCallback(
    (banner: BannerData) => {
      const bannerId = Number(banner.id);
      if (!Number.isFinite(bannerId)) return;

      const placement = position || banner.position || 'unknown';
      const eventKey = `${bannerId}:view:${placement}`;
      if (viewedBannerIdsRef.current.has(eventKey)) return;
      viewedBannerIdsRef.current.add(eventKey);
      const impressionKey = `${bannerId}:${placement}`;
      const impressionInstanceId = impressionIdsRef.current.get(impressionKey) || createEventId();
      impressionIdsRef.current.set(impressionKey, impressionInstanceId);

      analyticsApi.trackBannerEvent({
        banner_id: bannerId,
        company_id: banner.company_id || undefined,
        event_type: 'impression',
        impression_instance_id: impressionInstanceId,
        delivery_id: banner.delivery_id || undefined,
        metadata: {
          title: banner.title,
          position: position || banner.position,
          link: banner.link_url || banner.link || null,
          page,
          sponsored: Boolean(banner.sponsored),
          audience_key: getBannerAudienceKey(),
        },
        tracked_at: new Date().toISOString(),
      });

      track('banner_view', {
        banner_id: bannerId,
        banner_title: banner.title,
        banner_position: placement,
        element_type: 'banner',
        action_type: 'view',
        page,
        sponsored: Boolean(banner.sponsored),
      });
    },
    [createEventId, page, position]
  );

  const trackBannerClick = React.useCallback(
    (banner: BannerData) => {
      const bannerId = Number(banner.id);
      if (!Number.isFinite(bannerId)) return;

      const destinationUrl = banner.link_url || banner.link || null;
      const placement = position || banner.position || 'unknown';
      const clickInstanceId = createEventId();

      void analyticsApi.trackBannerEvent({
        banner_id: bannerId,
        company_id: banner.company_id || undefined,
        event_type: 'click',
        click_instance_id: clickInstanceId,
        delivery_id: banner.delivery_id || undefined,
        metadata: {
          title: banner.title,
          position: placement,
          destination_url: destinationUrl,
          page,
          sponsored: Boolean(banner.sponsored),
          audience_key: getBannerAudienceKey(),
        },
        tracked_at: new Date().toISOString(),
      });

      track('banner_click', {
        banner_id: bannerId,
        banner_title: banner.title,
        banner_position: placement,
        element_type: 'banner',
        action_type: 'click',
        destination_url: destinationUrl,
        page,
        sponsored: Boolean(banner.sponsored),
        delivery_id: banner.delivery_id || undefined,
      });
    },
    [createEventId, page, position]
  );

  const trackActiveBannerView = React.useCallback(() => {
    if (!containerVisibleRef.current) return;
    const activeBanner = displayBanners[activeIndexRef.current];
    if (activeBanner) trackBannerView(activeBanner);
  }, [displayBanners, trackBannerView]);

  React.useEffect(() => {
    const node = containerRef.current;
    if (!node || displayBanners.length === 0) return;

    if (typeof IntersectionObserver === 'undefined') {
      containerVisibleRef.current = true;
      trackActiveBannerView();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.35))
          return;

        containerVisibleRef.current = true;
        trackActiveBannerView();
        observer.disconnect();
      },
      { threshold: 0.35 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [displayBanners, trackActiveBannerView]);

  if (displayBanners.length === 0) {
    return null;
  }

  try {
    const aspectRatio = getBannerAspectRatio(position);
    const hasSponsoredBanner = displayBanners.some((banner) => Boolean(banner.sponsored));

    const getSizes = (pos?: string) => {
      switch (pos) {
        case 'companies_right_rail':
        case 'categories_right_rail':
        case 'compare_page_sidebar':
          // Sidebar fixa de 300px. Retina = 600px. Nunca maior que isso.
          return '(max-width: 1279px) 0px, 300px';
        case 'categories_filter_sidebar':
          return '(max-width: 1023px) 0px, 280px';
        case 'sidebar':
          return '(max-width: 1023px) 100vw, 300px';
        case 'navbar':
          return '(max-width: 640px) 100vw, 200px';
        case 'compare_hero':
          return '(max-width: 767px) 100vw, 600px';
        case 'search_mid':
        case 'search_top':
        case 'categories_top':
        case 'companies_footer':
        case 'article_footer_cta':
        default:
          // Banners full-width
          return '(max-width: 640px) 100vw, (max-width: 1280px) 90vw, 1200px';
      }
    };

    const renderBannerContent = (banner: BannerData, isPriority = false) => (
      <>
        <BannerImage banner={banner} priority={isPriority} sizes={getSizes(position)} />
        {banner.sponsored && (
          <span className="absolute bottom-2 right-2 z-10 rounded-none bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            Patrocinado
          </span>
        )}
      </>
    );

    const renderBannerItem = (banner: BannerData, isPriority = false) => (
      <div className="relative w-full h-full bg-muted/20">
        {banner.link_url || banner.link ? (
          <Link
            href={`/api/v1/banner_clicks/${banner.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full h-full"
            aria-label={
              banner.sponsored
                ? `Patrocinado: ${banner.alt_text?.trim() || banner.title || 'Abrir anúncio'}`
                : banner.alt_text?.trim() || banner.title || 'Abrir anúncio'
            }
            onClick={() => trackBannerClick(banner)}
          >
            {renderBannerContent(banner, isPriority)}
          </Link>
        ) : (
          renderBannerContent(banner, isPriority)
        )}
      </div>
    );

    const items = displayBanners.map((banner, idx) =>
      renderBannerItem(banner, priority && idx === 0)
    );

    return (
      <div ref={containerRef} className={cn('m-0 w-full min-w-0 max-w-full overflow-hidden p-0', className)}>
        <PremiumBannerCarousel
          items={items}
          aspectRatio={aspectRatio}
          autoplayDelay={4000}
          onActiveIndexChange={(index) => {
            activeIndexRef.current = index;
            trackActiveBannerView();
          }}
          className={hasSponsoredBanner ? '!rounded-none' : undefined}
        />
      </div>
    );
  } catch (error) {
    console.error('[BannerContainer] Error rendering banners:', error);
    return null;
  }
}
