'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Trophy,
  TrendingUp,
  Flame,
  ArrowLeft,
  Maximize2,
  Minimize2,
  RotateCw,
  Zap,
} from 'lucide-react';
import { salesApi } from '@/lib/api/sales/client';
import { ApiAnalytics } from '@/lib/api/sales/types';
import { cn } from '@/lib/utils';

function fmtBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  });
}

export default function SalesWallboardPage() {
  const [analytics, setAnalytics] = useState<ApiAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await salesApi.getAnalytics('this_month');
      setAnalytics(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('[Wallboard] Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Auto-refresh every 60s for live sales TV
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const teamPerf = analytics?.team_performance || [];
  const wonRevenue = analytics?.kpis?.won_revenue_cents || 0;
  const pipelineValue = analytics?.kpis?.pipeline_value_cents || 0;
  const wonDeals = analytics?.kpis?.won_deals || 0;
  const hotDeals = analytics?.kpis?.hot_deals || 0;

  return (
    <div className="min-h-screen bg-[#070b1e] text-white font-sans p-6 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/sales/reports"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao CRM</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl font-black tracking-wider uppercase text-white">
              Avalia Solar • Wallboard Comercial
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            Atualizado: {lastUpdated.toLocaleTimeString('pt-BR')}
          </span>
          <button
            type="button"
            onClick={loadData}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Atualizar agora"
          >
            <RotateCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            title="Tela Cheia"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main KPI Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 my-6">
        <div className="bg-gradient-to-br from-[#12183d] to-[#1a2357] border border-indigo-500/30 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">
              Receita Fechada (Mês)
            </span>
            <Trophy className="w-6 h-6 text-amber-400" />
          </div>
          <p className="text-4xl lg:text-5xl font-black text-emerald-400 mt-3 tracking-tight">
            {fmtBRL(wonRevenue)}
          </p>
          <span className="text-xs text-slate-300 mt-2 block font-medium">
            {wonDeals} contratos de energia solar assinados
          </span>
        </div>

        <div className="bg-gradient-to-br from-[#12183d] to-[#1a2357] border border-indigo-500/30 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">
              Pipeline Aberto
            </span>
            <TrendingUp className="w-6 h-6 text-sky-400" />
          </div>
          <p className="text-4xl lg:text-5xl font-black text-sky-400 mt-3 tracking-tight">
            {fmtBRL(pipelineValue)}
          </p>
          <span className="text-xs text-slate-300 mt-2 block font-medium">
            {analytics?.kpis?.open_deals || 0} oportunidades ativas
          </span>
        </div>

        <div className="bg-gradient-to-br from-[#12183d] to-[#1a2357] border border-indigo-500/30 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">
              Negócios Quentes (Hot Deals)
            </span>
            <Flame className="w-6 h-6 text-rose-500 animate-bounce" />
          </div>
          <p className="text-4xl lg:text-5xl font-black text-rose-400 mt-3 tracking-tight">
            {hotDeals}
          </p>
          <span className="text-xs text-slate-300 mt-2 block font-medium">
            Prontos para assinatura esta semana
          </span>
        </div>

        <div className="bg-gradient-to-br from-[#12183d] to-[#1a2357] border border-indigo-500/30 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">
              Taxa de Fechamento (Win Rate)
            </span>
            <Zap className="w-6 h-6 text-amber-400" />
          </div>
          <p className="text-4xl lg:text-5xl font-black text-amber-400 mt-3 tracking-tight">
            {((analytics?.kpis?.conversion_rate || 0) * 100).toFixed(1)}%
          </p>
          <span className="text-xs text-slate-300 mt-2 block font-medium">
            Eficiência da equipe comercial
          </span>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-[#0e1436] border border-slate-800 p-6 rounded-2xl shadow-xl flex-1 flex flex-col justify-start">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Ranking Comercial • Leaderboard do Mês</span>
          </h2>
          <span className="text-xs text-slate-400">Classificação por faturamento ganho</span>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#151c4a] text-slate-400 uppercase text-xs font-bold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Posição</th>
                <th className="py-3 px-4">Consultor Solar</th>
                <th className="py-3 px-4 text-right">Contratos Ganhos</th>
                <th className="py-3 px-4 text-right">Taxa de Conversão</th>
                <th className="py-3 px-4 text-right">Faturamento Realizado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-semibold">
              {teamPerf.map((member, idx) => (
                <tr key={member.owner_id} className="hover:bg-[#141b47] transition-colors">
                  <td className="py-4 px-4">
                    <span
                      className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-black',
                        idx === 0
                          ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-950'
                          : idx === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-800 text-slate-400'
                      )}
                    >
                      {idx + 1}º
                    </span>
                  </td>
                  <td className="py-4 px-4 text-white text-base">{member.name}</td>
                  <td className="py-4 px-4 text-right text-slate-300">{member.won_deals}</td>
                  <td className="py-4 px-4 text-right text-indigo-400">{member.win_rate}%</td>
                  <td className="py-4 px-4 text-right text-emerald-400 text-lg font-bold">
                    {fmtBRL(member.won_revenue_cents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-slate-500 pt-4">
        Avalia Solar CRM • Painel em Tempo Real para TV de Vendas
      </div>
    </div>
  );
}
