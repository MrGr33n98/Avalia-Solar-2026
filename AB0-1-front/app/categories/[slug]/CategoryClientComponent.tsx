'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { OptimizedImage } from '@/components/ui/optimized-image';
import CompanyCard from '@/components/CompanyCard';
import TopCompaniesGrid from '@/components/company/TopCompaniesGrid';
import SidebarFilter from '@/components/SidebarFilter';
import { Category, Company, Banner, categoriesApi } from '@/lib/api';
// ... Lucide icons ...
import {
  AlertCircle,
  Filter,
  Search,
  Star,
  CheckCircle,
  Home,
  Grid,
  Heart,
  User,
  Zap,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { openQuoteWizard } from '@/lib/quote-wizard';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import Image from 'next/image';
import { getFullImageUrl } from '@/utils/image';
import SponsorCarousel from '@/components/ui/sponsorcarousel';
import { useLocationData } from '@/hooks/useLocationData';
import { Badge } from '@/components/ui/badge';
import { AppBreadcrumb, BreadcrumbItemData } from '@/components/AppBreadcrumb';
import { BreadcrumbJsonLd } from '@/components/BreadcrumbJsonLd';
import { ItemListJsonLd } from '@/components/ItemListJsonLd';

interface CategoryClientProps {
  initialCategory: Category;
  initialCompanies: Company[];
  initialBanners?: Banner[];
  paginationMeta?: {
    page?: number;
    per_page?: number;
    total?: number;
    total_pages?: number;
    next_page?: number | null;
  } | null;
}
// ==============================
// Icon helper
// ==============================
function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 18 18" />
    </svg>
  );
}

const ALL_CITIES_VALUE = '__ALL_CITIES__';

