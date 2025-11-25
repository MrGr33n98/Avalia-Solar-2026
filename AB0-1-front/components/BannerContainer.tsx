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
  position: 'navbar' | 'sidebar';
  image_url: string;
  title: string;
  link?: string;
  sponsored?: boolean;
}

interface BannerContainerProps {
  banners: BannerData[];
}

export function BannerContainer({ banners }: BannerContainerProps) {
  const navbarBanners = banners.filter(banner => banner.position === 'navbar');

  // Se houver apenas 1 banner, exiba-o estaticamente
  if (navbarBanners.length === 1) {
    const banner = navbarBanners[0];
    return (
      <div className="p-1">
        <Card className="overflow-hidden">
          <CardContent className="relative flex items-center justify-center p-0 h-56">
            <Link href={banner.link || '#'} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
              <Image
                src={banner.image_url}
                alt={banner.title}
                fill
                priority
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
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
  if (navbarBanners.length > 1) {
    return (
      <Carousel
        plugins={[Autoplay({ delay: 2000, stopOnInteraction: true })]}
        className="w-full"
        opts={{
          loop: true,
        }}
      >
        <CarouselContent>
          {navbarBanners.map((banner) => (
            <CarouselItem key={banner.id}>
              <div className="p-1">
                <Card className="overflow-hidden">
                  <CardContent className="relative flex items-center justify-center p-0 h-56">
                    <Link href={banner.link || '#'} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                      <Image
                        src={banner.image_url}
                        alt={banner.title}
                        fill
                        priority
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
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
}
