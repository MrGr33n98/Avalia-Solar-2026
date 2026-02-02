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
import { FilterSidebar } from '@/components/filters/FilterSidebar';
import { parseQueryParams } from '@/components/filters/query';
import { CompanyFilters } from '@/components/filters/types';

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

  const [filters, setFilters] = useState<CompanyFilters>(() => parseQueryParams(searchParams));

  const { categories, loading: categoriesLoading } = useCategories(true);
  const { companies, loading: companiesLoading } = useCompaniesSafe({
    category_id: filters.category_ids.length > 0 ? filters.category_ids[0] : undefined,
  });

  const [sort, setSort] = useState<string>('name_asc');

  // Sincroniza estado interno com a URL
  useEffect(() => {
    setFilters(parseQueryParams(searchParams));
  }, [searchParams]);

  const selectedCategory = useMemo(() => {
    if (filters.category_ids.length === 0 || !categories) return null;
    return categories.find((cat) => cat.id === filters.category_ids[0]);
  }, [filters.category_ids, categories]);

  const filteredCompanies = useMemo(() => {
    if (!companies?.length) return [];
    
    try {
      return companies.filter((company) => {
        // Filtro de Categoria (se selecionado múltiplas, mostramos se a empresa pertence a qualquer uma)
        if (filters.category_ids.length > 0) {
          // Aqui assumimos que o backend já filtrou pela primeira categoria se passamos category_id
          // Se quisermos filtrar no front por múltiplas categorias:
          // if (!filters.category_ids.includes(company.category_id)) return false;
        }

        // Filtro de Estado
        if (filters.states.length > 0) {
          const { state } = parseAddress(company.address);
          if (!state || !filters.states.includes(state)) return false;
        }

        // Filtro de Avaliação
        if (filters.min_rating && (company.rating_avg || 0) < filters.min_rating) return false;

        // Filtro de Verificado
        if (filters.verified && !company.verified) return false;

        return true;
      });
    } catch (error) {
      console.error('[CategoriesClient] Error filtering companies:', error);
      return [];
    }
  }, [companies, filters]);

  const sortedCompanies = useMemo(() => {
    const list = [...filteredCompanies];
    if (sort === 'name_asc') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sort === 'name_desc') {
      list.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    } else if (sort === 'rating_desc') {
      list.sort((a, b) => (Number(b.rating_avg) || 0) - (Number(a.rating_avg) || 0));
    }
    return list;
  }, [filteredCompanies, sort]);

  const loading = companiesLoading || categoriesLoading;

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

  const mobileBanner = allBanners.find((banner) => banner?.image_url)?.image_url;

  return (
    <>
      <div className="bg-gray-100 min-h-screen">
        {/* --- MOBILE VIEW --- */}
        <div className="md:hidden">
          <FilterSidebar />
          
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

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Empresas</h2>
                <div className="flex items-center gap-2">
                  <Select value={sort} onValueChange={setSort}>
                    <SelectTrigger className="h-8 text-[10px] w-[130px] bg-white border-slate-200">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
                      <SelectItem value="name_desc">Nome (Z-A)</SelectItem>
                      <SelectItem value="rating_desc">Melhor Avaliação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

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
                <div className="grid grid-cols-2 gap-3">
                  {sortedCompanies.map((company) => (
                    <CompanyCard 
                      key={company.id} 
                      company={company} 
                      compact={true}
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
            <FilterSidebar />
            
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
              
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">
                  {loading ? 'Buscando empresas...' : `${sortedCompanies.length} Empresas encontradas`}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">Ordenar por:</span>
                  <Select value={sort} onValueChange={setSort}>
                    <SelectTrigger className="w-[200px] bg-white border-slate-200">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
                      <SelectItem value="name_desc">Nome (Z-A)</SelectItem>
                      <SelectItem value="rating_desc">Melhor Avaliação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Lista de Empresas DESKTOP */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}
                </div>
              ) : filteredCompanies.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
                    <Filter className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="text-xl font-semibold text-slate-900">Nenhuma empresa encontrada</p>
                  <p className="text-slate-500 mt-2">Tente ajustar seus filtros para encontrar o que procura.</p>
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
