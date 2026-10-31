'use client';

import React from 'react';
import { useBannersQuery } from '@/hooks/useBannersQuery';
import { BannerContainer } from '@/components/BannerContainer';
import { resolveBannerAspectRatio } from '@/lib/banners/aspect-ratio';
import { getPlacementDisplaySpec } from '@/lib/banners/placements';
import { normalizeBannerImageUrl } from '@/lib/banners/url';
import { cn } from '@/lib/utils';

interface BannerSlotProps {
  placement: string;
  className?: string;
  fallback?: React.ReactNode;
  limit?: number;
  priority?: boolean;
  lazy?: boolean;
  companyId?: number;
  categoryId?: number;
  blockCompetitors?: boolean;
  showLoadingSkeleton?: boolean;
}

export function BannerSlot({
  placement,
  className,
  fallback,
  limit = 3,
  priority = false,
  lazy,
  companyId,
  categoryId,
  blockCompetitors = false,
  showLoadingSkeleton = true,
}: BannerSlotProps) {
  // Banners que estão comprovadamente no topo da tela carregam imediatamente (e.g. hero)
  const isTopPlacement =
    priority ||
    placement.startsWith('hero_') ||
    placement === 'categories_top' ||
    placement === 'home_top';

  const shouldLazyLoad = lazy ?? !isTopPlacement;

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [inView, setInView] = React.useState(!shouldLazyLoad);

  React.useEffect(() => {
    if (!shouldLazyLoad || inView) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '250px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [shouldLazyLoad, inView]);

  const {
    data: banners,
    isLoading,
    error,
  } = useBannersQuery({
    position: placement,
    limit,
    category_id: categoryId,
    company_id: companyId,
    profile_company_id: companyId,
    block_competitors: blockCompetitors,
    enabled: inView,
  });

  const displaySpec = getPlacementDisplaySpec(placement);

  // Se ainda não estiver próximo da viewport, reserva apenas o marcador para o observer
  if (!inView) {
    return (
      <div
        ref={containerRef}
        className={cn('w-full', className)}
        style={{ minHeight: '1px' }}
      />
    );
  }

  // Renderiza um skeleton discreto e translúcido durante o carregamento (sem spinner agressivo)
  if (isLoading) {
    if (!showLoadingSkeleton) {
      return fallback ? <>{fallback}</> : null;
    }
    return (
      <div ref={containerRef} className={cn('w-full py-2', className)}>
        <div
          className={cn(
            'w-full rounded-2xl border border-slate-100/60 bg-slate-100/50 animate-pulse',
            displaySpec?.aspectRatioClass || 'mb-[26px] md:mb-0'
          )}
          style={displaySpec?.aspectRatioClass ? undefined : { aspectRatio: resolveBannerAspectRatio({ position: placement }) }}
        />
      </div>
    );
  }

  // GAP-01 / GAP-03: Filtra anúncios sem arte pública renderizável
  const renderableBanners = (banners || []).filter((b) => {
    const isEditorial =
      b.creative_mode === 'photo_with_html' &&
      Boolean(b.headline?.trim() || b.title?.trim() || b.image_url);
    const hasImage = Boolean(b.image_url && b.image_url.trim().length > 0);
    return isEditorial || hasImage;
  });

  let finalBanners = renderableBanners;

  if (blockCompetitors && companyId) {
    finalBanners = finalBanners.filter(
      (b) => b.company_id === null || b.company_id === undefined || b.company_id === companyId
    );
  }

  // Slice to the actual limit
  finalBanners = finalBanners.slice(0, limit);
  // Se houver erros na API ou não houver banners elegíveis com arte renderizável
  if (error || finalBanners.length === 0) {
    return fallback ? <>{fallback}</> : null;
  }

  // Adapter seguro para mapear chaves completas e evitar erros TypeScript no build de produção
  const formattedBanners = finalBanners.map((b) => ({
    id: b.id,
    delivery_id: b.delivery_id ?? null,
    alt_text: b.alt_text ?? null,
    banner_type: b.banner_type,
    position: b.position,
    image_url: normalizeBannerImageUrl(b.image_url),
    image_mobile_url: normalizeBannerImageUrl(b.image_mobile_url),
    title: b.title,
    link: b.link ?? null,
    link_url: b.link_url ?? null,
    sponsored: b.sponsored,
    company_id: b.company_id,
    width: b.width,
    height: b.height,
    headline: b.headline ?? null,
    subtitle: b.subtitle ?? null,
    cta_label: b.cta_label ?? null,
    cta_href: b.cta_href ?? null,
    cta_enabled: b.cta_enabled ?? true,
    cta_variant: b.cta_variant ?? 'outline',
    theme: b.theme ?? 'light',
    creative_mode: b.creative_mode ?? 'image_only',
    benefits: b.benefits ?? null,
  }));

  return (
    <BannerContainer
      banners={formattedBanners}
      position={placement}
      priority={priority}
      page={placement.startsWith('compare_') ? 'compare' : undefined}
      className={className}
    />
  );
}
