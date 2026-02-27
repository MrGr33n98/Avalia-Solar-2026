'use client';

import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { getFullImageUrl } from '@/utils/image';
import { ArrowRight, ChevronRight, Info, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface Subcategory {
  id: number;
  name: string;
  slug?: string;
  seo_url: string;
}

interface CategoryHeroProps {
  name: string;
  description?: string;
  bannerUrl?: string;
  parentCategory?: { name: string; slug: string };
  subcategories?: Subcategory[];
  onLeadClick?: () => void;
  onMethodologyClick?: () => void;
}

export default function CategoryHero({
  name,
  description,
  bannerUrl,
  parentCategory,
  subcategories = [],
  onLeadClick,
  onMethodologyClick,
}: CategoryHeroProps) {
  const resolvedBannerUrl = bannerUrl ? getFullImageUrl(bannerUrl) : '';
  const heroDescription =
    description?.trim() ||
    `Compare empresas, avaliações e sinais de confiança para contratar ${name} com mais segurança.`;
  const bannerImageClass = getBannerImageClass(name);

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

          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/72 to-slate-950/14" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/64 via-black/20 to-transparent" />

          <div className="relative z-10 flex min-h-[184px] flex-col justify-between p-4 sm:min-h-[205px] sm:p-5 md:min-h-[214px] md:p-5 lg:min-h-[228px] lg:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-[34rem]">
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] text-white/92 backdrop-blur-md sm:px-2.5 sm:text-[9px]">
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

                <p className="mt-1.5 max-w-[28rem] text-[10px] font-medium leading-relaxed text-slate-200/95 drop-shadow-sm sm:text-[11px] md:text-[12px]">
                  {heroDescription}
                </p>
              </div>

              <div className="hidden rounded-full border border-amber-200/80 bg-amber-300/95 px-3.5 py-2 text-right text-[9px] font-black leading-tight text-slate-950 shadow-[0_18px_40px_-24px_rgba(146,64,14,0.95)] lg:block">
                <span className="block">Ranking baseado em</span>
                <span className="block text-slate-950">dados reais e confiança</span>
              </div>
            </div>

            <div className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  onClick={onLeadClick}
                  size="lg"
                  className="h-9 rounded-lg bg-emerald-500 px-4 text-[10px] font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-emerald-950/20 transition-all hover:bg-emerald-400 sm:h-10 sm:px-5 sm:text-[11px]"
                >
                  Solicitar orçamento
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>

                <Button
                  onClick={onMethodologyClick}
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg border-white/12 bg-white/10 px-3 text-[10px] font-bold text-white/92 backdrop-blur-md transition-all hover:bg-white/15 hover:text-white sm:h-9 sm:px-4"
                >
                  <Info className="mr-1.5 h-3.5 w-3.5" />
                  Método do ranking
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
