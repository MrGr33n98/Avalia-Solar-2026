'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Banner } from '@/lib/api';
import { analyticsApi } from '@/lib/api-analytics';
import { track } from '@/lib/analytics/lazy';
import { getBannerAudienceKey } from '@/lib/banner-audience';

interface HomeHeroBannerProps {
  banners?: Banner[];
  className?: string;
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  ctaHref?: string;
  imageSrc?: string;
}

export function HomeHeroBanner({
  banners = [],
  className,
  headline = 'Encontre empresas solares confiáveis na sua região',
  subheadline = 'Compare empresas, avaliações e solicite propostas para seu projeto.',
  ctaText = 'Ver empresas',
  ctaHref = '/companies',
  imageSrc = '/images/home-hero-avalia-solar-1330x230.webp',
}: HomeHeroBannerProps) {
  // Exatamente 1 slide institucional limpo como fallback seguro
  const institutionalFallback: Banner = React.useMemo(
    () => ({
      id: 0,
      title: headline,
      headline,
      subtitle: subheadline,
      cta_label: ctaText,
      cta_href: ctaHref,
      cta_enabled: true,
      image_url: imageSrc,
      image_mobile_url: '/images/home-hero-avalia-solar-mobile-780x460.webp',
      creative_mode: 'photo_with_html',
      theme: 'dark',
      overlay_variant: 'left_soft',
      cta_variant: 'solar_yellow',
      active: true,
      position: 'home_hero',
    }),
    [headline, subheadline, ctaText, ctaHref, imageSrc]
  );

  const activeBanners = React.useMemo(() => {
    const valid = (banners || []).filter((b) => Boolean(b.image_url));
    return valid.length > 0 ? valid : [institutionalFallback];
  }, [banners, institutionalFallback]);

  const hasMultipleBanners = activeBanners.length > 1;
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const touchStartXRef = React.useRef<number | null>(null);
  const heroRef = React.useRef<HTMLDivElement>(null);
  const viewedBannersRef = React.useRef<Set<string>>(new Set());

  // Pausa automática se usuário preferir movimento reduzido (a11y) ou se a aba perder foco
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      setIsPaused(document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setIsPaused(true);
    }

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setIsPaused(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMotionChange);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMotionChange);
      }
    };
  }, []);

  // Rotação suave automática quando houver múltiplos banners (pausável por hover/focus/motion)
  React.useEffect(() => {
    if (!hasMultipleBanners || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 7000);

    return () => clearInterval(timer);
  }, [hasMultipleBanners, isPaused, activeBanners.length]);

  const currentBanner = activeBanners[currentIndex] || activeBanners[0];

  // Telemetria de Viewability (50% de visibilidade por 1s via IntersectionObserver)
  React.useEffect(() => {
    const el = heroRef.current;
    if (!el || !currentBanner || !currentBanner.id || currentBanner.id <= 0) return;

    const bannerId = currentBanner.id;
    const viewKey = `${bannerId}:view:home_hero`;
    if (viewedBannersRef.current.has(viewKey)) return;

    let timer: NodeJS.Timeout | null = null;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          timer = setTimeout(() => {
            if (viewedBannersRef.current.has(viewKey)) return;
            viewedBannersRef.current.add(viewKey);

            analyticsApi.trackBannerEvent({
              banner_id: Number(bannerId),
              event_type: 'impression',
              delivery_id: currentBanner.delivery_id || undefined,
              metadata: {
                title: currentBanner.title,
                position: currentBanner.position || 'home_hero',
                link: currentBanner.cta_href || currentBanner.link_url || currentBanner.link || null,
                page: '/',
                sponsored: Boolean(currentBanner.sponsored),
                audience_key: getBannerAudienceKey(),
              },
              tracked_at: new Date().toISOString(),
            });

            track('banner_view', {
              banner_id: bannerId,
              banner_title: currentBanner.title,
              banner_position: currentBanner.position || 'home_hero',
              sponsored: Boolean(currentBanner.sponsored),
            });
          }, 1000);
        } else if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [currentBanner]);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || !hasMultipleBanners) return;
    const diff = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
      } else {
        setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
      }
    }
    touchStartXRef.current = null;
  };

  // Resolução de Conteúdo
  const bannerTitle = currentBanner.title || headline;
  const bannerHeadline = currentBanner.headline || (bannerTitle !== '.' ? bannerTitle : headline);
  const bannerSubtitle = currentBanner.subtitle ?? (currentBanner.id === 0 ? subheadline : null);
  const bannerImage = currentBanner.image_url || imageSrc;
  const isImageOnly = currentBanner.creative_mode === 'image_only';
  const ctaEnabled = currentBanner.cta_enabled !== false;
  const ctaLabel = currentBanner.cta_label || (currentBanner.id === 0 ? ctaText : null);

  // Link de Destino do CTA e Click Redirect
  const baseDestination = currentBanner.cta_href || currentBanner.link_url || currentBanner.link || ctaHref;
  const clickTrackingUrl =
    currentBanner.id && currentBanner.id > 0
      ? `/api/v1/banner_clicks/${currentBanner.id}${currentBanner.delivery_id ? `?delivery_id=${currentBanner.delivery_id}` : ''}`
      : baseDestination;

  // Estilos de Variantes do CTA
  const getCtaButtonClasses = (variant?: string) => {
    switch (variant) {
      case 'primary_blue':
        return 'bg-blue-600 text-white hover:bg-blue-500 shadow-md';
      case 'outline':
        return 'bg-transparent text-white border-2 border-white/80 hover:bg-white/15 backdrop-blur-xs';
      case 'custom':
        return 'shadow-md';
      case 'solar_yellow':
      default:
        return 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-md';
    }
  };

  const customCtaStyle: React.CSSProperties =
    currentBanner.cta_variant === 'custom'
      ? {
          backgroundColor: currentBanner.cta_background_color || undefined,
          color: currentBanner.cta_text_color || undefined,
        }
      : {};

  // Overlay de Proteção de Contraste
  const renderOverlay = () => {
    if (isImageOnly) return null;

    switch (currentBanner.overlay_variant) {
      case 'none':
        return null;
      case 'left_strong':
        return <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent pointer-events-none" />;
      case 'left_soft':
      default:
        return <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent pointer-events-none" />;
    }
  };

  return (
    <div className={cn('px-4 py-2 w-full select-none max-w-[1330px] mx-auto', className)}>
      <div
        ref={heroRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
        className="relative overflow-hidden rounded-xl border border-slate-200/60 group w-full bg-[#DBEEFE]"
      >
        <div className="relative aspect-[39/23] md:aspect-[133/23] w-full">
          {/* Mídia Art-Directed com <picture> responsivo nativo */}
          <picture className="absolute inset-0 block h-full w-full pointer-events-none">
            {currentBanner.image_mobile_url ? (
              <source media="(max-width: 767px)" srcSet={currentBanner.image_mobile_url} />
            ) : null}
            <img
              src={bannerImage}
              alt={currentBanner.alt_text || bannerHeadline || 'Hero Banner'}
              width={1330}
              height={230}
              className={cn(
                'h-full w-full transition-transform duration-500 group-hover:scale-[1.01] motion-reduce:transition-none motion-reduce:transform-none',
                isImageOnly ? 'object-contain' : 'object-cover'
              )}
              style={
                isImageOnly
                  ? undefined
                  : {
                      objectPosition: `${currentBanner.object_position_desktop_x ?? 50}% ${currentBanner.object_position_desktop_y ?? 50}%`,
                    }
              }
              loading={currentIndex === 0 ? 'eager' : 'lazy'}
              {...({ fetchpriority: currentIndex === 0 ? 'high' : 'auto' } as React.ImgHTMLAttributes<HTMLImageElement>)}
              decoding="async"
            />
          </picture>

          {/* Selo Patrocinado quando aplicável */}
          {currentBanner.sponsored && (
            <div className="absolute top-3 right-3 z-20 pointer-events-none">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/70 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-white/95 border border-white/10 shadow-xs">
                Patrocinado
              </span>
            </div>
          )}

          {/* Overlay de contraste para legibilidade */}
          {renderOverlay()}

          {/* Link para toda a área caso configurado como clicável por inteiro ou image_only com link */}
          {(currentBanner.whole_banner_clickable || isImageOnly) && clickTrackingUrl && (
            <Link
              href={clickTrackingUrl}
              className="absolute inset-0 z-10 block"
              aria-label={bannerHeadline || 'Ver campanha'}
            />
          )}

          {/* Conteúdo Tipográfico e Ação */}
          <div className="absolute inset-0 flex flex-col justify-center px-5 sm:px-8 md:px-10 max-w-xl z-15 pointer-events-none">
            {isImageOnly ? (
              <h1 className="sr-only">{bannerHeadline}</h1>
            ) : (
              <>
                <h1
                  className={cn(
                    'text-xl sm:text-2xl md:text-3xl font-extrabold leading-tight tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]',
                    currentBanner.theme === 'light' ? 'text-slate-950' : 'text-white'
                  )}
                  style={{ color: currentBanner.hero_text_color || undefined }}
                >
                  {bannerHeadline}
                </h1>
                {bannerSubtitle && (
                  <p
                    className={cn(
                      'mt-2 text-xs sm:text-sm line-clamp-2 leading-relaxed drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]',
                      currentBanner.theme === 'light' ? 'text-slate-800' : 'text-white/90'
                    )}
                  >
                    {bannerSubtitle}
                  </p>
                )}
              </>
            )}

            {/* Botão de Ação (CTA) Acessível */}
            {!isImageOnly && ctaEnabled && ctaLabel && (
              <div className="mt-4 flex items-center gap-3 pointer-events-auto">
                <Link
                  href={clickTrackingUrl}
                  style={customCtaStyle}
                  className={cn(
                    'inline-flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-xl px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold transition-all active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
                    getCtaButtonClasses(currentBanner.cta_variant)
                  )}
                >
                  <span>{ctaLabel}</span>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>

          {/* Setas de navegação desktop */}
          {hasMultipleBanners && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Banner anterior"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/70 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Próximo banner"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/70 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Barras de navegação segmentadas com touch target de 48px */}
          {hasMultipleBanners && (
            <div
              aria-label="Navegação dos banners"
              className="absolute bottom-0 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0 bg-transparent md:bottom-3 md:gap-2 md:rounded-full md:bg-black/25 md:px-2.5 md:py-1 md:backdrop-blur-xs"
            >
              {activeBanners.map((banner, index) => (
                <button
                  key={banner.id ?? index}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Ir para banner ${index + 1}`}
                  aria-pressed={currentIndex === index}
                  className="flex h-12 w-12 min-h-12 min-w-12 items-center justify-center bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-blue-600"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'block h-[4px] w-[34px] rounded-full transition-colors duration-200 motion-reduce:transition-none',
                      currentIndex === index ? 'bg-blue-600' : 'bg-white/75'
                    )}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HomeHeroBanner;
