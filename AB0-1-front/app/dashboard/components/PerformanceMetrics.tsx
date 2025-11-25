'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  MousePointerClick, 
  MessageSquare, 
  TrendingUp,
  Users,
  ArrowUpRight,
  Download,
  Share2,
  Phone,
  Mail,
  Globe,
  Calendar
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PerformanceMetricsProps {
  companyId: string;
  themeMode?: 'light' | 'dark';
}

interface Metrics {
  profileViews: {
    total: number;
    trend: number;
    unique: number;
    returning: number;
  };
  ctaClicks: {
    total: number;
    trend: number;
    byType: { type: string; count: number; label: string }[];
  };
  engagement: {
    avgTimeOnPage: number;
    bounceRate: number;
    pagesPerSession: number;
  };
  sources: {
    source: string;
    visits: number;
    percentage: number;
  }[];
}

export default function PerformanceMetrics({ companyId, themeMode = 'light' }: PerformanceMetricsProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  
  // Mock data - replace with actual API
  const metrics: Metrics = {
    profileViews: {
      total: 3847,
      trend: 23.5,
      unique: 2941,
      returning: 906,
    },
    ctaClicks: {
      total: 487,
      trend: 18.2,
      byType: [
        { type: 'whatsapp', count: 245, label: 'WhatsApp' },
        { type: 'email', count: 128, label: 'Email' },
        { type: 'phone', count: 89, label: 'Telefone' },
        { type: 'website', count: 25, label: 'Website' },
      ],
    },
    engagement: {
      avgTimeOnPage: 245, // seconds
      bounceRate: 34,
      pagesPerSession: 2.8,
    },
    sources: [
      { source: 'Busca Orgânica', visits: 1523, percentage: 39.6 },
      { source: 'Direto', visits: 1154, percentage: 30.0 },
      { source: 'Redes Sociais', visits: 769, percentage: 20.0 },
      { source: 'Referral', visits: 401, percentage: 10.4 },
    ],
  };

  const isDark = themeMode === 'dark';

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-foreground'}`}>
            Métricas de Performance
          </h3>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
            Acompanhe o engajamento e interações com seu perfil
          </p>
        </div>
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
          <TabsList className={isDark ? 'bg-slate-800 border-slate-700' : ''}>
            <TabsTrigger value="7d">7 dias</TabsTrigger>
            <TabsTrigger value="30d">30 dias</TabsTrigger>
            <TabsTrigger value="90d">90 dias</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Profile Views */}
        <Card className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                <Eye className={`h-6 w-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <Badge variant={metrics.profileViews.trend > 0 ? 'default' : 'secondary'} className="text-xs">
                {metrics.profileViews.trend > 0 ? '+' : ''}{metrics.profileViews.trend}%
              </Badge>
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-muted-foreground'} mb-1`}>
                Visualizações
              </p>
              <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-foreground'}`}>
                {metrics.profileViews.total.toLocaleString()}
              </p>
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex justify-between text-xs">
                  <span className={isDark ? 'text-slate-400' : 'text-muted-foreground'}>Únicos</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-foreground'}`}>
                    {metrics.profileViews.unique.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className={isDark ? 'text-slate-400' : 'text-muted-foreground'}>Retornando</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-foreground'}`}>
                    {metrics.profileViews.returning.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total CTA Clicks */}
        <Card className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-purple-900/20' : 'bg-purple-50'}`}>
                <MousePointerClick className={`h-6 w-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
              <Badge variant={metrics.ctaClicks.trend > 0 ? 'default' : 'secondary'} className="text-xs">
                {metrics.ctaClicks.trend > 0 ? '+' : ''}{metrics.ctaClicks.trend}%
              </Badge>
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-muted-foreground'} mb-1`}>
                Cliques em CTAs
              </p>
              <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-foreground'}`}>
                {metrics.ctaClicks.total.toLocaleString()}
              </p>
              <p className={`text-xs mt-3 ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
                Taxa de conversão: {((metrics.ctaClicks.total / metrics.profileViews.total) * 100).toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Avg Time on Page */}
        <Card className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-50'}`}>
                <Calendar className={`h-6 w-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              </div>
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-muted-foreground'} mb-1`}>
                Tempo Médio
              </p>
              <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-foreground'}`}>
                {formatTime(metrics.engagement.avgTimeOnPage)}
              </p>
              <p className={`text-xs mt-3 ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
                {metrics.engagement.pagesPerSession.toFixed(1)} páginas/sessão
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bounce Rate */}
        <Card className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
                <ArrowUpRight className={`h-6 w-6 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
              </div>
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-muted-foreground'} mb-1`}>
                Taxa de Rejeição
              </p>
              <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-foreground'}`}>
                {metrics.engagement.bounceRate}%
              </p>
              <p className={`text-xs mt-3 ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
                {metrics.engagement.bounceRate < 40 ? 'Excelente' : metrics.engagement.bounceRate < 60 ? 'Bom' : 'Pode melhorar'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CTA Breakdown */}
        <Card className={isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}>
          <CardHeader>
            <CardTitle className={isDark ? 'text-white' : 'text-foreground'}>
              Cliques por CTA
            </CardTitle>
            <CardDescription className={isDark ? 'text-slate-400' : ''}>
              Distribuição de interações por tipo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics.ctaClicks.byType.map((cta) => {
              const percentage = (cta.count / metrics.ctaClicks.total) * 100;
              const Icon = cta.type === 'whatsapp' ? MessageSquare :
                          cta.type === 'email' ? Mail :
                          cta.type === 'phone' ? Phone : Globe;
              
              return (
                <div key={cta.type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        cta.type === 'whatsapp' ? isDark ? 'bg-green-900/20' : 'bg-green-50' :
                        cta.type === 'email' ? isDark ? 'bg-blue-900/20' : 'bg-blue-50' :
                        cta.type === 'phone' ? isDark ? 'bg-purple-900/20' : 'bg-purple-50' :
                        isDark ? 'bg-orange-900/20' : 'bg-orange-50'
                      }`}>
                        <Icon className={`h-4 w-4 ${
                          cta.type === 'whatsapp' ? 'text-green-600' :
                          cta.type === 'email' ? 'text-blue-600' :
                          cta.type === 'phone' ? 'text-purple-600' :
                          'text-orange-600'
                        }`} />
                      </div>
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-foreground'}`}>
                        {cta.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
                        {cta.count} cliques
                      </span>
                      <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-foreground'} min-w-[3rem] text-right`}>
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                    <div
                      className={`h-full transition-all duration-500 ${
                        cta.type === 'whatsapp' ? 'bg-green-500' :
                        cta.type === 'email' ? 'bg-blue-500' :
                        cta.type === 'phone' ? 'bg-purple-500' :
                        'bg-orange-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card className={isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}>
          <CardHeader>
            <CardTitle className={isDark ? 'text-white' : 'text-foreground'}>
              Fontes de Tráfego
            </CardTitle>
            <CardDescription className={isDark ? 'text-slate-400' : ''}>
              De onde vêm seus visitantes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics.sources.map((source, index) => {
              const colors = [
                { bg: isDark ? 'bg-blue-900/20' : 'bg-blue-50', text: 'text-blue-600', bar: 'bg-blue-500' },
                { bg: isDark ? 'bg-purple-900/20' : 'bg-purple-50', text: 'text-purple-600', bar: 'bg-purple-500' },
                { bg: isDark ? 'bg-emerald-900/20' : 'bg-emerald-50', text: 'text-emerald-600', bar: 'bg-emerald-500' },
                { bg: isDark ? 'bg-orange-900/20' : 'bg-orange-50', text: 'text-orange-600', bar: 'bg-orange-500' },
              ];
              const color = colors[index];

              return (
                <div key={source.source} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${color.bg}`}>
                        <Share2 className={`h-4 w-4 ${color.text}`} />
                      </div>
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-foreground'}`}>
                        {source.source}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
                        {source.visits.toLocaleString()} visitas
                      </span>
                      <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-foreground'} min-w-[3rem] text-right`}>
                        {source.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                    <div
                      className={`h-full transition-all duration-500 ${color.bar}`}
                      style={{ width: `${source.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`${isDark ? 'bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-slate-800' : 'bg-gradient-to-br from-blue-50 to-purple-50'}`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-foreground'}`}>
                Crescimento
              </h4>
            </div>
            <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-muted-foreground'}`}>
              Suas visualizações cresceram <span className="font-bold text-blue-600">+{metrics.profileViews.trend}%</span> nos últimos {timeRange === '7d' ? '7 dias' : timeRange === '30d' ? '30 dias' : '90 dias'}
            </p>
          </CardContent>
        </Card>

        <Card className={`${isDark ? 'bg-gradient-to-br from-emerald-900/20 to-green-900/20 border-slate-800' : 'bg-gradient-to-br from-emerald-50 to-green-50'}`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Users className={`h-5 w-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-foreground'}`}>
                Engajamento
              </h4>
            </div>
            <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-muted-foreground'}`}>
              Tempo médio de <span className="font-bold text-emerald-600">{formatTime(metrics.engagement.avgTimeOnPage)}</span> indica alto interesse no seu perfil
            </p>
          </CardContent>
        </Card>

        <Card className={`${isDark ? 'bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-slate-800' : 'bg-gradient-to-br from-purple-50 to-pink-50'}`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <MousePointerClick className={`h-5 w-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-foreground'}`}>
                Conversão
              </h4>
            </div>
            <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-muted-foreground'}`}>
              <span className="font-bold text-purple-600">{((metrics.ctaClicks.total / metrics.profileViews.total) * 100).toFixed(1)}%</span> dos visitantes clicam em algum CTA
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
