'use client';

import { useState, useMemo, useEffect, Suspense, useTransition } from 'react';
import type { InitialProductsPayload } from '@/lib/server/performance/types';
import { ProductSpecFilterValue, useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductsHeader } from '@/components/products/ProductsHeader';
import { ProductsFilters } from '@/components/products/ProductsFilters';
import { ProductCategoryRail } from '@/components/products/ProductCategoryRail';
import { ProductViewToggle } from '@/components/products/ProductViewToggle';
import { Button } from '@/components/ui/button';
import { Filter, Building2, ChevronRight, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePageTracking } from '@/hooks/usePageTracking';
import { useDebounce } from '@/hooks/useDebounce';
import Link from 'next/link';
import { track } from '@/lib/analytics/lazy';
import { markAfterPaint } from '@/lib/analytics/route-performance';

function ProductsPageContent({ initialPage }: { initialPage?: InitialProductsPayload }) {
  // GTM Page Tracking
  usePageTracking({
    type: 'other',
    title: 'Produtos - Avalia Solar',
  });

  const searchParams = useSearchParams();
  const router = useRouter();
  const [isRoutePending, startRouteTransition] = useTransition();

  // Pagination State
  const [currentPage, setCurrentPage] = useState(() => Math.max(1, Number(searchParams.get('page') || 1) || 1));
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list'); // Lista como padrão
  const itemsPerPage = 12;

  // Filter States — initialised from URL for shareability / back-navigation
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [filters, setFilters] = useState({
    category: searchParams.get('category_id') || searchParams.get('category') || 'all',
    company: searchParams.get('company_id') || searchParams.get('company') || 'all',
    brand: searchParams.get('brand_id') || 'all',
    priceRange: [
      Number(searchParams.get('price_min') || 0),
      Number(searchParams.get('price_max') || 50000)
    ] as [number, number],
    sort: searchParams.get('sort') || 'relevance',
    specs: {} as Record<string, ProductSpecFilterValue>,
    minRating: 'all' as string,
    onlyVerified: false as boolean,
    onlyTested: false as boolean
  });

  // Debounce price range to avoid hammering the URL on every slider tick
  const debouncedPriceRange = useDebounce(filters.priceRange, 300);

  // Debounce search query for backend calls
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  const hasActiveSpecFilters = useMemo(
    () => Object.values(filters.specs || {}).some((value) => value !== undefined && value !== null && value !== '' && value !== 'all'),
    [filters.specs]
  );

  // Build backend params — search/category/sort delegated to backend
  const hookParams = useMemo(() => ({
    q: debouncedSearchQuery || undefined,
    category_id: filters.category !== 'all' ? Number(filters.category) : undefined,
    company_id: filters.company !== 'all' ? Number(filters.company) : undefined,
    brand_id: filters.brand !== 'all' ? Number(filters.brand) : undefined,
    price_min: debouncedPriceRange[0] > 0 ? debouncedPriceRange[0] : undefined,
    price_max: debouncedPriceRange[1] > 0 && debouncedPriceRange[1] !== 50000 ? debouncedPriceRange[1] : undefined,
    sort: filters.sort !== 'relevance' ? filters.sort : undefined,
    page: currentPage,
    per_page: itemsPerPage,
    include_specs: hasActiveSpecFilters || undefined,
  }), [debouncedSearchQuery, filters.category, filters.company, filters.brand, filters.sort, debouncedPriceRange, currentPage, itemsPerPage, hasActiveSpecFilters]);

  const {
    products,
    filtersMeta,
    categoriesMeta,
    companiesMeta,
    brandsMeta,
    priceRangeMeta,
    loading,
    error,
    total,
    totalPages
  } = useProducts(hookParams, initialPage);

  useEffect(() => {
    if (loading) return;
    const fields = { route: '/products', result_count: products.length, source: 'client_post_paint' };
    const cancelData = markAfterPaint('first_data_visible', fields);
    const cancelProduct = products.length ? markAfterPaint('products_first_card_painted', fields) : () => {};
    return () => { cancelData(); cancelProduct(); };
  }, [loading, products]);

  // Telemetria: busca/resultados carregados
  useEffect(() => {
    if (!loading) {
      track('search_results_loaded', {
        search_term: debouncedSearchQuery || '',
        results_count: total,
      });
    }
  }, [loading, debouncedSearchQuery, total]);

  const maxPrice = Math.max(Math.ceil((priceRangeMeta.max || 0) / 100) * 100, 0);
  const selectedCategoryName =
    filters.category === 'all'
      ? 'Todas as categorias'
      : categoriesMeta.find((category) => String(category.id) === filters.category)?.name || 'Categoria selecionada';

  // Preserve an unbounded initial price filter; applying API max here would
  // immediately trigger a second request during hydration.

  // Sync filters to URL for shareability / back-navigation
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearchQuery) params.set('search', debouncedSearchQuery);
    if (filters.category !== 'all') params.set('category_id', filters.category);
    if (filters.company !== 'all') params.set('company_id', filters.company);
    if (filters.brand !== 'all') params.set('brand_id', filters.brand);
    if (filters.sort !== 'relevance') params.set('sort', filters.sort);
    if (debouncedPriceRange[0] > 0) params.set('price_min', String(debouncedPriceRange[0]));
    if (debouncedPriceRange[1] < maxPrice && debouncedPriceRange[1] !== 50000) params.set('price_max', String(debouncedPriceRange[1]));
    if (currentPage > 1) params.set('page', String(currentPage));
    const nextUrl = `/products${params.toString() ? `?${params.toString()}` : ''}`;
    // Avoid a redundant RSC navigation on first hydration or unchanged filters.
    if (typeof window !== 'undefined' && nextUrl === window.location.pathname + window.location.search) return;
    startRouteTransition(() => router.replace(nextUrl, { scroll: false }));
  }, [debouncedSearchQuery, filters.category, filters.company, filters.brand, filters.sort, debouncedPriceRange, router, maxPrice, currentPage, startRouteTransition]);

  const activeSpecFilters = useMemo(() => Object.entries(filters.specs || {}).filter(([, value]) =>
    value !== undefined && value !== null && value !== '' && value !== 'all'
  ), [filters.specs]);

  // Local filtering — price range, spec, rating, verified and tested filters applied client-side
  // (search, category, sort are handled by the backend)
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Minimum rating filter
      if (filters.minRating && filters.minRating !== 'all') {
        const rating = Number(product.company?.rating_avg || 0);
        if (rating < Number(filters.minRating)) return false;
      }

      // Verified filter
      if (filters.onlyVerified) {
        if (!product.company?.verified) return false;
      }

      // Tested by specialists (featured) filter
      if (filters.onlyTested) {
        if (!product.featured) return false;
      }

      // Dynamic spec filters
      if (activeSpecFilters.length > 0) {
        const specMap: Record<string, unknown> = {};
        if (product.specs && Array.isArray(product.specs)) {
          product.specs.forEach((spec) => {
            specMap[spec.key] = spec.value;
          });
        }

        for (const [key, selected] of activeSpecFilters) {
          const current = specMap[key];
          if (current === undefined) return false;

          if (Array.isArray(selected) && selected.length === 2 && typeof selected[0] === 'number') {
            const numeric = typeof current === 'number' ? current : parseFloat(String(current ?? '0'));
            if (numeric < selected[0] || numeric > selected[1]) return false;
          } else if (typeof selected === 'boolean') {
            if (!!current !== selected) return false;
          } else {
            // Enhanced client-side filter: match if current contains selected string (case-insensitive)
            const currentStr = String(current).toLowerCase();
            const selectedStr = String(selected).toLowerCase();
            if (!currentStr.includes(selectedStr)) return false;
          }
        }
      }

      return true;
    });
  }, [products, activeSpecFilters, filters.minRating, filters.onlyVerified, filters.onlyTested]);

  const paginatedProducts = filteredProducts;

  const handleFilterChange = (
    key: keyof typeof filters,
    value: any
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset page on filter change
    
    // Telemetria: filtro aplicado
    track('filter_applied', {
      filter_key: key,
      filter_value: value
    });
  };

  const clearFilters = () => {
    setFilters({
      category: 'all',
      company: 'all',
      brand: 'all',
      priceRange: [0, maxPrice],
      sort: 'relevance',
      specs: {},
      minRating: 'all',
      onlyVerified: false,
      onlyTested: false
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  const formattedTotal = total.toLocaleString('pt-BR');
  const resultNoun = total === 1 ? 'resultado encontrado' : 'resultados encontrados';

  if (error) {
    return (
        <div className="container mx-auto p-8 text-center bg-white rounded-xl border border-red-100 shadow-sm mt-10 max-w-xl">
            <h2 className="text-2xl font-bold text-red-600 mb-2">Erro ao carregar produtos</h2>
            <p className="text-slate-500">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4 bg-red-600 hover:bg-red-700 text-white">
              Tentar Novamente
            </Button>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20" aria-busy={isRoutePending}>
      <span className="sr-only" role="status">{isRoutePending ? 'Atualizando produtos' : ''}</span>
      <ProductsHeader />
      {/* Categorias compactas em carrossel horizontal: mobile, PWA e desktop. */}
      <ProductCategoryRail
        categories={categoriesMeta}
        selectedCategoryId={filters.category}
        isLoading={loading && categoriesMeta.length === 0}
        onCategoryChange={(category) => {
          if (category.categoryId === null) return;
          const nextId =
            String(category.categoryId) === filters.category
              ? 'all'
              : String(category.categoryId);
          handleFilterChange('category', nextId);
          track('product_category_selected', {
            category_id: category.categoryId,
            category_key: category.key,
            selected: nextId !== 'all',
            page: '/products',
          });
        }}
      />

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/50 pb-5">
          <div className="text-left">
            <span className="text-sm font-bold text-slate-500">
              {formattedTotal} {total === 1 ? 'produto encontrado' : 'produtos encontrados'}
            </span>
          </div>

          <div className="flex w-full flex-wrap items-center justify-end gap-2 self-end sm:w-auto sm:gap-3 sm:self-auto">
            <div className="flex items-center gap-2">
              <span className="hidden text-xs font-bold uppercase tracking-wider text-slate-400 sm:inline">Ordenar por</span>
              <Select value={filters.sort} onValueChange={(val) => handleFilterChange('sort', val)}>
                <SelectTrigger className="h-10 w-36 rounded-lg border-slate-200 bg-white px-3 text-xs font-semibold shadow-sm sm:w-44">
                  <SelectValue placeholder="Mais relevantes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Mais relevantes</SelectItem>
                  <SelectItem value="price_asc">Menor preço</SelectItem>
                  <SelectItem value="price_desc">Maior preço</SelectItem>
                  <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Alternador de layout compacto, com alvos acessíveis e sem overflow no PWA. */}
            <ProductViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          </div>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Mobile Filter Button & Sheet */}
          <div className="lg:hidden mb-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full flex items-center justify-center gap-2 h-11 border-slate-200">
                  <Filter className="w-4 h-4" />
                  Filtrar e Ordenar
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto bg-white p-6">
                <div className="py-4">
                  <ProductsFilters 
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    activeSpecFilters={filters.specs}
                    onSpecFilterChange={(key, value) => handleFilterChange('specs', { ...filters.specs, [key]: value })}
                    specFiltersMeta={filtersMeta}
                    categories={categoriesMeta}
                    companies={companiesMeta}
                    brands={brandsMeta}
                    maxPrice={maxPrice}
                    onClearFilters={clearFilters}
                    showSort={false}
                    totalProducts={total}
                    companiesCount={0}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Sidebar Filters */}
          <aside className="hidden w-64 flex-shrink-0 lg:block">
            <div className="sticky top-24 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <ProductsFilters 
                filters={filters}
                onFilterChange={handleFilterChange}
                activeSpecFilters={filters.specs}
                onSpecFilterChange={(key, value) => handleFilterChange('specs', { ...filters.specs, [key]: value })}
                specFiltersMeta={filtersMeta}
                categories={categoriesMeta}
                companies={companiesMeta}
                brands={brandsMeta}
                maxPrice={maxPrice}
                onClearFilters={clearFilters}
                showSort={false}
                totalProducts={total}
                companiesCount={0}
              />
            </div>
          </aside>

          {/* Product Grid / Main content */}
          <main className="flex-1">
            {loading ? (
              <div className={cn(
                "gap-5",
                viewMode === 'grid'
                  ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
                  : "flex flex-col w-full"
              )}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={cn(
                    "flex bg-white rounded-2xl border border-slate-200 p-5",
                    viewMode === 'grid' ? "flex-col space-y-3" : "flex-row gap-5"
                  )}>
                    <Skeleton className={cn("bg-slate-100 rounded-xl", viewMode === 'grid' ? "h-[190px] w-full" : "h-36 w-48 shrink-0")} />
                    <div className="flex-1 space-y-3 py-1">
                      <Skeleton className="h-4 w-3/4 bg-slate-100" />
                      <Skeleton className="h-4 w-1/2 bg-slate-100" />
                      <Skeleton className="h-6 w-1/4 bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : paginatedProducts.length > 0 ? (
              <div className="space-y-8">
                <div className={cn(
                  "mb-8 gap-5",
                  viewMode === 'grid'
                    ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
                    : "flex flex-col w-full"
                )}>
                  {paginatedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      layout={viewMode === 'list' ? 'horizontal' : 'vertical'}
                    />
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination className="pt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#" 
                          onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1)); }}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink 
                            href="#" 
                            isActive={currentPage === i + 1}
                            onClick={(e) => { e.preventDefault(); setCurrentPage(i + 1); }}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext 
                          href="#" 
                          onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.min(totalPages, p + 1)); }}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            ) : (
              /* Enhanced Empty State */
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white rounded-2xl border border-slate-200 shadow-sm max-w-3xl mx-auto">
                <div className="bg-blue-50 p-4 rounded-full mb-4 text-blue-500 shadow-inner">
                  <Filter className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-slate-900">Poucos produtos encontrados nesta categoria</h3>
                <p className="text-slate-500 max-w-md mt-2 text-sm">
                  Não encontramos correspondência exata para estes filtros de busca. Tente buscar um termo diferente ou use nossas opções rápidas abaixo:
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl mt-6">
                  <Button variant="outline" onClick={clearFilters} className="h-12 border-slate-200 text-slate-700 text-xs font-bold gap-2">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Limpar filtros
                  </Button>
                  <Button variant="outline" asChild className="h-12 border-slate-200 text-slate-700 text-xs font-bold gap-2">
                    <Link href="/companies">
                      <Building2 className="w-3.5 h-3.5" />
                      Ver empresas
                    </Link>
                  </Button>
                  <Button className="h-12 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold gap-2 shadow-sm shadow-blue-100">
                    Indicação Avalia Solar
                  </Button>
                </div>

                {/* Related links block in empty state */}
                <div className="w-full border-t border-slate-100 mt-10 pt-8 text-left">
                  <h4 className="font-bold text-slate-800 text-sm mb-4">Veja também:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link href="/blog" className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border hover:border-slate-200 transition-all text-xs font-semibold text-slate-700">
                      <span className="truncate">Guias e análises de equipamentos</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </Link>
                    <Link href="/companies" className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border hover:border-slate-200 transition-all text-xs font-semibold text-slate-700">
                      <span className="truncate">Empresas qualificadas com instalação</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPageClient({ initialPage }: { initialPage?: InitialProductsPayload }) {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-[400px] w-full max-w-4xl bg-slate-100" />
      </div>
    }>
      <ProductsPageContent initialPage={initialPage} />
    </Suspense>
  );
}
