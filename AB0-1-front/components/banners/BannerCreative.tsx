'use client';

import React from 'react';
import { SidebarEditorialCreative } from './SidebarEditorialCreative';
import { SidebarImageOnlyCreative } from './SidebarImageOnlyCreative';
import type { BannerData } from '@/components/BannerContainer';

export interface BannerCreativeProps {
  banner: BannerData;
  position?: string;
  priority?: boolean;
  onMediaError?: () => void;
  onMediaLoad?: () => void;
  onBannerClick?: () => void;
  sizes?: string;
  ambientBackground?: boolean;
  className?: string;
}

/**
 * Discriminated union component que seleciona a variante criativa correta:
 * - Modo 'photo_with_html': renderiza SidebarEditorialCreative (card editorial com ilustração/foto, headline, subtítulo, benefícios e CTA outline).
 * - Modo 'image_only' (padrão): renderiza SidebarImageOnlyCreative (arte visual pura em alta fidelidade).
 */
export function BannerCreative({
  banner,
  priority = false,
  onMediaError,
  onMediaLoad,
  onBannerClick,
  sizes,
  ambientBackground,
  className,
}: BannerCreativeProps) {
  const isEditorial =
    banner.creative_mode === 'photo_with_html' &&
    Boolean(banner.headline?.trim() || banner.title?.trim());

  if (isEditorial) {
    return (
      <SidebarEditorialCreative
        banner={banner}
        priority={priority}
        onMediaError={onMediaError}
        onMediaLoad={onMediaLoad}
        onCtaClick={onBannerClick}
        className={className}
      />
    );
  }

  return (
    <SidebarImageOnlyCreative
      banner={banner}
      priority={priority}
      onMediaError={onMediaError}
      onMediaLoad={onMediaLoad}
      onBannerClick={onBannerClick}
      sizes={sizes}
      ambientBackground={ambientBackground}
      className={className}
    />
  );
}
