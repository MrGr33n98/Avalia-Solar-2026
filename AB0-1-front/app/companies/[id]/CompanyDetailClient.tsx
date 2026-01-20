'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  ImageIcon,
  BarChart3,
  Banknote,
  Edit,
  MessageCircle,
  ShieldCheck,
  Award,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Star,
  Users,
  Clock,
  MapPin,
  Globe,
  Phone,
  Mail,
  ExternalLink,
  Share2,
  Bookmark,
  Heart,
  Filter,
  Search,
  Bell,
  Settings,
  HelpCircle,
  Download,
  Printer,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Calendar,
  Target,
  Zap,
  Battery,
  Sun,
  Wind,
  Droplets,
  Thermometer,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { Company, Product, Review } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import CompanyInfo from '@/app/dashboard/components/CompanyInfo';
import { productsApiSafe, reviewsApiSafe } from '@/lib/api-client';

// Components
import CompanyHero from './components/CompanyHero';
import CompanySidebar from './components/CompanySidebar';
import CompanyOverview from './components/CompanyOverview';
import CompanyProducts from './components/CompanyProducts';
import CompanyReviews from './components/CompanyReviews';
import CompanyFinancing from './components/CompanyFinancing';
import { Context7Provider } from '@/app/context7/provider';
import MediaGallery from '@/app/dashboard/components/MediaGallery';
import analyticsApi, {
  ReviewAnalytics,
  TrafficSource,
  HistoricalData,
  CompanyAnalyticsSettings,
} from '@/lib/api-analytics';
import FaqSection from './components/FaqSection';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  Bar,
  BarChart,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

// Adicione esta importação
import { cn } from '@/lib/utils';

interface CompanyDetailClientProps {
  company: Company;
}

