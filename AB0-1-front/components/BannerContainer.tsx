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

interface BannerData {
  id: number | string;
  type: 'rectangular_large' | 'rectangular_small';
  position: 'navbar' | 'sidebar' | 'categories_top' | 'home_top' | 'companies_top';
  image_url: string;
  title: string;
  link?: string;
  sponsored?: boolean;
  width?: number | null;
  height?: number | null;
}

interface BannerContainerProps {
  banners: BannerData[];
}

const FALLBACK_BANNER_SRC = '/images/default-banner.svg';

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

export function BannerContainer({ banners }: BannerContainerProps) {
  // Validação de props e blindagem contra null/undefined
  if (!banners || !Array.isArray(banners)) {
    console.warn('[BannerContainer] banners prop is invalid:', banners);
    return null;
  }

  try {
    const displayBanners = banners;

    const dimsStyle = (banner: BannerData): React.CSSProperties => {
      const style: React.CSSProperties = {};
      if (typeof banner.width === 'number' && banner.width > 0) {
        style.maxWidth = `${banner.width}px`;
      }
      if (typeof banner.height === 'number' && banner.height > 0) {
        style.maxHeight = `${banner.height}px`;
      }
      if (typeof banner.width === 'number' && banner.width > 0 && typeof banner.height === 'number' && banner.height > 0) {
        style.aspectRatio = `${banner.width} / ${banner.height}`;
      }
      return style;
    };

  // Se houver apenas 1 banner, exiba-o estaticamente
  if (displayBanners.length === 1) {
    const banner = displayBanners[0];
    return (
      <div className="p-1">
        <Card className="overflow-hidden">
          <CardContent
            className="relative flex items-center justify-center p-0 w-full mx-auto bg-white aspect-[6/1] sm:aspect-[4/1]"
            style={dimsStyle(banner)}
          >
            <Link href={banner.link || '#'} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
              <BannerImage
                banner={banner}
                priority
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
              />
              {banner.sponsored && (
                  <span className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      Patrocinado
                  </span>
              )}
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se houver 2 ou mais banners, use o carrossel
  if (displayBanners.length > 1) {
    return (
      <Carousel
        plugins={[Autoplay({ delay: 2000, stopOnInteraction: true })]}
        className="w-full"
        opts={{
          loop: true,
        }}
      >
        <CarouselContent>
          {displayBanners.map((banner) => (
            <CarouselItem key={banner.id}>
              <div className="p-1">
                <Card className="overflow-hidden">
                  <CardContent
                    className="relative flex items-center justify-center p-0 w-full mx-auto bg-white aspect-[6/1] sm:aspect-[4/1]"
                    style={dimsStyle(banner)}
                  >
                    <Link href={banner.link || '#'} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                      <BannerImage
                        banner={banner}
                        priority
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      {banner.sponsored && (
                          <span className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                              Patrocinado
                          </span>
                      )}
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/70 hover:bg-white text-gray-800" />
        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/70 hover:bg-white text-gray-800" />
      </Carousel>
    );
  }

    // Se não houver banners para a navbar, não renderize nada
    return null;
  } catch (error) {
    // Silenciosamente retorna null em vez de quebrar a página
    console.error('[BannerContainer] Error rendering banners:', error);
    return null;
  }
}
