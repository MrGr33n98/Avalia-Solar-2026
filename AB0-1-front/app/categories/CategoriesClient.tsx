'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompaniesSafe } from '@/hooks/useCompaniesSafe';
import { useCategories } from '@/hooks/useCategories';
import CompanyCard from '@/components/CompanyCard';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bell,
  Filter,
  Folder,
  Grid,
  Heart,
  Home,
  MapPin,
  Search,
  Star,
  User,
  X,
  Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import SidebarFilter from '@/components/SidebarFilter';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { useBanners } from '@/hooks/useBanners';
import { BannerContainer } from '@/components/BannerContainer';
import TestImage from '@/components/TestImage';
import { getFullImageUrl } from '@/utils/image';
import { ClientOnly } from '@/components/ClientOnly';
import { useBannerGlobal } from '@/hooks/useBannerGlobal';
import ResponsiveBanner from '@/components/ResponsiveBanner';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';

type Filters = {
  searchTerm: string;
  category: number | null;
  state: string | null;
  city: string | null;
  rating: number | null;
  verified: boolean;
};

const parseAddress = (address?: string) => {
  if (!address) return { state: null, city: null };
  const parts = address.split(',').map((p) => p.trim());
  if (parts.length < 2) return { state: null, city: null };
  return {
    state: parts.at(-1) || null,
    city: parts.at(-2) || null,
  };
};

