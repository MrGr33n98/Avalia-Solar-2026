'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { 
  Users, 
  TrendingUp, 
  FileText, 
  DollarSign, 
  Loader2,
  Eye,
  Star,
  LayoutDashboard
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { useCompanyContext } from '@/context/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import LoadingSpinner from '@/components/LoadingSpinner';

import DashboardLayout from './components/DashboardLayout';
import StatsCard from './components/StatsCard';
import ChartCard from './components/ChartCard';
import RecentActivity from './components/RecentActivity';
import DataTable from './components/DataTable';
import { DashboardCharts } from './components/DashboardCharts';
import { dashboardApi } from '@/lib/api-dashboard';

// ✅ Code splitting - lazy load EnterpriseDashboard for company users
const EnterpriseDashboard = dynamic(() => import('./components/EnterpriseDashboard'), {
  loading: () => <DashboardLoadingState />,
  ssr: true
});

function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, error: authError } = useAuth();
  const { activeCompany, companies, isLoading: companyLoading, selectCompany } = useCompanyContext();
  
  const [viewMode, setViewMode] = useState<'loading' | 'system_admin' | 'company_admin' | 'redirecting'>('loading');
  const [statsLoading, setStatsLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);

  // ✅ Lazy load system admin data only when needed
  const { data: rawStats, isLoading: statsLoadingQuery, error: statsError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.fetchStats,
    staleTime: 5 * 60 * 1000,
    enabled: viewMode === 'system_admin',
  });

  const { data: chartData, isLoading: chartLoadingQuery } = useQuery({
    queryKey: ['dashboard-charts', 'companies'],
    queryFn: () => dashboardApi.fetchChartData('companies', 'monthly'),
    staleTime: 10 * 60 * 1000,
    enabled: viewMode === 'system_admin',
  });

  const { data: tableData, isLoading: tableLoadingQuery } = useQuery({
    queryKey: ['dashboard-proposals'],
    queryFn: () => dashboardApi.fetchRecentProposals(10),
    staleTime: 2 * 60 * 1000,
    enabled: viewMode === 'system_admin',
  });

  // ✅ Sync loading states for smooth UX
  useEffect(() => {
    setStatsLoading(statsLoadingQuery);
    setChartLoading(chartLoadingQuery);
    setTableLoading(tableLoadingQuery);
  }, [statsLoadingQuery, chartLoadingQuery, tableLoadingQuery]);


  useEffect(() => {
    if (authLoading || companyLoading) return;

    if (!user) {
      router.replace('/login?return_to=%2Fdashboard');
      setViewMode('redirecting');
      return;
    }

    // O Studio possui uma rota própria; encaminha links antigos com tab=quote-form.
    if (searchParams.get('tab') === 'quote-form') {
      const companyId = activeCompany?.id ?? searchParams.get('company_id');
      if (companyId) {
        router.replace(`/dashboard/quote-form?company_id=${encodeURIComponent(String(companyId))}`);
        setViewMode('redirecting');
        return;
      }
    }

    // ✅ Identidade multi-contexto: role=review com CompanyMember ativo deve
    // permanecer no workspace empresarial — não ir para review-dashboard.
    // Só redireciona para review-dashboard se não tiver empresas associadas.
    if (user.role === 'review') {
      if (!companyLoading && companies.length === 0 && !activeCompany) {
        router.replace('/review-dashboard');
        setViewMode('redirecting');
        return;
      }
      // Continua o fluxo abaixo se tiver companies (review + membership)
    }

    // Admin view
    if (user.role === 'admin' || (user.role as string) === 'super_admin') {
      setViewMode('system_admin');
    } else {
      // Workspace empresarial: company user OU review com CompanyMember ativo
      if (activeCompany) {
        setViewMode('company_admin');
      } else if (companies.length === 1) {
        // Auto-select if only one company
        void selectCompany(companies[0]);
        setViewMode('company_admin');
      } else if (companies.length > 1) {
        // Multiple companies, none selected → chooser
        router.replace('/select-company');
        setViewMode('redirecting');
      } else if (user.role !== 'review') {
        // company role sem empresas → onboarding
        router.replace('/select-company');
        setViewMode('redirecting');
      }
      // review sem empresas já foi tratado acima (redirect para review-dashboard)
    }
  }, [activeCompany, authLoading, companyLoading, companies, router, searchParams, user, selectCompany]);

  if (authError) {
    return (
      <div className="flex h-[80vh] items-center justify-center px-4">
        <Card className="max-w-xl w-full clay-card">
          <CardHeader>
            <CardTitle>Erro ao carregar sessão</CardTitle>
            <CardDescription>
              Não foi possível validar sua sessão. Tente recarregar o dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="clay-btn-primary" onClick={() => window.location.reload()}>Recarregar Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (viewMode === 'loading' || viewMode === 'redirecting' || (viewMode === 'system_admin' && statsLoading)) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[hsl(var(--clay-bg))] p-4">
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="font-medium text-muted-foreground animate-pulse">
            Preparando seu painel personalizado...
          </p>
        </div>
      </div>
    );
  }

  // COMPANY ADMIN VIEW - Canonical Enterprise Dashboard
  if (viewMode === 'company_admin' && activeCompany) {
    return <EnterpriseDashboard companyId={String(activeCompany.id)} />;
  }

  // SYSTEM ADMIN VIEW
  if (viewMode === 'system_admin') {
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

    const dashboardStats = rawStats ? dashboardApi.transformToDashboardStats(rawStats) : null;

    const stats = dashboardStats ? [
      {
        title: 'Total de Empresas',
        value: dashboardStats.total_companies.value.toLocaleString('pt-BR'),
        icon: Users,
        iconColor: 'blue' as const,
      },
      {
        title: 'Propostas Ativas',
        value: dashboardStats.active_proposals.value.toLocaleString('pt-BR'),
        icon: FileText,
        iconColor: 'purple' as const,
      },
      {
        title: 'Taxa de Conversão',
        value: `${dashboardStats.conversion_rate.value.toFixed(1)}%`,
        icon: TrendingUp,
        iconColor: 'green' as const,
      },
      {
        title: 'Receita Total',
        value: `R$ ${(dashboardStats.total_revenue.value / 1000).toFixed(0)}K`,
        icon: DollarSign,
        iconColor: 'cyan' as const,
      },
    ] : [];

    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Page Header */}
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <LayoutDashboard className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Painel do Sistema</h1>
              <p className="text-muted-foreground mt-1">
                Visão geral consolidada do ecossistema Avalia Solar
              </p>
            </div>
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
              description="Novas empresas no ecossistema"
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
              title="Performance de Mercado"
              description="Volume de interações comerciais"
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
                <div className="clay-card p-8 min-h-[400px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <DataTable
                  title="Últimas Propostas Geradas"
                  data={tableData || []}
                />
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return null;
}

// ✅ Shared loading skeleton for lazy-loaded components

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoadingState />}>
      <DashboardPageContent />
    </Suspense>
  );
}

function DashboardLoadingState() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[hsl(var(--clay-bg))] p-4">
      <div className="text-center">
        <LoadingSpinner size="lg" text="Preparando seu painel personalizado..." />
      </div>
    </div>
  );
}
