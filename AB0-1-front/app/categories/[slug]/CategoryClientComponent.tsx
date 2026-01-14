'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import CategoryBanner from '@/components/CategoryBanner';
import CompanyCard from '@/components/CompanyCard';
import SidebarFilter from '@/components/SidebarFilter';
import { Category, Company, Banner } from '@/lib/api';
import { AlertCircle, Filter, Grid, Heart, Home, Search, Star, User, Zap, ChevronRight, MapPin, CheckCircle, TrendingUp, Users, Award, Sun, Battery, Wind, Droplet, Zap as Lightning, Home as House, Factory, Building, X } from 'lucide-react';
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

interface CategoryClientProps {
  initialCategory: Category;
  initialCompanies: Company[];
  initialBanners?: Banner[];
}

// ==============================
// COMPONENTE: Filtros de Localização Mobile
// ==============================
function LocationFilterSection({ 
  filters, 
  states, 
  cities,
  handleFilterChange 
}: { 
  filters: any;
  states: string[];
  cities: string[];
  handleFilterChange: (type: string, value: any) => void;
}) {
  return (
    <div className="space-y-3">
      {/* Filtro de Estado */}
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
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleFilterChange('state', '')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !filters.state 
                ? 'bg-primary text-white shadow' 
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
                  ? 'bg-primary text-white shadow'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {state}
            </button>
          ))}
        </div>
      </div>

      {/* Filtro de Cidade (só aparece se estado selecionado) */}
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
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleFilterChange('city', '')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !filters.city 
                  ? 'bg-primary text-white shadow' 
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
                    ? 'bg-primary text-white shadow'
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
function ActiveFilters({ filters, handleFilterChange }: { 
  filters: any; 
  handleFilterChange: (type: string, value: any) => void;
}) {
  const hasActiveFilters = filters.state || filters.city || filters.rating > 0 || filters.verified;

  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {filters.state && (
        <Badge variant="secondary" className="gap-1">
          Estado: {filters.state}
          <button 
            onClick={() => handleFilterChange('state', '')}
            className="ml-1 hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {filters.city && (
        <Badge variant="secondary" className="gap-1">
          Cidade: {filters.city}
          <button 
            onClick={() => handleFilterChange('city', '')}
            className="ml-1 hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {filters.rating > 0 && (
        <Badge variant="secondary" className="gap-1">
          Avaliação: {filters.rating}+
          <button 
            onClick={() => handleFilterChange('rating', 0)}
            className="ml-1 hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {filters.verified && (
        <Badge variant="secondary" className="gap-1">
          Verificadas
          <button 
            onClick={() => handleFilterChange('verified', false)}
            className="ml-1 hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleFilterChange('clearAll', null)}
        className="text-xs h-6 px-2"
      >
        Limpar tudo
      </Button>
    </div>
  );
}

// ==============================
// HELPER: Mapear categorias para ícones e descrições
// ==============================
function getCategoryDetails(categoryName: string, companiesCount?: number) {
  const name = categoryName.toLowerCase();
  
  // Paleta de cores otimizada - Tema Corporativo Unificado (Azul/Verde/Teal)
  const colorPalette = {
    solar: { from: 'from-blue-600', to: 'to-cyan-600' }, // Azul Profissional
    inverter: { from: 'from-indigo-600', to: 'to-blue-700' }, // Azul Tecnológico
    battery: { from: 'from-teal-600', to: 'to-emerald-600' }, // Verde Energia
    wind: { from: 'from-cyan-600', to: 'to-blue-600' }, // Azul Ar
    hydro: { from: 'from-blue-700', to: 'to-cyan-700' }, // Azul Água
    efficiency: { from: 'from-emerald-600', to: 'to-teal-600' }, // Verde Eficiência
    residential: { from: 'from-blue-500', to: 'to-indigo-500' }, // Azul Residencial
    commercial: { from: 'from-slate-700', to: 'to-slate-900' }, // Cinza Corporativo
    industrial: { from: 'from-gray-700', to: 'to-gray-900' }, // Cinza Industrial
    default: { from: 'from-blue-600', to: 'to-cyan-600' } // Padrão Azul
  };

  // Mapeamento de categorias para ícones e descrições
  const categoryMap: Record<string, { 
    icon: any; 
    description: string; 
    benefit: string;
    color: string;
    stats: { label: string; value: string }[];
  }> = {
    // Energia Solar
    'painéis solares': { 
      icon: Sun, 
      description: 'Módulos fotovoltaicos para geração de energia limpa',
      benefit: 'Economize até 95% na conta de luz',
      color: `${colorPalette.solar.from} ${colorPalette.solar.to}`,
      stats: [
        { label: 'Fornecedores', value: '50+' },
        { label: 'Avaliação', value: '4.8' },
        { label: 'Garantia', value: '25 anos' }
      ]
    },
    'energia solar': { 
      icon: Sun, 
      description: 'Sistemas completos de geração solar',
      benefit: 'Energia 100% renovável',
      color: `${colorPalette.solar.from.replace('500', '400')} ${colorPalette.solar.to}`,
      stats: [
        { label: 'Empresas', value: '45+' },
        { label: 'Rating', value: '4.7' },
        { label: 'Brasil', value: '100%' }
      ]
    },
    'solar': { 
      icon: Sun, 
      description: 'Soluções em energia solar fotovoltaica',
      benefit: 'Retorno em 3-5 anos',
      color: `${colorPalette.solar.from.replace('500', '400')} ${colorPalette.solar.to.replace('500', '400')}`,
      stats: [
        { label: 'Fornecedores', value: '60+' },
        { label: 'Média', value: '4.6' },
        { label: 'Cobertura', value: 'Nacional' }
      ]
    },
    
    // Inversores
    'inversores': { 
      icon: Lightning, 
      description: 'Conversores CC para CA de alta eficiência',
      benefit: 'Maximize sua produção solar',
      color: `${colorPalette.inverter.from} ${colorPalette.inverter.to}`,
      stats: [
        { label: 'Marcas', value: '20+' },
        { label: 'Eficiência', value: '98%' },
        { label: 'Garantia', value: '10 anos' }
      ]
    },
    'inversores solares': { 
      icon: Lightning, 
      description: 'Inversores para sistemas fotovoltaicos',
      benefit: 'Conversão eficiente de energia',
      color: `${colorPalette.inverter.from.replace('500', '600')} ${colorPalette.inverter.to.replace('500', '600')}`,
      stats: [
        { label: 'Fornecedores', value: '25+' },
        { label: 'Avaliação', value: '4.5' },
        { label: 'Potência', value: '1-100kW' }
      ]
    },
    
    // Default
    'default': { 
      icon: TrendingUp, 
      description: 'Soluções em energia renovável e eficiência',
      benefit: 'Economia e sustentabilidade',
      color: `${colorPalette.default.from} ${colorPalette.default.to}`,
      stats: [
        { label: 'Fornecedores', value: `${Math.min(50, companiesCount || 30)}+` },
        { label: 'Avaliação', value: '4.5+' },
        { label: 'Cobertura', value: 'Nacional' }
      ]
    }
  };

  // Procura correspondência exata
  for (const [key, value] of Object.entries(categoryMap)) {
    if (name.includes(key.toLowerCase())) {
      return value;
    }
  }

  // Procura por palavras-chave
  const keywords: Record<string, string> = {
    'solar': 'painéis solares',
    'painel': 'painéis solares',
    'fotovoltaico': 'painéis solares',
    'inversor': 'inversores',
    'conversor': 'inversores',
  };

  for (const [keyword, category] of Object.entries(keywords)) {
    if (name.includes(keyword)) {
      return categoryMap[category] || categoryMap.default;
    }
  }

  return categoryMap.default;
}

// ==============================
// COMPONENTE: SponsorBanner
// ==============================
function SponsorBanner({ banner }: { banner: Banner }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const imageUrl = getFullImageUrl(banner.image_url || '') || '';
  const hasImage = Boolean(imageUrl) && !imageError;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="group relative overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md hover:ring-gray-300"
    >
      <div className="relative aspect-[21/9] overflow-hidden">
        {hasImage ? (
          <Image
            src={imageUrl}
            alt={banner.title || 'Patrocínio'}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={[
              'object-cover transition-transform duration-700 group-hover:scale-105',
              imageLoaded ? 'opacity-100' : 'opacity-0',
            ].join(' ')}
            onError={() => isMountedRef.current && setImageError(true)}
            onLoad={() => isMountedRef.current && setImageLoaded(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center">
              <TrendingUp className="mx-auto h-8 w-8 text-gray-400" />
              <span className="mt-2 block text-sm font-medium text-gray-500">Patrocínio</span>
            </div>
          </div>
        )}
        
        <div className="absolute top-3 left-3">
          <span className="rounded-full bg-emerald-500 px-2 py-1 text-xs font-semibold text-white">
            Patrocinado
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
          {banner.title || 'Patrocínio'}
        </h3>
        {banner.description && (
          <p className="mt-1 text-xs text-gray-600 line-clamp-2">
            {banner.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ==============================
// COMPONENTE: FeaturedCategorySection
// ==============================
function FeaturedCategorySection({ 
  category,
  companiesCount,
  onQuoteClick 
}: { 
  category: Category;
  companiesCount?: number;
  onQuoteClick: () => void 
}) {
  const categoryDetails = getCategoryDetails(category.name, companiesCount);
  const Icon = categoryDetails.icon;
  
  const dynamicStats = categoryDetails.stats.map(stat => {
    if (stat.label === 'Fornecedores' || stat.label === 'Empresas' || stat.label === 'Marcas') {
      return {
        ...stat,
        value: companiesCount ? `${Math.min(companiesCount, 99)}+` : stat.value
      };
    }
    return stat;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-xl shadow-md h-24"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${categoryDetails.color}`} />
      
      <div className="relative h-full p-3">
        <div className="flex items-center justify-between gap-3 h-full">
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-0.5">
              <Icon className="h-3 w-3 text-white flex-shrink-0" />
              <span className="text-[8px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                DESTAQUE • {category.name.toUpperCase().substring(0, 20)}
              </span>
            </div>
            
            <div className="mb-0.5">
              <h2 className="text-xs font-bold text-white truncate">
                {category.name.substring(0, 25)}
              </h2>
              <p className="text-[9px] text-white/90 opacity-90 line-clamp-1">
                {categoryDetails.description.substring(0, 40)}
              </p>
            </div>
            
            <div className="flex items-center gap-1 mb-1">
              {dynamicStats.slice(0, 3).map((stat, index) => (
                <div key={index} className="flex items-center gap-0.5 bg-white/10 rounded px-1 py-0.5">
                  <span className="text-[8px] font-bold text-white">
                    {stat.value}
                  </span>
                  <span className="text-[7px] font-medium text-white/80">
                    {stat.label.substring(0, 8)}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-1.5">
              <Button
                onClick={onQuoteClick}
                size="sm"
                className="bg-white text-gray-900 hover:bg-white/90 font-semibold h-6 text-[9px] px-2 py-0 flex-shrink-0"
              >
                Orçamento
                <ChevronRight className="ml-0.5 h-2 w-2" />
              </Button>
              <span className="text-[8px] text-white/90 font-medium line-clamp-1">
                {categoryDetails.benefit.substring(0, 35)}
              </span>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center justify-center w-8 h-8 bg-white/10 rounded-lg flex-shrink-0">
            <Icon className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ==============================
// COMPONENTE: CategoryHeroBanner
// ==============================
function CategoryHeroBanner({ 
  category, 
  companiesCount,
  onQuoteClick 
}: { 
  category: Category; 
  companiesCount?: number;
  onQuoteClick: () => void 
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const bannerUrl = useMemo(() => {
    const possibleImageFields = ['banner_url', 'image_url', 'image', 'cover_image', 'thumbnail'];
    for (const field of possibleImageFields) {
      if ((category as any)?.[field]) {
        const url = getFullImageUrl((category as any)[field]);
        if (url) return url;
      }
    }
    return null;
  }, [category]);

  const hasImage = Boolean(bannerUrl) && !imageError;

  return (
    <motion.div
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-xl shadow-lg"
    >
      <div className="relative h-32 sm:h-36 md:h-40">
        {hasImage ? (
          <>
            <Image
              src={bannerUrl!}
              alt={`Banner ${category.name}`}
              fill
              sizes="100vw"
              priority
              className="object-cover"
              onError={() => setImageError(true)}
              onLoad={() => setImageLoaded(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/85 via-gray-900/30 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent" />
        )}
        
        <div className="relative h-full flex items-center">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-2xl">
              <div className="mb-1.5">
                <span className="inline-flex items-center text-[10px] font-bold text-white px-2 py-0.5 bg-emerald-500/90 rounded-full">
                  {category.name}
                </span>
              </div>
              
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight mb-1">
                {category.name}
              </h1>
              
              <p className="text-xs sm:text-sm text-white/85 mb-2">
                Encontre os melhores fornecedores especializados
              </p>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-xs font-medium text-white/90">
                    <strong>{companiesCount || 0}</strong> empresas especializadas
                  </span>
                </div>

                <Button
                  onClick={onQuoteClick}
                  size="sm"
                  className="bg-white text-gray-900 hover:bg-gray-100 font-bold h-8 text-xs px-4 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Solicitar Orçamento
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ==============================
// COMPONENTE: QuickActionsSection
// ==============================
function QuickActionsSection() {
  const quickActions = [
    { 
      label: 'Empresas', 
      href: '/companies', 
      icon: Home, 
      color: 'bg-amber-500 hover:bg-amber-600',
      description: 'Buscar fornecedores'
    },
    { 
      label: 'Produtos', 
      href: '/products', 
      icon: Grid, 
      color: 'bg-emerald-500 hover:bg-emerald-600',
      description: 'Catálogo completo'
    },
    { 
      label: 'Avaliar', 
      href: '/reviews/my', 
      icon: Star, 
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Deixe sua opinião'
    },
    { 
      label: 'Favoritos', 
      href: '/profile?tab=favorites', 
      icon: Heart, 
      color: 'bg-rose-500 hover:bg-rose-600',
      description: 'Salve empresas'
    },
    { 
      label: 'Blog', 
      href: '/blog', 
      icon: Zap, 
      color: 'bg-violet-500 hover:bg-violet-600',
      description: 'Dicas e notícias'
    },
  ];

  return (
    <motion.section 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-5 gap-2"
    >
      {quickActions.map((action, index) => {
        const Icon = action.icon;
        return (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link 
              href={action.href} 
              className="group flex flex-col items-center gap-1.5 p-2 rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-gray-200"
            >
              <div className={`relative p-2 rounded-lg ${action.color} text-white shadow-sm group-hover:scale-105 transition-all duration-300`}>
                <Icon className="h-4 w-4" />
                <div className="absolute inset-0 rounded-lg bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="text-center">
                <span className="text-[10px] font-semibold text-gray-900 block">
                  {action.label}
                </span>
                <span className="text-[9px] text-gray-600 mt-0.5 block">
                  {action.description}
                </span>
              </div>
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
function MobileFiltersSection({ 
  filters, 
  mobileStates, 
  mobileCities, 
  handleFilterChange 
}: any) {
  return (
    <motion.section 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100"
    >
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
      <LocationFilterSection
        filters={filters}
        states={mobileStates}
        cities={mobileCities}
        handleFilterChange={handleFilterChange}
      />
      
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
                filters.rating === rating
                  ? 'bg-amber-500 text-white shadow hover:bg-amber-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
              filters.verified
                ? 'bg-emerald-500 text-white shadow hover:bg-emerald-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
}: CategoryClientProps) {
  const [category] = useState<Category>(initialCategory);
  const [companies] = useState<Company[]>(initialCompanies);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>(initialCompanies);
  const [loadingCompanies] = useState(false);
  const [error] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [banners] = useState<Banner[]>(initialBanners);

  const [filters, setFilters] = useState({
    searchTerm: '',
    state: '',
    city: '',
    rating: 0,
    verified: false,
  });

  useEffect(() => {
    let filtered = [...companies];

    if (filters.searchTerm) {
      const needle = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (company) =>
          (company.name || '').toLowerCase().includes(needle) ||
          (company.description || '').toLowerCase().includes(needle),
      );
    }

    if (filters.state) {
      filtered = filtered.filter(
        (company) => company.state?.toLowerCase() === filters.state.toLowerCase()
      );
    }

    if (filters.city) {
      filtered = filtered.filter(
        (company) => company.city?.toLowerCase() === filters.city.toLowerCase()
      );
    }

    if (filters.rating > 0) {
      filtered = filtered.filter((company) => (company.rating_avg || 0) >= filters.rating);
    }

    if (filters.verified) {
      filtered = filtered.filter((company) => company.status === 'active');
    }

    setFilteredCompanies(filtered);
  }, [filters, companies]);

  const handleFilterChange = (filterType: string, value: any) => {
    if (filterType === 'clearAll') {
      setFilters({
        searchTerm: '',
        state: '',
        city: '',
        rating: 0,
        verified: false,
      });
      return;
    }
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
      ...(filterType === 'state' && { city: '' }),
    }));
  };

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
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-center py-12"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-red-50">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="mb-3 text-xl font-bold text-gray-900">Categoria não encontrada</h1>
            <p className="mb-4 text-sm text-gray-600">A categoria não existe ou foi removida.</p>
            <div className="space-x-2">
              <Button onClick={() => window.history.back()} size="sm">Voltar</Button>
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
    <div className="relative min-h-screen bg-gray-50">
      {/* MOBILE */}
      <div className="md:hidden">
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 py-2.5">
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

        <div className="px-4 pb-20 pt-3 space-y-4">
          <QuickActionsSection />

          <CategoryHeroBanner 
            category={category}
            companiesCount={companies.length}
            onQuoteClick={() => openQuoteWizard({ source: 'category-page-mobile' })}
          />

          {banners.length > 0 && (
            <motion.section 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Patrocinadores</h2>
                  <p className="text-[10px] text-gray-600">Empresas em destaque</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
              <SponsorCarousel banners={banners} />
            </motion.section>
          )}

          <FeaturedCategorySection 
            category={category}
            companiesCount={companies.length}
            onQuoteClick={() => openQuoteWizard({ source: 'category-page-featured-mobile' })} 
          />

          {/* Mostrar Filtros Ativos */}
          <ActiveFilters filters={filters} handleFilterChange={handleFilterChange} />

          <MobileFiltersSection 
            filters={filters}
            mobileStates={mobileStates}
            mobileCities={mobileCities}
            handleFilterChange={handleFilterChange}
          />

          <motion.section 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-white p-4 shadow-sm border border-gray-100"
          >
            <h3 className="text-base font-bold text-gray-900 mb-2">
              Sobre {category.name}
            </h3>
            {category.description && (
              <p className="text-xs text-gray-700 leading-relaxed">
                {category.description}
              </p>
            )}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">Total de empresas</span>
                <span className="text-sm font-bold text-gray-900">{companies.length}</span>
              </div>
            </div>
          </motion.section>

          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Empresas de {category.name}</h2>
                <p className="text-xs text-gray-600">Fornecedores especializados</p>
              </div>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                {filteredCompanies.length}
              </span>
            </div>

            <AnimatePresence mode="wait">
              {loadingCompanies ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-2 gap-2.5"
                >
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-40 rounded-lg" />
                  ))}
                </motion.div>
              ) : filteredCompanies.length > 0 ? (
                <motion.div 
                  key="companies"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-2 gap-2.5"
                >
                  {filteredCompanies.map((company, index) => (
                    <motion.div
                      key={company.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <CompanyCard company={company} compact />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl border border-dashed border-gray-200 bg-white p-4 text-center"
                >
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Nenhuma empresa encontrada</h3>
                  <p className="text-xs text-gray-600 mb-3">
                    Ajuste os filtros ou termos de busca
                  </p>
                  <Button
                    onClick={() => handleFilterChange('clearAll', null)}
                    variant="outline"
                    size="sm"
                    className="text-xs hover:bg-gray-50"
                  >
                    Limpar Filtros
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
                <Link 
                  key={item.label}
                  href={item.href}
                  className="flex flex-col items-center gap-0.5 group"
                >
                  <div className="p-1.5 rounded-lg transition-all duration-300 group-hover:bg-gray-100">
                    <item.icon className={`h-4 w-4 transition-colors duration-300 ${item.active ? 'text-primary' : 'text-gray-600 group-hover:text-gray-900'}`} />
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
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="h-fit space-y-4">
              <div className="lg:hidden">
                <Button 
                  onClick={() => setShowFilters(!showFilters)} 
                  variant="outline" 
                  className="w-full text-sm hover:bg-gray-50"
                >
                  <Filter className="h-3.5 w-3.5 mr-1.5" />
                  Filtros
                </Button>
              </div>
              
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`lg:block ${showFilters ? 'block' : 'hidden'}`}
                >
                  {/* Sidebar com Filtros */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <h3 className="text-sm font-bold text-gray-900 mb-3">Filtros</h3>
                    
                    {/* Localização */}
                    <div className="space-y-3 mb-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-2">Estado</p>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleFilterChange('state', '')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              !filters.state 
                                ? 'bg-primary text-white shadow' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Todos
                          </button>
                          {mobileStates.slice(0, 6).map((state) => (
                            <button
                              key={state}
                              type="button"
                              onClick={() => handleFilterChange('state', state)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                filters.state === state
                                  ? 'bg-primary text-white shadow'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {state}
                            </button>
                          ))}
                        </div>
                      </div>

                      {filters.state && mobileCities.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-2">Cidade</p>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleFilterChange('city', '')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                !filters.city 
                                  ? 'bg-primary text-white shadow' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Todas
                            </button>
                            {mobileCities.slice(0, 6).map((city) => (
                              <button
                                key={city}
                                type="button"
                                onClick={() => handleFilterChange('city', city)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                  filters.city === city
                                    ? 'bg-primary text-white shadow'
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

                    {/* Avaliação */}
                    <div className="space-y-2 mb-4">
                      <p className="text-xs font-semibold text-gray-700">Avaliação Mínima</p>
                      <div className="space-y-1.5">
                        {[5, 4, 3].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => handleFilterChange('rating', filters.rating === rating ? 0 : rating)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
                              filters.rating === rating
                                ? 'bg-amber-500 text-white shadow'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <div className="flex">
                                {[...Array(rating)].map((_, i) => (
                                  <Star key={i} className="h-3 w-3 fill-current" />
                                ))}
                              </div>
                              <span>+ estrelas</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Verificadas */}
                    <div className="mb-4">
                      <button
                        type="button"
                        onClick={() => handleFilterChange('verified', !filters.verified)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center gap-2 ${
                          filters.verified
                            ? 'bg-emerald-500 text-white shadow'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Empresas Verificadas
                      </button>
                    </div>

                    {/* Limpar Filtros */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('clearAll', null)}
                      className="w-full text-xs"
                    >
                      Limpar Todos os Filtros
                    </Button>
                  </div>
                </motion.div>
              </AnimatePresence>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 p-4 text-white shadow-lg"
              >
                <h3 className="text-sm font-bold mb-2.5">Estatísticas</h3>
                <div className="space-y-2.5">
                  <div>
                    <div className="text-xs text-gray-300">Empresas na categoria</div>
                    <div className="text-lg font-bold">{companies.length}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-300">Avaliação média</div>
                    <div className="text-lg font-bold">4.5+</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-300">Cobertura nacional</div>
                    <div className="text-lg font-bold">100%</div>
                  </div>
                </div>
              </motion.div>
            </aside>

            <main className="space-y-6">
              {/* Mostrar Filtros Ativos */}
              <ActiveFilters filters={filters} handleFilterChange={handleFilterChange} />

              <CategoryHeroBanner 
                category={category}
                companiesCount={companies.length}
                onQuoteClick={() => openQuoteWizard({ source: 'category-page-desktop' })}
              />

              <div className="space-y-6">
                {banners.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Patrocinadores</h2>
                        <p className="text-sm text-gray-600">Empresas em destaque</p>
                      </div>
                      <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                        Ver todos
                        <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <SponsorCarousel banners={banners} />
                  </motion.div>
                )}

                <FeaturedCategorySection 
                  category={category}
                  companiesCount={companies.length}
                  onQuoteClick={() => openQuoteWizard({ source: 'category-page-featured-desktop' })} 
                />
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100"
              >
                <div className="border-b border-gray-200 bg-gray-50/50 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Empresas de {category.name}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Encontre os melhores fornecedores especializados
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700">
                        <span className="text-xl font-bold text-gray-900">{filteredCompanies.length}</span>
                        {' '}de{' '}
                        <span className="text-base font-semibold text-gray-700">{companies.length}</span>
                        {' '}empresas
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFilterChange('clearAll', null)}
                        className="hover:bg-gray-50"
                      >
                        Limpar filtros
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <AnimatePresence mode="wait">
                    {loadingCompanies ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
                      >
                        {[...Array(6)].map((_, i) => (
                          <Skeleton key={i} className="h-72 rounded-xl" />
                        ))}
                      </motion.div>
                    ) : filteredCompanies.length > 0 ? (
                      <motion.div
                        key="companies"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
                      >
                        {filteredCompanies.map((company, index) => (
                          <motion.div
                            key={company.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ y: -3 }}
                            className="transition-all duration-300 hover:shadow-lg"
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
                        className="py-12 text-center"
                      >
                        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                          <Search className="h-7 w-7 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                          Nenhuma empresa encontrada
                        </h3>
                        <p className="text-gray-600 max-w-md mx-auto mb-5">
                          Tente ajustar seus filtros ou buscar por outro termo
                        </p>
                        <Button
                          onClick={() => handleFilterChange('clearAll', null)}
                          size="sm"
                          className="px-5 hover:bg-gray-50"
                        >
                          Limpar Todos os Filtros
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}