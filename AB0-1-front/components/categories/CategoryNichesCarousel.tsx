'use client';

import Image from 'next/image';
import Link from 'next/link';

import { getCategoryIcon } from '@/lib/categoryIcons';

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
  { name: 'Energia Solar Rural / Agronegócio', seo_url: 'energia-solar-rural-agronegocio' },
  { name: 'Baterias e Armazenamento de Energia', seo_url: 'baterias-armazenamento-energia' },
  { name: 'Carport Solar / Coberturas Solares', seo_url: 'carport-solar-coberturas-solares' },
  { name: 'Painéis Solares', seo_url: 'paineis-solares' },
  { name: 'Inversores', seo_url: 'inversores' },
  { name: 'Monitoramento e O&M', seo_url: 'monitoramento-om' },
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
    <section className="bg-white pb-3 pt-4">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-black uppercase tracking-wide text-slate-800">
            Explorar Nichos
          </h2>
          <Link
            href="/categories"
            className="inline-flex items-center gap-1 text-sm font-bold text-blue-700 transition-colors hover:text-blue-800"
          >
            Ver todos
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          <div className="flex gap-3">
            {displayNiches.map((niche) => {
              const label = getShortName(niche.name);
              const iconSrc = getCategoryIcon(niche.seo_url || niche.slug, niche.name);

              return (
                <Link
                  key={`${niche.id || niche.seo_url || niche.slug || niche.name}`}
                  href={getNicheHref(niche)}
                  className="group flex w-[86px] shrink-0 flex-col items-center text-center sm:w-24"
                >
                  <span className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white p-1.5 shadow-sm transition-all group-hover:border-blue-200 group-hover:shadow-md">
                    {iconSrc ? (
                      <Image
                        src={iconSrc}
                        alt={`Ícone de ${label}`}
                        fill
                        sizes="64px"
                        className="scale-125 object-contain p-0.5"
                      />
                    ) : (
                      <span className="h-8 w-8 rounded-full bg-blue-100" aria-hidden="true" />
                    )}
                  </span>
                  <span className="mt-2 line-clamp-2 min-h-[32px] text-[11px] font-bold leading-tight text-slate-900 sm:text-xs">
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {displayNiches.length > 5 && (
          <div className="mt-2 flex justify-center gap-1.5 sm:hidden" aria-hidden="true">
            <span className="h-1.5 w-5 rounded-full bg-blue-700" />
            <span className="h-1.5 w-5 rounded-full bg-slate-200" />
            <span className="h-1.5 w-5 rounded-full bg-slate-200" />
          </div>
        )}
      </div>
    </section>
  );
}
