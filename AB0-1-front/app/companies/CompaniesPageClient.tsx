'use client';

import { useEffect, useMemo, useState, useRef, Suspense, useCallback } from 'react';

import { Search, Grid, List, Map as MapIcon, ChevronLeft, ChevronRight, MapPin, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import CompanyCard from '@/components/CompanyCard';
import SearchMapPanel from '@/components/search/SearchMapPanel';
import type { MapCompany } from '@/components/search/MapProvider';
import { companiesApiSafe, type Company } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import BannerByLocation from '@/components/BannerByLocation';
import { cn } from '@/lib/utils';
import { FilterSidebar } from '@/components/filters/FilterSidebar';
import { parseQueryParams, stringifyQueryParams } from '@/components/filters/query';
import { ActiveFiltersSummary } from '@/components/filters/ActiveFiltersSummary';
import { CompanyFilters, DEFAULT_FILTERS } from '@/components/filters/types';
import MobileCompanyFilterBar from '@/components/companies/filters/MobileCompanyFilterBar';
import MobileCompanyFiltersSheet from '@/components/companies/filters/MobileCompanyFiltersSheet';
import { useCompanyGeolocation } from '@/hooks/useCompanyGeolocation';
import { CompanyCategoryPicker } from '@/components/companies/filters/CompanyCategoryPicker';
import {
  buildCompaniesCategoriesPath,
  COMPANIES_PATH,
  extractCategoryIdsFromPath,
  extractCategorySlugByIdFromPath,
  isCompaniesCategoriesPath,
} from '@/lib/seo/companies-category-url';
import { useDebounce } from '@/hooks/useDebounce';
import { usePageTracking } from '@/hooks/usePageTracking';
import { track } from '@/lib/analytics/consolidated';
import { useComparison } from '@/hooks/useComparison';
import { openComparisonDock } from '@/lib/floating-widget-events';

interface CompaniesPageClientProps {
  forcedCategoryIds?: number[];
  categoryNames?: string[];
  canonicalPath?: string;
}

type CompaniesContentProps = CompaniesPageClientProps;
const EMPTY_CATEGORY_IDS: number[] = [];

export function CompaniesContent({
  forcedCategoryIds,
  categoryNames = [],
  canonicalPath,
}: CompaniesContentProps) {
  usePageTracking({
    type: 'category',
    title: 'Empresas de Energia Solar - Avalia Solar',
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParamsKey = searchParams.toString();
  const activeForcedCategoryIds = forcedCategoryIds ?? EMPTY_CATEGORY_IDS;
  const pathCategoryIds = useMemo(
    () =>
      activeForcedCategoryIds.length > 0
        ? activeForcedCategoryIds
        : extractCategoryIdsFromPath(pathname),
    [activeForcedCategoryIds, pathname]
  );
  const pathSlugById = useMemo(() => extractCategorySlugByIdFromPath(pathname), [pathname]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [totalCount, setTotalCount] = useState(0);
  const [showMobileLocationGate, setShowMobileLocationGate] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const { detectingGps: detectingLocation, gpsError, getCoordinates } = useCompanyGeolocation();
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const { comparisonList, toggleComparison, canAddMore, isInComparison } = useComparison();

  const handleToggleVerified = () => {
    const updated = { ...filters, verified: !filters.verified, page: 1 };
    router.replace(buildTargetUrl(updated), { scroll: false });
  };

  const handleApplyFilters = (nextFilters: CompanyFilters) => {
    const normalized = {
      ...nextFilters,
      page: 1
    };
    const targetUrl = buildTargetUrl(normalized);
    router.replace(targetUrl, { scroll: false });
    setIsFiltersOpen(false);
  };
  const PAGE_SIZE = 12;

  const filters = useMemo(
    () => parseQueryParams(new URLSearchParams(searchParamsKey), { pathCategoryIds }),
    [searchParamsKey, pathCategoryIds]
  );
  const categoryLabel = useMemo(() => {
    if (filters.category_ids.length === 0) return 'Categoria';
    if (categoryNames.length > 0) return categoryNames.slice(0, 2).join(', ');
    return `${filters.category_ids.length} categorias`;
  }, [categoryNames, filters.category_ids]);
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const debouncedSearchInput = useDebounce(searchInput, 400);
  const requestParams = useMemo(
    () => ({
      status: 'active' as const,
      page: filters.page || 1,
      per_page: viewMode === 'map' ? 100 : PAGE_SIZE,
      q: filters.search || undefined,
      state: filters.state.length > 0 ? filters.state : undefined,
      city: filters.city.length > 0 ? filters.city : undefined,
      category_ids: filters.category_ids.length > 0 ? filters.category_ids : undefined,
      min_rating: filters.min_rating || undefined,
      has_reviews: filters.has_reviews || undefined,
      verified: filters.verified || undefined,
      featured: filters.featured || undefined,
      financing_enabled: filters.financing_enabled || undefined,
      whatsapp_enabled: filters.whatsapp_enabled || undefined,
      sort: filters.sort || undefined,
      latitude: filters.lat || undefined,
      longitude: filters.lng || undefined,
      radius_km: filters.radius_km || undefined,
      fields: viewMode === 'map' ? ('map' as const) : ('card' as const),
    }),
    [
      filters.page,
      filters.search,
      filters.state,
      filters.city,
      filters.category_ids,
      filters.min_rating,
      filters.verified,
      filters.featured,
      filters.financing_enabled,
      filters.whatsapp_enabled,
      filters.sort,
      filters.lat,
      filters.lng,
      filters.radius_km,
      filters.has_reviews,
      viewMode,
    ]
  );

  const buildTargetUrl = useCallback((nextFilters: CompanyFilters): string => {
    const sortedCategoryIds = [...nextFilters.category_ids].sort((a, b) => a - b);
    const hasPathCategories = isCompaniesCategoriesPath(pathname);

    if (sortedCategoryIds.length > 0 && hasPathCategories) {
      const nextPath = buildCompaniesCategoriesPath(sortedCategoryIds, {}, pathSlugById);
      const queryString = stringifyQueryParams(nextFilters, { omitCategoryIds: true });
      return `${nextPath}${queryString ? `?${queryString}` : ''}`;
    }

    const queryString = stringifyQueryParams(nextFilters);
    return `${COMPANIES_PATH}${queryString ? `?${queryString}` : ''}`;
  }, [pathSlugById, pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = { ...filters, search: searchInput, page: 1 };
    router.replace(buildTargetUrl(updated), { scroll: false });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (filters.state.length > 0 || filters.city.length > 0 || filters.lat || filters.lng) {
      setShowMobileLocationGate(false);
      return;
    }

    const dismissedAt = Number(localStorage.getItem('avalia.location_gate.dismissed_at') || 0);
    const dismissedRecently = Date.now() - dismissedAt < 1000 * 60 * 60 * 24 * 7;
    setShowMobileLocationGate(!dismissedRecently);
  }, [filters.city.length, filters.lat, filters.lng, filters.state.length]);

  const handleAllowLocation = async () => {
    try {
      const coords = await getCoordinates();
      const updated = {
        ...filters,
        lat: coords.lat,
        lng: coords.lng,
        radius_km: filters.radius_km || 50,
        state: [],
        city: [],
        page: 1,
      };
      localStorage.setItem('avalia.location_gate.dismissed_at', String(Date.now()));
      setShowMobileLocationGate(false);
      track('location_filter_applied', {
        source: 'companies_location_gate',
        radius_km: updated.radius_km,
      });
      router.replace(buildTargetUrl(updated), { scroll: false });
    } catch {
      localStorage.setItem('avalia.location_gate.dismissed_at', String(Date.now()));
      setShowMobileLocationGate(false);
    }
  };

  const handleSkipLocationGate = () => {
    localStorage.setItem('avalia.location_gate.dismissed_at', String(Date.now()));
    setShowMobileLocationGate(false);
  };

  const handleNearMe = async () => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          if (permission.state === 'denied') {
            setIsFiltersOpen(true);
            return;
          }
        } catch (_e) {
          // Ignore unsupported permission query in some browsers
        }
      }

      const coords = await getCoordinates();
      const updated = {
        ...filters,
        lat: coords.lat,
        lng: coords.lng,
        radius_km: filters.radius_km || 50,
        state: [],
        city: [],
        page: 1,
      };
      track('location_filter_applied', {
        source: 'companies_near_me',
        radius_km: updated.radius_km,
      });
      router.replace(buildTargetUrl(updated), { scroll: false });
    } catch (_err) {
      // Fallback: se falhar por permissão negada, timeout ou unsupported, abre o modal
      setIsFiltersOpen(true);
    }
  };

  const locationLabel = useMemo(() => {
    if (filters.lat !== null && filters.lng !== null) {
      return 'Perto de mim';
    }
    const stateVal = filters.state[0];
    const cityVal = filters.city[0];
    if (stateVal && cityVal) {
      return `${cityVal}, ${stateVal}`;
    }
    if (stateVal) {
      return stateVal;
    }
    return 'Perto de mim';
  }, [filters]);

  const removeFilter = (key: keyof CompanyFilters, value?: unknown) => {
    let updated: CompanyFilters;
    if (Array.isArray(filters[key])) {
      const currentArray = filters[key] as unknown[];
      updated = { ...filters, [key]: currentArray.filter((v) => v !== value), page: 1 };
    } else if (typeof filters[key] === 'boolean') {
      updated = { ...filters, [key]: false, page: 1 };
    } else {
      updated = { ...filters, [key]: DEFAULT_FILTERS[key], page: 1 };
    }

    router.replace(buildTargetUrl(updated), { scroll: false });
  };

  useEffect(() => {
    setSearchInput(filters.search || '');
  }, [filters.search]);

  // Auto-search after debounce — no need to press Enter
  useEffect(() => {
    if (debouncedSearchInput === (filters.search || '')) return;
    const updated = { ...filters, search: debouncedSearchInput, page: 1 };
    router.replace(buildTargetUrl(updated), { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchInput]);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await companiesApiSafe.getAllPaginated(requestParams);

        if (!cancelled) {
          setCompanies(response.data || []);
          setTotalCount(response.meta?.pagination?.total || response.data?.length || 0);
        }
      } catch (err) {
        console.error('[Companies] Fetch error:', err);
        const errorMsg = err instanceof Error ? err.message : 'Erro ao carregar empresas';
        const detailedError = `${errorMsg}. Verifique se o backend está rodando em http://localhost:3001`;
        if (!cancelled) {
          setError(detailedError);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [requestParams]);

  // Track filter changes (skip first mount)
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (loading) return;

    const activeFilters: Array<{ filter_key: string; filter_value: unknown }> = [];

    if (requestParams.q)
      activeFilters.push({ filter_key: 'search', filter_value: requestParams.q });
    if (requestParams.state)
      activeFilters.push({ filter_key: 'state', filter_value: requestParams.state });
    if (requestParams.city)
      activeFilters.push({ filter_key: 'city', filter_value: requestParams.city });
    if (requestParams.category_ids)
      activeFilters.push({ filter_key: 'category_ids', filter_value: requestParams.category_ids });
    if (requestParams.min_rating)
      activeFilters.push({ filter_key: 'min_rating', filter_value: requestParams.min_rating });
    if (requestParams.verified)
      activeFilters.push({ filter_key: 'verified', filter_value: requestParams.verified });
    if (requestParams.featured)
      activeFilters.push({ filter_key: 'featured', filter_value: requestParams.featured });
    if (requestParams.sort)
      activeFilters.push({ filter_key: 'sort', filter_value: requestParams.sort });
    if (requestParams.has_reviews)
      activeFilters.push({ filter_key: 'has_reviews', filter_value: requestParams.has_reviews });

    if (activeFilters.length > 0) {
      activeFilters.forEach(({ filter_key, filter_value }) => {
        track('filter_applied', { filter_key, filter_value, page: 'companies' });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestParams]);

  const visibleCompanies = useMemo(() => companies ?? [], [companies]);
  const mapCompanies = useMemo<MapCompany[]>(
    () =>
      visibleCompanies
        .filter((company) => company.latitude != null && company.longitude != null)
        .map((company) => ({
          id: String(company.id),
          name: company.name,
          slug: company.slug || String(company.id),
          latitude: Number(company.latitude),
          longitude: Number(company.longitude),
          ratingAvg: company.rating_avg,
          isSponsored: Boolean(company.featured || company.sponsored),
          city: company.city,
          state: company.state,
          logo_url: company.logo_url || undefined,
          distanceKm: company.distance_km,
          verified: company.verified,
          ratingCount: company.rating_count,
          financingEnabled: company.financing_enabled,
          whatsappEnabled: company.cta_whatsapp_enabled,
        })),
    [visibleCompanies]
  );

  const mapCompareIds = useMemo(
    () => comparisonList.map((company) => String(company.id)),
    [comparisonList]
  );

  useEffect(() => {
    if (viewMode !== 'map') return;

    track('company_map_opened', {
      source: 'list',
      view_mode: 'map',
      result_count: mapCompanies.length,
    });
  }, [mapCompanies.length, viewMode]);

  const handleMapCompare = useCallback(
    (mapCompany: MapCompany) => {
      const company = visibleCompanies.find((item) => String(item.id) === mapCompany.id);
      if (!company) return;
      if (!isInComparison(company.id) && !canAddMore) return;
      const wasSelected = isInComparison(company.id);
      toggleComparison(company);
      track(wasSelected ? 'company_compare_removed' : 'company_compare_added', {
        company_id: company.id,
        source: 'map',
        view_mode: 'map',
      });
      if (!wasSelected) openComparisonDock();
    },
    [canAddMore, isInComparison, toggleComparison, visibleCompanies]
  );

  const handleMapBoundsSearch = useCallback((bounds: { north: number; south: number; east: number; west: number }) => {
    const centerLat = (bounds.north + bounds.south) / 2;
    const centerLng = (bounds.east + bounds.west) / 2;
    const latDistance = Math.abs(bounds.north - bounds.south) * 111.32 / 2;
    const lngDistance = Math.abs(bounds.east - bounds.west) * 111.32 * Math.cos((centerLat * Math.PI) / 180) / 2;
    const radiusKm = Math.max(25, Math.ceil(Math.sqrt(latDistance ** 2 + lngDistance ** 2)));

    router.replace(buildTargetUrl({
      ...filters,
      lat: Number(centerLat.toFixed(5)),
      lng: Number(centerLng.toFixed(5)),
      radius_km: radiusKm,
      page: 1,
    }), { scroll: false });
    track('company_map_area_search', {
      source: 'map',
      view_mode: 'map',
      bounds: {
        north: Number(bounds.north.toFixed(2)),
        south: Number(bounds.south.toFixed(2)),
        east: Number(bounds.east.toFixed(2)),
        west: Number(bounds.west.toFixed(2)),
      },
    });
  }, [buildTargetUrl, filters, router]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.max(1, filters.page || 1);

  const goToPage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    const updated = { ...filters, page: nextPage };
    router.replace(buildTargetUrl(updated), { scroll: false });
  };

  const localBusinessSchema = useMemo(() => {
    if (loading || visibleCompanies.length === 0) return null;

    const baseUrl = 'https://www.avaliasolar.com.br';
    const resolvedUrl =
      canonicalPath ||
      (typeof window !== 'undefined'
        ? window.location.pathname + window.location.search
        : COMPANIES_PATH);

    const listName =
      categoryNames.length > 0
        ? `Empresas de ${categoryNames.join(', ')}`
        : 'Empresas de energia solar no Brasil';

    return {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: listName,
      url: `${baseUrl}${resolvedUrl}`,
      mainEntity: {
        '@type': 'ItemList',
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        numberOfItems: visibleCompanies.length,
        itemListElement: visibleCompanies.slice(0, 12).map((company, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'LocalBusiness',
            name: company.name,
            url: `${baseUrl}/companies/${company.slug || company.id}`,
            image: company.logo_url || company.banner_url || undefined,
            address: {
              '@type': 'PostalAddress',
              addressLocality: company.city || undefined,
              addressRegion: company.state || undefined,
              addressCountry: 'BR',
            },
            aggregateRating:
              company.rating_count && company.rating_count > 0
                ? {
                    '@type': 'AggregateRating',
                    ratingValue: company.rating_avg || 0,
                    reviewCount: company.rating_count,
                  }
                : undefined,
          },
        })),
      },
    };
  }, [canonicalPath, categoryNames, loading, visibleCompanies]);

  const pageHeading =
    categoryNames.length > 0
      ? `Empresas de ${categoryNames.join(' e ')}`
      : 'Empresas de Energia Solar';

  const quickActions = [
    {
      label: 'Instalar',
      href: '/companies',
      imageSrc: '/icones/icone_instalar_avalia_solar_40x40.png',
    },
    {
      label: 'Produtos',
      href: '/products',
      imageSrc: '/icones/icone_produtos_avalia_solar_40x40.png',
    },
    {
      label: 'Categorias',
      href: '/categories',
      imageSrc: '/icones/icone_categorias_avalia_solar.png',
    },
    {
      label: 'Avaliar',
      href: '/reviews/my',
      imageSrc: '/icones/icone_avaliacoes_avalia_solar.png',
    },
    {
      label: 'Destaques',
      href: '/companies?featured=true',
      imageSrc: '/icones/icone_destaques_avalia_solar.png',
    },
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-destructive mb-3">
              ❌ Erro ao Carregar Empresas
            </h2>
            <p className="text-destructive mb-4">{error}</p>

            <div className="bg-white rounded-lg p-4 mb-4 border border-slate-200">
              <h3 className="font-medium text-slate-900 mb-2">🔍 Passos para Diagnóstico:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-slate-700">
                <li>Verifique se o backend Rails está rodando na porta 3001</li>
                <li>
                  Teste a API diretamente:{' '}
                  <code className="bg-slate-100 px-1 rounded">
                    curl http://localhost:3001/api/v1/companies
                  </code>
                </li>
                <li>Verifique as variáveis de ambiente no arquivo .env.local</li>
                <li>Verifique o console do navegador (F12) para erros detalhados</li>
                <li>
                  Execute o script de diagnóstico:{' '}
                  <code className="bg-slate-100 px-1 rounded">
                    node diagnose-companies-issue.js
                  </code>
                </li>
              </ol>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => window.location.reload()} variant="outline">
                Tentar Novamente
              </Button>
              <Button
                onClick={() => {
                  window.open('http://localhost:3001/api/v1/companies', '_blank');
                }}
                variant="secondary"
              >
                Testar API Diretamente
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-slate-500 font-medium">Carregando empresas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50/50">
      {/* Swiss Style: Barra de alerta de localização */}
      {showMobileLocationGate && (
        <div className="w-full bg-blue-600 text-white px-4 py-2.5 flex items-center justify-between gap-3 z-40">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium truncate">
              Então, você é daqui? Defina sua localização para ver empresas próximas
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleAllowLocation}
              disabled={detectingLocation}
              className="text-xs font-bold bg-white text-blue-700 rounded-full px-3 py-1 hover:bg-blue-50 transition-colors disabled:opacity-60"
            >
              {detectingLocation ? 'Detectando...' : 'Permitir localização'}
            </button>
            <button
              type="button"
              onClick={handleSkipLocationGate}
              aria-label="Fechar"
              className="text-white/70 hover:text-white text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}
      <div>
        {localBusinessSchema && (
          <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
          />
        )}
        <div className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar empresas..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 h-10 bg-white border-2 border-slate-900 rounded-full text-sm placeholder:text-slate-500 shadow-sm focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1"
            />
          </form>
        </div>

        <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex w-full min-w-0 flex-col items-start gap-8 lg:flex-row">
            <aside className="hidden lg:block lg:w-[260px] xl:w-[280px] 2xl:w-[300px] shrink-0">
              <FilterSidebar hideMobileTrigger={true} />
            </aside>

            <div className="w-full min-w-0 flex-1 space-y-6">
              <div className="w-full min-w-0 max-w-full">
                <BannerByLocation
                  location="companies_top"
                  className="max-w-full"
                />
              </div>

              <ActiveFiltersSummary filters={filters} onRemove={removeFilter} />

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {pageHeading}
                  </h1>
                  <p className="text-slate-500 text-sm mt-1">
                    Encontramos {totalCount} empresas que atendem aos seus critérios
                  </p>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-center">
                  {/* Swiss Style: Dropdown Ordenar por */}
                  <div className="relative flex items-center">
                    <select
                      id="sort-companies"
                      value={filters.sort || ''}
                      onChange={(e) => {
                        const updated = { ...filters, sort: e.target.value || 'recommended', page: 1 };
                        router.replace(buildTargetUrl(updated), { scroll: false });
                      }}
                      className="appearance-none h-9 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 font-medium shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Ordenar: Recomendadas</option>
                      <option value="rating">Melhor avaliação</option>
                      <option value="reviews_desc">Mais avaliações</option>
                      <option value="newest">Mais recentes</option>
                      {filters.lat !== null && filters.lng !== null && (
                        <option value="distance">Mais próximas</option>
                      )}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-slate-400" />
                  </div>

                  {/* Swiss Style: View Mode toggle com botão ativo dark */}
                  <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'h-8 w-8 transition-colors',
                        viewMode === 'grid' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-50'
                      )}
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'h-8 w-8 transition-colors',
                        viewMode === 'list' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-50'
                      )}
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'h-8 w-8 transition-colors',
                        viewMode === 'map' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-50'
                      )}
                      onClick={() => setViewMode('map')}
                    >
                      <MapIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Swiss Style: Contador de resultados */}
              {!loading && viewMode !== 'map' && (
                <p className="text-xs text-slate-400 font-medium -mt-2">
                  Mostrando {Math.min(companies.length, PAGE_SIZE)} de {totalCount} empresas
                </p>
              )}

              {/* Mobile quick filters */}
              <div className="md:hidden">
                <MobileCompanyFilterBar
                  filters={filters}
                  onOpenFilters={() => setIsFiltersOpen(true)}
                  onOpenLocation={handleNearMe}
                  onOpenCategory={() => setIsCategoryPickerOpen(true)}
                  onToggleVerified={handleToggleVerified}
                  categoryLabel={categoryLabel}
                  locationLabel={locationLabel}
                />
              </div>

              {isCategoryPickerOpen && (
                <div
                  className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 md:hidden"
                  role="presentation"
                  onMouseDown={(event) => {
                    if (event.target === event.currentTarget) setIsCategoryPickerOpen(false);
                  }}
                >
                  <div className="w-full max-w-lg" role="dialog" aria-modal="true" aria-label="Selecionar categorias">
                    <CompanyCategoryPicker
                      selectedIds={filters.category_ids}
                      onChange={(category_ids) => {
                        handleApplyFilters({ ...filters, category_ids, page: 1 });
                        setIsCategoryPickerOpen(false);
                      }}
                      onClose={() => setIsCategoryPickerOpen(false)}
                    />
                  </div>
                </div>
              )}

              {/* Desktop quick filters */}
              <section
                className="hidden md:flex w-full snap-x snap-mandatory gap-3 overflow-x-auto pb-3 md:flex-wrap md:overflow-x-visible md:pb-0 [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {quickActions.map((action) => {
                  const isDestaques = action.label === 'Destaques';
                  return (
                    <Link
                      key={action.label}
                      href={action.href}
                      className={cn(
                        'flex flex-row items-center justify-center rounded-xl px-4 py-2 w-auto shrink-0 snap-start border shadow-sm transition-all group gap-2',
                        isDestaques
                          ? 'bg-slate-900 border-slate-900 hover:bg-slate-800'
                          : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-slate-50'
                      )}
                    >
                      <div className="relative w-5 h-5 transition-transform duration-300 group-hover:scale-105">
                        <Image
                          src={action.imageSrc}
                          alt={action.label}
                          fill
                          sizes="20px"
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                      <span className={cn(
                        'text-[13px] font-semibold transition-colors',
                        isDestaques ? 'text-white' : 'text-slate-700 group-hover:text-blue-700'
                      )}>
                        {action.label}
                      </span>
                    </Link>
                  );
                })}
              </section>

              <div className="space-y-4">
                {loading ? (
                  <div
                    className={cn(
                      'grid w-full min-w-0 gap-4',
                      viewMode !== 'grid' && 'grid-cols-1'
                    )}
                    style={viewMode === 'grid' ? { gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))' } : undefined}
                  >
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-64 rounded-xl bg-white" />
                    ))}
                  </div>
                ) : visibleCompanies.length > 0 ? (
                  <>
                    {viewMode === 'map' ? (
                      <div className="h-[calc(100dvh-13rem)] min-h-[520px] w-full rounded-2xl shadow-sm border border-slate-200 md:h-[600px]">
                        <SearchMapPanel
                          companies={mapCompanies}
                          className="h-full"
                          compareIds={mapCompareIds}
                          onCompare={handleMapCompare}
                          onCompanySelect={(company) => {
                            track('company_map_marker_clicked', {
                              company_id: company.id,
                              source: 'map',
                              view_mode: 'map',
                            });
                          }}
                          onSearchInArea={handleMapBoundsSearch}
                          center={
                            filters.lat && filters.lng
                              ? { lat: filters.lat, lng: filters.lng }
                              : undefined
                          }
                        />
                      </div>
                    ) : (
                      <div
                        data-testid="companies-grid"
                        className={cn(
                          'grid w-full min-w-0 gap-4',
                          viewMode !== 'grid' && 'grid-cols-1'
                        )}
                        style={viewMode === 'grid' ? { gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))' } : undefined}
                      >
                        {visibleCompanies.map((company, index) => (
                          <CompanyCard
                            key={company.id}
                            company={company}
                            index={index + ((filters.page || 1) - 1) * PAGE_SIZE}
                          />
                        ))}
                      </div>
                    )}


                    {totalPages > 1 && viewMode !== 'map' && (
                      <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                        <Button
                          variant="outline"
                          className="rounded-full border-slate-200 text-slate-600 hover:text-slate-900"
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage <= 1}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Anterior
                        </Button>
                        <span className="text-sm text-slate-500">
                          Página {currentPage} de {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          className="rounded-full border-slate-200 text-slate-600 hover:text-slate-900"
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage >= totalPages}
                        >
                          Próxima
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 text-center">
                    <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <Search className="h-8 w-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Nenhuma empresa encontrada
                    </h3>
                    <p className="text-slate-500 max-w-xs mt-1">
                      Não encontramos resultados para os filtros selecionados. Tente ajustar sua
                      busca.
                    </p>
                    <Button
                      variant="link"
                      className="mt-4 text-blue-600"
                      onClick={() => {
                        router.replace(COMPANIES_PATH, { scroll: false });
                      }}
                    >
                      Limpar todos os filtros
                    </Button>
                  </div>
                )}
              </div>

              <section className="pt-4">
                <BannerByLocation location="companies_footer" />
              </section>
            </div>

            <div className="hidden 2xl:flex flex-col gap-4 w-[300px] shrink-0 sticky top-[calc(88px+var(--safe-area-inset-top))]">
              <BannerByLocation
                location="sidebar"
                limit={1}
                categoryId={filters.category_ids[0]}
                className="rounded-2xl"
              />
              <BannerByLocation
                location="companies_right_rail"
                limit={1}
                categoryId={filters.category_ids[0]}
                className="rounded-2xl"
              />
            </div>
          </div>
        </div>
      </div>
      <MobileCompanyFiltersSheet
        open={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        filters={filters}
        onApply={handleApplyFilters}
        initialGpsError={gpsError}
      />
    </div>
  );
}

export default function CompaniesPageClient(props: CompaniesPageClientProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-slate-500 font-medium">Carregando empresas...</p>
          </div>
        </div>
      }
    >
      <CompaniesContent {...props} />
    </Suspense>
  );
}
