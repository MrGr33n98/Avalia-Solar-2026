'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Mail, RotateCw } from 'lucide-react';
import { salesApi } from '@/lib/api/sales/client';
import { ApiAnalytics } from '@/lib/api/sales/types';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import { EmailPerformance } from '@/components/sales/reports/EmailPerformance';
import { cn } from '@/lib/utils';

export default function EmailReportPage() {
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<ApiAnalytics | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await salesApi.getAnalytics(period);
      setAnalytics(data);
    } catch (err) {
      console.error('[EmailReport] Erro ao carregar métricas de email:', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <SalesLayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Mail className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Email
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Desempenho de disparos de outbound, taxas de entrega, aberturas e respostas.
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

        {/* Email Cards */}
        {analytics?.email_metrics && (
          <EmailPerformance metrics={analytics.email_metrics} />
        )}
      </div>
    </SalesLayoutWrapper>
  );
}
