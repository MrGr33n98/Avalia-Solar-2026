'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Filter, RotateCcw, Trophy } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { RankingBenchmarkCards } from './ranking/RankingBenchmarkCards';
import { ComparisonRankingCard, OfficialRankingCard } from './ranking/RankingCards';
import { RankingContextChips } from './ranking/RankingContextChips';
import { RankingExecutiveHero } from './ranking/RankingExecutiveHero';
import { RankingMethodologyDialog } from './ranking/RankingMethodologyDialog';
import { RankingEvidence, RankingNearbyCompetitors } from './ranking/RankingEvidence';
import { RankingPositioningMap } from './ranking/RankingPositioningMap';
import { RankingStateBanner } from './ranking/RankingStateBanner';
import { RankingWhyCard } from './ranking/RankingWhyCard';
import {
  comparisonScopeLabel,
  formatDate,
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
  const [historyMetric, setHistoryMetric] = useState<'position' | 'percentile' | 'score'>('position');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedCity(selectedCity.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [selectedCity]);

  // A URL é a fonte de verdade: navegação de voltar/avançar restaura o escopo
  // sem transformar uma comparação anterior em dado atual.
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
    staleTime: 6 * 60 * 60 * 1000,
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
  const officialScope = data?.official_scope?.type === 'category' ? 'Categoria oficial' : 'Brasil';
  const heroTitle = isPreview && comparisonLabel ? `Desempenho em ${comparisonLabel}` : 'Desempenho no Mercado';
  const heroDescription = isPreview
    ? `Comparação dinâmica com empresas elegíveis em ${comparisonLabel}. Esta comparação não altera seu ranking orgânico oficial.`
    : 'Acompanhe sua posição orgânica no Avalia Solar, compare seu desempenho e entenda os fatores que influenciam sua presença competitiva.';
  const apiError = rankingError as { code?: string; requestId?: string; status?: number } | null;
  const errorMessage = getApiErrorMessage(rankingError, 'Não foi possível atualizar o ranking.').replace(/^\[\d{3}\]\s*/, '');
  const qualityLabels = translatedQualityFlags(data?.quality?.flags);
  const historyItems = data?.history?.items || [];
  const historyLabel = historyDays === '365' ? 'últimos 12 meses' : `últimos ${historyDays} dias`;
  const hasActiveFilters = selectedCategoryId !== 'all' || selectedCriterionSlug !== 'all' || selectedState !== 'all' || Boolean(selectedCity) || selectedSector !== 'all' || historyDays !== '90' || quadrantMode !== 'default';
  const insights = useMemo(
    () => [...(data?.insights?.strengths || []), ...(data?.insights?.opportunities || [])],
    [data?.insights?.opportunities, data?.insights?.strengths]
  );

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
    <div className="mx-auto max-w-[1400px] space-y-6 pb-20">
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

      {/* 01. EXECUTIVE RANKING HERO & ESCOPO */}
      <section className="space-y-3" aria-labelledby="ranking-hero">
        <RankingExecutiveHero
          data={data}
          isPreview={isPreview}
          comparisonLabel={comparisonLabel}
          heroTitle={heroTitle}
        />
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <RankingContextChips data={data} />
          <RankingMethodologyDialog
            definition={data?.definition}
            quadrantMeta={data?.quadrant?.meta}
            qualityFlags={data?.quality?.flags}
            officialScope={data?.official_scope}
            comparisonScope={data?.comparison_scope}
          />
        </div>
      </section>

      <RankingStateBanner
        status={data?.status}
        officialStatus={isPreview ? data?.official_ranking?.status : undefined}
      />

      {/* 02. BARRA DE COMPARAÇÃO CONTEXTUAL */}
      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <Filter className="mb-2 h-4 w-4 text-muted-foreground" />
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

          <FilterSelect label="Setor" value={selectedSector} onChange={setSelectedSector}>
            <SelectItem value="all">Todos os setores</SelectItem>
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

      {/* 03. POSIÇÕES OFICIAIS & COMPARAÇÃO DETALHADA */}
      <section className={isPreview ? 'grid gap-5 lg:grid-cols-2' : 'max-w-xl'} aria-label="Posições de ranking">
        <OfficialRankingCard metric={data?.official_ranking || data?.ranking} scope={officialScope} />
        {isPreview && <ComparisonRankingCard metric={data?.ranking} scope={comparisonLabel || 'Escopo selecionado'} />}
      </section>

      {/* 04. POR QUE ESTOU NESTA POSIÇÃO? & OPPORTUNITY GAP */}
      <RankingWhyCard data={data} />

      {/* 04. BENCHMARKS & COMPONENTES DO SCORE */}
      <RankingBenchmarkCards benchmarks={data?.benchmarks} />
      <RankingEvidence data={data} />

      {/* 05. MAPA DE POSICIONAMENTO ESTRATÉGICO (MAGIC QUADRANT) & COMPETIDORES */}
      <section className="grid gap-5 xl:grid-cols-[1.25fr_1fr]" aria-label="Mapa Estratégico e Competidores">
        <RankingPositioningMap quadrant={data?.quadrant} />
        <div className="space-y-5">
          <RankingNearbyCompetitors
            leaders={data?.leaders}
            neighbors={data?.neighbors}
            currentScore={data?.ranking?.score}
            currentPosition={data?.ranking?.position}
          />
        </div>
      </section>

      {/* 06. EVOLUÇÃO TEMPORAL & NEXT BEST ACTION */}
      <section className="grid gap-5 xl:grid-cols-[1.25fr_1fr]" aria-label="Histórico e Insights">
        <Card>
          <CardHeader>
            <CardTitle>{isPreview ? 'Histórico do ranking oficial' : 'Evolução do ranking oficial'}</CardTitle>
            <CardDescription>
              {data?.history?.status === 'forming'
                ? `Histórico oficial em formação: ${data.history.sample_size || historyItems.length} de ${data.history.minimum_snapshots || 7} snapshots disponíveis.`
                : isPreview
                  ? 'A comparação regional atual é calculada em tempo real e não possui histórico persistido.'
                  : `Snapshots oficiais · ${historyLabel}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-2">
              {(['position', 'percentile', 'score'] as const).map((metric) => (
                <Button
                  key={metric}
                  variant={historyMetric === metric ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setHistoryMetric(metric)}
                >
                  {metric === 'position' ? 'Posição' : metric === 'percentile' ? 'Percentil' : 'Pontuação'}
                </Button>
              ))}
            </div>
            <p className="sr-only">Gráfico do histórico oficial de {historyLabel}, exibindo {historyMetric}.</p>
            {historyItems.length ? (
              <div className="h-72" aria-label="Gráfico do histórico oficial">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyItems} margin={{ top: 16, right: 20, bottom: 16, left: -12 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                    <YAxis reversed={historyMetric === 'position'} tick={{ fontSize: 10 }} />
                    <RechartsTooltip />
                    <Area
                      type="monotone"
                      dataKey={historyMetric}
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary) / 0.18)"
                      name={historyMetric}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">Dados históricos insuficientes.</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Insights e próximos passos</CardTitle>
              <CardDescription>Recomendações derivadas somente dos dados disponíveis neste escopo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.length ? (
                insights.map((insight) => (
                  <article key={insight.code} className="rounded-lg border p-4">
                    <p className="font-medium">{insight.title || insight.code}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{insight.description || insight.message}</p>
                    {insight.action_url && (
                      <a className="mt-2 inline-block text-sm font-medium text-brand-blue underline" href={insight.action_url}>
                        Ver ação relacionada
                      </a>
                    )}
                  </article>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Ainda não há evidência comparável suficiente para uma recomendação específica.
                </p>
              )}
              {data?.insights?.next_best_action && (
                <p className="rounded-lg bg-muted p-3 text-sm">
                  <strong>Próxima ação:</strong>{' '}
                  {data.insights.next_best_action.title ||
                    data.insights.next_best_action.description ||
                    data.insights.next_best_action.message}
                </p>
              )}
            </CardContent>
          </Card>

          {qualityLabels.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold">Qualidade dos dados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {qualityLabels.map((label) => (
                    <Badge key={label} variant="outline">
                      {label}
                    </Badge>
                  ))}
                </div>
                {formatDate(data?.quality?.computed_at) && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Calculado em {formatDate(data?.quality?.computed_at)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label className="grid min-w-36 gap-1 text-xs font-medium text-muted-foreground"><span>{label}</span><Select value={value} onValueChange={onChange}><SelectTrigger className="h-9 bg-background text-sm"><SelectValue /></SelectTrigger><SelectContent>{children}</SelectContent></Select></label>;
}
