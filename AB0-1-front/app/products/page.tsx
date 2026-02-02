'use client';

import { useState, useMemo, Suspense } from 'react';
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
import { usePageTracking } from '@/hooks/usePageTracking';

function ProductsPageContent() {
  // GTM Page Tracking
  usePageTracking({
    type: 'other',
    title: 'Produtos - Avalia Solar',
  });

  const { products, filtersMeta, loading, error } = useProducts();
  
  // Pagination State (Prepared for future backend integration)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    company: 'all',
    priceRange: [0, 50000] as [number, number],
    sort: 'relevance',
    specs: {} as Record<string, any>
  });

  // Derived Data for Filters & Featured Companies
  const { categories, companies, maxPrice, companySummaries } = useMemo(() => {
    if (!products.length) return { categories: [], companies: [], maxPrice: 50000, companySummaries: [] };

    const cats = new Set<string>();
    const comps = new Set<string>();
    const compStats: Record<string, number> = {};
    let maxP = 0;

    products.forEach(p => {
      // Categories extraction
      if ((p as any).categories && Array.isArray((p as any).categories)) {
        (p as any).categories.forEach((c: any) => cats.add(c.name));
      } else if (p.category?.name) {
        cats.add(p.category.name);
      }

      // Company extraction
      if (p.company?.name) {
        comps.add(p.company.name);
        compStats[p.company.name] = (compStats[p.company.name] || 0) + 1;
      }

      // Price extraction
      const price = typeof p.price === 'number' ? p.price : parseFloat(p.price || '0');
      if (price > maxP) maxP = price;
    });

    const companySummaries = Array.from(comps).map(name => ({
        name,
        productCount: compStats[name],
        isVerified: true, // Mock logic: all active companies are verified for now
        rating: 4.8, // Mock logic
        city: 'São Paulo' // Mock logic
    })).sort((a, b) => b.productCount - a.productCount).slice(0, 10);

    return {
      categories: Array.from(cats).sort(),
      companies: Array.from(comps).sort(),
      maxPrice: Math.ceil(maxP / 100) * 100, // Round up to nearest 100
      companySummaries
    };
  }, [products]);

  // Update max price in filters when data loads
  useMemo(() => {
    if (maxPrice > 0 && maxPrice !== filters.priceRange[1] && filters.priceRange[1] === 50000) {
        setFilters(prev => ({ ...prev, priceRange: [0, maxPrice] }));
    }
  }, [maxPrice]);

  // Filtering Logic
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const price = typeof product.price === 'number' ? product.price : parseFloat(product.price || '0');
      
      // Search
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        product.name.toLowerCase().includes(searchLower) || 
        product.description?.toLowerCase().includes(searchLower) ||
        product.company?.name?.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Category
      if (filters.category !== 'all') {
        const productCats =
          (product as any).categories?.map((c: any) => c.name) ||
          (product.category?.name ? [product.category.name] : []);
        if (!productCats.includes(filters.category)) return false;
      }

      // Company
      if (filters.company !== 'all') {
        if (product.company?.name !== filters.company) return false;
      }

      // Price
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
    }).sort((a, b) => {
      const priceA = typeof a.price === 'number' ? a.price : parseFloat(a.price || '0');
      const priceB = typeof b.price === 'number' ? b.price : parseFloat(b.price || '0');

      switch (filters.sort) {
        case 'price_asc': return priceA - priceB;
        case 'price_desc': return priceB - priceA;
        case 'name_asc': return a.name.localeCompare(b.name);
        default: return 0; // relevance (default order)
      }
    });
  }, [products, searchQuery, filters]);

  // Client-side Pagination Logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
          totalProducts={filteredProducts.length} 
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
            ) : filteredProducts.length > 0 ? (
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
