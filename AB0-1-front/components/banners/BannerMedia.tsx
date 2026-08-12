'use client';

import Image from 'next/image';
import { useState } from 'react';
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
  fallbackSrc = '/images/banner-placeholder.svg',
  className,
}: BannerMediaProps) {
  const [currentSrc, setCurrentSrc] = useState(mobileSrc || src);
  const [failed, setFailed] = useState(false);
  const resolvedSrc = failed ? fallbackSrc : currentSrc;
  const objectClass = fit === 'cover' ? 'object-cover' : 'object-contain';

  const handleError = () => {
    if (!failed && currentSrc !== src) {
      setCurrentSrc(src);
      return;
    }
    setFailed(true);
  };

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
      />
    </div>
  );
}