// Defina as cores para os gráficos
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function CompanyDetailClient({ company }: CompanyDetailClientProps) {
  const [currentCompany, setCurrentCompany] = useState<Company>(company);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reviewAnalytics, setReviewAnalytics] = useState<ReviewAnalytics | null>(null);
  const [trafficSources, setTrafficSources] = useState<TrafficSource[] | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData[] | null>(null);
  const [analyticsSettings, setAnalyticsSettings] = useState<CompanyAnalyticsSettings | null>(null);

  // Hero Image States
  const [bannerError, setBannerError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // UI States
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const analyticsEnabled = Boolean(process.env.NEXT_PUBLIC_ENABLE_ANALYTICS);

  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const canEdit = isAuthenticated && user?.role === 'company' && user?.company_id === company.id;

  const companyId = useMemo(
    () => Number((currentCompany as any)?.id || company?.id),
    [currentCompany?.id, company?.id],
  );

  // CTA States
  const enabledRawInit =
    (currentCompany as any).cta_whatsapp_enabled ?? (currentCompany as any).whatsapp_enabled;
  const [ctaEnabled, setCtaEnabled] = useState<boolean>(
    enabledRawInit === undefined || enabledRawInit === null ? true : Boolean(enabledRawInit),
  );
  const [ctaUrl, setCtaUrl] = useState<string | null>(
    (currentCompany as any).cta_whatsapp_url ||
      (currentCompany as any).whatsapp_url ||
      currentCompany.whatsapp ||
      null,
  );

  // Enhanced Tabs Configuration
  const tabs = [
    {
      id: 'overview',
      label: 'Visão Geral',
      icon: LayoutDashboard,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      id: 'products',
      label: 'Produtos',
      icon: Package,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      id: 'reviews',
      label: 'Avaliações',
      icon: MessageCircle,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      id: 'financing',
      label: 'Financiamento',
      icon: Banknote,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      id: 'gallery',
      label: 'Galeria',
      icon: ImageIcon,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
    {
      id: 'stats',
      label: 'Estatísticas',
      icon: BarChart3,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
    },
    {
      id: 'details',
      label: 'Detalhes',
      icon: ShieldCheck,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
    ...(canEdit ? [{
      id: 'edit',
      label: 'Editar',
      icon: Edit,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    }] : []),
  ];

  // Enhanced Metrics
  const companyStats = useMemo(() => {
    const avgRating = reviews.length > 0 
      ? reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length 
      : 0;

    return {
      rating: reviewAnalytics?.average_rating ?? avgRating,
      reviewCount: reviewAnalytics?.total_reviews ?? reviews.length,
      productCount: products.length,
      completedProjects: products.length * 10, // Mock
      yearsInBusiness: new Date().getFullYear() - new Date(company.created_at).getFullYear(),
      responseRate: '92%',
      satisfaction: '95%',
      retention: '87%',
    };
  }, [reviews, reviewAnalytics, products, company]);

  const leadsStats = useMemo(() => {
    const data = historicalData || [];
    const totalLeads = data.reduce((sum, d) => sum + (d.leads ?? 0), 0);
    const avgConversion = data.length
      ? Number(
          (
            data.reduce((sum, d) => sum + (d.conversion ?? 0), 0) / data.length
          ).toFixed(1),
        )
      : 0;
    return { totalLeads, avgConversion };
  }, [historicalData]);

  // Helper para URLs de imagem
  const getFullImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = (
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:3001'
    ).replace(/\/api.*$/, '');
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const bannerUrl = useMemo(() => getFullImageUrl(currentCompany?.banner_url), [currentCompany?.banner_url]);
  const logoUrl = useMemo(() => getFullImageUrl(currentCompany?.logo_url), [currentCompany?.logo_url]);

  // Fetch data
  useEffect(() => {
    if (!company?.id) {
      setError('Dados da empresa não encontrados');
      setProductsLoading(false);
      setReviewsLoading(false);
      return;
    }

    const fetchCompanyData = async () => {
      try {
        const cachedProducts = sessionStorage.getItem(`products_${company.id}`);
        const cachedReviews = sessionStorage.getItem(`reviews_${company.id}`);

        if (cachedProducts) {
          setProducts(JSON.parse(cachedProducts));
          setProductsLoading(false);
        }
        if (cachedReviews) {
          setReviews(JSON.parse(cachedReviews));
          setReviewsLoading(false);
        }

        const [productsResponse, reviewsResponse] = await Promise.allSettled([
          productsApiSafe.getAll({ company_id: company.id }),
          reviewsApiSafe.getAll({ company_id: company.id }),
        ]);

        if (productsResponse.status === 'fulfilled') {
          setProducts(productsResponse.value || []);
          sessionStorage.setItem(`products_${company.id}`, JSON.stringify(productsResponse.value));
        }

        if (reviewsResponse.status === 'fulfilled') {
          const onlyThisCompany = (reviewsResponse.value || []).filter(
            (r: any) => String((r as any).company_id) === String(company.id),
          );
          setReviews(onlyThisCompany);
          sessionStorage.setItem(`reviews_${company.id}`, JSON.stringify(onlyThisCompany));
        }

        setError(null);
      } catch (err) {
        console.error('Erro ao buscar dados da empresa:', err);
        setError('Erro ao carregar dados da empresa');
      } finally {
        setProductsLoading(false);
        setReviewsLoading(false);
      }
    };

    fetchCompanyData();
  }, [company?.id]);

  useEffect(() => {
    if (!company?.id) return;

    const makeHistoricalData = (days: number): HistoricalData[] => {
      const data: HistoricalData[] = [];
      const today = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        data.push({
          date: date.toISOString().split('T')[0],
          views: 0,
          clicks: 0,
          leads: 0,
          conversion: 0,
        });
      }
      return data;
    };

    if (!analyticsEnabled) {
      const total = reviews.length;
      if (total > 0) {
        const dist: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach((r) => {
          const key = Math.round(r.rating) as 1 | 2 | 3 | 4 | 5;
          if (dist[key] !== undefined) dist[key] += 1;
        });
        const avg = reviews.reduce((acc, r) => acc + r.rating, 0) / total;
        setReviewAnalytics({
          total_reviews: total,
          average_rating: Number(avg.toFixed(1)),
          rating_distribution: { 5: dist[5], 4: dist[4], 3: dist[3], 2: dist[2], 1: dist[1] },
          recent_reviews: reviews
            .slice()
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 10)
            .map((r) => ({
              id: r.id,
              rating: r.rating,
              comment: (r as any).comment || '',
              user_name: (r as any).user_name || 'Anônimo',
              created_at: r.created_at,
              verified: Boolean((r as any).verified),
            })),
        });
      } else {
        setReviewAnalytics({
          total_reviews: 0,
          average_rating: 0,
          rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          recent_reviews: [],
        });
      }
      setTrafficSources([]);
      setHistoricalData(makeHistoricalData(30));
      setAnalyticsSettings(null);
      return;
    }

    analyticsApi
      .getReviewAnalytics(company.id)
      .then((data) => {
        if ((!data || data.total_reviews === 0) && reviews.length > 0) {
          const total = reviews.length;
          const dist: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          reviews.forEach((r) => {
            const key = Math.round(r.rating) as 1 | 2 | 3 | 4 | 5;
            if (dist[key] !== undefined) dist[key] += 1;
          });
          const avg = reviews.reduce((acc, r) => acc + r.rating, 0) / total;
          setReviewAnalytics({
            total_reviews: total,
            average_rating: Number(avg.toFixed(1)),
            rating_distribution: {
              5: dist[5],
              4: dist[4],
              3: dist[3],
              2: dist[2],
              1: dist[1],
            },
            recent_reviews: reviews
              .slice()
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 10)
              .map((r) => ({
                id: r.id,
                rating: r.rating,
                comment: (r as any).comment || '',
                user_name: (r as any).user_name || 'Anônimo',
                created_at: r.created_at,
                verified: Boolean((r as any).verified),
              })),
          });
        } else {
          setReviewAnalytics(data);
        }
      })
      .catch(() => {
        const total = reviews.length;
        if (total > 0) {
          const dist: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          reviews.forEach((r) => {
            const key = Math.round(r.rating) as 1 | 2 | 3 | 4 | 5;
            if (dist[key] !== undefined) dist[key] += 1;
          });
          const avg = reviews.reduce((acc, r) => acc + r.rating, 0) / total;
          setReviewAnalytics({
            total_reviews: total,
            average_rating: Number(avg.toFixed(1)),
            rating_distribution: {
              5: dist[5],
              4: dist[4],
              3: dist[3],
              2: dist[2],
              1: dist[1],
            },
            recent_reviews: reviews
              .slice()
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 10)
              .map((r) => ({
                id: r.id,
                rating: r.rating,
                comment: (r as any).comment || '',
                user_name: (r as any).user_name || 'Anônimo',
                created_at: r.created_at,
                verified: Boolean((r as any).verified),
              })),
          });
        } else {
          setReviewAnalytics({
            total_reviews: 0,
            average_rating: 0,
            rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            recent_reviews: [],
          });
        }
      });

    analyticsApi
      .getTrafficSources(company.id)
      .then((data) => setTrafficSources(data))
      .catch(() => setTrafficSources([]));

    analyticsApi
      .getHistoricalData(company.id, 30)
      .then((data) => setHistoricalData(data))
      .catch(() => setHistoricalData([]));

    analyticsApi
      .getAnalyticsSettings(company.id)
      .then((s) => setAnalyticsSettings(s))
      .catch(() => setAnalyticsSettings(null));
  }, [company?.id, reviews, canEdit, analyticsEnabled]);

  // Real-time Updates (Polling & Visibility)
  useEffect(() => {
    const refreshCompany = async () => {
      try {
        const refreshed = await (await import('@/lib/api')).companiesApi.getById(company.id);
        if (refreshed) {
          setCurrentCompany(refreshed);

          const enabledRaw = (refreshed as any).cta_whatsapp_enabled ?? (refreshed as any).whatsapp_enabled;
          setCtaEnabled(enabledRaw === undefined || enabledRaw === null ? true : Boolean(enabledRaw));
          setCtaUrl(
            (refreshed as any).cta_whatsapp_url ||
              (refreshed as any).whatsapp_url ||
              refreshed.whatsapp ||
              null,
          );
        }
      } catch (err) {
        console.warn('Background refresh failed', err);
      }
    };

    refreshCompany();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') refreshCompany();
    };
    document.addEventListener('visibilitychange', onVisibility);

    const interval = setInterval(refreshCompany, 30000);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      clearInterval(interval);
    };
  }, [company.id]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-2xl text-center">{error}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Não foi possível carregar os dados da empresa. Tente novamente.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push('/companies')} className="w-full">
              Voltar para lista
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 font-sans antialiased">
        {/* Enhanced Hero Section */}
        <section className="relative bg-gradient-to-br from-card to-card/80 pb-16 shadow-lg">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative">
            {/* Enhanced Header Actions */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/companies')}
                  className="gap-2"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                  Voltar
                </Button>
                <Badge variant="secondary" className="gap-1">
                  <Eye className="h-3 w-3" />
                  Visualizando
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsBookmarked(!isBookmarked)}
                    >
                      {isBookmarked ? (
                        <Bookmark className="h-4 w-4 fill-primary text-primary" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isBookmarked ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsLiked(!isLiked)}
                    >
                      {isLiked ? (
                        <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                      ) : (
                        <Heart className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isLiked ? 'Remover curtida' : 'Curtir empresa'}
                  </TooltipContent>
                </Tooltip>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Compartilhar no WhatsApp
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Mail className="h-4 w-4 mr-2" />
                      Compartilhar por Email
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Globe className="h-4 w-4 mr-2" />
                      Copiar Link
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {canEdit && (
                  <Button variant="default" size="sm" className="gap-2">
                    <Edit className="h-4 w-4" />
                    Editar Perfil
                  </Button>
                )}
              </div>
            </div>

            {/* Hero Content */}
            <CompanyHero
              company={currentCompany}
              companyStats={companyStats}
              bannerUrl={bannerUrl || ''}
              bannerError={bannerError}
              setBannerError={setBannerError}
              logoUrl={logoUrl || ''}
              logoError={logoError}
              setLogoError={setLogoError}
              ctaEnabled={ctaEnabled}
              ctaUrl={ctaUrl}
            />
          </div>
        </section>

        {/* Enhanced Main Content */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content - 3/4 width */}
            <div className="lg:col-span-3">
              {/* Enhanced Navigation Tabs */}
              <Card className="border-border/60 shadow-xl mb-8 overflow-hidden">
                <CardContent className="p-0">
                  <Tabs 
                    value={activeTab} 
                    onValueChange={setActiveTab}
                    className="w-full"
                  >
                    <ScrollArea className="w-full">
                      <TabsList className="w-full h-auto p-2 bg-transparent border-b">
                        <div className="flex items-center gap-1 w-full">
                          {tabs.map((tab) => (
                            <TabsTrigger
                              key={tab.id}
                              value={tab.id}
                              className={cn(
                                "flex items-center gap-2 px-4 py-3 rounded-lg data-[state=active]:shadow-md transition-all duration-300",
                                "data-[state=active]:bg-background data-[state=active]:border",
                                "hover:bg-muted/50"
                              )}
                            >
                              <div className={cn(
                                "h-8 w-8 rounded-lg flex items-center justify-center",
                                tab.bgColor,
                                activeTab === tab.id ? tab.color : "text-muted-foreground"
                              )}>
                                <tab.icon className="h-4 w-4" />
                              </div>
                              <span className="font-medium whitespace-nowrap">{tab.label}</span>
                              {tab.id === 'stats' && showAnalytics && (
                                <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                                  Live
                                </Badge>
                              )}
                            </TabsTrigger>
                          ))}
                        </div>
                      </TabsList>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>

                    {/* Enhanced Tab Contents */}
                    <div className="p-6">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeTab}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2 }}
                        >
                          {/* Overview Tab */}
                          {activeTab === 'overview' && (
                            <div className="space-y-8">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h2 className="text-2xl font-bold">Visão Geral da Empresa</h2>
                                  <p className="text-muted-foreground">
                                    Conheça tudo sobre nossos serviços e especialidades
                                  </p>
                                </div>
                                <Button variant="outline" className="gap-2">
                                  <Download className="h-4 w-4" />
                                  Exportar PDF
                                </Button>
                              </div>
                              <CompanyOverview company={currentCompany} />
                            </div>
                          )}

                          {/* Products Tab */}
                          {activeTab === 'products' && (
                            <div className="space-y-8">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h2 className="text-2xl font-bold">Catálogo de Produtos</h2>
                                  <p className="text-muted-foreground">
                                    Explore nossas soluções e serviços especializados
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Buscar produtos..." className="pl-9 w-[200px]" />
                                  </div>
                                  <Select defaultValue="all">
                                    <SelectTrigger className="w-[180px]">
                                      <SelectValue placeholder="Filtrar por" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">Todos</SelectItem>
                                      <SelectItem value="solar">Solar</SelectItem>
                                      <SelectItem value="eolica">Eólica</SelectItem>
                                      <SelectItem value="hidrica">Hídrica</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <CompanyProducts products={products} loading={productsLoading} />
                            </div>
                          )}

                          {/* Reviews Tab */}
                          {activeTab === 'reviews' && (
                            <div className="space-y-8">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h2 className="text-2xl font-bold">Avaliações e Depoimentos</h2>
                                  <p className="text-muted-foreground">
                                    O que nossos clientes dizem sobre nossos serviços
                                  </p>
                                </div>
                                <Button className="gap-2">
                                  <MessageCircle className="h-4 w-4" />
                                  Deixar Avaliação
                                </Button>
                              </div>
                              <CompanyReviews
                                reviews={reviews}
                                loading={reviewsLoading}
                                companyId={currentCompany.id}
                                companyName={currentCompany.name}
                              />
                            </div>
                          )}

                          {/* Financing Tab */}
                          {activeTab === 'financing' && (
                            <div className="space-y-8">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h2 className="text-2xl font-bold">Financiamento</h2>
                                  <p className="text-muted-foreground">
                                    Simule e compare as melhores opções de financiamento
                                  </p>
                                </div>
                                <Badge variant="secondary" className="gap-2">
                                  <Zap className="h-3.5 w-3.5" />
                                  Simulação em tempo real
                                </Badge>
                              </div>
                              <Context7Provider>
                                <CompanyFinancing companyId={currentCompany.id} />
                              </Context7Provider>
                            </div>
                          )}

                          {/* Gallery Tab */}
                          {activeTab === 'gallery' && (
                            <div className="space-y-8">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h2 className="text-2xl font-bold">Galeria de Projetos</h2>
                                  <p className="text-muted-foreground">
                                    Conheça nossos trabalhos realizados
                                  </p>
                                </div>
                                <Button variant="outline" className="gap-2">
                                  <ImageIcon className="h-4 w-4" />
                                  Ver todos
                                </Button>
                              </div>
                              <Context7Provider>
                                <MediaGallery 
                                  companyId={String(currentCompany.id)} 
                                  showControls={canEdit} 
                                  showHeader 
                                />
                              </Context7Provider>
                            </div>
                          )}

                          {/* Stats Tab - Enhanced */}
                          {activeTab === 'stats' && (
                            <div className="space-y-8">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h2 className="text-2xl font-bold">Estatísticas e Desempenho</h2>
                                  <p className="text-muted-foreground">
                                    Métricas detalhadas de performance e engajamento
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Select value={timeRange} onValueChange={setTimeRange}>
                                    <SelectTrigger className="w-[120px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="7d">Últimos 7 dias</SelectItem>
                                      <SelectItem value="30d">Últimos 30 dias</SelectItem>
                                      <SelectItem value="90d">Últimos 90 dias</SelectItem>
                                      <SelectItem value="1y">Último ano</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <div className="flex items-center gap-2">
                                    <Label htmlFor="analytics-toggle" className="text-sm">
                                      {showAnalytics ? 'Mostrando' : 'Oculto'}
                                    </Label>
                                    <Switch
                                      id="analytics-toggle"
                                      checked={showAnalytics}
                                      onCheckedChange={setShowAnalytics}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Enhanced Stats Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCardMini
                                  title="Avaliação Média"
                                  value={companyStats.rating.toFixed(1)}
                                  icon={<Star className="h-4 w-4" />}
                                  change="+0.2"
                                  color="text-amber-500"
                                  bgColor="bg-amber-500/10"
                                />
                                <StatCardMini
                                  title="Total Avaliações"
                                  value={companyStats.reviewCount.toString()}
                                  icon={<MessageCircle className="h-4 w-4" />}
                                  change="+12%"
                                  color="text-emerald-500"
                                  bgColor="bg-emerald-500/10"
                                />
                                <StatCardMini
                                  title="Leads Recebidos"
                                  value={leadsStats.totalLeads.toString()}
                                  icon={<Users className="h-4 w-4" />}
                                  change={leadsStats.totalLeads > 0 ? "+%" : undefined}
                                  color="text-blue-500"
                                  bgColor="bg-blue-500/10"
                                />
                                <StatCardMini
                                  title="Taxa de Conversão"
                                  value={`${leadsStats.avgConversion}%`}
                                  icon={<TrendingUp className="h-4 w-4" />}
                                  change="+"
                                  color="text-pink-500"
                                  bgColor="bg-pink-500/10"
                                />
                              </div>

                              {/* Charts Grid - Enhanced Layout */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card className="lg:col-span-2">
                                  <CardHeader>
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                      <TrendingUp className="h-5 w-5 text-primary" />
                                      Funil de Conversão de Leads
                                    </CardTitle>
                                    <CardDescription>
                                      Acompanhe a eficiência da sua página em converter visitantes em leads qualificados
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent className="h-[400px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={historicalData || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis 
                                          dataKey="date" 
                                          tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                        />
                                        <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                                        <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" />
                                        <RechartsTooltip 
                                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                          labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        <Bar yAxisId="left" dataKey="views" name="Visitas" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                        <Bar yAxisId="right" dataKey="leads" name="Leads Gerados" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                        <Line
                                          yAxisId="right"
                                          type="monotone"
                                          dataKey="conversion"
                                          name="Taxa de Conversão (%)"
                                          stroke="#10b981"
                                          strokeWidth={3}
                                          dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                                          activeDot={{ r: 6 }}
                                        />
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </CardContent>
                                </Card>
                              </div>
                            </div>
                          )}

                          {/* Details Tab - Enhanced */}
                          {activeTab === 'details' && (
                            <div className="space-y-8">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h2 className="text-2xl font-bold">Detalhes da Empresa</h2>
                                  <p className="text-muted-foreground">
                                    Informações completas e documentos
                                  </p>
                                </div>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" className="gap-2">
                                      <Info className="h-4 w-4" />
                                      Ver Certificações
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Certificações e Selos</DialogTitle>
                                      <DialogDescription>
                                        Todos os certificados e reconhecimentos da empresa
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      {/* Certifications content */}
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                      <Users className="h-5 w-5 text-primary" />
                                      Informações de Contato
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <ContactInfoItem
                                      icon={<Phone className="h-4 w-4" />}
                                      label="Telefone"
                                      value={currentCompany.phone || 'Não informado'}
                                    />
                                    <ContactInfoItem
                                      icon={<MessageCircle className="h-4 w-4" />}
                                      label="WhatsApp"
                                      value={currentCompany.whatsapp || 'Não informado'}
                                    />
                                    <ContactInfoItem
                                      icon={<Mail className="h-4 w-4" />}
                                      label="E-mail"
                                      value={currentCompany.email || 'Não informado'}
                                    />
                                    <ContactInfoItem
                                      icon={<MapPin className="h-4 w-4" />}
                                      label="Endereço"
                                      value={`${currentCompany.city}, ${currentCompany.state}`}
                                    />
                                  </CardContent>
                                </Card>

                                <Card>
                                  <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                      <Globe className="h-5 w-5 text-primary" />
                                      Informações Comerciais
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <Accordion type="single" collapsible className="w-full">
                                      <AccordionItem value="capabilities">
                                        <AccordionTrigger>Capacidades Técnicas</AccordionTrigger>
                                        <AccordionContent>
                                          <div className="space-y-3">
                                            <CapabilityItem
                                              icon={<Sun className="h-4 w-4" />}
                                              label="Energia Solar"
                                              level="Alta"
                                            />
                                            <CapabilityItem
                                              icon={<Wind className="h-4 w-4" />}
                                              label="Energia Eólica"
                                              level="Média"
                                            />
                                            <CapabilityItem
                                              icon={<Droplets className="h-4 w-4" />}
                                              label="Energia Hídrica"
                                              level="Básica"
                                            />
                                          </div>
                                        </AccordionContent>
                                      </AccordionItem>
                                      <AccordionItem value="certifications">
                                        <AccordionTrigger>Certificações</AccordionTrigger>
                                        <AccordionContent>
                                          <div className="space-y-2">
                                            <Badge className="gap-1">
                                              <ShieldCheck className="h-3 w-3" />
                                              ANEEL Credenciada
                                            </Badge>
                                            <Badge variant="secondary" className="gap-1">
                                              <CheckCircle className="h-3 w-3" />
                                              ISO 9001
                                            </Badge>
                                            <Badge variant="outline" className="gap-1">
                                              <Award className="h-3 w-3" />
                                              Selo Procel
                                            </Badge>
                                          </div>
                                        </AccordionContent>
                                      </AccordionItem>
                                    </Accordion>
                                  </CardContent>
                                </Card>
                              </div>
                            </div>
                          )}

                          {/* Edit Tab */}
                          {activeTab === 'edit' && canEdit && (
                            <div className="space-y-8">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h2 className="text-2xl font-bold">Editar Empresa</h2>
                                  <p className="text-muted-foreground">
                                    Gerencie as informações do seu perfil
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Button variant="outline" className="gap-2">
                                    <EyeOff className="h-4 w-4" />
                                    Pré-visualizar
                                  </Button>
                                  <Button className="gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    Salvar Alterações
                                  </Button>
                                </div>
                              </div>
                              <Card>
                                <CardHeader>
                                  <CardTitle>Configurações do Perfil</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <CompanyInfo companyId={String(currentCompany.id)} />
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Sidebar - 1/4 width */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-6">
                {/* Quick Actions Card */}
                <Card className="border-border/60 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      Ações Rápidas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full gap-2 justify-start" variant="ghost">
                      <MessageCircle className="h-4 w-4" />
                      Enviar Mensagem
                    </Button>
                    <Button className="w-full gap-2 justify-start" variant="ghost">
                      <Phone className="h-4 w-4" />
                      Ligar Agora
                    </Button>
                    <Button className="w-full gap-2 justify-start" variant="ghost">
                      <Mail className="h-4 w-4" />
                      Enviar E-mail
                    </Button>
                    <Separator />
                    <Button className="w-full gap-2 justify-start" variant="ghost">
                      <Download className="h-4 w-4" />
                      Baixar Catálogo
                    </Button>
                    <Button className="w-full gap-2 justify-start" variant="ghost">
                      <Printer className="h-4 w-4" />
                      Imprimir Detalhes
                    </Button>
                  </CardContent>
                </Card>

                {/* Stats Summary Card */}
                <Card className="border-border/60 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      Resumo Estatístico
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Classificação</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                          <span className="font-semibold">{companyStats.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <Progress value={companyStats.rating * 20} className="h-1.5" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center">
                        <div className="text-lg font-bold">{companyStats.reviewCount}</div>
                        <div className="text-xs text-muted-foreground">Avaliações</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{companyStats.productCount}</div>
                        <div className="text-xs text-muted-foreground">Produtos</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Business Hours Card */}
                <Card className="border-border/60 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Horário de Funcionamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {['Segunda a Sexta', 'Sábado', 'Domingo'].map((day) => (
                      <div key={day} className="flex items-center justify-between text-sm">
                        <span>{day}</span>
                        <span className="font-medium">08:00 - 18:00</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* FAQ Preview */}
                {companyId && (
                  <Card className="border-border/60 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-primary" />
                        Perguntas Frequentes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[200px]">
                        <FaqSection companyId={companyId} />      
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50">
          <div className="flex items-center justify-around p-2">
            {tabs.slice(0, 4).map((tab) => (
              <Button
                key={tab.id}
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex flex-col items-center gap-1 h-auto py-2 px-3",
                  activeTab === tab.id && "text-primary"
                )}
              >
                <tab.icon className="h-5 w-5" />
                <span className="text-xs">{tab.label}</span>
              </Button>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 px-3">
                  <Settings className="h-5 w-5" />
                  <span className="text-xs">Mais</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {tabs.slice(4).map((tab) => (
                  <DropdownMenuItem 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="gap-2"
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Componentes auxiliares
function StatCardMini({ title, value, icon, change, color, bgColor }: any) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">{title}</div>
            <div className="text-2xl font-bold">{value}</div>
            {change && (
              <div className={cn(
                "text-xs flex items-center gap-1",
                change.startsWith('+') ? "text-emerald-600" : "text-red-600"
              )}>
                {change.startsWith('+') ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {change}
              </div>
            )}
          </div>
          <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", bgColor, color)}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsMetric({ title, value, change, trend }: any) {
  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-bold">{value}</div>
        <div className={cn(
          "text-sm flex items-center gap-1",
          trend === 'up' ? "text-emerald-600" : "text-red-600"
        )}>
          {trend === 'up' ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {change}
        </div>
      </div>
    </div>
  );
}

function ContactInfoItem({ icon, label, value }: any) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div className="space-y-1">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
}

function CapabilityItem({ icon, label, level }: any) {
  const levelColors: Record<string, string> = {
    Alta: "bg-emerald-100 text-emerald-800",
    Média: "bg-amber-100 text-amber-800",
    Básica: "bg-blue-100 text-blue-800",
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <Badge className={cn("text-xs", levelColors[level])}>
        {level}
      </Badge>
    </div>
  );
}
