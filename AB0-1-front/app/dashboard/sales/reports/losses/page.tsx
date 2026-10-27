'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Ban,
  RotateCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { salesApi } from '@/lib/api/sales/client';
import { ApiAnalytics } from '@/lib/api/sales/types';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import { cn } from '@/lib/utils';

const LOSS_COLORS = ['#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280', '#3B82F6'];

export default function LossesReportPage() {
  const [period, setPeriod] = useState('this_month');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<ApiAnalytics | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await salesApi.getAnalytics(period);
      setAnalytics(data);
    } catch (err) {
      console.error('[LossesReport] Erro ao carregar perdas:', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const lossReasons = analytics?.loss_reasons || [];
  const competitorLosses = analytics?.competitor_losses || [];
  const totalLostDeals = analytics?.kpis?.lost_deals || 0;

  return (
    <SalesLayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <Ban className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Losses
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Por que estamos perdendo negócios? Análise detalhada de motivos de perda e concorrentes.
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

        {/* KPI Cards */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Total de Negócios Perdidos
              </span>
              <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                {totalLostDeals}
              </p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                No período selecionado
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Taxa de Perda Relativa
              </span>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {(100 - (analytics.kpis.conversion_rate * 100)).toFixed(1)}%
              </p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Do total de negócios encerrados
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Principal Motivo de Perda
              </span>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1 truncate">
                {lossReasons[0]?.name || 'N/A'}
              </p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {lossReasons[0]?.count || 0} ocorrências
              </span>
            </div>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Motivos de Perda */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
              Perdas por Causa / Motivo
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Distribuição percentual dos motivos apontados pelos vendedores
            </p>

            {lossReasons.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                Nenhuma perda registrada com motivo no período.
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={lossReasons}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }: { name: string; percent?: number }) =>
                        `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {lossReasons.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={LOSS_COLORS[index % LOSS_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [`${val}%`, 'Participação']}
                      contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Concorrentes que mais ganharam negócios */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
              Perdas para Concorrentes
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Integradores ou empresas rivais onde o cliente fechou
            </p>

            {competitorLosses.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                Nenhum concorrente associado a perdas no período.
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={competitorLosses} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis type="number" fontSize={11} />
                    <YAxis dataKey="name" type="category" fontSize={11} width={100} />
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="count" fill="#EF4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </SalesLayoutWrapper>
  );
}
