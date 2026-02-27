'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { getFullImageUrl } from '@/utils/image';
import {
  ArrowRight,
  Building2,
  ChevronRight,
  Info,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
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
  companiesCount: number;
  reviewsCount: number;
  verifiedPct: number;
  bannerUrl?: string;
  parentCategory?: { name: string; slug: string };
  subcategories?: Subcategory[];
  onLeadClick?: () => void;
  onMethodologyClick?: () => void;
}

export default function CategoryHero({
  name,
  description,
  companiesCount,
  reviewsCount,
  verifiedPct,
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

  return (
    <section className="border-b border-slate-100 bg-white py-5 md:py-7">
      <div className="mx-auto max-w-[1280px] px-6">
        <nav className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 md:mb-5 md:text-[11px]">
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
                className="object-cover object-center"
                fallbackSrc="/images/default-banner.svg"
              />
            ) : (
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.35),_transparent_30%),linear-gradient(120deg,_#0f172a,_#1e293b_55%,_#111827)]" />
            )}
          </div>

          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/76 to-slate-950/18" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/18 to-transparent" />

          <div className="relative z-10 flex min-h-[200px] flex-col justify-between p-5 sm:min-h-[220px] sm:p-6 md:min-h-[240px] md:p-8 lg:min-h-[250px]">
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-3xl">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/92 backdrop-blur-md">
                    <Sparkles className="h-3 w-3" />
                    Guia {new Date().getFullYear()}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-amber-400/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-950">
                    Categoria estratégica
                  </span>
                </div>

                <h1 className="max-w-4xl text-3xl font-black tracking-[-0.04em] text-white drop-shadow-md sm:text-4xl md:text-5xl lg:text-[3.25rem]">
                  {name}
                </h1>

                <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-slate-200/95 drop-shadow-sm sm:text-[15px] md:text-base">
                  {heroDescription}
                </p>
              </div>

              <div className="hidden rounded-full border border-white/15 bg-white/10 px-4 py-2 text-right text-[11px] font-bold text-white/90 backdrop-blur-md lg:block">
                Ranking baseado em
                <span className="block text-white">dados reais e confiança</span>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-wrap gap-2.5">
                <StatPill
                  icon={<Building2 className="h-4 w-4 text-emerald-300" />}
                  value={companiesCount}
                  label="empresas"
                />
                <StatPill
                  icon={<MessageSquareText className="h-4 w-4 text-sky-300" />}
                  value={reviewsCount}
                  label="avaliações"
                />
                <StatPill
                  icon={<ShieldCheck className="h-4 w-4 text-amber-300" />}
                  value={`${verifiedPct}%`}
                  label="verificadas"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={onLeadClick}
                  size="lg"
                  className="h-12 rounded-xl bg-emerald-500 px-7 text-sm font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-emerald-950/20 transition-all hover:bg-emerald-400"
                >
                  Solicitar orçamento
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <Button
                  onClick={onMethodologyClick}
                  variant="outline"
                  size="lg"
                  className="h-12 rounded-xl border-white/20 bg-white/10 px-6 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/18 hover:text-white"
                >
                  <Info className="mr-2 h-4 w-4" />
                  Método do ranking
                </Button>
              </div>
            </div>
          </div>
        </div>

        {subcategories.length > 0 && (
          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
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

function StatPill({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-3 rounded-2xl border border-white/14 bg-white/10 px-4 py-2.5 text-white backdrop-blur-md">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
        {icon}
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-lg font-black tracking-tight">{value}</span>
        <span className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/72">
          {label}
        </span>
      </div>
    </div>
  );
}
