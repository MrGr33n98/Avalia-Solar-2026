'use client';

import { FormEvent, Suspense, useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Building2,
  ChevronRight,
  FileText,
  Package,
  Search,
  SlidersHorizontal,
  Star,
  Tag,
} from 'lucide-react';
import { BannerSlot } from '@/components/banners/BannerSlot';
import { SearchCompanyListCard } from '@/components/search/SearchCompanyListCard';
import { EnterpriseSearchPagination } from '@/components/search/EnterpriseSearchPagination';
import { normalizeSearchPage, normalizeSearchPageSize } from '@/components/search/searchPagination';
import ReviewCard from '@/components/ReviewCard';
import { ProductCardEnhanced } from '@/components/search/ProductCardEnhanced';
import { SearchHero } from '@/components/search/SearchHero';
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
import type { Company, Product, SearchAllResponse } from '@/lib/api';
import { searchApi } from '@/lib/api';
import { companiesApiSafe } from '@/lib/api-client';
import { track, page as trackPage } from '@/lib/analytics/lazy';
import { CONTACT } from '@/lib/site';
import { buildCategoryPath } from '@/lib/slug';
import { useFirstDataVisible } from '@/lib/analytics/first-data-visible';

const normalize = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const getProductCategory = (product: Product) =>
  product.categories?.[0]?.name || product.category?.name || '';

const getProductBrand = (product: Product) => product.brand?.name || product.company?.name || '';

const getProductRating = (product: Product) => Number(product.company?.rating_avg || 0);

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

