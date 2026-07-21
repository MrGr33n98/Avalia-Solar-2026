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
  size?: 'sm' | 'md' | 'lg' | 'custom';
  priority?: boolean;
}

export function CompanyLogo({
  logoUrl,
  name,
  className,
  imageClassName,
  size = 'md',
  priority = false,
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

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white border border-slate-200/90 p-0 transition-all select-none shadow-2xs',
        sizeClasses[size],
        className
      )}
    >
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
