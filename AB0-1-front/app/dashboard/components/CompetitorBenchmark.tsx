'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Star, 
  Users, 
  Award, 
  Target, 
  Zap, 
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ZapOff,
  Flame,
  Activity,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import MetricCard from './MetricCard';
import { companyDashboardApi, type RankingData } from '@/lib/api';

interface CompetitorBenchmarkProps {
  companyId: string;
  themeMode?: 'light' | 'dark';
}

interface Competitor {
  id: number;
  name: string;
  logo_url?: string;
  rating: number;
  reviewsCount: number;
  responseRate: number;
  featured: boolean;
  verified: boolean;
  marketShare?: number;
  completenessOfVision?: number;
  abilityToExecute?: number;
}

export default function CompetitorBenchmark({ companyId, themeMode = 'dark' }: CompetitorBenchmarkProps) {
  // Deep dark foundation for Strategic Intelligence
  const isDark = true;

  // State for real API data
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real ranking data from API
  useEffect(() => {
    async function fetchRankingData() {
      try {
        setLoading(true);
        const data = await companyDashboardApi.getRanking(companyId);
        setRankingData(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch ranking data:', err);
        setError('Failed to load ranking data');
      } finally {
        setLoading(false);
      }
    }

    if (companyId) {
      fetchRankingData();
    }
  }, [companyId]);

  // Transform API data to competitor format
  const competitorsFromAPI: Competitor[] = rankingData?.magic_quadrant_points?.map((point) => ({
    id: point.id,
    name: point.name,
    logo_url: point.logo_url,
    rating: point.rating,
    reviewsCount: 0, // Not available in ranking endpoint
    responseRate: 0, // Not available in ranking endpoint
    featured: false,
    verified: true,
    marketShare: undefined,
    completenessOfVision: point.completeness_of_vision,
    abilityToExecute: point.ability_to_execute
  })) || [];

  // Find current company in the list
  const yourCompanyData = competitorsFromAPI.find(c => c.id === parseInt(companyId)) || competitorsFromAPI[0];
  
  // Use API data or fallback to mock data
  const yourCompany: Competitor = yourCompanyData || {
    id: parseInt(companyId) || 1,
    name: 'Sua Empresa',
    rating: 0,
    reviewsCount: 0,
    responseRate: 0,
    featured: false,
    verified: false,
    marketShare: 0
  };

  // Filter out current company from competitors list
  const topCompetitors: Competitor[] = competitorsFromAPI
    .filter(c => c.id !== parseInt(companyId))
    .slice(0, 4);

  // Fallback to mock data if API fails
  const allCompanies = (competitorsFromAPI.length > 0 
    ? [yourCompany, ...topCompetitors]
    : [
        { id: parseInt(companyId) || 1, name: 'Sua Empresa', rating: 4.8, reviewsCount: 342, responseRate: 98, featured: true, verified: true, marketShare: 22 },
        { id: 2, name: 'Solar Prime', rating: 4.9, reviewsCount: 432, responseRate: 87, featured: true, verified: true, marketShare: 28 },
        { id: 3, name: 'EcoSolar Brasil', rating: 4.6, reviewsCount: 356, responseRate: 91, featured: true, verified: true, marketShare: 18 },
        { id: 4, name: 'SunPower Instalações', rating: 4.5, reviewsCount: 298, responseRate: 78, featured: false, verified: true, marketShare: 15 }
      ]
  ).sort((a, b) => (b.marketShare || 0) - (a.marketShare || 0));

  const yourRank = allCompanies.findIndex(c => c.id === parseInt(companyId)) + 1 || rankingData?.rank_position || 1;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-12"
    >
      {/* Strategic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-brand-blue mb-1">
            <Activity className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Competitor Intelligence</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter uppercase text-white">
            Benchmark <span className="text-brand-blue">Analítico</span>
          </h2>
          <p className="text-sm text-white/40 max-w-md font-medium leading-relaxed">
            Monitoramento em tempo real do ecossistema competitivo e posicionamento estratégico de mercado.
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" className="h-11 border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-widest text-[10px]">
            Exportar Relatório
          </Button>
          <Button className="h-11 bg-brand-blue hover:bg-brand-blue text-white font-bold uppercase tracking-widest text-[10px] shadow-[0_0_20px_rgba(37,99,235,0.3)]">
            Ação Proativa
          </Button>
        </div>
      </div>

      {/* KPI Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Posição de Mercado"
          value={`#${yourRank}`}
          change="+1"
          changeType="positive"
          icon={Trophy}
          description="Ranking na categoria"
          variant="glass"
        />
        <MetricCard
          title="Market Share"
          value={`${yourCompany.marketShare}%`}
          change="+2.4%"
          changeType="positive"
          icon={Target}
          description="Quota de mercado local"
          variant="glass"
        />
        <MetricCard
          title="Sentiment Gap"
          value="+0.2"
          change="Acima da média"
          changeType="positive"
          icon={Star}
          description="Diferencial de reputação"
          variant="glass"
        />
        <MetricCard
           title="Velocity Score"
           value="88/100"
           change="Fase de Expansão"
           changeType="positive"
           icon={Flame}
           description="Velocidade de crescimento"
           variant="glass"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Ranking Table */}
        <Card className="lg:col-span-8 clay-precision border-none rounded-[2rem] bg-[#002B4D]/50 backdrop-blur-xl overflow-hidden shadow-2xl">
          <CardHeader className="p-8 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black text-white uppercase tracking-tight">Espectro de Liderança</CardTitle>
                <CardDescription className="text-white/40 font-medium">Top 4 players monitorados no setor</CardDescription>
              </div>
              <Badge className="bg-brand-blue/20 text-blue-400 border-none hover:bg-brand-blue/30 font-black tracking-widest text-[10px] py-1 px-3">
                LIVE UPDATES
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="px-8 py-5 text-left text-[10px] font-black text-white/40 uppercase tracking-widest">Identidade</th>
                    <th className="px-6 py-5 text-center text-[10px] font-black text-white/40 uppercase tracking-widest">Share</th>
                    <th className="px-6 py-5 text-center text-[10px] font-black text-white/40 uppercase tracking-widest">Sentimento</th>
                    <th className="px-6 py-5 text-center text-[10px] font-black text-white/40 uppercase tracking-widest">Respostas</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-white/40 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {allCompanies.map((company, index) => {
                    const isYou = company.id === yourCompany.id;
                    return (
                      <motion.tr 
                        key={company.id}
                        variants={itemVariants}
                        className={cn(
                          "group transition-all hover:bg-white/[0.03]",
                          isYou && "bg-brand-blue/[0.03]"
                        )}
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <span className={cn(
                              "text-lg font-black italic min-w-[24px]",
                              index === 0 ? "text-amber-500" : "text-white/20"
                            )}>
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <Avatar className="h-12 w-12 rounded-xl border border-white/10 shadow-lg ring-offset-background p-1 bg-white">
                              <AvatarImage src={company.logo_url} className="object-contain" />
                              <AvatarFallback className="bg-blue-900/50 text-white font-black">
                                {company.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm">{company.name}</span>
                                {isYou && (
                                  <Badge className="bg-brand-blue text-[10px] font-black py-0 px-2">VOCÊ</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {company.verified && <ShieldCheck className="h-3 w-3 text-blue-400" />}
                                <span className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Entidade Verificada</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <div className="space-y-1">
                            <span className="text-sm font-black text-white font-mono">{company.marketShare}%</span>
                            <div className="w-20 mx-auto">
                               <Progress value={company.marketShare} className="h-1 bg-white/5" indicatorClassName="bg-brand-blue shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1 mb-1">
                              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                              <span className="text-sm font-black text-white font-mono">{company.rating.toFixed(1)}</span>
                            </div>
                            <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{company.reviewsCount} REVIEWS</span>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <div className="space-y-1">
                             <span className="text-sm font-black text-emerald-400 font-mono">{company.responseRate}%</span>
                             <div className="flex gap-0.5 justify-center">
                               {[...Array(5)].map((_, i) => (
                                 <div key={i} className={cn(
                                   "h-1 w-2 rounded-full",
                                   i < Math.floor(company.responseRate / 20) ? "bg-brand-green" : "bg-white/10"
                                 )} />
                               ))}
                             </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex flex-col items-end gap-2">
                            {index === 0 ? (
                              <Badge className="bg-amber-500/10 text-amber-500 border-none font-black text-[9px] tracking-widest px-2">LÍDER DE MERCADO</Badge>
                            ) : company.featured ? (
                              <Badge className="bg-brand-blue/10 text-brand-blue border-none font-black text-[9px] tracking-widest px-2">VISIONÁRIO</Badge>
                            ) : (
                              <Badge className="bg-white/5 text-white/30 border-none font-black text-[9px] tracking-widest px-2">DESAFIANTE</Badge>
                            )}
                            <div className="flex items-center gap-1 text-[10px] font-bold text-brand-green">
                               <TrendingUp className="h-3 w-3" />
                               <span className="font-mono">+1.2%</span>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
          <div className="p-6 bg-white/[0.01] border-t border-white/5 text-center">
            <Button variant="ghost" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white hover:bg-transparent">
              Visualizar Ecossistema Completo <ArrowRight className="ml-2 h-3 w-3" />
            </Button>
          </div>
        </Card>

        {/* Tactical Recommendation Column */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="clay-precision border-none rounded-[2rem] bg-gradient-to-br from-blue-600/30 to-purple-600/30 backdrop-blur-xl p-8 relative overflow-hidden group shadow-xl">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-brand-blue/20 rounded-full blur-3xl transition-transform group-hover:scale-150 duration-700" />
            <div className="relative z-10 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Vantagem Tática</h4>
                <p className="text-sm text-white/80 leading-relaxed font-medium">
                  Seu diferencial competitivo reside na <span className="text-white font-black underline decoration-blue-400">Taxa de Resposta</span>. 
                  Você responde 11% mais rápido que o líder de mercado.
                </p>
              </div>
              <Button className="w-full h-11 bg-white text-brand-blue font-black uppercase tracking-widest text-[10px] hover:bg-white/90">
                Ver Insights IA
              </Button>
            </div>
          </Card>

          <Card className="clay-precision border-none rounded-[2rem] bg-[#002B4D]/50 backdrop-blur-xl p-8 shadow-xl">
            <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              Priority Gaps
            </h4>
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-white">
                  <span>Reviews Volume Gap</span>
                  <span className="text-amber-500">-90 Units</span>
                </div>
                <Progress value={78} className="h-1.5 bg-white/5" indicatorClassName="bg-amber-500" />
                <p className="text-[10px] text-white/40 font-medium">Faltam 90 avaliações para empatar com Solar Prime.</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-white">
                  <span>Sentiment Velocity</span>
                  <span className="text-brand-green">Critical</span>
                </div>
                <Progress value={92} className="h-1.5 bg-white/5" indicatorClassName="bg-brand-green" />
                <p className="text-[10px] text-white/40 font-medium">Sua tendência de NPS está 12% superior ao setor.</p>
              </div>
              
              <div className="pt-4 mt-4 border-t border-white/5">
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                   <ZapOff className="h-5 w-5 text-purple-400 shrink-0" />
                   <div>
                     <p className="text-[10px] font-black text-white uppercase tracking-widest">Growth Engine</p>
                     <p className="text-[11px] text-white/40 font-bold">Otimize a coleta de reviews para escalada.</p>
                   </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
