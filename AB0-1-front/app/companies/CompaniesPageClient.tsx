'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { Search, Grid, List, Building, Package, Folder, Star, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import CompanyCard from '@/components/CompanyCard';
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
import {
  buildCompaniesCategoriesPath,
  COMPANIES_PATH,
  extractCategoryIdsFromPath,
  extractCategorySlugByIdFromPath,
  isCompaniesCategoriesPath,
} from '@/lib/seo/companies-category-url';
import { useDebounce } from '@/hooks/useDebounce';

interface CompaniesPageClientProps {
  forcedCategoryIds?: number[];
  categoryNames?: string[];
  canonicalPath?: string;
}

interface CompaniesContentProps extends CompaniesPageClientProps {}
const EMPTY_CATEGORY_IDS: number[] = [];

export function CompaniesContent({ forcedCategoryIds, categoryNames = [], canonicalPath }: CompaniesContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParamsKey = searchParams.toString();
  const activeForcedCategoryIds = forcedCategoryIds ?? EMPTY_CATEGORY_IDS;
  const pathCategoryIds = useMemo(
    () => (activeForcedCategoryIds.length > 0 ? activeForcedCategoryIds : extractCategoryIdsFromPath(pathname)),
    [activeForcedCategoryIds, pathname]
  );
  const pathSlugById = useMemo(() => extractCategorySlugByIdFromPath(pathname), [pathname]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 12;

  const filters = useMemo(
    () => parseQueryParams(new URLSearchParams(searchParamsKey), { pathCategoryIds }),
    [searchParamsKey, pathCategoryIds]
  );
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const debouncedSearchInput = useDebounce(searchInput, 400);
  const requestParams = useMemo(
    () => ({
      status: 'active' as const,
      page: filters.page || 1,
      per_page: PAGE_SIZE,
      q: filters.search || undefined,
      state: filters.state.length > 0 ? filters.state : undefined,
      city: filters.city.length > 0 ? filters.city : undefined,
      category_ids: filters.category_ids.length > 0 ? filters.category_ids : undefined,
      min_rating: filters.min_rating || undefined,
      verified: filters.verified || undefined,
      featured: filters.featured || undefined,
      financing_enabled: filters.financing_enabled || undefined,
      whatsapp_enabled: filters.whatsapp_enabled || undefined,
      sort: filters.sort || undefined,
      fields: 'card' as const,
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
    ]
  );

  const buildTargetUrl = (nextFilters: CompanyFilters): string => {
    const sortedCategoryIds = [...nextFilters.category_ids].sort((a, b) => a - b);
    const hasPathCategories = isCompaniesCategoriesPath(pathname);

    if (sortedCategoryIds.length > 0 && hasPathCategories) {
      const nextPath = buildCompaniesCategoriesPath(sortedCategoryIds, {}, pathSlugById);
      const queryString = stringifyQueryParams(nextFilters, { omitCategoryIds: true });
      return `${nextPath}${queryString ? `?${queryString}` : ''}`;
    }

    const queryString = stringifyQueryParams(nextFilters);
    return `${COMPANIES_PATH}${queryString ? `?${queryString}` : ''}`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = { ...filters, search: searchInput, page: 1 };
    router.replace(buildTargetUrl(updated), { scroll: false });
  };

  const removeFilter = (key: keyof CompanyFilters, value?: any) => {
    let updated: CompanyFilters;
    if (Array.isArray(filters[key])) {
      const currentArray = filters[key] as any[];
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
        const errorMsg = (err as any)?.message || 'Erro ao carregar empresas';
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

  const visibleCompanies = useMemo(
    () => companies ?? [],
    [companies]
  );

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
    const resolvedUrl = canonicalPath || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : COMPANIES_PATH);

    const listName = categoryNames.length > 0
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
            aggregateRating: company.rating_count && company.rating_count > 0
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

  const pageHeading = categoryNames.length > 0
    ? `Empresas de ${categoryNames.join(' e ')}`
    : 'Empresas de Energia Solar';

  const quickActions = [
    { label: 'Instalar', href: '/companies', icon: Building, styles: 'bg-brand-blue/10 text-brand-blue' },
    { label: 'Produtos', href: '/products', icon: Package, styles: 'bg-brand-green/10 text-brand-green-dark' },
    { label: 'Categorias', href: '/categories', icon: Folder, styles: 'bg-brand-blue/10 text-brand-blue' },
    { label: 'Avaliar', href: '/reviews/my', icon: Star, styles: 'bg-brand-cyan/10 text-brand-cyan-dark' },
    { label: 'Destaques', href: '/companies?featured=true', icon: Zap, styles: 'bg-slate-100 text-slate-700' },
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-destructive mb-3">❌ Erro ao Carregar Empresas</h2>
            <p className="text-destructive mb-4">{error}</p>
            
            <div className="bg-white rounded-lg p-4 mb-4 border border-slate-200">
              <h3 className="font-medium text-slate-900 mb-2">🔍 Passos para Diagnóstico:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-slate-700">
                <li>Verifique se o backend Rails está rodando na porta 3001</li>
                <li>Teste a API diretamente: <code className="bg-slate-100 px-1 rounded">curl http://localhost:3001/api/v1/companies</code></li>
                <li>Verifique as variáveis de ambiente no arquivo .env.local</li>
                <li>Verifique o console do navegador (F12) para erros detalhados</li>
                <li>Execute o script de diagnóstico: <code className="bg-slate-100 px-1 rounded">node diagnose-companies-issue.js</code></li>
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

  return (
    <div className="min-h-screen bg-slate-50/50">
      {localBusinessSchema && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      )}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar empresas..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 h-10 bg-slate-50 border-none rounded-full text-sm"
          />
        </form>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-[300px] shrink-0">
            <FilterSidebar />
          </aside>

          <div className="flex-1 space-y-6">
            <ActiveFiltersSummary filters={filters} onRemove={removeFilter} />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{pageHeading}</h1>
                <p className="text-slate-500 text-sm mt-1">Encontramos {totalCount} empresas que atendem aos seus critérios</p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn('h-8 w-8', viewMode === 'grid' && 'bg-slate-100 text-slate-900')}
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn('h-8 w-8', viewMode === 'list' && 'bg-slate-100 text-slate-900')}
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                if (!Icon) return null;
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex flex-col items-center gap-2 rounded-xl bg-white p-3 text-center border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group"
                  >
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-full transition-colors', action.styles)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 group-hover:text-slate-900">{action.label}</span>
                  </Link>
                );
              })}
            </section>

            <div className="space-y-4">
              {loading ? (
                <div className={cn('grid gap-4', viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1')}>
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-64 rounded-xl bg-white" />
                  ))}
                </div>
              ) : visibleCompanies.length > 0 ? (
                <>
                  <div
                    data-testid="companies-grid"
                    className={cn('grid gap-4', viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1')}
                  >
                    {visibleCompanies.map((company) => (
                      <CompanyCard key={company.id} company={company} compact={viewMode === 'list'} />
                    ))}
                  </div>

                  {totalPages > 1 && (
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
                  <h3 className="text-lg font-semibold text-slate-900">Nenhuma empresa encontrada</h3>
                  <p className="text-slate-500 max-w-xs mt-1">Não encontramos resultados para os filtros selecionados. Tente ajustar sua busca.</p>
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
        </div>
      </div>
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

