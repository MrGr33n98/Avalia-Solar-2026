'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompaniesSafe } from '@/hooks/useCompaniesSafe';
import { useCategories } from '@/hooks/useCategories';
import CompanyCard from '@/components/CompanyCard';
import { Skeleton } from '@/components/ui/skeleton';
import { X } from 'lucide-react';
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

  return (
    <>
      <div className="bg-gray-100 min-h-screen">
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
    </>
  );
}
