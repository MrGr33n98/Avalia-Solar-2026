'use client';

import React from 'react';
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
}

interface BannerContainerProps {
  banners: BannerData[];
}

export function BannerContainer({ banners }: BannerContainerProps) {
  // Validação de props e blindagem contra null/undefined
  if (!banners || !Array.isArray(banners)) {
    console.warn('[BannerContainer] banners prop is invalid:', banners);
    return null;
  }

  try {
    const displayBanners = banners;

  // Se houver apenas 1 banner, exiba-o estaticamente
  if (displayBanners.length === 1) {
    const banner = displayBanners[0];
    return (
      <div className="p-1">
        <Card className="overflow-hidden">
          <CardContent className="relative flex items-center justify-center p-0 aspect-[16/9] sm:aspect-[3/1]">
            <Link href={banner.link || '#'} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
              <Image
                        src={banner.image_url}
                        alt={banner.title}
                        fill
                        priority
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
                        className="object-contain md:object-cover object-center"
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
                  <CardContent className="relative flex items-center justify-center p-0 aspect-[16/9] sm:aspect-[3/1]">
                    <Link href={banner.link || '#'} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                      <Image
                        src={banner.image_url}
                        alt={banner.title}
                        fill
                        priority
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-contain md:object-cover object-center"
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
