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
  priority = false
}: CompanyLogoProps) {
  const [error, setError] = useState(false);
  const resolvedUrl = getFullImageUrl(logoUrl || undefined);

  // Tamanhos padronizados:
  // sm (Mobile padrão/Compacto): 56x40px -> Desktop: 60x44px
  // md (Cards padrão): 64x44px -> Desktop: 76x52px
  // lg (Detalhes/Destaques): 80x56px -> Desktop: 96x64px
  const sizeClasses = {
    sm: 'w-[56px] h-[40px] md:w-[60px] md:h-[44px]',
    md: 'w-[64px] h-[44px] md:w-[76px] md:h-[52px]',
    lg: 'w-[80px] h-[56px] md:w-[96px] md:h-[64px]',
    custom: ''
  };

  const hasImage = resolvedUrl && !error;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-lg bg-slate-50/40 border border-slate-100/80 p-1.5 transition-all select-none",
        sizeClasses[size],
        className
      )}
    >
      {hasImage ? (
        <Image
          src={resolvedUrl}
          alt={name ? `Logo da empresa ${name}` : 'Logo da empresa'}
          fill
          sizes="(max-width: 768px) 80px, 120px"
          priority={priority}
          className={cn(
            "object-contain object-center w-full h-full mix-blend-multiply transition-opacity duration-300",
            imageClassName
          )}
          onError={() => setError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-slate-100/80 text-slate-400/80 rounded-md">
          <Building2 className="h-5 w-5 stroke-[1.5]" />
        </div>
      )}
    </div>
  );
}
