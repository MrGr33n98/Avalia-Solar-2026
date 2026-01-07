'use client';

import { useBanners } from '@/hooks/useBanners';
import { BannerContainer } from './BannerContainer';

interface BannerByLocationProps {
  location: string;
  className?: string;
}

/**
 * Componente que busca e renderiza banners por localização
 * Blindado contra erros - retorna null silenciosamente se falhar
 */
export default function BannerByLocation({ location, className = '' }: BannerByLocationProps) {
  const { banners, loading, error } = useBanners({ position: location });

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
    const normalizedBanners = locationBanners.map((banner) => ({
      id: banner.id,
      type: banner.banner_type,
      position: banner.position,
      image_url: banner.image_url,
      title: banner.title || '',
      link: banner.link,
      sponsored: banner.sponsored,
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
