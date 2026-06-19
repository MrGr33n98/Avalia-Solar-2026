'use client';

import { OptimizedImage } from '@/components/ui/optimized-image';
import { getFullImageUrl } from '@/utils/image';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

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
}

const FALLBACK_BANNER_SRC = '/images/banner-placeholder.svg';
const CATEGORY_BANNER_SRC = '/images/avalia-solar.banner-place-holder.png';

export default function CategoryHero({
  name,
  description,
  bannerUrl,
  parentCategory,
}: CategoryHeroProps) {
  const resolvedBannerUrl = bannerUrl ? getFullImageUrl(bannerUrl) : CATEGORY_BANNER_SRC;
  const heroDescription =
    description?.trim() ||
    `Compare empresas, avaliações e sinais de confiança para contratar ${name} com mais segurança.`;
  const visualUrl = resolvedBannerUrl || FALLBACK_BANNER_SRC;

  return (
    <section className="bg-white pb-3 pt-4 md:pb-5 md:pt-5">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <nav className="mb-4 flex items-center gap-2 overflow-x-auto whitespace-nowrap text-[12px] font-semibold text-slate-500 md:text-sm">
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

        <div className="relative h-16 overflow-hidden rounded-none border border-slate-200 bg-slate-950 shadow-[0_18px_48px_-30px_rgba(15,23,42,0.45)] sm:h-20 md:h-32 lg:h-64">
          <div className="absolute inset-0">
            {visualUrl ? (
              <OptimizedImage
                src={visualUrl}
                alt={name}
                fill
                priority
                quality={92}
                sizes="(max-width: 768px) 100vw, 1280px"
                className="h-full w-full object-cover object-center"
                fallbackSrc="/images/default-banner.svg"
              />
            ) : (
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.35),_transparent_30%),linear-gradient(120deg,_#0f172a,_#1e293b_55%,_#111827)]" />
            )}
          </div>

          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/22 via-transparent to-slate-950/10" />
        </div>

        <div className="pb-1 pt-3 sm:pt-4 md:pb-2 md:pt-5">
          <div className="max-w-[46rem]">
            <h1 className="line-clamp-2 text-[1.45rem] font-black leading-tight text-slate-950 sm:text-[1.8rem] md:text-[2.2rem]">
              {name}
            </h1>

            <p className="mt-1.5 line-clamp-2 max-w-[38rem] text-sm font-medium leading-relaxed text-slate-600 md:text-[15px]">
              {heroDescription}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
