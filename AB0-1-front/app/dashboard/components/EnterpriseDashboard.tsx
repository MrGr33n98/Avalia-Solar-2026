'use client';

import { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

// Layout Components
import EnterpriseSidebar from './EnterpriseSidebar';
import EnterpriseHeader from './EnterpriseHeader';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Hooks
import { useCompanyDashboardData } from '../hooks/useCompanyDashboardData';
import { useAuth } from '@/contexts/AuthContext';
import { track } from '@/lib/analytics';

// Components
import ThemeToggle from './ThemeToggle';
import ApprovalsPanel from './ApprovalsPanel';

// Lazy Loaded Feature Components for Performance
const CompanyInfo = dynamic(() => import('./CompanyInfo'), { loading: () => <DashboardTabSkeleton /> });
const CategoriesManagement = dynamic(() => import('./CategoriesManagement'), { loading: () => <DashboardTabSkeleton /> });
const BannersSponsorship = dynamic(() => import('./BannersSponsorship'), { loading: () => <DashboardTabSkeleton /> });
const ProductsManagement = dynamic(() => import('./ProductsManagement'), { loading: () => <DashboardTabSkeleton /> });
const ReviewsManagement = dynamic(() => import('./ReviewsManagement'), { loading: () => <DashboardTabSkeleton /> });
const MediaGallery = dynamic(() => import('./MediaGallery'), { loading: () => <DashboardTabSkeleton /> });
const LeadsOpportunities = dynamic(() => import('./LeadsOpportunities'), { loading: () => <DashboardTabSkeleton /> });
const CampaignsMarketing = dynamic(() => import('./CampaignsMarketing'), { loading: () => <DashboardTabSkeleton /> });
const CompanySettings = dynamic(() => import('./CompanySettings'), { loading: () => <DashboardTabSkeleton /> });
const OverviewTab = dynamic(() => import('./OverviewTab'), { loading: () => <DashboardTabSkeleton /> });
const ReviewsAnalytics = dynamic(() => import('./ReviewsAnalytics'), { loading: () => <DashboardTabSkeleton /> });
const PerformanceMetrics = dynamic(() => import('./PerformanceMetrics'), { loading: () => <DashboardTabSkeleton /> });
const CompetitorBenchmark = dynamic(() => import('./CompetitorBenchmark'), { loading: () => <DashboardTabSkeleton /> });
const StyleAnalysis = dynamic(() => import('./StyleAnalysis'), { loading: () => <DashboardTabSkeleton /> });

function DashboardTabSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-4 w-[400px]" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-[200px] rounded-xl" />
        <Skeleton className="h-[200px] rounded-xl" />
        <Skeleton className="h-[200px] rounded-xl" />
      </div>
      <Skeleton className="h-[400px] w-full rounded-xl" />
    </div>
  );
}

interface CompanyDashboardProps {
  companyId: string;
}