function SearchPageContent({ initialData, initialSearchParamsKey }: { initialData: SearchAllResponse | null; initialSearchParamsKey: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const seeded = initialSearchParamsKey === searchParams.toString() ? initialData : null;
  const query = searchParams.get('q') || '';
  const urlCity = searchParams.get('city') || '';
  const urlVerified = searchParams.get('verified') === 'true';
  const urlCategory = searchParams.get('category') || '';
  const urlBrand = searchParams.get('brand') || '';
  const urlPrice = searchParams.get('price') as PriceRange | null;
  const selectedPrice: PriceRange = urlPrice && ['all', 'under_1000', '1000_3000', '3000_5000', 'over_5000'].includes(urlPrice) ? urlPrice : 'all';
  const urlState = searchParams.get('state') || '';
  const pageParam = normalizeSearchPage(searchParams.get('page'));
  const pageSize = normalizeSearchPageSize(searchParams.get('per_page'));
  const tabParam = searchParams.get('tab');
  const sortParam = searchParams.get('sort');

  const [searchTerm, setSearchTerm] = useState(query);
  const [locationTerm, setLocationTerm] = useState(urlCity);
  const [results, setResults] = useState<
    Pick<SearchAllResponse, 'companies' | 'products' | 'categories' | 'articles' | 'reviews' | 'facets'>
  >(() => seeded ? {
    companies: seeded.companies || [],
    products: seeded.products || [],
    categories: seeded.categories || [],
    articles: seeded.articles || [],
    reviews: seeded.reviews || [],
    facets: seeded.facets || { categories: [] },
  } : { companies: [], products: [], categories: [], articles: [], reviews: [], facets: { categories: [] } });
  const [paginationMeta, setPaginationMeta] = useState<{
    page: number;
    total_pages: number;
    total_count: number;
  }>(() => {
    if (!seeded) return { page: 1, total_pages: 1, total_count: 0 };
    const page = normalizeSearchPage(searchParams.get('page'));
    const size = normalizeSearchPageSize(searchParams.get('per_page'));
    const count = seeded.counts?.companies ??
      (typeof seeded.meta?.total_count === 'number' ? seeded.meta.total_count : seeded.companies.length);
    return {
      page,
      total_pages: seeded.pagination?.total_pages || seeded.meta?.total_pages || Math.max(1, Math.ceil(count / size)),
      total_count: count,
    };
  });
  const [loading, setLoading] = useState(!seeded);
  const lastServerKeyRef = useRef<string | null>(seeded ? initialSearchParamsKey : null);
  const trackedServerKeyRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SearchTab>(isSearchTab(tabParam) ? tabParam : 'all');
  const [sort, setSort] = useState<SearchSort>(isSearchSort(sortParam) ? sortParam : 'relevance');
  const [filters, setFilters] = useState<SearchFilterState>({
    ...defaultSearchFilters,
    city: urlCity,
    verifiedOnly: urlVerified,
    category: urlCategory,
    brand: urlBrand,
    priceRange: selectedPrice,
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useFirstDataVisible('/search', results.companies.length + results.products.length, 'search_first_results');
  const previousPageRef = useRef(pageParam);
  const [productFavorites, setProductFavorites] = useState<Set<number>>(new Set());
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    setSearchTerm(query);
    setLocationTerm(urlCity);
    setFilters((current) => ({
      ...current,
      city: urlCity,
      verifiedOnly: urlVerified,
      category: urlCategory,
      brand: urlBrand,
      priceRange: selectedPrice,
    }));
  }, [query, urlCity, urlVerified, urlCategory, urlBrand, selectedPrice]);

  useEffect(() => {
    setActiveTab(isSearchTab(tabParam) ? tabParam : 'all');
  }, [tabParam]);

  useEffect(() => {
    setSort(isSearchSort(sortParam) ? sortParam : 'relevance');
  }, [sortParam]);

  // Follow page navigation into the result region without shifting on first load.
  useEffect(() => {
    if (previousPageRef.current === pageParam) return;
    previousPageRef.current = pageParam;
    document.getElementById('search-results')?.scrollIntoView({ block: 'start' });
  }, [pageParam]);

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

  const performSearch = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const apiFilters = {
        ...(urlCity ? { city: urlCity } : {}),
        ...(urlState ? { state: urlState } : {}),
        ...(urlVerified ? { verified: true } : {}),
        ...(urlCategory ? { category: urlCategory } : {}),
        sort: toApiSort(sort),
        page: pageParam,
        per_page: pageSize,
      };
      const response = await searchApi.all(query, apiFilters, signal);
      if (signal?.aborted) return;
      const companies = response.companies || [];
      const fallbackCompanies =
        query.trim() && companies.length === 0 && !urlVerified && !urlCategory
          ? await companiesApiSafe.getAll({
              q: query.trim(),
              ...(urlCity ? { city: urlCity } : {}),
              ...(urlState ? { state: urlState } : {}),
              status: 'active',
              sort: toApiSort(sort),
              page: pageParam,
              limit: pageSize,
              fields: 'card',
              signal,
            })
          : [];

      if (signal?.aborted) return;
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
        Math.max(1, Math.ceil(totalCompaniesCount / pageSize));

      setResults({
        companies: mergedCompanies,
        products: response.products || [],
        facets: response.facets || { categories: [] },
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
      if (signal?.aborted) return;
      setError(
        caughtError instanceof Error ? caughtError.message : 'Não foi possível realizar a busca.'
      );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [query, sort, urlCity, urlState, urlVerified, urlCategory, pageParam, pageSize]);

  useEffect(() => {
    const routeKey = searchParams.toString();
    if (initialData && initialSearchParamsKey === routeKey) {
      // App Router reuses Client Components across navigation. Reconcile the
      // fresh server payload instead of firing a duplicate browser fetch.
      if (lastServerKeyRef.current !== routeKey) {
        setResults({
          companies: initialData.companies || [],
          products: initialData.products || [],
          categories: initialData.categories || [],
          articles: initialData.articles || [],
          reviews: initialData.reviews || [],
          facets: initialData.facets || { categories: [] },
        });
        const rawCount = initialData.counts?.companies ??
          (typeof initialData.meta?.total_count === 'object'
            ? initialData.meta.total_count.companies
            : typeof initialData.meta?.total_count === 'number'
              ? initialData.meta.total_count : undefined);
        const total = typeof rawCount === 'number' ? rawCount : initialData.companies.length;
        setPaginationMeta({
          page: pageParam,
          total_pages: initialData.pagination?.total_pages || initialData.meta?.total_pages ||
            Math.max(1, Math.ceil(total / pageSize)),
          total_count: Math.max(total, initialData.companies.length),
        });
        setLoading(false);
        setError(null);
        lastServerKeyRef.current = routeKey;
      }
      if (trackedServerKeyRef.current !== routeKey) {
        track('search_results_loaded', {
          search_term: query,
          city: urlCity || undefined,
          products_count: initialData.products?.length || 0,
          companies_count: initialData.companies?.length || 0,
        });
        trackedServerKeyRef.current = routeKey;
      }
      return;
    }
    const controller = new AbortController();
    void performSearch(controller.signal);
    return () => controller.abort();
  }, [performSearch, initialSearchParamsKey, searchParams, initialData, pageParam, pageSize, query, urlCity]);

  // Avoid trapping users on an out-of-range deep link after a filter changes.
  useEffect(() => {
    if (loading || paginationMeta.page !== pageParam || paginationMeta.total_count === 0) return;
    if ((activeTab !== 'companies' && activeTab !== 'all') || pageParam <= paginationMeta.total_pages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(paginationMeta.total_pages));
    startTransition(() => router.replace(`/search?${params.toString()}`, { scroll: false }));
  }, [loading, paginationMeta, pageParam, activeTab, searchParams, router]);

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
          ...(results.facets?.categories || []).map((category) => category.name),
          filters.category,
        ])
      )
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [results, filters.category]
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

  // Filtering and company ordering happen on the complete set in the API.
  const filteredCompanies = filters.includeCompanies ? results.companies : [];

  const counts: Record<SearchTab, number> = {
    all: filteredProducts.length + (filters.includeCompanies ? paginationMeta.total_count : 0),
    products: filteredProducts.length,
    companies: filters.includeCompanies ? paginationMeta.total_count : 0,
    reviews: results.reviews?.length || 0,
  };

  const hrefForPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage <= 1) params.delete('page');
    else params.set('page', newPage.toString());
    return `/search?${params.toString()}`;
  };

  const handlePageSizeChange = (size: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('per_page', normalizeSearchPageSize(String(size)).toString());
    params.delete('page');
    startTransition(() => router.push(`/search?${params.toString()}`, { scroll: false }));
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
    startTransition(() => router.push(`/search?${params.toString()}`));
  };

  const handleTabChange = (tab: SearchTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'all') params.delete('tab');
    else params.set('tab', tab);
    params.delete('page');
    if (tab === 'companies' && (sort === 'price_asc' || sort === 'price_desc')) {
      params.delete('sort');
      setSort('relevance');
    }
    startTransition(() => router.replace(`/search?${params.toString()}`, { scroll: false }));
  };

  const handleSortChange = (nextSort: SearchSort) => {
    setSort(nextSort);
    const params = new URLSearchParams(searchParams.toString());
    if (nextSort === 'relevance') params.delete('sort');
    else params.set('sort', nextSort);
    params.delete('page');
    startTransition(() => router.replace(`/search?${params.toString()}`, { scroll: false }));
  };

  const handleCategorySelect = (categoryName: string) => {
    const nextCategory =
      filters.category.toLowerCase() === categoryName.toLowerCase() ? '' : categoryName;
    setFilters((current) => ({ ...current, category: nextCategory }));
    const params = new URLSearchParams(searchParams.toString());
    if (nextCategory) params.set('category', nextCategory);
    else params.delete('category');
    params.delete('page');
    startTransition(() => router.replace(`/search?${params.toString()}`, { scroll: false }));
  };

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (filters.city.trim()) params.set('city', filters.city.trim());
    else params.delete('city');
    if (filters.verifiedOnly) params.set('verified', 'true');
    else params.delete('verified');
    if (filters.category.trim()) params.set('category', filters.category.trim());
    else params.delete('category');
    if (filters.brand.trim()) params.set('brand', filters.brand.trim());
    else params.delete('brand');
    if (filters.priceRange !== 'all') params.set('price', filters.priceRange);
    else params.delete('price');
    params.delete('page');
    startTransition(() => router.replace(`/search?${params.toString()}`, { scroll: false }));
    setMobileFiltersOpen(false);
  };

  const resetFilters = () => {
    setFilters(defaultSearchFilters);
    setLocationTerm('');
    const params = new URLSearchParams(searchParams.toString());
    ['city', 'state', 'verified', 'category', 'brand', 'price', 'page'].forEach((key) => params.delete(key));
    startTransition(() => router.replace(`/search?${params.toString()}`, { scroll: false }));
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
      <SearchHero
        searchTerm={searchTerm}
        locationTerm={locationTerm}
        onSearchTermChange={setSearchTerm}
        onLocationTermChange={setLocationTerm}
        onSubmit={handleSubmit}
        categories={categories}
        selectedCategory={filters.category}
        onSelectCategory={handleCategorySelect}
      />

      <BannerSlot placement="search_top" className="mx-auto my-3 max-w-[1240px]" limit={2} />

      <section id="search-results" aria-busy={isPending || loading} className="relative mx-auto max-w-[1240px] scroll-mt-24 px-4 pt-3 pb-8 sm:px-6">
        {isPending && (
          <span role="status" aria-live="polite" className="pointer-events-none absolute right-4 top-0 z-10 rounded-md bg-white px-2 py-1 text-xs font-medium text-blue-700 shadow-sm">
            Atualizando resultados…
          </span>
        )}
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
              companiesCount={paginationMeta.total_count}
              reviewsCount={results.reviews?.length || 0}
              sort={activeTab === 'companies' && (sort === 'price_asc' || sort === 'price_desc') ? 'relevance' : sort}
              showPriceSort={activeTab !== 'companies'}
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
                      activeTab={activeTab}
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

                        <EnterpriseSearchPagination
                          page={paginationMeta.page}
                          totalPages={paginationMeta.total_pages}
                          totalCount={paginationMeta.total_count}
                          perPage={pageSize}
                          hrefForPage={hrefForPage}
                          onPageSizeChange={handlePageSizeChange}
                        />
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
                        <div className="search-products-container w-full">
                          <div className="search-products-grid grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
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
                                density="compact"
                              />
                            ))}
                          </div>
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
                      activeTab={activeTab}
                    value={filters}
                    counts={counts}
                    categories={categories}
                    brands={brands}
                    onChange={setFilters}
                    onReset={resetFilters}
                    onApply={handleApplyFilters}
                  />
                  <PopularList title="Marcas disponíveis" items={brands.slice(0, 6)} />
                  <PopularList title="Categorias disponíveis" items={categories.slice(0, 6)} />
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
        <div className="mt-8 search-products-grid grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-[324px] rounded-lg" />
          ))}
        </div>
      </div>
      <Skeleton className="hidden h-[560px] rounded-2xl lg:block" />
    </div>
  );
}

export default function SearchPageClient({ initialData, initialSearchParamsKey }: { initialData: SearchAllResponse | null; initialSearchParamsKey: string }) {
  return (
    <Suspense fallback={<SearchLoadingState />}>
      <SearchPageContent initialData={initialData} initialSearchParamsKey={initialSearchParamsKey} />
    </Suspense>
  );
}
