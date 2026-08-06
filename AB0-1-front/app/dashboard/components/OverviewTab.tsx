'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Download,
  Eye,
  FileText,
  Lightbulb,
  MessageCircle,
  MousePointerClick,
  PackageOpen,
  PhoneCall,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  UserRound,
  UsersRound,
} from 'lucide-react';
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { companyDashboardApi, fetchApi, type FeatureAccessEntry } from '@/lib/api';
import { cn } from '@/lib/utils';

type CompanyOverview = {
  name?: string;
  slug?: string;
  city?: string;
  state?: string;
  description?: string;
  logo?: { url?: string };
  logo_url?: string;
  banner?: { url?: string };
  banner_url?: string;
  website?: string;
  website_url?: string;
  whatsapp?: string;
  phone?: string;
  reviews_count?: number;
  categories?: unknown[];
};
type CampaignOverview = { utm_source?: string; total_visits?: number };
type IntentOverview = {
  intent_distribution?: { hot?: number; boiling?: number; immediate?: number };
  total_signals?: number;
};

type OverviewTabProps = {
  companyId: string;
  company?: CompanyOverview;
  featureAccess?: Record<string, FeatureAccessEntry>;
  themeMode?: 'light' | 'dark';
  onNavigateToReviews?: () => void;
  onNavigateToTab?: (tab: string) => void;
};

type Period = 7 | 30 | 90;

type SeriesPoint = {
  date: string;
  views: number;
  clicks: number;
  leads: number;
};

type LeadRow = {
  id: string | number;
  name?: string;
  city?: string;
  state?: string;
  product_vertical?: string;
  project_profile?: string;
  message?: string;
  wizard_status?: string;
  created_at?: string;
  utm_source?: string;
  referrer_host?: string;
};

const PERIODS: Array<{ value: Period; label: string }> = [
  { value: 7, label: 'Últimos 7 dias' },
  { value: 30, label: 'Últimos 30 dias' },
  { value: 90, label: 'Últimos 90 dias' },
];

const SOURCE_COLORS = [
  'hsl(var(--dashboard-chart-1))',
  'hsl(var(--dashboard-chart-2))',
  'hsl(var(--dashboard-positive))',
  'hsl(var(--dashboard-warning))',
  'hsl(var(--dashboard-danger))',
];

function number(value: unknown) {
  return Number(value || 0);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

function formatDate(date?: string) {
  if (!date) return '—';
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? '—'
    : parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
}

function formatRelativeDate(date?: string) {
  if (!date) return '—';
  const difference = Date.now() - new Date(date).getTime();
  if (Number.isNaN(difference)) return '—';
  const minutes = Math.max(0, Math.round(difference / 60_000));
  if (minutes < 60) return `Há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Há ${hours} h`;
  return `Há ${Math.round(hours / 24)} d`;
}

function formatRange(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days + 1);
  const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
  return `${start.toLocaleDateString('pt-BR', options).replace('.', '')} — ${end.toLocaleDateString('pt-BR', options).replace('.', '')} ${end.getFullYear()}`;
}

function normalizeSeries(payload: unknown): SeriesPoint[] {
  const typedPayload = (payload ?? {}) as { data?: Array<Record<string, unknown>> };
  const rows = Array.isArray(typedPayload.data) ? typedPayload.data : [];
  return rows
    .map((row) => ({
      date: String(row.date ?? ''),
      views: number(row.views ?? row.profile_views),
      clicks: number(row.clicks ?? row.cta_clicks),
      leads: number(row.leads),
    }))
    .filter((row: SeriesPoint) => Boolean(row.date));
}

function sum(rows: SeriesPoint[], key: keyof Omit<SeriesPoint, 'date'>) {
  return rows.reduce((total, row) => total + row[key], 0);
}

