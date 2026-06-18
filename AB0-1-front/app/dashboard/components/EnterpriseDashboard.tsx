'use client';

import { useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Clock3, MessageCircle, PhoneCall, Wifi, WifiOff } from 'lucide-react';

// Layout Components
import EnterpriseSidebar from './EnterpriseSidebar';
import EnterpriseHeader from './EnterpriseHeader';
import MobileDashboardQuickAccess from './MobileDashboardQuickAccess';
import CompanyChatInbox from './CompanyChatInbox';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Hooks
import { useCompanyDashboardData } from '../hooks/useCompanyDashboardData';
import { useAuth } from '@/contexts/AuthContext';
import {
  trackDashboardViewed,
  trackChurnIntent,
  trackCheckoutStarted,
  track,
} from '@/lib/analytics/consolidated';
import { useToast } from '@/hooks/use-toast';
import { getFlatNavigationByContext } from '@/config/navigation';
import {
  getFeatureAccessEntry,
  isFeatureEnabled,
  isFeatureHiddenEntry,
  type FeatureAccessMap,
} from '@/lib/feature-access';

// Components
import ThemeToggle from './ThemeToggle';
import ApprovalsPanel from './ApprovalsPanel';
import FeatureGuard from './FeatureGuard';

// Lazy Loaded Feature Components for Performance
const CompanyInfo = dynamic(() => import('./CompanyInfo'), {
  loading: () => <DashboardTabSkeleton />,
});
const CategoriesManagement = dynamic(() => import('./CategoriesManagement'), {
  loading: () => <DashboardTabSkeleton />,
});
const BannersSponsorship = dynamic(() => import('./BannersSponsorship'), {
  loading: () => <DashboardTabSkeleton />,
});
const ProductsManagement = dynamic(() => import('./ProductsManagement'), {
  loading: () => <DashboardTabSkeleton />,
});
const ReviewsManagement = dynamic(() => import('./ReviewsManagement'), {
  loading: () => <DashboardTabSkeleton />,
});
const MediaGallery = dynamic(() => import('./MediaGallery'), {
  loading: () => <DashboardTabSkeleton />,
});
const LeadsOpportunities = dynamic(() => import('./LeadsOpportunities'), {
  loading: () => <DashboardTabSkeleton />,
});
const CampaignsMarketing = dynamic(() => import('./CampaignsMarketing'), {
  loading: () => <DashboardTabSkeleton />,
});
const CompanySettings = dynamic(() => import('./CompanySettings'), {
  loading: () => <DashboardTabSkeleton />,
});
const OverviewTab = dynamic(() => import('./OverviewTab'), {
  loading: () => <DashboardTabSkeleton />,
});
const PerformanceMetrics = dynamic(() => import('./PerformanceMetrics'), {
  loading: () => <DashboardTabSkeleton />,
});
const CompetitorBenchmark = dynamic(() => import('./CompetitorBenchmark'), {
  loading: () => <DashboardTabSkeleton />,
});
const StyleAnalysis = dynamic(() => import('./StyleAnalysis'), {
  loading: () => <DashboardTabSkeleton />,
});
const SectorQuestionsManager = dynamic(() => import('./SectorQuestionsManager'), {
  loading: () => <DashboardTabSkeleton />,
});
const TrustWidgetDashboard = dynamic(() => import('./TrustWidgetDashboard'), {
  loading: () => <DashboardTabSkeleton />,
});
const BadgesManagement = dynamic(() => import('./BadgesManagement'), {
  loading: () => <DashboardTabSkeleton />,
});
const RankingPerformanceTab = dynamic(() => import('./RankingPerformanceTab'), {
  loading: () => <DashboardTabSkeleton />,
});
const WebhooksManagement = dynamic(() => import('./WebhooksManagement'), {
  loading: () => <DashboardTabSkeleton />,
});

function DashboardTabSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-4 w-[400px]" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-[200px] rounded-xl" />
        <Skeleton className="h-[200px] rounded-xl" />
        <Skeleton className="h-[200px] rounded-xl" />
      </div>
      <Skeleton className="h-[400px] w-full rounded-xl" />
    </div>
  );
}

