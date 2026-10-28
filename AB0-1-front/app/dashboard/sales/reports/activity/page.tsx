'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  RotateCw,
} from 'lucide-react';
import { salesApi } from '@/lib/api/sales/client';
import { ApiAnalytics } from '@/lib/api/sales/types';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import { cn } from '@/lib/utils';

export default function ActivityReportPage() {
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<ApiAnalytics | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await salesApi.getAnalytics(period);
      setAnalytics(data);
    } catch (err) {
      console.error('[ActivityReport] Erro ao carregar atividades:', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const teamPerf = analytics?.team_performance || [];
  const actMetrics = analytics?.activity_metrics;

  const totalActivities = actMetrics?.total_activities ?? 0;
  const aiSummarized = actMetrics?.ai_summarized_count ?? 0;
  const withNote = actMetrics?.with_notes_count ?? 0;
  const avgDuration = actMetrics?.has_real_duration && actMetrics?.avg_duration_seconds != null
    ? `${Math.round(actMetrics.avg_duration_seconds / 60)}m`
    : 'N/D';
  const activitiesPerWeek = actMetrics?.avg_per_week != null ? actMetrics.avg_per_week.toFixed(1) : '0.0';
  const totalDuration = actMetrics?.has_real_duration && actMetrics?.total_duration_hours != null
    ? `${actMetrics.total_duration_hours}h`
    : 'N/D';

  return (
    <SalesLayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                <Calendar className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Activity
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Como a equipe de vendas está performando em reuniões, ligações e vistorias solares?
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg px-3 py-2 shadow-xs cursor-pointer"
            >
              <option value="this_month">Este Mês</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
              <option value="this_year">Este Ano</option>
            </select>

            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 shadow-xs"
              title="Atualizar dados"
            >
              <RotateCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* 6 KPI Cards Reais (Padrão exato do print 5 do Nutshell) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
              Total activities
            </span>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {totalActivities}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
              AI-summarized
            </span>
            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {aiSummarized}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
              With a note
            </span>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {withNote}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
              Avg duration
            </span>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1" title={actMetrics?.has_real_duration ? 'Média calculada' : 'Duração não persistida nas atividades atuais'}>
              {avgDuration}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
              Avg per week
            </span>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {activitiesPerWeek}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
              Total duration
            </span>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1" title={actMetrics?.has_real_duration ? 'Total calculado' : 'Duração não persistida nas atividades atuais'}>
              {totalDuration}
            </p>
          </div>
        </div>

        {/* Desempenho por Vendedor / Líder */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
            Atividades & Resultados por Representante
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Negócios trabalhados, conversões e taxa de fechamento por consultor solar
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Consultor Solar</th>
                  <th className="py-2.5 px-3 text-right">Negócios Atendidos</th>
                  <th className="py-2.5 px-3 text-right">Ganhos</th>
                  <th className="py-2.5 px-3 text-right">Perdidos</th>
                  <th className="py-2.5 px-3 text-right">Taxa de Conversão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {teamPerf.map((t) => (
                  <tr key={t.owner_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                      {t.name}
                    </td>
                    <td className="py-2.5 px-3 text-right">{t.total_deals}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {t.won_deals}
                    </td>
                    <td className="py-2.5 px-3 text-right text-rose-500">{t.lost_deals}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
                      {t.win_rate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SalesLayoutWrapper>
  );
}
