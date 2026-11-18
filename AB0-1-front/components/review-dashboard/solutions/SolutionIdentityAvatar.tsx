'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface SolutionIdentityAvatarProps {
  name: string;
  logoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES: Record<NonNullable<SolutionIdentityAvatarProps['size']>, string> = {
  sm: 'h-8 w-8 text-[10px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-12 w-12 text-sm',
};

const SIZE_PX: Record<NonNullable<SolutionIdentityAvatarProps['size']>, string> = {
  sm: '32px',
  md: '40px',
  lg: '48px',
};

function extractInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'AS';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

/**
 * Avatar de solução/marca no padrão IBM Carbon compacto.
 * Renderiza o logotipo oficial quando fornecido pela API; caso contrário,
 * utiliza monograma tipográfico determinístico sem recorrer a ícones genéricos.
 */
export function SolutionIdentityAvatar({
  name,
  logoUrl,
  size = 'md',
}: SolutionIdentityAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [logoUrl]);

  const safeName = name.trim() || 'Solução cadastrada';
  const initials = extractInitials(safeName);
  const showImage = Boolean(logoUrl) && !imageFailed;

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#DDE5EF] font-semibold tracking-tight ${
        showImage ? 'bg-white' : 'bg-[#F4F7FB] text-[#17468D]'
      } ${SIZE_CLASSES[size]}`}
      aria-label={`Solução: ${safeName}`}
      title={safeName}
    >
      {showImage && logoUrl ? (
        <Image
          src={logoUrl}
          alt=""
          fill
          sizes={SIZE_PX[size]}
          unoptimized
          className="object-contain p-1"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </span>
  );
}

