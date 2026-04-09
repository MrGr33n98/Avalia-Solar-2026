'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductsHeader } from '@/components/products/ProductsHeader';
import { ProductsFilters } from '@/components/products/ProductsFilters';
import { FeaturedCompaniesStrip } from '@/components/products/FeaturedCompaniesStrip';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePageTracking } from '@/hooks/usePageTracking';
import { useDebounce } from '@/hooks/useDebounce';

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
    category: searchParams.get('category') || 'all',
    company: searchParams.get('company') || 'all',
    priceRange: [
      Number(searchParams.get('price_min') || 0),
      Number(searchParams.get('price_max') || 50000)
    ] as [number, number],
    sort: searchParams.get('sort') || 'relevance',
    specs: {} as Record<string, any>
  });

  // Debounce price range to avoid hammering the URL on every slider tick
  const debouncedPriceRange = useDebounce(filters.priceRange, 300);

  // Debounce search query for backend calls
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  // Build backend params — search/category/sort delegated to backend
  const hookParams = useMemo(() => ({
    q: debouncedSearchQuery || undefined,
    sort: filters.sort !== 'relevance' ? filters.sort : undefined,
    page: currentPage,
    per_page: itemsPerPage,
  }), [debouncedSearchQuery, filters.sort, currentPage, itemsPerPage]);

  const { products, filtersMeta, loading, error, total, totalPages } = useProducts(hookParams);

  // Derived Data for Filters & Featured Companies
  const { categories, companies, maxPrice, companySummaries } = useMemo(() => {
    if (!products.length) return { categories: [], companies: [], maxPrice: 50000, companySummaries: [] };

    const cats = new Set<string>();
    const comps = new Set<string>();
    const compStats: Record<string, number> = {};
    const compData: Record<string, { logo_url?: string; verified?: boolean; rating?: number; city?: string }> = {};
    let maxP = 0;

    products.forEach(p => {
      // Categories extraction
      if ((p as any).categories && Array.isArray((p as any).categories)) {
        (p as any).categories.forEach((c: any) => cats.add(c.name));
      } else if (p.category?.name) {
        cats.add(p.category.name);
      }

      // Company extraction — prefer richer data if available
      if (p.company?.name) {
        const name = p.company.name;
        comps.add(name);
        compStats[name] = (compStats[name] || 0) + 1;
        if (!compData[name]) {
          compData[name] = {
            logo_url: (p.company as any).logo_url || undefined,
            verified: (p.company as any).verified ?? false,
            rating: (p.company as any).rating_avg ?? undefined,
            city: (p.company as any).city || undefined,
          };
        } else if (!compData[name].logo_url && (p.company as any).logo_url) {
          // Backfill logo_url if first product for this company didn't have it
          compData[name].logo_url = (p.company as any).logo_url;
        }
      }

      // Price extraction
      const price = typeof p.price === 'number' ? p.price : parseFloat(p.price || '0');
      if (price > maxP) maxP = price;
    });

    const companySummaries = Array.from(comps).map(name => ({
        name,
        logo_url: compData[name]?.logo_url,
        productCount: compStats[name],
        isVerified: compData[name]?.verified ?? false,
        rating: compData[name]?.rating,
        city: compData[name]?.city,
    })).sort((a, b) => b.productCount - a.productCount).slice(0, 10);

    return {
      categories: Array.from(cats).sort(),
      companies: Array.from(comps).sort(),
      maxPrice: Math.ceil(maxP / 100) * 100, // Round up to nearest 100
      companySummaries
    };
  }, [products]);

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
    if (filters.category !== 'all') params.set('category', filters.category);
    if (filters.company !== 'all') params.set('company', filters.company);
    if (filters.sort !== 'relevance') params.set('sort', filters.sort);
    if (debouncedPriceRange[0] > 0) params.set('price_min', String(debouncedPriceRange[0]));
    if (debouncedPriceRange[1] < maxPrice && debouncedPriceRange[1] !== 50000) params.set('price_max', String(debouncedPriceRange[1]));
    router.replace(`/products${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
  }, [searchQuery, filters.category, filters.company, filters.sort, debouncedPriceRange, router, maxPrice]);

  // Local filtering — only price range and spec filters applied client-side
  // (search, category, sort are handled by the backend)
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const price = typeof product.price === 'number' ? product.price : parseFloat(product.price || '0');

      // Company — still client-side (filtered by name, not ID)
      if (filters.company !== 'all') {
        if (product.company?.name !== filters.company) return false;
      }

      // Price range
      if (price < filters.priceRange[0] || price > filters.priceRange[1]) return false;

      // Dynamic spec filters
      const activeSpecFilters = Object.entries(filters.specs || {}).filter(
        ([, value]) => value !== undefined && value !== null && value !== '' && value !== 'all'
      );

      if (activeSpecFilters.length > 0) {
        const specMap: Record<string, any> = {};
        if ((product as any).specs && Array.isArray((product as any).specs)) {
          (product as any).specs.forEach((s: any) => {
            specMap[s.key] = s.value;
          });
        }

        for (const [key, selected] of activeSpecFilters) {
          const current = specMap[key];
          if (current === undefined) return false;

          if (Array.isArray(selected) && selected.length === 2 && typeof selected[0] === 'number') {
            const numeric = typeof current === 'number' ? current : parseFloat(current || '0');
            if (numeric < selected[0] || numeric > selected[1]) return false;
          } else if (typeof selected === 'boolean') {
            if (!!current !== selected) return false;
          } else {
            if (String(current).toLowerCase() !== String(selected).toLowerCase()) return false;
          }
        }
      }

      return true;
    });
  }, [products, filters.company, filters.priceRange, filters.specs]);

  // Backend handles pagination — paginatedProducts is just the (optionally client-filtered) page
  const paginatedProducts = filteredProducts;

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset page on filter change
  };

  const clearFilters = () => {
    setFilters({
      category: 'all',
      company: 'all',
      priceRange: [0, maxPrice],
      sort: 'relevance',
      specs: {}
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  if (error) {
    return (
        <div className="container mx-auto p-8 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-2">Erro ao carregar produtos</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">Tentar Novamente</Button>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <ProductsHeader
          totalProducts={total}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Featured Companies Strip */}
        {!loading && <FeaturedCompaniesStrip companies={companySummaries} />}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Filter Sheet */}
          <div className="lg:hidden mb-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filtrar e Ordenar
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
                <div className="py-4">
                  <ProductsFilters 
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    activeSpecFilters={filters.specs}
                    onSpecFilterChange={(key, value) => handleFilterChange('specs', { ...filters.specs, [key]: value })}
                    specFiltersMeta={filtersMeta}
                    categories={categories}
                    companies={companies}
                    maxPrice={maxPrice}
                    onClearFilters={clearFilters}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 bg-white p-6 rounded-lg border shadow-sm">
              <ProductsFilters 
                filters={filters}
                onFilterChange={handleFilterChange}
                activeSpecFilters={filters.specs}
                onSpecFilterChange={(key, value) => handleFilterChange('specs', { ...filters.specs, [key]: value })}
                specFiltersMeta={filtersMeta}
                categories={categories}
                companies={companies}
                maxPrice={maxPrice}
                onClearFilters={clearFilters}
              />
            </div>
          </aside>

          {/* Product Grid */}
          <main className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex flex-col space-y-3">
                    <Skeleton className="h-[250px] w-full rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : paginatedProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6 mb-8">
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination>
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
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-lg border border-dashed">
                <div className="bg-slate-50 p-4 rounded-full mb-4">
                    <Filter className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Nenhum produto encontrado</h3>
                <p className="text-slate-500 max-w-sm mt-2">
                  Não encontramos produtos correspondentes aos filtros selecionados. Tente limpar os filtros ou buscar por outro termo.
                </p>
                <Button variant="link" onClick={clearFilters} className="mt-4 text-primary">
                  Limpar todos os filtros
                </Button>
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
    <Suspense fallback={null}>
      <ProductsPageContent />
    </Suspense>
  );
}
