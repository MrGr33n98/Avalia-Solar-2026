'use client';

import { useMemo, useState, useEffect } from 'react';
import CategoryBanner from '@/components/CategoryBanner';
import CompanyCard from '@/components/CompanyCard';
import SidebarFilter from '@/components/SidebarFilter';
import { fetchCategoryBySlug, Category, Company, companiesApi, categoriesApi, Banner } from '@/lib/api';
import { AlertCircle, Bell, Building2, Filter, Grid, Heart, Home, MapPin, Package, Search, Star, User, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { openQuoteWizard } from '@/lib/quote-wizard';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import Image from 'next/image';
import { getFullImageUrl } from '@/utils/image';

interface CategoryClientProps {
  initialCategory: Category;
  initialCompanies: Company[];
  initialBanners?: Banner[];
}

export default function CategoryClientComponent({ initialCategory, initialCompanies, initialBanners = [] }: CategoryClientProps) {
  const [category] = useState<Category>(initialCategory);
  const [companies] = useState<Company[]>(initialCompanies);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>(initialCompanies);
  const [loadingCompanies] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [banners] = useState<Banner[]>(initialBanners);
  const [filters, setFilters] = useState({
    searchTerm: '',
    state: '',
    city: '',
    rating: 0,
    verified: false
  });

  // Apply filters
  useEffect(() => {
    let filtered = [...companies];

    if (filters.searchTerm) {
      const needle = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(company =>
        (company.name || '').toLowerCase().includes(needle) ||
        (company.description || '').toLowerCase().includes(needle)
      );
    }

    if (filters.state) {
      filtered = filtered.filter(company => 
        company.state?.toLowerCase().includes(filters.state.toLowerCase()) ||
        company.address?.toLowerCase().includes(filters.state.toLowerCase())
      );
    }

    if (filters.city) {
      filtered = filtered.filter(company => 
        company.city?.toLowerCase().includes(filters.city.toLowerCase()) ||
        company.address?.toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    if (filters.rating > 0) {
      filtered = filtered.filter(company => 
        (company.rating_avg || 0) >= filters.rating
      );
    }

    if (filters.verified) {
      filtered = filtered.filter(company => company.status === 'active');
    }

    setFilteredCompanies(filtered);
  }, [filters, companies]);

  // Handle filter changes from SidebarFilter
  const handleFilterChange = (filterType: string, value: any) => {
    if (filterType === 'clearAll') {
      setFilters({
        searchTerm: '',
        state: '',
        city: '',
        rating: 0,
        verified: false
      });
      return;
    }
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
      ...(filterType === 'state' && { city: '' })
    }));
  };

  const mobileStates = useMemo(() => {
    const values = new Set<string>();
    companies.forEach((company) => {
      if (company.state) values.add(company.state);
    });
    return Array.from(values).sort().slice(0, 8);
  }, [companies]);

  const mobileCities = useMemo(() => {
    if (!filters.state) return [] as string[];
    const values = new Set<string>();
    companies.forEach((company) => {
      if (!company.city) return;
      if (company.state && company.state !== filters.state) return;
      values.add(company.city);
    });
    return Array.from(values).sort().slice(0, 8);
  }, [companies, filters.state]);

  const quickActions = [
    { label: 'Empresas', href: '/companies', icon: Home, styles: 'bg-yellow-100 text-yellow-700' },
    { label: 'Produtos', href: '/products', icon: Grid, styles: 'bg-green-100 text-green-700' },
    { label: 'Avaliar', href: '/reviews/my', icon: Star, styles: 'bg-orange-100 text-orange-700' },
    { label: 'Favoritos', href: '/profile?tab=favorites', icon: Heart, styles: 'bg-blue-100 text-blue-700' },
    { label: 'Blog', href: '/blog', icon: Zap, styles: 'bg-slate-100 text-slate-700' }
  ];

  const bannerUrl = getFullImageUrl((category as any)?.banner_url) || getFullImageUrl((category as any)?.image_url);
  const locationLabel = filters.city
    ? `${filters.city}${filters.state ? `, ${filters.state}` : ''}`
    : filters.state || 'Brasil';

  // Error state - this would be handled on the server side now
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 py-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Categoria não encontrada
            </h1>
            <p className="text-gray-600 mb-6">
              A categoria não existe ou foi removida.
            </p>
            <div className="space-x-4">
              <Button 
                onClick={() => window.history.back()}
              >
                Voltar
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/categories'}
              >
                Ver todas as categorias
              </Button>
            </div>
            <p className="mt-4 text-sm text-red-600">Erro: {error}</p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Success state - show the category with banner and companies
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
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
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
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
            {bannerUrl ? (
              <Image src={bannerUrl} alt={`Banner ${category.name}`} fill sizes="100vw" className="object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20" />
            )}
            <div className="absolute inset-0 rounded-2xl ring-1 ring-black/5" />
            <div className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-gray-800">
              {category.name}
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">Estados</p>
              <div className="mt-2 flex gap-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => handleFilterChange('state', '')}
                  className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${
                    !filters.state
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 bg-white text-gray-700'
                  }`}
                  aria-pressed={!filters.state}
                >
                  Todos
                </button>
                {mobileStates.map((state) => (
                  <button
                    key={state}
                    type="button"
                    onClick={() => handleFilterChange('state', state)}
                    className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${
                      filters.state === state
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 bg-white text-gray-700'
                    }`}
                    aria-pressed={filters.state === state}
                  >
                    {state}
                  </button>
                ))}
              </div>
            </div>

            {filters.state && mobileCities.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">Cidades</p>
                <div className="mt-2 flex gap-2 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => handleFilterChange('city', '')}
                    className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${
                      !filters.city
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 bg-white text-gray-700'
                    }`}
                    aria-pressed={!filters.city}
                  >
                    Todas
                  </button>
                  {mobileCities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => handleFilterChange('city', city)}
                      className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${
                        filters.city === city
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-200 bg-white text-gray-700'
                    }`}
                      aria-pressed={filters.city === city}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">Avaliacoes</p>
              <div className="mt-2 flex gap-2 overflow-x-auto">
                {[5, 4, 3].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleFilterChange('rating', filters.rating === rating ? 0 : rating)}
                    className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${
                      filters.rating === rating
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 bg-white text-gray-700'
                    }`}
                    aria-pressed={filters.rating === rating}
                  >
                    {rating}+ estrelas
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleFilterChange('verified', !filters.verified)}
                  className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${
                    filters.verified
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 bg-white text-gray-700'
                  }`}
                  aria-pressed={filters.verified}
                >
                  Verificadas
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">Sobre a categoria</p>
              <h2 className="mt-2 text-lg font-semibold text-gray-900">{category.name}</h2>
              {category.description && (
                <p className="mt-2 text-xs text-gray-600">{category.description}</p>
              )}
            </div>
            <Button onClick={() => openQuoteWizard({ source: 'category-page' })} className="w-full">
              Fazer Orcamento
            </Button>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-center">
                <Building2 className="mx-auto mb-1 h-5 w-5 text-blue-600" />
                <div className="text-sm font-semibold text-blue-600">{companies.length}</div>
                <div className="text-[10px] text-blue-800">{companies.length === 1 ? 'Empresa' : 'Empresas'}</div>
              </div>
              <div className="rounded-xl bg-green-50 p-3 text-center">
                <Package className="mx-auto mb-1 h-5 w-5 text-green-600" />
                <div className="text-sm font-semibold text-green-600">{category.products?.length || 0}</div>
                <div className="text-[10px] text-green-800">{(category.products?.length || 0) === 1 ? 'Produto' : 'Produtos'}</div>
              </div>
              <div className="rounded-xl bg-purple-50 p-3 text-center">
                <div className="mb-1 text-sm font-semibold text-purple-600">{category.featured ? '★' : '☆'}</div>
                <div className="text-[10px] text-purple-800">{category.featured ? 'Em Destaque' : 'Categoria'}</div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Empresas</h2>
              <span className="text-xs text-gray-600">{filteredCompanies.length} empresas</span>
            </div>

            {loadingCompanies ? (
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
                <p className="mt-1 text-xs text-gray-600">Ajuste os filtros ou termos de busca.</p>
              </div>
            )}
          </section>

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
      </div>

      <div className="hidden md:block">
      {/* Category Banner - smaller height */}
      <div className="mb-8">
        <CategoryBanner 
          category={category}
          companiesCount={companies.length}
          productsCount={category.products?.length || 0}
          height="h-48" // Reduced height
        />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="lg:hidden mb-4">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
            
            <div className={`lg:block ${showFilters ? 'block' : 'hidden'}`}>
              <SidebarFilter
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {banners.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Patrocínios</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {banners.map((banner) => (
                    <a key={banner.id} href={banner.link || '#'} target={banner.link ? '_blank' : undefined} rel={banner.link ? 'noopener noreferrer' : undefined} className="block">
                      <Image src={banner.image_url || ''} alt={banner.title || 'Patrocínio'} width={800} height={160} className="w-full h-40 object-cover rounded-lg" />
                    </a>
                  ))}
                </div>
              </div>
            )}
            {/* Category Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-6 mb-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Sobre {category.name}
              </h2>
              
              {category.description && (
                <div className="prose max-w-none text-gray-600 mb-6">
                  <p>{category.description}</p>
                </div>
              )}

              <Button
                onClick={() => openQuoteWizard({ source: 'category-page' })}
                className="mb-6"
              >
                Fazer Orcamento
              </Button>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <Building2 className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-xl font-bold text-blue-600">
                    {companies.length}
                  </div>
                  <div className="text-sm text-blue-800">
                    {companies.length === 1 ? 'Empresa' : 'Empresas'}
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <Package className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <div className="text-xl font-bold text-green-600">
                    {category.products?.length || 0}
                  </div>
                  <div className="text-sm text-green-800">
                    {(category.products?.length || 0) === 1 ? 'Produto' : 'Produtos'}
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4 text-center col-span-2 md:col-span-1">
                  <div className="text-xl font-bold text-purple-600 mb-2">
                    {category.featured ? '★' : '—'}
                  </div>
                  <div className="text-sm text-purple-800">
                    {category.featured ? 'Em Destaque' : 'Categoria'}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Companies Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Empresas em {category.name}
                </h3>
                <div className="text-sm text-gray-600">
                  {filteredCompanies.length} de {companies.length} empresas
                </div>
              </div>

              {loadingCompanies ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <Skeleton className="h-4 w-1/2 mb-2" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                  ))}
                </div>
              ) : filteredCompanies.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredCompanies.map((company, index) => (
                    <motion.div
                      key={company.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <CompanyCard company={company} />
                    </motion.div>
                  ))}
                </div>
              ) : companies.length > 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Filter className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhuma empresa encontrada
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Tente ajustar os filtros para ver mais resultados.
                  </p>
                  <Button
                    onClick={() => setFilters({ searchTerm: '', state: '', city: '', rating: 0, verified: false })}
                    variant="outline"
                  >
                    Limpar filtros
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhuma empresa cadastrada
                  </h3>
                  <p className="text-gray-600">
                    Ainda não há empresas cadastradas nesta categoria.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
