'use client';

import * as React from 'react';
import Autoplay from 'embla-carousel-autoplay';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { motion, useAnimation } from 'framer-motion';
import { track } from '@/lib/analytics/lazy';

interface PremiumBannerCarouselProps {
  items: React.ReactNode[];
  autoplayDelay?: number;
  className?: string;
  aspectRatio?: string;
  onItemClick?: (index: number) => void;
}

export function PremiumBannerCarousel({
  items,
  autoplayDelay = 5000,
  className,
  aspectRatio = "aspect-[3/1] md:aspect-[4/1]",
  onItemClick,
}: PremiumBannerCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  
  // FIX: Pre-initialize scrollSnaps based on item count to avoid hydration/first-frame flicker
  const scrollSnaps = React.useMemo(() => items.map((_, i) => i), [items]);
  
  const controls = useAnimation();
  
  // FIX: Stable plugins reference
  const plugin = React.useRef(
    Autoplay({ delay: autoplayDelay, stopOnInteraction: false, stopOnMouseEnter: true })
  );

  // FIX: Stable options object to prevent Embla re-initialization
  const carouselOpts = React.useMemo(() => ({
    loop: true,
    align: "start" as const,
  }), []);

  const onSelect = React.useCallback((api: CarouselApi) => {
    if (!api) return;
    setSelectedIndex(api.selectedScrollSnap());
  }, []);

  React.useEffect(() => {
    if (!api) return;
    onSelect(api);
    api.on('select', onSelect);
    api.on('reInit', onSelect);
    return () => { api.off('select', onSelect); };
  }, [api, onSelect]);

  // Progress bar animation control
  React.useEffect(() => {
    if (!api || items.length <= 1) return;

    const startAnimation = async () => {
      controls.set({ width: "0%" });
      if (!isPaused) {
        await controls.start({
          width: "100%",
          transition: { duration: autoplayDelay / 1000, ease: "linear" },
        });
      }
    };

    startAnimation();
    
    const handleSelect = () => {
      controls.stop();
      startAnimation();
    };

    api.on('select', handleSelect);
    return () => {
      api.off('select', handleSelect);
      controls.stop();
    };
  }, [api, controls, autoplayDelay, items.length, isPaused]);

  const firedImpression = React.useRef(false);
  const impressionTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const containerRef = React.useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (firedImpression.current) return;
        
        impressionTimerRef.current = setTimeout(() => {
          if (firedImpression.current) return;
          firedImpression.current = true;
          track('premium_banner_carousel_viewed', {
            item_count: items.length,
            autoplay_delay: autoplayDelay,
            page_url: typeof window !== 'undefined' ? window.location.href : ''
          });
          observer.disconnect();
        }, 1000);
      } else {
        if (impressionTimerRef.current) {
          clearTimeout(impressionTimerRef.current);
        }
      }
    }, { threshold: 0.5 });
    
    observer.observe(node);
  }, [items.length, autoplayDelay]);

  if (!items || items.length === 0) return null;

  return (
    <div 
      ref={containerRef}
      className={cn("group relative w-full overflow-hidden !rounded-none shadow-sm transition-shadow hover:shadow-md", className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <Carousel
        setApi={setApi}
        plugins={[plugin.current]}
        className="w-full"
        opts={carouselOpts}
      >
        <CarouselContent className="-ml-0">
          {items.map((item, index) => (
            <CarouselItem 
              key={index} 
              className="pl-0 cursor-pointer"
              onClick={() => onItemClick?.(index)}
            >
              <div className={cn("relative w-full overflow-hidden", aspectRatio)}>
                {item}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {items.length > 1 && (
          <>
            {/* Arrows: Always visible on mobile, hover on desktop */}
            <div className="absolute inset-y-0 left-0 flex items-center px-2 md:px-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
              <CarouselPrevious className="relative left-0 h-10 w-10 md:h-12 md:w-12 border-none bg-white/30 backdrop-blur-md text-white hover:bg-white/50" />
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 md:px-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
              <CarouselNext className="relative right-0 h-10 w-10 md:h-12 md:w-12 border-none bg-white/30 backdrop-blur-md text-white hover:bg-white/50" />
            </div>

            {/* Progress Indicators */}
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 px-3 py-1.5 bg-black/20 backdrop-blur-sm rounded-full z-10">
              {scrollSnaps.map((_, index) => {
                const active = index === selectedIndex;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => api?.scrollTo(index)}
                    className="relative flex h-8 w-8 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
                    aria-label={`Ir para slide ${index + 1}`}
                    aria-current={active ? 'true' : undefined}
                  >
                    <span
                      className={cn(
                        'block h-[7px] rounded-full transition-all duration-300 ease-out',
                        active ? 'w-5 bg-white' : 'w-[7px] bg-white/40 hover:bg-white/60'
                      )}
                    />
                    {active && (
                      <motion.div
                        animate={controls}
                        className="absolute left-1.5 top-1/2 h-[7px] -translate-y-1/2 rounded-full bg-white/70"
                        style={{ width: "0%" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </Carousel>
    </div>
  );
}
