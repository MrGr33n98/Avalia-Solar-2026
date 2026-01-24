# SumÃ¡rio Completo de CÃ³digo - Mobile /Companies
Gerado em: 2026-01-23 22:45:04
Este arquivo contÃ©m a implementaÃ§Ã£o completa dos arquivos listados para facilitar a anÃ¡lise.

---
## Arquivo: page.tsx
**Caminho:** `AB0-1-front/app/companies/page.tsx`

Content-Length: 33885 bytes

``tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Filter, Grid, List, Search, Home, Heart, User, Zap, Building2, Package, Star, Folder, SlidersHorizontal, X, MapPin } from 'lucide-react';
import Link from 'next/link';
import CompanyCard from '@/components/CompanyCard';
import { LocationFilter } from '@/components/LocationFilter';
import { companiesApiSafe, categoriesApiSafe, type Company, type Category } from '@/lib/api-client';
import { buildCategoryPath } from '@/lib/slug';
import { useLocationData } from '@/hooks/useLocationData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import BannerByLocation from '@/components/BannerByLocation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const PAGE_SIZE = 12;

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (process.env.NODE_ENV !== 'production') console.log('[CompaniesPage] Fetching companies and categories...');
        const [companiesData, categoriesData] = await Promise.all([
          companiesApiSafe.getAll({ include: 'logo_url' }), // Incluir logo_url para fallback
          categoriesApiSafe.getAll()
        ]);

        if (process.env.NODE_ENV !== 'production') {
          console.log('[CompaniesPage] Received companies:', companiesData);
          console.log('[CompaniesPage] Received categories:', categoriesData);
        }

        setCompanies(companiesData || []);
        setCategories(categoriesData || []);
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[CompaniesPage] Error loading data:', err);
        setError((err as any)?.message || 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { states, cities, loadingStates, loadingCities, error: statesError, citiesError, fetchCities } = useLocationData();

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setVisibleCount(PAGE_SIZE);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchInput]);

  useEffect(() => {
    fetchCities(stateFilter);
  }, [stateFilter, fetchCities]);

  // Filter and sort companies
  const filteredCompanies = useMemo(() => {
    return companies
      .filter(company => {
        const matchesSearch =
          !searchTerm ||
          (company.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (company.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        const matchesState =
          stateFilter === 'all' ||
          ((company.state || '').toUpperCase() === stateFilter.toUpperCase());

        const matchesCity =
          !cityFilter ||
          ((company.city || '').toLowerCase() === cityFilter.toLowerCase());

        return matchesSearch && matchesState && matchesCity;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return (a.name || '').localeCompare(b.name || '');
          case 'location':
            return (a.state || '').localeCompare(b.state || '');
          case 'rating': {
            const ra = Number(a.average_rating) || 0;
            const rb = Number(b.average_rating) || 0;
            return rb - ra;
          }
          default:
            return 0;
        }
      });
  }, [companies, cityFilter, searchTerm, sortBy, stateFilter]);

  const visibleCompanies = useMemo(
    () => filteredCompanies.slice(0, visibleCount),
    [filteredCompanies, visibleCount]
  );

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchTerm, stateFilter, cityFilter, sortBy]);

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setStateFilter('all');
    setCityFilter('');
    setSortBy('name');
  };

  const categoryChips = categories.length > 0
    ? categories.slice(0, 8).map((category) => ({
        label: category.name || 'Categoria',
        href: buildCategoryPath(category.seo_url, category.id)
      }))
    : [
        { label: 'Instalacao', href: '/categories' },
        { label: 'Equipamentos', href: '/categories' },
        { label: 'Projetos', href: '/categories' },
        { label: 'Manutencao', href: '/categories' },
        { label: 'Financiamento', href: '/categories' }
      ];

  const quickActions = [
    { label: 'Instalar', href: '/companies', icon: Building2, styles: 'bg-yellow-100 text-yellow-700' },
    { label: 'Produtos', href: '/products', icon: Package, styles: 'bg-green-100 text-green-700' },
    { label: 'Categorias', href: '/categories', icon: Folder, styles: 'bg-blue-100 text-blue-700' },
    { label: 'Avaliar', href: '/reviews/my', icon: Star, styles: 'bg-orange-100 text-orange-700' },
    { label: 'Destaques', href: '/companies', icon: Zap, styles: 'bg-slate-100 text-slate-700' }
  ];

  const ratingChips = [
    { label: 'Melhor avaliadas', value: 'rating' },
    { label: 'A-Z', value: 'name' },
    { label: 'Estado', value: 'location' }
  ];

  const activeFilters = useMemo(() => {
    const chips: { key: string; label: string; onClear: () => void }[] = [];
    if (searchTerm) chips.push({ key: 'search', label: `Busca: "${searchTerm}"`, onClear: () => { setSearchInput(''); setSearchTerm(''); } });
    if (stateFilter !== 'all') chips.push({ key: 'state', label: `Estado: ${stateFilter}`, onClear: () => setStateFilter('all') });
    if (cityFilter) chips.push({ key: 'city', label: `Cidade: ${cityFilter}`, onClear: () => setCityFilter('') });
    if (sortBy !== 'name') chips.push({
      key: 'sort',
      label: `Ordenar: ${sortBy === 'rating' ? 'Melhor avaliada' : 'Estado'}`,
      onClear: () => setSortBy('name')
    });
    return chips;
  }, [cityFilter, searchTerm, sortBy, stateFilter]);

  const visibleStates = states.slice(0, 8);
  const visibleCities = cities.slice(0, 8);

  if (error) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 text-center">
            <p className="text-destructive">Erro ao carregar empresas: {error}</p>
            <Button
              className="mt-4"
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="md:hidden">
        <div className="bg-gradient-to-r from-primary to-accent shadow-sm">
          <div className="px-4 pt-2 pb-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                type="search"
                placeholder="Buscar empresas..."
                aria-label="Buscar empresas"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="h-10 rounded-full bg-white pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-white/40"
              />
            </div>
          </div>
          <div className="border-t border-white/20 px-4 pb-1">
            <div className="flex items-center gap-2 overflow-x-auto py-2 whitespace-nowrap snap-x snap-mandatory">
              <Link
                href="/categories"
                className="whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-primary shadow-sm"
              >
                Tudo
              </Link>
              {categoryChips.map((chip) => (
                <Link
                  key={chip.label}
                  href={chip.href}
                  className="whitespace-nowrap rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-primary shadow-sm snap-start"
                >
                  {chip.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#f7f7f7] px-4 pb-24 pt-4 space-y-4">
          <section className="grid grid-cols-5 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex flex-col items-center gap-1 text-center"
                  aria-label={action.label}
                >
                  <div className={`flex h-11 w-11 items-center justify-center rounded-full ${action.styles}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-medium text-gray-700">{action.label}</span>
                </Link>
              );
            })}
          </section>

          <section>
            <BannerByLocation location="navbar" />
          </section>

          <section className="space-y-3">
            <Accordion type="multiple" className="w-full" defaultValue={[]}>
              <AccordionItem value="states">
                <AccordionTrigger className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">Estados</AccordionTrigger>
                <AccordionContent>
                  <div className="mt-2 flex gap-2 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setStateFilter('all');
                      setCityFilter('');
                    }}
                    className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${
                      stateFilter === 'all'
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 bg-white text-gray-700'
                    }`}
                    aria-pressed={stateFilter === 'all'}
                  >
                    Todos
                  </button>
                  {loadingStates ? (
                    <span className="text-xs text-gray-500">Carregando...</span>
                  ) : (
                    visibleStates.map((state) => (
                      <button
                        key={state}
                        type="button"
                        onClick={() => {
                          setStateFilter(state);
                          setCityFilter('');
                        }}
                        className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${
                          stateFilter === state
                            ? 'border-gray-900 bg-gray-900 text-white'
                            : 'border-gray-200 bg-white text-gray-700'
                        }`}
                        aria-pressed={stateFilter === state}
                      >
                        {state}
                      </button>
                    ))
                  )}
                  </div>
                  {statesError && (
                    <p className="mt-2 text-[11px] text-destructive">
                      {statesError}
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>

            {stateFilter !== 'all' && (loadingCities || visibleCities.length > 0 || citiesError) && (
              <AccordionItem value="cities">
                <AccordionTrigger className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">Cidades</AccordionTrigger>
                <AccordionContent>
                  <div className="mt-2 flex gap-2 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setCityFilter('')}
                    className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${
                      !cityFilter
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 bg-white text-gray-700'
                    }`}
                    aria-pressed={!cityFilter}
                  >
                    Todas
                  </button>
                  {loadingCities ? (
                    <span className="text-xs text-gray-500">Carregando...</span>
                  ) : (
                    visibleCities.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => setCityFilter(city)}
                        className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${
                          cityFilter === city
                            ? 'border-gray-900 bg-gray-900 text-white'
                            : 'border-gray-200 bg-white text-gray-700'
                        }`}
                        aria-pressed={cityFilter === city}
                      >
                        {city}
                      </button>
                    ))
                  )}
                  </div>
                  {citiesError && (
                    <p className="mt-2 text-[11px] text-destructive">
                      {citiesError}
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem value="ratings">
              <AccordionTrigger className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">Avaliacoes</AccordionTrigger>
              <AccordionContent>
                <div className="mt-2 flex gap-2 overflow-x-auto">
                {ratingChips.map((chip) => (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => setSortBy(chip.value)}
                    className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${
                      sortBy === chip.value
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 bg-white text-gray-700'
                    }`}
                    aria-pressed={sortBy === chip.value}
                  >
                    {chip.label}
                  </button>
                ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            </Accordion>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Empresas</h2>
              <span className="text-xs text-gray-600">
                {filteredCompanies.length} {filteredCompanies.length === 1 ? 'empresa' : 'empresas'}
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-xl bg-white" />
                ))}
              </div>
            ) : filteredCompanies.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {filteredCompanies.map((company) => (
                  <CompanyCard key={company.id} company={company} compact />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                  <Filter className="h-5 w-5 text-yellow-700" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">Nenhuma empresa encontrada</h3>
                <p className="mt-1 text-xs text-gray-600">
                  Ajuste os filtros ou termos de busca.
                </p>
                <Button
                  onClick={handleClearFilters}
                  variant="outline"
                  className="mt-3 border-gray-200 text-gray-700"
                >
                  Limpar filtros
                </Button>
              </div>
            )}
          </section>
        </div>

        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white">
          <div className="mx-auto flex max-w-md items-center justify-around py-2">
            <Link href="/" className="flex flex-col items-center gap-1 text-[10px] text-gray-600">
              <Home className="h-5 w-5" />
              Inicio
            </Link>
            <Link href="/categories" className="flex flex-col items-center gap-1 text-[10px] text-gray-600">
              <Grid className="h-5 w-5" />
              Categorias
            </Link>
            <Link
              href="/profile?tab=favorites"
              className="flex flex-col items-center gap-1 text-[10px] text-gray-600"
            >
              <Heart className="h-5 w-5" />
              Favoritos
            </Link>
            <Link href="/profile" className="flex flex-col items-center gap-1 text-[10px] text-gray-600">
              <User className="h-5 w-5" />
              Perfil
            </Link>
          </div>
        </nav>
      </div>

      <div className="hidden md:block">
        <header className="bg-gradient-to-br from-white via-[#f8fbff] to-white border-b border-gray-200">
          <div className="mx-auto max-w-7xl px-6 pt-8 pb-6 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
                <Zap className="h-4 w-4" /> Empresas solares curadas
              </div>
              <div className="flex flex-wrap items-baseline gap-2">
                <h1 className="text-2xl font-bold text-gray-900">Encontre instaladoras e distribuidores confiÃ¡veis</h1>
                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                  {filteredCompanies.length} resultados
                </Badge>
              </div>
              <p className="text-sm text-gray-600 max-w-3xl">
                Use os filtros para refinar por localizaÃ§Ã£o, categoria e avaliaÃ§Ã£o. Links e eventos existentes permanecem intactos.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[260px]">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Buscar empresas no Avalia Solar..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  className="h-11 rounded-full border-gray-200 bg-white pl-11 pr-4 text-sm text-gray-900 focus-visible:ring-2 focus-visible:ring-blue-500/20"
                />
              </div>
              <div className="hidden lg:flex items-center gap-2">
                {categoryChips.map((chip) => (
                  <Link
                    key={chip.label}
                    href={chip.href}
                    className="whitespace-nowrap rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {chip.label}
                  </Link>
                ))}
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filtros
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-lg">
                  <SheetHeader>
                    <SheetTitle>Filtros</SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="mt-4 h-[85vh] pr-4">
                    <div className="space-y-4">
                      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">LocalizaÃ§Ã£o</p>
                        <LocationFilter
                          onStateChange={setStateFilter}
                          onCityChange={setCityFilter}
                          onClear={() => {
                            setStateFilter('all');
                            setCityFilter('');
                          }}
                          initialState={stateFilter}
                          initialCity={cityFilter}
                          className="mt-3"
                        />
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Ordenar</p>
                        <Select value={sortBy} onValueChange={(val) => { setSortBy(val); }}>
                          <SelectTrigger className="mt-3 w-full border-gray-200 bg-white text-sm">
                            <SelectValue placeholder="Ordenar por" />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="name">Nome A-Z</SelectItem>
                            <SelectItem value="location">Estado</SelectItem>
                            <SelectItem value="rating">Melhor avaliada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Tags rÃ¡pidas</p>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {ratingChips.map((chip) => (
                            <Button
                              key={chip.value}
                              type="button"
                              variant={sortBy === chip.value ? 'default' : 'outline'}
                              onClick={() => setSortBy(chip.value)}
                              className="justify-start"
                            >
                              {chip.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {activeFilters.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {activeFilters.map((filter) => (
                            <Badge key={filter.key} variant="secondary" className="flex items-center gap-1">
                              {filter.label}
                              <button aria-label="Remover filtro" onClick={filter.onClear}>
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                            Limpar tudo
                          </Button>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

        <main className="bg-gray-50 pb-16">
          <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">
            <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex flex-col items-center gap-2 rounded-xl bg-white p-4 text-center border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                  >
                    <div className={`flex h-11 w-11 items-center justify-center rounded-full ${action.styles}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{action.label}</span>
                  </Link>
                );
              })}
              <div className="col-span-2 row-span-2">
                <BannerByLocation location="navbar" />
              </div>
            </section>

            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {activeFilters.map((filter) => (
                  <Badge key={filter.key} variant="outline" className="bg-white border-gray-200 text-gray-800 flex items-center gap-1">
                    {filter.label}
                    <button aria-label="Remover filtro" onClick={filter.onClear}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-sm text-blue-700 hover:text-blue-800">
                  Limpar tudo
                </Button>
              </div>
            )}

            <section className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
              <aside className="space-y-4 lg:sticky lg:top-24">
                <div className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">LocalizaÃ§Ã£o</p>
                  <div className="mt-3 space-y-3">
                    <LocationFilter
                      className="w-full flex-col sm:flex-col gap-3"
                      onStateChange={setStateFilter}
                      onCityChange={setCityFilter}
                      onClear={() => {
                        setStateFilter('all');
                        setCityFilter('');
                      }}
                      initialState={stateFilter}
                      initialCity={cityFilter}
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Ordenar</p>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="mt-3 w-full border-gray-200 bg-white text-sm">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="name">Nome A-Z</SelectItem>
                      <SelectItem value="location">Estado</SelectItem>
                      <SelectItem value="rating">Melhor avaliada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Filtros</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ratingChips.map((chip) => (
                      <button
                        key={chip.value}
                        type="button"
                        onClick={() => setSortBy(chip.value)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          sortBy === chip.value
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                        aria-pressed={sortBy === chip.value}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              </aside>

              <section>
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                      <MapPin className="h-4 w-4" />
                      Resultado da busca
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Empresas recomendadas</h2>
                    <p className="text-xs text-gray-600">
                      {filteredCompanies.length} {filteredCompanies.length === 1 ? 'empresa' : 'empresas'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-white p-1 shadow-sm border border-gray-100 self-start">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`rounded-full p-2 ${viewMode === 'grid' ? 'bg-gray-900 text-white' : 'text-gray-500'}`}
                      aria-label="Visualizacao em grade"
                    >
                      <Grid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`rounded-full p-2 ${viewMode === 'list' ? 'bg-gray-900 text-white' : 'text-gray-500'}`}
                      aria-label="Visualizacao em lista"
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div
                    className={`grid gap-4 ${
                      viewMode === 'grid'
                        ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
                        : 'grid-cols-1'
                    }`}
                    data-testid="companies-grid"
                  >
                    {[...Array(viewMode === 'grid' ? 8 : 4)].map((_, i) => (
                      <CompanyCard key={i} company={{} as Company} isLoading />
                    ))}
                  </div>
                ) : visibleCompanies.length > 0 ? (
                  <div
                    className={`grid gap-4 ${
                      viewMode === 'grid'
                        ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
                        : 'grid-cols-1'
                    }`}
                    data-testid="companies-grid"
                  >
                    {visibleCompanies.map((company) => (
                      <div key={company.id} className={viewMode === 'list' ? 'col-span-full' : ''}>
                        <CompanyCard company={company} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                      <Filter className="h-6 w-6 text-yellow-700" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">Nenhuma empresa encontrada</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Ajuste os filtros ou termos de busca.
                    </p>
                    <Button
                      onClick={handleClearFilters}
                      variant="outline"
                      className="mt-4 border-gray-200 text-gray-700"
                    >
                      Limpar filtros
                    </Button>
                  </div>
                )}

                {visibleCompanies.length < filteredCompanies.length && (
                  <div className="mt-6 flex justify-center">
                    <Button
                      variant="outline"
                      className="border-gray-200 text-gray-800"
                      onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    >
                      Carregar mais empresas
                    </Button>
                  </div>
                )}
              </section>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
``

---
## Arquivo: CompanyCard.tsx
**Caminho:** `AB0-1-front/components/CompanyCard.tsx`

Content-Length: 14002 bytes

``tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Star, MapPin, MessageCircle, Building2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Avatar } from '@/components/ui/avatar';

import { Company } from '@/lib/api';
import { getFullImageUrl } from '@/utils/image';
import { buildCompanyPath, buildCompanySubPath } from '@/lib/slug';
import { openQuoteWizard } from '@/lib/quote-wizard';
import WhatsappButton from '@/components/WhatsappButton';

interface ExtendedCompany extends Company {
  cta_whatsapp_url?: string;
  whatsapp_url?: string;
  whatsapp_enabled?: boolean;
  effect?: boolean;
}

interface Props {
  company: Company;
  className?: string;
  compact?: boolean;
  lang?: 'pt-BR' | 'en-US' | 'es-ES';
  isLoading?: boolean;
  avatarRingColor?: string;
  schemaEnabled?: boolean;
  onAnalyticsEvent?: (event: { type: string; companyId: number; meta?: Record<string, any> }) => void;
}

const DICTIONARY = {
  'pt-BR': { whatsapp: 'WhatsApp', budget: 'OrÃ§amento', review: 'Avaliar', verified: 'Verificada', reviews: 'avaliaÃ§Ãµes' },
  'en-US': { whatsapp: 'WhatsApp', budget: 'Get Quote', review: 'Review', verified: 'Verified', reviews: 'reviews' },
  'es-ES': { whatsapp: 'WhatsApp', budget: 'Presupuesto', review: 'Evaluar', verified: 'Verificada', reviews: 'evaluaciones' },
} as const;

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

export default function CompanyCard({
  company: rawCompany,
  className = '',
  compact = false,
  lang = 'pt-BR',
  isLoading = false,
  avatarRingColor = '#ffffff',
  schemaEnabled = true,
  onAnalyticsEvent,
}: Props) {
  const router = useRouter();
  const company = rawCompany as ExtendedCompany;
  const { id, name, city, state, description, rating_count, average_rating, category_name, website } = company;

  const [bannerError, setBannerError] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [selected, setSelected] = useState(false);

  const rating = average_rating?.toFixed(1) ?? '0.0';
  const totalReviews = rating_count || 0;
  const companyPath = buildCompanyPath(id, name);
  const companyReviewPath = buildCompanySubPath(id, name, 'review');
  const bannerUrl = getFullImageUrl(company.banner_url || undefined);
  const logoUrl = getFullImageUrl(company.logo_url || undefined);

  const whatsappLinkRaw = (company as any).cta_whatsapp_url || (company as any).whatsapp_url || company.whatsapp;
  const hasWhatsapp = Boolean(whatsappLinkRaw);
  const enabledRaw = (company as any).cta_whatsapp_enabled ?? (company as any).whatsapp_enabled;
  const whatsappEnabled = enabledRaw === undefined || enabledRaw === null ? true : Boolean(enabledRaw);

  const text = DICTIONARY[lang] || DICTIONARY['pt-BR'];

  const [jsonLdStr, setJsonLdStr] = useState<string | null>(null);

  useEffect(() => {
    if (!schemaEnabled) { setJsonLdStr(null); return; }
    if (typeof window === 'undefined') { setJsonLdStr(null); return; }
    try {
      const url = window.location.origin + companyPath;
      const sameAs = website ? [website] : undefined;
      const aggregateRating = totalReviews > 0
        ? { '@type': 'AggregateRating', ratingValue: parseFloat(rating), reviewCount: totalReviews }
        : undefined;
      const obj = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name,
        url,
        logo: logoUrl || undefined,
        address: { '@type': 'PostalAddress', addressLocality: city || undefined, addressRegion: state || undefined },
        aggregateRating,
        sameAs,
      };
      setJsonLdStr(JSON.stringify(obj));
    } catch {
      setJsonLdStr(null);
    }
  }, [schemaEnabled, name, city, state, rating, totalReviews, logoUrl, website, companyPath]);

  const emit = useCallback((type: string, meta?: Record<string, any>) => {
    if (onAnalyticsEvent) onAnalyticsEvent({ type, companyId: id, meta });
  }, [onAnalyticsEvent, id]);

  useEffect(() => { emit('view'); }, [emit]);




  const formatPhone = (phone?: string) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    return digits.length < 10 ? phone : `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  if (isLoading) {
    return (
      <Card className={cn('overflow-hidden rounded-2xl border border-gray-200', className)}>
        <Skeleton className={cn('w-full', compact ? 'h-[80px]' : 'h-[100px]')} />
        <CardContent className="pt-4">
          <div className="relative -mt-8 mb-3">
            <Skeleton className={cn('rounded-full border-4 border-white shadow-sm', compact ? 'w-12 h-12' : 'w-14 h-14')} />
          </div>
          <Skeleton className="h-6 w-3/4 mb-2" />
          <div className="flex gap-2 mb-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3 mb-5" />
          <div className="mt-auto grid grid-cols-1 gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Banner ratio: keep cards more compact in carousels/lists.
  const bannerRatio = compact ? 4 : 3;
  const avatarSize = compact ? 52 : 60;

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('a,button,[role=button],input,select,textarea')) return;
    emit('card_click');
    router.push(companyPath);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      emit('card_key_activate');
      router.push(companyPath);
    }
  };

  return (
    <Card
      className={cn(
        'relative flex flex-col bg-white rounded-2xl border border-gray-200 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:ring-2 hover:ring-primary/30 focus-visible:ring-2 focus-visible:ring-primary/40 data-[selected=true]:ring-2 data-[selected=true]:ring-primary/50 data-[selected=true]:border-primary/50 cursor-pointer group',
        'overflow-hidden',
        className
      )}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      onFocus={() => setSelected(true)}
      onBlur={() => setSelected(false)}
      role="link"
      tabIndex={0}
      aria-label={`Visitar perfil ${name}`}
      aria-selected={selected}
      data-selected={selected}
      data-keywords={[name, city, state, category_name].filter(Boolean).join(', ')}
    >
      {jsonLdStr && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdStr }} />
      )}

      <div className="relative">
        <AspectRatio ratio={bannerRatio} className={cn('w-full')}>
          <div className={cn('relative w-full h-full')}>
            {bannerUrl && !bannerError ? (
              <Image
                src={bannerUrl}
                alt={`Banner ${name}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                onError={() => setBannerError(true)}
                className="object-cover object-center"
                data-testid="company-banner"
              />
            ) : compact ? (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900" />
            ) : (
              <Image
                src="/images/banner-avalia-solar.png"
                alt={`Banner padrÃ£o ${name}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover object-center"
                data-testid="company-banner"
              />
            )}
          </div>
        </AspectRatio>

        <div
          className={cn('absolute left-4', compact ? '-bottom-6' : '-bottom-7')}
          style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}
        >
          <div
            className={cn('relative rounded-full overflow-hidden bg-white')}
            style={{ width: avatarSize, height: avatarSize, boxShadow: `0 0 0 2px ${avatarRingColor}` }}
          >
            {logoUrl && !logoError ? (
              <Image
                src={logoUrl}
                alt={`Logo ${name}`}
                fill
                sizes="80px"
                onError={() => setLogoError(true)}
                className="object-cover object-center"
                data-testid="company-logo"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-50" data-testid="logo-placeholder">
                <Building2 className="text-gray-300 w-8 h-8" />
              </div>
            )}
          </div>
        </div>
      </div>

      <CardContent className={cn('pt-8', compact ? 'px-4 pb-4' : 'px-5 pb-5')}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0">
            <Link href={companyPath} onClick={(e) => { e.stopPropagation(); emit('title_click'); }}>
              <h3 className={cn('text-base font-semibold leading-tight line-clamp-1')}>{name}</h3>
            </Link>
            <div className="mt-1 flex items-center gap-2">
              {company.verified && (
                <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-800 border-emerald-200 px-1.5 py-0 rounded-md font-semibold">
                  {text.verified}
                </Badge>
              )}
              {category_name && (
                <span className="text-[11px] text-gray-600 font-medium bg-gray-100 px-2 py-0.5 rounded-full truncate max-w-[160px]">
                  {category_name}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end ml-3">
            {parseFloat(rating) > 0 && (
              <div className="inline-flex items-center rounded-md bg-amber-50 text-amber-700 px-2 py-1 text-xs font-semibold">
                <span>{rating}</span>
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 ml-1" />
              </div>
            )}
            <span className="text-[10px] text-gray-400 mt-1">
              {totalReviews > 0 ? `${totalReviews} ${text.reviews}` : 'Novo'}
            </span>
          </div>
        </div>

        {(city || state) && (
          <div className="mt-1 flex items-center gap-1 text-xs text-gray-600 truncate">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            <span className="truncate">{city}{city && state ? ', ' : ''}{state}</span>
          </div>
        )}

        <p className={cn('mt-2 text-sm text-gray-700', compact ? 'line-clamp-1' : 'line-clamp-2')}>
          {description || (
            <span className="text-gray-400 italic font-light">
              Visite o perfil para saber mais sobre nossos serviÃ§os.
            </span>
          )}
        </p>

        <div className="h-px bg-gray-100 w-full my-4" />

        <div className={cn(compact ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-1 gap-3', 'print:hidden')}>
          {hasWhatsapp && whatsappEnabled ? (
            <WhatsappButton
              enabled
              href={whatsappLinkRaw}
              label={text.whatsapp}
              className={cn('w-full shadow-sm font-medium', compact ? 'h-9 text-sm' : 'h-10')}
              onClick={() => { emit('cta_whatsapp_click'); }}
            />
          ) : (
            <Button
              type="button"
              className={cn('w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium focus-visible:ring-2 focus-visible:ring-primary/40', compact ? 'h-9 text-sm' : 'h-10')}
              aria-label="Solicitar orÃ§amento com a empresa"
              data-testid="company-card-budget-btn"
              onClick={(e) => { e.stopPropagation(); openQuoteWizard({ preferredCompanyId: id, source: 'company-card' }); }}
            >
              <MessageCircle className={cn('mr-2', compact ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
              {text.budget}
            </Button>
          )}

          <Button
            variant="outline"
            className={cn('w-full border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium', compact ? 'h-9 text-sm' : 'h-10')}
            asChild
          >
            <Link href={companyReviewPath} aria-label="Avaliar empresa" onClick={(e) => { e.stopPropagation(); emit('cta_review_click'); }}>
              <Star className={cn('mr-2 text-gray-400 group-hover:text-amber-500 transition-colors', compact ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
              {text.review}
            </Link>
          </Button>
        </div>

        <div className="hidden print:block">
          <div className="grid grid-cols-2 gap-2">
            {company.whatsapp && <div>Tel: {formatPhone(company.whatsapp)}</div>}
            {company.email && <div>Email: {company.email}</div>}
            {website && <div className="col-span-2">{website.replace(/^https?:\/\//, '')}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
``

---
## Arquivo: globals.css
**Caminho:** `AB0-1-front/app/globals.css`

Content-Length: 6557 bytes

``css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 245, 247, 250; /* Um cinza muito claro, quase branco */
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 17, 24, 39; /* Darker blue-gray for dark mode */
    --background-end-rgb: 0, 0, 0;
  }
}

@layer base {
  html {
    /* Remove problematic vendor prefixes and use standard property */
    text-size-adjust: 100%;
  }
}

@layer base {
  :root {
    --background: 0 0% 98%; /* Clean White Background - Enterprise */
    --foreground: 0 0% 10%; /* Deep Dark Gray - Professional */

    --card: 0 0% 100%; /* Pure White Card */
    --card-foreground: 0 0% 10%; /* Deep Dark Gray */

    --popover: 0 0% 100%; /* Pure White Popover */
    --popover-foreground: 0 0% 10%; /* Deep Dark Gray */

    --primary: 217 91% 60%; /* Professional Blue - Enterprise */
    --primary-foreground: 0 0% 100%; /* Pure White */

    --secondary: 0 0% 96%; /* Light Gray - Subtle */
    --secondary-foreground: 0 0% 10%; /* Deep Dark Gray */

    --muted: 0 0% 96%; /* Light Gray for muted elements */
    --muted-foreground: 0 0% 45%; /* Medium Gray - readable */

    --accent: 173 80% 40%; /* Professional Teal - Subtle accent */
    --accent-foreground: 0 0% 100%; /* White */

    --destructive: 0 63% 50%; /* Professional Red */
    --destructive-foreground: 0 0% 100%; /* White */

    --border: 0 0% 90%; /* Subtle Border - Enterprise */
    --input: 0 0% 90%; /* Subtle Input Border */
    --ring: 217 91% 60%; /* Primary color for focus ring */

    /* Chart colors - professional and balanced */
    --chart-1: 217 91% 60%; /* Blue */
    --chart-2: 173 80% 40%; /* Teal */
    --chart-3: 262 83% 58%; /* Purple */
    --chart-4: 25 95% 53%;  /* Orange */
    --chart-5: 142 76% 36%; /* Green */

    --radius: 0.375rem;
  }

  .dark {
    --background: 0 0% 4%; /* Deep Black Background - Enterprise */
    --foreground: 0 0% 95%; /* Almost White with slight warmth */

    --card: 0 0% 7%; /* Dark Gray Card - Subtle elevation */
    --card-foreground: 0 0% 95%; /* Almost White */

    --popover: 0 0% 7%; /* Dark Gray Popover */
    --popover-foreground: 0 0% 95%; /* Almost White */

    --primary: 217 91% 60%; /* Professional Blue - Enterprise */
    --primary-foreground: 0 0% 100%; /* Pure White */

    --secondary: 0 0% 10%; /* Subtle Gray - Enterprise */
    --secondary-foreground: 0 0% 95%; /* Almost White */

    --muted: 0 0% 10%; /* Subtle Gray for muted elements */
    --muted-foreground: 0 0% 60%; /* Medium Gray - readable */

    --accent: 173 80% 40%; /* Professional Teal - Subtle accent */
    --accent-foreground: 0 0% 100%; /* White */

    --destructive: 0 63% 50%; /* Professional Red - not too bright */
    --destructive-foreground: 0 0% 100%; /* White */

    --border: 0 0% 14%; /* Subtle Border - Enterprise */
    --input: 0 0% 14%; /* Subtle Input Border */
    --ring: 217 91% 60%; /* Primary color for focus ring */

    /* Chart colors in dark mode - professional and balanced */
    --chart-1: 217 91% 60%; /* Blue */
    --chart-2: 173 80% 40%; /* Teal */
    --chart-3: 262 83% 58%; /* Purple */
    --chart-4: 25 95% 53%;  /* Orange */
    --chart-5: 142 76% 36%; /* Green */
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
  
  /* Custom Scrollbar */
  * {
    scrollbar-width: thin;
    scrollbar-color: hsl(var(--muted)) transparent;
  }
  
  *::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  *::-webkit-scrollbar-track {
    background: transparent;
  }
  
  *::-webkit-scrollbar-thumb {
    background: hsl(var(--muted));
    border-radius: 4px;
  }
  
  *::-webkit-scrollbar-thumb:hover {
    background: hsl(var(--muted-foreground));
  }
}

@layer utilities {
  /* Glass morphism */
  .glass {
    @apply bg-background/80 backdrop-blur-xl border border-border/50;
  }
  
  /* Gradient text */
  .gradient-text {
    @apply bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent;
  }
  
  /* Smooth transitions */
  .smooth-transition {
    @apply transition-all duration-300 ease-in-out;
  }

  /* Hide scrollbars (horizontal chips, tabs, etc) */
  .no-scrollbar {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }

  .no-scrollbar::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
}
/* TASK-027: Toast animations */
@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slide-out {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}

.animate-slide-out {
  animation: slide-out 0.3s ease-in;
}

.company-card {
  position: relative;
  z-index: 1;
}

.company-card.effect-active::after {
  content: "";
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  pointer-events: none;
  z-index: 0;
  background: linear-gradient(135deg, #00f2fe 0%, #ffffff 50%, #00f2fe 100%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  padding: 2px;
  animation: electricPulse 1.8s ease-in-out infinite;
}

@keyframes electricPulse {
  0%, 100% { opacity: 0.85; filter: drop-shadow(0 0 1px rgba(0,242,254,0.6)); }
  50% { opacity: 1; filter: drop-shadow(0 0 6px rgba(0,242,254,0.9)); }
}

.company-card.effect-active {
  will-change: transform, filter;
  animation: gentleShake 0.5s ease-in-out 0s 3 both;
  animation-delay: 5s;
}

@keyframes gentleShake {
  0%   { transform: translate(0, 0); }
  20%  { transform: translate(2px, -2px); }
  40%  { transform: translate(-3px, 1px); }
  60%  { transform: translate(3px, 0px); }
  80%  { transform: translate(-2px, 3px); }
  100% { transform: translate(0, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .company-card.effect-active,
  .company-card.effect-active::after {
    animation: none !important;
  }
}
``

---
## Arquivo: companies_controller.rb
**Caminho:** `AB0-1-back/app/controllers/api/v1/companies_controller.rb`

Content-Length: 20907 bytes

``ruby
# app/controllers/api/v1/companies_controller.rb
module Api
  module V1
    class CompaniesController < BaseController
      include Paginatable # TASK-017: Enable pagination
      
      before_action :set_company, only: %i[show update destroy analytics_historical analytics_reviews analytics_competitors analytics_traffic categories]
      before_action :authenticate_api_user, only: %i[analytics_historical analytics_reviews analytics_competitors analytics_traffic]
      before_action :authorize_company_scope!, only: %i[analytics_historical analytics_reviews analytics_competitors analytics_traffic]

      # GET /api/v1/companies
      def index
        Rails.logger.info("Starting companies#index with params: #{params.inspect}")

        retries = 0
        begin
          @companies = ::Company.includes(:categories, :reviews)
                              .order(created_at: :desc)

          # Filtra por empresas do usuÃ¡rio autenticado
          if ActiveModel::Type::Boolean.new.cast(params[:mine])
            authenticate_api_user
            @companies = @companies.joins(:company_members).where(company_members: { user_id: current_user.id })
          end

          # Filtros
          if params[:status].present?
            @companies = @companies.where(status: params[:status])
          else
            # Default: listar apenas empresas ativas
            @companies = @companies.where(status: ::Company.statuses[:active])
          end

          if params[:featured].present?
            featured_value = ActiveModel::Type::Boolean.new.cast(params[:featured])
            @companies = @companies.where(featured: featured_value)
          end

          if params[:category_id].present?
            @companies = @companies.joins(:categories).where(categories: { id: params[:category_id] })
          end
          
          # Apply manual limit only if not using pagination
          if params[:limit].present? && !params[:page].present?
            @companies = @companies.limit(params[:limit].to_i)
          end

          # Apply pagination if page parameter is present
          if params[:page].present?
            paginated = paginate(@companies)
            set_pagination_headers(paginated)
            
            companies_json = paginated.map do |company|
              company_json_attributes(company)
            end

            render json: { 
              data: companies_json,
              meta: { pagination: pagination_metadata(paginated) }
            }, status: :ok
          else
            companies_json = @companies.map do |company|
              company_json_attributes(company)
            end

            render json: companies_json, status: :ok
          end
        rescue ActiveRecord::StatementInvalid, ActiveRecord::ConnectionNotEstablished => e
          if (retries += 1) <= 3
            Rails.logger.warn("Transient database error in CompaniesController#index, retrying (#{retries}/3): #{e.message}")
            sleep(0.1 * retries)
            retry
          end
          raise e
        rescue => e
          Rails.logger.error("Error in CompaniesController#index: #{e.message}\n#{e.backtrace.first(10).join("\n")}")
          render json: { 
            error: 'Internal Server Error', 
            message: 'Ocorreu um erro ao processar sua solicitaÃ§Ã£o. Por favor, tente novamente mais tarde.'
          }, status: :internal_server_error
        end
      end

      # GET /api/v1/companies/:id
      def show
        return render json: { error: 'Company not found' }, status: :not_found unless @company
        company_json = {
          id: @company.id,
          name: @company.name,
          description: @company.description,
          website: @company.website,
          phone: @company.phone,
          address: @company.address,
          state: @company.state,
          city: @company.city,
          created_at: @company.created_at,
          updated_at: @company.updated_at,
          banner_url: @company.banner_url,
          logo_url: @company.logo_url,
          rating_avg: @company.rating_avg,
          rating_count: @company.rating_count,
          status: @company.status,
          featured: @company.featured,
          verified: @company.verified,
          founded_year: @company.founded_year,
          employees_count: @company.employees_count,
          certifications: @company.certifications,
          email_public: @company.email_public,
          instagram: @company.instagram,
          facebook: @company.facebook,
          linkedin: @company.linkedin,
          working_hours: @company.working_hours,
          payment_methods: @company.payment_methods,
          buttons: Rails.cache.fetch("company_buttons/#{@company.id}/#{@company.updated_at.to_i}", expires_in: 5.minutes) do
            @company.company_buttons.active.ordered.select(:label, :url, :button_type).as_json(only: [:label, :url, :button_type])
          end,
          ctas: [],
          cta_whatsapp_enabled: @company.respond_to?(:cta_whatsapp_enabled) ? @company.cta_whatsapp_enabled : nil,
          cta_whatsapp_url: @company.respond_to?(:cta_whatsapp_url) ? @company.cta_whatsapp_url : nil,
          whatsapp_button_style_json: @company.respond_to?(:whatsapp_button_style_json) ? @company.whatsapp_button_style_json : nil,
          plan_status: @company.respond_to?(:plan_status) ? @company.plan_status : nil,
          plan_id: @company.respond_to?(:plan_id) ? @company.plan_id : nil,
          has_paid_plan: (@company.respond_to?(:plan_status) && @company.respond_to?(:plan)) ? @company.has_paid_plan? : false,
          project_types: @company.project_types || [],
          services_offered: @company.services_offered || []
        }
        render json: { company: company_json }, status: :ok
      end

      def categories
        cats = @company.categories.select(:id, :name, :seo_url, :status, :featured, :created_at, :updated_at)
        render json: { categories: cats.as_json }, status: :ok
      end

      # POST /api/v1/companies
      def create
        @company = ::Company.new(company_params)
        @company.status = 'pending' if @company.status.blank?
        if @company.save
          PendingChange.create!(
            company: @company,
            user_id: current_user&.id,
            change_type: 'company_create',
            data: { requested_at: Time.current },
            status: 'pending'
          )

          begin
            AdminUser.find_each do |admin|
              NotificationMailer.admin_alert(
                admin.email,
                'Nova empresa cadastrada',
                "Empresa #{@company.name} criada com status pendente em #{Time.current}"
              ).deliver_later
            end
            
            # Send confirmation email to company
            ::CompanyMailer.registration_received(@company).deliver_later
          rescue => e
            Rails.logger.warn "Falha ao notificar: #{e.message}"
          end

          company_json = {
            id: @company.id,
            name: @company.name,
            description: @company.description,
            website: @company.website,
            phone: @company.phone,
            address: @company.address,
            state: @company.state,
            city: @company.city,
            status: @company.status,
            featured: @company.featured,
            verified: @company.verified
          }
          render json: { company: company_json }, status: :created
        else
          render json: { errors: @company.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH/PUT /api/v1/companies/:id
      def update
        if @company.update(company_params)
          company_json = {
            id: @company.id,
            name: @company.name,
            description: @company.description,
            website: @company.website,
            phone: @company.phone,
            address: @company.address,
            state: @company.state,
            city: @company.city,
            status: @company.status,
            featured: @company.featured,
            verified: @company.verified
          }
          render json: { company: company_json }, status: :ok
        else
          render json: { errors: @company.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/companies/:id
      def destroy
        @company.destroy
        head :no_content
      end

      # GET /api/v1/companies/states
      def states
        states = Locations::BrLocations.states.map { |state| state['acronym'] }
        render json: { states: states }
      end

      # GET /api/v1/companies/cities
      def cities
        state = params[:state].to_s.strip.upcase
        cities = state.present? ? Locations::BrLocations.cities_for(state) : []
        render json: { cities: cities }
      end

      # GET /api/v1/companies/locations
      def locations
        locations = ::Company.distinct.pluck(:state, :city).compact
                           .map { |state, city| { state: state, city: city } }
                           .sort_by { |loc| [loc[:state], loc[:city]] }
        render json: { locations: locations }
      end

      private

      def set_company
        @company = ::Company.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Company not found' }, status: :not_found and return
        nil
      end

      def company_json_attributes(company)
        {
          id: company.id,
          name: company.name,
          description: company.description,
          website: company.website,
          phone: company.phone,
          address: company.address,
          state: company.state,
          city: company.city,
          created_at: company.created_at,
          updated_at: company.updated_at,
          banner_url: company.banner_url,
          logo_url: company.logo_url,
          rating_avg: company.rating_avg,
          rating_count: company.rating_count,
          status: company.status,
          featured: company.featured,
          verified: company.verified,
          founded_year: company.founded_year,
          employees_count: company.employees_count,
          certifications: company.certifications,
          email_public: company.email_public,
          instagram: company.instagram,
          facebook: company.facebook,
          linkedin: company.linkedin,
          working_hours: company.working_hours,
          payment_methods: company.payment_methods,
          buttons: Rails.cache.fetch("company_buttons/#{company.id}/#{company.updated_at.to_i}", expires_in: 5.minutes) do
            company.company_buttons.active.ordered.select(:label, :url, :button_type, :active, :position).as_json(only: [:label, :url, :button_type])
          end,
          ctas: [],
          cta_whatsapp_enabled: company.respond_to?(:cta_whatsapp_enabled) ? company.cta_whatsapp_enabled : nil,
          cta_whatsapp_url: company.respond_to?(:cta_whatsapp_url) ? company.cta_whatsapp_url : nil,
          whatsapp_button_style_json: company.respond_to?(:whatsapp_button_style_json) ? company.whatsapp_button_style_json : nil,
          plan_status: company.respond_to?(:plan_status) ? company.plan_status : nil,
          plan_id: company.respond_to?(:plan_id) ? company.plan_id : nil,
          has_paid_plan: company.has_paid_plan?
        }
      end

      def company_params
        params.require(:company).permit(
          :name, :description, :website, :phone, :address, :state, :city,
          :featured, :status, :verified, :founded_year, :employees_count,
          :cnpj, :email_public, :instagram, :facebook, :linkedin,
          :working_hours, :payment_methods, :certifications,
          :cta_whatsapp_enabled, :cta_whatsapp_url, :plan_id, :plan_status,
          whatsapp_button_style_json: [
            :variant, :bg_color, :text_color, :border_color,
            :hover_bg_color, :icon_color, :rounded_px
          ],
          project_types: [], services_offered: []
        )
      end

      def analytics_historical
        days = params[:days]&.to_i || 30
        cache_key = "company_#{@company.id}_historical_#{days}_#{Date.today}"

        data = Rails.cache.fetch(cache_key, expires_in: 15.minutes) do
          generate_historical_data(@company, days)
        end

        render json: { data: data }, status: :ok
      rescue => e
        Rails.logger.error("analytics_historical error: #{e.message}")
        render json: { data: [] }, status: :ok
      end

      def analytics_reviews
        render json: reviews_data
      end

      def analytics_competitors
        render json: competitors_data
      end

      def analytics_traffic
        days = params[:days]&.to_i || 30
        cache_key = "company_#{@company.id}_traffic_#{days}_#{Date.today}"

        sources = Rails.cache.fetch(cache_key, expires_in: 15.minutes) do
          generate_traffic_sources(@company, days)
        end

        render json: { sources: sources }, status: :ok
      rescue => e
        Rails.logger.error("analytics_traffic error: #{e.message}")
        render json: { sources: [] }, status: :ok
      end

      def request_admin_access
        authenticate_api_user
        return unless @company

        change = PendingChange.create!(
          company: @company,
          user_id: current_user&.id,
          change_type: 'access_request',
          data: { requested_at: Time.current },
          status: 'pending'
        )

        render json: { message: 'SolicitaÃ§Ã£o enviada para aprovaÃ§Ã£o', pending_change: change }, status: :created
      end

      private

       def historical_data
         company = Company.find(params[:id])
         days = params[:days]&.to_i || 30
         data = generate_historical_data(company, days)
         { data: data }
       rescue ActiveRecord::RecordNotFound
         { error: 'Company not found' }
       end

       def reviews_data
         company = Company.find(params[:id])
         reviews = company.reviews.includes(:user)
         distribution = reviews.group(:rating).count
         {
           total_reviews: reviews.count,
           average_rating: company.rating_avg || 0,
           rating_distribution: {
             5 => distribution[5.0] || 0,
             4 => distribution[4.0] || 0,
             3 => distribution[3.0] || 0,
             2 => distribution[2.0] || 0,
             1 => distribution[1.0] || 0
           },
           recent_reviews: reviews.order(created_at: :desc).limit(10).map do |review|
             {
               id: review.id,
               rating: review.rating,
               comment: review.comment,
               user_name: review.user&.name || 'AnÃ´nimo',
               created_at: review.created_at,
               verified: review.verified
             }
           end,
           sentiment_analysis: calculate_sentiment(reviews)
         }
       rescue ActiveRecord::RecordNotFound
         { error: 'Company not found' }
       end

       def competitors_data
         company = Company.find(params[:id])
         category_id = params[:category_id]
         competitors = Company
           .joins(:categories)
           .where(categories: { id: category_id })
           .where.not(id: company.id)
           .where(status: 'active')
           .order(rating_avg: :desc)
           .limit(10)
         total_companies = competitors.count
         company_position = competitors.index { |c| c.rating_avg <= company.rating_avg } || total_companies
         {
           competitors: competitors.map.with_index(1) do |competitor, index|
             {
               company_id: competitor.id,
               company_name: competitor.name,
               rating: competitor.rating_avg || 0,
               reviews_count: competitor.reviews_count || 0,
               market_position: index,
               category_share: calculate_market_share(competitor, category_id)
             }
           end,
           company_position: company_position + 1,
           total_competitors: total_companies
         }
       rescue ActiveRecord::RecordNotFound
         { error: 'Company not found' }
       end

      def traffic_data
        days = params[:days]&.to_i || 30
        sources = generate_traffic_sources(@company, days)
        { sources: sources }
      end

       def calculate_sentiment(reviews)
         positive = reviews.where('rating >= ?', 4).count
         negative = reviews.where('rating <= ?', 2).count
         total = reviews.count
         {
           positive_percentage: total > 0 ? (positive.to_f / total * 100).round(2) : 0,
           negative_percentage: total > 0 ? (negative.to_f / total * 100).round(2) : 0
         }
       end

       def calculate_market_share(company, category_id)
         total_reviews = Company.joins(:categories).where(categories: { id: category_id }).sum(:reviews_count)
         company_reviews = company.reviews_count || 0
         total_reviews > 0 ? (company_reviews.to_f / total_reviews * 100).round(2) : 0
       end

      def generate_traffic_sources(company, days)
        from_time = days.to_i.days.ago.beginning_of_day
        to_time = Time.current.end_of_day

        events = AnalyticsEvent.where(company_id: company.id, tracked_at: from_time..to_time, event_type: 'profile_view')
        lead_events = AnalyticsEvent.where(company_id: company.id, tracked_at: from_time..to_time, event_type: 'lead_created')

        visit_counts = Hash.new(0)
        lead_counts = Hash.new(0)

        events.find_each do |e|
          source = normalize_source(e.metadata)
          visit_counts[source] += 1
        end

        lead_events.find_each do |e|
          source = normalize_source(e.metadata)
          lead_counts[source] += 1
        end

        total = visit_counts.values.sum
        return [] if total.zero?

        visit_counts.map do |source, visits|
          leads = lead_counts[source].to_i
          {
            source: source,
            visits: visits,
            percentage: ((visits.to_f / total) * 100).round(2),
            conversion_rate: visits.positive? ? ((leads.to_f / visits) * 100).round(2) : 0
          }
        end.sort_by { |row| -row[:visits].to_i }
      end

      def generate_historical_data(company, days)
        days = days.to_i
        from_day = days.days.ago.to_date
        to_day = Date.current

        by_day = CompanyDailyStat
          .for_company(company.id)
          .for_days(from_day, to_day)
          .order(:day)
          .index_by(&:day)

        (from_day..to_day).map do |day|
          stat = by_day[day]
          views = stat&.profile_views.to_i
          clicks = stat&.cta_clicks.to_i + stat&.whatsapp_clicks.to_i
          leads = stat&.leads.to_i
          conversion = views.positive? ? ((leads.to_f / views) * 100).round(2) : 0

          {
            date: day.to_s,
            views: views,
            clicks: clicks,
            leads: leads,
            conversion: conversion
          }
        end
      end

      def normalize_source(metadata)
        meta = metadata.is_a?(Hash) ? metadata : {}
        utm = meta['utm_source'].to_s.strip
        return utm if utm.present?

        ref = meta['referrer'].to_s
        return 'Direct' if ref.blank?

        host = URI.parse(ref).host.to_s.downcase rescue ''
        return 'Organic Search' if host.include?('google') || host.include?('bing') || host.include?('duckduckgo')
        return 'Social Media' if host.include?('facebook') || host.include?('instagram') || host.include?('linkedin') || host.include?('t.co') || host.include?('x.com')

        'Referral'
      end

      def authorize_company_scope!
        return if current_user&.role.in?(%w[admin review])

        if current_user&.role == 'company' && current_user.company_id == @company&.id
          unless @company.active?
            render json: { error: 'Company account is not active' }, status: :forbidden
            return
          end
          return
        end

        Rails.logger.warn("[AccessDenied] analytics user=#{current_user&.id} role=#{current_user&.role} company_id=#{current_user&.company_id} target_company=#{@company&.id} path=#{request.path}")
        render json: { error: 'Forbidden' }, status: :forbidden
      end
    end
  end
end
``

---
## Arquivo: company.rb
**Caminho:** `AB0-1-back/app/models/company.rb`

Content-Length: 13931 bytes

``ruby
class Company < ApplicationRecord
  include QueryCacheable # TASK-016: Query Caching
  include Moderation
  has_paper_trail # Enable rollback capabilities

  enum status: {
    active: 'active',
    inactive: 'inactive',
    pending: 'pending',
    blocked: 'blocked'
  }, _suffix: true

  # =========================
  # Attachments
  # =========================
  has_one_attached :banner
  has_one_attached :logo
  has_many_attached :media_assets

  # =========================
  # Associations
  # =========================
  has_and_belongs_to_many :categories, join_table: :categories_companies
  has_many :reviews, dependent: :destroy
  has_many :pending_changes, dependent: :destroy
  has_many :products, dependent: :destroy
  has_many :leads, dependent: :destroy
  has_many :lead_distributions, dependent: :destroy
  has_many :campaigns, dependent: :destroy
  has_many :company_buttons, dependent: :destroy
  accepts_nested_attributes_for :company_buttons, allow_destroy: true
  has_many :financing_options, dependent: :destroy
  accepts_nested_attributes_for :financing_options, allow_destroy: true
  has_many :banners, dependent: :nullify
  has_many :banner_subscriptions, dependent: :destroy
  has_many :company_videos, dependent: :destroy
  belongs_to :plan, optional: true
  has_many :company_members, dependent: :destroy
  has_many :members, through: :company_members, source: :user

  # =========================
  # Callbacks
  # =========================
  attr_accessor :category_ids_for_metrics_update

  before_save :capture_category_ids_for_metrics, prepend: true
  after_save :update_associated_categories_metrics
  # after_commit :update_associated_categories_metrics, on: [:create, :update, :destroy]

  # =========================
  # Validations
  # =========================
  validates :name, presence: true, length: { minimum: 2 }
  validates :description, presence: true
  validates :status, inclusion: { in: statuses.keys }, allow_nil: true
  validate :validate_cnpj_format
  validate :validate_state_in_dataset
  validate :validate_city_in_dataset
  validate :validate_ticket_range
  validate :validate_ready_for_activation, if: -> { status == 'active' }
  validate :validate_featured_requires_active
  validate :validate_verified_requires_cnpj

  validates :website,
            format: { with: URI::DEFAULT_PARSER.make_regexp(%w[http https]),
                      message: 'must be a valid URL' },
            allow_blank: true
  validates :phone,
            format: { with: /\A\d{10,15}\z/,
                      message: 'must contain only digits (DDD + nÃºmero)' },
            allow_blank: true
  
  validates :whatsapp,
            format: { with: /\A\d{10,15}\z/,
                      message: 'must be a valid WhatsApp number' },
            allow_blank: true
            
  SIMPLE_EMAIL_REGEX = /\A[^@\s]+@[^@\s]+\.[^@\s]+\z/
  validates :email,
            format: { with: SIMPLE_EMAIL_REGEX,
                      message: 'must be a valid email' },
            allow_blank: true
  validates :email_public,
            format: { with: SIMPLE_EMAIL_REGEX,
                      message: 'must be a valid email' },
            allow_blank: true
                      
  validate :validate_corporate_email

  validates :whatsapp_url,
            presence: true,
            format: { with: URI::DEFAULT_PARSER.make_regexp(%w[http https]),
                      message: 'deve ser uma URL vÃ¡lida (ex: https://wa.me/)' },
            if: :whatsapp_enabled?,
            allow_blank: false

  validates :minimum_ticket,
            numericality: { greater_than_or_equal_to: 0 },
            allow_nil: true
  validates :maximum_ticket,
            numericality: { greater_than_or_equal_to: 0 },
            allow_nil: true
  
  # Validate that minimum_ticket is less than maximum_ticket if both are present
  def validate_ticket_range
    return if minimum_ticket.blank? || maximum_ticket.blank?
    
    if minimum_ticket > maximum_ticket
      errors.add(:minimum_ticket, 'deve ser menor ou igual ao ticket mÃ¡ximo')
    end
  end

  # Scopes
  scope :active, -> { where(status: 'active') }
  scope :featured, -> { where(featured: true) }
  scope :verified, -> { where(verified: true) }
  scope :by_state, ->(state) { where(state: state) if state.present? }
  scope :by_city, ->(city) { where(city: city) if city.present? }
  scope :ordered, -> { order(featured: :desc, rating_avg: :desc, name: :asc) }

  def self.ransackable_attributes(auth_object = nil)
    ["name", "description", "status", "state", "city", "featured", "verified", "cnpj", "founded_year", "employees_count", "rating_avg", "created_at", "updated_at", "project_types", "services_offered", "plan_id", "moderation_status"]
  end

  def self.ransackable_associations(auth_object = nil)
    ["categories", "products", "reviews", "leads", "campaigns", "company_buttons", "financing_options", "banners", "banner_subscriptions", "company_videos", "plan", "company_members", "members"]
  end

  def average_rating
    rating_avg
  end

  def rating_count
    reviews.count
  end

  def to_s
    name
  end
  
  def validate_ready_for_activation
    if name.blank? || name.length < 5
      errors.add(:name, 'Ã© obrigatÃ³rio para ativaÃ§Ã£o')
    end

    if email.blank? || !SIMPLE_EMAIL_REGEX.match?(email)
      errors.add(:email, 'invÃ¡lido ou ausente para ativaÃ§Ã£o')
    end

    unless Locations::BrLocations.valid_state?(state)
      errors.add(:state, 'invÃ¡lido ou ausente para ativaÃ§Ã£o')
    end

    unless Locations::BrLocations.valid_city?(state, city)
      errors.add(:city, 'invÃ¡lida ou ausente para ativaÃ§Ã£o')
    end

    unless categories.any?
      errors.add(:categories, 'pelo menos uma categoria Ã© necessÃ¡ria para ativaÃ§Ã£o')
    end

    unless phone.present? || whatsapp.present? || email_public.present?
      errors.add(:base, 'Pelo menos um contato (Telefone, WhatsApp ou Email PÃºblico) Ã© necessÃ¡rio para ativaÃ§Ã£o')
    end
  end

  def validate_featured_requires_active
    return unless featured
    return if status == 'active'

    errors.add(:featured, 'sÃ³ pode ser verdadeiro quando o status Ã© active')
  end

  def validate_verified_requires_cnpj
    return unless verified

    digits = cnpj.to_s.gsub(/\D/, '')
    if digits.length < 14 || (defined?(CNPJ) && !CNPJ.valid?(cnpj))
      errors.add(:verified, 'exige um CNPJ vÃ¡lido')
    end
  end

  def validate_corporate_email
    return if email_public.blank?
    
    # List of common public email providers to block
    public_domains = %w[gmail.com yahoo.com hotmail.com outlook.com uol.com.br bol.com.br terra.com.br live.com icloud.com]
    domain = email_public.split('@').last.downcase
    
    if public_domains.include?(domain)
      errors.add(:email_public, 'deve ser um e-mail corporativo')
    end
  end

  def normalize_company_fields
    self.state = state.to_s.strip.upcase if state.present?
    self.city = city.to_s.strip.gsub(/\s+/, ' ') if city.present?
    self.email = email.to_s.strip.downcase if email.present?
    self.email_public = email_public.to_s.strip.downcase if email_public.present?
    self.phone = normalize_phone_value(phone)
    self.phone_alt = normalize_phone_value(phone_alt)
    self.whatsapp = normalize_phone_value(whatsapp)

    if whatsapp.present? && whatsapp_url.blank?
      digits = whatsapp.to_s
      digits = digits.sub(/\A55/, '') if digits.length > 11
      self.whatsapp_url = "https://wa.me/55#{digits}"
    end
  end

  def normalize_phone_value(value)
    digits = value.to_s.gsub(/\D/, '')
    digits.presence
  end

  def normalize_multiselects
    if respond_to?(:project_types)
      self.project_types = Array(self.project_types).map { |v| v.to_s.strip }.reject(&:blank?)
    end
    if respond_to?(:services_offered)
      self.services_offered = Array(self.services_offered).map { |v| v.to_s.strip }.reject(&:blank?)
    end
  end

  # Analytics methods
  def profile_views_on(date)
    analytics_events
      .by_type('view')
      .where(tracked_at: date.beginning_of_day..date.end_of_day)
      .count
  end

  def cta_clicks_on(date)
    analytics_events
      .by_type('click')
      .where(tracked_at: date.beginning_of_day..date.end_of_day)
      .count
  end

  def historical_stats(days = 30)
    Rails.cache.fetch("company_#{id}_historical_#{days}_days", expires_in: 1.hour) do
      calculate_historical_stats(days)
    end
  end

  def validate_logo_attachment
    return unless logo.attached?
    if !logo.blob.content_type.in?(%w[image/png image/jpeg])
      errors.add(:logo, 'deve ser PNG ou JPG')
    end
    if logo.blob.byte_size > 2.megabytes
      errors.add(:logo, 'tamanho mÃ¡ximo Ã© 2MB')
    end
  end

  def validate_banner_attachment
    return unless banner.attached?
    if !banner.blob.content_type.in?(%w[image/png image/jpeg image/webp])
      errors.add(:banner, 'deve ser PNG, JPG ou WebP')
    end
    if banner.blob.byte_size > 5.megabytes
      errors.add(:banner, 'tamanho mÃ¡ximo Ã© 5MB')
    end
    begin
      banner.blob.analyze unless banner.blob.analyzed?
      meta = banner.blob.metadata || {}
      w = meta['width']
      h = meta['height']
      if w && h && (w < 1920 || h < 600)
        errors.add(:banner, 'dimensÃµes mÃ­nimas recomendadas: 1920x600px')
      end
    rescue => e
      Rails.logger.warn "Falha ao analisar dimensÃµes do banner: #{e.message}"
    end
  end
  
  # Constantes (mantidas no modelo)
  PROJECT_TYPES = %w[Residenciais Comerciais Rurais].freeze
  SERVICES_OFFERED = [
    'InstalaÃ§Ã£o Residencial',
    'InstalaÃ§Ã£o Comercial',
    'InstalaÃ§Ã£o Industrial',
    'ManutenÃ§Ã£o e Suporte',
    'Consultoria EnergÃ©tica'
  ].freeze

  before_validation :normalize_company_fields
  before_validation :normalize_multiselects
  validate :validate_project_types, :validate_services_offered

  # MÃ‰TODOS DE VALIDAÃ‡ÃƒO (Corrigidos para usar self.)
  def validate_project_types
    # O erro 'undefined local variable' acontece aqui se nÃ£o usarmos 'self.' ou se o atributo nÃ£o estiver definido.
    # Usando 'self.project_types' resolve o escopo.
    return if self.project_types.blank? 
    invalid = Array(self.project_types) - PROJECT_TYPES
    errors.add(:project_types, "valores invÃ¡lidos: #{invalid.join(', ')}") if invalid.any?
  end

  def validate_services_offered
    return if self.services_offered.blank?
    invalid = Array(self.services_offered) - SERVICES_OFFERED
    errors.add(:services_offered, "valores invÃ¡lidos: #{invalid.join(', ')}") if invalid.any?
  end

  def validate_cnpj_format
    return if cnpj.blank?
    unless CNPJ.valid?(cnpj)
      errors.add(:cnpj, 'invÃ¡lido')
    end
  end

  def validate_state_in_dataset
    return if state.blank?
    return if Locations::BrLocations.valid_state?(state)

    errors.add(:state, 'invÃ¡lido')
  end

  def validate_city_in_dataset
    return if city.blank?

    if state.blank?
      errors.add(:city, 'requer um estado vÃ¡lido')
      return
    end

    return if Locations::BrLocations.valid_city?(state, city)

    errors.add(:city, 'invÃ¡lida para o estado selecionado')
  end

  def has_paid_plan?
    return false unless respond_to?(:plan_status) && respond_to?(:plan)
    plan_status == 'active' && plan.present? && plan.price.to_f > 0
  end

  def whatsapp_enabled?
    # Ensure it returns a boolean even if the column is missing
    return false unless respond_to?(:whatsapp_enabled)
    !!whatsapp_enabled
  end

  def banner_url
    generate_attachment_url(banner)
  end

  def logo_url
    generate_attachment_url(logo)
  end

  private

  def generate_attachment_url(attachment)
    return nil unless attachment&.attached?

    begin
      # In Rails 7, we can use rails_blob_url if host is configured
      # or simply use the route helper
      options = Rails.application.routes.default_url_options.dup
      
      # For development, ensure port is correct if using localhost
      if Rails.env.development? && options[:host] == 'localhost'
        options[:port] = 3001
      end

      Rails.application.routes.url_helpers.rails_blob_url(attachment, options)
    rescue => e
      Rails.logger.error("Error generating attachment URL for company #{id}: #{e.message}")
      nil
    end
  end

  def capture_category_ids_for_metrics
    @category_ids_for_metrics_update = categories.pluck(:id)
  end

  def update_associated_categories_metrics
    # Combine old and new category IDs to ensure all affected categories are updated
    all_ids = (@category_ids_for_metrics_update || []) + categories.pluck(:id)
    return if all_ids.empty?

    # Using SQL for efficiency and avoiding N+1
    Category.where(id: all_ids.uniq).each do |category|
      # Enqueue the job for background processing
      # CategoryMetricsUpdateJob.perform_later(category.id)
      
      # For now, we'll just update the timestamp to trigger cache invalidation
      # A separate scheduled job should handle heavy calculations
      category.touch
    end
  end

  def calculate_historical_stats(days)
    end_date = Date.current
    start_date = end_date - days.days
    
    stats = company_daily_stats.where(day: start_date..end_date).order(day: :asc)
    
    {
      dates: stats.map { |s| s.day.strftime('%d/%m') },
      views: stats.map(&:profile_views),
      leads: stats.map(&:leads),
      clicks: stats.map(&:cta_clicks)
    }
  end
  # Metodo para validar ativacao 
  def ready_for_activation? 
    name.present? && email.present? && (cnpj.present? || website.present?) 
  end 
end
``

---
## Arquivo: company_serializer.rb
**Caminho:** `AB0-1-back/app/serializers/company_serializer.rb`

Content-Length: 1706 bytes

``ruby
class CompanySerializer < ActiveModel::Serializer
  include Rails.application.routes.url_helpers

  attributes :id, :name, :description, :website,
             :state, :city, :address, :phone, :whatsapp,
             :email_public, :featured, :verified,
             :rating_avg, :rating_count,
             :banner_url, :logo_url,
             :created_at, :updated_at,
             :founded_year, :employees_count,
             :instagram, :facebook, :linkedin,
             :cta_whatsapp_enabled, :cta_whatsapp_url,
             :whatsapp_enabled, :whatsapp_url,
             :effect




  def banner_url
    generate_attachment_url(object.banner)
  end

  def logo_url
    generate_attachment_url(object.logo)
  end

  def cta_whatsapp_enabled
    object.respond_to?(:whatsapp_enabled) ? !!object.whatsapp_enabled : false
  end

  def cta_whatsapp_url
    object.respond_to?(:whatsapp_url) ? object.whatsapp_url : nil
  end

  def effect
    object.respond_to?(:effect) ? !!object.effect : false
  end

  private

  def generate_attachment_url(attachment)
    return nil unless attachment.attached?

    begin
      # Use rails_blob_url for Active Storage attachments with full URL
      # Force host to localhost:3001 if not set correctly in config
      options = { only_path: false }
      options[:host] = 'localhost' if Rails.env.development?
      options[:port] = 3001 if Rails.env.development?
      
      Rails.application.routes.url_helpers.rails_blob_url(attachment, options)
    rescue StandardError => e
      Rails.logger.error("Error generating attachment URL for company #{object.id}: #{e.message}")
      nil
    end
  end
end
``

---
## Arquivo: 20260122040000_fix_json_indexes_to_gin.rb
**Caminho:** `AB0-1-back/db/migrate/20260122040000_fix_json_indexes_to_gin.rb`

Content-Length: 1670 bytes

``ruby
class FixJsonIndexesToGin < ActiveRecord::Migration[7.0]
  def up
    # Remove Ã­ndices antigos se existirem
    remove_index :companies, name: "index_companies_on_project_types_gin", if_exists: true
    remove_index :companies, name: "index_companies_on_services_offered", if_exists: true
    
    # Converter colunas para JSONB e usar Ã­ndices GIN apenas no PostgreSQL
    if ActiveRecord::Base.connection.adapter_name == 'PostgreSQL'
      change_column :companies, :project_types, :jsonb, using: 'project_types::jsonb'
      change_column :companies, :services_offered, :jsonb, default: [], null: false, using: 'services_offered::jsonb'
      
      execute "CREATE EXTENSION IF NOT EXISTS btree_gin;"
      
      add_index :companies, :project_types, using: :gin, name: "index_companies_on_project_types_gin"
      add_index :companies, :services_offered, using: :gin, name: "index_companies_on_services_offered"
    else
      # No SQLite apenas garantimos que as colunas existam como string/text (comportamento padrÃ£o do Rails para JSON no SQLite)
      # NÃ£o fazemos nada especial pois SQLite nÃ£o suporta JSONB/GIN nativamente desta forma
      puts "Skipping PostgreSQL-specific JSONB/GIN migration steps for SQLite"
    end
  end

  def down
    remove_index :companies, name: "index_companies_on_project_types_gin"
    remove_index :companies, name: "index_companies_on_services_offered"
    
    # Reverter para JSON
    change_column :companies, :project_types, :json, using: 'project_types::json'
    change_column :companies, :services_offered, :json, default: [], null: false, using: 'services_offered::json'
  end
end
``

---
## AnÃ¡lise TÃ©cnica Mobile Final
- **Estrutura**: O projeto utiliza Next.js no front e Rails no back, com uma separaÃ§Ã£o clara de responsabilidades.
- **OtimizaÃ§Ã£o**: Os arquivos mostram que jÃ¡ existe uma base para mobile (compact props, 
o-scrollbar), mas a lÃ³gica de dados ainda Ã© pesada para o cliente.
- **PrÃ³ximo Passo Recomendado**: Implementar o **Item 1 (API Querying)** para reduzir o payload enviado ao celular.
