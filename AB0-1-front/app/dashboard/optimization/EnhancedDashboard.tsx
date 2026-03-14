'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Star, 
  DollarSign, 
  Activity,
  RefreshCw,
  Zap,
  Database,
  Clock,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { optimizedDashboardApi, dashboardQueryKeys, OptimizedDashboardStats, DashboardChartData, CompanyMetric } from '../optimization/optimized-api';
import { cn } from '@/lib/utils';

// ============================================
// ENHANCED METRIC CARD COMPONENT
// ============================================

interface EnhancedMetricCardProps {
  title: string;
  value: number;
  change: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  format?: 'number' | 'currency' | 'percentage';
  color?: 'blue' | 'green' | 'orange' | 'red';
  loading?: boolean;
}

const EnhancedMetricCard: React.FC<EnhancedMetricCardProps> = ({
  title,
  value,
  change,
  label,
  icon: Icon,
  format = 'number',
  color = 'blue',
  loading = false,
}) => {
  const formatValue = useCallback((val: number): string => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      default:
        return new Intl.NumberFormat('pt-BR').format(val);
    }
  }, [format]);

  const isPositiveChange = change >= 0;
  const changeColor = isPositiveChange ? 'text-green-600' : 'text-red-600';
  const changeIcon = isPositiveChange ? TrendingUp : TrendingDown;
  const ChangeIcon = changeIcon;

  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
  };

  if (loading) {
    return (
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-32"></div>
            <div className="flex items-center space-x-2">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-5 group-hover:opacity-10 transition-opacity`} />
      
      <CardContent className="p-6 relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </h3>
          </div>
          <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>

        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-2xl font-bold text-foreground">
              {formatValue(value)}
            </p>
          </motion.div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ChangeIcon className={`h-4 w-4 ${changeColor}`} />
              <span className={`text-sm font-medium ${changeColor}`}>
                {Math.abs(change).toFixed(1)}%
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {label}
            </span>
          </div>

          {Math.abs(change) > 0 && (
            <Progress 
              value={Math.min(Math.abs(change), 100)} 
              className="h-1"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================
// PERFORMANCE MONITOR COMPONENT
// ============================================

const PerformanceMonitor: React.FC = () => {
  const { data: performanceStats, isLoading } = useQuery({
    queryKey: ['dashboard-performance'],
    queryFn: () => optimizedDashboardApi.getPerformanceStats(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const cacheStats = optimizedDashboardApi.getCacheStats();
  
  if (isLoading || !performanceStats) {
    return null;
  }

  const avgPerformance = performanceStats.reduce((acc, stat) => acc + stat.avg_execution_time_ms, 0) / performanceStats.length;
  const avgCacheHitRate = performanceStats.reduce((acc, stat) => acc + stat.cache_hit_rate, 0) / performanceStats.length;

  return (
    <Card className="border-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Database className="h-4 w-4" />
          Performance Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center">
                  <div className="text-lg font-bold">{avgPerformance.toFixed(0)}ms</div>
                  <div className="text-xs text-muted-foreground">Avg Response</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Average database query response time</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center">
                  <div className="text-lg font-bold">{(avgCacheHitRate * 100).toFixed(0)}%</div>
                  <div className="text-xs text-muted-foreground">Cache Hit</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Percentage of requests served from cache</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center">
                  <div className="text-lg font-bold">{cacheStats.size}</div>
                  <div className="text-xs text-muted-foreground">Cached Items</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Number of items currently in cache</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <Badge variant={avgPerformance < 100 ? "default" : "secondary"}>
            {avgPerformance < 100 ? 'Excellent' : avgPerformance < 500 ? 'Good' : 'Slow'}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Activity className="h-3 w-3" />
            Real-time
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================
// REAL-TIME CHART COMPONENT
// ============================================

interface OptimizedChartProps {
  metricType: 'companies' | 'reviews' | 'leads' | 'revenue';
  timeRange: 'daily' | 'weekly' | 'monthly';
  title: string;
  color?: string;
}

const OptimizedChart: React.FC<OptimizedChartProps> = ({
  metricType,
  timeRange,
  title,
  color = '#3B82F6',
}) => {
  const { data: chartData, isLoading, error } = useQuery({
    queryKey: dashboardQueryKeys.chartData(metricType, timeRange),
    queryFn: () => optimizedDashboardApi.getChartData(metricType, timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="animate-pulse h-4 bg-gray-200 rounded w-32"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 animate-pulse bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (error || !chartData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Failed to load chart data
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...chartData.map(d => d.value));
  const totalValue = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <Badge variant="outline">
            {chartData.length} pontos
          </Badge>
        </CardTitle>
        <CardDescription>
          Total: {new Intl.NumberFormat('pt-BR').format(totalValue)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 relative">
          <svg width="100%" height="100%" viewBox="0 0 400 200" className="overflow-visible">
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={i}
                x1="0"
                y1={i * 40}
                x2="400"
                y2={i * 40}
                stroke="#f1f5f9"
                strokeWidth="1"
              />
            ))}
            
            {/* Chart line */}
            <polyline
              points={chartData
                .map((d, i) => `${(i * 400) / (chartData.length - 1)},${200 - (d.value / maxValue) * 180}`)
                .join(' ')}
              fill="none"
              stroke={color}
              strokeWidth="2"
              className="drop-shadow-sm"
            />
            
            {/* Data points */}
            {chartData.map((d, i) => (
              <circle
                key={i}
                cx={(i * 400) / (chartData.length - 1)}
                cy={200 - (d.value / maxValue) * 180}
                r="3"
                fill={color}
                className="drop-shadow-sm hover:r-4 transition-all cursor-pointer"
              >
                <title>{`${d.date}: ${d.value}`}</title>
              </circle>
            ))}
            
            {/* Area fill */}
            <polygon
              points={`0,200 ${chartData
                .map((d, i) => `${(i * 400) / (chartData.length - 1)},${200 - (d.value / maxValue) * 180}`)
                .join(' ')} 400,200`}
              fill={color}
              fillOpacity="0.1"
            />
          </svg>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================
// MAIN ENHANCED DASHBOARD COMPONENT
// ============================================

export const EnhancedDashboard: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { 
    data: dashboardStats, 
    isLoading: statsLoading, 
    error: statsError,
    dataUpdatedAt 
  } = useQuery({
    queryKey: dashboardQueryKeys.stats(),
    queryFn: () => optimizedDashboardApi.getDashboardStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
  });

  const { data: topCompanies, isLoading: companiesLoading } = useQuery({
    queryKey: dashboardQueryKeys.topCompanies('total_leads', 5, 0),
    queryFn: () => optimizedDashboardApi.getTopCompanies('total_leads', 5, 0),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await optimizedDashboardApi.refreshViews();
      await queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all });
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  const lastUpdated = useMemo(() => {
    if (!dataUpdatedAt) return null;
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(dataUpdatedAt));
  }, [dataUpdatedAt]);

  if (statsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">Erro ao carregar dashboard</h3>
            <p className="text-muted-foreground">Tente novamente em alguns minutos</p>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Otimizado</h1>
          <p className="text-muted-foreground">
            Visão geral do desempenho da plataforma com dados em tempo real
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Atualizado às {lastUpdated}
            </div>
          )}
          
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            {refreshing ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Atualizar
          </Button>
        </div>
      </div>

      {/* Performance Monitor */}
      <PerformanceMonitor />

      {/* Main Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <EnhancedMetricCard
          title="Empresas"
          value={dashboardStats?.total_companies.value || 0}
          change={dashboardStats?.total_companies.change || 0}
          label={dashboardStats?.total_companies.label || 'empresas cadastradas'}
          icon={Users}
          color="blue"
          loading={statsLoading}
        />
        
        <EnhancedMetricCard
          title="Avaliações"
          value={dashboardStats?.total_reviews.value || 0}
          change={dashboardStats?.total_reviews.change || 0}
          label={dashboardStats?.total_reviews.label || 'avaliações recebidas'}
          icon={Star}
          color="green"
          loading={statsLoading}
        />
        
        <EnhancedMetricCard
          title="Leads"
          value={dashboardStats?.total_leads.value || 0}
          change={dashboardStats?.total_leads.change || 0}
          label={dashboardStats?.total_leads.label || 'leads gerados'}
          icon={TrendingUp}
          color="orange"
          loading={statsLoading}
        />
        
        <EnhancedMetricCard
          title="Pipeline"
          value={dashboardStats?.pipeline_value.value || 0}
          change={dashboardStats?.pipeline_value.change || 0}
          label={dashboardStats?.pipeline_value.label || 'valor em pipeline'}
          icon={DollarSign}
          format="currency"
          color="red"
          loading={statsLoading}
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="companies" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="companies">Empresas</TabsTrigger>
          <TabsTrigger value="reviews">Avaliações</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="revenue">Receita</TabsTrigger>
        </TabsList>
        
        <TabsContent value="companies" className="space-y-6">
          <OptimizedChart
            metricType="companies"
            timeRange="monthly"
            title="Crescimento de Empresas"
            color="#3B82F6"
          />
        </TabsContent>
        
        <TabsContent value="reviews" className="space-y-6">
          <OptimizedChart
            metricType="reviews"
            timeRange="monthly"
            title="Volume de Avaliações"
            color="#10B981"
          />
        </TabsContent>
        
        <TabsContent value="leads" className="space-y-6">
          <OptimizedChart
            metricType="leads"
            timeRange="monthly"
            title="Geração de Leads"
            color="#F59E0B"
          />
        </TabsContent>
        
        <TabsContent value="revenue" className="space-y-6">
          <OptimizedChart
            metricType="revenue"
            timeRange="monthly"
            title="Pipeline de Receita"
            color="#EF4444"
          />
        </TabsContent>
      </Tabs>

      {/* Top Companies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Top Empresas por Leads
            <Badge variant="outline">
              {topCompanies?.companies.length || 0} empresas
            </Badge>
          </CardTitle>
          <CardDescription>
            Empresas com melhor performance em geração de leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          {companiesLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gray-200 rounded"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {topCompanies?.companies.map((company, index) => (
                <motion.div
                  key={company.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-background to-muted/20 hover:to-muted/40 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold">{company.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{company.total_leads} leads</span>
                        <span>{company.total_reviews} avaliações</span>
                        <span>★ {company.avg_rating?.toFixed(1) || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        minimumFractionDigits: 0,
                      }).format(company.total_pipeline_value)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Pipeline
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};