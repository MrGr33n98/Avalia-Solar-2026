'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
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
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';
import { MetricsGrid } from './MetricCard';

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
import AdvancedAnalyticsIntegrated from './AdvancedAnalyticsIntegrated';

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

export default function CompanyDashboardRefactored({ companyId }: CompanyDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isDark, setIsDark] = useState(false);

  const fetchCompanyData = useCallback(async () => {
    try {
      // Mock data - replace with actual API call
      setCompany({
        id: companyId,
        name: 'Minha Empresa Premium',
        logo_url: '/placeholder-logo.jpg',
        verified: true,
        city: 'São Paulo',
        state: 'SP'
      });
    } catch (error) {
      console.error('Error fetching company:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const fetchDashboardStats = useCallback(async () => {
    // Mock data - replace with actual API call
    setStats({
      profileViews: 1234,
      ctaClicks: 89,
      whatsappClicks: 45,
      leadsReceived: 23,
      reviewsCount: 67,
      averageRating: 4.7,
      pendingApprovals: 3,
      activeCampaigns: 2,
      conversionRate: 7.2
    });
  }, []);

  const fetchNotifications = useCallback(async () => {
    // Mock notifications - replace with actual API call
    setNotifications([
      {
        id: '1',
        type: 'approval',
        title: 'Alteração Aprovada',
        message: 'Sua atualização de informações foi aprovada pelo admin.',
        timestamp: new Date(Date.now() - 3600000),
        read: false
      },
      {
        id: '2',
        type: 'review',
        title: 'Nova Avaliação',
        message: 'Você recebeu uma nova avaliação de 5 estrelas!',
        timestamp: new Date(Date.now() - 7200000),
        read: false
      },
      {
        id: '3',
        type: 'lead',
        title: 'Novo Lead',
        message: 'Um novo cliente em potencial entrou em contato.',
        timestamp: new Date(Date.now() - 86400000),
        read: true
      }
    ]);
  }, []);

  useEffect(() => {
    // Check system preference
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }

    fetchCompanyData();
    fetchDashboardStats();
    fetchNotifications();
  }, [companyId, fetchCompanyData, fetchDashboardStats, fetchNotifications]);

  const handleToggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

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
      change: '+12.5%',
      changeType: 'positive' as const,
      trend: [40, 55, 45, 70, 60, 85, 75]
    },
    {
      title: 'Cliques em CTAs',
      value: stats?.ctaClicks || 0,
      icon: Zap,
      color: 'purple',
      change: '+8.3%',
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
      change: '+5.2%',
      changeType: 'positive' as const,
      trend: [50, 55, 50, 60, 65, 70, 75]
    },
    {
      title: 'Rating Médio',
      value: stats?.averageRating?.toFixed(1) || '0.0',
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
      changeType: (stats?.pendingApprovals ? 'negative' : 'neutral') as 'positive' | 'negative' | 'neutral',
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
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <DashboardSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        pendingCount={stats?.pendingApprovals || 0}
      />

      {/* Header */}
      <DashboardHeader
        company={company}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        onToggleTheme={handleToggleTheme}
        isDark={isDark}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Main Content */}
      <motion.main
        initial={false}
        animate={{
          marginLeft: sidebarCollapsed ? '80px' : '280px',
          marginTop: '64px'
        }}
        transition={{ duration: 0.3 }}
        className="min-h-[calc(100vh-64px)] p-6"
      >
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Content based on active tab */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Page Header */}
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    Visão Geral
                  </h2>
                  <p className="text-muted-foreground">
                    Acompanhe o desempenho e as métricas da sua empresa em tempo real
                  </p>
                </div>

                {/* Metrics Grid */}
                <MetricsGrid metrics={metrics} />

                {/* Additional Overview Content */}
                <OverviewTab company={company} stats={stats} />
              </div>
            )}

            {activeTab === 'info' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    Minha Empresa
                  </h2>
                  <p className="text-muted-foreground">
                    Gerencie as informações e dados da sua empresa
                  </p>
                </div>
                <CompanyInfo companyId={companyId} />
              </div>
            )}

            {activeTab === 'categories' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    Categorias
                  </h2>
                  <p className="text-muted-foreground">
                    Selecione as categorias onde sua empresa estará presente
                  </p>
                </div>
                <CategoriesManagement companyId={companyId} />
              </div>
            )}

            {activeTab === 'banners' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    Banners & Patrocínios
                  </h2>
                  <p className="text-muted-foreground">
                    Gerencie suas campanhas publicitárias e patrocínios
                  </p>
                </div>
                <BannersSponsorship companyId={companyId} />
              </div>
            )}

            {activeTab === 'products' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    Produtos & Serviços
                  </h2>
                  <p className="text-muted-foreground">
                    Gerencie seu catálogo de produtos e serviços
                  </p>
                </div>
                <ProductsManagement companyId={companyId} />
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    Avaliações
                  </h2>
                  <p className="text-muted-foreground">
                    Gerencie e responda às avaliações dos clientes
                  </p>
                </div>
                <ReviewsManagement companyId={companyId} />
              </div>
            )}

            {activeTab === 'media' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    Galeria de Mídia
                  </h2>
                  <p className="text-muted-foreground">
                    Gerencie fotos e vídeos da sua empresa
                  </p>
                </div>
                <MediaGallery companyId={companyId} />
              </div>
            )}

            {activeTab === 'leads' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    Oportunidades
                  </h2>
                  <p className="text-muted-foreground">
                    Gerencie seus leads e oportunidades de negócio
                  </p>
                </div>
                <LeadsOpportunities companyId={companyId} />
              </div>
            )}

            {activeTab === 'campaigns' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    Campanhas
                  </h2>
                  <p className="text-muted-foreground">
                    Acompanhe o desempenho das suas campanhas de marketing
                  </p>
                </div>
                <CampaignsMarketing companyId={companyId} />
              </div>
            )}

            {activeTab === 'analytics' && (
              <div>
                <AdvancedAnalyticsIntegrated 
                  themeMode={isDark ? 'dark' : 'light'}
                  companyId={parseInt(companyId)}
                />
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    Configurações
                  </h2>
                  <p className="text-muted-foreground">
                    Ajuste as configurações da sua conta
                  </p>
                </div>
                <CompanySettings companyId={companyId} />
              </div>
            )}
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
}
