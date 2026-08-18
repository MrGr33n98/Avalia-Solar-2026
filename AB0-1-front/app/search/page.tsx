'use client';

import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Building2,
  ChevronRight,
  FileText,
  MapPin,
  Package,
  Search,
  SlidersHorizontal,
  Star,
  Tag,
  X,
} from 'lucide-react';
import { BannerSlot } from '@/components/banners/BannerSlot';
import { SearchCompanyListCard } from '@/components/search/SearchCompanyListCard';
import ReviewCard from '@/components/ReviewCard';
import { ProductCardEnhanced } from '@/components/search/ProductCardEnhanced';
import { favoritesApi } from '@/lib/api/favorites';
import { useAuth } from '@/contexts/AuthContext';
import {
  defaultSearchFilters,
  SearchFilters,
  type PriceRange,
  type SearchFilterState,
} from '@/components/search/SearchFilters';
import { SearchEmptyState } from '@/components/search/SearchEmptyState';
import { SearchResultsHeader, type SearchSort } from '@/components/search/SearchResultsHeader';
import { SearchTabs, type SearchTab } from '@/components/search/SearchTabs';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import type { Company, Product, SearchAllResponse } from '@/lib/api';
import { searchApi } from '@/lib/api';
import { companiesApiSafe } from '@/lib/api-client';
import { track, page as trackPage } from '@/lib/analytics/lazy';
import { CONTACT } from '@/lib/site';
import { buildCategoryPath } from '@/lib/slug';

const normalize = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const getProductCategory = (product: Product) =>
  product.categories?.[0]?.name || product.category?.name || '';

const getProductBrand = (product: Product) => product.brand?.name || product.company?.name || '';

const getCompanyRating = (company: Company) =>
  Number(
    company.reputation?.rating_avg ||
      company.average_rating ||
      company.rating_avg ||
      company.rating ||
      0
  );

const getProductRating = (product: Product) => Number(product.company?.rating_avg || 0);

const isCompanyVerified = (company: Company) =>
  Boolean(
    company.verified || ['verified', 'premium'].includes(company.trust?.verification_status || '')
  );

const isProductVerified = (product: Product) => Boolean(product.company?.verified);

const matchesPrice = (price: number, range: PriceRange) => {
  if (range === 'all') return true;
  if (!Number.isFinite(price) || price <= 0) return false;
  if (range === 'under_1000') return price < 1000;
  if (range === '1000_3000') return price >= 1000 && price <= 3000;
  if (range === '3000_5000') return price > 3000 && price <= 5000;
  return price > 5000;
};

const isSearchTab = (value: string | null): value is SearchTab =>
  value === 'all' || value === 'products' || value === 'companies' || value === 'reviews';

const isSearchSort = (value: string | null): value is SearchSort =>
  value === 'relevance' || value === 'price_asc' || value === 'price_desc' || value === 'rating';

const toApiSort = (sort: SearchSort) => {
  if (sort === 'rating') return 'rating_desc';
  if (sort === 'relevance') return 'recommended';
  return sort;
};

