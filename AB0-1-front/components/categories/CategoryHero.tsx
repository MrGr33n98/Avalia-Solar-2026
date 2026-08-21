'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { ChevronRight } from 'lucide-react';
import { getFullImageUrl } from '@/utils/image';
import { CategoryMotionIcon } from './CategoryMotionIcon';

// LCP OPTIMIZATION P0: PremiumBannerCarousel carregado de forma lazy (dynamic import).
// O banner hero (LCP candidate) é renderizado diretamente como <Image priority> antes
// do carrossel ser hidratado. Isso elimina o delay causado pela hidratação de
// framer-motion + embla-carousel no critical path do LCP.
const PremiumBannerCarousel = dynamic(
  () => import('@/components/PremiumBannerCarousel').then((m) => ({ default: m.PremiumBannerCarousel })),
  { ssr: false }
);

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
  bannerUrl?: string | null;
  parentCategory?: { name: string; slug?: string; seo_url?: string } | null;
  subcategories?: Subcategory[];
  banners?: BannerData[];
  onLeadClick?: () => void;
  onMethodologyClick?: () => void;
  slug?: string | null;
}

const FALLBACK_BANNER_SRC = '/images/banner-placeholder.svg';
const CATEGORY_BANNER_SRC = '/images/avalia-solar.banner-place-holder.png';

export default function CategoryHero({
  name,
  description,
  bannerUrl,
  parentCategory,
  banners = [],
  slug,
}: CategoryHeroProps) {
  const resolvedCategoryBanner = bannerUrl ? getFullImageUrl(bannerUrl) : CATEGORY_BANNER_SRC;
  const displayTitle = name;
  const heroDescription = description || '';

  // Banners patrocinados para o carrossel lazy (excluindo o hero principal)
  const sponsoredItems = React.useMemo(() => {
    return banners.map((b) => {
      const bannerSrc = b.image_url ? getFullImageUrl(b.image_url) : FALLBACK_BANNER_SRC;
      const targetUrl = b.link_url || b.link;

      const content = (
        <div className="relative w-full h-full bg-slate-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bannerSrc}
            alt={b.title || 'Banner Patrocinado'}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-contain"
          />
          {b.sponsored !== false && (
            <span className="absolute bottom-2 right-2 z-10 rounded-none bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              Patrocinado
            </span>
          )}
        </div>
      );

      return (
        <div key={`sponsored-${b.id}`} className="relative w-full h-full">
          {targetUrl ? (
            <a href={targetUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
              {content}
            </a>
          ) : (
            content
          )}
        </div>
      );
    });
  }, [banners]);

  // Aspect ratio idêntico ao PremiumBannerCarousel para evitar CLS
  const aspectRatioCls = 'aspect-[12/3] sm:aspect-[16/3.2] md:aspect-[20/3.2]';

  return (
    <section className="bg-white pb-2 pt-3 md:pb-4 md:pt-4">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <nav className="mb-3 flex items-center gap-2 overflow-x-auto whitespace-nowrap text-[12px] font-semibold text-slate-500 md:text-sm">
          <Link href="/" className="transition-colors hover:text-blue-600">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 opacity-50" />
          <Link href="/categories" className="transition-colors hover:text-blue-600">
            Empresas
          </Link>
          {parentCategory && (
            <>
              <ChevronRight className="h-3 w-3 opacity-50" />
              <Link
                href={`/categories/${parentCategory.seo_url || parentCategory.slug}`}
                className="transition-colors hover:text-blue-600"
              >
                {parentCategory.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-3 w-3 opacity-50" />
          <span className="font-bold text-slate-950">{name}</span>
        </nav>

        <div className="w-full">
          <div className={`overflow-hidden border border-slate-200 bg-slate-950 shadow-sm relative ${aspectRatioCls}`}>
            {/* 
              LCP ELEMENT — renderizado diretamente (sem carrossel) para garantir
              que o browser receba priority + fetchPriority="high" imediatamente.
              O carrossel patrocinado (lazy) monta DEPOIS da hidratação.
            */}
            {banners.length === 0 ? (
              // Sem banners patrocinados: banner hero estático direto
              <Image
                src={resolvedCategoryBanner || FALLBACK_BANNER_SRC}
                alt={name}
                fill
                priority
                fetchPriority="high"
                quality={90}
                sizes="(max-width: 768px) 100vw, 1280px"
                className="object-contain"
              />
            ) : (
              // Com banners patrocinados: carrossel lazy que inclui o hero como primeiro item
              <PremiumBannerCarousel
                items={[
                  // Primeiro item: banner hero com priority (LCP)
                  <div key="category-default-hero" className="relative w-full h-full bg-slate-950">
                    <Image
                      src={resolvedCategoryBanner || FALLBACK_BANNER_SRC}
                      alt={name}
                      fill
                      priority
                      fetchPriority="high"
                      quality={90}
                      sizes="(max-width: 768px) 100vw, 1280px"
                      className="object-contain"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/20 via-transparent to-slate-950/10" />
                  </div>,
                  ...sponsoredItems,
                ]}
                aspectRatio={aspectRatioCls}
                autoplayDelay={5000}
              />
            )}
          </div>

          <div className="pb-1 pt-3 sm:pt-4 md:pb-2 md:pt-4 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <CategoryMotionIcon
              slug={slug}
              name={name}
              size="fill"
              motionMode="entrance"
              className="h-16 w-16 sm:h-24 sm:w-24 shrink-0 rounded-2xl border border-slate-100 bg-slate-50 shadow-sm p-1"
            />
            <div className="max-w-[46rem] min-w-0">
              <h1 className="line-clamp-2 text-[1.45rem] font-black leading-tight text-slate-950 sm:text-[1.8rem] md:text-[2.2rem]">
                {displayTitle}
              </h1>

              <p className="mt-1.5 line-clamp-2 max-w-[38rem] text-sm font-medium leading-relaxed text-slate-600 md:text-[15px]">
                {heroDescription}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
