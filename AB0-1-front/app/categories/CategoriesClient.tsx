'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Filter, Folder, Grid, Heart, Home, Search, Star, User, X, Zap } from 'lucide-react';

// Hooks & Utils
import { useCompaniesSafe } from '@/hooks/useCompaniesSafe';
import { useCategories } from '@/hooks/useCategories';
import { useDebounce } from '@/hooks/useDebounce';
import { useBanners } from '@/hooks/useBanners';
import { useBannerGlobal } from '@/hooks/useBannerGlobal';
import Image from 'next/image';
import { getFullImageUrl } from '@/utils/image';
import { buildCategoryPath } from '@/lib/slug';
import ResponsiveBanner from '@/components/ResponsiveBanner';

// UI Components
import CompanyCard from '@/components/CompanyCard'; // O card novo que criamos
import SidebarFilter from '@/components/SidebarFilter';
import CategoriesHero from '@/components/categories/CategoriesHero';
// 
import { ClientOnly } from '@/components/ClientOnly';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import CompaniesSidebarFilters from '@/components/CompaniesSidebarFilters';
import CompaniesResultsBar from '@/components/CompaniesResultsBar';
import CompaniesFiltersSheet from '@/components/CompaniesFiltersSheet';

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
    try {
      const combinedBanners: any[] = [];

      if (bannerGlobal?.image_url) {
        combinedBanners.push({
          id: bannerGlobal.id,
          type: 'rectangular_large',
          position: 'navbar',
          title: bannerGlobal.title || '',
          link: bannerGlobal.link || undefined,
          sponsored: false,
          image_url: getFullImageUrl(bannerGlobal.image_url) || '',
        });
      }

      if (Array.isArray(banners)) {
        const globalBannerIds = new Set(bannerGlobal ? [bannerGlobal.id] : []);
        const filteredBanners = banners.filter((banner) =>
          banner && !globalBannerIds.has(banner.id)
        );
        const formatted = filteredBanners.map((banner) => ({
          ...banner,
          type: banner.banner_type,
          image_url: getFullImageUrl(banner.image_url) || '',
        }));
        combinedBanners.push(...formatted);
      }

      return combinedBanners;
    } catch (error) {
      console.error('[CategoriesClient] Error processing banners:', error);
      return [];
    }
  }, [banners, bannerGlobal]);

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
  const [sort, setSort] = useState<string>('name_asc');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const selectedCategory = useMemo(() => {
    if (!filters.category || !categories) return null;
    return categories.find((cat) => cat.id === filters.category);
  }, [filters.category, categories]);

  // Atualiza URL com Filtros
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

  // Extrai Locais
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
        // Filtros Lógicos
        if (filters.category && company.category_id !== filters.category) return false;
        
        if (filters.searchTerm) {
          const name = (company.name || '').toLowerCase();
          const description = (company.description || '').toLowerCase();
          if (!name.includes(searchTermLower) && !description.includes(searchTermLower)) return false;
        }
        
        if (typeof company.address === 'string' && company.address.trim() && (filters.state || filters.city)) {
          try {
            const { state: companyState, city: companyCity } = parseAddress(company.address);
            if (filters.state && companyState !== filters.state) return false;
            if (filters.city && companyCity !== filters.city) return false;
          } catch { return false; }
        }
        
        if (filters.rating !== null) {
          const rating = Number(company.rating) || 0;
          if (isNaN(rating) || rating < filters.rating) return false;
        }
        
        if (filters.verified && !company.verified) return false;
        
        return true;
      });
    } catch (error) {
      console.error('Error filtering companies:', error);
      return [];
    }
  }, [companies, categories, filters]);

  const sortedCompanies = useMemo(() => {
    const list = [...filteredCompanies];
    if (sort === 'name_asc') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sort === 'name_desc') {
      list.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    } else if (sort === 'rating_desc') {
      list.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    }
    return list;
  }, [filteredCompanies, sort]);

  const loading = companiesLoading || categoriesLoading;
  const mobileStates = useMemo(() => Object.keys(locationsData).sort().slice(0, 8), [locationsData]);
  const mobileCities = useMemo(() => {
    if (!filters.state || !locationsData[filters.state]) return [] as string[];
    const entries = Array.from((locationsData[filters.state] as Set<string>) || []);
    return entries.sort().slice(0, 8);
  }, [filters.state, locationsData]);
  
  const mobileBanner = allBanners.find((banner) => banner?.image_url)?.image_url;
  const locationLabel = filters.city ? `${filters.city}${filters.state ? `, ${filters.state}` : ''}` : filters.state ? filters.state : 'Brasil';
  const activeCount = Object.entries(filters).filter(([_, v]) => Boolean(v)).length;

  const getFilterLabel = (key: string, value: any): string => {
    switch (key) {
      case 'searchTerm': return `Busca: ${value}`;
      case 'category':
        const categoryName = categories?.find((cat) => cat.id === value)?.name;
        return `Categoria: ${categoryName || 'Desconhecida'}`;
      case 'state': return `Estado: ${value}`;
      case 'city': return `Cidade: ${value}`;
      case 'rating': return `${value} estrelas ou mais`;
      default: return `${key}: ${value}`;
    }
  };

  const categoryChips = categories.length > 0
    ? categories.slice(0, 8).map((category) => ({
        label: category.name || 'Categoria',
        href: buildCategoryPath(category.seo_url, category.id),
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
        {/* --- MOBILE VIEW --- */}
        <div className="md:hidden">
          <CompaniesFiltersSheet
            open={mobileFiltersOpen}
            onOpenChange={setMobileFiltersOpen}
            filters={{ state: filters.state, city: filters.city, rating: filters.rating, verified: filters.verified }}
            locationsData={locationsData}
            sort={sort}
            onSortChange={setSort}
            onFilterChange={handleFilterChange}
            activeCount={activeCount}
            onClearAll={() => handleFilterChange('clearAll', null)}
          />
          {/* Header Mobile */}
          <div className="bg-gradient-to-r from-primary to-accent shadow-sm">
            <div className="px-4 pt-3 pb-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Buscar categorias..."
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  className="h-10 rounded-full bg-white pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-white/40"
                />
              </div>
            </div>
            {/* Chips de Categoria Mobile */}
            <div className="border-t border-white/20 px-4 pb-2">
              <div className="flex items-center gap-2 overflow-x-auto py-2 no-scrollbar">
                <button
                  type="button"
                  onClick={() => handleFilterChange('category', null)}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm ${!filters.category ? 'bg-white text-primary' : 'bg-white/90 text-primary'}`}
                >
                  Tudo
                </button>
                {categoryChips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => handleFilterChange('category', chip.id)}
                    className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium shadow-sm ${filters.category === chip.id ? 'bg-white text-primary' : 'bg-white/90 text-primary'}`}
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
                  <Link key={action.label} href={action.href} className="flex flex-col items-center gap-1 text-center">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-full ${action.styles}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-medium text-gray-700">{action.label}</span>
                  </Link>
                );
              })}
            </section>

            <section className="relative z-[950]">
              {mobileBanner ? (
                <ResponsiveBanner src={mobileBanner} alt="Banner promocional" priority />
              ) : (
                <div className="relative w-full aspect-[16/9] overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 to-accent/20 shadow-sm">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-sm text-gray-600">Nenhum banner disponível</p>
                  </div>
                </div>
              )}
            </section>

            {/* Filtros Mobile (Estados/Cidades/Rating) */}
            <section className="space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">Estados</p>
                <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => handleFilterChange('state', null)}
                    className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${!filters.state ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700'}`}
                  >
                    Todos
                  </button>
                  {mobileStates.map((state) => (
                    <button
                      key={state}
                      type="button"
                      onClick={() => handleFilterChange('state', state)}
                      className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${filters.state === state ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700'}`}
                    >
                      {state}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Filtro Avaliações Mobile */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">Avaliacoes</p>
                <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar">
                  {[5, 4, 3].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => handleFilterChange('rating', filters.rating === rating ? null : rating)}
                      className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${filters.rating === rating ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700'}`}
                    >
                      {rating}+ estrelas
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <CompaniesResultsBar
                count={loading ? 0 : sortedCompanies.length}
                sort={sort}
                onSortChange={setSort}
                verified={filters.verified}
                onToggleVerified={(v) => handleFilterChange('verified', v)}
                onClearAll={() => handleFilterChange('clearAll', null)}
                onOpenFilters={() => setMobileFiltersOpen(true)}
                compact
              />
              <ClientOnly>
                <AnimatePresence>
                  {Object.entries(filters).some(([_, value]) => Boolean(value)) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-wrap gap-2 mt-2 items-center"
                    >
                      {Object.entries(filters).map(([key, value]) => {
                        if (!value) return null;
                        return (
                          <Badge key={key} variant="secondary" className="cursor-pointer" onClick={() => handleFilterChange(key, null)}>
                            {getFilterLabel(key, value)} <X className="ml-2 h-3 w-3" />
                          </Badge>
                        );
                      })}
                      <button onClick={() => handleFilterChange('clearAll', null)} className="text-xs text-gray-600 underline ml-2">Limpar todos</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </ClientOnly>

              {loading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl bg-white" />)}
                </div>
              ) : filteredCompanies.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                    <Filter className="h-5 w-5 text-yellow-700" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">Nenhuma empresa encontrada</h3>
                </div>
              ) : (
                /* AQUI ESTÁ A MÁGICA: grid-cols-2 + compact */
                <div className="grid grid-cols-2 gap-3">
                  {sortedCompanies.map((company) => (
                    <CompanyCard 
                      key={company.id} 
                      company={company} 
                      compact={true} /* Ativa o modo reduzido (scale: 0.5) */
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white">
            <div className="mx-auto flex max-w-md items-center justify-around py-2">
              <Link href="/" className="flex flex-col items-center gap-1 text-[10px] text-gray-600">
                <Home className="h-5 w-5" /> Inicio
              </Link>
              <Link href="/categories" className="flex flex-col items-center gap-1 text-[10px] text-gray-600">
                <Folder className="h-5 w-5" /> Categorias
              </Link>
              <Link href="/profile" className="flex flex-col items-center gap-1 text-[10px] text-gray-600">
                <User className="h-5 w-5" /> Perfil
              </Link>
            </div>
          </nav>
        </div>

        {/* --- DESKTOP VIEW --- */}
        <div className="hidden md:block">
          <CategoriesHero banners={allBanners} loading={bannersLoading || bannerGlobalLoading} />

          <div className="relative flex flex-col lg:flex-row lg:gap-8 gap-6 px-4 lg:px-8 pb-10">
            <CompaniesSidebarFilters
              filters={{ state: filters.state, city: filters.city, rating: filters.rating, verified: filters.verified }}
              locationsData={locationsData}
              categories={categories}
              onFilterChange={handleFilterChange}
              sort={sort}
              onSortChange={setSort}
            />
            <div className="flex-1 relative z-20">
              {selectedCategory && selectedCategory.banner_url && (
                <div className="relative w-full h-48 bg-gray-300 rounded-lg overflow-hidden mb-8 group">
                  <Image
                    src={buildUrl(selectedCategory.banner_url)}
                    alt={`Banner ${selectedCategory.name}`}
                    className="brightness-75 object-cover transition-transform duration-700 group-hover:scale-105"
                    fill
                  />
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <h1 className="text-white text-4xl font-bold text-center drop-shadow-lg">{selectedCategory.name}</h1>
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <CompaniesResultsBar
                  count={loading ? 0 : sortedCompanies.length}
                  sort={sort}
                  onSortChange={setSort}
                  verified={filters.verified}
                  onToggleVerified={(v) => handleFilterChange('verified', v)}
                  onClearAll={() => handleFilterChange('clearAll', null)}
                />
              </div>

              {/* Filtros Ativos Desktop */}
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
                          <Badge key={key} variant="default" className="bg-orange-500 text-white hover:bg-orange-600 cursor-pointer" onClick={() => handleFilterChange(key, null)}>
                            {getFilterLabel(key, value)} <X className="ml-2 h-3 w-3" />
                          </Badge>
                        );
                      })}
                      <button onClick={() => handleFilterChange('clearAll', null)} className="text-sm text-gray-600 underline ml-2">Limpar todos</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </ClientOnly>

              {/* Lista de Empresas DESKTOP */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}
                </div>
              ) : filteredCompanies.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-xl text-gray-500">Nenhuma empresa encontrada com os filtros selecionados.</p>
                  <div className="mt-4">
                    <Button variant="outline" onClick={() => handleFilterChange('clearAll', null)}>Limpar filtros</Button>
                  </div>
                </div>
              ) : (
                <ClientOnly>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                  >
                    {sortedCompanies.map((company) => (
                      <motion.div
                        key={company.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* Desktop usa o card em tamanho normal (padrão) */}
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
