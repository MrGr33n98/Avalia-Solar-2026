'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CategoryHero from '@/components/categories/CategoryHero';
import BannerByLocation from '@/components/BannerByLocation';
import DecisionChips from '@/components/categories/DecisionChips';
import CategoryNichesCarousel from '@/components/categories/CategoryNichesCarousel';
import CategoryCompaniesTable from '@/components/categories/CategoryCompaniesTable';
import FeaturedCompanyCard from '@/components/categories/FeaturedCompanyCard';
import {
  HeroSkeleton,
  ChipsSkeleton,
  TopRankingSkeleton,
  SponsoredSkeleton,
  GridSkeleton,
} from '@/components/categories/SkeletonLoaders';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { trackCategorySelected } from '@/lib/analytics/consolidated';
import { track } from '@/lib/analytics/lazy';
import { Banner, Category, Company } from '@/lib/api';
import { openQuoteWizard } from '@/lib/quote-wizard';
import { useDebounce } from '@/hooks/useDebounce';

type CategoryBanner = Banner & { company_id?: number };
type SidebarFilterValue = string | number | boolean | undefined;

interface CategoryPageClientProps {
  initialCategory: Category;
  initialCompanies: Company[];
  initialBanners: CategoryBanner[];
  paginationMeta: unknown;
}

const QUICK_FILTER_CHIPS = [
  { id: 'verified', label: 'Verificadas' },
  { id: 'rated', label: 'Nota +4.5' },
  { id: 'my_state', label: 'Meu Estado' },
  { id: 'industrial', label: 'Industrial' },
];

