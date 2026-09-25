'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Filter, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { companyDashboardApi, fetchApi, type Company, type RankingFilterOptions } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { ComparisonRankingCard, OfficialRankingCard } from './ranking/RankingCards';
import { RankingContextChips } from './ranking/RankingContextChips';
import { RankingExecutiveHero } from './ranking/RankingExecutiveHero';
import { RankingEvidenceTabs } from './ranking/RankingEvidenceTabs';
import { RankingGovernanceStrip } from './ranking/RankingGovernanceStrip';
import { RankingPositioningMap } from './ranking/RankingPositioningMap';
import { RankingStateBanner } from './ranking/RankingStateBanner';
import { RankingWhyCard } from './ranking/RankingWhyCard';
import {
  comparisonScopeLabel,
  stateName,
  translatedQualityFlags,
} from './ranking/ranking-utils';

interface DashboardStats { conversionRate?: number }
interface Criterion { slug: string; title: string }
interface CriteriaResponse { criteria?: Criterion[] }
interface Props {
  company: Company;
  stats?: DashboardStats | null;
  themeMode?: 'light' | 'dark';
}

export const RANKING_FILTER_OPTIONS_STALE_TIME_MS = 30_000;

const HISTORY_OPTIONS = [
  { value: '30', label: '30 dias' },
  { value: '90', label: '90 dias' },
  { value: '365', label: '12 meses' },
] as const;

