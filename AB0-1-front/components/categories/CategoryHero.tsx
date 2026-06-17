'use client';

import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { getFullImageUrl } from '@/utils/image';
import { ArrowRight, ChevronRight, ShieldCheck, Sparkles } from 'lucide-react';
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
  const validBanners = banners
    .map((b) => ({
      ...b,
      image_url: b.image_url ? getFullImageUrl(b.image_url) : FALLBACK_BANNER_SRC,
    }))
    .filter((b) => b.image_url);
  const visualUrl = validBanners[0]?.image_url || resolvedBannerUrl;
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

        <div className="relative overflow-hidden rounded-[20px] border border-slate-200 bg-slate-950 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.45)] md:rounded-[28px]">
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

          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/82 to-slate-950/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/64 via-black/20 to-transparent" />

          <div className="relative z-10 flex min-h-[264px] flex-col justify-between gap-7 p-6 sm:min-h-[280px] sm:p-7 md:min-h-[300px] md:p-8 lg:min-h-[324px]">
            <div className="w-full max-w-[38rem]">
              <div className="max-w-[38rem]">
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-black uppercase tracking-tight text-slate-950">
                    <Sparkles className="h-3.5 w-3.5" />
                    Guia {new Date().getFullYear()}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-amber-400 px-3 py-1 text-[11px] font-black uppercase tracking-tight text-slate-950">
                    Categoria estratégica
                  </span>
                </div>

                <h1 className="max-w-3xl text-[1.85rem] font-black leading-tight text-white drop-shadow-md sm:text-[2.25rem] md:text-[3rem]">
                  {name}
                </h1>

                <p className="mt-3 max-w-[31rem] text-base font-medium leading-relaxed text-slate-100 drop-shadow-sm sm:text-lg">
                  {heroDescription}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="inline-flex max-w-[21rem] items-center gap-3 rounded-2xl bg-white/12 px-4 py-3 text-white shadow-sm backdrop-blur-md">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
                  <ShieldCheck className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-sm font-black">Empresas verificadas</p>
                  <p className="text-xs font-medium text-slate-200">
                    Qualidade e reputação comprovadas
                  </p>
                </div>
              </div>

              <Button
                onClick={onLeadClick}
                size="lg"
                className="h-14 rounded-2xl bg-emerald-500 px-6 text-base font-black text-white shadow-lg shadow-emerald-950/20 transition-all hover:bg-emerald-400 sm:min-w-[20rem]"
              >
                Solicitar orçamento
                <ArrowRight className="ml-auto h-5 w-5 sm:ml-4" />
              </Button>
            </div>
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
