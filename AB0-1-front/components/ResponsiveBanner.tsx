'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

interface ResponsiveBannerProps {
  src: string;
  alt: string;
  link?: string;
  className?: string;
  priority?: boolean;
}

/**
 * Componente de Banner Responsivo com Aspect Ratio fixo
 * - Mobile: aspect-[16/9] (mais quadrado)
 * - Desktop: aspect-[3/1] (mais largo)
 * - Sempre mantém proporção correta sem distorção
 * - Blindado contra erros: retorna null silenciosamente se falhar
 */
export default function ResponsiveBanner({
  src,
  alt,
  link,
  className = '',
  priority = false
}: ResponsiveBannerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Validação de props
  if (!src) {
    console.warn('[ResponsiveBanner] src is required but was not provided');
    return null;
  }

  // Wrapper de try/catch para prevenir crashes
  try {

  const content = (
    <div 
      className={`
        relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 shadow-sm
        aspect-[16/9] md:aspect-[3/1]
        ${className}
      `}
    >
      {/* Skeleton loading state */}
      {isLoading && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}

      {/* Imagem do banner */}
      {!hasError ? (
        <Image
          src={src}
          alt={alt}
          fill
          className={`
            object-cover transition-opacity duration-300
            ${isLoading ? 'opacity-0' : 'opacity-100'}
          `}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          unoptimized
          priority={priority}
        />
      ) : (
        /* Fallback caso a imagem falhe */
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-primary/20 to-accent/20">
          <div className="text-center text-gray-600">
            <p className="text-sm font-medium">Banner indisponível</p>
          </div>
        </div>
      )}

      {/* Overlay sutil para melhor legibilidade de texto sobreposto */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
      
      {/* Badge decorativo (opcional) */}
      <div className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-gray-800">
        Destaque da semana
      </div>

      {/* Indicadores de carrossel (opcional) */}
      <div className="absolute bottom-2 right-2 flex gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
      </div>
    </div>
  );

    // Se tiver link, envolve em um <a>
    if (link) {
      return (
        <a 
          href={link} 
          className="block cursor-pointer transition-transform hover:scale-[1.02]"
          aria-label={alt}
        >
          {content}
        </a>
      );
    }

    return content;
  } catch (error) {
    // Silenciosamente retorna null em vez de quebrar a página
    console.error('[ResponsiveBanner] Error rendering banner:', error);
    return null;
  }
}
