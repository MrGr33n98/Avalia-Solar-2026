'use client';

import { useBannersQuery } from '@/hooks/useBannersQuery';
import { BannerContainer } from './BannerContainer';
import { getFullImageUrl } from '@/utils/image';

type BannerLocation = 'navbar' | 'sidebar' | 'categories_top' | 'home_top' | 'companies_top' | 'companies_footer';
type BannerContainerBanners = Parameters<typeof BannerContainer>[0]['banners'];
type BannerData = BannerContainerBanners[number];

interface BannerByLocationProps {
  location: BannerLocation;
  className?: string;
}

/**
 * Componente que busca e renderiza banners por localização
 * Blindado contra erros - retorna null silenciosamente se falhar
 */
export default function BannerByLocation({ location, className = '' }: BannerByLocationProps) {
  const { data: banners = [], isLoading: loading, error } = useBannersQuery({ position: location });

  // Blindagem contra erros
  try {
    // Se ainda está carregando, mostra skeleton
    if (loading) {
      return (
        <div className={`animate-pulse bg-gray-200 rounded-2xl ${className}`} style={{ aspectRatio: '3/1' }} />
      );
    }

    // Se houver erro, loga mas não quebra a página
    if (error) {
      console.warn(`[BannerByLocation] Error loading banners for ${location}:`, error);
      return null;
    }

    // Se não houver banners, retorna null silenciosamente
    if (!banners || !Array.isArray(banners) || banners.length === 0) {
      console.info(`[BannerByLocation] No banners found for position: ${location}`);
      return null;
    }

    // Usa os banners retornados da API (já filtrados por position)
    const locationBanners = banners;

    // Se não houver banners para essa localização, retorna null
    if (locationBanners.length === 0) {
      return null;
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
