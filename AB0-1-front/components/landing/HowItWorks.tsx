'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Autoplay from 'embla-carousel-autoplay';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselIndicators,
} from '@/components/ui/carousel';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const SLIDES = [
  {
    eyebrow: 'Escolha com confiança',
    title: 'Compare antes de decidir.',
    description:
      'Coloque empresas lado a lado e avalie reputação, verificação, cobertura e avaliações reais usando os mesmos critérios.',
  },
  {
    eyebrow: 'Experiências reais',
    title: 'Decida com a ajuda de quem já contratou.',
    description:
      'Consulte avaliações publicadas na plataforma e entenda os sinais disponíveis antes de solicitar uma proposta.',
  },
  {
    eyebrow: 'Dados transparentes',
    title: 'Transforme pesquisa em uma shortlist melhor.',
    description:
      'Reúna as empresas que fazem sentido para o seu projeto e veja diferenças importantes em uma única análise.',
  },
] as const;

const AUTOPLAY_INTERVAL_MS = 6500;

export default function HowItWorks() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isPaused, setIsPaused] = React.useState(false);

  const plugin = React.useRef(
    Autoplay({
      delay: AUTOPLAY_INTERVAL_MS,
      playOnInit: false,
      stopOnInteraction: true,
      stopOnMouseEnter: true,
    })
  );

  return (
    <section
      id="como-funciona"
      className="border-b border-slate-100 bg-transparent py-14 sm:py-20 lg:py-24"
      aria-label="Como o Avalia Solar ajuda na sua decisão"
    >
      <div className="mx-auto max-w-[1320px] px-5 sm:px-6 lg:px-8 xl:px-10">
        <Carousel
          plugins={prefersReducedMotion || isPaused ? undefined : [plugin.current]}
          opts={{ loop: true, align: 'start' }}
          className="w-full"
          aria-label="Como o Avalia Solar ajuda na sua decisão"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <CarouselContent className="ml-0">
            {SLIDES.map((slide) => (
              <CarouselItem key={slide.title} className="pl-0 basis-full">
                <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.12fr)_minmax(360px,0.88fr)] lg:gap-16">
                  <div className="relative min-w-0 overflow-hidden rounded-2xl bg-slate-50 lg:rounded-none">
                    <Image
                      src="/images/depoimentos-avalia-solar.png"
                      alt="Depoimentos de usuários que pesquisaram e compararam empresas no Avalia Solar"
                      width={1536}
                      height={1024}
                      sizes="(max-width: 1023px) 100vw, 58vw"
                      className="h-auto w-full object-contain"
                      priority={false}
                    />
                  </div>

                  <div className="flex min-h-[360px] flex-col justify-center">
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-700">
                      {slide.eyebrow}
                    </p>
                    <h2 className="mt-3 max-w-xl text-3xl font-black leading-[1.08] tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                      {slide.title}
                    </h2>
                    <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                      {slide.description}
                    </p>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Link
                        href="/compare"
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-6 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      >
                        Comparar empresas
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                      <Link
                        href="/companies"
                        className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      >
                        Explorar empresas
                      </Link>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          <div className="mt-10 flex items-center justify-between border-t border-slate-200 pt-5">
            <CarouselIndicators />
            <div className="flex items-center gap-2">
              <CarouselPrevious className="relative left-0 top-0 translate-y-0 h-9 w-9 rounded-md border-slate-300 bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700" />
              <CarouselNext className="relative right-0 top-0 translate-y-0 h-9 w-9 rounded-md border-slate-300 bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700" />
            </div>
          </div>
        </Carousel>
      </div>
    </section>
  );
}
