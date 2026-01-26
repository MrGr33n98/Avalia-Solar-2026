'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import CompanyCard from '@/components/CompanyCard';
import SidebarFilter from '@/components/SidebarFilter';
import { Category, Company, Banner } from '@/lib/api';
// ... Lucide icons ...
import {
  AlertCircle,
  Filter,
  Search,
  Star,
  MapPin,
  CheckCircle,
  Home,
  Grid,
  Heart,
  User,
  Zap,
  ArrowRight,
  ShieldCheck,
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
import { Badge } from '@/components/ui/badge';
import { AppBreadcrumb, BreadcrumbItemData } from '@/components/AppBreadcrumb';
import { BreadcrumbJsonLd } from '@/components/BreadcrumbJsonLd';
import { ItemListJsonLd } from '@/components/ItemListJsonLd';

interface CategoryClientProps {
  initialCategory: Category;
  initialCompanies: Company[];
  initialBanners?: Banner[];
  paginationMeta?: {
    total_count?: number;
    page?: number;
    per_page?: number;
    total_pages?: number;
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

// ==============================
// COMPONENTE: Filtros de Localização Mobile
// ==============================
function LocationFilterSection({
  filters,
  states,
  cities,
  handleFilterChange,
}: {
  filters: any;
  states: string[];
  cities: string[];
  handleFilterChange: (type: string, value: any) => void;
}) {
  return (
    <div className="space-y-3">
      {/* Estado */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <MapPin className="h-3.5 w-3.5 text-gray-500" />
          <p className="text-xs font-semibold text-gray-700">Estado</p>
          {filters.state && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 ml-auto"
              onClick={() => handleFilterChange('state', '')}
            >
              <XIcon className="h-3 w-3" />
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleFilterChange('state', '')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !filters.state
                ? 'bg-[#14b8a6] text-white shadow'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>

          {states.map((state) => (
            <button
              key={state}
              type="button"
              onClick={() => handleFilterChange('state', state)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filters.state === state
                  ? 'bg-[#14b8a6] text-white shadow'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {state}
            </button>
          ))}
        </div>
      </div>

      {/* Cidade */}
      {filters.state && cities.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <MapPin className="h-3.5 w-3.5 text-gray-500" />
            <p className="text-xs font-semibold text-gray-700">Cidade em {filters.state}</p>
            {filters.city && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 ml-auto"
                onClick={() => handleFilterChange('city', '')}
              >
                <XIcon className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleFilterChange('city', '')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !filters.city
                  ? 'bg-[#14b8a6] text-white shadow'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>

            {cities.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => handleFilterChange('city', city)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filters.city === city
                    ? 'bg-[#14b8a6] text-white shadow'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
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
          <Image
            src={bannerUrl!}
            alt={category.name}
            fill
            className="object-cover transition-transform duration-1000 group-hover:scale-105"
            onError={() => setImageError(true)}
            priority
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
// COMPONENTE: MobileFiltersSection
// ==============================
function MobileFiltersSection({ filters, mobileStates, mobileCities, handleFilterChange }: any) {
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Filtros</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFilterChange('clearAll', null)}
          className="text-[10px] text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          Limpar tudo
        </Button>
      </div>

      {/* Localização */}
      <LocationFilterSection filters={filters} states={mobileStates} cities={mobileCities} handleFilterChange={handleFilterChange} />

      {/* Qualidade */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Star className="h-3.5 w-3.5 text-gray-500" />
          <p className="text-xs font-semibold text-gray-700">Qualidade</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[5, 4, 3].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => handleFilterChange('rating', filters.rating === rating ? 0 : rating)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                filters.rating === rating ? 'bg-amber-500 text-white shadow hover:bg-amber-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center justify-center gap-0.5">
                {[...Array(rating)].map((_, i) => (
                  <Star key={i} className="h-2.5 w-2.5 fill-current" />
                ))}
                <span>+</span>
              </div>
            </button>
          ))}

          <button
            type="button"
            onClick={() => handleFilterChange('verified', !filters.verified)}
            className={`rounded-lg px-3 py-2 text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
              filters.verified ? 'bg-emerald-500 text-white shadow hover:bg-emerald-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Verificadas
          </button>
        </div>
      </div>
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
  const [showFilters, setShowFilters] = useState(false);
  
  // Sincroniza o estado de loading quando a rota muda
  useEffect(() => {
    setLoadingCompanies(false);
  }, [initialCompanies]);

  const filters = useMemo(() => ({
    searchTerm: searchParams.get('searchTerm') || '',
    state: searchParams.get('state') || '',
    city: searchParams.get('city') || '',
    rating: Number(searchParams.get('rating')) || 0,
    verified: searchParams.get('verified') === 'true',
    page: Number(searchParams.get('page')) || 1,
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
      
      // Reset page when filters change (unless explicitly changing page)
      if (!params.hasOwnProperty('page')) {
        newSearchParams.delete('page');
      }

      return newSearchParams.toString();
    },
    [searchParams]
  );

  const handleFilterChange = (filterType: string, value: any) => {
    setLoadingCompanies(true);
    
    if (filterType === 'clearAll') {
      router.push(pathname, { scroll: false });
      return;
    }

    const updates: Record<string, any> = {
      [filterType]: value,
    };

    if (filterType === 'state') {
      updates.city = null; // Clear city when state changes
    }

    const queryString = createQueryString(updates);
    router.push(`${pathname}?${queryString}`, { scroll: false });
  };

  const filteredCompanies = initialCompanies;
  const companies = initialCompanies;

  const handleLoadMore = () => {
    if (paginationMeta?.total_pages && filters.page < paginationMeta.total_pages) {
      setLoadingCompanies(true);
      const queryString = createQueryString({ page: filters.page + 1 });
      router.push(`${pathname}?${queryString}`, { scroll: false });
    }
  };

  const hasMore = paginationMeta?.total_pages ? filters.page < paginationMeta.total_pages : false;
  const banners = initialBanners;

  const breadcrumbItems: BreadcrumbItemData[] = useMemo(() => [
    { label: 'Categorias', href: '/categories' },
    { label: category.name, active: true },
  ], [category]);

  const jsonLdItems = useMemo(() => [
    { name: 'Home', item: '/' },
    { name: 'Categorias', item: '/categories' },
    { name: category.name, item: `/categories/${category.seo_url}` },
  ], [category]);

  const itemListItems = useMemo(() => {
    return companies.map((comp, index) => ({
      name: comp.name,
      url: `/companies/${comp.slug}`,
      image: comp.logo_url || undefined,
      position: index + 1,
    }));
  }, [companies]);

  const mobileStates = useMemo(() => {
    const values = new Set<string>();
    companies.forEach((company) => {
      if (company.state) values.add(company.state);
    });
    return Array.from(values).sort();
  }, [companies]);

  const mobileCities = useMemo(() => {
    if (!filters.state) return [] as string[];
    const values = new Set<string>();
    companies.forEach((company) => {
      if (!company.city) return;
      if (company.state && company.state !== filters.state) return;
      values.add(company.city);
    });
    return Array.from(values).sort();
  }, [companies, filters.state]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-red-50">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="mb-3 text-xl font-bold text-gray-900">Categoria não encontrada</h1>
            <p className="mb-4 text-sm text-gray-600">A categoria não existe ou foi removida.</p>
            <div className="space-x-2">
              <Button onClick={() => window.history.back()} size="sm">
                Voltar
              </Button>
              <Button variant="outline" size="sm" onClick={() => (window.location.href = '/categories')}>
                Ver categorias
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

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
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
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

          <ActiveFilters filters={filters} handleFilterChange={handleFilterChange} />

          <MobileFiltersSection
            filters={filters}
            mobileStates={mobileStates}
            mobileCities={mobileCities}
            handleFilterChange={handleFilterChange}
          />

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
                      <CompanyCard company={company} />
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
                      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                    >
                      {filteredCompanies.map((company, index) => (
                        <motion.div
                          key={company.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04 }}
                          whileHover={{ y: -5 }}
                          className="transition-all duration-300 hover:shadow-xl rounded-xl"
                        >
                          <CompanyCard company={company} />
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