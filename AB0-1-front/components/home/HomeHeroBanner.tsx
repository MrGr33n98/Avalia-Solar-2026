'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Banner } from '@/lib/api';

interface HomeHeroBannerProps {
  banners?: Banner[];
  className?: string;
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  ctaHref?: string;
  imageSrc?: string;
}

export function HomeHeroBanner({
  banners = [],
  className,
  headline = 'Encontre empresas solares confiáveis na sua região',
  subheadline = 'Compare empresas, avaliações e solicite propostas para seu projeto.',
  ctaText = 'Ver empresas',
  ctaHref = '/companies',
  imageSrc = '/images/herro-banner-avalia-solar.webp',
}: HomeHeroBannerProps) {
  // Filtrar apenas banners válidos com imagem
  const activeBanners = React.useMemo(() => {
    return (banners || []).filter((b) => Boolean(b.image_url));
  }, [banners]);

  const hasMultipleBanners = activeBanners.length > 1;
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const touchStartXRef = React.useRef<number | null>(null);

  // Troca automática suave apenas quando houver mais de 1 banner
  React.useEffect(() => {
    if (!hasMultipleBanners) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [hasMultipleBanners, activeBanners.length]);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || !hasMultipleBanners) return;
    const diff = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Swipe para a direita -> anterior
        setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
      } else {
        // Swipe para a esquerda -> próximo
        setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
      }
    }
    touchStartXRef.current = null;
  };

  // 1. Caso haja banners configurados via ActiveAdmin
  if (activeBanners.length > 0) {
    const currentBanner = activeBanners[currentIndex];
    const bannerLink = currentBanner.link || ctaHref;
    const bannerTitle = currentBanner.title || headline;
    const bannerImage = currentBanner.image_url || imageSrc;

    return (
      <div className={cn('px-4 py-2 w-full select-none', className)}>
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-slate-800/10 shadow-md group"
        >
          <div className="relative h-[210px] sm:h-[240px] md:h-[280px] w-full">
            <Link href={bannerLink} className="block h-full w-full">
              <Image
                src={bannerImage}
                alt={currentBanner.alt_text || bannerTitle}
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.01]"
              />

              {/* Gradiente escuro para contraste e legibilidade de leitura */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/65 to-transparent"
              />

              <div className="absolute inset-0 flex flex-col justify-center px-5 sm:px-8 md:px-10 max-w-lg z-10">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-tight tracking-tight">
                  {bannerTitle}
                </h2>
                {subheadline && (
                  <p className="mt-2 text-xs sm:text-sm text-slate-200 line-clamp-2 leading-relaxed">
                    {subheadline}
                  </p>
                )}

                <div className="mt-4 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-950 shadow-sm transition-all hover:bg-amber-300 active:scale-95">
                    <span>{ctaText}</span>
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </Link>

            {/* Setas de navegação quando houver múltiplos banners */}
            {hasMultipleBanners && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Banner anterior"
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/70 active:scale-95"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Próximo banner"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/70 active:scale-95"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Dots reais: exibidos SOMENTE se houver mais de 1 banner ativo */}
            {hasMultipleBanners && (
              <div
                aria-label="Paginação de banners"
                className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20"
              >
                {activeBanners.map((b, idx) => (
                  <button
                    key={b.id || idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Ir para banner ${idx + 1}`}
                    className={cn(
                      'transition-all duration-300 rounded-full',
                      currentIndex === idx
                        ? 'h-1.5 w-6 bg-amber-400'
                        : 'h-1.5 w-1.5 bg-white/60 hover:bg-white'
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. Fallback institucional oficial (sem dots falsos quando for 1 banner estático)
  return (
    <div className={cn('px-4 py-2 w-full select-none', className)}>
      <div className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-slate-800/10 shadow-md">
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

          {/* Sem dots falsos no fallback institucional */}
        </div>
      </div>
    </div>
  );
}

export default HomeHeroBanner;
