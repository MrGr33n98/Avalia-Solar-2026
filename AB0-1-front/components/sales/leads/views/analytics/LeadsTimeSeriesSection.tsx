'use client';

import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import type { LeadsTimeSeriesItem } from '@/lib/api/sales/types';

interface LeadsTimeSeriesSectionProps {
  data: LeadsTimeSeriesItem[];
  dateField: 'open_date' | 'close_date';
  onDateFieldChange: (field: 'open_date' | 'close_date') => void;
  groupBy: 'week' | 'month';
  onGroupByChange: (group: 'week' | 'month') => void;
  metric: 'quantity' | 'value';
  onMetricChange: (metric: 'quantity' | 'value') => void;
  isLoading?: boolean;
}

export function LeadsTimeSeriesSection({
  data,
  dateField,
  onDateFieldChange,
  groupBy,
  onGroupByChange,
  metric,
  onMetricChange,
  isLoading,
}: LeadsTimeSeriesSectionProps) {
  const chartData = (data || []).map((item) => ({
    ...item,
    value_in_reais: Math.round((item.value_cents || 0) / 100),
  }));

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-sm space-y-4">
      {/* Controles superiores idênticos ao benchmark */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
          <span>Leads by</span>
          <select
            value={dateField}
            onChange={(e) => onDateFieldChange(e.target.value as 'open_date' | 'close_date')}
            className="bg-transparent font-medium text-blue-600 dark:text-blue-400 border-b border-dashed border-blue-400 focus:outline-none cursor-pointer py-0.5 text-sm"
          >
            <option value="open_date">open date</option>
            <option value="close_date">close date</option>
          </select>
          <span>grouped by</span>
          <select
            value={groupBy}
            onChange={(e) => onGroupByChange(e.target.value as 'week' | 'month')}
            className="bg-transparent font-medium text-blue-600 dark:text-blue-400 border-b border-dashed border-blue-400 focus:outline-none cursor-pointer py-0.5 text-sm"
          >
            <option value="week">week</option>
            <option value="month">month</option>
          </select>
        </div>

        {/* Toggle Lead quantity / Lead value */}
        <div className="inline-flex rounded-md border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800/70 text-xs font-medium">
          <button
            type="button"
            onClick={() => onMetricChange('quantity')}
            className={`px-3 py-1 rounded transition-colors ${
              metric === 'quantity'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Lead quantity
          </button>
          <button
            type="button"
            onClick={() => onMetricChange('value')}
            className={`px-3 py-1 rounded transition-colors ${
              metric === 'value'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Lead value
          </button>
        </div>
      </div>

      {/* Gráfico ou Skeleton ou Empty State */}
      {isLoading ? (
        <div className="h-48 w-full bg-slate-50 dark:bg-slate-800/40 rounded flex items-center justify-center animate-pulse">
          <span className="text-xs text-slate-400">Carregando série temporal...</span>
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-44 w-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 py-8">
          <BarChart3 className="w-8 h-8 mb-2 stroke-1 opacity-40" />
          <p className="text-sm font-medium">Nenhum dado temporal encontrado com estes filtros</p>
          <span className="text-xs text-slate-400 mt-0.5">Ajuste o período ou os critérios de busca</span>
        </div>
      ) : (
        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
              <XAxis
                dataKey="period_label"
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={{ stroke: '#CBD5E1' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (metric === 'value' ? `R$ ${(v / 1000).toFixed(0)}k` : `${v}`)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as LeadsTimeSeriesItem & { value_in_reais: number };
                    return (
                      <div className="bg-slate-900 text-white text-xs rounded-md shadow-lg p-2.5 border border-slate-800">
                        <div className="font-semibold mb-1 text-slate-200">{item.period_label}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Quantidade:</span>
                          <span className="font-bold text-blue-400">{item.quantity}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-slate-400">Valor Total:</span>
                          <span className="font-bold text-emerald-400">
                            {formatCurrency(item.value_in_reais)}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey={metric === 'quantity' ? 'quantity' : 'value_in_reais'}
                fill="#3B82F6"
                radius={[3, 3, 0, 0]}
                maxBarSize={48}
              />
              <Line
                type="monotone"
                dataKey={metric === 'quantity' ? 'quantity' : 'value_in_reais'}
                stroke="#60A5FA"
                strokeWidth={2}
                dot={{ r: 3, fill: '#2563EB', stroke: '#EFF6FF', strokeWidth: 1.5 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
