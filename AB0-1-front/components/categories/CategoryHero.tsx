'use client';

import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { getFullImageUrl } from '@/utils/image';
import { ArrowRight, ChevronRight, Sparkles, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';

interface Subcategory {
  id: number;
  name: string;
  slug?: string;
  seo_url: string;
}

interface BannerData {
  id: number | string;
  image_url?: string | null;
  title?: string;
  link?: string | null;
  link_url?: string | null;
  sponsored?: boolean;
}

interface CategoryHeroProps {
  name: string;
  description?: string;
  bannerUrl?: string;
  parentCategory?: { name: string; slug: string };
  subcategories?: Subcategory[];
  banners?: BannerData[];
  onLeadClick?: () => void;
  onMethodologyClick?: () => void;
}

const FALLBACK_BANNER_SRC = '/images/banner-placeholder.svg';

export default function CategoryHero({
  name,
  description,
  bannerUrl,
  parentCategory,
  subcategories = [],
  banners = [],
  onLeadClick,
}: CategoryHeroProps) {
  const resolvedBannerUrl = bannerUrl ? getFullImageUrl(bannerUrl) : '';
  const heroDescription =
    description?.trim() ||
    `Compare empresas, avaliações e sinais de confiança para contratar ${name} com mais segurança.`;
  const bannerImageClass = getBannerImageClass(name);

  // Normaliza banners
  const validBanners = banners.map(b => ({
    ...b,
    image_url: b.image_url ? getFullImageUrl(b.image_url) : FALLBACK_BANNER_SRC
  })).filter(b => b.image_url);

  return (
    <section className="border-b border-slate-100 bg-white py-4 md:py-5">
      <div className="mx-auto max-w-[1280px] px-6">
        <nav className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 md:mb-4 md:text-[11px]">
          <Link href="/" className="transition-colors hover:text-blue-600">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 opacity-50" />
          <Link href="/categories" className="transition-colors hover:text-blue-600">
            Categorias
          </Link>
          {parentCategory && (
            <>
              <ChevronRight className="h-3 w-3 opacity-50" />
              <Link
                href={`/categories/${parentCategory.slug}`}
                className="transition-colors hover:text-blue-600"
              >
                {parentCategory.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-3 w-3 opacity-50" />
          <span className="text-slate-900">{name}</span>
        </nav>

        <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.45)]">
          <div className="absolute inset-0">
            {resolvedBannerUrl ? (
              <OptimizedImage
                src={resolvedBannerUrl}
                alt={name}
                fill
                priority
                quality={92}
                sizes="(max-width: 768px) 100vw, 1280px"
                className={bannerImageClass}
                fallbackSrc="/images/default-banner.svg"
              />
            ) : (
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.35),_transparent_30%),linear-gradient(120deg,_#0f172a,_#1e293b_55%,_#111827)]" />
            )}
          </div>

          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/64 via-black/20 to-transparent" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 sm:p-5 md:p-5 lg:p-6 gap-6 min-h-[184px] sm:min-h-[205px] md:min-h-[214px] lg:min-h-[228px]">
            {/* Left Column: Category Content */}
            <div className="flex flex-col justify-between h-full w-full lg:w-[55%] xl:w-[60%]">
              <div className="max-w-[38rem]">
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/90 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-slate-950 sm:px-2.5 sm:text-[9px]">
                    <Sparkles className="h-2.5 w-2.5" />
                    Guia {new Date().getFullYear()}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-amber-400/90 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-slate-950 sm:px-2.5 sm:text-[9px]">
                    Categoria estratégica
                  </span>
                </div>

                <h1 className="max-w-3xl text-[1.1rem] font-black tracking-[-0.05em] text-white drop-shadow-md sm:text-[1.35rem] md:text-[1.7rem] lg:text-[1.95rem]">
                  {name}
                </h1>

                <p className="mt-2 max-w-[30rem] text-[10px] font-medium leading-relaxed text-slate-200/95 drop-shadow-sm sm:text-[11px] md:text-[12px]">
                  {heroDescription}
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  onClick={onLeadClick}
                  size="lg"
                  className="h-9 rounded-lg bg-emerald-500 px-4 text-[10px] font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-emerald-950/20 transition-all hover:bg-emerald-400 sm:h-10 sm:px-5 sm:text-[11px]"
                >
                  Solicitar orçamento
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Right Column: Sponsored Content */}
            {validBanners.length > 0 && (
              <div className="w-full lg:w-[45%] xl:w-[40%] flex justify-end">
                <div className="w-full max-w-[420px] rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-2 sm:p-3 shadow-2xl">
                  <div className="mb-2 flex items-center justify-between px-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/80">
                      Patrocinado
                    </span>
                    <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>
                  
                  <Carousel
                    plugins={[Autoplay({ delay: 5000, stopOnInteraction: true })]}
                    opts={{ loop: true }}
                    className="w-full"
                  >
                    <CarouselContent>
                      {validBanners.map((banner, idx) => (
                        <CarouselItem key={banner.id || idx}>
                          <Link 
                            href={banner.link_url || banner.link || '#'} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="group block relative w-full aspect-[21/9] sm:aspect-[21/8] overflow-hidden rounded-xl bg-slate-900"
                          >
                            <Image
                              src={banner.image_url!}
                              alt={banner.title || 'Patrocinador'}
                              fill
                              sizes="(max-width: 640px) 100vw, 420px"
                              className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                              <span className="text-white font-bold text-sm sm:text-base drop-shadow-md line-clamp-1">
                                {banner.title || 'Visitar parceiro'}
                              </span>
                              <div className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white transition-colors group-hover:bg-blue-500">
                                <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              </div>
                            </div>
                          </Link>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                </div>
              </div>
            )}
          </div>
        </div>

        {subcategories.length > 0 && (
          <div className="mt-3 flex flex-col gap-2.5 lg:flex-row lg:items-center">
            <span className="whitespace-nowrap text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
              Explorar nichos
            </span>
            <div className="flex flex-wrap gap-2">
              {subcategories.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/categories/${sub.seo_url || sub.slug}`}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function getBannerImageClass(name: string) {
  const normalized = name.toLowerCase();

  if (normalized.includes('mobilidade') || normalized.includes('elétrica')) {
    return 'object-cover object-[center_60%] sm:object-[center_56%] lg:object-[center_54%]';
  }

  if (normalized.includes('solar')) {
    return 'object-cover object-[center_46%] sm:object-[center_48%] lg:object-[center_50%]';
  }

  return 'object-cover object-center';
}
