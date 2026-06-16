'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductsHeader } from '@/components/products/ProductsHeader';
import { ProductsFilters } from '@/components/products/ProductsFilters';
import { FeaturedCompaniesStrip } from '@/components/products/FeaturedCompaniesStrip';
import { Button } from '@/components/ui/button';
import { Filter, Star, Building2, HelpCircle, ArrowRight, RefreshCw } from 'lucide-react';
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

  // Buscar banners dinâmicos por categoria ou posição global
  const { data: topBanners = [] } = useBannersQuery({
    position: 'products_top',
    category_id: filters.category !== 'all' ? filters.category : undefined,
    enabled: true
  });

  // Telemetria: busca/resultados carregados
  useEffect(() => {
    if (!loading) {
      track('search_results_loaded', {
        search_term: debouncedSearchQuery || '',
        results_count: total,
      });
    }
  }, [loading, debouncedSearchQuery, total]);

  // Derived Data for Filters & Featured Companies
  const { categories, companies, maxPrice, companySummaries } = useMemo(() => {
    if (!products.length) return { categories: [], companies: [], maxPrice: 50000, companySummaries: [] };

    const cats = new Set<string>();
    const comps = new Set<string>();
    const compStats: Record<string, number> = {};
    const compData: Record<string, { logo_url?: string; verified?: boolean; rating?: number; city?: string; slug?: string }> = {};
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
            slug: p.company.slug || undefined,
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
        slug: compData[name]?.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        logo_url: compData[name]?.logo_url,
        productCount: compStats[name],
        isVerified: compData[name]?.verified ?? false,
        rating: compData[name]?.rating || 4.7,
        city: compData[name]?.city || 'São Paulo, SP',
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
            // Enhanced client-side filter: match if current contains selected string (case-insensitive)
            const currentStr = String(current).toLowerCase();
            const selectedStr = String(selected).toLowerCase();
            if (!currentStr.includes(selectedStr)) return false;
          }
        }
      }

      return true;
    });
  }, [products, filters.company, filters.priceRange, filters.specs]);

  const paginatedProducts = filteredProducts;

  const handleFilterChange = (key: string, value: any) => {
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
      priceRange: [0, maxPrice],
      sort: 'relevance',
      specs: {}
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Categories Quick Chips config
  const categoryChips = [
    { label: "Todos", value: "all" },
    { label: "Inversores", value: "Inversores" },
    { label: "Módulos Fotovoltaicos", value: "Módulos Fotovoltaicos" },
    { label: "Baterias", value: "Baterias" },
    { label: "Carregadores EV", value: "Carregadores EV" },
    { label: "String Box", value: "String Box" },
    { label: "Estruturas", value: "Estruturas" },
    { label: "Monitoramento", value: "Monitoramento" },
    { label: "Off-grid", value: "Off-grid" }
  ];

  const displayCompanies = companySummaries.slice(0, 3);

  // Produtos relacionados reais da mesma categoria
  const relatedRealProducts = useMemo(() => {
    if (paginatedProducts.length !== 1) return [];
    const currentProduct = paginatedProducts[0];
    const currentCategory = currentProduct.category?.name || (currentProduct as any).categories?.[0]?.name;
    if (!currentCategory) return [];

    return products
      .filter(p => {
        const catName = p.category?.name || (p as any).categories?.[0]?.name;
        return p.id !== currentProduct.id && catName === currentCategory;
      })
      .slice(0, 3);
  }, [products, paginatedProducts]);

  const showCompaniesWidget = displayCompanies.length > 0;
  const showRelatedProductsWidget = relatedRealProducts.length > 0;

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
          selectedCategory={filters.category}
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
        {!loading && topBanners && topBanners.length > 0 && (
          <BannerContainer banners={topBanners} position="products_top" className="mb-6 animate-in fade-in duration-300" />
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
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
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
                {/* 1 Result Wide View */}
                {paginatedProducts.length === 1 ? (
                  <div className="space-y-8">
                    <ProductCard product={paginatedProducts[0]} layout="horizontal" />
                    
                    {/* Supplementary widgets when 1 result is found */}
                    {(showCompaniesWidget || showRelatedProductsWidget) && (
                      <div className={`grid grid-cols-1 ${showCompaniesWidget && showRelatedProductsWidget ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-6 pt-4`}>
                        {/* Widget 1: Empresas que trabalham */}
                        {showCompaniesWidget && (
                          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-left flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-800 text-sm md:text-base">Empresas que trabalham com este produto</h3>
                                <Link href="/companies" className="text-xs text-blue-600 hover:underline font-semibold">Ver todas</Link>
                              </div>
                              <div className="space-y-3">
                                {displayCompanies.map((comp, idx) => (
                                  <div key={idx} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="bg-slate-100 p-1.5 rounded-full text-slate-400">
                                        <Building2 className="w-3.5 h-3.5" />
                                      </div>
                                      <div className="text-xs leading-tight min-w-0 text-left">
                                        <strong className="text-slate-700 block truncate">{comp.name}</strong>
                                        <span className="text-slate-400 block mt-0.5 text-[10px]">{comp.city}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                      <div className="flex text-amber-400 gap-0.5">
                                        <Star className="w-3 h-3 fill-current" />
                                      </div>
                                      <span className="text-[11px] font-bold text-slate-700">{(comp.rating || 4.8).toFixed(1)}</span>
                                      <Link href={`/companies/${comp.slug}`} className="text-[10px] text-blue-600 hover:underline font-bold ml-2">Perfil</Link>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Widget 2: Produtos relacionados */}
                        {showRelatedProductsWidget && (
                          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-left">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="font-bold text-slate-800 text-sm md:text-base">Produtos relacionados</h3>
                              <button onClick={clearFilters} className="text-xs text-blue-600 hover:underline font-semibold">Ver todos</button>
                            </div>
                            <div className="space-y-3">
                              {relatedRealProducts.map((p, idx) => {
                                const pPriceValue = typeof p.price === 'number' ? p.price : parseFloat(p.price || '0');
                                const pFriendlyUrl = `/products/${p.id}-${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
                                return (
                                  <Link key={idx} href={pFriendlyUrl} className="flex items-center gap-3 border-b border-slate-50 pb-2 last:border-0 last:pb-0 hover:bg-slate-50/50 transition-colors rounded-lg p-1 block">
                                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex-shrink-0 relative overflow-hidden flex items-center justify-center p-1 border">
                                      {p.image_url ? (
                                        <img src={p.image_url} alt={p.name} className="object-contain w-full h-full" />
                                      ) : (
                                        <Building2 className="w-5 h-5 text-slate-300" />
                                      )}
                                    </div>
                                    <div className="text-xs leading-tight text-left min-w-0">
                                      <strong className="text-slate-700 block truncate font-semibold">{p.name}</strong>
                                      <span className="text-blue-600 font-bold block mt-1">
                                        R$ {pPriceValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Assistance Banner CTA */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm text-left">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-3 rounded-full text-white hidden sm:block">
                          <HelpCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-base md:text-lg">Precisa de ajuda para escolher o equipamento ideal?</h4>
                          <p className="text-slate-600 text-sm mt-1">Solicite uma indicação gratuita e receba recomendações personalizadas da Avalia Solar.</p>
                        </div>
                      </div>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-6 gap-2 rounded-lg flex-shrink-0 shadow-sm shadow-blue-100">
                        Solicitar indicação gratuita
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Grid View for multiple results */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {paginatedProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}
                
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
