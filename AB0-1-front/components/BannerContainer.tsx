'use client';

import React, { useState } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import Link from 'next/link';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from '@/lib/utils';

interface BannerData {
  id: number | string;
  banner_type?: string;
  position?: string;
  image_url: string | null;
  title: string;
  link?: string | null;
  link_url?: string | null;
  sponsored?: boolean;
  width?: number | null;
  height?: number | null;
}

interface BannerContainerProps {
  banners: BannerData[];
  position?: string;
  className?: string;
}

// Use brand-friendly fallback instead of the missing placeholder-banner.png
const FALLBACK_BANNER_SRC = '/images/banner-placeholder.svg';

function BannerImage({
  banner,
  sizes,
  priority,
}: {
  banner: BannerData;
  sizes: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const src = !banner.image_url || failed ? FALLBACK_BANNER_SRC : banner.image_url;

  return (
    <Image
      src={src}
      alt={banner.title}
      fill
      priority={priority}
      sizes={sizes}
      className="object-cover object-center"
      onError={() => {
        if (failed || !banner.image_url) return;
        console.warn('[BannerContainer] Failed to load banner image, showing fallback:', banner.image_url);
        setFailed(true);
      }}
    />
  );
}

export function BannerContainer({ banners, position, className }: BannerContainerProps) {
  // Validação de props e blindagem contra null/undefined
  if (!banners || !Array.isArray(banners) || banners.length === 0) {
    return null;
  }

  try {
    const displayBanners = banners;

    // Helper para definir aspect ratio baseado na posição
    const getAspectClass = (pos?: string) => {
      switch (pos) {
        case 'navbar': return 'aspect-[10/1]';
        case 'sidebar': return 'aspect-[1/1]';
        case 'companies_footer': return 'aspect-[6/1] sm:aspect-[8/1]';
        default: return 'aspect-[6/1] sm:aspect-[4/1]';
      }
    };

    const dimsStyle = (banner: BannerData): React.CSSProperties => {
      const style: React.CSSProperties = {};
      // Se tiver dimensões explícitas vindas do admin, respeitamos como maxWidth/Height
      if (typeof banner.width === 'number' && banner.width > 0) {
        style.maxWidth = `${banner.width}px`;
      }
      if (typeof banner.height === 'number' && banner.height > 0) {
        style.maxHeight = `${banner.height}px`;
      }
      return style;
    };

    const aspectClass = getAspectClass(position);

    // Renderizador de item único para reaproveitamento
    const renderBannerItem = (banner: BannerData, isPriority = false) => (
      <Card className="overflow-hidden border-none bg-transparent shadow-none">
        <CardContent
          className={cn(
            "relative flex items-center justify-center p-0 w-full mx-auto bg-muted/20 overflow-hidden rounded-lg",
            aspectClass
          )}
          style={dimsStyle(banner)}
        >
          <Link 
            href={banner.link_url || banner.link || '#'} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="block w-full h-full"
          >
            <BannerImage
              banner={banner}
              priority={isPriority}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
            />
            {banner.sponsored && (
              <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 rounded backdrop-blur-sm">
                Patrocinado
              </span>
            )}
          </Link>
        </CardContent>
      </Card>
    );

    if (displayBanners.length === 1) {
      return (
        <div className={cn("w-full py-2", className)}>
          {renderBannerItem(displayBanners[0], true)}
        </div>
      );
    }

    return (
      <div className={cn("w-full py-2", className)}>
        <Carousel
          plugins={[Autoplay({ delay: 5000, stopOnInteraction: true })]}
          className="w-full"
          opts={{ loop: true }}
        >
          <CarouselContent>
            {displayBanners.map((banner, idx) => (
              <CarouselItem key={banner.id || idx}>
                {renderBannerItem(banner, idx === 0)}
              </CarouselItem>
            ))}
          </CarouselContent>
          {displayBanners.length > 1 && (
            <>
              <CarouselPrevious className="left-2 bg-white/50 border-none hover:bg-white" />
              <CarouselNext className="right-2 bg-white/50 border-none hover:bg-white" />
            </>
          )}
        </Carousel>
      </div>
    );

  } catch (error) {
    console.error('[BannerContainer] Error rendering banners:', error);
    return null;
  }
}
