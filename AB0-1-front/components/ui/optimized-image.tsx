/**
 * TASK-020: Optimized Image Component
 * 
 * Component wrapper para next/image com otimizações e fallbacks
 * Usa as configurações de otimização do next.config.js
 */

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const DEFAULT_BLUR_DATA_URL =
  'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  fill?: boolean;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  fallbackSrc?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  useAspectRatio?: boolean;
  unoptimized?: boolean;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
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
  containerClassName,
  priority = false,
  quality = 85,
  sizes,
  objectFit = 'cover',
  fallbackSrc = '/images/placeholder.png',
  placeholder = 'blur',
  blurDataURL,
  useAspectRatio = true,
  unoptimized = false,
  loading,
  fetchPriority,
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
    fetchPriority: priority ? 'high' : fetchPriority,
    onLoad: handleLoad,
    onError: handleError,
    className: cn(
      'transition-opacity duration-300',
      isLoading ? 'opacity-0' : 'opacity-100',
      className
    ),
    style: { objectFit },
    sizes,
    placeholder,
    blurDataURL: placeholder === 'blur' ? blurDataURL || DEFAULT_BLUR_DATA_URL : undefined,
    unoptimized,
    loading: priority ? 'eager' : loading,
  };

  const placeholderNode = isLoading ? (
    <div className="absolute inset-0 bg-muted animate-pulse pointer-events-none" aria-hidden="true" />
  ) : null;

  if (fill) {
    const canUseAspectRatio =
      useAspectRatio &&
      typeof width === 'number' &&
      typeof height === 'number' &&
      width > 0 &&
      height > 0;
    const ratioStyle = canUseAspectRatio ? { aspectRatio: `${width}/${height}` } : undefined;
    return (
      <div
        className={cn('relative w-full overflow-hidden', containerClassName)}
        style={ratioStyle}
      >
        {placeholderNode}
        <Image
          {...imageProps}
          alt={alt}
          fill
          sizes={
            sizes ||
            '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
          }
        />
      </div>
    );
  }

  return (
    <div
      className={cn('relative inline-block overflow-hidden', containerClassName)}
      style={{ width, height }}
    >
      {placeholderNode}
      <Image
        {...imageProps}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
      />
    </div>
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