export default function CategoriesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { banners, loading: bannersLoading } = useBanners();
  const { bannerGlobal, loading: bannerGlobalLoading } = useBannerGlobal();

  const buildUrl = (url: string | null | undefined): string => {
    return getFullImageUrl(url || undefined) || '';
  };

  const allBanners = useMemo(() => {
    const combinedBanners: any[] = [];

    // Adiciona banners globais primeiro
    if (bannerGlobal && bannerGlobal.image_url) {
      combinedBanners.push({
        id: bannerGlobal.id,
        type: 'rectangular_large', // Manter tipo consistente
        position: 'navbar', // Manter posição consistente
        title: bannerGlobal.title || '',
        link: bannerGlobal.link || undefined,
        sponsored: false,
        image_url: getFullImageUrl(bannerGlobal.image_url) || '',
      });
    }

    // Adiciona os banners comuns (sem duplicar os globais)
    if (banners) {
      const globalBannerIds = new Set(bannerGlobal ? [bannerGlobal.id] : []);
      const filteredBanners = banners.filter((banner) =>
        !globalBannerIds.has(banner.id)
      );
      const formatted = filteredBanners.map((banner) => ({
        ...banner,
        type: banner.banner_type,
        image_url: getFullImageUrl(banner.image_url) || '',
      }));
      combinedBanners.push(...formatted);
    }

    console.log('[CategoriesClient] All Banners:', combinedBanners);
    console.log('[CategoriesClient] allBanners (memoized):', combinedBanners);
    return combinedBanners;
  }, [banners, bannerGlobal, bannersLoading, bannerGlobalLoading]);

  const [filters, setFilters] = useState<Filters>({
    searchTerm: searchParams.get('search') || '',
    category: searchParams.get('category')
      ? Number(searchParams.get('category'))
      : null,
    state: searchParams.get('state') || null,
    city: searchParams.get('city') || null,
    rating: searchParams.get('rating') ? Number(searchParams.get('rating')) : null,
    verified: searchParams.get('verified') === 'true',
  });

  const { categories, loading: categoriesLoading } = useCategories(true);
  const { companies, loading: companiesLoading } = useCompaniesSafe({
    category_id: filters.category || undefined,
  });

  const debouncedFilters = useDebounce(filters, 300);

  const selectedCategory = useMemo(() => {
    if (!filters.category || !categories) return null;
    return categories.find((cat) => cat.id === filters.category);
  }, [filters.category, categories]);

  const companiesByCategory = useMemo(() => {
    if (!companies || !categories) return {};
    return companies.reduce((acc: any, company: any) => {
      const category = categories.find((cat) => cat.id === company.category_id);
      if (category) {
        if (!acc[category.name]) acc[category.name] = [];
        acc[category.name].push(company);
      }
      return acc;
    }, {});
  }, [companies, categories]);

  useEffect(() => {
    const newParams = new URLSearchParams();
    Object.entries(debouncedFilters).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value.toString());
      }
    });
    const newParamsString = newParams.toString();
    const currentParams = new URLSearchParams(searchParams.toString());

    if (newParamsString !== currentParams.toString()) {
      const newUrl = `${window.location.pathname}${
        newParamsString ? `?${newParamsString}` : ''
      }`;
      router.push(newUrl, { scroll: false });
    }
  }, [debouncedFilters, router, searchParams]);

  const locationsData = useMemo(() => {
    if (!companies?.length) return {};
    return companies.reduce((acc: any, company: any) => {
      if (typeof company.address !== 'string' || !company.address.trim()) return acc;
      try {
        const { state, city } = parseAddress(company.address);
        if (!state || !city) return acc;
        if (!acc[state]) acc[state] = new Set();
        acc[state].add(city);
      } catch (error) {
        console.error('Error parsing address:', error);
      }
      return acc;
    }, {});
  }, [companies]);

  const handleFilterChange = (filterType: string, value: any) => {
    if (filterType === 'clearAll') {
      setFilters({
        searchTerm: '',
        category: null,
        state: null,
        city: null,
        rating: null,
        verified: false,
      });
      return;
    }
    setFilters((prevFilters) => {
      let newValue = value;
      if (filterType === 'category') {
        newValue = value !== null ? value : null;
      }
      const newFilters: Filters = {
        ...prevFilters,
        [filterType]: newValue,
        ...(filterType === 'state' && { city: null }),
        ...(filterType === 'category' && { rating: null }),
      };
      if (filterType === 'rating' && value !== null) {
        newFilters.rating = Math.min(Math.max(1, Number(value)), 5);
      }
      return newFilters;
    });
  };

  const filteredCompanies = useMemo(() => {
    if (!companies?.length || !categories?.length) return [];

    const searchTermLower = filters.searchTerm.toLowerCase();

    try {
      return companies.filter((company) => {
        if (filters.category) {
          if (company.category_id !== filters.category) return false;
        }
        if (filters.searchTerm) {
          const name = (company.name || '').toLowerCase();
          const description = (company.description || '').toLowerCase();
          if (
            !name.includes(searchTermLower) &&
            !description.includes(searchTermLower)
          )
            return false;
        }
        if (
          typeof company.address === 'string' &&
          company.address.trim() &&
          (filters.state || filters.city)
        ) {
          try {
            const { state: companyState, city: companyCity } =
              parseAddress(company.address);
            if (filters.state && companyState !== filters.state) return false;
            if (filters.city && companyCity !== filters.city) return false;
          } catch {
            return false;
          }
        }
        if (filters.rating !== null) {
          const rating = Number(company.rating) || 0;
          if (isNaN(rating) || rating < filters.rating) return false;
        }
        if (filters.verified && !company.verified) {
          return false;
        }
        return true;
      });
    } catch (error) {
      console.error('Error filtering companies:', error);
      return [];
    }
  }, [companies, categories, filters]);

  const loading = companiesLoading || categoriesLoading;
  const mobileStates = useMemo(() => Object.keys(locationsData).sort().slice(0, 8), [locationsData]);
  const mobileCities = useMemo(() => {
    if (!filters.state || !locationsData[filters.state]) return [] as string[];
    const entries = Array.from((locationsData[filters.state] as Set<string>) || []);
    return entries.sort().slice(0, 8);
  }, [filters.state, locationsData]);
  const mobileBanner = allBanners.find((banner) => banner?.image_url)?.image_url;

  const locationLabel = filters.city
    ? `${filters.city}${filters.state ? `, ${filters.state}` : ''}`
    : filters.state
      ? filters.state
      : 'Brasil';

  const getFilterLabel = (key: string, value: any): string => {
    switch (key) {
      case 'searchTerm':
        return `Busca: ${value}`;
      case 'category':
        const categoryName = categories?.find((cat) => cat.id === value)?.name;
        return `Categoria: ${categoryName || 'Desconhecida'}`;
      case 'state':
        return `Estado: ${value}`;
      case 'city':
        return `Cidade: ${value}`;
      case 'rating':
        return `${value} estrelas ou mais`;
      default:
        return `${key}: ${value}`;
    }
  };

  const categoryChips = categories.length > 0
    ? categories.slice(0, 8).map((category) => ({
        label: category.name || 'Categoria',
        href: category.seo_url ? `/categories/${category.seo_url}` : `/categories/${category.id}`,
        id: category.id
      }))
    : [
        { label: 'Instalacao', href: '/categories', id: 1 },
        { label: 'Equipamentos', href: '/categories', id: 2 },
        { label: 'Projetos', href: '/categories', id: 3 },
        { label: 'Manutencao', href: '/categories', id: 4 },
        { label: 'Financiamento', href: '/categories', id: 5 }
      ];

  const quickActions = [
    { label: 'Empresas', href: '/companies', icon: Home, styles: 'bg-yellow-100 text-yellow-700' },
    { label: 'Produtos', href: '/products', icon: Grid, styles: 'bg-green-100 text-green-700' },
    { label: 'Avaliar', href: '/reviews/my', icon: Star, styles: 'bg-orange-100 text-orange-700' },
    { label: 'Favoritos', href: '/profile?tab=favorites', icon: Heart, styles: 'bg-blue-100 text-blue-700' },
    { label: 'Blog', href: '/blog', icon: Zap, styles: 'bg-slate-100 text-slate-700' }
  ];

  return (
    <>
      <div className="bg-gray-100 min-h-screen">
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
                    placeholder="Buscar categorias..."
                    aria-label="Buscar categorias"
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
            <div className="border-t border-white/20 px-4 pb-2">
              <div className="flex items-center gap-2 overflow-x-auto py-2">
                <button
                  type="button"
                  onClick={() => handleFilterChange('category', null)}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm ${
                    !filters.category
                      ? 'bg-white text-primary'
                      : 'bg-white/90 text-primary'
                  }`}
                  aria-pressed={!filters.category}
                >
                  Tudo
                </button>
                {categoryChips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => handleFilterChange('category', chip.id)}
                    className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium shadow-sm ${
                      filters.category === chip.id
                        ? 'bg-white text-primary'
                        : 'bg-white/90 text-primary'
                    }`}
                    aria-pressed={filters.category === chip.id}
                  >
                    {chip.label}
                  </button>
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
              {mobileBanner ? (
                <ResponsiveBanner
                  src={mobileBanner}
                  alt="Banner promocional"
                  priority
                />
              ) : (
                <div className="relative w-full aspect-[16/9] overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 to-accent/20 shadow-sm">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-sm text-gray-600">Nenhum banner disponível</p>
                  </div>
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">Estados</p>
                <div className="mt-2 flex gap-2 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => handleFilterChange('state', null)}
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
                      onClick={() => handleFilterChange('city', null)}
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
                      onClick={() => handleFilterChange('rating', filters.rating === rating ? null : rating)}
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

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">Empresas</h2>
                <span className="text-xs text-gray-600">
                  {loading ? '...' : filteredCompanies.length} empresas
                </span>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-40 rounded-xl bg-white" />
                  ))}
                </div>
              ) : filteredCompanies.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                    <Filter className="h-5 w-5 text-yellow-700" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">Nenhuma empresa encontrada</h3>
                  <p className="mt-1 text-xs text-gray-600">
                    Ajuste os filtros ou termos de busca.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredCompanies.map((company) => (
                    <CompanyCard key={company.id} company={company} compact />
                  ))}
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
                <Folder className="h-5 w-5" />
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
        {bannersLoading || bannerGlobalLoading ? (
          // Altura do Skeleton ajustada para h-56 para corresponder ao BannerContainer
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center h-56 w-full rounded-lg shadow-sm mb-6">
              <Skeleton className="w-full h-full" />
            </div>
          </div>
        ) : (
          // O BannerContainer será responsável por exibir o carrossel de banners
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <BannerContainer banners={allBanners} />
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          <SidebarFilter
            onFilterChange={handleFilterChange}
            filters={{
              state: filters.state || '',
              city: filters.city || '',
              rating: filters.rating || 0,
              verified: filters.verified
            }}
            locationsData={locationsData}
            categories={categories}
            categoriesLoading={categoriesLoading}
          />
          <div className="flex-1">
            {selectedCategory && selectedCategory.banner_url && (
              <div className="relative w-full h-48 bg-gray-300 rounded-lg overflow-hidden mb-8">
                <TestImage
                  src={buildUrl(selectedCategory.banner_url)}
                  alt={`Banner da categoria ${selectedCategory.name}`}
                  className="brightness-75 object-cover"
                  fill
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <h1 className="text-white text-4xl font-bold text-center drop-shadow-lg">
                    {selectedCategory.name}
                  </h1>
                </div>
              </div>
            )}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                {selectedCategory
                  ? selectedCategory.name
                  : 'Todas as Categorias'}
              </h1>
              <p className="text-gray-600 mt-2 md:mt-0">
                <span className="font-semibold text-orange-600">
                  {loading ? '...' : filteredCompanies.length}
                </span>{' '}
                Empresas encontradas
              </p>
            </div>
            <ClientOnly>
              <AnimatePresence>
                {Object.entries(filters).some(([_, value]) => Boolean(value)) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-wrap gap-2 mb-6 items-center"
                  >
                    {Object.entries(filters).map(([key, value]) => {
                      if (!value) return null;
                      return (
                        <Badge
                          key={key}
                          variant="default"
                          className="bg-orange-500 text-white hover:bg-orange-600 cursor-pointer"
                          onClick={() => handleFilterChange(key, null)}
                        >
                          {getFilterLabel(key, value)}{' '}
                          <X className="ml-2 h-3 w-3" />
                        </Badge>
                      );
                    })}
                    <button
                      onClick={() => handleFilterChange('clearAll', null)}
                      className="text-sm text-gray-600 underline ml-2"
                    >
                      Limpar todos
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </ClientOnly>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-80 rounded-2xl" />
                ))}
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-xl text-gray-500">
                  Nenhuma empresa encontrada com os filtros selecionados.
                </p>
              </div>
            ) : (
              <ClientOnly>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                >
                  {filteredCompanies.map((company) => (
                    <motion.div
                      key={company.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CompanyCard company={company} />
                    </motion.div>
                  ))}
                </motion.div>
              </ClientOnly>
            )}
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
