/**
 * TASK-020: Optimized Image Component
 * 
 * Component wrapper para next/image com otimizações e fallbacks
 * Usa as configurações de otimização do next.config.js
 */

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Componente de imagem otimizada com lazy loading, formatos modernos
 * e fallback para erros de carregamento
 * 
 * Features:
 * - Lazy loading automático (exceto com priority=true)
 * - Otimização automática para AVIF/WebP
 * - Responsive images com srcset
 * - Fallback em caso de erro
 * - Loading skeleton/blur
 * 
 * @example
 * ```tsx
 * <OptimizedImage
 *   src="/hero.jpg"
 *   alt="Hero image"
 *   width={1200}
 *   height={600}
 *   priority // Para imagens above the fold
 * />
 * ```
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  priority = false,
  quality = 85,
  sizes,
  objectFit = 'cover',
  fallbackSrc = '/images/placeholder.png',
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setImgSrc(fallbackSrc);
    setIsLoading(false);
    onError?.();
  };

  const imageProps = {
    src: imgSrc,
    alt,
    quality,
    priority,
    onLoad: handleLoad,
    onError: handleError,
    className: cn(
      'transition-opacity duration-300',
      isLoading ? 'opacity-0' : 'opacity-100',
      className
    ),
    style: { objectFit },
  };

  if (fill) {
    return (
      <Image
        {...imageProps}
        alt={alt}
        fill
        sizes={
          sizes ||
          '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
        }
      />
    );
  }

  return (
    <Image
      {...imageProps}
      alt={alt}
      width={width || 800}
      height={height || 600}
      sizes={sizes}
    />
  );
}

/**
 * Avatar component com otimização
 */
export function OptimizedAvatar({
  src,
  alt,
  size = 40,
  className,
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn('rounded-full', className)}
      sizes={`${size}px`}
      quality={90} // Maior qualidade para avatares pequenos
    />
  );
}

/**
 * Logo component com otimização
 */
export function OptimizedLogo({
  src,
  alt,
  width = 150,
  height = 50,
  className,
  priority = true, // Logos geralmente são above the fold
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      quality={95} // Maior qualidade para logos
      objectFit="contain"
    />
  );
}
