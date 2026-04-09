'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CategoryHero from '@/components/categories/CategoryHero';
import BannerByLocation from '@/components/BannerByLocation';
import DecisionChips from '@/components/categories/DecisionChips';
import CategoryFilterSidebar from '@/components/categories/CategoryFilterSidebar';
import CompaniesGrid from '@/components/categories/CompaniesGrid';
import TopRankingSection from '@/components/categories/TopRankingSection';
import SponsoredSection from '@/components/categories/SponsoredSection';
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
import { Search, Filter, X } from 'lucide-react';
import { trackCategorySelected } from '@/lib/analytics/consolidated';
import { track } from '@/lib/analytics/lazy';
import { Company } from '@/lib/api';
import { openQuoteWizard } from '@/lib/quote-wizard';

interface CategoryPageClientProps {
  initialCategory: any;
  initialCompanies: Company[];
  initialBanners: any[];
  paginationMeta: any;
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
  paginationMeta,
}: CategoryPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const slug = initialCategory?.slug || '';
  const categoryName = initialCategory?.name || '';
  const categoryId = initialCategory?.id || '';

  // Initialise from URL params so filters are shareable / survive back-navigation
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
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
  const syncToUrl = useCallback((updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === 'false' || value === '0') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

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
    if (searchTerm) {
      result = result.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtros rápidos
    if (activeQuickFilters.has('verified')) {
      result = result.filter((c) => c.verified);
    }
    if (activeQuickFilters.has('rated')) {
      result = result.filter((c) => (c.rating_avg || 0) >= 4.5);
    }
    if (activeQuickFilters.has('industrial')) {
      result = result.filter(
        (c) =>
          c.project_types?.includes('Industrial') ||
          c.services_offered?.includes('Industrial')
      );
    }
    if (activeQuickFilters.has('my_state') && sidebarFilters.state) {
      result = result.filter((c) => c.state === sidebarFilters.state);
    }

    // Filtros sidebar
    if (sidebarFilters.verified) {
      result = result.filter((c) => c.verified);
    }
    if (sidebarFilters.minRating > 0) {
      result = result.filter((c) => (c.rating_avg || 0) >= sidebarFilters.minRating);
    }
    if (sidebarFilters.state) {
      result = result.filter((c) => c.state === sidebarFilters.state);
    }
    if (sidebarFilters.projectType) {
      result = result.filter((c) =>
        c.project_types?.includes(sidebarFilters.projectType!) ||
        c.services_offered?.includes(sidebarFilters.projectType!) ||
        c.description?.toLowerCase().includes(sidebarFilters.projectType!.toLowerCase())
      );
    }

    // Ordenação
    switch (sortBy) {
      case 'name_asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'rating_desc':
        result.sort((a, b) => (b.rating_avg || 0) - (a.rating_avg || 0));
        break;
      case 'reviews_desc':
        result.sort((a, b) => (b.rating_count || 0) - (a.rating_count || 0));
        break;
    }

    return result;
  }, [initialCompanies, searchTerm, activeQuickFilters, sidebarFilters, sortBy]);

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

  const handleSidebarFilterChange = (key: string, value: any) => {
    setSidebarFilters((prev) => ({ ...prev, [key]: value }));
    const urlKey: Record<string, string> = {
      verified: 'verified',
      minRating: 'min_rating',
      state: 'state',
      projectType: 'project_type',
    };
    if (urlKey[key]) {
      syncToUrl({ [urlKey[key]]: value === undefined || value === false || value === 0 || value === '' ? undefined : String(value) });
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
    syncToUrl({ search: undefined, chips: undefined, verified: undefined, min_rating: undefined, state: undefined, project_type: undefined, sort: undefined });
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
              initialCategory?.short_description ||
              initialCategory?.description ||
              undefined
            }
            bannerUrl={initialCategory?.banner_url}
            parentCategory={initialCategory?.parent}
            subcategories={initialCategory?.subcategories}
            banners={initialBanners}
            onLeadClick={() => {
              track('lead_open_internal', {
                company_id: 0,
                placement: 'hero',
                category: slug,
              });
              openQuoteWizard({ source: 'category-hero' });
            }}
            onMethodologyClick={() => console.log('Methodology modal')}
          />

          {/* Decision Chips - Full width contextual helper */}
          <div className="border-b border-slate-100 bg-slate-50/30">
            <DecisionChips
              chips={quickFilterChips}
              onChipToggle={handleQuickFilterToggle}
              onChipRemove={handleQuickFilterToggle}
            />
          </div>

          {/* Main Layout Container */}
          <div className="max-w-[1280px] mx-auto px-6 py-6 md:py-7">
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              
              {/* Sidebar - Fixed width 280px */}
              <CategoryFilterSidebar
                filters={sidebarFilters}
                onFilterChange={handleSidebarFilterChange}
                onClearFilters={handleClearFilters}
                hasActiveFilters={hasActiveFilters}
              />

              {/* Content Column - Fluid */}
              <main className="flex-1 w-full space-y-7 md:space-y-8">
                
                {/* 🏆 Top Ranking Section - Inside the column */}
                {!hasActiveFilters && filteredCompanies.length > 0 && (
                  <TopRankingSection
                    companies={filteredCompanies.slice(0, 3)}
                    category={slug}
                    onMethodologyClick={() => console.log('Methodology')}
                  />
                )}

                {/* ✨ Sponsored Section - Inside the column */}
                <SponsoredSection
                  companies={initialCompanies
                    .filter((c) => (c as any).sponsored || initialBanners.some((b: any) => b.company_id === c.id))
                    .slice(0, 4)}
                  category={slug}
                />

                {/* Toolbar & Grid */}
                <div className="space-y-6">
                  {/* Toolbar */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm sticky top-24 z-10">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                      <div className="relative w-full sm:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="Buscar empresas..."
                          value={searchTerm}
                          onChange={(e) => { setSearchTerm(e.target.value); syncToUrl({ search: e.target.value || undefined }); }}
                          className="pl-9 h-11 rounded-xl border-slate-200 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex gap-2 w-full sm:w-auto">
                        <Select value={sortBy} onValueChange={handleSortChange}>
                          <SelectTrigger className="w-full sm:w-[200px] h-11 rounded-xl border-slate-200">
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
                            className="h-11 w-11 shrink-0 rounded-xl border-slate-200 text-slate-500 hover:text-red-600"
                            title="Limpar filtros"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Results Header */}
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-xl font-black text-slate-950 uppercase tracking-tight">
                      {hasActiveFilters ? 'Resultados Filtrados' : 'Todas as Empresas'}
                      <span className="text-sm font-bold text-slate-400 ml-2 normal-case">
                        ({filteredCompanies.length})
                      </span>
                    </h2>
                  </div>

                  {/* Companies Grid */}
                  <CompaniesGrid
                    companies={filteredCompanies}
                    category={slug}
                  />
                </div>
              </main>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
