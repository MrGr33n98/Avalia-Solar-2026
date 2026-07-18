'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BriefcaseBusiness, PackageSearch, Search } from 'lucide-react';
import type { CompanyCatalogResponse } from '@/lib/api';
import { ProductCardEnhanced } from '@/components/search/ProductCardEnhanced';
import { openQuoteWizard } from '@/lib/quote-wizard';

export default function CatalogClient({ catalog }: { catalog: CompanyCatalogResponse }) {
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const needle = query.trim().toLocaleLowerCase('pt-BR');
  const products = useMemo(
    () =>
      catalog.products.filter(
        (item) => !needle || item.name.toLocaleLowerCase('pt-BR').includes(needle)
      ),
    [catalog.products, needle]
  );
  const services = useMemo(
    () =>
      catalog.services.filter(
        (item) => !needle || item.name.toLocaleLowerCase('pt-BR').includes(needle)
      ),
    [catalog.services, needle]
  );

  const toggleFavorite = (id: number) =>
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="space-y-5">
        <label className="relative block">
          <span className="sr-only">Buscar nesta categoria</span>
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar nesta categoria"
            className="h-11 w-full rounded-[2px] border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
          />
        </label>
        <div className="border border-slate-300 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-[#0B1F4B]">
            Precisa de ajuda?
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Fale com a {catalog.company.name} para encontrar a solução ideal.
          </p>
        </div>
      </aside>
      <div className="space-y-8">
        {services.length > 0 && (
          <section aria-labelledby="services-title">
            <h2 id="services-title" className="mb-4 text-xl font-bold text-[#0B1F4B]">
              Serviços
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {services.map((service) => (
                <article key={service.id} className="border border-slate-300 bg-white p-5">
                  <BriefcaseBusiness className="h-5 w-5 text-[#0B1F4B]" aria-hidden="true" />
                  <h3 className="mt-4 font-bold text-slate-950">{service.name}</h3>
                  {service.description && (
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {service.description}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}
        <section aria-labelledby="products-title">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 id="products-title" className="text-xl font-bold text-[#0B1F4B]">
              Produtos
            </h2>
            <span className="text-sm text-slate-600">
              {products.length} {products.length === 1 ? 'produto' : 'produtos'}
            </span>
          </div>
          {products.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCardEnhanced
                  key={product.id}
                  product={product}
                  favorite={favorites.has(product.id)}
                  onToggleFavorite={() => toggleFavorite(product.id)}
                />
              ))}
            </div>
          ) : (
            <div className="border border-slate-300 bg-white p-8 text-center sm:p-10">
              <PackageSearch className="mx-auto h-8 w-8 text-[#0B1F4B]" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-bold text-[#0B1F4B]">Catálogo em atualização</h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-600">
                Ainda não há produtos publicados nesta categoria. Solicite uma solução à{' '}
                {catalog.company.name} ou consulte o perfil completo da empresa.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => openQuoteWizard({ source: 'company-category-empty-catalog' })}
                  className="inline-flex min-h-11 items-center justify-center rounded-[2px] bg-[#0B1F4B] px-5 text-sm font-semibold text-white hover:bg-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                  Solicitar orçamento
                </button>
                <Link
                  href={`/companies/${catalog.company.slug || catalog.company.id}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-[2px] border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                  Ver perfil da empresa
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
