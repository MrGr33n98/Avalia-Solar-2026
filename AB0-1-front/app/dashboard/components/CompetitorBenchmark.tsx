'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  TrendingUp, 
  Star, 
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
  isCurrentCompany: boolean;
  completenessOfVision: number;
  abilityToExecute: number;
  quadrantStrength: number;
}

export default function CompetitorBenchmark({ companyId }: CompetitorBenchmarkProps) {
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
    isCurrentCompany: point.is_current_company,
    completenessOfVision: point.completeness_of_vision,
    abilityToExecute: point.ability_to_execute,
    quadrantStrength: Number((((point.completeness_of_vision + point.ability_to_execute) / 2)).toFixed(1)),
  })) || [];

  // Find current company in the list
  const yourCompanyData = competitorsFromAPI.find(c => c.id === parseInt(companyId)) || competitorsFromAPI.find(c => c.isCurrentCompany) || competitorsFromAPI[0];
  
  // Use API data or fallback to mock data
  const yourCompany: Competitor = yourCompanyData || {
    id: parseInt(companyId) || 1,
    name: 'Sua Empresa',
    rating: 0,
    isCurrentCompany: true,
    completenessOfVision: 0,
    abilityToExecute: 0,
    quadrantStrength: 0,
  };

  // Filter out current company from competitors list
  const topCompetitors: Competitor[] = competitorsFromAPI
    .filter(c => c.id !== parseInt(companyId))
    .slice(0, 4);

  // Fallback to mock data if API fails
  const allCompanies = (competitorsFromAPI.length > 0 
    ? [yourCompany, ...topCompetitors]
    : [
        { id: parseInt(companyId) || 1, name: 'Sua Empresa', rating: 4.8, isCurrentCompany: true, completenessOfVision: 86, abilityToExecute: 91, quadrantStrength: 88.5 },
        { id: 2, name: 'Solar Prime', rating: 4.9, isCurrentCompany: false, completenessOfVision: 94, abilityToExecute: 92, quadrantStrength: 93 },
        { id: 3, name: 'EcoSolar Brasil', rating: 4.6, isCurrentCompany: false, completenessOfVision: 82, abilityToExecute: 79, quadrantStrength: 80.5 },
        { id: 4, name: 'SunPower Instalações', rating: 4.5, isCurrentCompany: false, completenessOfVision: 76, abilityToExecute: 73, quadrantStrength: 74.5 }
      ]
  ).sort((a, b) => b.quadrantStrength - a.quadrantStrength);

  const yourRank = allCompanies.findIndex(c => c.id === parseInt(companyId)) + 1 || rankingData?.rank_position || 1;
  const topLeader = allCompanies[0];
  const visionGap = Math.max(0, Number(((topLeader?.completenessOfVision || 0) - yourCompany.completenessOfVision).toFixed(1)));
  const executionGap = Math.max(0, Number(((topLeader?.abilityToExecute || 0) - yourCompany.abilityToExecute).toFixed(1)));

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

  if (error && competitorsFromAPI.length === 0) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-[2rem] border border-amber-500/20 bg-[#002B4D]/40 p-8 text-center shadow-xl">
        <div className="space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10">
            <AlertTriangle className="h-6 w-6 text-amber-400" />
          </div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-white">Falha ao carregar benchmark</p>
          <p className="text-xs font-medium text-white/50">{error}</p>
        </div>
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
          title="Força no Quadrante"
          value={`${yourCompany.quadrantStrength.toFixed(1)} pts`}
          change={`${yourCompany.completenessOfVision.toFixed(0)} visão / ${yourCompany.abilityToExecute.toFixed(0)} execução`}
          changeType="positive"
          icon={Target}
          description="Média dos eixos estratégicos"
          variant="glass"
        />
        <MetricCard
          title="Reputação Média"
          value={yourCompany.rating.toFixed(1)}
          change={rankingData?.quadrant_meta?.criterion_title || 'Score validado no ranking'}
          changeType="neutral"
          icon={Star}
          description="Nota usada no comparativo"
          variant="glass"
        />
        <MetricCard
           title="Velocity Score"
           value={`${yourCompany.abilityToExecute.toFixed(0)}/100`}
           change={`${executionGap > 0 ? `Gap de ${executionGap} pts` : 'No topo do eixo'}`}
           changeType={executionGap > 0 ? 'neutral' : 'positive'}
           icon={Flame}
           description="Capacidade de execução atual"
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
                    <th className="px-6 py-5 text-center text-[10px] font-black text-white/40 uppercase tracking-widest">Visão</th>
                    <th className="px-6 py-5 text-center text-[10px] font-black text-white/40 uppercase tracking-widest">Execução</th>
                    <th className="px-6 py-5 text-center text-[10px] font-black text-white/40 uppercase tracking-widest">Reputação</th>
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
                            <Avatar className="h-12 w-12 rounded-full border border-cyan-400/15 bg-white p-1 shadow-[0_0_20px_rgba(56,189,248,0.12)]">
                              <AvatarImage src={company.logo_url} className="rounded-full object-contain" />
                              <AvatarFallback className="rounded-full bg-blue-900/50 text-white font-black">
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
                                <ShieldCheck className="h-3 w-3 text-blue-400" />
                                <span className="text-[10px] text-white/30 font-medium uppercase tracking-wider">
                                  {isYou ? 'Empresa monitorada' : 'Concorrente monitorado'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <div className="space-y-1">
                            <span className="text-sm font-black text-white font-mono">{company.completenessOfVision.toFixed(0)}</span>
                            <div className="w-20 mx-auto">
                               <Progress value={company.completenessOfVision} className="h-1 bg-white/5" indicatorClassName="bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1 mb-1">
                              <Zap className="h-3 w-3 text-emerald-400" />
                              <span className="text-sm font-black text-white font-mono">{company.abilityToExecute.toFixed(0)}</span>
                            </div>
                            <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">PODER DE ENTREGA</span>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <div className="space-y-1">
                             <span className="text-sm font-black text-amber-400 font-mono">{company.rating.toFixed(1)}</span>
                             <span className="block text-[10px] text-white/30 font-bold uppercase tracking-widest">RATING CONSOLIDADO</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex flex-col items-end gap-2">
                            {index === 0 ? (
                              <Badge className="bg-amber-500/10 text-amber-500 border-none font-black text-[9px] tracking-widest px-2">LÍDER DE MERCADO</Badge>
                            ) : company.quadrantStrength >= 80 ? (
                              <Badge className="bg-brand-blue/10 text-brand-blue border-none font-black text-[9px] tracking-widest px-2">VISIONÁRIO</Badge>
                            ) : (
                              <Badge className="bg-white/5 text-white/30 border-none font-black text-[9px] tracking-widest px-2">DESAFIANTE</Badge>
                            )}
                            <div className="flex items-center gap-1 text-[10px] font-bold text-brand-green">
                               <TrendingUp className="h-3 w-3" />
                               <span className="font-mono">{company.quadrantStrength.toFixed(1)} pts</span>
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
                  Seu diferencial competitivo precisa concentrar energia em <span className="text-white font-black underline decoration-blue-400">execução e visão</span>. 
                  {executionGap > 0 || visionGap > 0
                    ? `Hoje o gap para o líder é de ${visionGap} pts em visão e ${executionGap} pts em execução.`
                    : 'Você já ocupa a faixa mais alta do quadrante competitivo.'}
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
                  <span>Vision Gap</span>
                  <span className="text-amber-500">-{visionGap} pts</span>
                </div>
                <Progress value={Math.max(0, 100 - visionGap)} className="h-1.5 bg-white/5" indicatorClassName="bg-amber-500" />
                <p className="text-[10px] text-white/40 font-medium">Diferença de autoridade estratégica para o líder do quadrante.</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-white">
                  <span>Execution Gap</span>
                  <span className="text-brand-green">{executionGap > 0 ? `${executionGap} pts` : 'Top Tier'}</span>
                </div>
                <Progress value={Math.max(0, 100 - executionGap)} className="h-1.5 bg-white/5" indicatorClassName="bg-brand-green" />
                <p className="text-[10px] text-white/40 font-medium">Capacidade operacional relativa ao player que lidera a categoria.</p>
              </div>
              
              <div className="pt-4 mt-4 border-t border-white/5">
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                   <ZapOff className="h-5 w-5 text-purple-400 shrink-0" />
                   <div>
                     <p className="text-[10px] font-black text-white uppercase tracking-widest">Growth Engine</p>
                     <p className="text-[11px] text-white/40 font-bold">Priorize sinais que elevem visão e execução no ranking.</p>
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
