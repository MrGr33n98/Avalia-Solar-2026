'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { ProductSpecFilterValue, useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductsHeader } from '@/components/products/ProductsHeader';
import { ProductsFilters } from '@/components/products/ProductsFilters';
import { Button } from '@/components/ui/button';
import { Filter, Building2, ChevronRight, RefreshCw, Star, Grid, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePageTracking } from '@/hooks/usePageTracking';
import { useDebounce } from '@/hooks/useDebounce';
import Link from 'next/link';
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
  } = useProducts(hookParams);

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
  }, [products, filters.specs, filters.minRating, filters.onlyVerified, filters.onlyTested]);

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

  // Mapeamento dinâmico das categorias rápidas a partir do metadados da API
  const quickCategories = useMemo(() => {
    const findCat = (keywords: string[], exclude?: string[]) => {
      return categoriesMeta.find(c => {
        const slug = (c.slug || c.seo_url || '').toLowerCase();
        const matchesKeyword = keywords.some(k => slug.includes(k));
        const matchesExclude = exclude ? exclude.some(ex => slug.includes(ex)) : false;
        return matchesKeyword && !matchesExclude;
      });
    };

    const cats = [
      {
        key: 'inversores',
        name: 'Inversores',
        dbCat: findCat(['inversor'], ['micro']),
        defaultCount: 132,
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        )
      },
      {
        key: 'microinversores',
        name: 'Microinversores',
        dbCat: findCat(['microinversor']),
        defaultCount: 86,
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        )
      },
      {
        key: 'baterias',
        name: 'Baterias',
        dbCat: findCat(['bateria']),
        defaultCount: 54,
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
      },
      {
        key: 'carregadores',
        name: 'Carregadores VE',
        dbCat: findCat(['carregador']),
        defaultCount: 28,
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
      },
      {
        key: 'estruturas',
        name: 'Estruturas',
        dbCat: findCat(['estrutura', 'fixacao']),
        defaultCount: 64,
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        )
      },
      {
        key: 'cabos',
        name: 'Cabos e Acessórios',
        dbCat: findCat(['cabo', 'acessorio']),
        defaultCount: 102,
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
        )
      }
    ];

    return cats;
  }, [categoriesMeta]);

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <ProductsHeader
        totalProducts={total}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearFilters={clearFilters}
        selectedCategory={selectedCategoryName}
      />

      {/* Encontre o produto ideal para seu projeto */}
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        <h2 className="text-xl font-bold tracking-tight text-slate-800 text-left mb-6">
          Encontre o produto ideal para seu projeto
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {quickCategories.map((cat) => {
            const isSelected = cat.dbCat ? String(cat.dbCat.id) === filters.category : false;
            const count = cat.dbCat ? cat.dbCat.products_count : cat.defaultCount;
            
            return (
              <button
                key={cat.key}
                onClick={() => {
                  if (cat.dbCat) {
                    handleFilterChange('category', isSelected ? 'all' : String(cat.dbCat.id));
                  }
                }}
                className="flex flex-col items-center text-center group focus:outline-none transition-all w-full py-2"
              >
                <div className={cn(
                  "w-16 h-16 rounded-full border bg-white flex items-center justify-center shadow-sm transition-all mb-2.5",
                  isSelected 
                    ? "border-blue-600 ring-2 ring-blue-600/20 text-blue-600" 
                    : "border-slate-200/80 text-blue-500 group-hover:border-blue-500 group-hover:shadow-md group-hover:scale-105"
                )}>
                  <div className="w-6 h-6 flex items-center justify-center">
                    {cat.icon}
                  </div>
                </div>
                <strong className={cn(
                  "text-xs font-black leading-tight block w-full truncate px-1",
                  isSelected ? "text-blue-600 font-extrabold" : "text-slate-800"
                )}>
                  {cat.name}
                </strong>
                <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                  {count} {count === 1 ? 'produto' : 'produtos'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/50 pb-5">
          <div className="text-left">
            <span className="text-sm font-bold text-slate-500">
              {formattedTotal} {total === 1 ? 'produto encontrado' : 'produtos encontrados'}
            </span>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ordenar por</span>
              <Select value={filters.sort} onValueChange={(val) => handleFilterChange('sort', val)}>
                <SelectTrigger className="h-10 w-44 rounded-lg border-slate-200 bg-white px-3 text-xs font-semibold shadow-sm">
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

            {/* Alternador de Layout */}
            <div className="flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm h-10">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-8 w-8 rounded-md',
                  viewMode === 'list' && 'bg-blue-50 text-blue-600'
                )}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-8 w-8 rounded-md',
                  viewMode === 'grid' && 'bg-blue-50 text-blue-600'
                )}
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
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
