'use client';

import React from 'react';
import {
  TrendingUp,
  Flame,
  Zap,
  Eye,
  GitCompare,
  ArrowUpRight,
  ShieldAlert,
  BarChart3,
  Award,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { type BuyerIntentReportingData } from '@/lib/api/buyer-intent';

interface BuyerIntentReportingProps {
  data: BuyerIntentReportingData;
  onSelectStage?: (stage: 'decision' | 'consideration' | 'awareness') => void;
}

export function BuyerIntentReporting({ data, onSelectStage }: BuyerIntentReportingProps) {
  const totalStage =
    data.buying_stage_distribution.decision +
    data.buying_stage_distribution.consideration +
    data.buying_stage_distribution.awareness || 1;

  const decisionPct = Math.round((data.buying_stage_distribution.decision / totalStage) * 100);
  const considerationPct = Math.round(
    (data.buying_stage_distribution.consideration / totalStage) * 100
  );
  const awarenessPct = Math.round((data.buying_stage_distribution.awareness / totalStage) * 100);

  const totalViews =
    data.traffic_ratio.direct_pageviews + data.traffic_ratio.competitive_pageviews || 1;
  const directPct = Math.round((data.traffic_ratio.direct_pageviews / totalViews) * 100);
  const competitivePct = 100 - directPct;

  return (
    <div className="space-y-4">
      {/* 1. Funil de Buying Stages (G2 Standard) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Decision */}
        <div
          onClick={() => onSelectStage?.('decision')}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-red-200/80 bg-gradient-to-br from-red-50/60 to-white p-5 shadow-sm transition-all hover:border-red-400 hover:shadow-md dark:border-red-900/40 dark:from-red-950/20 dark:to-slate-900"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
              <Flame className="h-4 w-4 animate-pulse" />
              Estágio: Decisão (Decision)
            </span>
            <Badge variant="outline" className="border-red-200 bg-red-100/80 text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-300">
              {decisionPct}% do total
            </Badge>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {data.buying_stage_distribution.decision}
            </span>
            <span className="text-xs font-medium text-slate-500">organizações compradoras</span>
          </div>

          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            Prontas para comprar usinas/sistemas. Comparando orçamentos ou chamando no WhatsApp.
          </p>

          <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-red-600 group-hover:underline dark:text-red-400">
            <span>Ação recomendada: Contatar imediatamente</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Consideration */}
        <div
          onClick={() => onSelectStage?.('consideration')}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/60 to-white p-5 shadow-sm transition-all hover:border-amber-400 hover:shadow-md dark:border-amber-900/40 dark:from-amber-950/20 dark:to-slate-900"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <Zap className="h-4 w-4" />
              Estágio: Avaliação (Consideration)
            </span>
            <Badge variant="outline" className="border-amber-200 bg-amber-100/80 text-amber-700 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              {considerationPct}% do total
            </Badge>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {data.buying_stage_distribution.consideration}
            </span>
            <span className="text-xs font-medium text-slate-500">organizações compradoras</span>
          </div>

          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            Avaliando fornecedores solares da categoria, lendo avaliações e checando reputação.
          </p>

          <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-amber-600 group-hover:underline dark:text-amber-400">
            <span>Ação: Diferenciar com Selo de Garantia</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Awareness */}
        <div
          onClick={() => onSelectStage?.('awareness')}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/60 to-white p-5 shadow-sm transition-all hover:border-blue-400 hover:shadow-md dark:border-blue-900/40 dark:from-blue-950/20 dark:to-slate-900"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <Eye className="h-4 w-4" />
              Estágio: Descoberta (Awareness)
            </span>
            <Badge variant="outline" className="border-blue-200 bg-blue-100/80 text-blue-700 dark:border-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
              {awarenessPct}% do total
            </Badge>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {data.buying_stage_distribution.awareness}
            </span>
            <span className="text-xs font-medium text-slate-500">organizações compradoras</span>
          </div>

          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            Pesquisa preliminar de transição energética ou economia solar na região.
          </p>

          <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:underline dark:text-blue-400">
            <span>Ação: Nutrir com guias e calculadoras</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>

      {/* 2. Destaques Complementares (Direct vs Competitive & Concorrentes mais comparados) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Visualizações Diretas vs Concorrentes */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Tráfego Direto vs Competitivo
            </h3>
            <BarChart3 className="h-4 w-4 text-slate-400" />
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Sinais gerados no seu perfil versus páginas de concorrentes compartilhadas.
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-700 dark:text-slate-300">Visualizações Diretas (Seu Perfil/Preço)</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {data.traffic_ratio.direct_pageviews} ({directPct}%)
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${directPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-700 dark:text-slate-300">Sinais Competitivos (Comparações/Outros)</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {data.traffic_ratio.competitive_pageviews} ({competitivePct}%)
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{ width: `${competitivePct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Concorrentes Mais Comparados */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitCompare className="h-4 w-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Concorrentes mais comparados com você (G2 Benchmark)
              </h3>
            </div>
            <span className="text-xs text-slate-500">Últimos 30 dias</span>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Quando os clientes usam o Comparador Solar do Avalia Solar, estas são as marcas mais pareadas com a sua:
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(data.top_competitors_compared || []).map((comp) => (
              <div
                key={comp.name}
                className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-center dark:border-slate-800 dark:bg-slate-800/50"
              >
                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 font-bold text-xs text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {comp.name.substring(0, 2).toUpperCase()}
                </div>
                <h4 className="mt-2 font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                  {comp.name}
                </h4>
                <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {comp.comparisons_count} comparações
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
