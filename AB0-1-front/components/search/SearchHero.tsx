'use client';

import { FormEvent } from 'react';
import Image from 'next/image';
import { MapPin, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface SearchHeroProps {
  searchTerm: string;
  locationTerm: string;
  onSearchTermChange: (value: string) => void;
  onLocationTermChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  categories?: string[];
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

export function SearchHero({
  searchTerm,
  locationTerm,
  onSearchTermChange,
  onLocationTermChange,
  onSubmit,
  categories = [],
  selectedCategory = '',
  onSelectCategory,
}: SearchHeroProps) {
  const displayCategories =
    categories.length > 0
      ? categories.slice(0, 8)
      : [
          'Energia Solar Residencial',
          'Energia Solar Comercial',
          'Baterias e Armazenamento',
          'Inversores Solares',
          'Carregadores Veiculares',
          'Manutenção e Suporte',
        ];

  return (
    <section className="relative isolate w-full overflow-hidden border-b border-slate-200/80 bg-[#F8FAFC]">
      {/* Background illustration asset - positioned on the right */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 top-0 hidden h-full w-[40%] select-none md:block lg:w-[45%] xl:w-[47%]"
      >
        <div className="relative h-full w-full">
          <Image
            src="/images/search-avalia-solar.png"
            alt=""
            fill
            priority
            sizes="(min-width: 1440px) 580px, (min-width: 1024px) 45vw, 40vw"
            className="object-contain object-right-bottom"
          />
        </div>
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1240px] flex-col justify-center px-4 py-5 sm:px-6 sm:py-6 lg:min-h-[240px] lg:px-8 lg:py-5">
        <div className="w-full max-w-full lg:max-w-[620px] xl:max-w-[660px]">
          {/* Eyebrow */}
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600 sm:text-xs">
            Busca no Avalia Solar
          </p>

          {/* Headline */}
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-[32px] lg:leading-[38px]">
            Encontre a empresa certa para seu projeto
          </h1>

          {/* Subheadline */}
          <p className="mt-1 text-xs text-slate-600 sm:text-sm sm:leading-relaxed">
            Compare empresas, produtos e avaliações de energia solar e mobilidade elétrica.
          </p>

          {/* Search Form */}
          <form
            onSubmit={onSubmit}
            className="mt-3.5 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xs sm:flex-row sm:items-center sm:gap-0 sm:p-1 md:h-12"
          >
            {/* Search Input */}
            <label className="relative flex min-w-0 flex-1 items-center">
              <span className="sr-only">Buscar empresa, produto ou serviço</span>
              <Search
                className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => onSearchTermChange(event.target.value)}
                placeholder="Buscar empresa, produto ou serviço..."
                className="h-10 w-full min-w-0 bg-transparent pl-10 pr-9 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus-visible:ring-0 sm:h-full"
              />
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => onSearchTermChange('')}
                  aria-label="Limpar termo da busca"
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              ) : null}
            </label>

            {/* Separator on desktop/tablet */}
            <div className="hidden h-6 w-px bg-slate-200 sm:block sm:mx-1" aria-hidden="true" />

            {/* Location Input */}
            <label className="relative flex items-center sm:w-[190px] md:w-[210px] lg:w-[230px]">
              <span className="sr-only">CEP ou cidade</span>
              <MapPin
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="text"
                value={locationTerm}
                onChange={(event) => onLocationTermChange(event.target.value)}
                placeholder="CEP ou cidade..."
                className="h-10 w-full min-w-0 bg-transparent pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus-visible:ring-0 sm:h-full"
              />
            </label>

            {/* Submit Button */}
            <Button
              type="submit"
              className="h-10 w-full min-w-[112px] rounded-lg bg-blue-600 px-6 text-sm font-bold text-white shadow-xs transition-transform hover:bg-blue-700 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 sm:h-10 sm:w-auto"
            >
              Buscar
            </Button>
          </form>

          {/* Category Chips */}
          {displayCategories.length > 0 ? (
            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {displayCategories.map((category) => {
                const isSelected = selectedCategory.toLowerCase() === category.toLowerCase();
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => onSelectCategory?.(category)}
                    className={cn(
                      'inline-flex h-8 shrink-0 items-center rounded-lg border px-3 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600',
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
