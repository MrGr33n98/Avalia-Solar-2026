'use client';

import React, { useState } from 'react';
import Image from 'next/image';

export type BrandAvatarSize = 24 | 28 | 32 | 40 | 48;

export interface BrandAvatarProps {
  name: string;
  logoUrl?: string | null;
  initials?: string;
  size?: BrandAvatarSize;
  className?: string;
  alt?: string;
}

const sizeConfig: Record<
  BrandAvatarSize,
  { container: string; text: string; imageSize: number }
> = {
  24: { container: 'w-6 h-6', text: 'text-[10px]', imageSize: 20 },
  28: { container: 'w-7 h-7', text: 'text-[11px]', imageSize: 24 },
  32: { container: 'w-8 h-8', text: 'text-xs', imageSize: 28 },
  40: { container: 'w-10 h-10', text: 'text-sm', imageSize: 36 },
  48: { container: 'w-12 h-12', text: 'text-base', imageSize: 44 },
};

function fallbackInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'BR';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function BrandAvatar({
  name,
  logoUrl,
  initials,
  size = 32,
  className = '',
  alt,
}: BrandAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const cfg = sizeConfig[size] || sizeConfig[32];
  const monogram = initials || fallbackInitials(name);
  const altText = alt || `Logo da marca ${name}`;

  if (logoUrl && !imageFailed) {
    return (
      <span
        className={`relative inline-flex items-center justify-center rounded-full bg-white border border-[#E0E0E0] overflow-hidden flex-shrink-0 ${cfg.container} ${className}`}
        aria-label={altText}
        role="img"
      >
        <Image
          src={logoUrl}
          alt={altText}
          width={cfg.imageSize}
          height={cfg.imageSize}
          className="object-contain p-0.5"
          onError={() => setImageFailed(true)}
          unoptimized
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-[#F4F7FB] border border-[#D0D7DE] text-[#17468D] font-bold select-none flex-shrink-0 tracking-tight ${cfg.container} ${cfg.text} ${className}`}
      aria-label={altText}
      role="img"
    >
      {monogram}
    </span>
  );
}
