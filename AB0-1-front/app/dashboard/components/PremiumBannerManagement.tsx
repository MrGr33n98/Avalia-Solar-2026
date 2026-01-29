'use client';

/**
 * Premium Banner Management Component
 * 
 * Sistema avançado de gerenciamento de banners com:
 * - Visualização hierárquica de dados
 * - Filtros avançados e personalizáveis
 * - Indicadores de performance em tempo real
 * - Sistema de rastreamento com logs detalhados
 * - Alertas configuráveis
 * - Histórico completo de ações
 * 
 * @module PremiumBannerManagement
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image as ImageIcon,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  MousePointer,
  TrendingUp,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Settings,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  Edit,
  Copy,
  ExternalLink,
  Sparkles,
  Target,
  Zap,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BannerData {
  id: string;
  title: string;
  image_url: string;
  link: string;
  position: 'navbar' | 'sidebar' | 'footer' | 'hero' | 'category';
  status: 'active' | 'paused' | 'scheduled' | 'expired';
  type: 'rectangular_large' | 'rectangular_small' | 'square' | 'wide';
  sponsored: boolean;
  category?: string;
  location?: string;
  start_date: Date;
  end_date?: Date;
  views: number;
  clicks: number;
  ctr: number;
  budget: number;
  spent: number;
  priority: number;
  tags: string[];
  created_at: Date;
  updated_at: Date;
}

interface ActivityLog {
  id: string;
  action: 'created' | 'updated' | 'deleted' | 'paused' | 'resumed' | 'viewed';
  banner_id: string;
  banner_title: string;
  user: string;
  timestamp: Date;
  details: string;
}

interface PremiumBannerManagementProps {
  companyId: string;
}

export default function PremiumBannerManagement({ companyId }: PremiumBannerManagementProps) {
  // Estado principal
  const [banners, setBanners] = useState<BannerData[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBanner, setSelectedBanner] = useState<BannerData | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Filtros avançados
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPosition, setFilterPosition] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_desc');

  // Performance tracking
  const [refreshInterval, setRefreshInterval] = useState<number>(30000);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Mock data para demonstração (substituir por API real)
  useEffect(() => {
    const fetchBanners = async () => {
      setLoading(true);
      // Simulação de dados - substituir por chamada real à API
      const mockBanners: BannerData[] = [
        {
          id: '1',
          title: 'Banner Principal - Energia Solar',
          image_url: '/banners/solar-main.jpg',
          link: 'https://example.com/solar',
          position: 'navbar',
          status: 'active',
          type: 'rectangular_large',
          sponsored: true,
          category: 'Energia Solar',
          location: 'São Paulo',
          start_date: new Date('2024-01-01'),
          end_date: new Date('2024-12-31'),
          views: 15420,
          clicks: 892,
          ctr: 5.8,
          budget: 5000,
          spent: 2840,
          priority: 1,
          tags: ['energia', 'solar', 'sustentabilidade'],
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-15'),
        },
        {
          id: '2',
          title: 'Sidebar - Instalação Residencial',
          image_url: '/banners/residential.jpg',
          link: 'https://example.com/residential',
          position: 'sidebar',
          status: 'active',
          type: 'rectangular_small',
          sponsored: false,
          category: 'Residencial',
          start_date: new Date('2024-02-01'),
          views: 8520,
          clicks: 354,
          ctr: 4.2,
          budget: 2000,
          spent: 980,
          priority: 2,
          tags: ['residencial', 'instalação'],
          created_at: new Date('2024-02-01'),
          updated_at: new Date('2024-02-10'),
        },
      ];

      const mockLogs: ActivityLog[] = [
        {
          id: '1',
          action: 'created',
          banner_id: '1',
          banner_title: 'Banner Principal - Energia Solar',
          user: 'Admin',
          timestamp: new Date(),
          details: 'Banner criado com sucesso',
        },
        {
          id: '2',
          action: 'updated',
          banner_id: '2',
          banner_title: 'Sidebar - Instalação Residencial',
          user: 'Admin',
          timestamp: new Date(Date.now() - 3600000),
          details: 'Imagem atualizada',
        },
      ];

      setTimeout(() => {
        setBanners(mockBanners);
        setActivityLogs(mockLogs);
        setLoading(false);
      }, 1000);
    };

    fetchBanners();
  }, [companyId]);

  // Auto-refresh para dados em tempo real
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Atualizar dados de performance em tempo real
      setBanners((prev) =>
        prev.map((banner) => ({
          ...banner,
          views: banner.views + Math.floor(Math.random() * 10),
          clicks: banner.clicks + Math.floor(Math.random() * 3),
        }))
      );
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Filtros e ordenação
  const filteredAndSortedBanners = useMemo(() => {
    let filtered = banners.filter((banner) => {
      const matchesSearch =
        banner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        banner.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        banner.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = filterStatus === 'all' || banner.status === filterStatus;
      const matchesPosition = filterPosition === 'all' || banner.position === filterPosition;

      return matchesSearch && matchesStatus && matchesPosition;
    });

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created_desc':
          return b.created_at.getTime() - a.created_at.getTime();
        case 'created_asc':
          return a.created_at.getTime() - b.created_at.getTime();
        case 'views_desc':
          return b.views - a.views;
        case 'ctr_desc':
          return b.ctr - a.ctr;
        case 'priority':
          return a.priority - b.priority;
        default:
          return 0;
      }
    });

    return filtered;
  }, [banners, searchTerm, filterStatus, filterPosition, sortBy]);

  // Estatísticas gerais
  const stats = useMemo(() => {
    const totalViews = banners.reduce((sum, b) => sum + b.views, 0);
    const totalClicks = banners.reduce((sum, b) => sum + b.clicks, 0);
    const totalBudget = banners.reduce((sum, b) => sum + b.budget, 0);
    const totalSpent = banners.reduce((sum, b) => sum + b.spent, 0);
    const activeBanners = banners.filter((b) => b.status === 'active').length;
    const avgCTR = banners.length > 0 ? totalClicks / totalViews * 100 : 0;

    return {
      totalViews,
      totalClicks,
      totalBudget,
      totalSpent,
      activeBanners,
      avgCTR,
    };
  }, [banners]);

  // Handlers
  const handleCreateBanner = useCallback(() => {
    setIsCreateDialogOpen(true);
  }, []);

  const handleEditBanner = useCallback((banner: BannerData) => {
    setSelectedBanner(banner);
    setIsEditDialogOpen(true);
  }, []);

  const handleDeleteBanner = useCallback((bannerId: string) => {
    if (confirm('Tem certeza que deseja deletar este banner?')) {
      setBanners((prev) => prev.filter((b) => b.id !== bannerId));
      // Adicionar log
      setActivityLogs((prev) => [
        {
          id: Date.now().toString(),
          action: 'deleted',
          banner_id: bannerId,
          banner_title: banners.find((b) => b.id === bannerId)?.title || '',
          user: 'Admin',
          timestamp: new Date(),
          details: 'Banner deletado',
        },
        ...prev,
      ]);
    }
  }, [banners]);

  const handleDuplicateBanner = useCallback((banner: BannerData) => {
    const newBanner = {
      ...banner,
      id: Date.now().toString(),
      title: `${banner.title} (Cópia)`,
      status: 'paused' as const,
      created_at: new Date(),
    };
    setBanners((prev) => [newBanner, ...prev]);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'paused':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'expired':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header com estatísticas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              Gerenciamento Premium de Banners
            </h2>
            <p className="text-muted-foreground mt-1">
              Sistema avançado com rastreamento em tempo real e analytics detalhados
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar Relatório
            </Button>
            <Button onClick={handleCreateBanner}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Banner
            </Button>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Banners Ativos</p>
                  <p className="text-2xl font-bold">{stats.activeBanners}</p>
                </div>
                <Activity className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Visualizações</p>
                  <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
                </div>
                <Eye className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Cliques</p>
                  <p className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</p>
                </div>
                <MousePointer className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">CTR Médio</p>
                  <p className="text-2xl font-bold">{stats.avgCTR.toFixed(2)}%</p>
                </div>
                <Target className="h-8 w-8 text-cyan-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Orçamento Total</p>
                  <p className="text-2xl font-bold">R$ {(stats.totalBudget / 1000).toFixed(1)}k</p>
                </div>
                <Zap className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Gasto Total</p>
                  <p className="text-2xl font-bold">R$ {(stats.totalSpent / 1000).toFixed(1)}k</p>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-500" />
              </div>
              <Progress value={(stats.totalSpent / stats.totalBudget) * 100} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filtros Avançados */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título, categoria ou tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="paused">Pausado</SelectItem>
                <SelectItem value="scheduled">Agendado</SelectItem>
                <SelectItem value="expired">Expirado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPosition} onValueChange={setFilterPosition}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Posição" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Posições</SelectItem>
                <SelectItem value="navbar">Navbar</SelectItem>
                <SelectItem value="sidebar">Sidebar</SelectItem>
                <SelectItem value="footer">Footer</SelectItem>
                <SelectItem value="hero">Hero</SelectItem>
                <SelectItem value="category">Categoria</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_desc">Mais Recentes</SelectItem>
                <SelectItem value="created_asc">Mais Antigos</SelectItem>
                <SelectItem value="views_desc">Mais Visualizados</SelectItem>
                <SelectItem value="ctr_desc">Maior CTR</SelectItem>
                <SelectItem value="priority">Prioridade</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
              <Label className="text-sm">Auto-atualização</Label>
            </div>
            {autoRefresh && (
              <Select
                value={refreshInterval.toString()}
                onValueChange={(val) => setRefreshInterval(Number(val))}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10000">10s</SelectItem>
                  <SelectItem value="30000">30s</SelectItem>
                  <SelectItem value="60000">1min</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs com conteúdo */}
      <Tabs defaultValue="banners" className="space-y-4">
        <TabsList>
          <TabsTrigger value="banners">
            <ImageIcon className="h-4 w-4 mr-2" />
            Banners ({filteredAndSortedBanners.length})
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="logs">
            <Clock className="h-4 w-4 mr-2" />
            Logs de Atividade
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Tab: Lista de Banners */}
        <TabsContent value="banners" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground">Carregando banners...</p>
              </div>
            </div>
          ) : filteredAndSortedBanners.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum banner encontrado</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Crie seu primeiro banner para começar a promover seus produtos
                </p>
                <Button onClick={handleCreateBanner}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Banner
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredAndSortedBanners.map((banner) => (
                <motion.div
                  key={banner.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      <div className="relative h-48 bg-gradient-to-br from-primary/10 to-primary/5">
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Badge variant="secondary" className="backdrop-blur-sm">
                            {banner.position}
                          </Badge>
                          <Badge
                            variant={banner.status === 'active' ? 'default' : 'secondary'}
                            className="backdrop-blur-sm"
                          >
                            {getStatusIcon(banner.status)}
                            <span className="ml-1">{banner.status}</span>
                          </Badge>
                        </div>
                        {banner.sponsored && (
                          <div className="absolute top-2 left-2">
                            <Badge variant="default" className="bg-cyan-600 backdrop-blur-sm">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Patrocinado
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div className="p-4 space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{banner.title}</h3>
                          {banner.category && (
                            <p className="text-sm text-muted-foreground">{banner.category}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              Visualizações
                            </p>
                            <p className="font-semibold">{banner.views.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground flex items-center gap-1">
                              <MousePointer className="h-3 w-3" />
                              Cliques
                            </p>
                            <p className="font-semibold">{banner.clicks.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              CTR
                            </p>
                            <p className="font-semibold">{banner.ctr.toFixed(2)}%</p>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Orçamento</span>
                            <span className="font-semibold">
                              R$ {banner.spent.toLocaleString()} / R$ {banner.budget.toLocaleString()}
                            </span>
                          </div>
                          <Progress value={(banner.spent / banner.budget) * 100} />
                        </div>

                        {banner.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {banner.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditBanner(banner)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDuplicateBanner(banner)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(banner.link, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => handleDeleteBanner(banner.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button size="sm" variant="outline">
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab: Analytics */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Detalhados</CardTitle>
              <CardDescription>Métricas de performance em tempo real</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Gráficos e análises detalhadas serão implementados aqui
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Logs de Atividade */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Atividades</CardTitle>
              <CardDescription>Rastreamento completo de todas as ações</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ação</TableHead>
                      <TableHead>Banner</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{log.banner_title}</TableCell>
                        <TableCell>{log.user}</TableCell>
                        <TableCell>{log.timestamp.toLocaleString('pt-BR')}</TableCell>
                        <TableCell className="text-muted-foreground">{log.details}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Configurações */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Avançadas</CardTitle>
              <CardDescription>Personalize o comportamento do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Alertas Automáticos</Label>
                <div className="flex items-center gap-2">
                  <Switch />
                  <span className="text-sm text-muted-foreground">
                    Notificar quando CTR cair abaixo de 3%
                  </span>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Rotação Automática</Label>
                <div className="flex items-center gap-2">
                  <Switch />
                  <span className="text-sm text-muted-foreground">
                    Pausar banners automaticamente ao atingir o orçamento
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs para criar/editar banners serão implementados aqui */}
    </div>
  );
}