function trend(current: number, previous: number) {
  if (!previous) return current ? null : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function statusLabel(status?: string) {
  const labels: Record<string, string> = {
    draft: 'Novo',
    pending_otp: 'Em validação',
    verified: 'Qualificado',
    distributed: 'Distribuído',
    proposal_submitted: 'Proposta recebida',
    proposal_processing: 'Em atendimento',
    proposal_sent: 'Proposta enviada',
    proposal_failed: 'Atenção',
  };
  return labels[status || ''] || 'Novo';
}

function statusTone(status?: string) {
  if (status === 'proposal_sent') return 'bg-emerald-50 text-emerald-700';
  if (status === 'verified' || status === 'proposal_processing')
    return 'bg-violet-50 text-violet-700';
  if (status === 'proposal_failed') return 'bg-rose-50 text-rose-700';
  return 'bg-blue-50 text-blue-700';
}

function MetricCard({
  icon: Icon,
  title,
  value,
  comparison,
  available = true,
  href,
}: {
  icon: typeof Eye;
  title: string;
  value: string | number;
  comparison?: number | null;
  available?: boolean;
  href?: () => void;
}) {
  const isPositive = (comparison || 0) > 0;
  const isNegative = (comparison || 0) < 0;
  return (
    <section className="min-w-0 rounded-2xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-xs font-semibold text-[hsl(var(--dashboard-ink))]">{title}</p>
      </div>
      <div className="mt-4 flex items-end gap-2">
        <strong className="text-3xl leading-none tracking-tight text-[hsl(var(--dashboard-ink))]">
          {available ? value : '—'}
        </strong>
        {available && comparison !== undefined && comparison !== null && (
          <span
            className={cn(
              'mb-0.5 inline-flex items-center gap-0.5 text-xs font-semibold',
              isPositive
                ? 'text-emerald-600'
                : isNegative
                  ? 'text-rose-600'
                  : 'text-[hsl(var(--dashboard-muted))]'
            )}
          >
            {isPositive ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : isNegative ? (
              <TrendingDown className="h-3.5 w-3.5" />
            ) : null}
            {comparison > 0 ? '+' : ''}
            {comparison}%
          </span>
        )}
      </div>
      <div className="mt-2 flex min-h-4 items-center justify-between gap-2">
        <p className="text-[11px] text-[hsl(var(--dashboard-muted))]">
          {available ? 'vs. período anterior' : 'Ainda não mensurado'}
        </p>
        {href && available && (
          <button
            type="button"
            onClick={href}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
          >
            Ver detalhes
          </button>
        )}
      </div>
    </section>
  );
}

function EmptyChart({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid h-[242px] place-items-center text-center text-sm text-[hsl(var(--dashboard-muted))]">
      {children}
    </div>
  );
}

export default function OverviewTab({ companyId, company, onNavigateToTab }: OverviewTabProps) {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>(30);

  const analyticsQuery = useQuery({
    queryKey: ['overview-analytics', companyId],
    queryFn: () => companyDashboardApi.getAnalyticsOverview(companyId),
    enabled: Boolean(companyId),
  });
  const seriesQuery = useQuery({
    queryKey: ['overview-series', companyId, period],
    queryFn: () => companyDashboardApi.getAnalyticsTimeseries(companyId, Math.min(period * 2, 180)),
    enabled: Boolean(companyId),
  });
  const campaignsQuery = useQuery({
    queryKey: ['overview-campaigns', companyId],
    queryFn: () =>
      fetchApi<{ campaigns?: CampaignOverview[] }>('/company_dashboard/analytics/top_campaigns', {
        params: { company_id: companyId, limit: 20 },
      }),
    enabled: Boolean(companyId),
    retry: false,
  });
  const leadsQuery = useQuery({
    queryKey: ['overview-recent-leads', companyId],
    queryFn: () => fetchApi<LeadRow[]>('/leads', { params: { company_id: companyId } }),
    enabled: Boolean(companyId),
    retry: false,
  });
  const intentQuery = useQuery({
    queryKey: ['overview-intent', companyId],
    queryFn: () => companyDashboardApi.getIntentSummary(companyId),
    enabled: Boolean(companyId),
    retry: false,
  });

  const series = useMemo(() => normalizeSeries(seriesQuery.data), [seriesQuery.data]);
  const currentRows = useMemo(() => series.slice(-period), [period, series]);
  const previousRows = useMemo(() => series.slice(-period * 2, -period), [period, series]);
  const overview = analyticsQuery.data;
  const detailedAnalyticsAvailable = overview?.is_premium_analytics !== false;

  const calculated = useMemo(
    () => ({
      views: sum(currentRows, 'views'),
      clicks: sum(currentRows, 'clicks'),
      leads: sum(currentRows, 'leads'),
      previousViews: sum(previousRows, 'views'),
      previousClicks: sum(previousRows, 'clicks'),
      previousLeads: sum(previousRows, 'leads'),
    }),
    [currentRows, previousRows]
  );

  const metrics = useMemo(() => {
    const useOverview = period === 30 && Boolean(overview);
    const views = useOverview ? number(overview?.views_30d) : calculated.views;
    const clicks = useOverview ? number(overview?.cta_clicks_30d) : calculated.clicks;
    const leads = useOverview ? number(overview?.leads_30d) : calculated.leads;
    return {
      views,
      clicks,
      leads,
      conversion: views ? (leads / views) * 100 : 0,
      viewsTrend: trend(views, calculated.previousViews),
      clicksTrend: trend(clicks, calculated.previousClicks),
      leadsTrend: trend(leads, calculated.previousLeads),
    };
  }, [calculated, overview, period]);

  const profileHealth = useMemo(() => {
    const requirements = [
      Boolean(company?.name),
      Boolean(company?.description),
      Boolean(company?.logo?.url || company?.logo_url),
      Boolean(company?.banner?.url || company?.banner_url),
      Boolean(company?.city && company?.state),
      Boolean(company?.website || company?.website_url),
      Boolean(company?.phone || company?.whatsapp),
      Boolean(company?.categories?.length),
    ];
    return Math.round((requirements.filter(Boolean).length / requirements.length) * 100);
  }, [company]);

  const actions = useMemo(() => {
    const list: Array<{
      title: string;
      description: string;
      icon: typeof PackageOpen;
      tab: string;
      color: string;
    }> = [];
    if (!company?.logo?.url && !company?.logo_url)
      list.push({
        title: 'Adicione a logo da empresa',
        description: 'Um perfil reconhecível transmite mais confiança.',
        icon: UserRound,
        tab: 'info',
        color: 'text-blue-600 bg-blue-50',
      });
    if (!company?.description)
      list.push({
        title: 'Complete as informações básicas',
        description: 'Perfis completos ajudam clientes a decidir.',
        icon: FileText,
        tab: 'info',
        color: 'text-blue-600 bg-blue-50',
      });
    if (!company?.website && !company?.website_url && !company?.whatsapp && !company?.phone)
      list.push({
        title: 'Ative um canal de orçamento',
        description: 'Assim visitantes poderão entrar em contato.',
        icon: PhoneCall,
        tab: 'info',
        color: 'text-amber-600 bg-amber-50',
      });
    if (number(company?.reviews_count) < 5)
      list.push({
        title: 'Convide clientes para avaliar',
        description: 'Avaliações reforçam confiança e conversão.',
        icon: Star,
        tab: 'reviews',
        color: 'text-violet-600 bg-violet-50',
      });
    if (number(metrics.leads) > 0)
      list.push({
        title: `Faça follow-up de ${metrics.leads} lead${metrics.leads === 1 ? '' : 's'}`,
        description: 'Responder cedo aumenta a chance de conversão.',
        icon: Clock3,
        tab: 'leads',
        color: 'text-emerald-600 bg-emerald-50',
      });
    if (!list.length)
      list.push({
        title: 'Seu perfil está em dia',
        description: 'Continue acompanhando seus dados e oportunidades.',
        icon: CheckCircle2,
        tab: 'analytics',
        color: 'text-emerald-600 bg-emerald-50',
      });
    return list.slice(0, 4);
  }, [company, metrics.leads]);

  const sources = useMemo(() => {
    const grouped = new Map<string, number>();
    (campaignsQuery.data?.campaigns || []).forEach((campaign) => {
      const source = campaign.utm_source || 'Não identificado';
      grouped.set(source, (grouped.get(source) || 0) + number(campaign.total_visits));
    });
    const total = Array.from(grouped.values()).reduce((acc, value) => acc + value, 0);
    return Array.from(grouped.entries())
      .map(([name, visits], index) => ({
        name,
        visits,
        percentage: total ? Math.round((visits / total) * 100) : 0,
        color: SOURCE_COLORS[index % SOURCE_COLORS.length],
      }))
      .sort((a, b) => b.visits - a.visits);
  }, [campaignsQuery.data]);

  const recentLeads = useMemo(
    () => (Array.isArray(leadsQuery.data) ? leadsQuery.data.slice(0, 6) : []),
    [leadsQuery.data]
  );
  const intentInsights = useMemo(() => {
    const data = intentQuery.data as IntentOverview | undefined;
    const insights: Array<{
      title: string;
      description: string;
      icon: typeof Target;
      color: string;
    }> = [];
    const hot =
      number(data?.intent_distribution?.hot) +
      number(data?.intent_distribution?.boiling) +
      number(data?.intent_distribution?.immediate);
    if (hot)
      insights.push({
        title: `${hot} contato${hot === 1 ? '' : 's'} com alta intenção`,
        description: 'Priorize uma resposta rápida para esses sinais.',
        icon: TrendingUp,
        color: 'text-emerald-600 bg-emerald-50',
      });
    if (number(data?.total_signals))
      insights.push({
        title: `${number(data?.total_signals)} sinais de intenção capturados`,
        description: 'Dados agregados do comportamento recente.',
        icon: Target,
        color: 'text-violet-600 bg-violet-50',
      });
    return insights.slice(0, 3);
  }, [intentQuery.data]);

  const exportDashboard = () => {
    const rows = [
      ['Métrica', 'Valor'],
      ['Período', formatRange(period)],
      ['Visualizações do perfil', String(metrics.views)],
      [
        'Interações (CTAs)',
        detailedAnalyticsAvailable ? String(metrics.clicks) : 'Indisponível no plano',
      ],
      ['Leads', detailedAnalyticsAvailable ? String(metrics.leads) : 'Indisponível no plano'],
      [
        'Taxa de conversão',
        detailedAnalyticsAvailable ? `${metrics.conversion.toFixed(2)}%` : 'Indisponível no plano',
      ],
    ];
    const csv = rows
      .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
    link.download = `visao-geral_${company?.slug || companyId}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const displayName = user?.name?.split(' ')[0] || 'você';
  const isLoading = analyticsQuery.isLoading || seriesQuery.isLoading;

  if (isLoading) {
    return <OverviewSkeleton />;
  }

  return (
    <div className="space-y-4 pb-10 text-[hsl(var(--dashboard-ink))]">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Olá, {displayName}!</h1>
          <p className="mt-1 text-sm text-[hsl(var(--dashboard-muted))]">
            Veja o desempenho do seu perfil e as oportunidades que precisam da sua atenção.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-10 items-center gap-2 rounded-lg border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] px-3 text-xs font-semibold text-[hsl(var(--dashboard-ink))]">
            <CalendarDays className="h-4 w-4 text-[hsl(var(--dashboard-muted))]" />
            <span className="hidden sm:inline">Período:</span>
            <select
              value={period}
              onChange={(event) => setPeriod(Number(event.target.value) as Period)}
              className="bg-transparent text-xs font-semibold outline-none"
            >
              {PERIODS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            variant="outline"
            onClick={exportDashboard}
            className="h-10 gap-2 border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] text-xs font-semibold text-[hsl(var(--dashboard-ink))] hover:bg-[hsl(var(--dashboard-surface))]"
          >
            <Download className="h-4 w-4" /> Exportar relatório
          </Button>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
        <div className="space-y-4">
          <div className="hidden lg:grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              icon={Eye}
              title="Visualizações do perfil"
              value={formatNumber(metrics.views)}
              comparison={metrics.viewsTrend}
              href={() => onNavigateToTab?.('analytics')}
            />
            <MetricCard
              icon={MousePointerClick}
              title="Interações (CTAs)"
              value={formatNumber(metrics.clicks)}
              comparison={metrics.clicksTrend}
              available={detailedAnalyticsAvailable}
              href={() => onNavigateToTab?.('analytics')}
            />
            <MetricCard
              icon={UsersRound}
              title="Leads"
              value={formatNumber(metrics.leads)}
              comparison={metrics.leadsTrend}
              available={detailedAnalyticsAvailable}
              href={() => onNavigateToTab?.('leads')}
            />
            <MetricCard
              icon={TrendingUp}
              title="Taxa de conversão"
              value={`${metrics.conversion.toFixed(2).replace('.', ',')}%`}
              comparison={trend(
                metrics.conversion,
                calculated.previousViews
                  ? (calculated.previousLeads / calculated.previousViews) * 100
                  : 0
              )}
              available={detailedAnalyticsAvailable}
              href={() => onNavigateToTab?.('analytics')}
            />
            <MetricCard icon={Clock3} title="Tempo médio de resposta" value="—" available={false} />
          </div>

          <section className="flex flex-col gap-3 rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] px-4 py-3 sm:flex-row sm:items-center">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[hsl(var(--dashboard-surface))] text-[hsl(var(--dashboard-accent))] shadow-sm">
              <Lightbulb className="h-5 w-5" />
            </span>
            <p className="flex-1 text-sm text-[hsl(var(--dashboard-ink))]">
              <strong className="text-[hsl(var(--dashboard-accent))]">Dica personalizada:</strong>{' '}
              {actions[0]?.description}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => onNavigateToTab?.(actions[0]?.tab || 'info')}
              className="h-9 shrink-0 border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] text-xs font-semibold text-[hsl(var(--dashboard-accent))] hover:bg-[hsl(var(--dashboard-surface))]"
            >
              Ver recomendações
            </Button>
          </section>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.9fr)]">
            <section className="rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold">Desempenho ao longo do tempo</h2>
                  <p className="mt-1 text-xs text-[hsl(var(--dashboard-muted))]">
                    Visualizações e interações no período selecionado.
                  </p>
                </div>
                <span className="rounded-md bg-[hsl(var(--dashboard-surface))] px-2 py-1 text-[11px] font-semibold text-[hsl(var(--dashboard-muted))]">
                  {formatRange(period)}
                </span>
              </div>
              {currentRows.length ? (
                <div className="h-[242px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={currentRows.map((row) => ({ ...row, label: formatDate(row.date) }))}
                      margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                    >
                      <CartesianGrid
                        vertical={false}
                        stroke="hsl(var(--dashboard-chart-grid))"
                        strokeDasharray="3 3"
                      />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: 'hsl(var(--dashboard-muted))', fontSize: 10 }}
                        minTickGap={26}
                      />
                      <YAxis
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: 'hsl(var(--dashboard-muted))', fontSize: 10 }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 10,
                          borderColor: 'hsl(var(--dashboard-border))',
                          fontSize: 12,
                        }}
                        labelStyle={{ fontWeight: 700 }}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="views"
                        name="Visualizações"
                        stroke="hsl(var(--dashboard-chart-1))"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="clicks"
                        name="Interações (CTAs)"
                        stroke="hsl(var(--dashboard-chart-2))"
                        strokeWidth={2.25}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart>
                  Os dados diários ainda estão sendo processados para este período.
                </EmptyChart>
              )}
            </section>

            <section className="rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold">Fontes rastreadas</h2>
                <CircleHelp className="h-3.5 w-3.5 text-[hsl(var(--dashboard-muted))]" />
              </div>
              <p className="mt-1 text-xs text-[hsl(var(--dashboard-muted))]">
                Origem baseada em campanhas UTM registradas.
              </p>
              {sources.length ? (
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-32 w-32 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sources}
                          dataKey="visits"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={38}
                          outerRadius={58}
                          paddingAngle={2}
                        >
                          {sources.map((source) => (
                            <Cell key={source.name} fill={source.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {sources.slice(0, 5).map((source) => (
                      <div
                        key={source.name}
                        className="flex items-center justify-between gap-2 text-[11px]"
                      >
                        <span className="flex min-w-0 items-center gap-1.5 truncate text-[hsl(var(--dashboard-muted))]">
                          <i
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: source.color }}
                          />
                          {source.name}
                        </span>
                        <strong className="shrink-0 text-[hsl(var(--dashboard-ink))]">
                          {source.percentage}%
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyChart>Nenhuma campanha UTM com visitas registradas ainda.</EmptyChart>
              )}
            </section>
          </div>

          <section className="overflow-hidden rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <div className="flex items-center justify-between border-b border-[hsl(var(--dashboard-border))] px-4 py-3.5">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold">Oportunidades recentes</h2>
                {recentLeads.length > 0 && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                    {recentLeads.length} recente{recentLeads.length === 1 ? '' : 's'}
                  </span>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onNavigateToTab?.('leads')}
                className="h-auto px-1 text-xs font-semibold text-blue-600 hover:bg-transparent hover:text-blue-700"
              >
                Ver todas <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
            {leadsQuery.isLoading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map((key) => (
                  <Skeleton key={key} className="h-12 w-full" />
                ))}
              </div>
            ) : recentLeads.length ? (
              <>
                {/* Mobile cards */}
                <div className="divide-y divide-slate-100 lg:hidden">
                  {recentLeads.map((lead) => (
                    <div key={lead.id} className="flex items-start gap-3 p-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-50 text-[11px] font-bold text-blue-700">
                        {(lead.name || '?').slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs font-semibold text-[hsl(var(--dashboard-ink))]">
                            {lead.name || 'Contato sem nome'}
                          </p>
                          <span
                            className={cn(
                              'shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold',
                              statusTone(lead.wizard_status)
                            )}
                          >
                            {statusLabel(lead.wizard_status)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-[hsl(var(--dashboard-muted))]">
                          {[lead.city, lead.state].filter(Boolean).join(', ') ||
                            'Local não informado'}
                        </p>
                        <p
                          className="mt-1 line-clamp-1 text-[11px] text-[hsl(var(--dashboard-muted))]"
                          title={lead.product_vertical || lead.project_profile || lead.message}
                        >
                          {lead.product_vertical ||
                            lead.project_profile ||
                            lead.message ||
                            'Solicitação de orçamento'}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="rounded-md bg-[hsl(var(--dashboard-surface))] px-2 py-0.5 text-[10px] font-semibold text-[hsl(var(--dashboard-muted))]">
                            {lead.utm_source || lead.referrer_host || 'Portal'}
                          </span>
                          <span className="text-[10px] text-[hsl(var(--dashboard-muted))]">
                            {formatRelativeDate(lead.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[760px] text-left">
                    <thead className="bg-[hsl(var(--dashboard-surface))] text-[10px] font-semibold uppercase tracking-wide text-[hsl(var(--dashboard-muted))]">
                      <tr>
                        <th className="px-4 py-2.5">Interessado</th>
                        <th className="px-3 py-2.5">Origem</th>
                        <th className="px-3 py-2.5">Interesse</th>
                        <th className="px-3 py-2.5">Recebido em</th>
                        <th className="px-3 py-2.5">Status</th>
                        <th className="px-3 py-2.5 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentLeads.map((lead) => (
                        <tr key={lead.id} className="text-xs">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-700">
                                {(lead.name || '?').slice(0, 2).toUpperCase()}
                              </span>
                              <div>
                                <p className="font-semibold text-[hsl(var(--dashboard-ink))]">
                                  {lead.name || 'Contato sem nome'}
                                </p>
                                <p className="text-[10px] text-[hsl(var(--dashboard-muted))]">
                                  {[lead.city, lead.state].filter(Boolean).join(', ') ||
                                    'Local não informado'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className="rounded-md bg-[hsl(var(--dashboard-surface))] px-2 py-1 text-[10px] font-semibold text-[hsl(var(--dashboard-muted))]">
                              {lead.utm_source || lead.referrer_host || 'Portal'}
                            </span>
                          </td>
                          <td className="max-w-[180px] px-3 py-3">
                            <p
                              className="truncate text-[hsl(var(--dashboard-muted))]"
                              title={lead.product_vertical || lead.project_profile || lead.message}
                            >
                              {lead.product_vertical ||
                                lead.project_profile ||
                                lead.message ||
                                'Solicitação de orçamento'}
                            </p>
                          </td>
                          <td className="px-3 py-3 text-[hsl(var(--dashboard-muted))]">
                            {formatRelativeDate(lead.created_at)}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={cn(
                                'rounded-md px-2 py-1 text-[10px] font-semibold',
                                statusTone(lead.wizard_status)
                              )}
                            >
                              {statusLabel(lead.wizard_status)}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => onNavigateToTab?.('leads')}
                              className="h-7 w-7 border-[hsl(var(--dashboard-border))]"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="grid min-h-[190px] place-items-center px-5 text-center">
                <div>
                  <PackageOpen className="mx-auto h-7 w-7 text-[hsl(var(--dashboard-muted))]" />
                  <p className="mt-3 text-sm font-semibold text-[hsl(var(--dashboard-ink))]">
                    {leadsQuery.isError
                      ? 'Não foi possível carregar as oportunidades'
                      : 'Nenhuma oportunidade recebida no momento'}
                  </p>
                  <p className="mt-1 text-xs text-[hsl(var(--dashboard-muted))]">
                    {leadsQuery.isError
                      ? 'Verifique o acesso ao módulo de leads e tente novamente.'
                      : 'Quando uma solicitação for atribuída à empresa, ela aparecerá aqui.'}
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <h2 className="text-sm font-bold">Status do perfil</h2>
            <div className="mt-4 flex items-center gap-4">
              <div
                className="grid h-20 w-20 shrink-0 place-items-center rounded-full"
                style={{
                  background: `conic-gradient(hsl(var(--dashboard-positive)) ${profileHealth * 3.6}deg, hsl(var(--dashboard-border)) 0deg)`,
                }}
              >
                <div className="grid h-[62px] w-[62px] place-items-center rounded-full bg-[hsl(var(--dashboard-panel))] text-lg font-bold">
                  {profileHealth}%
                </div>
              </div>
              <div>
                <p className="flex items-center gap-1 text-sm font-bold text-emerald-600">
                  <Star className="h-4 w-4 fill-current" />{' '}
                  {profileHealth >= 80
                    ? 'Muito bom'
                    : profileHealth >= 60
                      ? 'Em evolução'
                      : 'Precisa de atenção'}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[hsl(var(--dashboard-muted))]">
                  Complete os itens do perfil para melhorar a presença da empresa.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => onNavigateToTab?.('info')}
              className="mt-4 h-9 w-full border-blue-200 text-xs font-semibold text-blue-600"
            >
              Ver checklist
            </Button>
          </section>

          <section className="rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <div className="border-b border-[hsl(var(--dashboard-border))] px-4 py-3">
              <h2 className="text-sm font-bold">Próximas ações recomendadas</h2>
            </div>
            <div className="space-y-1 p-2">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.title}
                    type="button"
                    onClick={() => onNavigateToTab?.(action.tab)}
                    className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition hover:bg-[hsl(var(--dashboard-surface))]"
                  >
                    <span
                      className={cn(
                        'grid h-8 w-8 shrink-0 place-items-center rounded-lg',
                        action.color
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block text-xs text-[hsl(var(--dashboard-ink))]">
                        {action.title}
                      </strong>
                      <small className="mt-0.5 block text-[10px] leading-snug text-[hsl(var(--dashboard-muted))]">
                        {action.description}
                      </small>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[hsl(var(--dashboard-muted))]" />
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => onNavigateToTab?.('info')}
              className="flex w-full items-center justify-center gap-2 border-t border-[hsl(var(--dashboard-border))] py-3 text-xs font-semibold text-blue-600"
            >
              Ver todas as ações <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </section>

          <section className="rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <div className="flex items-center gap-2 border-b border-[hsl(var(--dashboard-border))] px-4 py-3">
              <h2 className="text-sm font-bold">Insights de intenção</h2>
              <span className="rounded-full bg-violet-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-violet-600">
                Beta
              </span>
            </div>
            {intentQuery.isLoading ? (
              <div className="space-y-3 p-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : intentInsights.length ? (
              <div className="space-y-2 p-2">
                {intentInsights.map((insight) => {
                  const Icon = insight.icon;
                  return (
                    <div key={insight.title} className="flex gap-3 rounded-lg p-2.5">
                      <span
                        className={cn(
                          'grid h-8 w-8 shrink-0 place-items-center rounded-lg',
                          insight.color
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <strong className="block text-xs text-[hsl(var(--dashboard-ink))]">
                          {insight.title}
                        </strong>
                        <p className="mt-0.5 text-[10px] leading-snug text-[hsl(var(--dashboard-muted))]">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-7 text-center">
                <BarChart3 className="mx-auto h-6 w-6 text-[hsl(var(--dashboard-muted))]" />
                <p className="mt-2 text-xs text-[hsl(var(--dashboard-muted))]">
                  Ainda não há sinais suficientes para gerar insights.
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => onNavigateToTab?.('leads')}
              className="flex w-full items-center justify-center gap-2 border-t border-[hsl(var(--dashboard-border))] py-3 text-xs font-semibold text-blue-600"
            >
              Ver oportunidades <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </section>
        </aside>
      </div>

      <footer className="flex flex-wrap items-center justify-center gap-3 pt-1 text-[11px] text-[hsl(var(--dashboard-muted))]">
        <span>
          Dados atualizados em{' '}
          {overview?.last_aggregated_at
            ? new Date(overview.last_aggregated_at).toLocaleString('pt-BR')
            : 'tempo real ou última consolidação disponível'}
        </span>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span>Dados da plataforma</span>
      </footer>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16 w-full" />
      {/* Mobile-first KPI skeleton: 2×2 em telas pequenas, desktop expandido */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-24 sm:h-32 lg:h-40" />
        ))}
      </div>
      <Skeleton className="h-16 w-full" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 lg:h-80" />
        <Skeleton className="h-64 lg:h-80" />
      </div>
      <Skeleton className="h-56 w-full lg:h-72" />
    </div>
  );
}
