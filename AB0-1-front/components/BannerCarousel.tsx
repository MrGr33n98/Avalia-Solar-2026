'use client';

import * as React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Banner } from '@/lib/api'; // Ensure Banner type is imported or defined
import { getFullImageUrl } from '@/utils/image';
import { OptimizedImage } from '@/components/ui/optimized-image';

type BannerWithDescription = Banner & { description?: string | null };

interface BannerCarouselProps {
  banners: BannerWithDescription[];
  className?: string;
  autoplayDelay?: number;
}

export default function BannerCarousel({ 
  banners, 
  className, 
  autoplayDelay = 5000 
}: BannerCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: autoplayDelay, stopOnInteraction: false })
  ]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([]);

  const onSelect = React.useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  React.useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const scrollPrev = React.useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = React.useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  const scrollTo = React.useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  if (!banners || banners.length === 0) return null;

  return (
    <div className={cn("relative group", className)}>
      <div className="overflow-hidden rounded-xl" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner, index) => {
             const imageUrl = getFullImageUrl(banner.image_url || '');
             const width = banner.width || 1600;
             const height = banner.height || 400;
             return (
              <div className="relative flex-[0_0_100%] min-w-0" key={banner.id || index}>
                <div className="relative aspect-[3/1] md:aspect-[4/1] w-full overflow-hidden">
                  {imageUrl ? (
                    <OptimizedImage
                      src={imageUrl}
                      alt={banner.title || 'Banner'}
                      width={width}
                      height={height}
                      fill
                      className="object-cover"
                      priority={index === 0}
                      quality={85}
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 100vw, 1280px"
                      containerClassName="h-full"
                      useAspectRatio={false}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">Sem imagem</span>
                    </div>
                  )}
                  {/* Overlay for text if needed */}
                  {(banner.title || banner.description) && (
                    <div className="absolute inset-0 bg-black/30 flex items-end p-6">
                      <div className="text-white max-w-2xl">
                        {banner.title && <h2 className="text-2xl font-bold mb-2">{banner.title}</h2>}
                        {banner.description && <p className="text-sm md:text-base opacity-90">{banner.description}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
        onClick={scrollPrev}
      >
        <ChevronLeft className="h-6 w-6" />
        <span className="sr-only">Anterior</span>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
        onClick={scrollNext}
      >
        <ChevronRight className="h-6 w-6" />
        <span className="sr-only">Próximo</span>
      </Button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {scrollSnaps.map((_, index) => (
          <button
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              index === selectedIndex ? "bg-white w-4" : "bg-white/50 hover:bg-white/80"
            )}
            onClick={() => scrollTo(index)}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
