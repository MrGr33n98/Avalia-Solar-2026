'use client';

import { motion } from 'framer-motion';
import { Target, Users, MapPin, TrendingUp, Lock, ArrowUpRight, Zap, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface OpportunityBoardProps {
  stats: {
    leads_received: number;
    marketplace_potential: {
      leads_in_category: number;
      leads_in_region: number;
      market_share_percent: number;
    };
    active_categories: Array<{
      id: number;
      name: string;
      leads_in_category: number;
    }>;
  };
  isPremium: boolean;
}

export default function OpportunityBoard({ stats, isPremium }: OpportunityBoardProps) {
  const { marketplace_potential, active_categories, leads_received } = stats;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
      
      {/* 🚀 MAIN OPPORTUNITY PANEL (Leads Direct vs Market) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-8 relative overflow-hidden bg-white dark:bg-slate-900 rounded-xl p-8 shadow-sm border border-slate-200 dark:border-slate-800"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                <Target className="w-5 h-5 text-brand-blue" />
                Radar de Oportunidades
              </h3>
              <p className="text-sm text-slate-500 dark:text-white/40 font-medium">Análise de penetração de mercado e leads disponíveis.</p>
            </div>
            <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider">
              Últimos 30 dias
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Direct Leads */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Users className="w-3 h-3" /> Seus Leads
              </span>
              <div className="flex items-baseline gap-2">
                <h4 className="text-4xl font-bold text-brand-blue tracking-tighter">{leads_received}</h4>
                <span className="text-xs font-bold text-slate-400">diretos</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-2">
                Leads que converteram especificamente para sua marca.
              </p>
            </div>

            {/* Category Potential */}
            <div className="flex flex-col gap-2 relative group">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" /> Potencial Categoria
              </span>
              
              <div className={cn(
                "flex items-baseline gap-2 transition-all duration-500",
                !isPremium && "blur-md select-none opacity-40"
              )}>
                <h4 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tighter">
                  {marketplace_potential.leads_in_category}
                </h4>
                <span className="text-xs font-bold text-slate-400">leads</span>
              </div>

              {!isPremium && (
                <div className="absolute inset-0 flex items-center justify-center pt-6">
                  <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 shadow-lg animate-bounce">
                    <Lock className="w-3 h-3" /> Ver Mercado
                  </div>
                </div>
              )}
              
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-2">
                Oportunidades totais geradas em suas categorias.
              </p>
            </div>

            {/* Region Potential */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <MapPin className="w-3 h-3" /> Potencial Região
              </span>
              <div className="flex items-baseline gap-2">
                <h4 className="text-4xl font-bold text-brand-green tracking-tighter">
                  {marketplace_potential.leads_in_region}
                </h4>
                <span className="text-xs font-bold text-slate-400">leads</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-2">
                Leads gerados em sua cidade e estado.
              </p>
            </div>
          </div>

          <div className="mt-10 p-6 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0">
                <Zap className="w-7 h-7 text-amber-500 fill-amber-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Seu Market Share Atual: {marketplace_potential.market_share_percent}%</p>
                <p className="text-xs text-slate-500 font-medium">Você está captando 1 a cada {Math.ceil(100 / (marketplace_potential.market_share_percent || 1))} leads da sua categoria.</p>
              </div>
            </div>
            {!isPremium && (
              <Button className="bg-brand-blue hover:bg-blue-700 text-white font-bold rounded-xl px-8 shadow-sm transition-all active:scale-95 shrink-0">
                Dominar Categoria <ArrowUpRight className="ml-2 w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Abstract Background Shapes */}
        <div className="absolute top-[-10%] right-[-5%] w-64 h-64 bg-blue-50/50 dark:bg-brand-blue/5 rounded-full blur-3xl pointer-events-none" />
      </motion.div>

      {/* 🏷️ CATEGORY LISTING PANEL */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-xl p-8 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col"
      >
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Suas Listagens</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-slate-300" />
              </TooltipTrigger>
              <TooltipContent className="bg-slate-900 text-white border-none rounded-lg text-[10px] font-bold p-3">
                Categorias onde sua empresa aparece nos resultados de busca.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="space-y-4 flex-1">
          {active_categories.map((cat, idx) => (
            <div key={cat.id} className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800 group hover:bg-white dark:hover:bg-slate-800 transition-all duration-300">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{cat.name}</span>
                <Badge variant="outline" className="text-[9px] font-bold border-slate-200 text-slate-400 rounded-lg group-hover:border-blue-200 group-hover:text-brand-blue">Ativa</Badge>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-blue rounded-full" 
                    style={{ width: `${Math.min(100, (cat.leads_in_category / (marketplace_potential.leads_in_category || 1)) * 100)}%` }}
                  />
                </div>
                <span className={cn(
                  "text-[10px] font-mono font-black",
                  !isPremium && "blur-[3px]"
                )}>
                  {cat.leads_in_category} leads
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center mb-4">Deseja expandir sua área de atuação?</p>
          <Button variant="outline" className="w-full rounded-xl font-bold text-xs border-slate-200 dark:border-slate-800 text-slate-600 dark:text-white/60 hover:bg-slate-50 transition-all">
            Adicionar Categoria
          </Button>
        </div>
      </motion.div>

    </div>
  );
}
