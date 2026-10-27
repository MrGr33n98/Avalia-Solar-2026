'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  DollarSign,
  Hash,
  RotateCw,
  Inbox,
} from 'lucide-react';
import {
  ResponsiveContainer,
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

function fmtBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  });
}

export default function ProductsReportPage() {
  const [period, setPeriod] = useState('this_month');
  const [measure, setMeasure] = useState<'value' | 'quantity'>('value');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<ApiAnalytics | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await salesApi.getAnalytics(period);
      setAnalytics(data);
    } catch (err) {
      console.error('[ProductsReport] Erro ao carregar produtos:', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const topProducts = analytics?.top_products || [];
  const totalQuantity = topProducts.reduce((acc, p) => acc + (p.quantity || 0), 0);
  const uniqueProducts = topProducts.length;
  const totalValueCents = topProducts.reduce((acc, p) => acc + (p.revenue_cents || 0), 0);
  const totalDeals = topProducts.reduce((acc, p) => acc + (p.deal_count || 0), 0);

  return (
    <SalesLayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Package className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Products
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Quais kits solares, módulos e inversores geram mais receita?
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Toggle: Value vs Quantity */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setMeasure('value')}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                  measure === 'value'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                )}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>R$ Valor</span>
              </button>
              <button
                type="button"
                onClick={() => setMeasure('quantity')}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                  measure === 'quantity'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                )}
              >
                <Hash className="w-3.5 h-3.5" />
                <span># Quantidade</span>
              </button>
            </div>

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

        {/* 4 KPI Cards (Identical to Nutshell Products screenshot) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Total quantity
            </span>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {totalQuantity}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Unique products
            </span>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {uniqueProducts}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Total value
            </span>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {fmtBRL(totalValueCents)}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Number of leads
            </span>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {totalDeals}
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">
            Top Products
          </h2>

          {topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
              <Inbox className="w-12 h-12 text-slate-300 dark:text-slate-700 stroke-1 mb-2" />
              <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                Nenhum produto cadastrado com vendas no período
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Ao vincular kits solares ou itens de proposta às oportunidades ganhas, eles aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis type="number" fontSize={11} />
                    <YAxis dataKey="name" type="category" fontSize={11} width={120} />
                    <Tooltip
                      formatter={(val: number) => [
                        measure === 'value' ? fmtBRL(val) : val,
                        measure === 'value' ? 'Receita' : 'Quantidade',
                      ]}
                      contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar
                      dataKey={measure === 'value' ? 'revenue_cents' : 'quantity'}
                      fill="#10B981"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Tabela de Produtos */}
              <div className="overflow-x-auto border-t border-slate-200 dark:border-slate-800 pt-4">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Produto / Kit Solar</th>
                      <th className="py-2.5 px-3 text-right">Quantidade</th>
                      <th className="py-2.5 px-3 text-right">Oportunidades</th>
                      <th className="py-2.5 px-3 text-right">Receita Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {topProducts.map((p) => (
                      <tr key={p.product_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                          {p.name}
                        </td>
                        <td className="py-2.5 px-3 text-right">{p.quantity}</td>
                        <td className="py-2.5 px-3 text-right">{p.deal_count}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {fmtBRL(p.revenue_cents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </SalesLayoutWrapper>
  );
}
