'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Grid2X2 } from 'lucide-react';

import { resolveCategoryVisual } from '@/lib/categories/category-visual-registry';
import { cn } from '@/lib/utils';

interface CategoryNiche {
  id?: number;
  name: string;
  slug?: string;
  seo_url?: string;
  status?: string;
}

interface CategoryNichesCarouselProps {
  niches?: CategoryNiche[];
}

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
  return slug ? `/categories/${slug}` : null;
}

export default function CategoryNichesCarousel({ niches = [] }: CategoryNichesCarouselProps) {
  // CDSI-060 (J19 / J20): Exibe exclusivamente subcategorias/nichos reais e ativos.
  // Não injeta FALLBACK_NICHES genéricos em categorias sem filhos.
  const displayNiches = niches
    .filter((niche) => (!niche.status || niche.status === 'active') && Boolean(getNicheHref(niche)))
    .slice(0, 10);

  if (displayNiches.length === 0) {
    return null;
  }

  return (
    <section className="bg-transparent py-4 sm:py-6" aria-labelledby="category-niches-heading">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="category-niches-heading" className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">
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

        <div
          role="region"
          aria-label="Nichos da categoria"
          className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 xl:overflow-visible no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div
            className={cn(
              'flex gap-3 sm:gap-4 lg:gap-5',
              displayNiches.length <= 8
                ? 'xl:grid xl:gap-3.5 xl:justify-items-center xl:w-full'
                : 'xl:grid xl:grid-cols-5 xl:gap-4 xl:w-full'
            )}
            style={
              displayNiches.length <= 8
                ? { gridTemplateColumns: `repeat(${displayNiches.length}, minmax(0, 1fr))` }
                : undefined
            }
          >
            {displayNiches.map((niche) => {
              const label = getShortName(niche.name);
              const visual = resolveCategoryVisual(niche.seo_url || niche.slug, niche.name);
              const iconSrc = visual?.src || null;
              const href = getNicheHref(niche);
              if (!href) return null;

              return (
                <Link
                  key={`${niche.id || niche.seo_url || niche.slug || niche.name}`}
                  href={href}
                  className="group flex w-[116px] min-[390px]:w-[124px] sm:w-[136px] xl:w-full xl:max-w-[156px] shrink-0 xl:shrink flex-col items-center text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded-xl p-1 transition-all duration-200 hover:-translate-y-0.5 hover:opacity-95 active:scale-95"
                >
                  <span className="relative flex h-14 w-14 shrink-0 items-center justify-center bg-transparent border-0 shadow-none outline-none">
                    {iconSrc ? (
                      <Image
                        src={iconSrc}
                        alt=""
                        width={56}
                        height={56}
                        sizes="(max-width: 767px) 48px, 56px"
                        className="h-12 w-12 lg:h-14 lg:w-14 object-contain transition-transform duration-200 group-hover:scale-105"
                        priority={false}
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                        <Grid2X2 className="h-5 w-5" aria-hidden="true" />
                      </div>
                    )}
                  </span>
                  <span className="mt-2 text-center text-[11px] sm:text-xs font-medium leading-[15px] sm:leading-4 text-slate-700 transition-colors group-hover:text-blue-600 [overflow-wrap:break-word] hyphens-auto">
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {displayNiches.length > 5 && (
          <div className="mt-3 flex justify-center gap-1 xl:hidden" aria-hidden="true">
            <span className="h-1 w-4 rounded-full bg-blue-600" />
            <span className="h-1 w-3 rounded-full bg-slate-200" />
            <span className="h-1 w-3 rounded-full bg-slate-200" />
          </div>
        )}
      </div>
    </section>
  );
}
