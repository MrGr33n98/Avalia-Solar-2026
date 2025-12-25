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
  const { banners, loading, error } = useBanners();

  // Blindagem contra erros
  try {
    // Se ainda está carregando, mostra skeleton
    if (loading) {
      return (
        <div className={`animate-pulse bg-gray-200 rounded-2xl ${className}`} style={{ aspectRatio: '3/1' }} />
      );
    }

    // Se houver erro ou não houver banners, retorna null silenciosamente
    if (error || !banners || !Array.isArray(banners)) {
      console.warn(`[BannerByLocation] No banners found for location: ${location}`, error);
      return null;
    }

    // Filtra banners pela localização (usando position como fallback)
    const locationBanners = banners.filter(banner => 
      banner?.position === location || 
      banner?.position === 'navbar' // fallback para navbar
    );

    // Se não houver banners para essa localização, retorna null
    if (locationBanners.length === 0) {
      return null;
    }

    // Renderiza os banners usando o BannerContainer
    return (
      <div className={className}>
        <BannerContainer banners={locationBanners} />
      </div>
    );
  } catch (err) {
    // Silenciosamente retorna null em vez de quebrar a página
    console.error('[BannerByLocation] Error rendering banner:', err);
    return null;
  }
}
