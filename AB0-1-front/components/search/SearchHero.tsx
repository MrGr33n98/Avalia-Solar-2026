'use client';

import { FormEvent } from 'react';
import Image from 'next/image';
import { MapPin, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface SearchHeroProps {
  searchTerm: string;
  locationTerm: string;
  onSearchTermChange: (value: string) => void;
  onLocationTermChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}

export function SearchHero({
  searchTerm,
  locationTerm,
  onSearchTermChange,
  onLocationTermChange,
  onSubmit,
}: SearchHeroProps) {
  return (
    <section className="relative isolate flex min-h-[420px] w-full items-center overflow-hidden bg-[#071e4a] text-white sm:min-h-[460px] md:min-h-[480px]">
      {/* Background Image Full Bleed */}
      <Image
        src="/assets/avalia_symbol_search_banner_avalia_solar.webp"
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[68%_center] sm:object-[72%_center] lg:object-center"
      />

      {/* Overlay Gradient Azul Prime/Navy */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-[#061b45]/95 via-[#071e4a]/85 to-[#071e4a]/40"
      />

      {/* Hero Content Container */}
      <div className="relative z-10 mx-auto w-full max-w-[1240px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="max-w-2xl lg:max-w-[55%]">
          <h1 className="text-[28px] font-black leading-tight tracking-tight text-white sm:text-4xl">
            Encontre a empresa certa para você.
          </h1>
          <p className="mt-2 text-sm leading-6 text-blue-100 sm:text-base">
            Busque empresas, produtos e avaliações verificadas de energia solar e mobilidade elétrica.
          </p>

          <form
            onSubmit={onSubmit}
            className="mt-6 flex flex-col gap-2 rounded-xl bg-white p-2 shadow-2xl sm:p-0 md:grid md:grid-cols-[minmax(0,1fr)_minmax(170px,0.8fr)_auto] md:gap-0 overflow-hidden"
          >
            {/* Field 1: Search */}
            <label className="relative flex-1 border-b border-slate-200 md:border-b-0 md:border-r">
              <span className="sr-only">Buscar empresa, produto ou serviço</span>
              <Search
                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <input
                value={searchTerm}
                onChange={(event) => onSearchTermChange(event.target.value)}
                placeholder="Buscar empresa, produto ou serviço..."
                className="h-12 sm:h-14 w-full min-w-0 bg-transparent pl-12 pr-10 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"
              />
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => onSearchTermChange('')}
                  aria-label="Limpar termo da busca"
                  className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : null}
            </label>

            {/* Field 2: Location */}
            <label className="relative flex-1 border-b border-slate-200 md:border-b-0">
              <span className="sr-only">CEP ou cidade</span>
              <MapPin
                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <input
                value={locationTerm}
                onChange={(event) => onLocationTermChange(event.target.value)}
                placeholder="CEP ou cidade..."
                className="h-12 sm:h-14 w-full min-w-0 bg-transparent pl-12 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"
              />
            </label>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full md:w-auto md:m-1.5 h-12 sm:h-11 rounded-lg bg-blue-600 px-8 text-sm font-bold text-white hover:bg-blue-700 active:scale-[0.99] transition-transform"
            >
              Buscar
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
