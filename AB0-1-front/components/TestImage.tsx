'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface TestImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  onError?: () => void;
}

export default function TestImage({ src, alt, className = '', fill = true, width, height, onError }: TestImageProps) {
  const [imageError, setImageError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    console.log('TestImage mounted with:', { src, alt, fill, width, height });
  }, [src, alt, fill, width, height]);

  if (imageError || useFallback) {
    if (fill) {
      return (
        <img 
          src={src} 
          alt={alt}
          className={`${className} w-full h-full`}
          loading="lazy"
          decoding="async"
          onError={() => {
          console.log('Fallback img also failed:', src);
          if (onError) onError();
        }}
          onLoad={() => console.log('Fallback img loaded successfully:', src)}
        />
      );
    } else {
      return (
        <img 
          src={src} 
          alt={alt}
          width={width}
          height={height}
          className={className}
          loading="lazy"
          decoding="async"
          onError={() => {
          console.log('Fallback img also failed:', src);
          if (onError) onError();
        }}
          onLoad={() => console.log('Fallback img loaded successfully:', src)}
        />
      );
    }
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        onError={() => {
          console.log('Next.js Image failed, switching to fallback:', src);
          setImageError(true);
          if (onError) onError();
        }}
        onLoad={() => {
          console.log('Next.js Image loaded successfully:', src);
        }}
        unoptimized
        priority={false}
      />
    );
  } else {
    return (
      <Image
        src={src}
        alt={alt}
        width={width || 48}
        height={height || 48}
        className={className}
        onError={() => {
          console.log('Next.js Image failed, switching to fallback:', src);
          setImageError(true);
          if (onError) onError();
        }}
        onLoad={() => {
          console.log('Next.js Image loaded successfully:', src);
        }}
        unoptimized
        priority={false}
      />
    );
  }
}
