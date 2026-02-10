'use client';

import { useRef } from 'react';
import { useBannersQuery } from '@/hooks/useBannersQuery';
import { BannerContainer } from './BannerContainer';
import { getFullImageUrl } from '@/utils/image';
import { cn } from '@/lib/utils';
import type { Banner } from '@/lib/api';

type BannerLocation = 'navbar' | 'sidebar' | 'categories_top' | 'home_top' | 'companies_top' | 'companies_footer';
type BannerContainerBanners = Parameters<typeof BannerContainer>[0]['banners'];
type BannerData = BannerContainerBanners[number];

interface BannerByLocationProps {
  location: BannerLocation;
  className?: string;
  initialBanners?: Banner[];
}

const RESERVED_LOCATIONS: BannerLocation[] = ['navbar', 'home_top', 'categories_top', 'companies_top'];
const PLACEHOLDER_ASPECT = 'aspect-[6/1] sm:aspect-[4/1]';

/**
 * Componente que busca e renderiza banners por localização
 * Blindado contra erros - retorna null silenciosamente se falhar
 */
export default function BannerByLocation({ location, className = '', initialBanners }: BannerByLocationProps) {
  const didLogErrorRef = useRef(false);
  const didLogEmptyRef = useRef(false);
  const hasInitial = Boolean(initialBanners && initialBanners.length > 0);
  const { data: fetchedBanners = [], isLoading, error } = useBannersQuery({
    position: location,
    enabled: !hasInitial,
  });
  const banners = hasInitial ? initialBanners || [] : fetchedBanners;
  const loading = !hasInitial && isLoading;
  const queryError = !hasInitial ? error : null;
  const shouldReserveSpace = RESERVED_LOCATIONS.includes(location);

  const renderPlaceholder = (isLoading: boolean) => (
    <div className={cn('w-full', className)} aria-hidden="true">
      <div
        className={cn(
          'w-full rounded-2xl',
          PLACEHOLDER_ASPECT,
          isLoading ? 'animate-pulse bg-gray-200' : 'bg-transparent'
        )}
      />
    </div>
  );

  // Blindagem contra erros
  try {
    // Se ainda está carregando, mostra skeleton
    if (loading) {
      return renderPlaceholder(true);
    }

    // Se houver erro, loga mas não quebra a página
    if (queryError) {
      if (!didLogErrorRef.current) {
        didLogErrorRef.current = true;
        console.warn(`[BannerByLocation] Error loading banners for ${location}:`, queryError);
      }
      return shouldReserveSpace ? renderPlaceholder(false) : null;
    }

    // Se não houver banners, retorna null silenciosamente
    if (!banners || !Array.isArray(banners) || banners.length === 0) {
      if (!didLogEmptyRef.current && process.env.NODE_ENV === 'development') {
        didLogEmptyRef.current = true;
        console.info(`[BannerByLocation] No banners found for position: ${location}`);
      }
      return shouldReserveSpace ? renderPlaceholder(false) : null;
    }

    // Usa os banners retornados da API (já filtrados por position)
    const locationBanners = banners;

    // Se não houver banners para essa localização, retorna null
    if (locationBanners.length === 0) {
      return shouldReserveSpace ? renderPlaceholder(false) : null;
    }

    // Renderiza os banners usando o BannerContainer
    const normalizedBanners: BannerContainerBanners = locationBanners.map((banner): BannerData => ({
      id: banner.id,
      type: banner.banner_type === 'rectangular_small' ? 'rectangular_small' : 'rectangular_large',
      position: (banner.position || location) as BannerLocation,
      image_url: getFullImageUrl(banner.image_url) || '',
      title: banner.title || '',
      link: banner.link || banner.link_url || undefined,
      sponsored: !!banner.sponsored,
      width: banner.width ?? null,
      height: banner.height ?? null,
    }));

    return (
      <div className={className}>
        <BannerContainer banners={normalizedBanners} />
      </div>
    );
  } catch (err) {
    // Silenciosamente retorna null em vez de quebrar a página
    console.error('[BannerByLocation] Error rendering banner:', err);
    return null;
  }
}
