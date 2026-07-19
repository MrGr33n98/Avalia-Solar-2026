"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Building2, ArrowRight } from 'lucide-react';
import Autoplay from 'embla-carousel-autoplay';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { projectTypeVisualFor } from '@/lib/company-project-visuals';
import type { LocalSolarPageResponse } from '@/lib/api-client';
import { LOCAL_PAGE_FILTER_KEYS } from '@/lib/seo/search-params';

type SearchParams = Record<string, string | string[] | undefined>;

function companyCountLabel(count: number) {
  return count === 1 ? '1 empresa' : `${count} empresas`;
}

function selectedProjectTypes(data: LocalSolarPageResponse): string[] {
  return Array.isArray(data.filters.project_types) ? data.filters.project_types : [];
}

function allParams(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function buildQuery(searchParams: SearchParams | undefined, overrides: Record<string, string | number | null>) {
  const params = new URLSearchParams();

  LOCAL_PAGE_FILTER_KEYS.forEach((key) => {
    allParams(searchParams?.[key]).forEach((value) => {
      if (value) params.append(key, value);
    });
  });

  Object.entries(overrides).forEach(([key, value]) => {
    params.delete(key);
    if (value !== null && value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `?${query}` : '';
}

export function CategoryCarousel({ data, searchParams }: { data: LocalSolarPageResponse; searchParams?: SearchParams }) {
  const selected = selectedProjectTypes(data);
  const projectTypes = data.project_types || [];

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-slate-950 sm:text-lg">Navegue por categoria</h2>
        <Link href={data.location.canonical_path} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-blue-700 transition-colors hover:text-blue-800 sm:min-h-0">
          Ver todas
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 2000,
            stopOnInteraction: true,
          }),
        ]}
        className="w-full"
      >
        <CarouselContent className="-ml-2">
          {projectTypes.map((projectType) => {
            const active = selected.includes(projectType.name);
            const { iconSrc } = projectTypeVisualFor(projectType.name);
            return (
              <CarouselItem key={projectType.name} className="basis-auto pl-2">
                <Link
                  href={`${data.location.canonical_path}${buildQuery(searchParams, { project_types: active ? null : projectType.name, page: null })}`}
                  rel="nofollow"
                  className={`block min-h-[96px] w-[112px] rounded-lg border bg-white p-2 text-center shadow-sm transition hover:border-blue-200 hover:shadow-md sm:min-h-[100px] sm:w-[124px] ${
                    active ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'
                  }`}
                >
                  <div className="relative mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-700 sm:h-11 sm:w-11">
                    {iconSrc ? (
                      <Image src={iconSrc} alt={projectType.name} fill sizes="44px" className="object-contain p-1" unoptimized />
                    ) : (
                      <Building2 className="h-5 w-5" />
                    )}
                  </div>
                  <p className="line-clamp-2 min-h-7 text-[11px] font-bold leading-3.5 text-slate-900">{projectType.name}</p>
                  <p className="mt-0.5 text-[10px] text-slate-600">{companyCountLabel(projectType.companies_count)}</p>
                </Link>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </section>
  );
}
