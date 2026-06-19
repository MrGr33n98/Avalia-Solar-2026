'use client';

import { OptimizedImage } from '@/components/ui/optimized-image';
import { getFullImageUrl } from '@/utils/image';
import { ChevronRight, ShieldCheck, Sparkles } from 'lucide-react';
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
  const bannerImageClass = getBannerImageClass(name);

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

        <div className="relative overflow-hidden rounded-none border border-slate-200 bg-slate-950 shadow-[0_18px_48px_-30px_rgba(15,23,42,0.45)]">
          <div className="absolute inset-0">
            {visualUrl ? (
              <OptimizedImage
                src={visualUrl}
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

          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-950/76 to-slate-950/28" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/58 via-black/18 to-black/8" />

          <div className="relative z-10 flex h-28 flex-col items-center justify-center gap-1.5 px-4 py-3 text-center sm:h-32 sm:gap-2 sm:px-6 md:h-36 lg:h-40">
            <div className="flex max-w-full flex-wrap items-center justify-center gap-1.5 sm:gap-2">
              <span className="inline-flex items-center gap-1 bg-amber-400 px-2 py-0.5 text-[9px] font-black uppercase tracking-tight text-slate-950 sm:px-2.5 sm:py-1 sm:text-[10px]">
                <Sparkles className="h-3 w-3" />
                Guia {new Date().getFullYear()}
              </span>
              <span className="inline-flex bg-amber-400 px-2 py-0.5 text-[9px] font-black uppercase tracking-tight text-slate-950 sm:px-2.5 sm:py-1 sm:text-[10px]">
                Categoria estratégica
              </span>
            </div>

            <h1 className="line-clamp-2 max-w-3xl text-[1.12rem] font-black uppercase leading-tight text-white drop-shadow-md sm:text-[1.35rem] md:text-[1.65rem] lg:text-[1.9rem]">
              {name}
            </h1>

            <p className="hidden max-w-[34rem] text-xs font-medium leading-snug text-slate-100 drop-shadow-sm sm:line-clamp-1 sm:block md:text-sm">
              {heroDescription}
            </p>

            <div className="hidden items-center gap-2 bg-white/10 px-2.5 py-1 text-white shadow-sm backdrop-blur-md md:inline-flex">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-emerald-500 text-white">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div className="text-left leading-tight">
                <p className="text-[11px] font-black">Empresas verificadas</p>
                <p className="text-[10px] font-medium text-slate-200">
                  Qualidade e reputação comprovadas
                </p>
              </div>
            </div>
          </div>
        </div>
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
