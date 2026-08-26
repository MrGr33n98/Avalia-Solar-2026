'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import CategoryHero from '@/components/categories/CategoryHero';
import CategoryAdsRail from '@/components/categories/CategoryAdsRail';
import { cn } from '@/lib/utils';
import DecisionChips from '@/components/categories/DecisionChips';
import CategoryFiltersPanel, {
  CategoryFilterValue,
  CategoryFilters,
} from '@/components/categories/CategoryFiltersPanel';
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

interface CategoryPageClientProps {
  initialCategory: Category;
  initialCompanies: Company[];
  initialBanners: CategoryBanner[];
  paginationMeta: unknown;
}

export default function CategoryPageClient({
  initialCategory,
  initialCompanies,
  initialBanners,
  paginationMeta: _paginationMeta,
}: CategoryPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const slug = initialCategory?.slug || '';
  const categoryName = initialCategory?.name || '';
  const categoryId = initialCategory?.id || '';

  // Initialise from URL params so filters are shareable / survive back-navigation
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [sidebarFilters, setSidebarFilters] = useState<CategoryFilters>(() => ({
    verified: searchParams.get('verified') === 'true',
    minRating: parseFloat(searchParams.get('min_rating') || '0') || 0,
    state: searchParams.get('state') || '',
    projectType: searchParams.get('project_type') || undefined,
  }));
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'rating_desc');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<CategoryFilters>(sidebarFilters);
  const isLoading = false;

  const [hasBanners, setHasBanners] = useState(false);

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
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
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
    const result = [...initialCompanies];

    // O backend é a fonte de verdade para filtros, busca, paginação e ordenação.
    // Mantemos apenas os dados recebidos pela página atual durante a transição SSR.
    return result;
  }, [initialCompanies]);

  const trackFilterEvent = useCallback(
    (eventName: string, filtersCount: number) => {
      track(eventName, {
        category_slug: slug,
        viewport:
          typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
            ? 'desktop'
            : 'mobile',
        active_filters_count: filtersCount,
      });
    },
    [slug]
  );

  const handleSidebarFilterChange = (key: string, value: CategoryFilterValue) => {
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

  const openFilters = () => {
    setDraftFilters(sidebarFilters);
    setMobileFiltersOpen(true);
    trackFilterEvent('category_filters_opened', activeFiltersCount);
  };

  const applyPanelFilters = (nextFilters: CategoryFilters) => {
    setSidebarFilters(nextFilters);
    syncToUrl({
      verified: nextFilters.verified ? 'true' : undefined,
      min_rating: nextFilters.minRating > 0 ? String(nextFilters.minRating) : undefined,
      state: nextFilters.state || undefined,
      project_type: nextFilters.projectType || undefined,
    });
    const nextCount = [
      nextFilters.verified,
      nextFilters.minRating > 0,
      nextFilters.state,
      nextFilters.projectType,
    ].filter(Boolean).length;
    trackFilterEvent('category_filters_applied', nextCount);
    setMobileFiltersOpen(false);
  };

  const handlePanelChange = (key: keyof CategoryFilters, value: CategoryFilterValue) => {
    const nextFilters = { ...draftFilters, [key]: value } as CategoryFilters;
    setDraftFilters(nextFilters);
    const nextCount = [
      nextFilters.verified,
      nextFilters.minRating > 0,
      nextFilters.state,
      nextFilters.projectType,
    ].filter(Boolean).length;
    trackFilterEvent('category_filter_changed', nextCount);
  };

  const clearPanelFilters = () => {
    const clearedFilters: CategoryFilters = {
      verified: false,
      minRating: 0,
      state: '',
      projectType: undefined,
    };
    setDraftFilters(clearedFilters);
    trackFilterEvent('category_filters_cleared', 0);
  };

  const closeFilters = () => {
    setMobileFiltersOpen(false);
    trackFilterEvent('category_filters_closed', activeFiltersCount);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    syncToUrl({ sort: value === 'rating_desc' ? undefined : value });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSidebarFilters({ verified: false, minRating: 0, state: '', projectType: undefined });
    setSortBy('rating_desc');
    syncToUrl({
      search: undefined,
      verified: undefined,
      min_rating: undefined,
      state: undefined,
      project_type: undefined,
      sort: undefined,
    });
  };

  const hasActiveFilters = Boolean(
    searchTerm ||
    sidebarFilters.verified ||
    sidebarFilters.minRating > 0 ||
    sidebarFilters.state ||
    sidebarFilters.projectType
  );

  const activeFiltersCount = [
    sidebarFilters.verified,
    sidebarFilters.minRating > 0,
    sidebarFilters.state,
    sidebarFilters.projectType,
  ].filter(Boolean).length;

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
          {/* Hero - Full width header (Agora Integrado com Banners e Carrossel Unificado) */}
          <CategoryHero
            name={categoryName}
            slug={initialCategory?.slug || initialCategory?.seo_url}
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

          <nav aria-label="Navegação da categoria" className="mx-auto flex max-w-[1280px] gap-2 overflow-x-auto px-4 py-3 sm:px-6">
            {[
              ['Empresas', `/categories/${slug}`],
              ['Sobre a categoria', `/categories/${slug}/about`],
              ['Tipos de soluções', `/categories/${slug}/solutions`],
              ['Comparar soluções', `/categories/${slug}/compare`],
              ['Guias e conteúdo', `/categories/${slug}/guides`],
              ['Avaliações', `/categories/${slug}/reviews`],
              ['Empresas para seu projeto', `/categories/${slug}/matching`],
            ].map(([label, href]) => (
              <Link key={href} href={href} className="min-h-11 shrink-0 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700">
                {label}
              </Link>
            ))}
          </nav>

          <CategoryNichesCarousel niches={initialCategory?.subcategories || []} />

          <DecisionChips
            filters={sidebarFilters}
            onFilterChange={handleSidebarFilterChange}
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
            onOpenMoreFilters={openFilters}
            activeFiltersCount={activeFiltersCount}
            moreFiltersOpen={mobileFiltersOpen}
          />

          <CategoryFiltersPanel
            open={mobileFiltersOpen}
            filters={draftFilters}
            resultCount={initialCompanies.length}
            onChange={handlePanelChange}
            onApply={() => applyPanelFilters(draftFilters)}
            onClear={clearPanelFilters}
            onClose={closeFilters}
          />



          {/* Main Layout Container */}
          <div className="max-w-[1280px] mx-auto px-4 py-2 sm:px-6 md:py-8">
            <div className={cn(
              "grid items-start gap-8",
              hasBanners ? "lg:grid-cols-[minmax(0,1fr)_300px]" : "grid-cols-1"
            )}>
              <div className="min-w-0 space-y-12">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
                    {(initialCompanies
                      .filter((c) => {
                        const sponsoredCompany = c as Company & { sponsored?: boolean };
                        return (
                          sponsoredCompany.sponsored ||
                          initialBanners.some((b) => b.company_id === c.id)
                        );
                      })
                      .slice(0, 4).length > 0
                      ? initialCompanies
                          .filter((c) => {
                            const sponsoredCompany = c as Company & { sponsored?: boolean };
                            return (
                              sponsoredCompany.sponsored ||
                              initialBanners.some((b) => b.company_id === c.id)
                            );
                          })
                          .slice(0, 4)
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

              <CategoryAdsRail
                categoryId={categoryId}
                initialFilterBanners={initialBanners.filter((b) => b.position === 'categories_filter_sidebar')}
                initialRightRailBanners={initialBanners.filter(
                  (b) => b.position === 'categories_right_rail' || b.position === 'sidebar'
                )}
                onHasBannersChange={setHasBanners}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
