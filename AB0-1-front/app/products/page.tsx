'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { ProductSpecFilterValue, useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductsHeader } from '@/components/products/ProductsHeader';
import { ProductsFilters } from '@/components/products/ProductsFilters';
import { Button } from '@/components/ui/button';
import { Filter, Building2, ChevronRight, RefreshCw, Star } from 'lucide-react';
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
    <div className="min-h-screen bg-[#f4f7fb] pb-20">
      <ProductsHeader
        totalProducts={total}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearFilters={clearFilters}
        selectedCategory={selectedCategoryName}
      />

      {/* Seção Destaque do Especialista */}
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Destaque do Especialista</span>
            <h2 className="text-xl font-black text-slate-900 md:text-2xl mt-0.5">Aprovado por Especialistas do Setor</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr_320px]">
            {/* Esquerda: Selo de Qualidade */}
            <div className="flex flex-col items-center justify-center border-b border-slate-100 pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6 text-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-tight">Selo de Qualidade <br/> Avalia Solar - 4.8/5</span>
              <span className="text-6xl font-black text-slate-900 mt-3 leading-none">4.8</span>
              <div className="flex text-amber-400 mt-2 gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
            </div>

            {/* Centro: Produtos em Destaque */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:px-4">
              {/* Produto Destaque 1 (Maxeon) */}
              <div className="flex gap-4 rounded-2xl border border-slate-200/85 bg-slate-50/50 p-4 hover:border-blue-200 transition-all justify-between flex-col h-full">
                <div className="flex gap-3">
                  <div className="relative w-16 h-16 shrink-0 rounded-xl bg-white p-2 border border-slate-200 flex items-center justify-center">
                    <img src="/images/banner-avalia-solar-product-page.png" className="object-contain w-full h-full" alt="SunPower Maxeon" onError={(e)=>{e.currentTarget.src="/icones/icone_produtos_avalia_solar_40x40.png"}} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">PAINÉIS SOLARES</span>
                    <h3 className="text-xs font-black text-slate-900 leading-snug truncate">SunPower Maxeon 6 AC</h3>
                    <span className="text-[10px] font-bold text-slate-500 mt-0.5 block">SunPower</span>
                    <p className="text-[10px] text-slate-500 mt-1 leading-normal">Productw: 400W <br/> T6a medo: Hx <br/> 2x análise: 300 ms</p>
                  </div>
                </div>
                <Button variant="outline" className="h-9 w-full rounded-xl border border-slate-200 bg-white text-xs font-extrabold text-slate-700 hover:bg-slate-50 mt-3" asChild>
                  <Link href="/products?search=Maxeon">Ver Análise Completa</Link>
                </Button>
              </div>

              {/* Produto Destaque 2 (Microinverter) */}
              <div className="flex gap-4 rounded-2xl border border-slate-200/85 bg-slate-50/50 p-4 hover:border-blue-200 transition-all justify-between flex-col h-full">
                <div className="flex gap-3">
                  <div className="relative w-16 h-16 shrink-0 rounded-xl bg-white p-2 border border-slate-200 flex items-center justify-center">
                    <img src="/images/banner-avalia-solar-product-page.png" className="object-contain w-full h-full" alt="SunPower Microinverter" onError={(e)=>{e.currentTarget.src="/icones/icone_produtos_avalia_solar_40x40.png"}} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">MICROINVERSORES</span>
                    <h3 className="text-xs font-black text-slate-900 leading-snug truncate">SunPower AC Microinverter</h3>
                    <span className="text-[10px] font-bold text-slate-500 mt-0.5 block">SunPower</span>
                    <p className="text-[10px] text-slate-500 mt-1 leading-normal">Produtos: 400W <br/> T5s medo: 15x <br/> 2x análise: 350 ms</p>
                  </div>
                </div>
                <Button variant="outline" className="h-9 w-full rounded-xl border border-slate-200 bg-white text-xs font-extrabold text-slate-700 hover:bg-slate-50 mt-3" asChild>
                  <Link href="/products?search=Microinverter">Ver Análise Completa</Link>
                </Button>
              </div>
            </div>

            {/* Direita: Depoimentos de Especialistas */}
            <div className="flex flex-col justify-between gap-4 border-t border-slate-100 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
              {/* Especialista 1 */}
              <div className="flex items-start gap-3 bg-slate-50/40 p-2.5 rounded-xl border border-slate-100">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                  <img src="/icones/icone_avaliacoes_avalia_solar.png" className="w-full h-full object-cover" alt="Mathous S." />
                </div>
                <div className="leading-tight min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900 truncate">Mathous S.</h4>
                  <span className="text-[10px] text-slate-400">Engenheiro Chefe</span>
                  <div className="flex text-amber-400 mt-0.5 scale-75 origin-left">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                  </div>
                  <p className="text-[10px] text-slate-500 italic mt-1 leading-snug">"Instalação impecável, retorno rápido - Fernanda G."</p>
                </div>
              </div>

              {/* Especialista 2 */}
              <div className="flex items-start gap-3 bg-slate-50/40 p-2.5 rounded-xl border border-slate-100">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                  <img src="/icones/icone_avaliacoes_avalia_solar.png" className="w-full h-full object-cover" alt="Fernanda G." />
                </div>
                <div className="leading-tight min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900 truncate">Fernanda G.</h4>
                  <span className="text-[10px] text-slate-400">Codediere Energitics</span>
                  <div className="flex text-amber-400 mt-0.5 scale-75 origin-left">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                  </div>
                  <p className="text-[10px] text-slate-500 italic mt-1 leading-snug">"Instalação impecável, retorno rápido - Fernanda G."</p>
                </div>
              </div>

              {/* Especialista 3 */}
              <div className="flex items-start gap-3 bg-slate-50/40 p-2.5 rounded-xl border border-slate-100">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                  <img src="/icones/icone_avaliacoes_avalia_solar.png" className="w-full h-full object-cover" alt="Ricardo P." />
                </div>
                <div className="leading-tight min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900 truncate">Ricardo P.</h4>
                  <span className="text-[10px] text-slate-400">Instalador Certificado</span>
                  <div className="flex text-amber-400 mt-0.5 scale-75 origin-left">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                  </div>
                  <p className="text-[10px] text-slate-500 italic mt-1 leading-snug">"Instalação impecável, retorno rápido - Frannanta E."</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Resultados</h2>
            <p className="mt-1 text-sm text-slate-500">
              {formattedTotal} {resultNoun}
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
              <button className="inline-flex h-10 items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-4 text-sm font-medium text-blue-700">
                Todos
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{formattedTotal}</span>
              </button>
              <button className="inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                Produtos
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{formattedTotal}</span>
              </button>
              <Link
                href={searchQuery ? `/companies?search=${encodeURIComponent(searchQuery)}` : "/companies"}
                className="inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Empresas
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">0</span>
              </Link>
            </div>

            <Select value={filters.sort} onValueChange={(val) => handleFilterChange('sort', val)}>
              <SelectTrigger className="h-11 w-full rounded-lg border-slate-200 bg-white px-4 text-sm shadow-sm md:w-48">
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
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                    <Skeleton className="h-[190px] w-full rounded-lg bg-slate-100" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full bg-slate-100" />
                      <Skeleton className="h-4 w-3/4 bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : paginatedProducts.length > 0 ? (
              <div className="space-y-8">
                <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
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
