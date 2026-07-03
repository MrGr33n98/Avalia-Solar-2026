'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

const slides = [
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

const AUTOPLAY_INTERVAL = 6500;

export default function HowItWorks() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return undefined;

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, AUTOPLAY_INTERVAL);

    return () => window.clearInterval(timer);
  }, [isPaused]);

  const goToPrevious = () => {
    setActiveSlide((current) => (current - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setActiveSlide((current) => (current + 1) % slides.length);
  };

  const slide = slides[activeSlide];

  return (
    <section
      id="como-funciona"
      className="border-b border-slate-100 bg-white py-14 sm:py-20 lg:py-24"
      aria-labelledby="how-it-works-title"
    >
      <div
        className="mx-auto max-w-[1320px] px-5 sm:px-6 lg:px-8 xl:px-10"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={() => setIsPaused(false)}
      >
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.12fr)_minmax(360px,0.88fr)] lg:gap-16">
          <div className="relative min-w-0 overflow-hidden bg-slate-50">
            <div
              className="transition-transform duration-700 ease-out motion-reduce:transform-none motion-reduce:transition-none"
              style={{ transform: `scale(1.04) translateX(${(activeSlide - 1) * -1.5}%)` }}
            >
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
          </div>

          <div
            className="flex min-h-[360px] flex-col justify-center"
            role="region"
            aria-roledescription="carrossel"
            aria-label="Como o Avalia Solar ajuda na sua decisão"
          >
            <div key={activeSlide} className="animate-in fade-in slide-in-from-right-2 duration-500">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-700">
                {slide.eyebrow}
              </p>
              <h2
                id="how-it-works-title"
                className="mt-3 max-w-xl text-3xl font-black leading-[1.08] tracking-tight text-slate-950 sm:text-4xl lg:text-5xl"
              >
                {slide.title}
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                {slide.description}
              </p>
            </div>

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

            <div className="mt-10 flex items-center justify-between border-t border-slate-200 pt-5">
              <div className="flex items-center gap-2" aria-label={`Slide ${activeSlide + 1} de ${slides.length}`}>
                {slides.map((item, index) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => setActiveSlide(index)}
                    aria-label={`Mostrar slide ${index + 1}: ${item.title}`}
                    aria-current={index === activeSlide ? 'true' : undefined}
                    className={`h-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                      index === activeSlide ? 'w-8 bg-blue-600' : 'w-2 bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goToPrevious}
                  aria-label="Slide anterior"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={goToNext}
                  aria-label="Próximo slide"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
