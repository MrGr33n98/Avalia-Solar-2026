'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Filter,
  MapPin,
  Grid,
  List,
  Search,
  Bell,
  Home,
  Heart,
  User,
  Zap,
  Building2,
  Package,
  Star,
  Folder
} from 'lucide-react';
import Link from 'next/link';
import CompanyCard from '@/components/CompanyCard';
import { LocationFilter } from '@/components/LocationFilter';
import { companiesApiSafe, categoriesApiSafe, type Company, type Category } from '@/lib/api-client';
import { useLocationData } from '@/hooks/useLocationData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import TestImage from '@/components/TestImage';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('[CompaniesPage] Fetching companies and categories...');
        const [companiesData, categoriesData] = await Promise.all([
          companiesApiSafe.getAll(),
          categoriesApiSafe.getAll()
        ]);

        console.log('[CompaniesPage] Received companies:', companiesData);
        console.log('[CompaniesPage] Received categories:', categoriesData);

        setCompanies(companiesData || []);
        setCategories(categoriesData || []);
      } catch (err) {
        console.error('[CompaniesPage] Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { states, cities, loadingStates, loadingCities, fetchCities } = useLocationData();

  useEffect(() => {
    fetchCities(stateFilter);
  }, [stateFilter, fetchCities]);

  // Filter and sort companies
  const filteredCompanies = companies
    .filter(company => {
      const matchesSearch =
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
        default:
          return 0;
      }
    });

  const handleClearFilters = () => {
    setSearchTerm('');
    setStateFilter('all');
    setCityFilter('');
    setSortBy('name');
  };

  const locationLabel = cityFilter
    ? `${cityFilter}${stateFilter && stateFilter !== 'all' ? `, ${stateFilter}` : ''}`
    : stateFilter && stateFilter !== 'all'
      ? stateFilter
      : 'Brasil';

  const categoryChips = categories.length > 0
    ? categories.slice(0, 8).map((category) => ({
        label: category.name || 'Categoria',
        href: category.seo_url ? `/categories/${category.seo_url}` : `/categories/${category.id}`
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
        <div className="sticky top-16 z-40 bg-gradient-to-r from-primary to-accent shadow-sm">
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border border-white/70 bg-white">
                <AvatarFallback className="bg-white text-[11px] font-semibold text-primary">AS</AvatarFallback>
              </Avatar>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Buscar empresas..."
                  aria-label="Buscar empresas"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="h-10 rounded-full bg-white pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-white/40"
                />
              </div>
              <button
                type="button"
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-primary"
                aria-label="Notificacoes (2 novas)"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                  2
                </span>
              </button>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs font-medium text-primary-foreground/90">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">Enviar para {locationLabel}</span>
            </div>
          </div>
          <div className="border-t border-white/20 px-4 pb-2">
            <div className="flex items-center gap-2 overflow-x-auto py-2">
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
                  className="whitespace-nowrap rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-primary shadow-sm"
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

          <section className="relative h-36 overflow-hidden rounded-2xl bg-white shadow-sm">
            <TestImage src="/images/banner1.png" alt="Banner promocional" className="object-cover" />
            <div className="absolute inset-0 rounded-2xl ring-1 ring-black/5" />
            <div className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-gray-800">
              Destaque da semana
            </div>
            <div className="absolute bottom-2 right-2 flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">Estados</p>
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
            </div>

            {stateFilter !== 'all' && (loadingCities || visibleCities.length > 0) && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">Cidades</p>
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
              </div>
            )}

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">Avaliacoes</p>
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
            </div>
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
        <header className="sticky top-16 z-40 bg-[#ffe600] shadow-sm">
          <div className="mx-auto max-w-7xl px-6 pt-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10 border border-white/80 bg-white">
                <AvatarFallback className="bg-white text-xs font-semibold text-primary">AS</AvatarFallback>
              </Avatar>
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Buscar empresas no Avalia Solar..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="h-11 rounded-full border-none bg-white pl-11 pr-4 text-sm text-gray-900 shadow-sm focus-visible:ring-2 focus-visible:ring-black/20"
                />
              </div>
              <button
                type="button"
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-primary"
                aria-label="Notificacoes (2 novas)"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                  2
                </span>
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2 pb-3 text-xs font-semibold text-gray-800">
              <MapPin className="h-4 w-4" />
              <span className="truncate">Enviar para {locationLabel}</span>
            </div>
          </div>
          <div className="border-t border-black/10">
            <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-6 py-3">
              <Link
                href="/categories"
                className="whitespace-nowrap rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-gray-900 shadow-sm"
              >
                Tudo
              </Link>
              {categoryChips.map((chip) => (
                <Link
                  key={chip.label}
                  href={chip.href}
                  className="whitespace-nowrap rounded-full bg-white/90 px-4 py-1.5 text-xs font-medium text-gray-900 shadow-sm"
                >
                  {chip.label}
                </Link>
              ))}
            </div>
          </div>
        </header>

        <main className="bg-[#f5f6f8] pb-16">
          <div className="mx-auto max-w-7xl px-6 py-6">
            <section className="mb-6 grid grid-cols-6 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5"
                  >
                    <div className={`flex h-11 w-11 items-center justify-center rounded-full ${action.styles}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{action.label}</span>
                  </Link>
                );
              })}
              <div className="col-span-2 row-span-2 overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="relative h-full">
                  <TestImage src="/images/banner1.png" alt="Banner promocional" className="object-cover" />
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-black/5" />
                  <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-800">
                    Destaque da semana
                  </div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-[260px_1fr] gap-6">
              <aside className="space-y-4">
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Localizacao</p>
                  <div className="mt-3 space-y-3">
                    <LocationFilter
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

                <div className="rounded-2xl bg-white p-4 shadow-sm">
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

                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Destaques</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ratingChips.map((chip) => (
                      <button
                        key={chip.value}
                        type="button"
                        onClick={() => setSortBy(chip.value)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
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
                </div>
              </aside>

              <section>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Empresas recomendadas</h2>
                    <p className="text-xs text-gray-600">
                      {filteredCompanies.length} {filteredCompanies.length === 1 ? 'empresa' : 'empresas'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-white p-1 shadow-sm">
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
                        ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                        : 'grid-cols-1'
                    }`}
                  >
                    {[...Array(9)].map((_, i) => (
                      <Skeleton key={i} className="h-72 rounded-2xl bg-white" />
                    ))}
                  </div>
                ) : filteredCompanies.length > 0 ? (
                  <motion.div
                    className={`grid gap-4 ${
                      viewMode === 'grid'
                        ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                        : 'grid-cols-1'
                    }`}
                    layout
                  >
                    {filteredCompanies.map((company, index) => (
                      <motion.div
                        key={company.id}
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.04 }}
                        layout
                      >
                        <CompanyCard company={company} />
                      </motion.div>
                    ))}
                  </motion.div>
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
              </section>
            </section>
          </div>
        </main>
      </div>      </div>
    </div>
  );
}

