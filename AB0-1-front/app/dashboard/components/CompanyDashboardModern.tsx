'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  Eye, 
  Star, 
  Users,
  FileText,
  Loader2,
  BarChart3
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import StatsCard from '../components/StatsCard';
import ChartCard from '../components/ChartCard';
import { DashboardCharts } from '../components/DashboardCharts';
import { useCompanyDashboardData } from '../hooks/useCompanyDashboardData';

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
      value: (stats.profile_views || 0).toLocaleString('pt-BR'),
      icon: Eye,
      iconColor: 'blue' as const,
    },
    {
      title: 'Avaliações',
      value: (stats.total_reviews || 0).toLocaleString('pt-BR'),
      icon: Star,
      iconColor: 'yellow' as const,
    },
    {
      title: 'Taxa de Conversão',
      value: `${(stats.conversion_rate || 0).toFixed(1)}%`,
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

  // Mock chart data - TODO: get from API
  const chartData = [
    { month: 'Jan', value: stats?.monthly_views?.[0] || 0 },
    { month: 'Fev', value: stats?.monthly_views?.[1] || 0 },
    { month: 'Mar', value: stats?.monthly_views?.[2] || 0 },
    { month: 'Abr', value: stats?.monthly_views?.[3] || 0 },
    { month: 'Mai', value: stats?.monthly_views?.[4] || 0 },
    { month: 'Jun', value: stats?.monthly_views?.[5] || 0 },
  ];

  // Show loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Carregando dashboard...</p>
          </div>
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
              {companyError?.message || 'Empresa não encontrada'}
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
            description="Número de visualizações do perfil"
          >
            <DashboardCharts.AreaChart data={chartData} />
          </ChartCard>

          <ChartCard
            title="Evolução de Avaliações"
            description="Crescimento de reviews ao longo do tempo"
          >
            <DashboardCharts.LineChart data={chartData} />
          </ChartCard>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-3">
          <button 
            className="clay-card p-6 hover:scale-[1.02] transition-transform cursor-pointer"
            onClick={() => window.location.href = `/dashboard/company?tab=info`}
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
            onClick={() => window.location.href = `/dashboard/company?tab=reviews`}
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
            onClick={() => window.location.href = `/dashboard/company?tab=analytics`}
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
