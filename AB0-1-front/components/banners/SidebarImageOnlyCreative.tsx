'use client';

import React from 'react';
import Link from 'next/link';
import { BannerMedia } from './BannerMedia';
import { SponsoredBadge } from './SponsoredBadge';
import { cn } from '@/lib/utils';
import type { BannerData } from '@/components/BannerContainer';

export interface SidebarImageOnlyCreativeProps {
  banner: BannerData;
  priority?: boolean;
  onMediaError?: () => void;
  onMediaLoad?: () => void;
  onBannerClick?: () => void;
  sizes?: string;
  ambientBackground?: boolean;
  className?: string;
}

export function SidebarImageOnlyCreative({
  banner,
  priority = false,
  onMediaError,
  onMediaLoad,
  onBannerClick,
  sizes = '300px',
  ambientBackground = false,
  className,
}: SidebarImageOnlyCreativeProps) {
  if (!banner.image_url) {
    return null;
  }

  const destinationUrl = banner.link_url || banner.link || null;
  const href = banner.id ? `/api/v1/banner_clicks/${banner.id}` : destinationUrl;

  const content = (
    <div className="relative h-full w-full overflow-hidden bg-slate-50/20">
      <BannerMedia
        src={banner.image_url}
        mobileSrc={banner.image_mobile_url}
        alt={banner.alt_text?.trim() || banner.title || 'Banner publicitário'}
        fit="contain"
        priority={priority}
        sizes={sizes}
        quality={85}
        ambientBackground={ambientBackground}
        onMediaLoad={onMediaLoad}
        onMediaError={onMediaError}
        className="absolute inset-0"
      />
      {banner.sponsored && <SponsoredBadge className="top-2 right-2 md:top-2 md:right-2" />}
    </div>
  );

  return (
    <div
      className={cn(
        'group relative h-full w-full max-w-[300px] overflow-hidden rounded-xl border border-[#DDE4EC] bg-white shadow-sm transition-shadow hover:shadow-md',
        className
      )}
    >
      {href ? (
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onBannerClick}
          aria-label={
            banner.sponsored
              ? `Patrocinado: ${banner.alt_text?.trim() || banner.title || 'Abrir anúncio'}`
              : banner.alt_text?.trim() || banner.title || 'Abrir anúncio'
          }
          className="block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}
