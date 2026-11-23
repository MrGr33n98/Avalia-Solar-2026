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
  
  // Use API data or fallback
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

  // Fallback to initial view if API is empty
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
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--dashboard-accent))]" />
      </div>
    );
  }

  if (error && competitorsFromAPI.length === 0) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/[0.04] p-8 text-center shadow-xs">
        <div className="space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
          </div>
          <p className="text-sm font-semibold text-[hsl(var(--dashboard-ink))]">Falha ao carregar benchmark</p>
          <p className="text-xs text-[hsl(var(--dashboard-muted))]">{error}</p>
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
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[hsl(var(--dashboard-accent))]">
            <span className="text-xs font-semibold">Inteligência Competitiva</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-[hsl(var(--dashboard-ink))]">
            Benchmark Analítico
          </h2>
          <p className="text-xs text-[hsl(var(--dashboard-muted))] max-w-md leading-relaxed">
            Monitoramento do ecossistema competitivo e posicionamento de mercado.
          </p>
        </div>
        
        <div className="flex gap-2.5">
          <Button variant="outline" className="h-10 rounded-lg border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] text-xs font-medium text-[hsl(var(--dashboard-ink))] hover:bg-[hsl(var(--dashboard-surface))]">
            Exportar relatório
          </Button>
          <Button className="h-10 rounded-lg bg-[hsl(var(--dashboard-accent))] hover:bg-[hsl(var(--dashboard-accent))/0.9] text-xs font-medium text-white shadow-xs">
            Ação recomendada
          </Button>
        </div>
      </div>

      {/* KPI Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Posição de mercado"
          value={`#${yourRank}`}
          change="+1"
          changeType="positive"
          icon={Trophy}
          description="Ranking na categoria"
        />
        <MetricCard
          title="Força no quadrante"
          value={`${yourCompany.quadrantStrength.toFixed(1)} pts`}
          change={`${yourCompany.completenessOfVision.toFixed(0)} visão / ${yourCompany.abilityToExecute.toFixed(0)} execução`}
          changeType="positive"
          icon={Target}
          description="Média dos eixos estratégicos"
        />
        <MetricCard
          title="Reputação média"
          value={yourCompany.rating.toFixed(1)}
          change={rankingData?.quadrant_meta?.criterion_title || 'Score validado no ranking'}
          changeType="neutral"
          icon={Star}
          description="Nota usada no comparativo"
        />
        <MetricCard
          title="Score de execução"
          value={`${yourCompany.abilityToExecute.toFixed(0)}/100`}
          change={executionGap > 0 ? `Gap de ${executionGap} pts` : 'No topo do eixo'}
          changeType={executionGap > 0 ? 'neutral' : 'positive'}
          icon={Activity}
          description="Capacidade de execução atual"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Ranking Table */}
        <Card className="lg:col-span-8 bg-[hsl(var(--dashboard-panel))] border border-[hsl(var(--dashboard-border))] rounded-xl overflow-hidden shadow-xs">
          <CardHeader className="p-5 border-b border-[hsl(var(--dashboard-border))]">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-[hsl(var(--dashboard-ink))]">Espectro de Liderança</CardTitle>
                <CardDescription className="text-xs text-[hsl(var(--dashboard-muted))]">Top players monitorados no setor</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-medium py-0.5 px-2.5 rounded-md border-[hsl(var(--dashboard-border))] text-[hsl(var(--dashboard-muted))]">
                Atualizado recentemente
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <caption className="sr-only">Tabela comparativa de competidores no setor solar</caption>
                <thead>
                  <tr className="border-b border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-surface))] text-[hsl(var(--dashboard-muted))]">
                    <th scope="col" className="px-5 py-3 text-left font-semibold">Empresa</th>
                    <th scope="col" className="px-4 py-3 text-center font-semibold">Visão</th>
                    <th scope="col" className="px-4 py-3 text-center font-semibold">Execução</th>
                    <th scope="col" className="px-4 py-3 text-center font-semibold">Reputação</th>
                    <th scope="col" className="px-5 py-3 text-right font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--dashboard-border))]">
                  {allCompanies.map((company, index) => {
                    const isYou = company.id === yourCompany.id;
                    return (
                      <motion.tr 
                        key={company.id}
                        variants={itemVariants}
                        className={cn(
                          "transition-colors hover:bg-[hsl(var(--dashboard-surface))]",
                          isYou && "bg-[hsl(var(--dashboard-accent))]/5"
                        )}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "font-semibold text-sm min-w-[20px]",
                              index === 0 ? "text-amber-500" : "text-[hsl(var(--dashboard-muted))]"
                            )}>
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <Avatar className="h-9 w-9 rounded-full border border-[hsl(var(--dashboard-border))] bg-white p-0.5">
                              <AvatarImage src={company.logo_url} className="rounded-full object-contain" />
                              <AvatarFallback className="rounded-full bg-[hsl(var(--dashboard-surface))] text-[hsl(var(--dashboard-ink))] font-semibold text-xs">
                                {company.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-[hsl(var(--dashboard-ink))] text-xs">{company.name}</span>
                                {isYou && (
                                  <Badge className="bg-[hsl(var(--dashboard-accent))] text-[10px] font-semibold py-0 px-1.5 rounded-sm">Você</Badge>
                                )}
                              </div>
                              <span className="text-[11px] text-[hsl(var(--dashboard-muted))]">
                                {isYou ? 'Empresa selecionada' : 'Concorrente direto'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="space-y-1">
                            <span className="font-medium text-[hsl(var(--dashboard-ink))] font-mono">{company.completenessOfVision.toFixed(0)}</span>
                            <div className="w-16 mx-auto">
                              <Progress value={company.completenessOfVision} className="h-1 bg-[hsl(var(--dashboard-surface))]" />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-medium text-[hsl(var(--dashboard-ink))] font-mono">{company.abilityToExecute.toFixed(0)}</span>
                            <span className="text-[10px] text-[hsl(var(--dashboard-muted))]">Execução</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-amber-500 font-mono">{company.rating.toFixed(1)}</span>
                            <span className="block text-[10px] text-[hsl(var(--dashboard-muted))]">Rating</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex flex-col items-end gap-1">
                            {index === 0 ? (
                              <Badge variant="outline" className="border-amber-500/30 text-amber-600 bg-amber-500/10 font-medium text-[10px] px-2 py-0.5 rounded-sm">Líder</Badge>
                            ) : company.quadrantStrength >= 80 ? (
                              <Badge variant="outline" className="border-[hsl(var(--dashboard-accent))]/30 text-[hsl(var(--dashboard-accent))] bg-[hsl(var(--dashboard-accent))]/10 font-medium text-[10px] px-2 py-0.5 rounded-sm">Visionário</Badge>
                            ) : (
                              <Badge variant="outline" className="border-[hsl(var(--dashboard-border))] text-[hsl(var(--dashboard-muted))] font-medium text-[10px] px-2 py-0.5 rounded-sm">Desafiante</Badge>
                            )}
                            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
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
          <div className="p-4 bg-[hsl(var(--dashboard-surface))] border-t border-[hsl(var(--dashboard-border))] text-center">
            <Button variant="ghost" className="text-xs font-medium text-[hsl(var(--dashboard-muted))] hover:text-[hsl(var(--dashboard-ink))]">
              Visualizar ecossistema completo <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>

        {/* Tactical Recommendation Column */}
        <div className="lg:col-span-4 space-y-5">
          <Card className="border border-[hsl(var(--dashboard-border))] rounded-xl bg-[hsl(var(--dashboard-panel))] p-5 shadow-xs">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-[hsl(var(--dashboard-ink))]">Vantagem Tática</h4>
              <p className="text-xs text-[hsl(var(--dashboard-muted))] leading-relaxed">
                Seu diferencial competitivo se concentra em <strong className="text-[hsl(var(--dashboard-ink))]">execução e visão</strong>. 
                {executionGap > 0 || visionGap > 0
                  ? ` Hoje o gap para o líder é de ${visionGap} pts em visão e ${executionGap} pts em execução.`
                  : ' Você já ocupa a faixa mais alta do quadrante competitivo.'}
              </p>
              <Button className="w-full h-10 rounded-lg bg-[hsl(var(--dashboard-accent))] text-white text-xs font-medium hover:bg-[hsl(var(--dashboard-accent))/0.9]">
                Ver recomendações táticas
              </Button>
            </div>
          </Card>

          <Card className="bg-[hsl(var(--dashboard-panel))] border border-[hsl(var(--dashboard-border))] rounded-xl p-5 shadow-xs">
            <h4 className="text-xs font-semibold text-[hsl(var(--dashboard-muted))] mb-4 flex items-center gap-1.5">
              <span>Gaps prioritários</span>
            </h4>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-medium text-[hsl(var(--dashboard-ink))]">
                  <span>Vision gap</span>
                  <span className="text-amber-600 font-mono">-{visionGap} pts</span>
                </div>
                <Progress value={Math.max(0, 100 - visionGap)} className="h-1.5 bg-[hsl(var(--dashboard-surface))]" />
                <p className="text-[11px] text-[hsl(var(--dashboard-muted))]">Diferença de autoridade estratégica para o líder da categoria.</p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-medium text-[hsl(var(--dashboard-ink))]">
                  <span>Execution gap</span>
                  <span className="text-emerald-600 font-mono">{executionGap > 0 ? `${executionGap} pts` : 'Top tier'}</span>
                </div>
                <Progress value={Math.max(0, 100 - executionGap)} className="h-1.5 bg-[hsl(var(--dashboard-surface))]" />
                <p className="text-[11px] text-[hsl(var(--dashboard-muted))]">Capacidade operacional relativa ao player que lidera a categoria.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
