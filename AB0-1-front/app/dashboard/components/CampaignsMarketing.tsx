'use client';

import { useState } from 'react';
import { 
  Megaphone, 
  Plus, 
  BarChart3, 
  TrendingUp, 
  Target, 
  Zap, 
  DollarSign, 
  Users, 
  ArrowUpRight,
  Clock,
  MoreVertical,
  Calendar,
  Layers,
  Rocket
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import MetricCard from './MetricCard';

interface CampaignsMarketingProps {
  companyId: string;
}

export default function CampaignsMarketing({ companyId }: CampaignsMarketingProps) {
  const [campaigns] = useState([
    { 
      id: '1', 
      name: 'Campanha de Verão 2024 - Elite Solar', 
      status: 'active',
      goal: 100,
      achieved: 67,
      budget: 5000,
      spent: 3200,
      roas: 4.2,
      reach: 12500,
      start_date: '2024-01-01',
      end_date: '2024-03-31'
    },
    { 
      id: '2', 
      name: 'Lead Magnet Black Friday - 25% Off', 
      status: 'completed',
      goal: 200,
      achieved: 215,
      budget: 10000,
      spent: 8500,
      roas: 3.8,
      reach: 45000,
      start_date: '2023-11-15',
      end_date: '2023-11-30'
    },
  ]);

  const summaryMetrics = [
    {
      title: "Investimento Total",
      value: "R$ 11.700",
      icon: DollarSign,
      change: "+15.2%",
      changeType: "positive" as const,
      color: "blue",
      trend: [30, 45, 40, 55, 60, 50, 65]
    },
    {
      title: "ROI Médio",
      value: "385%",
      icon: TrendingUp,
      change: "+2.4%",
      changeType: "positive" as const,
      color: "green",
      trend: [60, 65, 70, 75, 80, 85, 90]
    },
    {
      title: "ROAS Consolidado",
      value: "4.0x",
      icon: Zap,
      change: "+0.3x",
      changeType: "positive" as const,
      color: "purple",
      trend: [50, 52, 55, 53, 58, 60, 62]
    },
    {
      title: "Reach Total",
      value: "57.5k",
      icon: Users,
      change: "+8k",
      changeType: "positive" as const,
      color: "brand-cyan",
      trend: [20, 25, 30, 35, 40, 45, 50]
    }
  ];

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Rocket className="h-6 w-6 text-brand-blue" />
            <h2 className="text-3xl font-black tracking-tight uppercase text-foreground dark:text-white">
              Growth Engineering Engine
            </h2>
          </div>
          <p className="text-sm text-muted-foreground/60 font-medium">
            Gerencie investimentos em anúncios, otimize ROAS e escale sua presença digital
          </p>
        </div>
        <Button className="h-12 px-6 rounded-xl bg-brand-blue hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-brand-blue/20 group">
          <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
          Nova Campanha de Alta Performance
        </Button>
      </div>

      {/* Summary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryMetrics.map((metric, idx) => (
          <MetricCard key={idx} {...metric} delay={idx * 0.1} />
        ))}
      </div>

      {/* Campaigns List */}
      <div className="space-y-6">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/40 pl-1">
          Campanhas Ativas & Histórico
        </h3>
        
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {campaigns.map((campaign, idx) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + (idx * 0.1) }}
              >
                <Card className="clay-precision bg-card dark:bg-[#0F172A] border-none group transition-all duration-300 hover:shadow-xl hover:shadow-brand-blue/5 hover:-translate-y-1 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col lg:flex-row">
                      {/* Left: Campaign Identification */}
                      <div className="p-6 lg:w-1/3 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/[0.01]">
                        <div className="flex items-start justify-between mb-6">
                          <div className="p-2.5 rounded-xl bg-brand-blue/10 border border-brand-blue/20">
                            <Megaphone className="h-5 w-5 text-brand-blue" />
                          </div>
                          <Badge className={cn(
                            "text-[9px] font-black uppercase px-2 h-5 tracking-widest",
                            campaign.status === 'active' 
                              ? "bg-brand-green/10 text-brand-green border-emerald-500/20" 
                              : "bg-slate-500/10 text-slate-500 border-slate-500/20"
                          )}>
                            {campaign.status === 'active' ? '● Ativa' : 'Finalizada'}
                          </Badge>
                        </div>
                        
                        <h4 className="text-lg font-black uppercase tracking-tight text-foreground dark:text-white mb-2 leading-tight truncate">
                          {campaign.name}
                        </h4>
                        
                        <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground/60 dark:text-white/30">
                          <Calendar className="h-3.5 w-3.5" />
                          <span className="font-mono">{campaign.start_date} → {campaign.end_date}</span>
                        </div>
                        
                        <div className="mt-8 flex gap-2">
                          <Button variant="outline" size="sm" className="h-9 rounded-lg border-slate-200 dark:border-white/10 text-[9px] font-black uppercase tracking-wider">
                            Configurações
                          </Button>
                          <Button size="sm" className="h-9 rounded-lg bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 text-[9px] font-black uppercase tracking-wider transition-all">
                            Dashboard Full <ArrowUpRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Right: Performance Metrics */}
                      <div className="p-6 lg:flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Meta de Conversão */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Conversões vs Meta</p>
                              <p className="text-xl font-black text-foreground dark:text-white font-mono">
                                {campaign.achieved} <span className="text-sm font-bold text-muted-foreground/30">/ {campaign.goal}</span>
                              </p>
                            </div>
                            <div className="h-10 w-10 rounded-full border-2 border-emerald-500/20 flex items-center justify-center relative">
                               <span className="text-[10px] font-black text-brand-green">
                                 {Math.round((campaign.achieved / campaign.goal) * 100)}%
                               </span>
                            </div>
                          </div>
                          <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden border border-black/5 dark:border-white/5">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(campaign.achieved / campaign.goal) * 100}%` }}
                              className="h-full bg-brand-green shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                            />
                          </div>
                        </div>

                        {/* Orçamento/Spent */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Investimento Utilizado</p>
                              <p className="text-xl font-black text-foreground dark:text-white font-mono">
                                R$ {campaign.spent.toLocaleString()} <span className="text-sm font-bold text-muted-foreground/30">/ R$ {campaign.budget.toLocaleString()}</span>
                              </p>
                            </div>
                            <div className="h-10 w-10 rounded-full border-2 border-primary/20 flex items-center justify-center">
                               <span className="text-[10px] font-black text-primary">
                                 {Math.round((campaign.spent / campaign.budget) * 100)}%
                               </span>
                            </div>
                          </div>
                          <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden border border-black/5 dark:border-white/5">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}
                              className="h-full bg-brand-blue shadow-[0_0_12px_rgba(37,99,235,0.3)]"
                            />
                          </div>
                        </div>

                        {/* Sub-metrics */}
                        <div className="md:col-span-2 grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">ROAS Atual</p>
                            <p className="text-sm font-black text-brand-blue font-mono">{campaign.roas}x</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Reach Acumulado</p>
                            <p className="text-sm font-black text-slate-700 dark:text-slate-300 font-mono">{(campaign.reach / 1000).toFixed(1)}k</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Status Projeção</p>
                            <Badge className="bg-brand-green/10 text-brand-green text-[8px] font-black border-none h-4 uppercase">No Alvo</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {campaigns.length === 0 && (
        <Card className="border-dashed border-2 border-slate-200 dark:border-white/5 bg-transparent rounded-[2rem]">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-6">
              <Megaphone className="h-8 w-8 text-slate-300 dark:text-slate-700" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tighter mb-2 text-foreground dark:text-white">Motor de Crescimento Desligado</h3>
            <p className="text-sm text-muted-foreground/50 font-medium max-w-xs mb-8">
              Inicie campanhas para capturar mais leads e aumentar seu market share no setor solar.
            </p>
            <Button className="rounded-xl h-12 bg-brand-blue text-white font-black uppercase px-8 text-[10px]">
              Criar Primeira Campanha
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
