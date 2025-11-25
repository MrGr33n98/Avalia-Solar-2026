'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Package, 
  Star, 
  Image as ImageIcon, 
  Target, 
  Megaphone,
  Settings,
  Bell,
  ChevronRight,
  TrendingUp,
  Users,
  Eye,
  MessageSquare,
  DollarSign,
  Award,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  BarChart3,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Zap,
  Sparkles
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { fetchApi } from '@/lib/api';

// Components for each section
import CompanyInfo from './components/CompanyInfo';
import CategoriesManagement from './components/CategoriesManagement';
import BannersSponsorship from './components/BannersSponsorship';
import ProductsManagement from './components/ProductsManagement';
import ReviewsManagement from './components/ReviewsManagement';
import MediaGallery from './components/MediaGallery';
import LeadsOpportunities from './components/LeadsOpportunities';
import CampaignsMarketing from './components/CampaignsMarketing';
import CompanySettings from './components/CompanySettings';

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

export default function CompanyDashboard({ companyId }: CompanyDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchCompanyData = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/companies/${companyId}`);
      const data = await response.json();
      setCompany(data.company);
    } catch (error) {
      console.error('Error fetching company:', error);
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
    fetchCompanyData();
    fetchDashboardStats();
    fetchNotifications();
  }, [companyId, fetchCompanyData, fetchDashboardStats, fetchNotifications]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Visualizações',
      value: stats?.profileViews || 0,
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12.5%',
      changeType: 'positive' as const
    },
    {
      title: 'Cliques em CTAs',
      value: stats?.ctaClicks || 0,
      icon: Zap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+8.3%',
      changeType: 'positive' as const
    },
    {
      title: 'WhatsApp',
      value: stats?.whatsappClicks || 0,
      icon: MessageSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+15.7%',
      changeType: 'positive' as const
    },
    {
      title: 'Leads',
      value: stats?.leadsReceived || 0,
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: '+23.1%',
      changeType: 'positive' as const
    },
    {
      title: 'Avaliações',
      value: stats?.reviewsCount || 0,
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      change: '+5.2%',
      changeType: 'positive' as const
    },
    {
      title: 'Rating Médio',
      value: stats?.averageRating || 0,
      icon: Award,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      change: '+0.3',
      changeType: 'positive' as const,
      format: 'decimal'
    },
    {
      title: 'Pendentes',
      value: stats?.pendingApprovals || 0,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      change: '-2',
      changeType: stats?.pendingApprovals ? 'negative' : 'neutral' as const
    },
    {
      title: 'Conversão',
      value: `${stats?.conversionRate || 0}%`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      change: '+1.8%',
      changeType: 'positive' as const
    }
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarImage src={company?.logo_url} alt={company?.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {company?.name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                  {company?.name}
                  {company?.verified && (
                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                  )}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Painel de Gestão Empresarial
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </Button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                      <div className="p-4 border-b border-border bg-muted/30">
                        <h3 className="font-semibold text-foreground">Notificações</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {unreadCount} não lidas
                        </p>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-4 border-b border-border hover:bg-muted/50 transition-colors cursor-pointer ${
                              !notif.read ? 'bg-primary/5' : ''
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`p-2 rounded-lg ${
                                notif.type === 'approval' ? 'bg-green-100' :
                                notif.type === 'review' ? 'bg-blue-100' :
                                notif.type === 'lead' ? 'bg-purple-100' :
                                'bg-yellow-100'
                              }`}>
                                {notif.type === 'approval' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                                {notif.type === 'review' && <Star className="h-4 w-4 text-blue-600" />}
                                {notif.type === 'lead' && <Target className="h-4 w-4 text-purple-600" />}
                                {notif.type === 'warning' && <AlertCircle className="h-4 w-4 text-yellow-600" />}
                              </div>
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-foreground">
                                  {notif.title}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {notif.message}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  {new Date(notif.timestamp).toLocaleString('pt-BR')}
                                </p>
                              </div>
                              {!notif.read && (
                                <div className="h-2 w-2 bg-primary rounded-full"></div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 border-t border-border bg-muted/30">
                        <Button variant="ghost" size="sm" className="w-full">
                          Ver todas as notificações
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">Visão Geral</h2>
            <p className="text-muted-foreground">
              Acompanhe o desempenho e as métricas da sua empresa
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsCards.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-all duration-300 border-muted hover:border-primary/20 group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                      <Badge variant={stat.changeType === 'positive' ? 'default' : stat.changeType === 'negative' ? 'destructive' : 'secondary'} className="text-xs">
                        {stat.change}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold text-foreground">
                        {typeof stat.value === 'number' && stat.format === 'decimal' 
                          ? stat.value.toFixed(1)
                          : typeof stat.value === 'number'
                          ? stat.value.toLocaleString('pt-BR')
                          : stat.value
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 lg:grid-cols-9 gap-2 h-auto p-2 bg-muted/50 rounded-xl">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="info" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Building2 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Empresa</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Categorias</span>
            </TabsTrigger>
            <TabsTrigger value="banners" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Sparkles className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Banners</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Package className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Produtos</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Star className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Reviews</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ImageIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Mídia</span>
            </TabsTrigger>
            <TabsTrigger value="leads" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Target className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Leads</span>
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Megaphone className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Campanhas</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <div className="mt-8">
            <TabsContent value="overview" className="space-y-6">
              <OverviewTab company={company} stats={stats} />
            </TabsContent>

            <TabsContent value="info">
              <CompanyInfo companyId={companyId} />
            </TabsContent>

            <TabsContent value="categories">
              <CategoriesManagement companyId={companyId} />
            </TabsContent>

            <TabsContent value="banners">
              <BannersSponsorship companyId={companyId} />
            </TabsContent>

            <TabsContent value="products">
              <ProductsManagement companyId={companyId} />
            </TabsContent>

            <TabsContent value="reviews">
              <ReviewsManagement companyId={companyId} />
            </TabsContent>

            <TabsContent value="media">
              <MediaGallery companyId={companyId} />
            </TabsContent>

            <TabsContent value="leads">
              <LeadsOpportunities companyId={companyId} />
            </TabsContent>

            <TabsContent value="campaigns">
              <CampaignsMarketing companyId={companyId} />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ company, stats }: { company: any; stats: DashboardStats | null }) {
  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Ações Rápidas
          </CardTitle>
          <CardDescription>
            Acesse rapidamente as funcionalidades mais utilizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Editar Informações', icon: Building2, color: 'text-blue-600', bgColor: 'bg-blue-50' },
              { label: 'Adicionar Produto', icon: Package, color: 'text-green-600', bgColor: 'bg-green-50' },
              { label: 'Ver Reviews', icon: Star, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
              { label: 'Gerenciar Leads', icon: Target, color: 'text-purple-600', bgColor: 'bg-purple-50' }
            ].map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto py-6 flex-col gap-3 hover:shadow-lg transition-all duration-300"
              >
                <div className={`p-3 rounded-xl ${action.bgColor}`}>
                  <action.icon className={`h-6 w-6 ${action.color}`} />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance do Perfil</CardTitle>
            <CardDescription>Últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Taxa de Conversão</span>
                <span className="font-bold">{stats?.conversionRate}%</span>
              </div>
              <Progress value={stats?.conversionRate || 0} className="h-2" />
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Engajamento</span>
                <span className="font-bold">78%</span>
              </div>
              <Progress value={78} className="h-2" />
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completude do Perfil</span>
                <span className="font-bold">85%</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximas Ações</CardTitle>
            <CardDescription>Tarefas pendentes e recomendações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { task: 'Responder 3 leads pendentes', urgent: true },
                { task: 'Atualizar fotos da galeria', urgent: false },
                { task: 'Revisar informações de contato', urgent: false },
                { task: 'Configurar CTAs personalizados', urgent: true }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    {item.urgent ? (
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm">{item.task}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>Últimas interações com sua empresa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { type: 'lead', text: 'Novo lead recebido de "João Silva"', time: '5 min atrás', icon: Target },
              { type: 'review', text: 'Nova avaliação de 5 estrelas', time: '2 horas atrás', icon: Star },
              { type: 'view', text: '127 visualizações no perfil hoje', time: '4 horas atrás', icon: Eye },
              { type: 'approval', text: 'Alteração de descrição aprovada', time: 'Ontem', icon: CheckCircle2 }
            ].map((activity, i) => (
              <div key={i} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className={`p-2 rounded-lg ${
                  activity.type === 'lead' ? 'bg-purple-100' :
                  activity.type === 'review' ? 'bg-yellow-100' :
                  activity.type === 'view' ? 'bg-blue-100' :
                  'bg-green-100'
                }`}>
                  <activity.icon className={`h-4 w-4 ${
                    activity.type === 'lead' ? 'text-purple-600' :
                    activity.type === 'review' ? 'text-yellow-600' :
                    activity.type === 'view' ? 'text-blue-600' :
                    'text-green-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
