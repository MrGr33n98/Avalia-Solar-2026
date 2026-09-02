'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Loader2,
  RotateCw,
  Target,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DashboardLayout from '@/app/dashboard/components/DashboardLayout';

type Kpi = {
  pipeline_value_cents: number;
  weighted_pipeline_cents: number;
  won_revenue_cents: number;
  conversion_rate: number;
  average_ticket_cents: number;
  average_sales_cycle_days: number;
  open_deals: number;
  won_deals: number;
  lost_deals: number;
};

type FunnelItem = {
  stage: string;
  count: number;
  valor?: number;
  value_cents?: number;
};

type WinLossItem = {
  name: string;
  value: number;
  color?: string;
};

type RevenueByMonth = {
  month: string;
  realizado?: number;
  previsao?: number;
  won_cents?: number;
  pipeline_cents?: number;
};

type AnalyticsData = {
  kpis: Kpi;
  funnel: FunnelItem[];
  win_loss: WinLossItem[];
  revenue_by_month: RevenueByMonth[];
  loss_reasons?: WinLossItem[];
};

const WIN_LOSS_COLORS = ['#10B981', '#EF4444', '#F59E0B', '#6B7280', '#3B82F6', '#8B5CF6'];

function fmtBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
}

function KpiCard({
  icon: Icon,
  label,
  value,
  detail,
  highlight,
}: {
  icon: typeof Target;
  label: string;
  value: string;
  detail: string;
  highlight?: boolean;
}) {
  return (
    <Card className={`border shadow-xs ${highlight ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200 bg-white'}`}>
      <CardContent className="flex items-start gap-3.5 p-4">
        <div className={`rounded-lg p-2.5 text-white ${highlight ? 'bg-blue-700' : 'bg-blue-900'}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50">
      <p className="text-xs text-slate-400 italic">{message}</p>
    </div>
  );
}

export default function SalesAnalyticsReport() {
  const [period, setPeriod] = useState('this_month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUnauthorized(false);
    try {
      const res = await fetch(`/api/v1/sales/analytics?period=${period}`, { credentials: 'include' });

      if (res.status === 401 || res.status === 403) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `Erro ${res.status} ao carregar analytics.`);
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao conectar ao servidor.');
      console.error('[CRM] Analytics fetch error', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const kpis = data?.kpis;
  const funnel = (data?.funnel ?? []).map((item) => ({
    ...item,
    valor: item.valor ?? (item.value_cents ? Math.round(item.value_cents / 100) : 0),
  }));
  const winLoss = (data?.win_loss ?? data?.loss_reasons ?? []).map((item, idx) => ({
    ...item,
    color: item.color || WIN_LOSS_COLORS[idx % WIN_LOSS_COLORS.length],
  }));
  const revenueByMonth = (data?.revenue_by_month ?? []).map((item) => ({
    ...item,
    realizado: item.realizado ?? (item.won_cents ? Math.round(item.won_cents / 100) : 0),
    previsao: item.previsao ?? (item.pipeline_cents ? Math.round(item.pipeline_cents / 100) : 0),
  }));

  return (
    <DashboardLayout className="bg-slate-50/70">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="border-0 bg-blue-900 font-semibold text-white">Avalia Solar CRM</Badge>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Executive Intelligence
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Analytics & Performance Comercial
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Métricas reais do pipeline — dados extraídos diretamente do PostgreSQL.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[200px] border-slate-300 bg-white shadow-xs min-h-11">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this_month">Este Mês</SelectItem>
                <SelectItem value="last_month">Mês Passado</SelectItem>
                <SelectItem value="last_quarter">Último Trimestre</SelectItem>
                <SelectItem value="ytd">Acumulado do Ano</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={fetchAnalytics}
              variant="outline"
              className="min-h-11 border-slate-300 bg-white font-semibold text-slate-700"
              disabled={loading}
            >
              <RotateCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </header>

        {/* State Handling */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4" data-testid="analytics-loading">
            <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
            <p className="text-sm text-slate-500">Carregando dados do pipeline...</p>
          </div>
        )}

        {!loading && unauthorized && (
          <div className="flex flex-col items-center justify-center py-20 gap-4" data-testid="analytics-unauthorized">
            <XCircle className="h-10 w-10 text-amber-500" />
            <p className="font-semibold text-slate-900">Sessão expirada ou sem permissão</p>
            <a href="/auth/sign_in">
              <Button className="bg-blue-900 font-bold hover:bg-blue-950">Fazer Login</Button>
            </a>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4" data-testid="analytics-error">
            <AlertCircle className="h-10 w-10 text-red-500" />
            <p className="font-semibold text-slate-900">{error}</p>
            <Button onClick={fetchAnalytics} variant="outline" className="font-semibold">
              <RotateCw className="mr-2 h-4 w-4" /> Tentar Novamente
            </Button>
          </div>
        )}

        {!loading && !error && !unauthorized && data !== null && (
          <>
            {/* KPI Grid */}
            {kpis && (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-testid="analytics-kpis">
                <KpiCard
                  icon={CircleDollarSign}
                  label="Pipeline Total"
                  value={fmtBRL(kpis.pipeline_value_cents)}
                  detail={`${kpis.open_deals} negócios em aberto`}
                  highlight
                />
                <KpiCard
                  icon={Target}
                  label="Pipeline Ponderado"
                  value={fmtBRL(kpis.weighted_pipeline_cents)}
                  detail="soma de valor × probabilidade"
                />
                <KpiCard
                  icon={CheckCircle2}
                  label="Receita Fechada"
                  value={fmtBRL(kpis.won_revenue_cents)}
                  detail={`${kpis.won_deals} negócios ganhos`}
                />
                <KpiCard
                  icon={TrendingUp}
                  label="Taxa de Conversão"
                  value={`${(kpis.conversion_rate * 100).toFixed(1)}%`}
                  detail={`Won / (Won + Lost)`}
                />
              </div>
            )}

            {kpis && (
              <div className="grid gap-3 sm:grid-cols-3">
                <KpiCard
                  icon={CircleDollarSign}
                  label="Ticket Médio"
                  value={fmtBRL(kpis.average_ticket_cents)}
                  detail="média de negócios fechados"
                />
                <KpiCard
                  icon={Clock}
                  label="Ciclo Médio de Venda"
                  value={kpis.average_sales_cycle_days > 0 ? `${kpis.average_sales_cycle_days} dias` : '—'}
                  detail="da criação ao fechamento"
                />
                <KpiCard
                  icon={Users}
                  label="Perdidos no Período"
                  value={String(kpis.lost_deals)}
                  detail="negócios marcados como Lost"
                />
              </div>
            )}

            {/* Revenue by Month Chart */}
            <Card className="border-slate-200 bg-white shadow-xs">
              <CardHeader className="border-b border-slate-100 p-5">
                <CardTitle className="text-base font-bold text-slate-900">Previsão Ponderada do Pipeline</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Receita realizada (Won) vs. pipeline ponderado por período
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                {revenueByMonth.length === 0 ? (
                  <EmptyChart message="Sem dados de receita para o período selecionado." />
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={revenueByMonth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#6B7280' }}
                        tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip formatter={(v: number) => fmtBRL(v * 100)} />
                      <Area
                        type="monotone"
                        dataKey="realizado"
                        name="Realizado (Won)"
                        stroke="#1E3A8A"
                        strokeWidth={2}
                        fill="url(#colorReal)"
                      />
                      <Area
                        type="monotone"
                        dataKey="previsao"
                        name="Pipeline Ponderado"
                        stroke="#60A5FA"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        fill="url(#colorPrev)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Funnel + Win/Loss */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-slate-200 bg-white shadow-xs">
                <CardHeader className="border-b border-slate-100 p-5">
                  <CardTitle className="text-base font-bold text-slate-900">Funil de Vendas</CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Oportunidades por estágio do pipeline
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  {funnel.length === 0 ? (
                    <EmptyChart message="Nenhum dado de funil para o período selecionado." />
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart
                        data={funnel}
                        layout="vertical"
                        margin={{ top: 0, right: 10, left: 40, bottom: 0 }}
                      >
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="stage"
                          type="category"
                          tick={{ fontSize: 11, fill: '#374151' }}
                          tickLine={false}
                          axisLine={false}
                          width={90}
                        />
                        <Tooltip
                          formatter={(val: number, name: string) =>
                            name === 'count' ? [`${val} negócios`, 'Quantidade'] : [fmtBRL(val * 100), 'Valor']
                          }
                        />
                        <Bar dataKey="count" fill="#1E3A8A" radius={[0, 4, 4, 0]} maxBarSize={22} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white shadow-xs">
                <CardHeader className="border-b border-slate-100 p-5">
                  <CardTitle className="text-base font-bold text-slate-900">Motivos de Perda</CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Distribuição de negócios Won vs. categorias de Lost
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  {winLoss.length === 0 ? (
                    <EmptyChart message="Nenhum dado de Win/Loss para o período selecionado." />
                  ) : (
                    <div className="flex items-center gap-6">
                      <ResponsiveContainer width="50%" height={200}>
                        <PieChart>
                          <Pie
                            data={winLoss}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {winLoss.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => `${v}%`} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-col gap-2">
                        {winLoss.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            <span
                              className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-slate-700 font-medium">{item.name}</span>
                            <span className="font-bold text-slate-900">{item.value}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {!loading && !error && !unauthorized && data === null && (
          <div className="flex flex-col items-center justify-center py-20 gap-4" data-testid="analytics-empty">
            <BarChart3 className="h-10 w-10 text-slate-300" />
            <p className="font-semibold text-slate-700">Nenhum dado disponível para o período selecionado.</p>
            <p className="text-xs text-slate-500">
              Crie oportunidades no pipeline para que os dados apareçam aqui.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
