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
    sm: 'w-[56px] h-[40px] md:w-[64px] md:h-[44px]',
    md: 'w-[68px] h-[48px] md:w-[80px] md:h-[56px]',
    lg: 'w-[88px] h-[60px] md:w-[104px] md:h-[72px]',
    custom: '',
  };

  const hasImage = Boolean(resolvedUrl) && !error;

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white border border-slate-200/80 p-0.5 transition-all select-none shadow-xs',
        sizeClasses[size],
        className
      )}
    >
      {hasImage ? (
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg">
          <Image
            src={resolvedUrl!}
            alt={name ? `Logo da empresa ${name}` : 'Logo da empresa'}
            fill
            sizes="(max-width: 768px) 90px, 140px"
            priority={priority}
            className={cn(
              'h-full w-full object-contain object-center transition-opacity duration-300',
              imageClassName
            )}
            onError={() => setError(true)}
          />
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-lg bg-slate-50 text-slate-400">
          <Building2 className="h-5 w-5 stroke-[1.5]" />
        </div>
      )}
    </div>
  );
}
