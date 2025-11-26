'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Star, 
  TrendingUp, 
  TrendingDown,
  Users,
  ThumbsUp,
  MessageSquare,
  Award,
  Target,
  BarChart3
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ReviewsAnalyticsProps {
  companyId: string;
  themeMode?: 'light' | 'dark';
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { rating: number; count: number; percentage: number }[];
  recentReviews: any[];
  monthlyTrend: number;
  verifiedCount: number;
  responseRate: number;
  categoryAverage: number;
  industryRank: number;
  totalCompetitors: number;
}

export default function ReviewsAnalytics({ companyId, themeMode = 'light' }: ReviewsAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const resp = await (await import('@/lib/api-analytics')).analyticsApi.getReviewAnalytics(Number(companyId));
        const total = resp.total_reviews || 0;
        const avg = resp.average_rating || 0;
        const dist = resp.rating_distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        const distributionArr = [5,4,3,2,1].map(r => ({ rating: r, count: dist[r as 5|4|3|2|1] || 0, percentage: total ? Math.round(((dist[r as 5|4|3|2|1] || 0) / total) * 100) : 0 }));
        setStats({
          totalReviews: total,
          averageRating: avg,
          ratingDistribution: distributionArr,
          recentReviews: resp.recent_reviews || [],
          monthlyTrend: 0,
          verifiedCount: (resp.recent_reviews || []).filter((r: any) => r.verified).length,
          responseRate: 0,
          categoryAverage: 0,
          industryRank: 0,
          totalCompetitors: 0,
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [companyId]);

  const isDark = themeMode === 'dark';
  const s = stats || { totalReviews: 0, averageRating: 0, ratingDistribution: [], recentReviews: [], monthlyTrend: 0, verifiedCount: 0, responseRate: 0, categoryAverage: 0, industryRank: 0, totalCompetitors: 0 };

  return (
    <div className="space-y-6">
      {/* Header with Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Reviews */}
        <Card className={`relative overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-muted-foreground'} mb-2`}>
                  Total de Reviews
                </p>
                <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-foreground'}`}>
                  {s.totalReviews}
                </p>
                <div className="flex items-center mt-2 gap-1">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-600">
                    +{s.monthlyTrend}%
                  </span>
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
                    vs mês anterior
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                <MessageSquare className={`h-6 w-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
            </div>
          </CardContent>
          <div className={`absolute bottom-0 left-0 right-0 h-1 ${isDark ? 'bg-blue-500/20' : 'bg-blue-500/10'}`}>
            <div className="h-full bg-blue-500 w-4/5"></div>
          </div>
        </Card>

        {/* Average Rating */}
        <Card className={`relative overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-muted-foreground'} mb-2`}>
                  Avaliação Média
                </p>
                <div className="flex items-end gap-2">
                  <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-foreground'}`}>
                    {s.averageRating.toFixed(1)}
                  </p>
                  <div className="flex gap-0.5 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(stats?.averageRating || 0)
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
                  {s.verifiedCount} verificados ({(s.totalReviews ? ((s.verifiedCount / s.totalReviews) * 100).toFixed(0) : '0')}%)
                </p>
              </div>
              <div className={`p-3 rounded-xl ${isDark ? 'bg-yellow-900/20' : 'bg-yellow-50'}`}>
                <Star className={`h-6 w-6 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
              </div>
            </div>
          </CardContent>
          <div className={`absolute bottom-0 left-0 right-0 h-1 ${isDark ? 'bg-yellow-500/20' : 'bg-yellow-500/10'}`}>
            <div className="h-full bg-yellow-500" style={{ width: `${((stats?.averageRating || 0) / 5) * 100}%` }}></div>
          </div>
        </Card>

        {/* Response Rate */}
        <Card className={`relative overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-muted-foreground'} mb-2`}>
                  Taxa de Resposta
                </p>
                <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-foreground'}`}>
                  {s.responseRate}%
                </p>
                <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
                  {Math.floor(s.totalReviews * (s.responseRate / 100))} reviews respondidos
                </p>
              </div>
              <div className={`p-3 rounded-xl ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-50'}`}>
                <ThumbsUp className={`h-6 w-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              </div>
            </div>
          </CardContent>
          <div className={`absolute bottom-0 left-0 right-0 h-1 ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-500/10'}`}>
            <div className="h-full bg-emerald-500" style={{ width: `${s.responseRate}%` }}></div>
          </div>
        </Card>

        {/* Industry Rank */}
        <Card className={`relative overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-muted-foreground'} mb-2`}>
                  Ranking na Categoria
                </p>
                <div className="flex items-baseline gap-2">
                  <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-foreground'}`}>
                    #{s.industryRank}
                  </p>
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
                    de {s.totalCompetitors}
                  </span>
                </div>
                <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
                  Top {Math.ceil((s.industryRank / s.totalCompetitors) * 100)}% da categoria
                </p>
              </div>
              <div className={`p-3 rounded-xl ${isDark ? 'bg-purple-900/20' : 'bg-purple-50'}`}>
                <Award className={`h-6 w-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
            </div>
          </CardContent>
          <div className={`absolute bottom-0 left-0 right-0 h-1 ${isDark ? 'bg-purple-500/20' : 'bg-purple-500/10'}`}>
            <div className="h-full bg-purple-500" style={{ width: `${((s.totalCompetitors - s.industryRank + 1) / s.totalCompetitors) * 100}%` }}></div>
          </div>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <Card className={isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}>
          <CardHeader>
            <CardTitle className={isDark ? 'text-white' : 'text-foreground'}>
              Distribuição de Avaliações
            </CardTitle>
            <CardDescription className={isDark ? 'text-slate-400' : ''}>
              Breakdown por estrelas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {s.ratingDistribution.map((item) => (
              <div key={item.rating} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-foreground'}`}>
                      {item.rating} estrela{item.rating !== 1 ? 's' : ''}
                    </span>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < item.rating
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
                      {item.count} reviews
                    </span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-foreground'} min-w-[3rem] text-right`}>
                      {item.percentage}%
                    </span>
                  </div>
                </div>
                <Progress 
                  value={item.percentage} 
                  className={`h-2 ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Competitor Comparison */}
        <Card className={isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}>
          <CardHeader>
            <CardTitle className={isDark ? 'text-white' : 'text-foreground'}>
              Comparação com Categoria
            </CardTitle>
            <CardDescription className={isDark ? 'text-slate-400' : ''}>
              Benchmarking com players da categoria
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Your Company */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                    <Building2 className={`h-4 w-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-foreground'}`}>
                      Sua Empresa
                    </p>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
                      {s.totalReviews} reviews
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(s.averageRating)
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-foreground'}`}>
                    {s.averageRating.toFixed(1)}
                  </span>
                </div>
              </div>
              <Progress 
                value={(s.averageRating / 5) * 100} 
                className={`h-3 ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}
              />
            </div>

            {/* Category Average */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                    <BarChart3 className={`h-4 w-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-foreground'}`}>
                      Média da Categoria
                    </p>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
                      {s.totalCompetitors} empresas
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(s.categoryAverage)
                            ? 'text-gray-400 fill-gray-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                    {s.categoryAverage.toFixed(1)}
                  </span>
                </div>
              </div>
              <Progress 
                value={(s.categoryAverage / 5) * 100} 
                className={`h-3 ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}
              />
            </div>

            {/* Performance Badge */}
            <div className={`p-4 rounded-xl ${isDark ? 'bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-slate-800' : 'bg-gradient-to-r from-blue-50 to-purple-50'}`}>
              <div className="flex items-center gap-3">
                <Award className={`h-6 w-6 ${s.averageRating > s.categoryAverage ? 'text-yellow-500' : isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                <div>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-foreground'}`}>
                    {s.averageRating > s.categoryAverage 
                      ? `${((s.averageRating - s.categoryAverage) / s.categoryAverage * 100).toFixed(1)}% acima da média`
                      : `${((s.categoryAverage - s.averageRating) / s.categoryAverage * 100).toFixed(1)}% abaixo da média`
                    }
                  </p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
                    {s.averageRating > s.categoryAverage
                      ? 'Você está performando melhor que a maioria!'
                      : 'Há espaço para melhorias'
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights and Recommendations */}
      <Card className={isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isDark ? 'text-white' : 'text-foreground'}`}>
            <Target className="h-5 w-5 text-blue-500" />
            Insights e Recomendações
          </CardTitle>
          <CardDescription className={isDark ? 'text-slate-400' : ''}>
            Baseado na análise dos seus reviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: 'Alta Satisfação',
                description: `${(s.ratingDistribution[0]?.percentage ?? 0)}% dos seus clientes deram 5 estrelas`,
                type: 'success',
                icon: ThumbsUp,
              },
              {
                title: 'Resposta Exemplar',
                description: `Taxa de resposta de ${s.responseRate}% está excelente`,
                type: 'success',
                icon: MessageSquare,
              },
              {
                title: 'Destaque na Categoria',
                description: `Você está entre os top ${Math.ceil((s.industryRank / s.totalCompetitors) * 100)}% da categoria`,
                type: s.industryRank <= 10 ? 'success' : 'info',
                icon: Award,
              },
              {
                title: 'Crescimento Consistente',
                description: `+${s.monthlyTrend}% de reviews vs mês anterior`,
                type: 'success',
                icon: TrendingUp,
              },
            ].map((insight, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border ${
                  isDark
                    ? insight.type === 'success'
                      ? 'bg-emerald-900/10 border-emerald-800/30'
                      : 'bg-blue-900/10 border-blue-800/30'
                    : insight.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    isDark
                      ? insight.type === 'success'
                        ? 'bg-emerald-900/20'
                        : 'bg-blue-900/20'
                      : insight.type === 'success'
                      ? 'bg-emerald-100'
                      : 'bg-blue-100'
                  }`}>
                    <insight.icon className={`h-5 w-5 ${
                      insight.type === 'success'
                        ? 'text-emerald-600'
                        : 'text-blue-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-foreground'}`}>
                      {insight.title}
                    </h4>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
                      {insight.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper component for Building2 icon
function Building2({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  );
}
