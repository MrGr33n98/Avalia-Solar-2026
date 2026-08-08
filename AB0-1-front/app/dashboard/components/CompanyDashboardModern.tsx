'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import { 
  TrendingUp, 
  Eye, 
  Star, 
  Users,
  FileText,
  BarChart3
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import StatsCard from '../components/StatsCard';
import ChartCard from '../components/ChartCard';
import { DashboardCharts } from '../components/DashboardCharts';
import { useCompanyDashboardData } from '../hooks/useCompanyDashboardData';
import LoadingSpinner from '@/components/LoadingSpinner';

interface CompanyDashboardModernProps {
  companyId: string;
}

export default function CompanyDashboardModern({ companyId }: CompanyDashboardModernProps) {
  const { 
    loading, 
    company, 
    companyError, 
    stats
  } = useCompanyDashboardData(companyId);

  // Prepare stats for cards
  const dashboardStats = stats ? [
    {
      title: 'Total de Visualizações',
      value: (stats.profileViews || 0).toLocaleString('pt-BR'),
      icon: Eye,
      iconColor: 'blue' as const,
    },
    {
      title: 'Avaliações',
      value: (stats.reviewsCount || 0).toLocaleString('pt-BR'),
      icon: Star,
      iconColor: 'yellow' as const,
    },
    {
      title: 'Taxa de Conversão',
      value: `${(stats.conversionRate || 0).toFixed(1)}%`,
      icon: TrendingUp,
      iconColor: 'green' as const,
    },
    {
      title: 'Leads Recebidos',
      value: (stats.leads_count || 0).toLocaleString('pt-BR'),
      icon: Users,
      iconColor: 'purple' as const,
    },
  ] : [];

  // REQ-004: Conectar gráfico ao endpoint timeseries real. monthly_views não existe no backend.
  const timeseriesQuery = useQuery<{ data: Array<{ date: string; views: number; clicks: number; leads: number }> }>({
    queryKey: ['company-timeseries-chart', companyId],
    queryFn: () =>
      fetchApi('/company_dashboard/analytics/timeseries', {
        params: { company_id: companyId, days: 180 }, // ~6 meses
      }),
    enabled: Boolean(companyId),
    staleTime: 10 * 60 * 1000,
  });

  // Agrupa dados do timeseries por mês para o gráfico
  const chartData = useMemo(() => {
    const raw = timeseriesQuery.data?.data ?? [];
    if (raw.length === 0) return [];
    const byMonth: Record<string, number> = {};
    for (const point of raw) {
      const d = new Date(point.date);
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      byMonth[label] = (byMonth[label] ?? 0) + (point.views ?? 0);
    }
    return Object.entries(byMonth)
      .slice(-6)
      .map(([month, value]) => ({ month, value }));
  }, [timeseriesQuery.data]);

  const chartReady = !timeseriesQuery.isLoading && chartData.length > 0;

  // Show loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-dvh items-center justify-center px-4 pb-[var(--safe-area-inset-bottom)] pt-[var(--safe-area-inset-top)]">
          <LoadingSpinner size="lg" text="Carregando dashboard..." />
        </div>
      </DashboardLayout>
    );
  }

  // Show error state
  if (companyError || !company) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-destructive font-semibold">Erro ao carregar dados da empresa</p>
            <p className="text-muted-foreground text-sm">
              {companyError || 'Empresa não encontrada'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="clay-btn-primary px-4 py-2"
            >
              Recarregar
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
          <p className="text-muted-foreground mt-2">
            Visão geral da performance e métricas da empresa
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {dashboardStats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-2">
          <ChartCard
            title="Visualizações Mensais"
            description={chartReady ? 'Visualizações reais dos últimos 6 meses' : 'Histórico indisponível ou em processamento'}
          >
            {chartReady ? (
              <DashboardCharts.AreaChart data={chartData} />
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                {timeseriesQuery.isLoading ? 'Carregando...' : 'Sem dados suficientes ainda'}
              </div>
            )}
          </ChartCard>

          <ChartCard
            title="Evolução de Avaliações"
            description={chartReady ? 'Baseado em dados transacionais reais' : 'Histórico indisponível ou em processamento'}
          >
            {chartReady ? (
              <DashboardCharts.LineChart data={chartData} />
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                {timeseriesQuery.isLoading ? 'Carregando...' : 'Sem dados suficientes ainda'}
              </div>
            )}
          </ChartCard>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-3">
          <button 
            className="clay-card p-6 hover:scale-[1.02] transition-transform cursor-pointer"
            onClick={() => window.location.href = `/dashboard?tab=info`}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <FileText className="h-6 w-6" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Editar Perfil</h3>
                <p className="text-sm text-muted-foreground">
                  Atualizar informações da empresa
                </p>
              </div>
            </div>
          </button>

          <button 
            className="clay-card p-6 hover:scale-[1.02] transition-transform cursor-pointer"
            onClick={() => window.location.href = `/dashboard?tab=reviews`}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent/10 text-accent">
                <Star className="h-6 w-6" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Gerenciar Avaliações</h3>
                <p className="text-sm text-muted-foreground">
                  Ver e responder avaliações
                </p>
              </div>
            </div>
          </button>

          <button 
            className="clay-card p-6 hover:scale-[1.02] transition-transform cursor-pointer"
            onClick={() => window.location.href = `/dashboard?tab=analytics`}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-secondary/10 text-secondary">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Ver Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Análises detalhadas e insights
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Recent Activity or Next Steps */}
        <div className="clay-card p-6">
          <h2 className="text-xl font-bold mb-4">Próximos Passos</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="h-2 w-2 rounded-full bg-primary mt-2" />
              <div>
                <p className="font-medium">Complete seu perfil</p>
                <p className="text-sm text-muted-foreground">
                  Perfis completos recebem até 3x mais visualizações
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="h-2 w-2 rounded-full bg-accent mt-2" />
              <div>
                <p className="font-medium">Incentive avaliações</p>
                <p className="text-sm text-muted-foreground">
                  Compartilhe seu link de avaliação com clientes satisfeitos
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="h-2 w-2 rounded-full bg-secondary mt-2" />
              <div>
                <p className="font-medium">Adicione produtos</p>
                <p className="text-sm text-muted-foreground">
                  Destaque seus produtos e serviços para gerar mais leads
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
