'use client';

import { useState, useEffect } from 'react';
import CategoryCard from '@/components/CategoryCard';
import CategoriesHero from '@/components/categories/CategoriesHero';
import { Input } from '@/components/ui/input';
import { Search, AlertCircle, Grid3x3, List, Menu, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

// React Query hooks
import { useCategoriesBannersQuery } from '@/hooks/useBannersQuery';
import { useFeaturedCategoriesQuery, useAllCategoriesQuery } from '@/hooks/useCategoriesQuery';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export default function CategoriesIndexWithSidebar() {
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  const [filters, setFilters] = useState({
    region: '',
    min_rating: 0,
    max_price: 0,
    kind: '',
    sort_by: 'featured_desc'
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Queries
  const { 
    data: banners = [], 
    isLoading: bannersLoading 
  } = useCategoriesBannersQuery();

  const { 
    data: featuredData, 
    isLoading: featuredLoading 
  } = useFeaturedCategoriesQuery(4); // Mostrar top 4 destaques
  
  const featuredCategories = featuredData?.data || [];

  const [page, setPage] = useState(1);
  const perPage = 12;

  const { 
    data: allData, 
    isLoading: allLoading,
    error: allError,
    refetch: refetchCategories 
  } = useAllCategoriesQuery({
    search: debouncedSearch,
    region: filters.region,
    min_rating: filters.min_rating > 0 ? filters.min_rating : undefined,
    max_price: filters.max_price > 0 ? filters.max_price : undefined,
    kind: filters.kind,
    sort_by: filters.sort_by,
    page,
    per_page: perPage
  });

  const allCategories = allData?.data || [];
  const meta = allData?.meta;

  // Handlers
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset page on filter change
  };

  const clearFilters = () => {
    setFilters({
      region: '',
      min_rating: 0,
      max_price: 0,
      kind: '',
      sort_by: 'featured_desc'
    });
    setSearchTerm('');
    setPage(1);
  };

  const hasActiveFilters = searchTerm || filters.region || filters.min_rating > 0 || filters.max_price > 0 || filters.kind;

  // Loading state
  const isLoading = bannersLoading || (featuredLoading && !featuredCategories.length) || (allLoading && !allCategories.length);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (allError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Erro ao carregar categorias. Tente novamente.</span>
            <Button onClick={() => refetchCategories()} variant="outline" size="sm">
              Tentar Novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      {/* Hero Carrossel */}
      <CategoriesHero
        banners={banners.map((b: any) => ({ 
          ...b, 
          link_url: b?.link_url ?? b?.link ?? undefined 
        }))}
        loading={bannersLoading}
      />

      <div className="container mx-auto px-4 mt-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* SIDEBAR - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0 space-y-6">
            <SidebarFilters 
              filters={filters} 
              onFilterChange={handleFilterChange} 
              onClear={clearFilters}
              hasActiveFilters={!!hasActiveFilters}
            />
          </aside>

          {/* MAIN CONTENT */}
          <main className="flex-1">
            
            {/* Toolbar: Busca + Mobile Toggle + Ordenação */}
            <div className="bg-white p-4 rounded-xl border border-border/50 shadow-sm mb-6 sticky top-20 z-20">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                
                {/* Mobile Filter Trigger */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden w-full sm:w-auto">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtros
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Filtros</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <SidebarFilters 
                        filters={filters} 
                        onFilterChange={handleFilterChange} 
                        onClear={() => {
                          clearFilters();
                          setMobileMenuOpen(false);
                        }}
                        hasActiveFilters={!!hasActiveFilters}
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Busca */}
                <div className="relative w-full sm:max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar categorias..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  />
                </div>

                {/* Ordenação e Contagem */}
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-sm text-muted-foreground whitespace-nowrap hidden sm:block">
                    {meta?.total_items || allCategories.length} resultados
                  </div>
                  
                  <Select 
                    value={filters.sort_by} 
                    onValueChange={(val) => handleFilterChange('sort_by', val)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured_desc">Destaques</SelectItem>
                      <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
                      <SelectItem value="rating_desc">Melhor Avaliação</SelectItem>
                      <SelectItem value="companies_count_desc">Mais Empresas</SelectItem>
                      <SelectItem value="price_desc">Maior Preço Médio</SelectItem>
                      <SelectItem value="views_desc">Mais Populares</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Destaques (apenas se sem busca/filtros pesados) */}
            {!hasActiveFilters && featuredCategories.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Grid3x3 className="h-5 w-5 text-primary" />
                    Categorias em Destaque
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {featuredCategories.map((category) => (
                    <CategoryCard key={category.id} category={category} className="h-full" />
                  ))}
                </div>
                <Separator className="my-8" />
              </section>
            )}

            {/* Grid Principal */}
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <List className="h-5 w-5 text-primary" />
                {hasActiveFilters ? 'Resultados Filtrados' : 'Todas as Categorias'}
              </h2>
              
              {allCategories.length === 0 ? (
                <EmptyState onClear={clearFilters} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allCategories.map((category) => (
                    <CategoryCard key={category.id} category={category} className="h-full" />
                  ))}
                </div>
              )}
            </section>

            {/* Paginação */}
            {meta && meta.total_pages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="flex items-center px-4 text-sm font-medium">
                  Página {page} de {meta.total_pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(meta.total_pages, p + 1))}
                  disabled={page === meta.total_pages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}

// Subcomponente de Filtros
function SidebarFilters({ filters, onFilterChange, onClear, hasActiveFilters }: any) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Filtros</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClear} className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive">
            <X className="h-3 w-3 mr-1" /> Limpar
          </Button>
        )}
      </div>

      {/* Região */}
      <div className="space-y-2">
        <Label>Região</Label>
        <Select value={filters.region} onValueChange={(val) => onFilterChange('region', val === 'all' ? '' : val)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="SP">São Paulo</SelectItem>
            <SelectItem value="RJ">Rio de Janeiro</SelectItem>
            <SelectItem value="MG">Minas Gerais</SelectItem>
            <SelectItem value="RS">Rio Grande do Sul</SelectItem>
            <SelectItem value="PR">Paraná</SelectItem>
            {/* Adicionar mais estados conforme necessário */}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Tipo */}
      <div className="space-y-2">
        <Label>Tipo de Solução</Label>
        <Select value={filters.kind} onValueChange={(val) => onFilterChange('kind', val === 'all' ? '' : val)}>
          <SelectTrigger>
            <SelectValue placeholder="Qualquer tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="residencial">Residencial</SelectItem>
            <SelectItem value="comercial">Comercial</SelectItem>
            <SelectItem value="industrial">Industrial</SelectItem>
            <SelectItem value="rural">Rural</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Avaliação Mínima */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Avaliação Mínima</Label>
          <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded">
            {filters.min_rating > 0 ? `${filters.min_rating}+ estrelas` : 'Qualquer'}
          </span>
        </div>
        <Slider
          value={[filters.min_rating]}
          min={0}
          max={5}
          step={0.5}
          onValueChange={([val]) => onFilterChange('min_rating', val)}
          className="py-4"
        />
      </div>

      {/* Preço Máximo */}
      <Separator />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Preço Médio Até</Label>
          <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded">
            {filters.max_price > 0 ? `R$ ${filters.max_price}` : 'Sem limite'}
          </span>
        </div>
        <Slider
          value={[filters.max_price]}
          min={0}
          max={50000}
          step={1000}
          onValueChange={([val]) => onFilterChange('max_price', val)}
        />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <Skeleton className="w-full h-[300px] rounded-xl" />
      <div className="flex gap-8">
        <Skeleton className="hidden lg:block w-64 h-[500px] rounded-xl" />
        <div className="flex-1 space-y-4">
          <Skeleton className="w-full h-16 rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[300px] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
      <div className="bg-white p-4 rounded-full shadow-sm mb-4">
        <Search className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Nenhum resultado encontrado
      </h3>
      <p className="text-gray-500 max-w-md mb-6">
        Não encontramos categorias que correspondam aos seus filtros. Tente ajustar os termos de busca ou remover alguns filtros.
      </p>
      <Button onClick={onClear} variant="outline">
        Limpar Filtros
      </Button>
    </div>
  );
}
