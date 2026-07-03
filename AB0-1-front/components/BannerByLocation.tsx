'use client';

import { useRef } from 'react';
import { useBannersQuery, type Banner } from '@/hooks/useBannersQuery';
import { BannerContainer } from './BannerContainer';
import { getFullImageUrl } from '@/utils/image';
import { cn } from '@/lib/utils';

type BannerLocation = 
  | 'navbar' 
  | 'sidebar' 
  | 'categories_top' 
  | 'home_top' 
  | 'companies_top' 
  | 'companies_footer'
  | 'article_footer_cta'
  | 'search_top'
  | 'search_mid'
  | 'categories_filter_sidebar'
  | 'categories_right_rail'
  | 'companies_right_rail';

interface BannerByLocationProps {
  location: BannerLocation;
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
  className, 
  limit = 5,
  slotKey,
  categoryId,
  companyId,
  state,
  city,
  initialBanners
}: BannerByLocationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: banners, isLoading, error } = useBannersQuery({
    position: location,
    limit,
    slot_key: slotKey,
    category_id: categoryId,
    company_id: companyId,
    state,
    city,
    initialData: initialBanners
  });

  // Se estamos carregando e não temos dados iniciais, mostra esqueleto
  if (isLoading && !banners) {
    return (
      <div className={cn("h-[68px] w-full animate-pulse rounded-none bg-muted", className)} />
    );
  }

  if (error || !banners || banners.length === 0) {
    return null;
  }

  try {
    // Normalização das URLs das imagens para garantir que venham do backend correto
    const normalizedBanners = banners.map(banner => ({
      ...banner,
      image_url: banner.image_url ? getFullImageUrl(banner.image_url) : null
    }));

    return (
      <div ref={containerRef} className={cn("w-full overflow-hidden !rounded-none", className)}>
        <BannerContainer position={location} banners={normalizedBanners} />
      </div>
    );
  } catch (err) {
    console.error('[BannerByLocation] Error rendering banner:', err);
    return null;
  }
}

export default BannerByLocation;