export default function EnterpriseDashboard({ companyId }: CompanyDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user } = useAuth();
  
  const { 
    loading, 
    company, 
    companyError, 
    stats, 
    notifications, 
    markNotificationAsRead 
  } = useCompanyDashboardData(companyId);

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');

  // Sync tab change with URL
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    // Track using unified analytics
    track('Dashboard Tab Viewed', {
      tab_name: tab,
      company_id: companyId,
      user_id: user?.id
    });

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

  const handleThemeChange = (theme: 'light' | 'dark') => {
    setThemeMode(theme);
    
    // Track using unified analytics
    track('Theme Changed', {
      theme_mode: theme,
      company_id: companyId,
      user_id: user?.id
    });

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

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
  }, []);

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

      <div className="lg:pl-[var(--enterprise-sidebar-width,280px)] flex flex-col min-h-screen">
        {/* Header */}
        <EnterpriseHeader
          company={company}
          notifications={notifications}
          onNotificationClick={markNotificationAsRead}
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
                <OverviewTab
                  companyId={companyId}
                  company={company}
                  themeMode={themeMode}
                  onNavigateToReviews={() => handleTabChange('reviews')}
                />
              </TabsContent>

              <TabsContent value="style-analysis" className="mt-0 focus-visible:outline-none">
                <StyleAnalysis themeMode={themeMode} />
              </TabsContent>

              <TabsContent value="integrations" className="mt-0 focus-visible:outline-none">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Integrações</h2>
                    <p className="text-sm text-muted-foreground">Conecte ferramentas e serviços ao seu painel.</p>
                  </div>
                  <Card>
                    <CardContent className="p-6 text-sm text-muted-foreground">
                      Em breve.
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="avalia-badges" className="mt-0 focus-visible:outline-none">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Selos Avalia Solar</h2>
                    <p className="text-sm text-muted-foreground">Gerencie e compartilhe seus selos no Avaliasolar.</p>
                  </div>
                  <Card>
                    <CardContent className="p-6 text-sm text-muted-foreground">
                      Em breve.
                    </CardContent>
                  </Card>
                </div>
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

              <TabsContent value="product-general" className="mt-0 focus-visible:outline-none">
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                      Informações gerais
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Atualize as informações principais do seu produto/empresa no Avaliasolar.
                    </p>
                  </div>
                  <CompanyInfo companyId={companyId} />
                </div>
              </TabsContent>

              <TabsContent value="product-categories" className="mt-0 focus-visible:outline-none">
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                      Categorias
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Selecione as categorias onde seu produto estará presente.
                    </p>
                  </div>
                  <CategoriesManagement companyId={companyId} />
                </div>
              </TabsContent>

              <TabsContent value="product-pricing" className="mt-0 focus-visible:outline-none">
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                      Planos e preços
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Ajuste configurações relacionadas ao seu plano e comercialização.
                    </p>
                  </div>
                  <CompanySettings companyId={companyId} />
                </div>
              </TabsContent>

              <TabsContent value="product-support" className="mt-0 focus-visible:outline-none">
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                      Suporte e treinamento
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Configure canais e informações de suporte para seus clientes.
                    </p>
                  </div>
                  <CompanySettings companyId={companyId} />
                </div>
              </TabsContent>

              <TabsContent value="product-banner" className="mt-0 focus-visible:outline-none">
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                      Banner
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Gerencie seu banner e opções de patrocínio.
                    </p>
                  </div>
                  <BannersSponsorship companyId={companyId} />
                </div>
              </TabsContent>

              <TabsContent value="product-sponsored-description" className="mt-0 focus-visible:outline-none">
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                      Descrição patrocinada
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Ajuste o conteúdo e a apresentação do seu produto.
                    </p>
                  </div>
                  <ProductsManagement companyId={companyId} />
                </div>
              </TabsContent>

              <TabsContent value="product-downloads" className="mt-0 focus-visible:outline-none">
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                      Conteúdo Baixável
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Envie arquivos e materiais para seus clientes.
                    </p>
                  </div>
                  <MediaGallery companyId={companyId} />
                </div>
              </TabsContent>

              <TabsContent value="product-features" className="mt-0 focus-visible:outline-none">
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                      Funcionalidades
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Gerencie detalhes do produto e funcionalidades exibidas no Avaliasolar.
                    </p>
                  </div>
                  <ProductsManagement companyId={companyId} />
                </div>
              </TabsContent>

              <TabsContent value="product-videos" className="mt-0 focus-visible:outline-none">
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                      Vídeos
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Gerencie vídeos e mídias do seu produto.
                    </p>
                  </div>
                  <MediaGallery companyId={companyId} />
                </div>
              </TabsContent>

              <TabsContent value="product-images" className="mt-0 focus-visible:outline-none">
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                      Imagens
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Gerencie imagens do seu produto.
                    </p>
                  </div>
                  <MediaGallery companyId={companyId} />
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
