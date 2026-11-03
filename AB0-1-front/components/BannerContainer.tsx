'use client';

import React from 'react';
import Link from 'next/link';
import { analyticsApi } from '@/lib/api-analytics';
import { track } from '@/lib/analytics/lazy';
import { getBannerAudienceKey } from '@/lib/banner-audience';
import { cn } from '@/lib/utils';
import { resolveBannerAspectRatio } from '@/lib/banners/aspect-ratio';
import {
  BANNER_PLACEMENT_ASPECT_RATIOS,
  getPlacementDisplaySpec,
  isSidebarPlacement,
} from '@/lib/banners/placements';
import { PremiumBannerCarousel } from '@/components/PremiumBannerCarousel';
import { BannerMedia } from '@/components/banners/BannerMedia';
import { SponsoredBadge } from '@/components/banners/SponsoredBadge';
import { BannerCreative } from '@/components/banners/BannerCreative';
import { HorizontalBannerCreative } from '@/components/banners/HorizontalBannerCreative';

export interface BannerData {
  id: number | string;
  delivery_id?: string | null;
  alt_text?: string | null;
  banner_type?: string;
  position?: string;
  image_url: string | null;
  image_mobile_url?: string | null;
  title: string;
  link?: string | null;
  link_url?: string | null;
  sponsored?: boolean;
  company_id?: number | null;
  width?: number | null;
  height?: number | null;
  headline?: string | null;
  subtitle?: string | null;
  cta_label?: string | null;
  cta_href?: string | null;
  cta_enabled?: boolean;
  cta_variant?: string;
  theme?: string;
  creative_mode?: 'photo_with_html' | 'image_only' | string;
  benefits?: string[] | null;
}

export interface BannerContainerProps {
  banners: BannerData[];
  position?: string;
  className?: string;
  priority?: boolean;
  page?: string;
}

