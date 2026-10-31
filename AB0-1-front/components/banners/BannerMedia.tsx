'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface BannerMediaProps {
  src: string;
  mobileSrc?: string | null;
  alt: string;
  fit?: 'contain' | 'cover';
  position?: string;
  ambientBackground?: boolean;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  fallbackSrc?: string;
  className?: string;
  onMediaLoad?: () => void;
  onMediaError?: () => void;
}

export function BannerMedia({
  src,
  mobileSrc,
  alt,
  fit = 'contain',
  position = 'center',
  ambientBackground = false,
  priority = false,
  quality = 90,
  sizes,
  fallbackSrc,
  className,
  onMediaLoad,
  onMediaError,
}: BannerMediaProps) {
  const [currentSrc, setCurrentSrc] = useState(mobileSrc || src);
  const [failed, setFailed] = useState(false);

  // GAP-06: Sincroniza currentSrc e reseta estado quando props mudam em rotação/refetch
  useEffect(() => {
    setCurrentSrc(mobileSrc || src);
    setFailed(false);
  }, [src, mobileSrc]);

  const objectClass = fit === 'cover' ? 'object-cover' : 'object-contain';

  const handleError = () => {
    if (!failed && currentSrc !== src && src) {
      setCurrentSrc(src);
      return;
    }
    setFailed(true);
    onMediaError?.();
  };

  const handleLoad = () => {
    if (!failed) {
      onMediaLoad?.();
    }
  };

  // Se falhou e não há fallback explícito (ex: modo admin), não renderiza SVG cinza com texto "Banner Placeholder"
  if (failed && !fallbackSrc) {
    return (
      <div
        className={cn('relative h-full w-full overflow-hidden bg-slate-50/50', className)}
        aria-hidden="true"
        data-testid="banner-media-failed"
      />
    );
  }

  const resolvedSrc = failed ? fallbackSrc! : currentSrc;

  if (!resolvedSrc) {
    return null;
  }

  return (
    <div className={cn('relative h-full w-full overflow-hidden', className)}>
      {ambientBackground && (
        <Image
          src={resolvedSrc}
          alt=""
          fill
          aria-hidden="true"
          priority={priority}
          sizes={sizes}
          quality={quality}
          className="scale-105 object-cover opacity-25 blur-xl"
          style={{ objectPosition: position }}
        />
      )}
      <Image
        src={resolvedSrc}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        quality={quality}
        className={cn(objectClass, 'h-full w-full', !failed && 'transition-opacity duration-300')}
        style={{ objectPosition: position }}
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  );
}
