'use client';

import * as React from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import LandingCategoryCard from '@/components/landing/LandingCategoryCard';
import type { Category } from '@/lib/api';

interface HomeCategoryCarouselProps {
  categories: Category[];
}

export function HomeCategoryCarousel({ categories }: HomeCategoryCarouselProps) {
  // Ordenação: 
  // 1. Featured
  // 2. Active com banner
  // 3. Demais
  const sortedCategories = React.useMemo(() => {
    return [...categories].sort((a, b) => {
      // Prioridade 1: Featured
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;

      // Prioridade 2: Tem carousel banner
      const aHasBanner = !!a.home_carousel_banner_url;
      const bHasBanner = !!b.home_carousel_banner_url;
      if (aHasBanner && !bHasBanner) return -1;
      if (!aHasBanner && bHasBanner) return 1;

      // Manter ordem alfabética ou original usando locale estável para evitar hydration mismatch
      return a.name.localeCompare(b.name, 'pt-BR');
    });
  }, [categories]);

  if (!sortedCategories.length) return null;

  return (
    <div className="relative group">
      <Carousel
        opts={{
          align: 'start',
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {sortedCategories.map((category) => (
            <CarouselItem 
              key={category.id} 
              className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
            >
              <div className="h-full py-1">
                <LandingCategoryCard category={category} className="h-full" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Navigation - Hidden on mobile, shown on hover/desktop */}
        <div className="hidden md:block">
          <CarouselPrevious className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0" />
          <CarouselNext className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0" />
        </div>

        {/* Mobile indicators/hint could go here if needed */}
      </Carousel>

      <div className="mt-8 md:mt-10 text-center">
        <Button asChild variant="outline" className="clay-chip rounded-full">
          <Link href="/categories" className="group">
            Ver Todas as Categorias 
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
