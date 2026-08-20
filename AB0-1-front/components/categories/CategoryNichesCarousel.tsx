'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Grid2X2 } from 'lucide-react';

import { resolveCategoryVisual } from '@/lib/categories/category-visual-registry';

interface CategoryNiche {
  id?: number;
  name: string;
  slug?: string;
  seo_url?: string;
}

interface CategoryNichesCarouselProps {
  niches?: CategoryNiche[];
}

const FALLBACK_NICHES: CategoryNiche[] = [
  { name: 'Energia Solar Residencial', seo_url: 'energia-solar-residencial' },
  { name: 'Energia Solar Comercial e Industrial', seo_url: 'energia-solar-comercial-industrial' },
  { name: 'Energia Solar Rural / Agronegócio', seo_url: 'energia-solar-rural' },
  { name: 'Baterias e Armazenamento de Energia', seo_url: 'baterias-armazenamento' },
  { name: 'Carport Solar / Coberturas Solares', seo_url: 'carport-solar' },
  { name: 'Painéis Solares', seo_url: 'paineis-solares' },
  { name: 'Inversores', seo_url: 'inversores-solares' },
  { name: 'Monitoramento e O&M', seo_url: 'monitoramento-operacao-manutencao' },
  { name: 'Financiamento de Energia Solar', seo_url: 'financiamento-energia-solar' },
  { name: 'Instaladores de Energia Solar', seo_url: 'instaladores-energia-solar' },
];

const SHORT_NAME_BY_LONG_NAME: Record<string, string> = {
  'Energia Solar Residencial': 'Residencial',
  'Energia Solar Comercial e Industrial': 'Comercial e Industrial',
  'Energia Solar Rural / Agronegócio': 'Rural / Agronegócio',
  'Baterias e Armazenamento de Energia': 'Baterias e Armazenamento',
  'Carport Solar / Coberturas Solares': 'Carport Solar',
  'Painéis Solares': 'Painéis Solares',
  Inversores: 'Inversores',
  'Monitoramento e O&M': 'Monitoramento',
  'Financiamento de Energia Solar': 'Financiamento',
  'Instaladores de Energia Solar': 'Instaladores',
};

function getShortName(name: string) {
  return SHORT_NAME_BY_LONG_NAME[name] || name.replace(/^Energia Solar\s*/i, '').trim();
}

function getNicheHref(niche: CategoryNiche) {
  const slug = niche.seo_url || niche.slug;
  return slug ? `/categories/${slug}` : `/categories?search=${encodeURIComponent(niche.name)}`;
}

export default function CategoryNichesCarousel({ niches = [] }: CategoryNichesCarouselProps) {
  const displayNiches = (niches.length > 0 ? niches : FALLBACK_NICHES).slice(0, 10);

  return (
    <section className="bg-transparent py-4 sm:py-6">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">
            Explorar Nichos
          </h2>
          <Link
            href="/categories"
            className="group inline-flex items-center gap-0.5 text-xs sm:text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
          >
            Ver todos
            <span aria-hidden="true" className="ml-0.5 transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          <div className="flex gap-3 sm:gap-4 lg:gap-6">
            {displayNiches.map((niche) => {
              const label = getShortName(niche.name);
              const visual = resolveCategoryVisual(niche.seo_url || niche.slug, niche.name);
              const iconSrc = visual?.src || null;

              return (
                <Link
                  key={`${niche.id || niche.seo_url || niche.slug || niche.name}`}
                  href={getNicheHref(niche)}
                  className="group flex w-[76px] sm:w-[88px] lg:w-[96px] shrink-0 flex-col items-center text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 active:scale-95"
                >
                  <span className="w-14 h-14 flex items-center justify-center relative bg-transparent border-0 shadow-none outline-none">
                    {iconSrc ? (
                      <Image
                        src={iconSrc}
                        alt=""
                        width={48}
                        height={48}
                        sizes="(max-width: 767px) 48px, 56px"
                        className="w-12 h-12 lg:w-14 lg:h-14 object-contain transition-transform group-hover:scale-105 duration-200"
                        priority={false}
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                        <Grid2X2 className="h-5 w-5" aria-hidden="true" />
                      </div>
                    )}
                  </span>
                  <span className="mt-2 line-clamp-2 min-h-[28px] sm:min-h-[32px] text-[11px] font-medium leading-[14px] text-slate-600 sm:text-xs sm:leading-tight sm:font-medium group-hover:text-blue-600 transition-colors">
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {displayNiches.length > 5 && (
          <div className="mt-3 flex justify-center gap-1 sm:hidden" aria-hidden="true">
            <span className="h-1 w-4 rounded-full bg-blue-600" />
            <span className="h-1 w-3 rounded-full bg-slate-200" />
            <span className="h-1 w-3 rounded-full bg-slate-200" />
          </div>
        )}
      </div>
    </section>
  );
}
