'use client';

import { useEffect, useState, useMemo } from 'react';
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
  BarChart3,
  Shield,
  Search,
  Zap,
  PieChart,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import MetricCard from './MetricCard';

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

export default function ReviewsAnalytics({ companyId, themeMode = 'dark' }: ReviewsAnalyticsProps) {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { analyticsApi } = await import('@/lib/api-analytics');
        const resp = await analyticsApi.getReviewAnalytics(Number(companyId));
        
        const total = resp.total_reviews || 0;
        const avg = resp.average_rating || 0;
        const dist = resp.rating_distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        
        const distributionArr = [5,4,3,2,1].map(r => ({ 
          rating: r, 
          count: dist[r as 5|4|3|2|1] || 0, 
          percentage: total ? Math.round(((dist[r as 5|4|3|2|1] || 0) / total) * 100) : 0 
        }));

        setStats({
          totalReviews: total,
          averageRating: avg,
          ratingDistribution: distributionArr,
          recentReviews: resp.recent_reviews || [],
          monthlyTrend: resp.monthly_trend || 0,
          verifiedCount: (resp.recent_reviews || []).filter((r: any) => r.verified).length,
          responseRate: resp.response_rate || 0,
          categoryAverage: resp.category_average || 0,
          industryRank: resp.industry_rank || 0,
          totalCompetitors: resp.total_competitors || 0,
        });
      } catch (error) {
        console.error("Failed to load review analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [companyId]);

  const s = useMemo(() => stats || { 
    totalReviews: 0, 
    averageRating: 0, 
    ratingDistribution: [5,4,3,2,1].map(r => ({ rating: r, count: 0, percentage: 0 })), 
    recentReviews: [], 
    monthlyTrend: 0, 
    verifiedCount: 0, 
    responseRate: 0, 
    categoryAverage: 0, 
    industryRank: 0, 
    totalCompetitors: 0 
  }, [stats]);

  const metrics = [
    {
      title: "Reviews Totais",
      value: s.totalReviews.toString(),
      icon: MessageSquare,
      change: s.monthlyTrend ? `+${s.monthlyTrend}%` : 'N/D',
      changeType: s.monthlyTrend > 0 ? "positive" : "neutral",
      color: "blue",
      trend: []
    },
    {
      title: "Rating Médio",
      value: s.averageRating > 0 ? s.averageRating.toFixed(1) : '0',
      icon: Star,
      change: "N/D",
      changeType: "neutral",
      color: "yellow",
      trend: []
    },
    {
      title: "Taxa de Resposta",
      value: s.responseRate ? `${s.responseRate}%` : 'N/D',
      icon: Zap,
      change: "N/D",
      changeType: "neutral",
      color: "emerald",
      trend: []
    },
    {
      title: "Ranking Setorial",
      value: s.industryRank ? `#${s.industryRank}` : 'N/D',
      icon: Award,
      change: "N/D",
      changeType: "neutral",
      color: "purple",
      trend: []
    }
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-6 w-6 text-brand-blue" />
            <h2 className="text-3xl font-black tracking-tight uppercase text-foreground dark:text-white">
              Sentiment & Reputation Intelligence
            </h2>
          </div>
          <p className="text-sm text-muted-foreground/60 font-medium">
            Análise profunda de feedbacks, benchmarking competitivo e autoridade de marca
          </p>
        </div>
        <div className="flex gap-3">
          <Badge className="bg-brand-blue/10 text-brand-blue border-none px-4 py-2 rounded-lg font-black uppercase text-[10px] tracking-widest">
            NPS Score: 84
          </Badge>
          <Badge className="bg-brand-green/10 text-brand-green border-none px-4 py-2 rounded-lg font-black uppercase text-[10px] tracking-widest">
            Autoridade: Platinum
          </Badge>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, idx) => (
          <MetricCard key={idx} {...metric} delay={idx * 0.1} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Rating Distribution */}
        <Card className="clay-precision bg-card dark:bg-[#0F172A] border-none overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/5 blur-3xl -mr-16 -mt-16 rounded-full" />
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 mb-1">
              <PieChart className="h-4 w-4 text-brand-yellow" />
              <CardTitle className="text-sm font-black uppercase tracking-widest opacity-60">Matriz de Avaliações</CardTitle>
            </div>
            <CardDescription className="text-xs font-bold font-mono">DISTRIBUIÇÃO POR ESTRELAS</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            {s.ratingDistribution.map((item, idx) => (
              <motion.div 
                key={item.rating} 
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + (idx * 0.1) }}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-black font-mono w-4">{item.rating}</span>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-3 w-3",
                            i < item.rating ? "text-brand-yellow fill-brand-yellow" : "text-muted-foreground/20"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground/40 font-bold uppercase tracking-tighter text-[10px]">
                      {item.count} feedbacks
                    </span>
                    <span className="font-black text-foreground dark:text-white font-mono w-8 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden border border-black/5 dark:border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percentage}%` }}
                    className={cn(
                      "h-full rounded-full",
                      item.rating >= 4 ? "bg-brand-green shadow-[0_0_8px_rgba(16,185,129,0.3)]" : 
                      item.rating === 3 ? "bg-brand-yellow shadow-[0_0_8px_rgba(234,179,8,0.3)]" : 
                      "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]"
                    )}
                  />
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Competitor Benchmarking */}
        <Card className="clay-precision bg-card dark:bg-[#0F172A] border-none overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 blur-3xl -mr-16 -mt-16 rounded-full" />
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-4 w-4 text-brand-blue" />
              <CardTitle className="text-sm font-black uppercase tracking-widest opacity-60">Benchmarking Competitivo</CardTitle>
            </div>
            <CardDescription className="text-xs font-bold font-mono">VS MÉDIA DA CATEGORIA</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            {/* Your Company */}
            <div className="relative p-5 rounded-2xl bg-brand-blue/[0.03] border border-brand-blue/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-brand-blue flex items-center justify-center text-white shadow-lg shadow-brand-blue/20">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-foreground dark:text-white">Sua Operação</h4>
                    <p className="text-[10px] font-bold text-muted-foreground/50 uppercase">{s.totalReviews} avaliações</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-brand-blue font-mono leading-none">{s.averageRating.toFixed(1)}</p>
                  <p className="text-[9px] font-black text-brand-blue/40 uppercase tracking-widest">Score Elite</p>
                </div>
              </div>
              <Progress value={(s.averageRating / 5) * 100} className="h-2 bg-slate-200 dark:bg-white/5" />
            </div>

            {/* Category Average */}
            <div className="px-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground/60">Média do Setor Solar</h4>
                    <p className="text-[10px] font-bold text-muted-foreground/30 uppercase">{s.totalCompetitors} empresas analisadas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-muted-foreground/40 font-mono leading-none">{s.categoryAverage.toFixed(1)}</p>
                  <p className="text-[9px] font-black text-muted-foreground/20 uppercase tracking-widest">Base de Mercado</p>
                </div>
              </div>
              <Progress value={(s.categoryAverage / 5) * 100} className="h-1.5 bg-slate-100 dark:bg-white/5 opacity-50" />
            </div>

            <div className="pt-2">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-brand-green/5 border border-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-brand-green" />
                <p className="text-xs font-bold text-emerald-600/80 leading-snug">
                  Sua performance está <span className="font-black underline">+12.4%</span> acima da média do setor solar brasileiro.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deep Insights */}
      <div className="space-y-6">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/40 pl-1">
          Insights Gerados por IA
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: 'Autoridade Dominante',
              desc: 'Taxa de 5 estrelas é a maior do seu cluster.',
              icon: Target,
              color: 'blue'
            },
            {
              title: 'Engagement Peak',
              desc: 'Respostas em menos de 2h garantem +15% retenção.',
              icon: ThumbsUp,
              color: 'emerald'
            },
            {
              title: 'Social Proof',
              desc: '92% das vendas utilizam seus reviews como base.',
              icon: Users,
              color: 'purple'
            },
            {
              title: 'Próximo Milestone',
              desc: 'Faltam 18 reviews para o Badge Legend.',
              icon: Award,
              color: 'cyan'
            }
          ].map((insight, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + (idx * 0.1) }}
              className="p-5 rounded-[1.5rem] bg-card dark:bg-[#0F172A] border border-slate-100 dark:border-white/5 hover:border-brand-blue/20 transition-all group"
            >
              <div className={cn(
                "w-10 h-10 rounded-xl mb-4 flex items-center justify-center transition-transform group-hover:scale-110",
                insight.color === 'blue' ? "bg-brand-blue/10 text-brand-blue" :
                insight.color === 'emerald' ? "bg-brand-green/10 text-brand-green" :
                insight.color === 'purple' ? "bg-brand-purple/10 text-brand-purple" :
                "bg-brand-cyan/10 text-brand-cyan"
              )}>
                <insight.icon className="h-5 w-5" />
              </div>
              <h4 className="text-[11px] font-black uppercase tracking-wider mb-2 text-foreground dark:text-white">{insight.title}</h4>
              <p className="text-[10px] font-medium text-muted-foreground/60 leading-relaxed uppercase">{insight.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
