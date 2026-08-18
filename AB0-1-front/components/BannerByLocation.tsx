'use client';

import { useRef, useEffect } from 'react';
import { useBannersQuery, type Banner } from '@/hooks/useBannersQuery';
import { BannerContainer, getBannerAspectRatio } from './BannerContainer';
import { getFullImageUrl } from '@/utils/image';
import { cn } from '@/lib/utils';
import { type BannerLocation } from '@/lib/banners/placements';

interface BannerByLocationProps {
  location: BannerLocation;
  fallbackLocations?: BannerLocation[];
  className?: string;
  limit?: number;
  slotKey?: string;
  categoryId?: number | string;
  companyId?: number | string;
  state?: string;
  city?: string;
  initialBanners?: Banner[];
}

/**
 * Componente que renderiza banners baseado na posição geográfica na interface.
 * Abstrai a busca e normalização de dados.
 * Suporta Hydration via initialBanners para evitar flashes de conteúdo na Home.
 */
export function BannerByLocation({
  location,
  fallbackLocations,
  className,
  limit = 5,
  slotKey,
  categoryId,
  companyId,
  state,
  city,
  initialBanners,
}: BannerByLocationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    data: banners,
    isLoading,
    error,
  } = useBannersQuery({
    position: location,
    fallbackPositions: fallbackLocations,
    limit,
    slot_key: slotKey,
    category_id: categoryId,
    company_id: companyId,
    state,
    city,
    initialData: initialBanners,
  });

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[BannerByLocation Debug]', {
        location,
        categoryId,
        companyId,
        returnedCount: banners?.length ?? 0,
        fallbackUsed: banners && banners.length > 0 && banners[0].position !== location,
        status: error ? 'error' : isLoading ? 'loading' : 'success',
      });
    }
  }, [location, categoryId, companyId, banners, error, isLoading]);

  // Se estamos carregando e não temos dados iniciais, mostra esqueleto
  if (isLoading && !banners) {
    return (
      <div
        className={cn(
          'w-full animate-pulse rounded-none bg-muted',
          getBannerAspectRatio(location),
          className
        )}
      />
    );
  }

  if (error || !banners || banners.length === 0) {
    return null;
  }

  try {
    // Normalização das URLs das imagens para garantir que venham do backend correto
    const normalizedBanners = banners.map((banner) => ({
      ...banner,
      image_url: banner.image_url ? getFullImageUrl(banner.image_url) : null,
    }));

    return (
      <div
        ref={containerRef}
        className={cn(
          'relative w-full min-w-0 overflow-hidden !rounded-none bg-slate-50',
          getBannerAspectRatio(location),
          className
        )}
      >
        <BannerContainer position={location} banners={normalizedBanners} />
      </div>
    );
  } catch (err) {
    console.error('[BannerByLocation] Error rendering banner:', err);
    return null;
  }
}

export default BannerByLocation;
