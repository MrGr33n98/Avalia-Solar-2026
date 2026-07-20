'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { getFullImageUrl } from '@/utils/image';
import { Building2 } from 'lucide-react';
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
  const resolvedUrl = getFullImageUrl(logoUrl || undefined);

  // Tamanhos padronizados com proporção fixa (largura x altura):
  // sm (Mobile / Cards compactos): 56x40px (md: 64x44px)
  // md (Cards padrão / Comparadores): 68x48px (md: 80x56px)
  // lg (Detalhes / Destaques / Busca): 88x60px (md: 104x72px)
  const sizeClasses = {
    sm: 'w-[52px] h-[38px] md:w-[60px] md:h-[42px]',
    md: 'w-[64px] h-[46px] md:w-[76px] md:h-[52px]',
    lg: 'w-[84px] h-[58px] md:w-[98px] md:h-[68px]',
    custom: '',
  };

  const hasImage = Boolean(resolvedUrl) && !error;

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white border border-slate-200/90 p-[1px] transition-all select-none shadow-2xs',
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
              'h-full w-full object-contain object-center transition-opacity duration-300 p-0.5',
              imageClassName
            )}
            onError={() => setError(true)}
          />
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-md bg-slate-50 text-slate-400">
          <Building2 className="h-5 w-5 stroke-[1.5]" />
        </div>
      )}
    </div>
  );
}
