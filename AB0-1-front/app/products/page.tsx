'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { ProductSpecFilterValue, useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductsHeader } from '@/components/products/ProductsHeader';
import { ProductsFilters } from '@/components/products/ProductsFilters';
import { FeaturedCompaniesStrip } from '@/components/products/FeaturedCompaniesStrip';
import { Button } from '@/components/ui/button';
import { Filter, Building2, ChevronRight, RefreshCw } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePageTracking } from '@/hooks/usePageTracking';
import { useDebounce } from '@/hooks/useDebounce';
import Link from 'next/link';
import { useBannersQuery } from '@/hooks/useBannersQuery';
import { BannerContainer } from '@/components/BannerContainer';
import { track } from '@/lib/analytics/lazy';

function ProductsPageContent() {
  // GTM Page Tracking
  usePageTracking({
    type: 'other',
    title: 'Produtos - Avalia Solar',
  });

  const searchParams = useSearchParams();
  const router = useRouter();

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
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
    specs: {} as Record<string, ProductSpecFilterValue>
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
  } = useProducts(hookParams);

  // Buscar banners dinâmicos por categoria ou posição global
  const { data: topBanners = [] } = useBannersQuery({
    position: 'products_top',
    category_id: filters.category !== 'all' ? filters.category : undefined,
    enabled: true
  });
  const visibleTopBanners = useMemo(
    () => topBanners
      .filter((banner) => Boolean(banner.image_url))
      .map((banner) => ({
        ...banner,
        image_url: banner.image_url ?? null,
      })),
    [topBanners]
  );

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
  const companySummaries = useMemo(() => {
    return companiesMeta
      .map((company) => ({
        name: company.name,
        slug: company.slug || String(company.id),
        logo_url: company.logo_url || undefined,
        productCount: company.products_count,
        isVerified: company.verified ?? false,
        rating: company.rating_avg ?? undefined,
        city: [company.city, company.state].filter(Boolean).join(', ') || undefined,
      }))
      .sort((a, b) => b.productCount - a.productCount)
      .slice(0, 10);
  }, [companiesMeta]);

  // Update max price in filters when data loads
  useEffect(() => {
    if (maxPrice > 0 && filters.priceRange[1] === 50000) {
      setFilters(prev => ({ ...prev, priceRange: [0, maxPrice] }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxPrice]);

  // Sync filters to URL for shareability / back-navigation
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (filters.category !== 'all') params.set('category_id', filters.category);
    if (filters.company !== 'all') params.set('company_id', filters.company);
    if (filters.brand !== 'all') params.set('brand_id', filters.brand);
    if (filters.sort !== 'relevance') params.set('sort', filters.sort);
    if (debouncedPriceRange[0] > 0) params.set('price_min', String(debouncedPriceRange[0]));
    if (debouncedPriceRange[1] < maxPrice && debouncedPriceRange[1] !== 50000) params.set('price_max', String(debouncedPriceRange[1]));
    router.replace(`/products${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
  }, [searchQuery, filters.category, filters.company, filters.brand, filters.sort, debouncedPriceRange, router, maxPrice]);

  // Local filtering — only price range and spec filters applied client-side
  // (search, category, sort are handled by the backend)
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Dynamic spec filters
      const activeSpecFilters = Object.entries(filters.specs || {}).filter(
        ([, value]) => value !== undefined && value !== null && value !== '' && value !== 'all'
      );

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
  }, [products, filters.specs]);

  const paginatedProducts = filteredProducts;

  const handleFilterChange = (
    key: 'category' | 'company' | 'brand' | 'priceRange' | 'sort' | 'specs',
    value: string | [number, number] | Record<string, ProductSpecFilterValue> | undefined
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset page on filter change
    
    // Telemetria: filtro aplicado
    if (key === 'specs') {
      track('filter_applied', {
        filter_key: 'specs',
        filter_value: value
      });
    } else {
      track('filter_applied', {
        filter_key: key,
        filter_value: value
      });
    }
  };

  const clearFilters = () => {
    setFilters({
      category: 'all',
      company: 'all',
      brand: 'all',
      priceRange: [0, maxPrice],
      sort: 'relevance',
      specs: {}
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  const categoryChips = useMemo(() => [
    { label: "Todos", value: "all" },
    ...categoriesMeta.slice(0, 8).map((category) => ({
      label: category.name,
      value: String(category.id),
    })),
  ], [categoriesMeta]);

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
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <ProductsHeader
          totalProducts={total}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearFilters={clearFilters}
          selectedCategory={selectedCategoryName}
        />

        {/* Categories Quick Chips */}
        <div className="mb-6 flex overflow-x-auto whitespace-nowrap scrollbar-none pb-2 gap-2 border-b border-slate-100">
          {categoryChips.map((chip) => {
            const isActive = filters.category === chip.value;
            return (
              <button
                key={chip.value}
                onClick={() => {
                  handleFilterChange('category', chip.value);
                  track('quick_filter_click', { filter_id: chip.value });
                }}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Banner container dinâmico */}
        {!loading && visibleTopBanners.length > 0 && (
          <BannerContainer banners={visibleTopBanners} position="products_top" className="mb-6 animate-in fade-in duration-300" />
        )}

        {/* Featured Companies Strip */}
        {!loading && companySummaries.length > 0 && paginatedProducts.length > 1 && (
          <FeaturedCompaniesStrip companies={companySummaries} />
        )}

        <div className="flex flex-col lg:flex-row gap-8">
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
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
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
              />
            </div>
          </aside>

          {/* Product Grid / Main content */}
          <main className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col space-y-3 bg-white p-4 rounded-xl border">
                    <Skeleton className="h-[200px] w-full rounded-lg bg-slate-100" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full bg-slate-100" />
                      <Skeleton className="h-4 w-3/4 bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : paginatedProducts.length > 0 ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
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

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-[400px] w-full max-w-4xl bg-slate-100" />
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  );
}