export default function CategoryPageClient({
  initialCategory,
  initialCompanies,
  initialBanners,
  paginationMeta: _paginationMeta,
}: CategoryPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const slug = initialCategory?.slug || '';
  const categoryName = initialCategory?.name || '';
  const categoryId = initialCategory?.id || '';

  // Initialise from URL params so filters are shareable / survive back-navigation
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [activeQuickFilters, setActiveQuickFilters] = useState<Set<string>>(() => {
    const raw = searchParams.get('chips');
    return raw ? new Set(raw.split(',').filter(Boolean)) : new Set();
  });
  const [sidebarFilters, setSidebarFilters] = useState(() => ({
    verified: searchParams.get('verified') === 'true',
    minRating: parseFloat(searchParams.get('min_rating') || '0') || 0,
    state: searchParams.get('state') || '',
    projectType: searchParams.get('project_type') || undefined,
  }));
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'rating_desc');
  const isLoading = false;

  // Helper: sync filter state to URL without full navigation
  const syncToUrl = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '' || value === 'false' || value === '0') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  // Sync search term to URL after debounce
  useEffect(() => {
    syncToUrl({ search: debouncedSearchTerm || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm]);

  // Track page view / category selected on mount
  useEffect(() => {
    if (slug && categoryId) {
      trackCategorySelected(categoryId, slug, {
        category_name: categoryName,
        source: searchParams.get('source') || 'direct',
      });
    }
  }, [slug, categoryId, categoryName, searchParams]);

  // Estado de busca e filtros
  const filteredCompanies = useMemo(() => {
    let result = [...initialCompanies];

    // Busca por nome
    if (debouncedSearchTerm) {
      result = result.filter((c) =>
        c.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Mapeamento robusto para lidar com singular/plural e variações do banco/API
    const mappedTypes: Record<string, string[]> = {
      Residencial: ['residencial', 'residenciais'],
      Comercial: ['comercial', 'comerciais'],
      Industrial: ['industrial', 'industriais'],
      Agronegócio: ['rural', 'rurais', 'rural/agro', 'agronegócio', 'agronegócios'],
    };

    const matchProjectType = (c: Company, type: string) => {
      const searchTerms = mappedTypes[type] || [type.toLowerCase()];
      return (
        c.project_types?.some((pt) => searchTerms.includes(pt.toLowerCase())) ||
        c.services_offered?.some((so) => searchTerms.includes(so.toLowerCase())) ||
        searchTerms.some((term) => c.description?.toLowerCase().includes(term))
      );
    };

    // Filtros rápidos
    if (activeQuickFilters.has('verified')) {
      result = result.filter((c) => c.verified);
    }
    if (activeQuickFilters.has('rated')) {
      result = result.filter((c) => (Number(c.rating_avg) || 0) >= 4.5);
    }
    if (activeQuickFilters.has('industrial')) {
      const industrialTerms = ['industrial', 'industriais'];
      result = result.filter(
        (c) =>
          c.project_types?.some((pt) => industrialTerms.includes(pt.toLowerCase())) ||
          c.services_offered?.some((so) => industrialTerms.includes(so.toLowerCase()))
      );
    }
    if (activeQuickFilters.has('my_state') && sidebarFilters.state) {
      result = result.filter(
        (c) => c.state?.trim().toUpperCase() === sidebarFilters.state.trim().toUpperCase()
      );
    }

    // Filtros sidebar
    if (sidebarFilters.verified) {
      result = result.filter((c) => c.verified);
    }
    if (sidebarFilters.minRating > 0) {
      result = result.filter((c) => (Number(c.rating_avg) || 0) >= sidebarFilters.minRating);
    }
    if (sidebarFilters.state) {
      result = result.filter(
        (c) => c.state?.trim().toUpperCase() === sidebarFilters.state.trim().toUpperCase()
      );
    }
    if (sidebarFilters.projectType) {
      result = result.filter((c) => matchProjectType(c, sidebarFilters.projectType!));
    }

    // Ordenação
    switch (sortBy) {
      case 'name_asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'rating_desc':
        result.sort((a, b) => (Number(b.rating_avg) || 0) - (Number(a.rating_avg) || 0));
        break;
      case 'reviews_desc':
        result.sort((a, b) => (Number(b.rating_count) || 0) - (Number(a.rating_count) || 0));
        break;
    }

    return result;
  }, [initialCompanies, debouncedSearchTerm, activeQuickFilters, sidebarFilters, sortBy]);

  const handleQuickFilterToggle = (filterId: string) => {
    track('quick_filter_click', {
      filter_name: filterId,
      state: activeQuickFilters.has(filterId) ? 'off' : 'on',
    });

    const newFilters = new Set(activeQuickFilters);
    if (newFilters.has(filterId)) {
      newFilters.delete(filterId);
    } else {
      newFilters.add(filterId);
    }
    setActiveQuickFilters(newFilters);
    syncToUrl({ chips: newFilters.size > 0 ? Array.from(newFilters).join(',') : undefined });
  };

  const handleSidebarFilterChange = (key: string, value: SidebarFilterValue) => {
    setSidebarFilters((prev) => ({ ...prev, [key]: value }));
    const urlKey: Record<string, string> = {
      verified: 'verified',
      minRating: 'min_rating',
      state: 'state',
      projectType: 'project_type',
    };
    if (urlKey[key]) {
      syncToUrl({
        [urlKey[key]]:
          value === undefined || value === false || value === 0 || value === ''
            ? undefined
            : String(value),
      });
    }
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    syncToUrl({ sort: value === 'rating_desc' ? undefined : value });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setActiveQuickFilters(new Set());
    setSidebarFilters({ verified: false, minRating: 0, state: '', projectType: undefined });
    setSortBy('rating_desc');
    syncToUrl({
      search: undefined,
      chips: undefined,
      verified: undefined,
      min_rating: undefined,
      state: undefined,
      project_type: undefined,
      sort: undefined,
    });
  };

  const hasActiveFilters = Boolean(
    searchTerm ||
    activeQuickFilters.size > 0 ||
    sidebarFilters.verified ||
    sidebarFilters.minRating > 0 ||
    sidebarFilters.state ||
    sidebarFilters.projectType
  );

  const quickFilterChips = QUICK_FILTER_CHIPS.map((chip) => ({
    id: chip.id,
    label: chip.label,
    active: activeQuickFilters.has(chip.id),
    removable: true,
  }));

  return (
    <div className="min-h-screen bg-white">
      {isLoading ? (
        <>
          <HeroSkeleton />
          <ChipsSkeleton />
          <div className="container mx-auto px-6 py-10">
            <div className="flex gap-8">
              <div className="hidden lg:block w-64 h-screen" />
              <div className="flex-1 space-y-10">
                <TopRankingSkeleton />
                <SponsoredSkeleton />
                <GridSkeleton />
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Hero - Full width header (Agora Integrado com Banners) */}
          <CategoryHero
            name={categoryName}
            description={
              initialCategory?.short_description || initialCategory?.description || undefined
            }
            bannerUrl={initialCategory?.banner_url}
            parentCategory={initialCategory?.parent}
            subcategories={initialCategory?.subcategories}
            banners={initialBanners.filter((b) => b.position === 'categories_top' || !b.position)}
            onLeadClick={() => {
              track('lead_open_internal', {
                company_id: 0,
                placement: 'hero',
                category: slug,
              });
              openQuoteWizard({ source: 'category-hero' });
            }}
            onMethodologyClick={() =>
              track('category_methodology_click', { category: slug, placement: 'hero' })
            }
          />

          <CategoryNichesCarousel niches={initialCategory?.subcategories || []} />

          <DecisionChips
            chips={quickFilterChips}
            onChipToggle={handleQuickFilterToggle}
            onChipRemove={handleQuickFilterToggle}
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
          />

          {/* Main Layout Container */}
          <div className="max-w-[1280px] mx-auto px-4 py-2 sm:px-6 md:py-8">
            <div className="space-y-12">
              
              {/* 🏆 Section 1: Featured Companies (Empresas em Destaque) */}
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                      Empresas em destaque
                    </h2>
                  </div>
                  <Link
                    href="/categories"
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-1"
                  >
                    Ver todas as empresas em destaque →
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {(initialCompanies
                    .filter((c) => {
                      const sponsoredCompany = c as Company & { sponsored?: boolean };
                      return (
                        sponsoredCompany.sponsored ||
                        initialBanners.some((b) => b.company_id === c.id)
                      );
                    })
                    .slice(0, 4).length > 0 
                      ? initialCompanies.filter((c) => {
                          const sponsoredCompany = c as Company & { sponsored?: boolean };
                          return sponsoredCompany.sponsored || initialBanners.some((b) => b.company_id === c.id);
                        }).slice(0, 4)
                      : initialCompanies.slice(0, 4)
                  ).map((company, index) => (
                    <FeaturedCompanyCard
                      key={company.id}
                      company={company}
                      category={slug}
                      isFirst={index === 0}
                    />
                  ))}
                </div>
              </section>

              {/* Toolbar & Listing Table */}
              <div className="space-y-6">
                {/* Search and Sort Toolbar */}
                <div className="sticky top-24 z-10 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full sm:max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        aria-label="Buscar empresas nesta categoria"
                        placeholder="Buscar empresas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-11 rounded-xl border-slate-200 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <Select value={sortBy} onValueChange={handleSortChange}>
                        <SelectTrigger
                          aria-label="Ordenar empresas"
                          className="w-full sm:w-[200px] h-11 rounded-xl border-slate-200"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="rating_desc">Melhor Avaliação</SelectItem>
                          <SelectItem value="reviews_desc">Mais Avaliadas</SelectItem>
                          <SelectItem value="name_asc">A-Z</SelectItem>
                        </SelectContent>
                      </Select>

                      {hasActiveFilters && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleClearFilters}
                          aria-label="Limpar filtros da categoria"
                          className="h-11 w-11 shrink-0 rounded-xl border-slate-200 text-slate-500 hover:text-red-600"
                          title="Limpar filtros"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 📋 Section 2: More Companies Table */}
                <CategoryCompaniesTable companies={filteredCompanies} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
