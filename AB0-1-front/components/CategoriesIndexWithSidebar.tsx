'use client';

import { useState, useEffect } from 'react';
import CategoryCard from '@/components/CategoryCard';
import CategoriesHero from '@/components/categories/CategoriesHero';
import { Input } from '@/components/ui/input';
import { Search, AlertCircle, Grid3x3, List, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
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
import BannerByLocation from '@/components/BannerByLocation';

import { useCategoriesBannersQuery } from '@/hooks/useBannersQuery';
import { useFeaturedCategoriesQuery, useAllCategoriesQuery } from '@/hooks/useCategoriesQuery';

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

  const { data: banners = [], isLoading: bannersLoading } = useCategoriesBannersQuery();
  const { data: featuredData, isLoading: featuredLoading } = useFeaturedCategoriesQuery(4);
  const featuredCategories = featuredData?.data || [];

  const [page, setPage] = useState(1);
  const perPage = 12;

  const { data: allData, isLoading: allLoading, error: allError, refetch: refetchCategories } = useAllCategoriesQuery({
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

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ region: '', min_rating: 0, max_price: 0, kind: '', sort_by: 'featured_desc' });
    setSearchTerm('');
    setPage(1);
  };

  const hasActiveFilters = searchTerm || filters.region || filters.min_rating > 0 || filters.max_price > 0 || filters.kind;
  const isLoading = bannersLoading || (featuredLoading && !featuredCategories.length) || (allLoading && !allCategories.length);

  if (isLoading) return <LoadingSkeleton />;

  if (allError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Erro ao carregar categorias. Tente novamente.</span>
            <Button onClick={() => refetchCategories()} variant="outline" size="sm">Tentar Novamente</Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-12">
      {/* 1. Hero Compacto */}
      <CategoriesHero
        banners={banners.map((b: any) => ({ ...b, link_url: b?.link_url ?? b?.link ?? undefined }))}
        loading={bannersLoading}
      />

      <div className="container mx-auto px-4 mt-6 md:mt-10">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          
          {/* 2. Sidebar de Filtros - Hierarquia Reforçada */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-[calc(6rem+var(--safe-area-inset-top))] space-y-6">
              <div className="bg-slate-50 p-6 rounded-[8px] border border-slate-100 shadow-sm">
                <SidebarFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onClear={clearFilters}
                  hasActiveFilters={!!hasActiveFilters}
                />
              </div>

              <BannerByLocation
                location="categories_filter_sidebar"
                limit={1}
                className="rounded-[8px]"
              />
            </div>
          </aside>

          {/* 3. Main Content - Redução de Espaços Mortos */}
          <main className="flex-1 min-w-0 space-y-8 md:space-y-12">
            
            {/* Toolbar: Busca + Mobile Toggle */}
            <div
              data-testid="categories-toolbar"
              className="bg-white px-4 pb-4 pt-[max(1rem,var(--safe-area-inset-top))] rounded-[8px] border border-slate-200 shadow-sm sticky top-[calc(5rem+var(--safe-area-inset-top))] z-20 flex flex-col sm:flex-row gap-4 items-center justify-between backdrop-blur-md bg-white/90"
            >
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden w-full sm:w-auto h-11 font-bold rounded-[6px]">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtros
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] overflow-y-auto">
                    <SheetHeader><SheetTitle>Filtros</SheetTitle></SheetHeader>
                    <div className="mt-6">
                      <SidebarFilters filters={filters} onFilterChange={handleFilterChange} onClear={() => { clearFilters(); setMobileMenuOpen(false); }} hasActiveFilters={!!hasActiveFilters} />
                    </div>
                  </SheetContent>
                </Sheet>

                <div className="relative w-full sm:max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Buscar categorias..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-11 pl-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all rounded-[6px]"
                  />
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-bold border-blue-100 h-8 px-3 rounded-[4px]">
                    {meta?.total_items || allCategories.length} RESULTADOS
                  </Badge>
                  
                  <Select value={filters.sort_by} onValueChange={(val) => handleFilterChange('sort_by', val)}>
                    <SelectTrigger className="w-[180px] h-10 rounded-[6px] border-slate-200 font-medium">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured_desc">Destaques</SelectItem>
                      <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
                      <SelectItem value="rating_desc">Melhor Avaliação</SelectItem>
                      <SelectItem value="companies_count_desc">Mais Empresas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
            </div>

            {/* Destaques - Grid Denso */}
            {!hasActiveFilters && featuredCategories.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl md:text-3xl font-black text-slate-950 flex items-center gap-2 tracking-tight">
                    <Grid3x3 className="h-6 w-6 text-blue-600" />
                    Categorias em Destaque
                  </h2>
                </div>
                <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
                  {featuredCategories.map((category) => (
                    <CategoryCard key={category.id} category={category} />
                  ))}
                </div>
                <Separator className="mt-10" />
              </section>
            )}

            {/* Grid Principal - Gridcols-3/4 */}
            <section>
              <h2 className="text-2xl md:text-3xl font-black text-slate-950 mb-6 flex items-center gap-2 tracking-tight">
                <List className="h-6 w-6 text-blue-600" />
                {hasActiveFilters ? 'Resultados Filtrados' : 'Soluções por Categoria'}
              </h2>
              
              {allCategories.length === 0 ? (
                <EmptyState onClear={clearFilters} />
              ) : (
                <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
                  {allCategories.map((category) => (
                    <CategoryCard key={category.id} category={category} />
                  ))}
                </div>
              )}
            </section>

            {/* Paginação */}
            {meta && meta.total_pages > 1 && (
              <div className="flex justify-center items-center gap-4 pt-4">
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-[6px] border-slate-200" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <span className="text-sm font-black text-slate-700 uppercase tracking-widest">
                  Página {page} de {meta.total_pages}
                </span>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-[6px] border-slate-200" onClick={() => setPage(p => Math.min(meta.total_pages, p + 1))} disabled={page === meta.total_pages}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            )}

          </main>

          <BannerByLocation
            location="categories_right_rail"
            limit={1}
            className="hidden xl:block w-[300px] flex-shrink-0 sticky top-[calc(6rem+var(--safe-area-inset-top))] rounded-[8px]"
          />
        </div>
      </div>
    </div>
  );
}

