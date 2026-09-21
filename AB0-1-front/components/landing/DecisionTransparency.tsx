'use client';

import * as React from 'react';
import Image from 'next/image';
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
import { useScrollDrivenFrames } from '@/hooks/useScrollDrivenFrames';

const FEATURES = [
  {
    title: 'Energia limpa e inteligente',
    description: 'Conectamos você às melhores empresas de energia solar e mobilidade elétrica.',
    image: '/assets/energia-limpa-inteligente.png',
  },
  {
    title: 'Empresas verificadas',
    description: 'Compare fornecedores com dados, reputação e área de atendimento validados.',
    image: '/assets/empresas-verificadas.png',
  },
  {
    title: 'Mobilidade elétrica na prática',
    description: 'Encontre empresas para wallbox, carregadores, frotas e infraestrutura de recarga.',
    image: '/assets/mobilidade-eletrica-na-pratica.png',
  },
  {
    title: 'Energia solar para sua casa',
    description: 'Veja instaladores, avaliações e soluções solares para reduzir sua conta de luz.',
    image: '/assets/energia-solar-para-sua-casa.png',
  },
  {
    title: 'Soluções para empresas',
    description: 'Compare projetos comerciais, industriais, baterias, manutenção e atendimento especializado.',
    image: '/assets/solucoes-para-empresas.png',
  },
  {
    title: 'Decisão com mais segurança',
    description: 'Use avaliações reais, critérios claros e comparações para escolher melhor antes de contratar.',
    image: '/assets/decisao-com-mais-seguranca.png',
  },
];