function BannerImage({
  banner,
  sizes,
  priority,
  ambientBackground,
  fit,
  onMediaError,
  onMediaLoad,
}: {
  banner: BannerData;
  sizes: string;
  priority?: boolean;
  ambientBackground?: boolean;
  fit?: 'contain' | 'cover';
  onMediaError?: () => void;
  onMediaLoad?: () => void;
}) {
  if (!banner.image_url) {
    return null;
  }

  return (
    <BannerMedia
      src={banner.image_url}
      mobileSrc={banner.image_mobile_url}
      alt={banner.alt_text?.trim() || banner.title || 'Banner promocional'}
      priority={priority}
      sizes={sizes}
      quality={80}
      ambientBackground={ambientBackground}
      fit={fit}
      onMediaError={onMediaError}
      onMediaLoad={onMediaLoad}
      className="absolute inset-0"
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
  const failedMediaBannerIdsRef = React.useRef<Set<number | string>>(new Set());
  const activeIndexRef = React.useRef(0);
  const containerVisibleRef = React.useRef(false);
  const [failedMediaIds, setFailedMediaIds] = React.useState<Set<number | string>>(new Set());

  const createEventId = React.useCallback(() => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
      return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }, []);

  const handleMediaError = React.useCallback(
    (banner: BannerData) => {
      failedMediaBannerIdsRef.current.add(banner.id);
      setFailedMediaIds((prev) => {
        const next = new Set(prev);
        next.add(banner.id);
        return next;
      });
      track('banner_media_error', {
        banner_id: Number(banner.id),
        banner_position: position || banner.position || 'unknown',
        error: 'image_load_failed',
      });
    },
    [position]
  );

  const handleMediaLoad = React.useCallback(
    (banner: BannerData) => {
      track('banner_media_ready', {
        banner_id: Number(banner.id),
        banner_position: position || banner.position || 'unknown',
      });
    },
    [position]
  );

  // Filtra banners não renderizáveis na camada pública
  const displayBanners = React.useMemo(() => {
    if (!Array.isArray(banners)) return [];
    return banners.filter((b) => {
      if (failedMediaIds.has(b.id) && b.creative_mode !== 'photo_with_html') {
        return false;
      }
      if (b.creative_mode === 'photo_with_html') {
        return Boolean(b.headline?.trim() || b.title?.trim() || b.image_url);
      }
      return Boolean(b.image_url && b.image_url.trim().length > 0);
    });
  }, [banners, failedMediaIds]);

  const trackBannerView = React.useCallback(
    (banner: BannerData) => {
      const bannerId = Number(banner.id);
      if (!Number.isFinite(bannerId)) return;

      // GAP-02 / A09: Não registrar impressão publicitária de criativo cuja mídia falhou
      if (failedMediaBannerIdsRef.current.has(banner.id) && banner.creative_mode !== 'photo_with_html') {
        return;
      }

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
    const displaySpec = position ? getPlacementDisplaySpec(position) : undefined;
    const isCompactControls = position ? [
      'company_profile_about_inline',
      'home_top',
      'search_mid',
      'companies_footer',
      'article_footer_cta',
      'compare_page_inline',
      'compare_page_bottom',
      'companies_top',
      'categories_top',
      'search_top',
      'navbar',
      'financing_simulator_micro_banner',
      'compare_page_top'
    ].includes(position) : false;

    const getSizes = (pos?: string) => {
      switch (pos) {
        case 'companies_right_rail':
        case 'categories_right_rail':
        case 'compare_page_sidebar':
        case 'company_access_sidebar':
          return '(max-width: 1023px) 0px, 300px';
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
          return '(max-width: 640px) 100vw, (max-width: 1280px) 90vw, 1200px';
      }
    };

    // A geometria é definida pelo placement; creative_mode define apenas a composição interna.
    const isSidebar = isSidebarPlacement(position);

    // Placements laterais (1:2) nunca usam fundo desfocado: evita faixa azul acima/abaixo da arte.
    const ambientBackground = isSidebar ? false : displaySpec?.ambientBackground;

    // Caso de card lateral único: renderiza diretamente o BannerCreative sem controles redundantes de carrossel
    // Restrito a placements laterais: nunca aplicar o card de 300px em placements horizontais.
    if (
      displayBanners.length === 1 &&
      isSidebar &&
      (position === 'compare_page_sidebar' ||
       position === 'company_access_sidebar' ||
       displayBanners[0].creative_mode === 'photo_with_html')
    ) {
      const singleBanner = displayBanners[0];
      return (
        <div
          ref={containerRef}
          className={cn('m-0 w-full min-w-0 max-w-[300px] mx-auto p-0', className)}
        >
          <BannerCreative
            banner={singleBanner}
            priority={priority}
            sizes={getSizes(position)}
            ambientBackground={ambientBackground}
            onMediaError={() => handleMediaError(singleBanner)}
            onMediaLoad={() => handleMediaLoad(singleBanner)}
            onBannerClick={() => trackBannerClick(singleBanner)}
          />
        </div>
      );
    }

    const renderBannerContent = (banner: BannerData, isPriority = false) => (
      <>
        <BannerImage
          banner={banner}
          priority={isPriority}
          sizes={getSizes(position)}
          ambientBackground={ambientBackground}
          fit={displaySpec?.fit || (banner.sponsored ? 'cover' : 'contain')}
          onMediaError={() => handleMediaError(banner)}
          onMediaLoad={() => handleMediaLoad(banner)}
        />
        {banner.sponsored && <SponsoredBadge />}
      </>
    );

    const renderBannerItem = (banner: BannerData, isPriority = false) => {
      const isEditorialCreative = banner.creative_mode === 'photo_with_html';

      // Placement horizontal com conteúdo editorial cadastrado: card horizontal em 100% da largura.
      if (!isSidebar && isEditorialCreative && (banner.headline?.trim() || banner.subtitle?.trim())) {
        return (
          <HorizontalBannerCreative
            banner={banner}
            priority={isPriority}
            sizes={getSizes(position)}
            ambientBackground={ambientBackground}
            onMediaError={() => handleMediaError(banner)}
            onMediaLoad={() => handleMediaLoad(banner)}
            onBannerClick={() => trackBannerClick(banner)}
          />
        );
      }

      // Placement lateral: mantém os criativos de sidebar (300px).
      if (isSidebar && isEditorialCreative && (banner.headline || banner.title)) {
        return (
          <BannerCreative
            banner={banner}
            priority={isPriority}
            sizes={getSizes(position)}
            ambientBackground={ambientBackground}
            onMediaError={() => handleMediaError(banner)}
            onMediaLoad={() => handleMediaLoad(banner)}
            onBannerClick={() => trackBannerClick(banner)}
            className="w-full h-full"
          />
        );
      }

      return (
        <div className="relative w-full h-full bg-muted/20">
          {banner.link_url || banner.link ? (
            <Link
              href={`/api/v1/banner_clicks/${banner.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
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
    };

    const items = displayBanners.map((banner, idx) =>
      renderBannerItem(banner, priority && idx === 0)
    );

    const aspectRatios = displaySpec?.aspectRatioClass
      ? undefined
      : displayBanners.map((banner) =>
          resolveBannerAspectRatio({
            position,
            sourcePosition: banner.position,
            width: banner.width,
            height: banner.height,
          })
        );

    return (
      <div
        ref={containerRef}
        className={cn(
          'm-0 w-full min-w-0 overflow-hidden p-0',
          isSidebar ? 'max-w-full' : 'max-w-none',
          className
        )}
      >
        <PremiumBannerCarousel
          items={items}
          aspectRatios={aspectRatios}
          aspectRatio={displaySpec?.aspectRatioClass || BANNER_PLACEMENT_ASPECT_RATIOS[position || '']}
          autoplayDelay={4000}
          onActiveIndexChange={(index) => {
            activeIndexRef.current = index;
            trackActiveBannerView();
          }}
          compactControls={isCompactControls}
        />
      </div>
    );
  } catch (error) {
    console.error('[BannerContainer] Error rendering banners:', error);
    return null;
  }
}
