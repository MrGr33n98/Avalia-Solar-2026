'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import CategoryHero from '@/components/categories/CategoryHero';
import DecisionChips from '@/components/categories/DecisionChips';
import CategoryFilterSidebar from '@/components/categories/CategoryFilterSidebar';
import CompaniesGrid from '@/components/categories/CompaniesGrid';
import TopRankingSection from '@/components/categories/TopRankingSection';
import SponsoredSection from '@/components/categories/SponsoredSection';
import LeadModalInternal from '@/components/categories/LeadModalInternal';
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
import { Search, Filter } from 'lucide-react';
import { track } from '@/lib/analytics/lazy';

interface Company {
  id: number;
  name: string;
  logo_url?: string;
  banner_url?: string;
  rating?: number;
  rating_count?: number;
  verified?: boolean;
  segment?: string;
  direct_lead_enabled?: boolean;
  direct_lead_url?: string;
}

interface CategoryPageClientProps {
  categoryName: string;
  companiesCount: number;
  reviewsCount: number;
  verifiedPct: number;
  companies: Company[];
  slug: string;
}

const QUICK_FILTER_CHIPS = [
  { id: 'verified', label: 'Verificadas' },
  { id: 'rated', label: 'Nota +4.5' },
  { id: 'my_state', label: 'Meu Estado' },
  { id: 'industrial', label: 'Industrial' },
];

export default function CategoryPageClient({
  categoryName,
  companiesCount,
  reviewsCount,
  verifiedPct,
  companies: initialCompanies,
  slug,
}: CategoryPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

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
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [selectedCompanyForLead, setSelectedCompanyForLead] = useState<Company | null>(null);
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
    let result = initialCompanies;

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

  const hasActiveFilters =
    searchTerm ||
    activeQuickFilters.size > 0 ||
    sidebarFilters.verified ||
    sidebarFilters.minRating > 0 ||
    sidebarFilters.state;

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
          <TopRankingSkeleton />
          <SponsoredSkeleton />
          <div className="container mx-auto px-4 py-8">
            <GridSkeleton />
          </div>
        </>
      ) : (
        <>
          {/* Hero */}
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
            }}
            onMethodologyClick={() => console.log('Methodology modal')}
          />

          {/* Decision Chips */}
          <DecisionChips
            chips={quickFilterChips}
            onChipToggle={handleQuickFilterToggle}
            onChipRemove={handleQuickFilterToggle}
          />

          {/* Top Ranking */}
          <TopRankingSection
            companies={filteredCompanies.slice(0, 3)}
            category={slug}
            onLeadModalOpen={(company) => {
              setSelectedCompanyForLead(company);
              setLeadModalOpen(true);
            }}
            onMethodologyClick={() => console.log('Methodology')}
          />

          {/* Sponsored */}
          <SponsoredSection
            companies={initialCompanies
              .filter((c) => Math.random() > 0.7) // Demo: random companies as sponsored
              .slice(0, 4)}
            category={slug}
            onLeadModalOpen={(company) => {
              setSelectedCompanyForLead(company);
              setLeadModalOpen(true);
            }}
          />

          {/* Main Content */}
          <div className="py-8">
            <div className="container mx-auto px-4">
              <div className="flex gap-6">
                {/* Sidebar */}
                <CategoryFilterSidebar
                  filters={sidebarFilters}
                  onFilterChange={handleSidebarFilterChange}
                  onClearFilters={handleClearFilters}
                  hasActiveFilters={hasActiveFilters}
                />

                {/* Main */}
                <main className="flex-1">
                  {/* Toolbar */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 sticky top-20 z-10">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                      <div className="relative w-full sm:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="Buscar empresas..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9"
                        />
                      </div>

                      <div className="flex gap-2 w-full sm:w-auto">
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rating_desc">Melhor Avaliação</SelectItem>
                            <SelectItem value="reviews_desc">Mais Avaliadas</SelectItem>
                            <SelectItem value="name_asc">A-Z</SelectItem>
                          </SelectContent>
                        </Select>

                        {hasActiveFilters && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClearFilters}
                          >
                            <Filter className="w-4 h-4 mr-1" />
                            Limpar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Grid */}
                  <div>
                    <h2 className="text-xl font-bold text-slate-950 mb-4">
                      {hasActiveFilters ? 'Resultados Filtrados' : 'Todas as Empresas'}
                      <span className="text-sm font-normal text-slate-500 ml-2">
                        ({filteredCompanies.length})
                      </span>
                    </h2>
                    <CompaniesGrid
                      companies={filteredCompanies}
                      category={slug}
                      onLeadModalOpen={(company) => {
                        setSelectedCompanyForLead(company);
                        setLeadModalOpen(true);
                      }}
                    />
                  </div>
                </main>
              </div>
            </div>
          </div>

          {/* Lead Modal */}
          {selectedCompanyForLead && (
            <LeadModalInternal
              company={selectedCompanyForLead}
              category={slug}
              open={leadModalOpen}
              onOpenChange={setLeadModalOpen}
            />
          )}
        </>
      )}
    </div>
  );
}
