'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { BriefcaseBusiness, Search } from 'lucide-react';
import type { CompanyCatalogResponse } from '@/lib/api';
import { ProductCardEnhanced } from '@/components/search/ProductCardEnhanced';
import { openQuoteWizard } from '@/lib/quote-wizard';
import { useDebounce } from '@/hooks/useDebounce';
import { trackCompanyCategorySearch, trackCompanyCategoryFavoriteToggled, trackCompanyCategoryQuoteStarted } from '@/lib/analytics/company-category';
import { SmartEmptyCatalog } from './components/SmartEmptyCatalog';

const FAVORITES_STORAGE_KEY = 'avalia_solar_category_favorites';

export default function CatalogClient({ catalog }: { catalog: CompanyCatalogResponse }) {
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const debouncedQuery = useDebounce(query, 250);
  const needle = debouncedQuery.trim().toLocaleLowerCase('pt-BR');

  const searchableProducts = useMemo(
    () => [...(catalog.products || []), ...(catalog.suggested_products || [])],
    [catalog.products, catalog.suggested_products]
  );

  const products = useMemo(
    () => filterItems(catalog.products, needle),
    [catalog.products, needle]
  );
  const services = useMemo(
    () => filterItems(catalog.services, needle),
    [catalog.services, needle]
  );
  const suggestedProducts = useMemo(
    () => filterItems(catalog.suggested_products || [], needle),
    [catalog.suggested_products, needle]
  );

  const isCategoryEmpty = catalog.products?.length === 0 && catalog.services?.length === 0;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setFavorites(new Set(parsed.map(Number)));
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(favorites)));
    } catch {
      // ignore storage errors
    }
  }, [favorites]);

  useEffect(() => {
    if (!debouncedQuery) return;
    const resultCount = products.length + services.length + suggestedProducts.length;
    trackCompanyCategorySearch({
      company_id: catalog.company.id,
      company_name: catalog.company.name,
      category_id: catalog.category.id,
      category_name: catalog.category.name,
      query: debouncedQuery,
      result_count: resultCount,
    });
  }, [debouncedQuery, products.length, services.length, suggestedProducts.length, catalog.company.id, catalog.company.name, catalog.category.id, catalog.category.name]);

  const toggleFavorite = useCallback((id: number, productName: string) => {
    setFavorites((current) => {
      const next = new Set(current);
      const isAdding = !next.has(id);
      if (next.has(id)) next.delete(id);
      else next.add(id);

      trackCompanyCategoryFavoriteToggled({
        company_id: catalog.company.id,
        product_id: id,
        product_name: productName,
        is_favorite: isAdding,
      });

      return next;
    });
  }, [catalog.company.id]);

  const handleQuoteClick = useCallback(() => {
    trackCompanyCategoryQuoteStarted({
      company_id: catalog.company.id,
      company_name: catalog.company.name,
      category_id: catalog.category.id,
      category_name: catalog.category.name,
      source: 'company-category-filled',
    });
    openQuoteWizard({
      preferredCompanyId: catalog.company.id,
      source: 'company-category-filled',
    });
  }, [catalog.company.id, catalog.company.name, catalog.category.id, catalog.category.name]);

  const searchPlaceholder = isCategoryEmpty
    ? `Buscar em todas as categorias da ${catalog.company.name}`
    : 'Buscar nesta categoria';

  if (isCategoryEmpty) {
    return (
      <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <label className="relative block">
            <span className="sr-only">{searchPlaceholder}</span>
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-11 w-full rounded-[2px] border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            />
          </label>
          {suggestedProducts.length > 0 && (
            <div className="border border-slate-300 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-[#0B1F4B]">
                Resultados da busca
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {suggestedProducts.length}{' '}
                {suggestedProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
                {debouncedQuery ? ` para "${debouncedQuery}"` : ''}.
              </p>
            </div>
          )}
        </aside>
        <SmartEmptyCatalog
          catalog={catalog}
          favorites={favorites}
          onToggleFavorite={(id) => {
            const product = searchableProducts.find((p) => p.id === id);
            toggleFavorite(id, product?.name || '');
          }}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="space-y-5">
        <label className="relative block">
          <span className="sr-only">{searchPlaceholder}</span>
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
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
          <button
            type="button"
            onClick={handleQuoteClick}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-[2px] bg-[#0B1F4B] px-5 text-sm font-semibold text-white hover:bg-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Solicitar orçamento
          </button>
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
                  onToggleFavorite={() => toggleFavorite(product.id, product.name)}
                />
              ))}
            </div>
          ) : (
            <div className="border border-slate-300 bg-white p-8 text-center sm:p-10">
              <p className="text-sm text-slate-600">
                Nenhum produto encontrado para &quot;{debouncedQuery}&quot;.
              </p>
              <Link
                href={`/companies/${catalog.company.slug || catalog.company.id}`}
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[2px] border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                Ver perfil da empresa
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function filterItems<T extends { name: string }>(items: T[] | undefined | null, needle: string): T[] {
  if (!items) return [];
  if (!needle) return items;
  return items.filter((item) => item.name.toLocaleLowerCase('pt-BR').includes(needle));
}
