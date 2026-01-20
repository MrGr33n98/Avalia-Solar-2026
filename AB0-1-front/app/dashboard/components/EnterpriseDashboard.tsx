'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { 
  Eye,
  Zap,
  MessageSquare,
  Target,
  Star,
  Award,
  Clock,
  TrendingUp
} from 'lucide-react';

// Layout Components
import EnterpriseSidebar from './EnterpriseSidebar';
import EnterpriseHeader from './EnterpriseHeader';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Feature Components
import CompanyInfo from './CompanyInfo';
import CategoriesManagement from './CategoriesManagement';
import BannersSponsorship from './BannersSponsorship';
import ProductsManagement from './ProductsManagement';
import ReviewsManagement from './ReviewsManagement';
import MediaGallery from './MediaGallery';
import LeadsOpportunities from './LeadsOpportunities';
import CampaignsMarketing from './CampaignsMarketing';
import CompanySettings from './CompanySettings';
import OverviewTab from './OverviewTab';

// New Modern Analytics Components
import ReviewsAnalytics from './ReviewsAnalytics';
import PerformanceMetrics from './PerformanceMetrics';
import CompetitorBenchmark from './CompetitorBenchmark';
import ThemeToggle from './ThemeToggle';
import AzureOverview from './AzureOverview';
import StyleAnalysis from './StyleAnalysis';
import { fetchApi, companiesApi } from '@/lib/api';
import { subscribeCompanyDashboard } from '@/lib/cable';
import { useAuth } from '@/contexts/AuthContext';

interface CompanyDashboardProps {
  companyId: string;
}

interface DashboardStats {
  profileViews: number;
  ctaClicks: number;
  whatsappClicks: number;
  leadsReceived: number;
  reviewsCount: number;
  averageRating: number;
  pendingApprovals: number;
  activeCampaigns: number;
  conversionRate: number;
}