type DashboardChatCompany = {
  name?: string;
  plan_id?: number | string | null;
  plan_tier?: string | null;
  p2p_chat_enabled?: boolean;
  feature_access?: FeatureAccessMap;
  cta_whatsapp_enabled?: boolean;
  whatsapp_enabled?: boolean;
  cta_whatsapp_url?: string | null;
  whatsapp_url?: string | null;
  whatsapp?: string | null;
};

function CompanyChatTab({ company }: { company: DashboardChatCompany | null | undefined }) {
  const [isOnline, setIsOnline] = useState(true);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      setLastSeen(new Date());
    };

    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const chatEnabled =
    company?.p2p_chat_enabled === true &&
    (!company.feature_access || isFeatureEnabled(company.feature_access, 'p2p_chat'));
  const whatsappEnabled =
    company?.cta_whatsapp_enabled === true ||
    company?.whatsapp_enabled === true ||
    Boolean(company?.cta_whatsapp_url || company?.whatsapp_url || company?.whatsapp);
  const hasAnyChannel = chatEnabled || whatsappEnabled;
  const lastSeenLabel = lastSeen
    ? lastSeen.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : 'agora';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-2xl font-bold text-foreground lg:text-3xl">Atendimento</h2>
        <p className="text-sm text-slate-500">
          Acompanhe se sua empresa está disponível para receber contatos e conversas.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {isOnline ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Status do painel</p>
              <p className="text-lg font-black text-slate-950">
                {isOnline ? 'Online agora' : 'Offline'}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">Atualizado às {lastSeenLabel}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                chatEnabled ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'
              }`}
            >
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Chat direto</p>
              <p className="text-lg font-black text-slate-950">
                {chatEnabled ? 'Ativo' : 'Não configurado'}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {chatEnabled ? 'Disponível no perfil público' : 'Ative para receber conversas'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                whatsappEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
              }`}
            >
              <PhoneCall className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">WhatsApp</p>
              <p className="text-lg font-black text-slate-950">
                {whatsappEnabled ? 'Conectado' : 'Não configurado'}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {whatsappEnabled ? 'Canal pronto para leads' : 'Configure nas informações gerais'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-950">Disponibilidade no perfil</h3>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
                {hasAnyChannel
                  ? 'Sua empresa já possui pelo menos um canal de atendimento configurado. O status online considera a conexão atual deste painel.'
                  : 'Nenhum canal de atendimento foi encontrado. Configure WhatsApp ou chat direto para exibir atendimento ativo no perfil.'}
              </p>
            </div>
          </div>
          <div
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black ${
              isOnline && hasAnyChannel
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
            }`}
          >
            {isOnline && hasAnyChannel ? 'Atendimento disponível' : 'Ação recomendada'}
          </div>
        </CardContent>
      </Card>

      <CompanyChatInbox enabled={chatEnabled} />
    </div>
  );
}

interface CompanyDashboardProps {
  companyId: string;
}

const DASHBOARD_TAB_FEATURE_KEYS: Record<string, string> = {
  analytics: 'advanced_analytics',
  leads: 'leads_marketplace',
  integrations: 'webhooks',
  'product-banner': 'promo_banner',
  'product-sponsored-description': 'sponsored_description',
  'product-downloads': 'downloadable_materials',
  'product-videos': 'media_gallery',
  'product-images': 'media_gallery',
  media: 'media_gallery',
  chat: 'p2p_chat',
};

const ALWAYS_VISIBLE_TABS = new Set(['chat']);

const DASHBOARD_TAB_GUARD_COPY: Record<string, { title: string; description: string }> = {
  analytics: {
    title: 'Analytics avancado bloqueado',
    description: 'Seu plano atual nao inclui acesso completo a metricas avancadas.',
  },
  leads: {
    title: 'Leads do marketplace indisponiveis',
    description: 'Essa area depende de um plano com distribuicao de oportunidades.',
  },
  integrations: {
    title: 'Integracoes bloqueadas',
    description: 'Os recursos de webhook e integracao exigem upgrade de plano.',
  },
  'product-banner': {
    title: 'Banner promocional bloqueado',
    description: 'Seu plano atual nao libera gerenciamento de banner promocional.',
  },
  'product-sponsored-description': {
    title: 'Descricao patrocinada bloqueada',
    description: 'Esse espaco comercial so fica disponivel em planos elegiveis.',
  },
  'product-downloads': {
    title: 'Conteudo baixavel bloqueado',
    description: 'Seu plano atual nao permite publicar materiais para download.',
  },
  'product-videos': {
    title: 'Galeria de videos bloqueada',
    description: 'Seu plano atual nao inclui a galeria premium de midia.',
  },
  'product-images': {
    title: 'Galeria de imagens bloqueada',
    description: 'Seu plano atual nao inclui a galeria premium de midia.',
  },
  media: {
    title: 'Galeria de midia bloqueada',
    description: 'Seu plano atual nao inclui upload e gestao completos de midia.',
  },
  chat: {
    title: 'Atendimento direto bloqueado',
    description: 'Seu plano atual nao inclui chat direto com clientes pelo marketplace.',
  },
};

export default function EnterpriseDashboard({ companyId }: CompanyDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    loading,
    company,
    companyError,
    stats,
    featureAccess,
    notifications,
    markNotificationAsRead,
  } = useCompanyDashboardData(companyId);

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');
  const dashboardCompany = company as DashboardChatCompany | null;
  const dashboardPlanId = dashboardCompany?.plan_id;
  const dashboardPlanTier = dashboardCompany?.plan_tier;

  const tabAccessEntries = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(DASHBOARD_TAB_FEATURE_KEYS).map(([tabId, featureKey]) => [
          tabId,
          getFeatureAccessEntry(featureAccess, featureKey),
        ])
      ),
    [featureAccess]
  );

  const visibleTabIds = useMemo(
    () =>
      getFlatNavigationByContext('operational')
        .map((item) => item.id)
        .filter(
          (tabId) =>
            ALWAYS_VISIBLE_TABS.has(tabId) || !isFeatureHiddenEntry(tabAccessEntries[tabId])
        ),
    [tabAccessEntries]
  );

  const renderGuardedTab = useCallback(
    (tabId: string, children: ReactNode) => {
      const entry = tabAccessEntries[tabId];
      if (isFeatureHiddenEntry(entry) && !ALWAYS_VISIBLE_TABS.has(tabId)) return null;
      const visibleEntry =
        ALWAYS_VISIBLE_TABS.has(tabId) && isFeatureHiddenEntry(entry) ? null : entry;

      const copy = DASHBOARD_TAB_GUARD_COPY[tabId];
      if (!copy) return children;

      return (
        <FeatureGuard
          entry={visibleEntry}
          title={copy.title}
          description={copy.description}
          featureId={tabId}
        >
          {children}
        </FeatureGuard>
      );
    },
    [tabAccessEntries]
  );

  // Sync tab change with URL
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);

    // Canonical Dashboard View tracking
    trackDashboardViewed(companyId, tab, {
      plan_tier: dashboardPlanTier || 'free',
    });

    // Churn Intent Tracking
    if (tab === 'product-pricing' || tab === 'settings') {
      trackChurnIntent(`Visited ${tab} page`);
    }

    // Checkout/Upgrade Intent Tracking
    if (tab === 'analytics' || tab === 'leads') {
      const entry = tabAccessEntries[tab];
      if (entry && entry.state === 'locked') {
        trackCheckoutStarted(tab, dashboardPlanId);
      }
    }

    // Legacy/Internal Tracking
    track('Dashboard Tab Viewed', {
      tab_name: tab,
      company_id: companyId,
      user_id: user?.id,
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

  useEffect(() => {
    if (visibleTabIds.length === 0 || visibleTabIds.includes(activeTab)) return;

    const fallbackTab = visibleTabIds.includes('overview') ? 'overview' : visibleTabIds[0];
    if (!fallbackTab) return;

    setActiveTab(fallbackTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', fallbackTab);
    router.replace(`${pathname}?${params.toString()}`);
  }, [activeTab, pathname, router, searchParams, visibleTabIds]);

  const handleThemeChange = (theme: 'light' | 'dark') => {
    setThemeMode(theme);

    // Track using unified analytics
    track('Theme Changed', {
      theme_mode: theme,
      company_id: companyId,
      user_id: user?.id,
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

  // Track Checkout Success
  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout');
    if (checkoutStatus === 'success') {
      track('checkout_completed', {
        company_id: companyId,
        user_id: user?.id,
        plan_id: dashboardPlanId,
        plan_tier: dashboardPlanTier,
      });

      toast({
        title: 'Assinatura confirmada!',
        description: 'Seu plano foi atualizado com sucesso. Aproveite os novos recursos.',
        variant: 'default',
      });

      // Remove checkout query param
      const params = new URLSearchParams(searchParams.toString());
      params.delete('checkout');
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [searchParams, companyId, user, dashboardPlanId, dashboardPlanTier, pathname, router, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-white/40">Carregando dashboard...</p>
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
          <p className="text-sm text-white/40">
            Seu acesso ao dashboard está aguardando aprovação ou a empresa não está ativa.
          </p>
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
    <div className="min-h-screen bg-slate-50 transition-colors duration-300">
      {/* Sidebar (Drawer on mobile, Fixed on desktop) */}
      <EnterpriseSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pendingCount={stats?.pendingApprovals || 0}
        pendingReviewsCount={stats?.pendingReviewsCount || 0}
        visibleTabIds={visibleTabIds}
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
          <div className="max-w-[1400px] mx-auto p-4 lg:p-6">
            <MobileDashboardQuickAccess
              activeTab={activeTab}
              company={company}
              stats={stats}
              onTabChange={handleTabChange}
              onOpenNavigation={() => setSidebarOpen(true)}
              visibleTabIds={visibleTabIds}
            />

            {/* Content based on active tab using Shadcn Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-0">
              <TabsContent
                value="overview"
                className="mt-0 focus-visible:outline-none"
                data-tour="overview"
              >
                <OverviewTab
                  companyId={companyId}
                  company={company}
                  featureAccess={featureAccess}
                  themeMode={themeMode}
                  onNavigateToReviews={() => handleTabChange('reviews')}
                />
              </TabsContent>

              {/* Sprint 5: Ranking Performance Tab */}
              <TabsContent
                value="ranking-performance"
                className="mt-0 focus-visible:outline-none"
                data-tour="ranking"
              >
                <RankingPerformanceTab company={company} stats={stats} themeMode={themeMode} />
              </TabsContent>

              <TabsContent value="style-analysis" className="mt-0 focus-visible:outline-none">
                <StyleAnalysis themeMode={themeMode} />
              </TabsContent>

              <TabsContent value="integrations" className="mt-0 focus-visible:outline-none">
                {renderGuardedTab('integrations', <WebhooksManagement />)}
              </TabsContent>

              <TabsContent value="trust-widget" className="mt-0 focus-visible:outline-none">
                <TrustWidgetDashboard company={company} />
              </TabsContent>

              <TabsContent value="avalia-badges" className="mt-0 focus-visible:outline-none">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                      Selos Avalia Solar
                    </h2>
                    <p className="text-sm text-white/40">
                      Gerencie e compartilhe seus selos oficiais de distinção.
                    </p>
                  </div>
                  <BadgesManagement companyId={companyId} />
                </div>
              </TabsContent>

              <TabsContent
                value="analytics"
                className="mt-0 focus-visible:outline-none"
                data-tour="analytics"
              >
                {renderGuardedTab(
                  'analytics',
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                        Analytics Avançado
                      </h2>
                      <p className="text-sm text-white/40">
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
                    <p className="text-sm text-white/40">
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
                    <p className="text-sm text-white/40">
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
                    <p className="text-sm text-white/40">
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
                    <p className="text-sm text-white/40">
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
                    <p className="text-sm text-white/40">
                      Configure canais e informações de suporte para seus clientes.
                    </p>
                  </div>
                  <CompanySettings companyId={companyId} />
                </div>
              </TabsContent>

              <TabsContent value="product-banner" className="mt-0 focus-visible:outline-none">
                {renderGuardedTab(
                  'product-banner',
                  <div>
                    <div className="mb-6">
                      <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                        Banner
                      </h2>
                      <p className="text-sm text-white/40">
                        Gerencie seu banner e opções de patrocínio.
                      </p>
                    </div>
                    <BannersSponsorship companyId={companyId} />
                  </div>
                )}
              </TabsContent>

              <TabsContent
                value="product-sponsored-description"
                className="mt-0 focus-visible:outline-none"
              >
                {renderGuardedTab(
                  'product-sponsored-description',
                  <div>
                    <div className="mb-6">
                      <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                        Descrição patrocinada
                      </h2>
                      <p className="text-sm text-white/40">
                        Ajuste o conteúdo e a apresentação do seu produto.
                      </p>
                    </div>
                    <ProductsManagement companyId={companyId} />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="product-downloads" className="mt-0 focus-visible:outline-none">
                {renderGuardedTab(
                  'product-downloads',
                  <div>
                    <div className="mb-6">
                      <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                        Conteúdo Baixável
                      </h2>
                      <p className="text-sm text-slate-500">
                        Envie arquivos e materiais para seus clientes.
                      </p>
                    </div>
                    <MediaGallery companyId={companyId} mode="downloads" />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="product-features" className="mt-0 focus-visible:outline-none">
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                      Funcionalidades
                    </h2>
                    <p className="text-sm text-white/40">
                      Gerencie detalhes do produto e funcionalidades exibidas no Avaliasolar.
                    </p>
                  </div>
                  <ProductsManagement companyId={companyId} />
                </div>
              </TabsContent>

              <TabsContent value="product-videos" className="mt-0 focus-visible:outline-none">
                {renderGuardedTab(
                  'product-videos',
                  <div>
                    <div className="mb-6">
                      <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                        Vídeos
                      </h2>
                      <p className="text-sm text-slate-500">
                        Gerencie vídeos e mídias do seu produto.
                      </p>
                    </div>
                    <MediaGallery companyId={companyId} mode="videos" />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="product-images" className="mt-0 focus-visible:outline-none">
                {renderGuardedTab(
                  'product-images',
                  <div>
                    <div className="mb-6">
                      <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                        Imagens
                      </h2>
                      <p className="text-sm text-slate-500">Gerencie imagens do seu produto.</p>
                    </div>
                    <MediaGallery companyId={companyId} mode="photos" />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="info" className="mt-0 focus-visible:outline-none">
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                      Minha Empresa
                    </h2>
                    <p className="text-sm text-white/40">
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
                    <p className="text-sm text-white/40">
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
                    <p className="text-sm text-white/40">
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
                    <p className="text-sm text-white/40">
                      Gerencie seu catálogo de produtos e serviços
                    </p>
                  </div>
                  <ProductsManagement companyId={companyId} />
                </div>
              </TabsContent>

              <TabsContent
                value="reviews"
                className="mt-0 focus-visible:outline-none"
                data-tour="reviews"
              >
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                      Avaliações
                    </h2>
                    <p className="text-sm text-white/40">
                      Gerencie e responda às avaliações dos clientes
                    </p>
                  </div>
                  <ReviewsManagement companyId={companyId} />
                </div>
              </TabsContent>

              <TabsContent value="sector-questions" className="mt-0 focus-visible:outline-none">
                <div className="space-y-6">
                  <SectorQuestionsManager companyId={companyId} />
                </div>
              </TabsContent>

              <TabsContent value="media" className="mt-0 focus-visible:outline-none">
                {renderGuardedTab(
                  'media',
                  <div>
                    <div className="mb-6">
                      <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                        Galeria de Mídia
                      </h2>
                      <p className="text-sm text-white/40">
                        Gerencie fotos e vídeos da sua empresa
                      </p>
                    </div>
                    <MediaGallery companyId={companyId} />
                  </div>
                )}
              </TabsContent>

              <TabsContent
                value="leads"
                className="mt-0 focus-visible:outline-none"
                data-tour="leads"
              >
                {renderGuardedTab(
                  'leads',
                  <div>
                    <div className="mb-6">
                      <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                        Oportunidades
                      </h2>
                      <p className="text-sm text-white/40">
                        Gerencie seus leads e oportunidades de negócio
                      </p>
                    </div>
                    <LeadsOpportunities companyId={companyId} companyName={company?.name} />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="chat" className="mt-0 focus-visible:outline-none">
                {renderGuardedTab('chat', <CompanyChatTab company={company} />)}
              </TabsContent>

              <TabsContent value="approvals" className="mt-0 focus-visible:outline-none">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                      Aprovações
                    </h2>
                    <p className="text-sm text-white/40">
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
                    <p className="text-sm text-white/40">
                      Acompanhe o desempenho das suas campanhas de marketing
                    </p>
                  </div>
                  <CampaignsMarketing companyId={companyId} />
                </div>
              </TabsContent>

              <TabsContent
                value="settings"
                className="mt-0 focus-visible:outline-none"
                data-tour="settings"
              >
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                      Configurações
                    </h2>
                    <p className="text-sm text-white/40">Ajuste as configurações da sua conta</p>
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