export default function RankingPerformanceTab({ company, stats: _stats, themeMode: _themeMode = 'dark' }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedCategoryId, setSelectedCategoryId] = useState(() => searchParams.get('ranking_category') || 'all');
  const [selectedCriterionSlug, setSelectedCriterionSlug] = useState(() => searchParams.get('ranking_criterion') || 'all');
  const [selectedState, setSelectedState] = useState(() => {
    const raw = searchParams.get('ranking_state');
    return raw && raw.trim() !== '' ? raw.trim() : 'all';
  });
  const [selectedCity, setSelectedCity] = useState(() => searchParams.get('ranking_city') || '');
  const [debouncedCity, setDebouncedCity] = useState(() => searchParams.get('ranking_city') || '');
  const [selectedSector, setSelectedSector] = useState(() => searchParams.get('ranking_sector') || 'all');
  const [historyDays, setHistoryDays] = useState(() => searchParams.get('ranking_history') || '90');
  const [quadrantMode, setQuadrantMode] = useState<'default' | 'reviews'>(
    () => (searchParams.get('ranking_quadrant') === 'reviews' ? 'reviews' : 'default')
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedCity(selectedCity.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [selectedCity]);

  // A URL é a fonte de verdade: navegação de voltar/avançar restaura o escopo
  useEffect(() => {
    setSelectedCategoryId(searchParams.get('ranking_category') || 'all');
    setSelectedCriterionSlug(searchParams.get('ranking_criterion') || 'all');
    const rawSt = searchParams.get('ranking_state');
    setSelectedState(rawSt && rawSt.trim() !== '' ? rawSt.trim() : 'all');
    setSelectedCity(searchParams.get('ranking_city') || '');
    setSelectedSector(searchParams.get('ranking_sector') || 'all');
    setHistoryDays(searchParams.get('ranking_history') || '90');
    setQuadrantMode(searchParams.get('ranking_quadrant') === 'reviews' ? 'reviews' : 'default');
  }, [searchParams]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams.toString());
    const params = {
      ranking_category: selectedCategoryId === 'all' ? undefined : selectedCategoryId,
      ranking_criterion: selectedCriterionSlug === 'all' ? undefined : selectedCriterionSlug,
      ranking_state: selectedState === 'all' || !selectedState ? undefined : selectedState,
      ranking_city: debouncedCity || undefined,
      ranking_sector: selectedSector === 'all' ? undefined : selectedSector,
      ranking_history: historyDays === '90' ? undefined : historyDays,
      ranking_quadrant: quadrantMode === 'default' ? undefined : quadrantMode,
    };
    Object.entries(params).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    // Assegura remoção de ranking_state quando vazio ou 'all'
    if (selectedState === 'all' || !selectedState) {
      next.delete('ranking_state');
    }
    if (next.toString() !== searchParams.toString()) router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [debouncedCity, historyDays, pathname, quadrantMode, router, searchParams, selectedCategoryId, selectedCriterionSlug, selectedSector, selectedState]);

  const criteriaQuery = useQuery({
    queryKey: ['category-evaluation-context', selectedCategoryId],
    queryFn: () => selectedCategoryId === 'all'
      ? Promise.resolve({ criteria: [] })
      : fetchApi<CriteriaResponse>(`/categories/${selectedCategoryId}/evaluation_context`),
    enabled: selectedCategoryId !== 'all',
  });

  const filterOptionsQuery = useQuery({
    queryKey: ['company-analytics-ranking-filter-options', company.id, selectedState],
    queryFn: () => companyDashboardApi.getRankingFilterOptions(company.id, selectedState === 'all' ? undefined : selectedState),
    enabled: Boolean(company.id),
    staleTime: RANKING_FILTER_OPTIONS_STALE_TIME_MS,
  });

  const rankingQuery = useQuery({
    queryKey: [
      'company-analytics-ranking', company.id, selectedCategoryId, selectedCriterionSlug, selectedState,
      debouncedCity, selectedSector, quadrantMode, historyDays,
    ],
    queryFn: () => companyDashboardApi.getRanking(
      company.id,
      selectedCategoryId === 'all' ? undefined : selectedCategoryId,
      selectedCriterionSlug === 'all' ? undefined : selectedCriterionSlug,
      selectedState === 'all' ? undefined : selectedState,
      debouncedCity || undefined,
      selectedSector === 'all' ? undefined : selectedSector,
      quadrantMode,
      Number(historyDays)
    ),
    enabled: Boolean(company.id),
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
    retry: (failCount, error) => {
      const status = (error as { status?: number })?.status;
      if (status != null && status >= 500 && status !== 503) return false;
      if (status === 429 || status === 503) return failCount < 2;
      return failCount < 1;
    },
    refetchOnWindowFocus: false,
  });

  const { data, error: rankingError, isError, isLoading, isPlaceholderData, refetch } = rankingQuery;
  const filterOptions = filterOptionsQuery.data as RankingFilterOptions | undefined;
  const isPreview = data?.mode === 'preview';
  const comparisonLabel = comparisonScopeLabel(data?.comparison_scope);
  const requestedScope = selectedCity || stateName(selectedState === 'all' ? null : selectedState) || selectedSector;
  const previousScope = comparisonLabel || 'o ranking oficial';
  const heroTitle = isPreview && comparisonLabel ? `Desempenho em ${comparisonLabel}` : 'Desempenho no Mercado';
  const officialScope = data?.official_scope?.type === 'category' ? 'Categoria oficial' : 'Brasil';
  const qualityLabels = translatedQualityFlags(data?.quality?.flags);
  const apiError = rankingError as { code?: string; requestId?: string; status?: number } | null;
  const errorMessage = getApiErrorMessage(rankingError, 'Não foi possível atualizar o ranking.').replace(/^\[\d{3}\]\s*/, '');
  const hasActiveFilters = selectedCategoryId !== 'all' || selectedCriterionSlug !== 'all' || selectedState !== 'all' || Boolean(selectedCity) || selectedSector !== 'all' || historyDays !== '90' || quadrantMode !== 'default';

  const resetFilters = () => {
    setSelectedCategoryId('all');
    setSelectedCriterionSlug('all');
    setSelectedState('all');
    setSelectedCity('');
    setSelectedSector('all');
    setHistoryDays('90');
    setQuadrantMode('default');
  };

  if (isLoading) {
    return <div className="grid gap-5"><Skeleton className="h-44" /><Skeleton className="h-64" /><Skeleton className="h-96" /></div>;
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-7 pb-20">
      {isError && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20" role="alert">
          <CardContent className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-5 w-5 text-red-600" /><div>
              <p className="font-semibold text-red-900 dark:text-red-200">{errorMessage}</p>
              <p className="mt-1 text-sm text-red-800/80 dark:text-red-200/80">Não foi possível atualizar o ranking; os dados anteriores só aparecem quando disponíveis.</p>
              {(apiError?.status || apiError?.code || apiError?.requestId) && <p className="mt-1 text-xs text-red-800/70 dark:text-red-200/70">{[apiError.status && `HTTP ${apiError.status}`, apiError.code, apiError.requestId && `request_id: ${apiError.requestId}`].filter(Boolean).join(' · ')}</p>}
            </div></div>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>Tentar novamente</Button>
          </CardContent>
        </Card>
      )}

      {isPlaceholderData && (
        <p className="text-sm text-muted-foreground" role="status">
          Exibindo temporariamente {previousScope} enquanto atualizamos {requestedScope || 'os filtros selecionados'}.
        </p>
      )}

      {/* ============================================================ */}
      {/* MÓDULO 01 — IAS STATUS HERO & ONBOARDING READINESS           */}
      {/* ============================================================ */}
      <section aria-labelledby="ranking-hero">
        <RankingExecutiveHero
          data={data}
          isPreview={isPreview}
          comparisonLabel={comparisonLabel}
          heroTitle={heroTitle}
        />
      </section>

      {/* ============================================================ */}
      {/* MÓDULO 02 — CONTEXTO & FILTROS (HORIZONTAL COCKPIT STRIP)     */}
      {/* ============================================================ */}
      <section className="space-y-3" aria-label="Filtros de Contexto">
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs">
          <CardContent className="flex flex-wrap items-end gap-3 p-4">
            <Filter className="mb-2.5 h-4 w-4 text-muted-foreground" />
            <FilterSelect
              label="Comparar com (Estado)"
              value={selectedState}
              onChange={(value) => {
                setSelectedState(value);
                setSelectedCity('');
              }}
            >
              <SelectItem value="all">Brasil (Nacional)</SelectItem>
              {(filterOptions?.states || []).map((state) => (
                <SelectItem key={state} value={state}>
                  {stateName(state)}
                </SelectItem>
              ))}
            </FilterSelect>

            <FilterSelect
              label="Categoria"
              value={selectedCategoryId}
              onChange={(value) => {
                setSelectedCategoryId(value);
                setSelectedCriterionSlug('all');
              }}
            >
              <SelectItem value="all">Todas as categorias</SelectItem>
              {(filterOptions?.categories || []).map((category) => (
                <SelectItem key={category.id} value={String(category.id)}>
                  {category.name}
                </SelectItem>
              ))}
            </FilterSelect>

            <FilterSelect label="Tipo de projeto" value={selectedSector} onChange={setSelectedSector}>
              <SelectItem value="all">Todos os tipos de projeto</SelectItem>
              {(filterOptions?.sectors || []).map((sector) => (
                <SelectItem key={sector} value={sector}>
                  {sector}
                </SelectItem>
              ))}
            </FilterSelect>

            <FilterSelect label="Período" value={historyDays} onChange={setHistoryDays}>
              {HISTORY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </FilterSelect>

            <details className="relative mb-0.5">
              <summary className="cursor-pointer rounded-md border px-3 py-2 text-sm bg-background">
                Mais filtros
              </summary>
              <div className="absolute right-0 z-10 mt-2 grid w-72 gap-3 rounded-lg border bg-background p-3 shadow-lg">
                <label className="grid gap-1 text-xs font-medium">
                  Cidade
                  <input
                    list="ranking-cities"
                    value={selectedCity}
                    onChange={(event) => setSelectedCity(event.target.value)}
                    className="h-9 rounded-md border bg-transparent px-2 text-sm"
                    placeholder="Ex: Florianópolis"
                  />
                  <datalist id="ranking-cities">
                    {(filterOptions?.cities || []).map((city) => (
                      <option key={city} value={city} />
                    ))}
                  </datalist>
                </label>

                <FilterSelect
                  label="Critério do mapa"
                  value={selectedCriterionSlug}
                  onChange={setSelectedCriterionSlug}
                >
                  <SelectItem value="all">Nenhum (Geral)</SelectItem>
                  {(criteriaQuery.data?.criteria || []).map((criterion) => (
                    <SelectItem key={criterion.slug} value={criterion.slug}>
                      {criterion.title}
                    </SelectItem>
                  ))}
                </FilterSelect>

                <FilterSelect
                  label="Modo do mapa"
                  value={quadrantMode}
                  onChange={(value) => setQuadrantMode(value as 'default' | 'reviews')}
                >
                  <SelectItem value="default">Autoridade e execução</SelectItem>
                  <SelectItem value="reviews">Somente reviews</SelectItem>
                </FilterSelect>
              </div>
            </details>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <RotateCcw className="mr-1 h-4 w-4" />
                Limpar
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Chips de contexto e Status de Amostra/Fallback */}
        <div className="space-y-3">
          <RankingContextChips data={data} />
          <RankingStateBanner
            status={data?.status}
            officialStatus={isPreview ? data?.official_ranking?.status : undefined}
          />

          {/* Posições Oficiais e Comparação Detalhada */}
          <section className={isPreview ? 'grid gap-5 lg:grid-cols-2' : 'max-w-xl'} aria-label="Posições de ranking">
            <OfficialRankingCard metric={data?.official_ranking || data?.ranking} scope={officialScope} />
            {isPreview && <ComparisonRankingCard metric={data?.ranking} scope={comparisonLabel || 'Escopo selecionado'} />}
          </section>

          {qualityLabels.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {qualityLabels.map((label) => (
                <Badge key={label} variant="outline" className="border-amber-200 bg-amber-50/50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                  {label}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/* MÓDULO 03 — INSIGHTS & NEXT ACTION (POR QUE ESTOU AQUI?)     */}
      {/* ============================================================ */}
      <RankingWhyCard data={data} />

      {/* ============================================================ */}
      {/* MÓDULO 04 — POSITIONING COCKPIT (MAGIC QUADRANT & INSPECTOR) */}
      {/* ============================================================ */}
      <section aria-label="Mapa Estratégico de Posicionamento">
        <RankingPositioningMap
          quadrant={data?.quadrant}
          company={company}
          filterOptions={filterOptions}
          selectedState={selectedState}
          onSelectState={(state) => {
            setSelectedState(state);
            setSelectedCity('');
          }}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={(categoryId) => {
            setSelectedCategoryId(categoryId);
            setSelectedCriterionSlug('all');
          }}
          selectedSector={selectedSector}
          onSelectSector={setSelectedSector}
        />
      </section>

      {/* ============================================================ */}
      {/* MÓDULO 05 — EVIDÊNCIAS & EVOLUÇÃO (EMPRESAS, HISTÓRICO, DELTA)*/}
      {/* ============================================================ */}
      <section aria-label="Evidências e Histórico">
        <RankingEvidenceTabs
          data={data}
          isPreview={isPreview}
          historyDays={historyDays}
        />
      </section>

      {/* ============================================================ */}
      {/* MÓDULO 06 — GOVERNANÇA, ZERO PAY-TO-WIN & METODOLOGIA OFICIAL */}
      {/* ============================================================ */}
      <section aria-label="Governança e Metodologia">
        <RankingGovernanceStrip data={data} />
      </section>
    </div>
  );
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label className="grid min-w-36 gap-1 text-xs font-medium text-muted-foreground"><span>{label}</span><Select value={value} onValueChange={onChange}><SelectTrigger className="h-9 bg-background text-sm"><SelectValue /></SelectTrigger><SelectContent>{children}</SelectContent></Select></label>;
}

