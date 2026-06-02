'use client';

import * as React from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Autoplay from 'embla-carousel-autoplay';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import LandingCategoryCard from '@/components/landing/LandingCategoryCard';
import type { Category } from '@/lib/api';

interface HomeCategoryCarouselProps {
  categories: Category[];
}

export function HomeCategoryCarousel({ categories }: HomeCategoryCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  const plugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  React.useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);
    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  // Ordenação estável
  const sortedCategories = React.useMemo(() => {
    return [...categories].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      const aHasBanner = !!a.home_carousel_banner_url;
      const bHasBanner = !!b.home_carousel_banner_url;
      if (aHasBanner && !bHasBanner) return -1;
      if (!aHasBanner && bHasBanner) return 1;
      return a.name.localeCompare(b.name, 'pt-BR');
    });
  }, [categories]);

  if (!sortedCategories.length) return null;

  return (
    <div className="relative group space-y-6">
      <Carousel
        setApi={setApi}
        plugins={[plugin.current]}
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
        opts={{
          align: 'start',
          loop: true,
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
                <LandingCategoryCard category={category} className="h-full shadow-lg border-slate-200" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        <div className="hidden md:block">
          <CarouselPrevious className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-xl border-slate-200 hover:bg-slate-50" />
          <CarouselNext className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-xl border-slate-200 hover:bg-slate-50" />
        </div>
      </Carousel>

      {/* Progress Indicators */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-1.5">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              onClick={() => api?.scrollTo(i)}
              className={`h-1.5 transition-all duration-300 rounded-full ${
                current === i + 1 
                  ? 'w-8 bg-brand-blue' 
                  : 'w-2 bg-slate-200 hover:bg-slate-300'
              }`}
              aria-label={`Ir para slide ${i + 1}`}
            />
          ))}
        </div>

        <Button asChild variant="outline" className="clay-chip rounded-full border-brand-blue/30 text-brand-blue hover:bg-brand-blue/5">
          <Link href="/categories" className="group flex items-center">
            Ver Todas as Categorias 
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