const mergeUniqueCompanies = (primary: Company[], fallback: Company[]) => {
  const seen = new Set<number | string>();
  return [...primary, ...fallback].filter((company) => {
    if (seen.has(company.id)) return false;
    seen.add(company.id);
    return true;
  });
};

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const urlCity = searchParams.get('city') || '';
  const urlVerified = searchParams.get('verified') === 'true';
  const pageParam = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const tabParam = searchParams.get('tab');
  const sortParam = searchParams.get('sort');

  const [searchTerm, setSearchTerm] = useState(query);
  const [locationTerm, setLocationTerm] = useState(urlCity);
  const [results, setResults] = useState<
    Pick<SearchAllResponse, 'companies' | 'products' | 'categories' | 'articles' | 'reviews'>
  >({ companies: [], products: [], categories: [], articles: [], reviews: [] });
  const [paginationMeta, setPaginationMeta] = useState<{
    page: number;
    total_pages: number;
    total_count: number;
  }>({ page: 1, total_pages: 1, total_count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SearchTab>(isSearchTab(tabParam) ? tabParam : 'all');
  const [sort, setSort] = useState<SearchSort>(isSearchSort(sortParam) ? sortParam : 'relevance');
  const [filters, setFilters] = useState<SearchFilterState>({
    ...defaultSearchFilters,
    city: urlCity,
    verifiedOnly: urlVerified,
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [productFavorites, setProductFavorites] = useState<Set<number>>(new Set());
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    setSearchTerm(query);
    setLocationTerm(urlCity);
    setFilters((current) => ({ ...current, city: urlCity, verifiedOnly: urlVerified }));
  }, [query, urlCity, urlVerified]);

  useEffect(() => {
    setActiveTab(isSearchTab(tabParam) ? tabParam : 'all');
  }, [tabParam]);

  useEffect(() => {
    setSort(isSearchSort(sortParam) ? sortParam : 'relevance');
  }, [sortParam]);

  useEffect(() => {
    if (!isAuthenticated || results.products.length === 0) return;
    void favoritesApi.status('Product', results.products.map((product) => product.id)).then((response) => {
      setProductFavorites(new Set(Object.entries(response.favorites).filter(([, saved]) => saved).map(([id]) => Number(id))));
    }).catch(() => undefined);
  }, [isAuthenticated, results.products]);

  useEffect(() => {
    try {
      if (isAuthenticated) return;
      setProductFavorites(
        new Set<number>(JSON.parse(localStorage.getItem('search-product-favorites') || '[]'))
      );
    } catch {
      // Storage indisponível ou valor antigo inválido: favoritos começam vazios.
    }
  }, [isAuthenticated]);

  useEffect(() => {
    trackPage('search', { search_term: query || undefined, city: urlCity || undefined });
  }, [query, urlCity]);

  const performSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiFilters = {
        ...(urlCity ? { city: urlCity } : {}),
        sort: toApiSort(sort),
        page: pageParam,
        per_page: 24,
      };
      const response = await searchApi.all(query, apiFilters);
      const companies = response.companies || [];
      const fallbackCompanies =
        query.trim() && companies.length === 0
          ? await companiesApiSafe.getAll({
              q: query.trim(),
              ...(urlCity ? { city: urlCity } : {}),
              status: 'active',
              sort: toApiSort(sort),
              page: pageParam,
              limit: 24,
              fields: 'card',
            })
          : [];

      const mergedCompanies = mergeUniqueCompanies(companies, fallbackCompanies);
      const rawCount =
        response.counts?.companies ??
        (typeof response.meta?.total_count === 'object'
          ? response.meta.total_count.companies
          : typeof response.meta?.total_count === 'number'
            ? response.meta.total_count
            : undefined);

      const totalCompaniesCount = typeof rawCount === 'number' ? rawCount : mergedCompanies.length;
      const totalPagesVal =
        response.pagination?.total_pages ||
        response.meta?.total_pages ||
        Math.max(1, Math.ceil(totalCompaniesCount / 24));

      setResults({
        companies: mergedCompanies,
        products: response.products || [],
        categories: response.categories || [],
        articles: response.articles || [],
        reviews: response.reviews || [],
      });

      setPaginationMeta({
        page: pageParam,
        total_pages: totalPagesVal,
        total_count: Math.max(totalCompaniesCount, mergedCompanies.length),
      });

      track('search_results_loaded', {
        search_term: query,
        city: urlCity || undefined,
        products_count: response.products?.length || 0,
        companies_count: mergedCompanies.length,
        companies_fallback_count: fallbackCompanies.length || undefined,
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : 'Não foi possível realizar a busca.'
      );
    } finally {
      setLoading(false);
    }
  }, [query, sort, urlCity, pageParam]);

  useEffect(() => {
    void performSearch();
  }, [performSearch]);

  const categories = useMemo(
    () =>
      Array.from(
        new Set([
          ...results.products.map(getProductCategory),
          ...results.companies.flatMap((company) => [
            company.category_name || company.primary_category || company.category || '',
            ...(company.categories || []).map((category) => category.name),
          ]),
          ...results.categories.map((category) => category.name),
        ])
      )
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [results]
  );

  const brands = useMemo(
    () =>
      Array.from(new Set(results.products.map(getProductBrand)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [results.products]
  );

  const filteredProducts = useMemo(() => {
    if (!filters.includeProducts) return [];
    const list = results.products.filter((product) => {
      if (
        filters.category &&
        normalize(getProductCategory(product)) !== normalize(filters.category)
      ) {
        return false;
      }
      if (filters.brand && normalize(getProductBrand(product)) !== normalize(filters.brand))
        return false;
      if (filters.verifiedOnly && !isProductVerified(product)) return false;
      return matchesPrice(Number(product.price), filters.priceRange);
    });

    if (sort === 'price_asc') return [...list].sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === 'price_desc') return [...list].sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === 'rating')
      return [...list].sort((a, b) => getProductRating(b) - getProductRating(a));
    return list;
  }, [filters, results.products, sort]);

  const filteredCompanies = useMemo(() => {
    if (!filters.includeCompanies) return [];
    const cityFilter = normalize(filters.city);
    const list = results.companies.filter((company) => {
      if (filters.verifiedOnly && !isCompanyVerified(company)) return false;
      if (
        cityFilter &&
        !normalize(`${company.city} ${company.state}`).includes(cityFilter.replace(',', ' '))
      ) {
        return false;
      }
      if (filters.category) {
        const companyCategories = [
          company.category_name,
          company.primary_category,
          company.category,
          ...(company.categories || []).map((category) => category.name),
        ].map(normalize);
        if (!companyCategories.includes(normalize(filters.category))) return false;
      }
      return true;
    });

    if (sort === 'rating')
      return [...list].sort((a, b) => getCompanyRating(b) - getCompanyRating(a));
    return list;
  }, [filters, results.companies, sort]);

  const counts: Record<SearchTab, number> = {
    all: filteredProducts.length + (paginationMeta.total_count || filteredCompanies.length),
    products: filteredProducts.length,
    companies: paginationMeta.total_count || filteredCompanies.length,
    reviews: results.reviews?.length || 0,
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage <= 1) params.delete('page');
    else params.set('page', newPage.toString());
    router.push(`/search?${params.toString()}`);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchTerm.trim()) params.set('q', searchTerm.trim());
    else params.delete('q');
    if (locationTerm.trim()) params.set('city', locationTerm.trim());
    else params.delete('city');
    params.delete('page');
    track('search_submitted', {
      search_term: searchTerm.trim(),
      location_term: locationTerm.trim(),
      source: 'search_page_hero',
    });
    router.push(`/search?${params.toString()}`);
  };

  const handleTabChange = (tab: SearchTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'all') params.delete('tab');
    else params.set('tab', tab);
    router.replace(`/search?${params.toString()}`, { scroll: false });
  };

  const handleSortChange = (nextSort: SearchSort) => {
    setSort(nextSort);
    const params = new URLSearchParams(searchParams.toString());
    if (nextSort === 'relevance') params.delete('sort');
    else params.set('sort', nextSort);
    params.delete('page');
    router.replace(`/search?${params.toString()}`, { scroll: false });
  };

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (filters.city.trim()) params.set('city', filters.city.trim());
    else params.delete('city');
    if (filters.verifiedOnly) params.set('verified', 'true');
    else params.delete('verified');
    router.replace(`/search?${params.toString()}`, { scroll: false });
    setMobileFiltersOpen(false);
  };

  const resetFilters = () => {
    setFilters(defaultSearchFilters);
    setLocationTerm('');
    const params = new URLSearchParams(searchParams.toString());
    ['city', 'verified', 'category', 'brand', 'price'].forEach((key) => params.delete(key));
    router.replace(`/search?${params.toString()}`, { scroll: false });
  };

  const toggleFavorite = (
    kind: 'product',
    id: number,
    current: Set<number>,
    setter: (value: Set<number>) => void
  ) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
    localStorage.setItem(`search-${kind}-favorites`, JSON.stringify(Array.from(next)));
  };

  const showProducts = activeTab === 'all' || activeTab === 'products';
  const showCompanies = activeTab === 'all' || activeTab === 'companies';
  const showReviews = activeTab === 'all' || activeTab === 'reviews';
  const visibleCount =
    (showProducts ? filteredProducts.length : 0) +
    (showCompanies ? filteredCompanies.length : 0) +
    (showReviews ? results.reviews?.length || 0 : 0);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="overflow-hidden bg-[#071e4a] text-white">
        <div className="mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-6 px-4 py-8 sm:px-6 sm:py-10 md:grid-cols-[minmax(0,1fr)_160px] md:gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10 lg:px-8 xl:grid-cols-[minmax(0,1fr)_440px] 2xl:grid-cols-[minmax(0,1fr)_500px]">
          <div className="min-w-0">
            <h1 className="max-w-2xl text-[28px] font-black leading-tight tracking-tight sm:text-4xl">
              Encontre a empresa certa para você.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
              Busque empresas, produtos e avaliações verificadas de energia solar e mobilidade
              elétrica.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-6 grid w-full max-w-[760px] overflow-hidden rounded-xl bg-white shadow-2xl lg:mt-7 lg:grid-cols-[minmax(0,1fr)_minmax(170px,0.8fr)_auto]"
            >
            <label className="relative border-b border-slate-200 sm:border-b-0 sm:border-r">
              <span className="sr-only">Buscar empresa, produto ou serviço</span>
              <Search
                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar empresa, produto ou serviço..."
                className="h-14 w-full min-w-0 bg-transparent pl-12 pr-12 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"
              />
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  aria-label="Limpar termo da busca"
                  className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : null}
            </label>
            <label className="relative border-b border-slate-200 sm:border-b-0">
              <span className="sr-only">CEP ou cidade</span>
              <MapPin
                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <input
                value={locationTerm}
                onChange={(event) => setLocationTerm(event.target.value)}
                placeholder="CEP ou cidade..."
                className="h-14 w-full min-w-0 bg-transparent pl-12 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"
              />
            </label>
            <Button
              type="submit"
              className="m-1.5 h-11 min-h-11 rounded-lg bg-blue-600 px-8 font-bold hover:bg-blue-700"
            >
              Buscar
            </Button>
            </form>
          </div>

          <div className="relative h-20 min-w-0 overflow-hidden rounded-lg md:h-36 lg:h-56 xl:h-64 2xl:h-72">
            <Image
              src="/assets/avalia_symbol_search_banner_avalia_solar.webp"
              alt=""
              aria-hidden="true"
              fill
              sizes="(min-width: 1536px) 500px, (min-width: 1280px) 440px, (min-width: 1024px) 360px, (min-width: 768px) 160px, 100vw"
              className="object-cover object-right opacity-90 md:object-contain"
            />
          </div>
        </div>
      </section>

      <BannerSlot placement="search_top" className="mx-auto my-4 max-w-[1240px]" limit={2} />

      <section className="mx-auto max-w-[1240px] px-4 py-7 sm:px-6">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void performSearch()}
              className="mt-3 font-bold underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : loading ? (
          <SearchLoadingState />
        ) : (
          <>
            <SearchResultsHeader
              query={query}
              productsCount={filteredProducts.length}
              companiesCount={filteredCompanies.length}
              reviewsCount={results.reviews?.length || 0}
              sort={sort}
              onSortChange={handleSortChange}
            />

            <SearchTabs value={activeTab} counts={counts} onChange={handleTabChange} />

            <div className="mt-6 flex items-center justify-between lg:hidden">
              <p className="text-sm font-semibold text-slate-600">Refine sua busca</p>
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filtros
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[92vw] overflow-y-auto p-0 sm:max-w-sm">
                  <SheetHeader className="border-b border-slate-200 p-5 text-left">
                    <SheetTitle>Filtrar resultados</SheetTitle>
                  </SheetHeader>
                  <div className="p-4">
                    <SearchFilters
                      value={filters}
                      counts={counts}
                      categories={categories}
                      brands={brands}
                      onChange={setFilters}
                      onReset={resetFilters}
                      onApply={handleApplyFilters}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="mt-7 flex flex-col gap-7 lg:grid lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="w-full min-w-0">
                {visibleCount === 0 ? (
                  <SearchEmptyState onReset={resetFilters} />
                ) : (
                  <div className="space-y-10">
                    {showCompanies && filteredCompanies.length > 0 ? (
                      <ResultSection
                        icon={<Building2 className="h-5 w-5 text-blue-600" />}
                        title="Empresas"
                        count={paginationMeta.total_count || filteredCompanies.length}
                        action={
                          activeTab === 'all' ? (
                            <button
                              onClick={() => handleTabChange('companies')}
                              className="text-sm font-bold text-blue-700"
                            >
                              Ver todas as empresas
                            </button>
                          ) : undefined
                        }
                      >
                        <div className="flex flex-col gap-4">
                          {filteredCompanies.map((company) => (
                            <SearchCompanyListCard key={company.id} company={company} />
                          ))}
                        </div>

                        {paginationMeta.total_pages > 1 && (
                          <div className="mt-6 flex justify-center">
                            <Pagination>
                              <PaginationContent>
                                <PaginationItem>
                                  <PaginationPrevious
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      if (paginationMeta.page > 1)
                                        handlePageChange(paginationMeta.page - 1);
                                    }}
                                    className={
                                      paginationMeta.page <= 1
                                        ? 'pointer-events-none opacity-50'
                                        : ''
                                    }
                                  />
                                </PaginationItem>
                                {Array.from({ length: paginationMeta.total_pages }).map(
                                  (_, idx) => {
                                    const p = idx + 1;
                                    return (
                                      <PaginationItem key={p}>
                                        <PaginationLink
                                          href="#"
                                          isActive={p === paginationMeta.page}
                                          onClick={(e) => {
                                            e.preventDefault();
                                            handlePageChange(p);
                                          }}
                                        >
                                          {p}
                                        </PaginationLink>
                                      </PaginationItem>
                                    );
                                  }
                                )}
                                <PaginationItem>
                                  <PaginationNext
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      if (paginationMeta.page < paginationMeta.total_pages)
                                        handlePageChange(paginationMeta.page + 1);
                                    }}
                                    className={
                                      paginationMeta.page >= paginationMeta.total_pages
                                        ? 'pointer-events-none opacity-50'
                                        : ''
                                    }
                                  />
                                </PaginationItem>
                              </PaginationContent>
                            </Pagination>
                          </div>
                        )}
                      </ResultSection>
                    ) : null}

                    {showProducts && filteredProducts.length > 0 ? (
                      <ResultSection
                        icon={<Package className="h-5 w-5 text-blue-600" />}
                        title="Produtos"
                        count={filteredProducts.length}
                        action={
                          activeTab === 'all' ? (
                            <button
                              onClick={() => handleTabChange('products')}
                              className="text-sm font-bold text-blue-700"
                            >
                              Ver todos os produtos
                            </button>
                          ) : undefined
                        }
                      >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                          {filteredProducts.map((product) => (
                            <ProductCardEnhanced
                              key={product.id}
                              product={product}
                              favorite={productFavorites.has(product.id)}
                              onToggleFavorite={() =>
                                toggleFavorite(
                                  'product',
                                  product.id,
                                  productFavorites,
                                  setProductFavorites
                                )
                              }
                            />
                          ))}
                        </div>
                      </ResultSection>
                    ) : null}

                    {showReviews && results.reviews && results.reviews.length > 0 ? (
                      <ResultSection
                        icon={<Star className="h-5 w-5 text-amber-500 fill-amber-400" />}
                        title="Avaliações"
                        count={results.reviews.length}
                        action={
                          activeTab === 'all' ? (
                            <button
                              onClick={() => handleTabChange('reviews')}
                              className="text-sm font-bold text-blue-700"
                            >
                              Ver todas as avaliações
                            </button>
                          ) : undefined
                        }
                      >
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {results.reviews.map((review) => (
                            <ReviewCard key={review.id} review={review} />
                          ))}
                        </div>
                      </ResultSection>
                    ) : null}

                    {activeTab === 'all' &&
                    (results.categories.length > 0 || results.articles.length > 0) ? (
                      <RelatedResults categories={results.categories} articles={results.articles} />
                    ) : null}

                    <BannerSlot placement="search_mid" limit={1} />
                    <SearchCallToAction />
                  </div>
                )}
              </div>

              <aside className="hidden space-y-4 lg:block">
                <div className="sticky top-24 space-y-4">
                  <SearchFilters
                    value={filters}
                    counts={counts}
                    categories={categories}
                    brands={brands}
                    onChange={setFilters}
                    onReset={resetFilters}
                    onApply={handleApplyFilters}
                  />
                  <PopularList title="Marcas populares" items={brands.slice(0, 6)} />
                  <PopularList title="Categorias populares" items={categories.slice(0, 6)} />
                </div>
              </aside>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function ResultSection({
  icon,
  title,
  count,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-950">
          {icon}
          {title} <span className="text-sm font-medium text-slate-600">({count})</span>
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function PopularList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-bold text-slate-950">{title}</h3>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="text-sm text-slate-600">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RelatedResults({
  categories,
  articles,
}: {
  categories: SearchAllResponse['categories'];
  articles: SearchAllResponse['articles'];
}) {
  return (
    <section>
      <h2 className="text-lg font-bold text-slate-950">Categorias e conteúdos relacionados</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {categories.slice(0, 4).map((category) => (
          <Link
            key={`category-${category.id}`}
            href={buildCategoryPath(category.seo_url, category.id)}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 hover:border-blue-300 hover:text-blue-700"
          >
            <Tag className="h-4 w-4 text-blue-600" />
            <span className="min-w-0 flex-1 truncate">{category.name}</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>
        ))}
        {articles.slice(0, 4).map((article) => (
          <Link
            key={`article-${article.id}`}
            href={`/articles/${article.id}`}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 hover:border-blue-300 hover:text-blue-700"
          >
            <FileText className="h-4 w-4 text-blue-600" />
            <span className="min-w-0 flex-1 truncate">{article.title}</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function SearchCallToAction() {
  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
          <Search className="h-6 w-6" />
        </span>
        <div>
          <h2 className="font-bold text-slate-950">Não encontrou o que procura?</h2>
          <p className="mt-1 max-w-lg text-sm text-slate-600">
            Explore empresas verificadas ou solicite uma indicação para sua necessidade.
          </p>
        </div>
      </div>
      <div className="grid shrink-0 gap-2 sm:w-48">
        <Link
          href="/companies"
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-center text-xs font-bold text-white hover:bg-blue-700"
        >
          Explorar empresas
        </Link>
        <a
          href={`mailto:${CONTACT.team.email}?subject=${encodeURIComponent('Solicitação de indicação de empresa')}`}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-center text-xs font-bold text-slate-800 hover:border-blue-500 hover:text-blue-700"
        >
          Solicitar indicação
        </a>
      </div>
    </section>
  );
}

function SearchLoadingState() {
  return (
    <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div>
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-[390px] rounded-xl" />
          ))}
        </div>
      </div>
      <Skeleton className="hidden h-[560px] rounded-2xl lg:block" />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoadingState />}>
      <SearchPageContent />
    </Suspense>
  );
}
