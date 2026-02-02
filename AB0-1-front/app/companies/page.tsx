'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { Search, Grid, List, MapPin, Heart, Building2, Package, Folder, Star, Zap } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import CompanyCard from '@/components/CompanyCard';
import { companiesApiSafe, type Company } from '@/lib/api-client';
import { useFavorites } from '@/hooks/useFavorites';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import BannerByLocation from '@/components/BannerByLocation';
import { cn } from '@/lib/utils';
import FilterSidebar from '@/components/filters/FilterSidebar';
import { parseQueryParams } from '@/components/filters/query';

function CompaniesContent() {
  const searchParams = useSearchParams();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [visibleCount, setVisibleCount] = useState(12);
  const PAGE_SIZE = 12;

  const { favorites } = useFavorites();

  // URL-driven filters
  const filters = useMemo(() => parseQueryParams(searchParams), [searchParams]);

  const [searchInput, setSearchInput] = useState(filters.search || '');

  // Sincronizar searchInput quando os filtros mudam via URL (ex: reset)
  useEffect(() => {
    setSearchInput(filters.search || '');
  }, [filters.search]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await companiesApiSafe.getAll({ 
          include: 'logo_url',
          featured: filters.featured || undefined,
        });
        setCompanies(data || []);
      } catch (err) {
        setError((err as any)?.message || 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  const filteredCompanies = useMemo(() => {
    return companies
      .filter(company => {
        // Busca por texto
        if (filters.search) {
          const search = filters.search.toLowerCase();
          const matchesSearch = 
            company.name?.toLowerCase().includes(search) ||
            company.description?.toLowerCase().includes(search);
          if (!matchesSearch) return false;
        }

        // Filtro de Estados
        if (filters.states && filters.states.length > 0) {
          if (!company.state || !filters.states.includes(company.state.toUpperCase())) {
            return false;
          }
        }

        // Filtro de Cidades
        if (filters.cities && filters.cities.length > 0) {
          if (!company.city || !filters.cities.includes(company.city)) {
            return false;
          }
        }

        // Filtro de Categorias
        if (filters.categories && filters.categories.length > 0) {
          // Nota: Assumindo que company tem um array de category ids ou slugs
          // Como o backend atual pode não retornar isso de forma limpa, 
          // idealmente isso seria filtrado via API. 
          // Por enquanto, faremos uma verificação básica se a company tiver category_id
          if (company.category_id && !filters.categories.includes(String(company.category_id))) {
            return false;
          }
        }

        // Filtro de Avaliação Mínima
        if (filters.minRating) {
          const rating = Number(company.average_rating) || 0;
          if (rating < filters.minRating) return false;
        }

        // Filtros de Qualidade
        if (filters.verified && !company.verified) return false;
        if (filters.featured && !company.featured) return false;
        
        // Mock de filtros que o backend pode não ter ainda, mas a UI suporta
        if (filters.financing && !company.has_financing) return false;
        if (filters.whatsapp && !company.whatsapp) return false;

        return true;
      })
      .sort((a, b) => {
        switch (filters.sort) {
          case 'rating_desc': {
            const ra = Number(a.average_rating) || 0;
            const rb = Number(b.average_rating) || 0;
            return rb - ra;
          }
          case 'reviews_desc': {
            const ra = a.reviews_count || 0;
            const rb = b.reviews_count || 0;
            return rb - ra;
          }
          case 'newest':
            return (b.id || 0) - (a.id || 0);
          case 'name_asc':
            return (a.name || '').localeCompare(b.name || '');
          case 'name_desc':
            return (b.name || '').localeCompare(a.name || '');
          default: // recommended (featured first, then rating)
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            const ra = Number(a.average_rating) || 0;
            const rb = Number(b.average_rating) || 0;
            return rb - ra;
        }
      });
  }, [companies, filters]);

  const visibleCompanies = useMemo(
    () => filteredCompanies.slice(0, visibleCount),
    [filteredCompanies, visibleCount]
  );

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filters]);

  const quickActions = [
    { label: 'Instalar', href: '/companies', icon: Building2, styles: 'bg-brand-blue/10 text-brand-blue' },
    { label: 'Produtos', href: '/products', icon: Package, styles: 'bg-brand-green/10 text-brand-green-dark' },
    { label: 'Categorias', href: '/categories', icon: Folder, styles: 'bg-brand-blue/10 text-brand-blue' },
    { label: 'Avaliar', href: '/reviews/my', icon: Star, styles: 'bg-brand-cyan/10 text-brand-cyan-dark' },
    { label: 'Destaques', href: '/companies?featured=true', icon: Zap, styles: 'bg-slate-100 text-slate-700' }
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 text-center">
            <p className="text-destructive">Erro ao carregar empresas: {error}</p>
            <Button className="mt-4" onClick={() => window.location.reload()} variant="outline">
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar empresas..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 h-10 bg-slate-50 border-none rounded-full text-sm"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-[300px] shrink-0">
            <FilterSidebar />
          </aside>

          <div className="flex-1 space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Empresas de Energia Solar</h1>
                <p className="text-slate-500 text-sm mt-1">
                  Encontramos {filteredCompanies.length} empresas que atendem aos seus critérios
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", viewMode === 'grid' && "bg-slate-100 text-slate-900")}
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", viewMode === 'list' && "bg-slate-100 text-slate-900")}
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex flex-col items-center gap-2 rounded-xl bg-white p-3 text-center border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group"
                  >
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-full transition-colors", action.styles)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 group-hover:text-slate-900">{action.label}</span>
                  </Link>
                );
              })}
            </section>

            <div className="space-y-4">
              {loading ? (
                <div className={cn(
                  "grid gap-4",
                  viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
                )}>
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-64 rounded-xl bg-white" />
                  ))}
                </div>
              ) : visibleCompanies.length > 0 ? (
                <>
                  <div className={cn(
                    "grid gap-4",
                    viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
                  )}>
                    {visibleCompanies.map((company) => (
                      <CompanyCard 
                        key={company.id} 
                        company={company} 
                        variant={viewMode === 'list' ? 'list' : 'grid'}
                      />
                    ))}
                  </div>

                  {visibleCompanies.length < filteredCompanies.length && (
                    <div className="flex justify-center pt-4">
                      <Button
                        variant="outline"
                        className="rounded-full px-8 border-slate-200 text-slate-600 hover:text-slate-900"
                        onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                      >
                        Carregar mais empresas
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 text-center">
                  <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Nenhuma empresa encontrada</h3>
                  <p className="text-slate-500 max-w-xs mt-1">
                    Não encontramos resultados para os filtros selecionados. Tente ajustar sua busca.
                  </p>
                  <Button 
                    variant="link" 
                    className="mt-4 text-blue-600"
                    onClick={() => {
                      const url = new URL(window.location.href);
                      url.search = '';
                      window.history.replaceState({}, '', url.pathname);
                      window.location.reload();
                    }}
                  >
                    Limpar todos os filtros
                  </Button>
                </div>
              )}
            </div>

            <section className="pt-4">
              <BannerByLocation location="companies_footer" />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CompaniesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-slate-500 font-medium">Carregando empresas...</p>
        </div>
      </div>
    }>
      <CompaniesContent />
    </Suspense>
  );
}

                    {visibleCompanies.map((company) => (
                      <CompanyCard 
                        key={company.id} 
                        company={company} 
                        variant={viewMode === 'list' ? 'list' : 'grid'}
                      />
                    ))}
                  </div>

                  {visibleCompanies.length < filteredCompanies.length && (
                    <div className="flex justify-center pt-4">
                      <Button
                        variant="outline"
                        className="rounded-full px-8 border-slate-200 text-slate-600 hover:text-slate-900"
                        onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                      >
                        Carregar mais empresas
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 text-center">
                  <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Nenhuma empresa encontrada</h3>
                  <p className="text-slate-500 max-w-xs mt-1">
                    Não encontramos resultados para os filtros selecionados. Tente ajustar sua busca.
                  </p>
                  <Button 
                    variant="link" 
                    className="mt-4 text-blue-600"
                    onClick={() => {
                      const url = new URL(window.location.href);
                      url.search = '';
                      window.history.replaceState({}, '', url.pathname);
                      window.location.reload();
                    }}
                  >
                    Limpar todos os filtros
                  </Button>
                </div>
              )}
            </div>

            <section className="pt-4">
              <BannerByLocation location="companies_footer" />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CompaniesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-slate-500 font-medium">Carregando empresas...</p>
        </div>
      </div>
    }>
      <CompaniesContent />
    </Suspense>
  );
}