// ==============================
// COMPONENTE: Filtro Mobile (Conversão)
// ==============================
function MobileLocationLeadFilter({
  filters,
  states,
  cities,
  loadingCities,
  fetchCities,
  handleFilterChange,
}: {
  filters: any;
  states: string[];
  cities: string[];
  loadingCities: boolean;
  fetchCities: (state: string, forceRefresh?: boolean) => Promise<void>;
  handleFilterChange: (type: string, value: any) => void;
}) {
  const [selectedState, setSelectedState] = useState(filters.state || '');
  const [selectedCity, setSelectedCity] = useState(
    filters.state ? filters.city || ALL_CITIES_VALUE : ''
  );

  useEffect(() => {
    const nextState = filters.state || '';
    setSelectedState(nextState);
    setSelectedCity(nextState ? filters.city || ALL_CITIES_VALUE : '');
  }, [filters.state, filters.city]);

  const orderedStates = useMemo(
    () => [...states].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [states]
  );
  const orderedCities = useMemo(
    () => [...cities].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [cities]
  );

  const cityEnabled = Boolean(selectedState);
  const isAllCitiesSelected = selectedCity === ALL_CITIES_VALUE;
  const canApplyLocation = Boolean(selectedState && selectedCity);

  const cityPlaceholder = !cityEnabled
    ? 'Selecione seu estado'
    : loadingCities
      ? 'Carregando cidades...'
      : orderedCities.length > 0
        ? 'Selecione sua cidade'
        : 'Nenhuma cidade disponível';

  const statePlaceholder = orderedStates.length > 0 ? 'Selecione seu estado' : 'Carregando estados...';

  const handleStateSelect = async (stateValue: string) => {
    setSelectedState(stateValue);
    setSelectedCity('');

    if (stateValue) {
      await fetchCities(stateValue);
    }
  };

  const applyLocationFilter = () => {
    if (!canApplyLocation) return;
    handleFilterChange('location', {
      state: selectedState,
      city: isAllCitiesSelected ? null : selectedCity,
    });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_6px_22px_rgba(15,23,42,0.06)]"
    >
      <div className="space-y-1">
        <p className="text-[14px] font-medium text-slate-700">Encontre fornecedores na sua região</p>
        <p className="text-[11px] text-slate-500">
          {canApplyLocation ? 'Tudo pronto para ver opções locais' : cityEnabled ? 'Falta apenas escolher sua cidade' : 'Passo 1 de 2'}
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <div className="space-y-2">
          <label htmlFor="mobile-state-filter" className="text-xs font-semibold text-slate-700">
            Estado
          </label>
          <div className="relative">
            <select
              id="mobile-state-filter"
              aria-label="Selecione seu estado"
              value={selectedState}
              onChange={(e) => {
                void handleStateSelect(e.target.value);
              }}
              className="h-[52px] min-h-[52px] w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-900 transition-all duration-200 focus:border-[#14b8a6] focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/25"
            >
              <option value="">{statePlaceholder}</option>
              {orderedStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <motion.div
          initial={false}
          animate={{ opacity: cityEnabled ? 1 : 0.65, y: cityEnabled ? 0 : 4 }}
          transition={{ duration: 0.2 }}
          className="space-y-2"
        >
          <label htmlFor="mobile-city-filter" className="text-xs font-semibold text-slate-700">
            Cidade
          </label>
          <div className="relative">
            <select
              id="mobile-city-filter"
              aria-label="Selecione sua cidade"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              disabled={!cityEnabled || loadingCities}
              className="h-[52px] min-h-[52px] w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-900 transition-all duration-200 focus:border-[#14b8a6] focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/25 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            >
              <option value="">{cityPlaceholder}</option>
              {cityEnabled && <option value={ALL_CITIES_VALUE}>Todas as cidades</option>}
              {orderedCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </motion.div>

        <AnimatePresence>
          {canApplyLocation && (
            <motion.div
              key="mobile-location-cta"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                type="button"
                onClick={applyLocationFilter}
                className="h-[52px] min-h-[52px] w-full rounded-[14px] bg-[#14b8a6] text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#0d9488] focus-visible:ring-2 focus-visible:ring-[#14b8a6]/40 focus-visible:ring-offset-2"
              >
                Ver empresas disponíveis
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
// ==============================
// COMPONENTE: Filtros Ativos
// ==============================
function ActiveFilters({
  filters,
  handleFilterChange,
}: {
  filters: any;
  handleFilterChange: (type: string, value: any) => void;
}) {
  const hasActiveFilters = filters.state || filters.city || filters.rating > 0 || filters.verified;
  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {filters.state && (
        <Badge
          variant="secondary"
          className="gap-1 pl-2 pr-1 py-1 bg-[#14b8a6]/10 text-[#14b8a6] border-[#14b8a6]/20 hover:bg-[#14b8a6]/20"
        >
          Estado: {filters.state}
          <button
            onClick={() => handleFilterChange('state', '')}
            className="ml-1 hover:text-[#0d9488] rounded-full p-0.5 hover:bg-[#14b8a6]/20"
          >
            <XIcon className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {filters.city && (
        <Badge
          variant="secondary"
          className="gap-1 pl-2 pr-1 py-1 bg-[#14b8a6]/10 text-[#14b8a6] border-[#14b8a6]/20 hover:bg-[#14b8a6]/20"
        >
          Cidade: {filters.city}
          <button
            onClick={() => handleFilterChange('city', '')}
            className="ml-1 hover:text-[#0d9488] rounded-full p-0.5 hover:bg-[#14b8a6]/20"
          >
            <XIcon className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {filters.rating > 0 && (
        <Badge
          variant="secondary"
          className="gap-1 pl-2 pr-1 py-1 bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100"
        >
          Avaliação: {filters.rating}+
          <button
            onClick={() => handleFilterChange('rating', 0)}
            className="ml-1 hover:text-amber-900 rounded-full p-0.5 hover:bg-amber-200"
          >
            <XIcon className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {filters.verified && (
        <Badge
          variant="secondary"
          className="gap-1 pl-2 pr-1 py-1 bg-[#14b8a6]/10 text-[#14b8a6] border-[#14b8a6]/20 hover:bg-[#14b8a6]/20"
        >
          Verificadas
          <button
            onClick={() => handleFilterChange('verified', false)}
            className="ml-1 hover:text-[#0d9488] rounded-full p-0.5 hover:bg-[#14b8a6]/20"
          >
            <XIcon className="h-3 w-3" />
          </button>
        </Badge>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleFilterChange('clearAll', null)}
        className="text-xs h-6 px-2 text-gray-500 hover:text-gray-900"
      >
        Limpar tudo
      </Button>
    </div>
  );
}

// ==============================
// COMPONENTE: CategoryHeader (SLIM HERO / 1/2 SIZE)
// ==============================
function CategoryHeader({
  category,
  companiesCount,
  onQuoteClick,
}: {
  category: Category;
  companiesCount?: number;
  onQuoteClick: () => void;
}) {
  const [imageError, setImageError] = useState(false);

  const bannerUrl = useMemo(() => {
    const possibleImageFields = ['banner_url', 'image_url', 'image', 'cover_image', 'thumbnail'];
    for (const field of possibleImageFields) {
      if ((category as any)?.[field]) {
        const url = getFullImageUrl((category as any)[field]);
        // Defesa contra strings vazias ou URLs quebradas conhecidas
        if (url && url.length > 5 && url !== '/images/avalia-solar-place-holder.PNG') {
          return url;
        }
      }
    }
    return null; // Retornar null ativa o fallback de cor
  }, [category]);

  const hasImage = Boolean(bannerUrl) && !imageError;

  return (
    // ALTURA REDUZIDA: h-[200px] em mobile, h-[240px] em desktop (Aprox 1/2 do anterior)
    <section className="relative w-full overflow-hidden rounded-2xl border border-gray-100 shadow-lg mb-6 group h-[200px] md:h-[240px]">
      
      {/* 1. Background Imersivo */}
      <div className="absolute inset-0 z-0">
        {hasImage ? (
          <OptimizedImage
            src={bannerUrl!}
            alt={category.name}
            fill
            className="object-cover transition-transform duration-1000 group-hover:scale-105"
            onError={() => setImageError(true)}
            priority
            quality={90}
            fallbackSrc="/images/default-banner.svg"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950" />
        )}
        
        {/* Overlay Escuro para contraste */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent opacity-50" />
      </div>

      {/* 2. Conteúdo Sobreposto Compacto */}
      {/* Padding reduzido: p-4 em vez de p-10 */}
      <div className="relative z-10 h-full flex flex-col justify-end p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 max-w-7xl mx-auto w-full">
          
          {/* Texto Principal */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 max-w-3xl"
          >
            {/* Badges Compactas */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/10 text-white text-[9px] font-bold uppercase tracking-wider border border-white/20 backdrop-blur-md">
                {category.name}
              </span>
              
              <div className="flex items-center gap-1 bg-amber-500/90 text-white px-2 py-0.5 rounded-full shadow-sm backdrop-blur-sm">
                <Star className="h-3 w-3 fill-current" />
                <span className="text-[10px] font-bold">4.8</span>
                <span className="text-[9px] opacity-80 font-medium hidden sm:inline ml-0.5">Média</span>
              </div>
            </div>

            {/* Título Reduzido: text-2xl a text-3xl (antes era até 5xl) */}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight mb-2 drop-shadow-lg">
              {category.name}
            </h1>

            {/* Descrição: Limitada a 1 linha e oculta em mobile muito pequeno */}
            <p className="hidden sm:block text-xs text-gray-300/90 leading-relaxed max-w-xl mb-1 line-clamp-1 drop-shadow-md">
              {category.description ||
                `Encontre os melhores fornecedores de ${category.name} avaliados pela comunidade.`}
            </p>

            {/* Stats Compactos (Apenas Desktop) */}
            <div className="hidden md:flex items-center gap-4 text-white/80 mt-1">
               <div className="flex items-center gap-1.5">
                  <User className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px]"><strong className="text-white">{companiesCount || 0}</strong> Fornecedores</span>
               </div>
               <div className="w-px h-3 bg-white/20" />
               <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px]">Orçamentos <strong className="text-white">Grátis</strong></span>
               </div>
            </div>
          </motion.div>

          {/* Botão CTA Reduzido e Proporcional */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="w-full md:w-auto mt-2 md:mt-0"
          >
            <Button
              onClick={onQuoteClick}
              size="default" // Volta para o tamanho padrão (h-10) em vez de lg (h-14)
              className="
                w-full md:w-auto
                bg-emerald-500 hover:bg-emerald-400
                text-white text-xs font-bold uppercase tracking-wide
                h-10 px-6 rounded-lg
                shadow-lg shadow-emerald-500/20
                border-t border-white/20
                transition-all duration-300
              "
            >
              Solicitar Orçamento
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ==============================
// COMPONENTE: QuickActionsSection
// ==============================
function QuickActionsSection() {
  const quickActions = [
    { label: 'Empresas', href: '/companies', icon: Home, color: 'bg-amber-500 hover:bg-amber-600' },
    { label: 'Produtos', href: '/products', icon: Grid, color: 'bg-emerald-500 hover:bg-emerald-600' },
    { label: 'Avaliar', href: '/reviews/my', icon: Star, color: 'bg-blue-500 hover:bg-blue-600' },
    { label: 'Favoritos', href: '/profile?tab=favorites', icon: Heart, color: 'bg-rose-500 hover:bg-rose-600' },
    { label: 'Blog', href: '/blog', icon: Zap, color: 'bg-violet-500 hover:bg-violet-600' },
  ];

  return (
    <motion.section initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-5 gap-2">
      {quickActions.map((action, index) => {
        const Icon = action.icon;
        return (
          <motion.div key={action.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }}>
            <Link
              href={action.href}
              className="group flex flex-col items-center gap-1.5 p-2 rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-gray-200"
            >
              <div className={`relative p-2 rounded-lg ${action.color} text-white shadow-sm group-hover:scale-105 transition-all duration-300`}>
                <Icon className="h-3.5 w-3.5" />
                <div className="absolute inset-0 rounded-lg bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <span className="text-[9px] font-semibold text-gray-900 block truncate w-full text-center">{action.label}</span>
            </Link>
          </motion.div>
        );
      })}
    </motion.section>
  );
}

// ==============================
// COMPONENTE PRINCIPAL
// ==============================
export default function CategoryClientComponent({
  initialCategory,
  initialCompanies,
  initialBanners = [],
  paginationMeta,
}: CategoryClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [category] = useState<Category>(initialCategory);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [companies, setCompanies] = useState<Company[]>(initialCompanies || []);
  const [meta, setMeta] = useState<CategoryClientProps['paginationMeta']>(paginationMeta || null);
  const [currentPage, setCurrentPage] = useState<number>(paginationMeta?.page || 1);
  
  // Sincroniza lista/meta quando os props mudam (ex.: filtros via URL / SSR)
  useEffect(() => {
    setCompanies(initialCompanies || []);
    setMeta(paginationMeta || null);
    setCurrentPage(paginationMeta?.page || 1);
    setLoadingCompanies(false);
    setLoadingMore(false);
  }, [initialCompanies, paginationMeta]);

  const filters = useMemo(() => ({
    search: searchParams.get('search') || searchParams.get('searchTerm') || '',
    state: searchParams.get('state') || '',
    city: searchParams.get('city') || '',
    rating: Number(searchParams.get('rating')) || 0,
    verified: searchParams.get('verified') === 'true',
    niche_tag: searchParams.get('niche_tag') || '',
  }), [searchParams]);

  const createQueryString = useCallback(
    (params: Record<string, string | number | boolean | null>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      
      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === '' || value === 0 || value === false) {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, String(value));
        }
      });
      
      // This page uses client-side "load more"; keep `page` out of the URL to avoid SSR refetch + duplicate URLs.
      newSearchParams.delete('page');

      return newSearchParams.toString();
    },
    [searchParams]
  );

  const handleFilterChange = useCallback((type: string, value: any) => {
    setLoadingCompanies(true);

    if (type === 'clearAll') {
      router.push(pathname, { scroll: false });
      return;
    }

    if (type === 'location') {
      const nextState = value?.state || null;
      const nextCity = value?.city || null;
      const queryString = createQueryString({
        state: nextState,
        city: nextCity,
        rating: null,
        verified: null,
      });
      const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(nextUrl, { scroll: false });
      return;
    }

    // Map legacy or UI names to standard filter names if needed
    const filterKeyMap: Record<string, string> = {
      'searchTerm': 'search',
      'minRating': 'rating',
    };

    const key = filterKeyMap[type] || type;
    const updates: Record<string, any> = {
      [key]: value,
    };

    if (key === 'state') {
      updates.city = null; // Clear city when state changes
    }

    const queryString = createQueryString(updates);
    const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(nextUrl, { scroll: false });
  }, [pathname, router, createQueryString]);

  const filteredCompanies = companies;

  const handleLoadMore = async () => {
    if (loadingCompanies || loadingMore) return;
    if (!meta?.total_pages) return;
    if (currentPage >= meta.total_pages) return;

    const nextPage = currentPage + 1;
    setLoadingMore(true);

    try {
      const resp = await categoriesApi.getCompaniesPaginated(category.id, {
        status: 'active',
        per_page: 20,
        page: nextPage,
        searchTerm: filters.search || undefined,
        state: filters.state || undefined,
        city: filters.city || undefined,
        rating: filters.rating > 0 ? String(filters.rating) : undefined,
        verified: filters.verified ? true : undefined,
        niche_tag: filters.niche_tag || undefined,
      });

      const nextCompanies = resp.companies || [];

      setCompanies((prev) => {
        const seen = new Set<number>();
        const merged: Company[] = [];
        for (const c of [...prev, ...nextCompanies]) {
          if (!c?.id) continue;
          if (seen.has(c.id)) continue;
          seen.add(c.id);
          merged.push(c);
        }
        return merged;
      });

      setMeta(resp.meta || meta);
      setCurrentPage(resp.meta?.page || nextPage);
    } catch (e) {
      console.error('Error loading more companies:', e);
    } finally {
      setLoadingMore(false);
    }
  };

  const hasMore = meta?.total_pages ? currentPage < meta.total_pages : false;
  const banners = initialBanners;

  const breadcrumbItems: BreadcrumbItemData[] = useMemo(() => {
    if (category.parent?.seo_url) {
      return [
        { label: 'Categorias', href: '/categories' },
        { label: category.parent.name, href: `/categories/${category.parent.seo_url}` },
        { label: category.name, active: true },
      ];
    }

    return [
      { label: 'Categorias', href: '/categories' },
      { label: category.name, active: true },
    ];
  }, [category]);

  const jsonLdItems = useMemo(() => {
    if (category.parent?.seo_url) {
      return [
        { name: 'Home', item: '/' },
        { name: 'Categorias', item: '/categories' },
        { name: category.parent.name, item: `/categories/${category.parent.seo_url}` },
        { name: category.name, item: `/categories/${category.seo_url}` },
      ];
    }

    return [
      { name: 'Home', item: '/' },
      { name: 'Categorias', item: '/categories' },
      { name: category.name, item: `/categories/${category.seo_url}` },
    ];
  }, [category]);

  const itemListItems = useMemo(() => {
    return companies.map((comp, index) => ({
      name: comp.name,
      url: `/companies/${comp.slug}`,
      image: comp.logo_url || undefined,
      position: index + 1,
    }));
  }, [companies]);

  const mobileStatesFromCompanies = useMemo(() => {
    const values = new Set<string>();
    companies.forEach((company) => {
      if (company.state) values.add(company.state);
    });
    return Array.from(values).sort();
  }, [companies]);

  const { states: allStates, cities: allCities, loadingCities, fetchCities } = useLocationData();

  useEffect(() => {
    if (filters.state) {
      fetchCities(filters.state);
    }
  }, [filters.state, fetchCities]);

  const mobileStates = useMemo(() => {
    if (allStates.length > 0) return allStates;
    return mobileStatesFromCompanies;
  }, [allStates, mobileStatesFromCompanies]);

  const mobileCitiesFromCompanies = useMemo(() => {
    if (!filters.state) return [] as string[];
    const values = new Set<string>();
    companies.forEach((company) => {
      if (!company.city) return;
      if (company.state && company.state !== filters.state) return;
      values.add(company.city);
    });
    return Array.from(values).sort();
  }, [companies, filters.state]);

  const mobileCities = useMemo(() => {
    if (allCities.length > 0) return allCities;
    return mobileCitiesFromCompanies;
  }, [allCities, mobileCitiesFromCompanies]);

  return (
    <div className="relative min-h-screen bg-gray-50/50">
      <BreadcrumbJsonLd items={jsonLdItems} />
      <ItemListJsonLd items={itemListItems} />
      
      {/* MOBILE */}
      <div className="md:hidden">
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 py-2.5">
            <AppBreadcrumb items={breadcrumbItems} className="mb-2" />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder={`Buscar em ${category.name}...`}
                aria-label={`Buscar em ${category.name}`}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="h-10 rounded-lg bg-gray-100 pl-9 pr-3 text-sm placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-primary/30 transition-all duration-300"
              />
            </div>
          </div>
        </div>

        <div className="px-4 pb-20 pt-3 space-y-5">
          <QuickActionsSection />

          <CategoryHeader
            category={category}
            companiesCount={companies.length}
            onQuoteClick={() => openQuoteWizard({ source: 'category-page-mobile' })}
          />

          {banners.length > 0 && (
            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Patrocinadores</h2>
                  <p className="text-[10px] text-gray-600">Empresas em destaque</p>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  Ads
                </Badge>
              </div>
              <SponsorCarousel banners={banners} />
            </motion.section>
          )}

          <MobileLocationLeadFilter
            filters={filters}
            states={mobileStates}
            cities={mobileCities}
            loadingCities={loadingCities}
            fetchCities={fetchCities}
            handleFilterChange={handleFilterChange}
          />

          {/* Top Ranking Section (Sprint 1) */}
          {filteredCompanies.length > 0 && currentPage === 1 && !loadingCompanies && (
            <TopCompaniesGrid 
              companies={filteredCompanies} 
              title={`Top ${category.name}`} 
              className="px-0"
            />
          )}

          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">Empresas</h2>
                <p className="text-[10px] text-gray-500">{filteredCompanies.length} resultados</p>
              </div>
              <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                {filteredCompanies.length}
              </Badge>
            </div>

            <AnimatePresence mode="wait">
              {loadingCompanies ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-64 rounded-xl" />
                  ))}
                </motion.div>
              ) : filteredCompanies.length > 0 ? (
                <motion.div key="companies" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {filteredCompanies.map((company, index) => (
                    <motion.div
                      key={company.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                    >
                      <CompanyCard company={company} rank={index + 1} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-12 text-center bg-white rounded-xl border border-dashed border-gray-200"
                >
                  <Search className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-900">Sem resultados</p>
                  <Button
                    onClick={() => handleFilterChange('clearAll', null)}
                    variant="link"
                    className="text-xs text-primary h-auto p-0 mt-1"
                  >
                    Limpar filtros
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>

          <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-sm shadow-lg">
            <div className="mx-auto flex max-w-md items-center justify-around py-2">
              {[
                { href: '/', icon: Home, label: 'Início', active: true },
                { href: '/categories', icon: Grid, label: 'Categorias' },
                { href: '/profile?tab=favorites', icon: Heart, label: 'Favoritos' },
                { href: '/profile', icon: User, label: 'Perfil' },
              ].map((item) => (
                <Link key={item.label} href={item.href} className="flex flex-col items-center gap-0.5 group">
                  <div className="p-1.5 rounded-lg transition-all duration-300 group-hover:bg-gray-100">
                    <item.icon
                      className={`h-4 w-4 transition-colors duration-300 ${
                        item.active ? 'text-primary' : 'text-gray-600 group-hover:text-gray-900'
                      }`}
                    />
                  </div>
                  <span className="text-[9px] font-medium transition-colors duration-300 text-gray-700 group-hover:text-gray-900">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden md:block">
        <div className="container mx-auto px-4 py-8">
          <AppBreadcrumb items={breadcrumbItems} className="mb-6" />
          <CategoryHeader
            category={category}
            companiesCount={companies.length}
            onQuoteClick={() => openQuoteWizard({ source: 'category-page-desktop' })}
          />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="h-fit space-y-6">
              <div className="lg:hidden">
                <Button onClick={() => setShowFilters(!showFilters)} variant="outline" className="w-full text-sm hover:bg-gray-50">
                  <Filter className="h-3.5 w-3.5 mr-1.5" />
                  Filtros
                </Button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className={`lg:block ${showFilters ? 'block' : 'hidden'}`}>
                  <SidebarFilter filters={filters} onFilterChange={handleFilterChange} locationsData={{}} categories={[]} />
                </motion.div>
              </AnimatePresence>
            </aside>

            <main className="space-y-8">
              {banners.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-bold text-gray-900">Patrocinadores</h2>
                      <p className="text-xs text-gray-500">Empresas em destaque na categoria</p>
                    </div>
                    <Badge variant="outline" className="bg-gray-50 text-[10px] h-5">
                      Parceiros
                    </Badge>
                  </div>
                  <div className="w-full">
                    <SponsorCarousel banners={banners} />
                  </div>
                </motion.div>
              )}

              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Empresas de {category.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">{filteredCompanies.length} fornecedores encontrados</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <ActiveFilters filters={filters} handleFilterChange={handleFilterChange} />
                  </div>
                </div>

                {/* Top Ranking Section (Sprint 1) */}
                {filteredCompanies.length > 0 && currentPage === 1 && !loadingCompanies && (
                  <TopCompaniesGrid 
                    companies={filteredCompanies} 
                    title={`Ranking: Melhores em ${category.name}`}
                  />
                )}

                <AnimatePresence mode="wait">
                  {loadingCompanies ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                    >
                      {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-80 rounded-xl" />
                      ))}
                    </motion.div>
                  ) : filteredCompanies.length > 0 ? (
                    <motion.div
                      key="companies"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr items-stretch"
                    >
                      {filteredCompanies.map((company, index) => (
                        <motion.div
                          key={company.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04 }}
                          whileHover={{ y: -5 }}
                          className="transition-all duration-300 hover:shadow-xl rounded-xl h-full flex flex-col"
                        >
                          <CompanyCard company={company} rank={index + 1} />
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-16 text-center bg-white rounded-2xl border border-dashed border-gray-200"
                    >
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
                        <Search className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhuma empresa encontrada</h3>
                      <p className="text-base text-gray-600 max-w-md mx-auto mb-6">Tente ajustar seus filtros para encontrar o que procura.</p>
                      <Button onClick={() => handleFilterChange('clearAll', null)} className="h-11 px-8">
                        Limpar Todos os Filtros
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {hasMore && !loadingCompanies && (
                  <div className="flex justify-center mt-12 mb-8">
                    <Button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      size="lg"
                      className="bg-[#14b8a6] hover:bg-[#0d9488] text-white px-12 h-14 rounded-xl shadow-lg shadow-teal-500/20 font-bold text-lg transition-all hover:scale-105"
                    >
                      Carregar Mais Empresas
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
