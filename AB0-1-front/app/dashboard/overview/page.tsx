'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, TrendingUp, FileText, DollarSign, Loader2 } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import StatsCard from '../components/StatsCard';
import ChartCard from '../components/ChartCard';
import RecentActivity from '../components/RecentActivity';
import DataTable from '../components/DataTable';
import { DashboardCharts } from '../components/DashboardCharts';
import { dashboardApi } from '@/lib/api-dashboard';
import type { DashboardStatsWithChanges, ChartDataPoint, RecentProposal } from '@/lib/api-dashboard';

export default function DashboardOverviewPage() {
  // Fetch dashboard stats from API
  const { data: rawStats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.fetchStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  // Fetch chart data
  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['dashboard-charts', 'companies'],
    queryFn: () => dashboardApi.fetchChartData('companies', 'monthly'),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch recent proposals
  const { data: tableData, isLoading: tableLoading } = useQuery({
    queryKey: ['dashboard-proposals'],
    queryFn: () => dashboardApi.fetchRecentProposals(10),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Transform stats to dashboard format
  const dashboardStats = rawStats ? dashboardApi.transformToDashboardStats(rawStats) : null;

  // Prepare stats array for cards
  const stats = dashboardStats ? [
    {
      title: 'Total de Empresas',
      value: dashboardStats.total_companies.value.toLocaleString('pt-BR'),
      change: { 
        value: dashboardStats.total_companies.change, 
        label: dashboardStats.total_companies.label 
      },
      icon: Users,
      iconColor: 'blue' as const,
    },
    {
      title: 'Propostas Ativas',
      value: dashboardStats.active_proposals.value.toLocaleString('pt-BR'),
      change: { 
        value: dashboardStats.active_proposals.change, 
        label: dashboardStats.active_proposals.label 
      },
      icon: FileText,
      iconColor: 'purple' as const,
    },
    {
      title: 'Taxa de Conversão',
      value: `${dashboardStats.conversion_rate.value.toFixed(1)}%`,
      change: { 
        value: dashboardStats.conversion_rate.change, 
        label: dashboardStats.conversion_rate.label 
      },
      icon: TrendingUp,
      iconColor: 'green' as const,
    },
    {
      title: 'Receita Total',
      value: `R$ ${(dashboardStats.total_revenue.value / 1000).toFixed(0)}K`,
      change: { 
        value: dashboardStats.total_revenue.change, 
        label: dashboardStats.total_revenue.label 
      },
      icon: DollarSign,
      iconColor: 'cyan' as const,
    },
  ] : [];

  // Show loading state
  if (statsLoading || !dashboardStats) {
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
  if (statsError) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-destructive font-semibold">Erro ao carregar dados do dashboard</p>
            <p className="text-muted-foreground text-sm">
              {statsError instanceof Error ? statsError.message : 'Erro desconhecido'}
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
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Visão geral das métricas e atividades do sistema
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-2">
          <ChartCard
            title="Crescimento Mensal"
            description="Número de novas empresas cadastradas"
          >
            {chartLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <DashboardCharts.AreaChart data={chartData || []} />
            )}
          </ChartCard>

          <ChartCard
            title="Performance de Vendas"
            description="Receita mensal em milhares de reais"
          >
            {chartLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <DashboardCharts.BarChart data={chartData || []} />
            )}
          </ChartCard>
        </div>

        {/* Activity & Table Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <RecentActivity />
          </div>

          <div className="lg:col-span-2">
            {tableLoading ? (
              <div className="clay-card p-8">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              </div>
            ) : (
              <DataTable 
                title="Propostas Recentes"
                data={tableData || []}
              />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