function SidebarFilters({ filters, onFilterChange, onClear, hasActiveFilters }: any) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-black text-lg text-slate-950 uppercase tracking-tight">Filtros</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClear} className="h-8 px-2 text-xs text-slate-400 hover:text-red-500 font-bold">
            <X className="h-3.5 w-3.5 mr-1" /> Limpar
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Região</Label>
        <Select value={filters.region} onValueChange={(val) => onFilterChange('region', val === 'all' ? '' : val)}>
          <SelectTrigger className="h-11 rounded-[6px] border-slate-200 bg-white">
            <SelectValue placeholder="Selecione o estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Regiões</SelectItem>
            <SelectItem value="SP">São Paulo</SelectItem>
            <SelectItem value="RJ">Rio de Janeiro</SelectItem>
            <SelectItem value="MG">Minas Gerais</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Tipo de Solução</Label>
        <Select value={filters.kind} onValueChange={(val) => onFilterChange('kind', val === 'all' ? '' : val)}>
          <SelectTrigger className="h-11 rounded-[6px] border-slate-200 bg-white">
            <SelectValue placeholder="Qualquer tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="residencial">Residencial</SelectItem>
            <SelectItem value="comercial">Comercial</SelectItem>
            <SelectItem value="industrial">Industrial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Avaliação Mínima</Label>
          <Badge className="bg-blue-600 text-white font-bold">{filters.min_rating > 0 ? `${filters.min_rating}+` : '0'}</Badge>
        </div>
        <Slider value={[filters.min_rating]} min={0} max={5} step={0.5} onValueChange={([val]) => onFilterChange('min_rating', val)} className="py-2" />
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Preço Médio Até</Label>
          <Badge className="bg-emerald-600 text-white font-bold">{filters.max_price > 0 ? `R$ ${filters.max_price/1000}k` : 'MAX'}</Badge>
        </div>
        <Slider value={[filters.max_price]} min={0} max={50000} step={1000} onValueChange={([val]) => onFilterChange('max_price', val)} />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <Skeleton className="w-full h-[240px] rounded-[8px]" />
      <div className="flex gap-8">
        <Skeleton className="hidden lg:block w-72 h-[600px] rounded-[8px]" />
        <div className="flex-1 space-y-6">
          <Skeleton className="w-full h-16 rounded-[8px]" />
          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-[220px] rounded-2xl" />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-slate-200 rounded-[8px] bg-slate-50/50">
      <div className="bg-white p-5 rounded-full shadow-lg mb-6"><Search className="h-10 w-10 text-slate-300" /></div>
      <h3 className="text-xl font-black text-slate-950 mb-2 uppercase">Nenhum resultado encontrado</h3>
      <p className="text-slate-500 max-w-md mb-8 font-medium">Não encontramos categorias que correspondam aos seus filtros. Tente ajustar os termos de busca.</p>
      <Button onClick={onClear} variant="default" className="bg-blue-600 hover:bg-blue-700 font-bold px-8 h-12 rounded-[6px] shadow-lg">Limpar Filtros</Button>
    </div>
  );
}
