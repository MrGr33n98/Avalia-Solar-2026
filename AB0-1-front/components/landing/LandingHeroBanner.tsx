'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Autoplay from 'embla-carousel-autoplay';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { useBanners } from '@/hooks/useBanners';
import { openQuoteWizard } from '@/lib/quote-wizard';
import { cn } from '@/lib/utils';
import { getFullImageUrl } from '@/utils/image';

type LandingHeroBannerProps = {
  position?: string;
  className?: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaSource?: string;
};

type Slide = {
  id: number | string;
  title?: string;
  link?: string;
  imageSrc: string;
  width?: number | null;
  height?: number | null;
};

function resolveImageSrc(imageUrl?: string | null): string | null {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  const trimmed = imageUrl.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('/images/')) return trimmed;
  return getFullImageUrl(trimmed);
}

function isValidNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n > 0;
}

export default function LandingHeroBanner({
  position = 'home_top',
  className,
  title = 'Orçamento Grátis e Rápido',
  subtitle = 'Compare preços e escolha a melhor empresa solar.',
  ctaLabel = 'Fazer orçamento grátis',
  ctaSource = 'home-hero',
}: LandingHeroBannerProps) {
  const { banners, loading, error } = useBanners({ position, limit: 5 });
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [snapCount, setSnapCount] = useState(0);

  const slides = useMemo<Slide[]>(() => {
    const normalized = (banners || [])
      .map((b) => ({
        id: b.id,
        title: b.title,
        link: b.link,
        imageSrc: resolveImageSrc(b.image_url) || '',
        width: b.width ?? null,
        height: b.height ?? null,
      }))
      .filter((s) => Boolean(s.imageSrc));

    if (normalized.length > 0) return normalized;

    return [
      {
        id: 'fallback',
        title,
        link: undefined,
        imageSrc: '/images/herro-banner-avalia-solar.png',
        width: null,
        height: null,
      },
    ];
  }, [banners, title]);

  useEffect(() => {
    if (!api) return;

    const update = () => {
      setSelectedIndex(api.selectedScrollSnap());
      setSnapCount(api.scrollSnapList().length);
    };

    update();
    api.on('reInit', update);
    api.on('select', update);

    return () => {
      api.off('reInit', update);
      api.off('select', update);
    };
  }, [api]);

  return (
    <section className={cn('px-4 md:px-6 pt-4 md:pt-5', className)}>
      <div className="container mx-auto">
        <Carousel
          setApi={setApi}
          plugins={[Autoplay({ delay: 6000, stopOnInteraction: true })]}
          opts={{ loop: slides.length > 1 }}
          className="w-full"
        >
          <CarouselContent className="-ml-0">
            {slides.map((slide, index) => {
              const hasNativeRatio = isValidNumber(slide.width) && isValidNumber(slide.height);
              const aspectRatioStyle = hasNativeRatio
                ? ({ aspectRatio: `${slide.width} / ${slide.height}` } as const)
                : undefined;

              return (
                <CarouselItem key={slide.id} className="pl-0">
                  <Card className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm w-full">
                    {/* Wrapper: no mobile vira "imagem + card texto", no desktop vira "overlay" */}
                    <CardContent className="p-0">
                      {/* ====== HERO VISUAL ====== */}
                      <div
                        className={cn(
                          'relative w-full',
                          // Mobile: um pouco mais alto pra ficar bonito e não cortar rosto
                          'aspect-[16/10] sm:aspect-[16/9]',
                          // Desktop: wide startup
                          'md:aspect-[3/1]'
                        )}
                        style={aspectRatioStyle}
                      >
                        <Image
                          src={slide.imageSrc}
                          alt={slide.title || title}
                          fill
                          priority={index === 0}
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
                          className={cn(
                            'object-cover',
                            // Mobile: prioriza centro/um pouco acima pra não cortar
                            'object-[60%_35%]',
                            // Desktop: desloca um pouco pra direita (evita cortar assunto)
                            'md:object-[70%_40%]'
                          )}
                        />

                        {/* Desktop overlay (premium) */}
                        <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-white/80 via-white/25 to-transparent" />
                        <div className="hidden md:block absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/10 to-transparent" />

                        {/* Desktop content overlay */}
                        <div className="hidden md:flex absolute inset-0 items-center">
                          <div className="pl-6 lg:pl-10 pr-6 max-w-[560px]">
                            <div className="rounded-2xl bg-white/55 backdrop-blur-md border border-white/60 shadow-sm p-5 lg:p-6">
                              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
                                {title}
                              </h1>
                              <p className="mt-2 text-slate-700 text-base lg:text-lg">
                                {subtitle}
                              </p>
                              <div className="mt-4 flex items-center gap-3">
                                <Button
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                                  onClick={() => openQuoteWizard({ source: ctaSource })}
                                >
                                  {ctaLabel} <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ====== MOBILE CONTENT (abaixo da imagem) ====== */}
                      <div className="md:hidden p-4">
                        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
                          <h1 className="text-xl font-bold tracking-tight text-slate-900">
                            {title}
                          </h1>
                          <p className="mt-1 text-slate-600 text-sm">
                            {subtitle}
                          </p>

                          <div className="mt-3">
                            <Button
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                              onClick={() => openQuoteWizard({ source: ctaSource })}
                            >
                              {ctaLabel} <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              );
            })}
          </CarouselContent>

          {slides.length > 1 ? (
            <>
              <CarouselPrevious
                className="left-3 md:left-4 bg-white/90 hover:bg-white border border-gray-200 shadow-sm"
                aria-label="Banner anterior"
              />
              <CarouselNext
                className="right-3 md:right-4 bg-white/90 hover:bg-white border border-gray-200 shadow-sm"
                aria-label="Próximo banner"
              />
            </>
          ) : null}

          {snapCount > 1 ? (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
              {Array.from({ length: snapCount }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => api?.scrollTo(idx)}
                  className={cn(
                    'h-1.5 w-8 rounded-full transition-colors',
                    idx === selectedIndex ? 'bg-blue-600' : 'bg-blue-200/70 hover:bg-blue-300'
                  )}
                  aria-label={`Ir para o banner ${idx + 1}`}
                  aria-current={idx === selectedIndex}
                />
              ))}
            </div>
          ) : null}

          {!loading && error ? (
            <p className="mt-2 text-xs text-gray-500">
              Não foi possível carregar os banners agora. Exibindo imagem padrão.
            </p>
          ) : null}
        </Carousel>
      </div>
    </section>
  );
}
