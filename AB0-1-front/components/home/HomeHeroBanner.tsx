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
  // Fallback institucional com 3 slides quando nenhum banner estiver cadastrado no ActiveAdmin
  const institutionalFallbackBanners: Banner[] = React.useMemo(
    () => [
      {
        id: 9991,
        title: headline,
        link: ctaHref,
        image_url: imageSrc,
        active: true,
        position: 'home_top',
      },
      {
        id: 9992,
        title: 'Calcule a economia solar para sua casa ou empresa',
        link: '/calculadora',
        image_url: imageSrc,
        active: true,
        position: 'home_top',
      },
      {
        id: 9993,
        title: 'Compare instaladores solares com selo de verificação',
        link: '/companies',
        image_url: imageSrc,
        active: true,
        position: 'home_top',
      },
    ],
    [headline, ctaHref, imageSrc]
  );

  // Filtrar apenas banners válidos com imagem; usar fallback institucional se vazio
  const activeBanners = React.useMemo(() => {
    const valid = (banners || []).filter((b) => Boolean(b.image_url));
    return valid.length > 0 ? valid : institutionalFallbackBanners;
  }, [banners, institutionalFallbackBanners]);

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

  const currentBanner = activeBanners[currentIndex] || activeBanners[0];
  const bannerLink = currentBanner.link || ctaHref;
  const bannerTitle = currentBanner.title || headline;
  const bannerImage = currentBanner.image_url || imageSrc;

  // Subtítulo e texto do botão customizados para os slides institucionais padrão
  const currentSubtitle =
    currentBanner.id === 9992
      ? 'Calcule a potência ideal e receba estimativas reais para o seu imóvel.'
      : currentBanner.id === 9993
      ? 'Consulte selos de verificação e notas de clientes reais antes de contratar.'
      : subheadline;

  const currentCtaText =
    currentBanner.id === 9992
      ? 'Simular economia'
      : currentBanner.id === 9993
      ? 'Ver catálogo'
      : ctaText;

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
              alt={bannerTitle || 'Banner promocional'}
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
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-tight tracking-tight">
                {bannerTitle}
              </h1>
              {currentSubtitle && (
                <p className="mt-2 text-xs sm:text-sm text-slate-200 line-clamp-2 leading-relaxed">
                  {currentSubtitle}
                </p>
              )}

              <div className="mt-4 flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-950 shadow-sm transition-all hover:bg-amber-300 active:scale-95">
                  <span>{currentCtaText}</span>
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

          {/* Barras de navegação segmentadas (estilo OLX) com touch target acessível de 48px */}
          {hasMultipleBanners && (
            <div
              aria-label="Navegação dos banners"
              className="absolute bottom-0 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0 bg-transparent md:bottom-3 md:gap-2 md:rounded-full md:bg-black/25 md:px-2.5 md:py-1 md:backdrop-blur-xs"
            >
              {activeBanners.map((banner, index) => (
                <button
                  key={banner.id ?? index}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Ir para banner ${index + 1}`}
                  aria-pressed={currentIndex === index}
                  className="flex h-12 w-12 min-h-12 min-w-12 items-center justify-center bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-blue-600"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'block h-[4px] w-[34px] rounded-full transition-colors duration-200',
                      currentIndex === index ? 'bg-blue-600' : 'bg-white/75'
                    )}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HomeHeroBanner;
