'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import {
  resolveQuickProductCategories,
  type ResolvedQuickProductCategory,
} from '@/lib/products/quick-product-categories';
import type { ProductCategoryFilter } from '@/hooks/useProducts';
import { cn } from '@/lib/utils';
import { ProductCategoryCard } from './ProductCategoryCard';

interface ProductCategoryRailProps {
  categories: ProductCategoryFilter[];
  selectedCategoryId: string;
  onCategoryChange: (category: ResolvedQuickProductCategory) => void;
  isLoading?: boolean;
}

export function ProductCategoryRail({
  categories,
  selectedCategoryId,
  onCategoryChange,
  isLoading = false,
}: ProductCategoryRailProps) {
  const items = React.useMemo(() => resolveQuickProductCategories(categories), [categories]);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [api, setApi] = React.useState<CarouselApi>();
  const [selectedSnap, setSelectedSnap] = React.useState(0);
  const [snapCount, setSnapCount] = React.useState(0);
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  React.useEffect(() => {
    if (!api) return;

    const update = () => {
      setSelectedSnap(api.selectedScrollSnap());
      setSnapCount(api.scrollSnapList().length);
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    };

    update();
    api.on('select', update);
    api.on('reInit', update);
    return () => {
      api.off('select', update);
      api.off('reInit', update);
    };
  }, [api]);

  return (
    <section
      aria-label="Categorias de produtos"
      data-testid="product-category-rail"
      className="w-full border-y border-slate-200/70 bg-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <Carousel
          setApi={setApi}
          opts={{
            align: 'start',
            containScroll: 'trimSnaps',
            loop: false,
            duration: prefersReducedMotion ? 0 : 20,
          }}
          aria-label="Navegar pelas seis categorias de produtos"
        >
          <CarouselContent className="-ml-2 md:-ml-[10px] lg:-ml-3">
            {items.map((category) => (
              <CarouselItem
                key={category.key}
                className="basis-[116px] pl-2 md:basis-[134px] md:pl-[10px] lg:basis-1/6 lg:pl-3"
              >
                {isLoading ? (
                  <div
                    aria-hidden="true"
                    className="flex h-[108px] flex-col items-center rounded-xl border border-slate-200 px-2 py-2 sm:h-[112px] lg:h-[116px]"
                  >
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <Skeleton className="mt-2 h-3 w-16" />
                    <Skeleton className="mt-auto h-2.5 w-14" />
                  </div>
                ) : (
                  <ProductCategoryCard
                    category={category}
                    selected={
                      category.categoryId !== null &&
                      selectedCategoryId === String(category.categoryId)
                    }
                    onSelect={onCategoryChange}
                  />
                )}
              </CarouselItem>
            ))}
          </CarouselContent>

          {canScrollPrev && (
            <button
              type="button"
              onClick={() => api?.scrollPrev()}
              aria-label="Ver categorias anteriores"
              className="absolute -left-2 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm focus-visible:ring-2 focus-visible:ring-blue-600 md:flex"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          {canScrollNext && (
            <button
              type="button"
              onClick={() => api?.scrollNext()}
              aria-label="Ver próximas categorias"
              className="absolute -right-2 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm focus-visible:ring-2 focus-visible:ring-blue-600 md:flex"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </Carousel>

        {snapCount > 1 && (
          <div
            className="mt-1 flex min-h-6 items-center justify-center gap-0.5"
            role="group"
            aria-label="Páginas de categorias"
          >
            {Array.from({ length: snapCount }, (_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Ir para página ${index + 1} de categorias`}
                aria-current={index === selectedSnap ? 'true' : undefined}
                onClick={() => api?.scrollTo(index)}
                className="flex h-6 w-6 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    index === selectedSnap ? 'bg-blue-600' : 'bg-slate-300'
                  )}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
