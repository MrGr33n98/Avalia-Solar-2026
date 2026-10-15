'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HomeHeroBannerProps {
  className?: string;
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  ctaHref?: string;
  imageSrc?: string;
}

export function HomeHeroBanner({
  className,
  headline = 'Encontre empresas solares confiáveis na sua região',
  subheadline = 'Compare empresas, avaliações e solicite propostas para seu projeto.',
  ctaText = 'Ver empresas',
  ctaHref = '/companies',
  imageSrc = '/images/herro-banner-avalia-solar.webp',
}: HomeHeroBannerProps) {
  return (
    <div className={cn('px-4 py-2 w-full', className)}>
      <div className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-slate-800/10 shadow-md">
        {/* Imagem de Fundo Fotográfica Otimizada */}
        <div className="relative h-[210px] sm:h-[240px] md:h-[280px] w-full">
          <Image
            src={imageSrc}
            alt="Instalação de energia solar residencial confiável"
            fill
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
            className="object-cover object-center"
          />

          {/* Gradiente escuro para legibilidade e contraste de leitura */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-transparent"
          />

          {/* Conteúdo Institucional */}
          <div className="absolute inset-0 flex flex-col justify-center px-5 sm:px-8 md:px-10 max-w-lg z-10">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-tight tracking-tight">
              {headline}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-200 line-clamp-2 leading-relaxed">
              {subheadline}
            </p>

            <div className="mt-4 flex items-center gap-3">
              <Link
                href={ctaHref}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-950 shadow-sm transition-all hover:bg-amber-300 hover:shadow active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <span>{ctaText}</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Dots indicadores de paginação sutis */}
          <div
            aria-hidden="true"
            className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10"
          >
            <span className="h-1.5 w-6 rounded-full bg-amber-400" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeHeroBanner;