interface Notification {
  id: string;
  type: 'approval' | 'review' | 'lead' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export default function EnterpriseDashboard({ companyId }: CompanyDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sync tab change with URL
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Sync URL changes back to state (e.g. back button)
   useEffect(() => {
     const tab = searchParams.get('tab');
     if (tab && tab !== activeTab) {
       setActiveTab(tab);
     }
   }, [searchParams, activeTab]);
  const [company, setCompany] = useState<any>(null);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');
  const { user } = useAuth();

  const handleThemeChange = (theme: 'light' | 'dark') => {
    setThemeMode(theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const fetchCompanyData = useCallback(async () => {
    try {
      const data = await companiesApi.getById(Number(companyId));
      if (!data) {
        setCompanyError('Empresa não encontrada ou não associada à sua conta.');
      } else {
        setCompany(data);
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      setCompanyError('Falha ao carregar dados da empresa.');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const fetchDashboardStats = useCallback(async () => {
    try {
      const data = await fetchApi<{ stats: any }>(
        '/company_dashboard/stats',
        { params: { company_id: companyId } }
      );
      const s = data?.stats || {};
      setStats({
        profileViews: s.profile_views ?? 0,
        ctaClicks: s.cta_clicks ?? 0,
        whatsappClicks: s.whatsapp_clicks ?? 0,
        leadsReceived: s.leads_received ?? 0,
        reviewsCount: s.reviews_count ?? 0,
        averageRating: s.average_rating ?? 0,
        pendingApprovals: s.pending_approvals ?? 0,
        activeCampaigns: s.active_campaigns ?? 0,
        conversionRate: s.conversion_rate ?? 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  }, [companyId]);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await fetchApi<{ notifications: any[] }>(
        '/company_dashboard/notifications',
        { params: { company_id: companyId } }
      );
      const list = data?.notifications || [];
      setNotifications(
        list.map((n, idx) => ({
          id: `${n.type}-${n.timestamp ?? idx}-${idx}`,
          type: n.type,
          title: n.title,
          message: n.message,
          timestamp: new Date(n.timestamp),
          read: !!n.read,
        }))
      );
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [companyId]);

  useEffect(() => {
    // Load theme from localStorage or default to dark
    const savedTheme = localStorage.getItem('dashboard-theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'dark';
    setThemeMode(initialTheme);
    
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    fetchCompanyData();
    fetchDashboardStats();
    fetchNotifications();

    const unsubscribe = subscribeCompanyDashboard(companyId, () => {
      // Keep it simple: refetch on any realtime event
      fetchDashboardStats();
      fetchNotifications();
    });

    return unsubscribe;
  }, [companyId, fetchCompanyData, fetchDashboardStats, fetchNotifications]);

  const handleNotificationClick = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const metrics = [
    {
      title: 'Visualizações',
      value: stats?.profileViews || 0,
      icon: Eye,
      color: 'blue',
      change: '+23.5%',
      changeType: 'positive' as const,
      trend: [40, 55, 45, 70, 60, 85, 75]
    },
    {
      title: 'Cliques em CTAs',
      value: stats?.ctaClicks || 0,
      icon: Zap,
      color: 'purple',
      change: '+18.2%',
      changeType: 'positive' as const,
      trend: [30, 45, 60, 50, 65, 70, 80]
    },
    {
      title: 'WhatsApp',
      value: stats?.whatsappClicks || 0,
      icon: MessageSquare,
      color: 'green',
      change: '+15.7%',
      changeType: 'positive' as const,
      trend: [25, 35, 55, 45, 60, 75, 85]
    },
    {
      title: 'Leads',
      value: stats?.leadsReceived || 0,
      icon: Target,
      color: 'orange',
      change: '+23.1%',
      changeType: 'positive' as const,
      trend: [20, 40, 35, 50, 60, 70, 90]
    },
    {
      title: 'Avaliações',
      value: stats?.reviewsCount || 0,
      icon: Star,
      color: 'yellow',
      change: '+12.5%',
      changeType: 'positive' as const,
      trend: [50, 55, 50, 60, 65, 70, 75]
    },
    {
      title: 'Rating Médio',
      value: (Number(stats?.averageRating) || 0).toFixed(1),
      icon: Award,
      color: 'pink',
      change: '+0.3',
      changeType: 'positive' as const,
      trend: [60, 65, 70, 75, 80, 85, 90]
    },
    {
      title: 'Pendentes',
      value: stats?.pendingApprovals || 0,
      icon: Clock,
      color: 'orange',
      change: '-2',
      changeType: stats?.pendingApprovals ? 'negative' : 'neutral' as const,
      trend: [80, 70, 60, 50, 40, 30, 20]
    },
    {
      title: 'Conversão',
      value: `${stats?.conversionRate || 0}%`,
      icon: TrendingUp,
      color: 'emerald',
      change: '+1.8%',
      changeType: 'positive' as const,
      trend: [30, 35, 40, 50, 55, 65, 72]
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const notApproved = user && user.approved_by_admin === false;
  const companyInactive = company && company.status !== 'active';
  if (notApproved || companyInactive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Acesso pendente</h2>
          <p className="text-sm text-muted-foreground">Seu acesso ao dashboard está aguardando aprovação ou a empresa não está ativa.</p>
        </div>
      </div>
    );
  }

  if (companyError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-foreground">{companyError}</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Sidebar (Drawer on mobile, Fixed on desktop) */}
      <EnterpriseSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pendingCount={stats?.pendingApprovals || 0}
      />

      <div className="lg:pl-[260px] flex flex-col min-h-screen">
        {/* Header */}
        <EnterpriseHeader
          company={company}
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
          onMenuClick={() => setSidebarOpen(true)}
          onTabChange={handleTabChange}
          themeToggle={<ThemeToggle onThemeChange={handleThemeChange} />}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto p-4 lg:p-8">
            {/* Content based on active tab using Shadcn Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-0">
              <TabsContent value="overview" className="mt-0 focus-visible:outline-none">
                <AzureOverview 
                  metrics={metrics}
                  themeMode={themeMode}
                  companyId={companyId}
                  onNavigateToAnalytics={() => handleTabChange('analytics')}
                  onNavigateToBenchmark={() => handleTabChange('benchmark')}
                />
              </TabsContent>

              <TabsContent value="style-analysis" className="mt-0 focus-visible:outline-none">
                <StyleAnalysis themeMode={themeMode} />
              </TabsContent>

              <TabsContent value="analytics" className="mt-0 focus-visible:outline-none">
                {(company?.has_paid_plan || company?.plan_status === 'active') && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                        Analytics Avançado
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Métricas detalhadas de performance e engajamento
                      </p>
                    </div>
                    <PerformanceMetrics companyId={companyId} themeMode={themeMode} />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="benchmark" className="mt-0 focus-visible:outline-none">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                      Benchmark Competitivo
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Compare sua performance com os líderes da categoria
                    </p>
                  </div>
                  <CompetitorBenchmark companyId={companyId} themeMode={themeMode} />
                </div>
              </TabsContent>

              <TabsContent value="info" className="mt-0 focus-visible:outline-none">
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                      Minha Empresa
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Gerencie as informações e dados da sua empresa
                    </p>
                  </div>
                  <CompanyInfo companyId={companyId} />
                </div>
              </TabsContent>

              <TabsContent value="categories" className="mt-0 focus-visible:outline-none">
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                      Categorias
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Selecione as categorias onde sua empresa estará presente
                    </p>
                  </div>
                  <CategoriesManagement companyId={companyId} />
                </div>
              </TabsContent>

              <TabsContent value="banners" className="mt-0 focus-visible:outline-none">
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                      Banners & Patrocínios
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Gerencie suas campanhas publicitárias e patrocínios
                    </p>
                  </div>
                  <BannersSponsorship companyId={companyId} />
                </div>
              </TabsContent>

              <TabsContent value="products" className="mt-0 focus-visible:outline-none">
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                      Produtos & Serviços
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Gerencie seu catálogo de produtos e serviços
                    </p>
                  </div>
                  <ProductsManagement companyId={companyId} />
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="mt-0 focus-visible:outline-none">
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                      Avaliações
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Gerencie e responda às avaliações dos clientes
                    </p>
                  </div>
                  <ReviewsManagement companyId={companyId} />
                </div>
              </TabsContent>

              <TabsContent value="media" className="mt-0 focus-visible:outline-none">
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                      Galeria de Mídia
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Gerencie fotos e vídeos da sua empresa
                    </p>
                  </div>
                  <MediaGallery companyId={companyId} />
                </div>
              </TabsContent>

              <TabsContent value="leads" className="mt-0 focus-visible:outline-none">
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                      Oportunidades
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Gerencie seus leads e oportunidades de negócio
                    </p>
                  </div>
                  <LeadsOpportunities companyId={companyId} companyName={company?.name} />
                </div>
              </TabsContent>

              <TabsContent value="approvals" className="mt-0 focus-visible:outline-none">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                      Aprovações
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Acompanhe o status das alterações submetidas para aprovação
                    </p>
                  </div>
                  <ApprovalsPanel companyId={companyId} />
                </div>
              </TabsContent>

              <TabsContent value="campaigns" className="mt-0 focus-visible:outline-none">
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                      Campanhas
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Acompanhe o desempenho das suas campanhas de marketing
                    </p>
                  </div>
                  <CampaignsMarketing companyId={companyId} />
                </div>
              </TabsContent>

              <TabsContent value="settings" className="mt-0 focus-visible:outline-none">
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                      Configurações
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Ajuste as configurações da sua conta
                    </p>
                  </div>
                  <CompanySettings companyId={companyId} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}

function ApprovalsPanel({ companyId }: { companyId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchApi<{ pending_changes: any[] }>(
          '/company_dashboard/pending_changes',
          { params: { company_id: companyId } }
        );
        setItems(data?.pending_changes || []);
      } catch (e: any) {
        setError(e?.message || 'Falha ao carregar pendências');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [companyId]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando pendências...</p>;
  }
  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma alteração pendente.</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((pc) => (
        <Card key={pc.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{String(pc.change_type).replace(/_/g,' ').toUpperCase()}</p>
              <p className="text-xs text-muted-foreground">Criado em {new Date(pc.created_at).toLocaleString()}</p>
            </div>
            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
              Pendente
            </Badge>
          </CardContent>
          {pc.rejection_reason && (
            <div className="px-4 pb-4">
              <p className="text-xs text-destructive">Motivo da rejeição: {pc.rejection_reason}</p>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