export default function DecisionTransparency() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const canvasEnabled = !prefersReducedMotion;

  const { canvasRef, hasRenderedValidFrame } = useScrollDrivenFrames({
    totalFrames: 120,
    enabled: canvasEnabled,
    framesPathDesktop: '/videos/o-conceito-expositor-flutuante-frames',
    framesPathMobile: '/videos/o-conceito-expositor-flutuante-frames-mobile',
    canvasWidthDesktop: 1280,
    canvasHeightDesktop: 720,
    canvasWidthMobile: 800,
    canvasHeightMobile: 450,
    smoothingDesktop: 0.22,
    smoothingMobile: 0.18,
    travelRef: null,
    preloadReadyThreshold: 0.25,
    autoPlay: canvasEnabled
      ? {
          enabled: true,
          durationMs: 10000,
          direction: 'pingpong',
          pauseOnScroll: false,
          pauseOnHover: true,
          resumeIdleAfterMs: 0,
        }
      : undefined,
  });

  const plugin = React.useRef(
    Autoplay({
      delay: 6000,
      stopOnInteraction: true,
      stopOnMouseEnter: true,
    })
  );

  return (
    <section className="bg-transparent py-14 md:py-20 border-b border-slate-100">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-12">
          <div className="lg:col-span-7 space-y-4">
            <span className="text-[11px] font-extrabold tracking-[0.2em] text-blue-700 uppercase">
              Decisão com transparência
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-[42px] font-bold tracking-[-0.025em] text-slate-900 leading-[1.1]">
              Encontre as melhores empresas para energia solar e mobilidade elétrica
            </h2>
            <p className="text-sm md:text-base text-slate-500 font-medium max-w-2xl leading-relaxed">
              Compare empresas, veja avaliações reais e escolha com segurança a solução ideal para o seu projeto ou veículo.
            </p>
          </div>

          <div className="lg:col-span-5 flex flex-col items-center">
            <div
              className="relative w-full aspect-[4/3] sm:aspect-[1.6/1] lg:aspect-[1.3/1] rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(15,23,42,0.04)] border border-slate-100/80 bg-white"
              style={{
                WebkitMaskImage:
                  'linear-gradient(to right, rgba(0,0,0,0) 0%, #000 2%, #000 98%, rgba(0,0,0,0) 100%), linear-gradient(to bottom, #000 0%, #000 92%, rgba(0,0,0,0.6) 96%, rgba(0,0,0,0) 100%)',
                WebkitMaskComposite: 'source-in',
                maskImage:
                  'linear-gradient(to right, rgba(0,0,0,0) 0%, #000 2%, #000 98%, rgba(0,0,0,0) 100%), linear-gradient(to bottom, #000 0%, #000 92%, rgba(0,0,0,0.6) 96%, rgba(0,0,0,0) 100%)',
                maskComposite: 'intersect',
              }}
            >
              {prefersReducedMotion ? (
                <video
                  muted
                  playsInline
                  loop
                  autoPlay
                  preload="auto"
                  aria-label="Animação expositor flutuante"
                  className="absolute inset-0 w-full h-full object-contain bg-white"
                >
                  <source src="/videos/O_Conceito_O_Expositor_Flutu.mp4" type="video/mp4" />
                </video>
              ) : (
                <>
                  <Image
                    src="/images/decision-transparency-fallback.webp"
                    alt="Encontre as melhores empresas de energia solar e mobilidade elétrica no Brasil"
                    fill
                    sizes="(max-width: 768px) 100vw, 40vw"
                    priority
                    className={
                      'object-cover transition-opacity duration-500 ease-out ' +
                      (hasRenderedValidFrame ? 'opacity-0 pointer-events-none' : 'opacity-100')
                    }
                  />
                  <canvas
                    ref={canvasRef}
                    width={1280}
                    height={720}
                    aria-hidden={!hasRenderedValidFrame}
                    className={
                      'absolute inset-0 w-full h-full object-cover block transition-opacity duration-500 ease-out ' +
                      (hasRenderedValidFrame ? 'opacity-100' : 'opacity-0 pointer-events-none')
                    }
                    style={{ imageRendering: 'auto' }}
                  />
                </>
              )}

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-[9%]"
                style={{
                  background:
                    'linear-gradient(to top, rgba(248,251,255,0.42) 0%, rgba(248,251,255,0) 100%)',
                }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 w-[11%]"
                style={{
                  background:
                    'linear-gradient(to right, rgba(248,251,255,0.28) 0%, rgba(248,251,255,0) 100%)',
                }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-0 w-[5%]"
                style={{
                  background:
                    'linear-gradient(to left, rgba(248,251,255,0.22) 0%, rgba(248,251,255,0) 100%)',
                }}
              />
            </div>
          </div>
        </div>

        <div
          aria-roledescription="carrossel"
          aria-label="Benefícios da plataforma"
        >
          <Carousel
            plugins={prefersReducedMotion ? undefined : [plugin.current]}
            opts={{ loop: true, align: 'start' }}
            className="overflow-hidden rounded-none border border-slate-200 bg-white"
          >
            <CarouselContent className="ml-0">
              {FEATURES.map((feature, index) => (
                <CarouselItem key={feature.title} className="pl-0 basis-full">
                  <article className="grid min-h-[190px] sm:grid-cols-[46%_1fr] lg:min-h-[300px] lg:grid-cols-[55%_1fr]">
                    <div className="relative min-h-[180px] border-b border-slate-200 sm:min-h-full sm:border-b-0 sm:border-r">
                      <Image
                        src={feature.image}
                        alt={feature.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 55vw"
                        className="object-cover"
                      />
                    </div>

                    <div className="flex min-w-0 flex-col justify-between p-5 sm:p-6 lg:p-10">
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600 sm:text-xs">
                            Benefício {index + 1} de {FEATURES.length}
                          </p>
                          <div className="flex shrink-0 gap-2">
                            <CarouselPrevious className="relative left-0 top-0 translate-y-0 h-9 w-9 rounded-md border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 hover:text-blue-600" />
                            <CarouselNext className="relative right-0 top-0 translate-y-0 h-9 w-9 rounded-md border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 hover:text-blue-600" />
                          </div>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold leading-tight tracking-tight text-slate-950 sm:text-xl lg:text-3xl">{feature.title}</h3>
                        <p className="mt-3 text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6 lg:text-base">{feature.description}</p>
                      </div>

                      <CarouselIndicators className="mt-5 justify-start" />
                    </div>
                  </article>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

      </div>
    </section>
  );
}
