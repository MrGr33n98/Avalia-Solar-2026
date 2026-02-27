'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CategoryHero from '@/components/categories/CategoryHero';
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
import { track } from '@/lib/analytics/lazy';
import { Company } from '@/lib/api';
import { openLeadModal } from '@/lib/lead-engine';

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
  const companiesCount = initialCategory?.companies_count || initialCompanies.length;
  const reviewsCount = initialCategory?.reviews_count || 0;
  const verifiedPct = initialCategory?.verified_pct || 0;

  // Estado de busca e filtros
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'rating_desc');
  const [activeQuickFilters, setActiveQuickFilters] = useState<Set<string>>(
    new Set(searchParams.get('filters')?.split(',') || [])
  );
  const [sidebarFilters, setSidebarFilters] = useState({
    verified: searchParams.get('verified') === 'true',
    minRating: searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : 0,
    state: searchParams.get('state') || '',
  });
  const [isLoading] = useState(false);

  // Track page view
  const trackPageView = useCallback(() => {
    track('category_page_view', {
      category: slug,
      filters_applied: Array.from(activeQuickFilters).join(','),
    });
  }, [slug, activeQuickFilters]);

  // Aplicar filtros
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
      result = result.filter((c) => (c.rating || 0) >= 4.5);
    }

    // Filtros sidebar
    if (sidebarFilters.verified) {
      result = result.filter((c) => c.verified);
    }
    if (sidebarFilters.minRating > 0) {
      result = result.filter((c) => (c.rating || 0) >= sidebarFilters.minRating);
    }

    // Ordenação
    switch (sortBy) {
      case 'name_asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'rating_desc':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
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
  };

  const handleSidebarFilterChange = (key: string, value: any) => {
    setSidebarFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setActiveQuickFilters(new Set());
    setSidebarFilters({ verified: false, minRating: 0, state: '' });
    setSortBy('rating_desc');
  };

  const hasActiveFilters = Boolean(
    searchTerm ||
    activeQuickFilters.size > 0 ||
    sidebarFilters.verified ||
    sidebarFilters.minRating > 0 ||
    sidebarFilters.state
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
          {/* Hero - Full width header */}
          <CategoryHero
            name={categoryName}
            companiesCount={companiesCount}
            reviewsCount={reviewsCount}
            verifiedPct={verifiedPct}
            onLeadClick={() => {
              track('lead_open_internal', {
                company_id: 0,
                placement: 'hero',
                category: slug,
              });
              openLeadModal({ source: 'category-hero', type: 'quick' });
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
          <div className="max-w-[1280px] mx-auto px-6 py-10">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              
              {/* Sidebar - Fixed width 280px */}
              <CategoryFilterSidebar
                filters={sidebarFilters}
                onFilterChange={handleSidebarFilterChange}
                onClearFilters={handleClearFilters}
                hasActiveFilters={hasActiveFilters}
              />

              {/* Content Column - Fluid */}
              <main className="flex-1 w-full space-y-10">
                
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
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9 h-11 rounded-xl border-slate-200 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex gap-2 w-full sm:w-auto">
                        <Select value={sortBy} onValueChange={setSortBy}>
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
