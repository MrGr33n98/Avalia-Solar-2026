'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  TrendingUp, 
  FileText, 
  DollarSign, 
  Loader2,
  Eye,
  Star,
  LayoutDashboard,
  Building2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { useCompanyContext } from '@/context/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import DashboardLayout from './components/DashboardLayout';
import StatsCard from './components/StatsCard';
import ChartCard from './components/ChartCard';
import RecentActivity from './components/RecentActivity';
import DataTable from './components/DataTable';
import { DashboardCharts } from './components/DashboardCharts';
import { dashboardApi } from '@/lib/api-dashboard';
import EnterpriseDashboard from './components/EnterpriseDashboard';
import DashboardEnhanced from '@/components/dashboard/DashboardEnhanced';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, error: authError } = useAuth();
  const { activeCompany, companies, isLoading: companyLoading, selectCompany } = useCompanyContext();
  
  const [viewMode, setViewMode] = useState<'loading' | 'system_admin' | 'company_admin' | 'redirecting'>('loading');

  // Fetch dashboard stats from API (System Admin View)
  const { data: rawStats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.fetchStats,
    staleTime: 5 * 60 * 1000,
    enabled: viewMode === 'system_admin',
  });

  // Fetch chart data (System Admin View)
  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['dashboard-charts', 'companies'],
    queryFn: () => dashboardApi.fetchChartData('companies', 'monthly'),
    staleTime: 10 * 60 * 1000,
    enabled: viewMode === 'system_admin',
  });

  // Fetch recent proposals (System Admin View)
  const { data: tableData, isLoading: tableLoading } = useQuery({
    queryKey: ['dashboard-proposals'],
    queryFn: () => dashboardApi.fetchRecentProposals(10),
    staleTime: 2 * 60 * 1000,
    enabled: viewMode === 'system_admin',
  });

  useEffect(() => {
    if (authLoading || companyLoading) return;

    if (!user) {
      router.replace('/login?return_to=%2Fdashboard');
      setViewMode('redirecting');
      return;
    }

    if (user.role === 'review') {
      router.replace('/review-dashboard');
      setViewMode('redirecting');
      return;
    }

    // Role-based view determination
    if (user.role === 'admin' || user.role === 'super_admin') {
      setViewMode('system_admin');
    } else {
      // It's a company user (member/owner)
      if (activeCompany) {
        setViewMode('company_admin');
      } else if (companies.length === 1) {
        // Auto-select if only one company
        void selectCompany(companies[0]);
        setViewMode('company_admin');
      } else if (companies.length > 1) {
        // Multiple companies, none selected -> Redirect to selection page for Enterprise experience
        router.replace('/select-company');
        setViewMode('redirecting');
      } else {
        // No companies associated
        router.replace('/select-company');
        setViewMode('redirecting');
      }
    }
  }, [activeCompany, authLoading, companyLoading, companies, router, user, selectCompany]);

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
      <div className="flex h-screen w-full items-center justify-center bg-[hsl(var(--clay-bg))]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground font-medium animate-pulse">
            Preparando seu painel personalizado...
          </p>
        </div>
      </div>
    );
  }

  // COMPANY ADMIN VIEW - Enhanced Dashboard or Enterprise Dashboard
  if (viewMode === 'company_admin' && activeCompany) {
    // Use enhanced dashboard as default with fallback to enterprise
    return (
      <Suspense fallback={
        <div className="flex h-screen w-full items-center justify-center bg-slate-50">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-amber-500 mx-auto" />
            <p className="text-slate-600 font-medium animate-pulse">
              Carregando dashboard...
            </p>
          </div>
        </div>
      }>
        <DashboardEnhanced />
      </Suspense>
    );
  }

  // SYSTEM ADMIN VIEW - Enhanced Dashboard
  if (viewMode === 'system_admin') {
    if (statsError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Card className="max-w-xl w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-red-500" />
                Erro no Dashboard
              </CardTitle>
              <CardDescription>
                Não foi possível carregar os dados do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  {statsError instanceof Error ? statsError.message : 'Erro desconhecido'}
                </p>
                <Button onClick={() => window.location.reload()}>
                  Recarregar Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // For system admin, show enhanced dashboard with admin capabilities
    return (
      <Suspense fallback={
        <div className="flex h-screen w-full items-center justify-center bg-slate-50">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
            <p className="text-slate-600 font-medium animate-pulse">
              Carregando painel administrativo...
            </p>
          </div>
        </div>
      }>
        <DashboardEnhanced className="admin-view" />
      </Suspense>
    );
  }

  return null;
}
