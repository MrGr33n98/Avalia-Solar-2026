'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { getFullImageUrl } from '@/utils/image';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface CompanyLogoProps {
  logoUrl?: string | null;
  name: string;
  className?: string;
  imageClassName?: string;
  badgeClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'custom';
  priority?: boolean;
  badges?: Array<{ image_url?: string | null; name?: string | null }> | null;
  verifiedBadgeUrl?: string | null;
}

export function CompanyLogo({
  logoUrl,
  name,
  className,
  imageClassName,
  badgeClassName,
  size = 'md',
  priority = false,
  badges,
  verifiedBadgeUrl,
}: CompanyLogoProps) {
  const [error, setError] = useState(false);

  const isValidLogo =
    Boolean(logoUrl) &&
    logoUrl !== '/images/avalia-solar-place-holder.PNG' &&
    logoUrl !== '/images/logo-placeholder.svg';

  const resolvedUrl = isValidLogo ? getFullImageUrl(logoUrl) : null;
  const hasImage = Boolean(resolvedUrl) && !error;

  // Tamanhos padronizados quadrados para preenchimento 100% da moldura:
  const sizeClasses = {
    sm: 'w-[44px] h-[44px] md:w-[48px] md:h-[48px]',
    md: 'w-[56px] h-[56px] md:w-[64px] md:h-[64px]',
    lg: 'w-[72px] h-[72px] md:w-[84px] md:h-[84px]',
    custom: '',
  };

  const badgeSizeClasses = {
    sm: 'w-[22px] h-[22px] -right-1.5 -top-1.5 md:w-[26px] md:h-[26px] md:-right-2 md:-top-2',
    md: 'w-[28px] h-[28px] -right-2 -top-2 md:w-[34px] md:h-[34px] md:-right-2.5 md:-top-2.5',
    lg: 'w-[34px] h-[34px] -right-2.5 -top-2.5 md:w-[42px] md:h-[42px] md:-right-3 md:-top-3',
    custom: 'w-[28px] h-[28px] -right-2 -top-2',
  };

  const companyBadges = Array.isArray(badges)
    ? badges
    : badges && typeof badges === 'object'
    ? [badges]
    : [];

  const badgeToRender = companyBadges.find((b) => {
    if (!b) return false;
    const url =
      b.image_url ||
      (b as any).url ||
      (b as any).image ||
      (b as any).badge_url ||
      (b as any).badgeUrl ||
      (b as any).imageUrl ||
      (b as any).icon_url ||
      (b as any).iconUrl;
    return Boolean(url);
  });

  const rawBadgeUrl =
    (badgeToRender
      ? badgeToRender.image_url ||
        (badgeToRender as any).url ||
        (badgeToRender as any).image ||
        (badgeToRender as any).badge_url ||
        (badgeToRender as any).badgeUrl ||
        (badgeToRender as any).imageUrl ||
        (badgeToRender as any).icon_url ||
        (badgeToRender as any).iconUrl
      : null) || verifiedBadgeUrl;

  const badgeImageUrl = rawBadgeUrl ? getFullImageUrl(rawBadgeUrl) : null;
  const badgeTitle = badgeToRender?.name || (badgeToRender as any)?.title || 'Selo de conquista';

  const [badgeError, setBadgeError] = useState(false);

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200/90 p-0 transition-all select-none shadow-2xs',
        sizeClasses[size],
        className
      )}
    >
      {badgeImageUrl && !badgeError && (
        <div
          data-testid="company-achievement-badge"
          className={cn(
            'absolute z-20 flex items-center justify-center transition-transform hover:scale-110 drop-shadow-[0_0_1px_rgba(255,255,255,1)] drop-shadow-[0_0_1.5px_rgba(203,213,225,0.95)] drop-shadow-[0_3px_6px_rgba(15,23,42,0.25)]',
            badgeSizeClasses[size],
            badgeClassName
          )}
          title={badgeTitle}
        >
          <Image
            src={badgeImageUrl}
            alt={badgeTitle}
            width={48}
            height={48}
            className="object-contain w-full h-full"
            unoptimized
            onError={() => setBadgeError(true)}
          />
        </div>
      )}
      {hasImage ? (
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-md bg-white">
          <Image
            src={resolvedUrl!}
            alt={name ? `Logo da empresa ${name}` : 'Logo da empresa'}
            fill
            sizes="(max-width: 768px) 90px, 140px"
            priority={priority}
            className={cn(
              'h-full w-full object-contain object-center transition-opacity duration-300 p-0',
              imageClassName
            )}
            onError={() => setError(true)}
          />
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-md bg-gradient-to-br from-[#0B1528] to-[#1E293B] text-amber-400 font-black uppercase text-xs sm:text-sm tracking-wider">
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}
