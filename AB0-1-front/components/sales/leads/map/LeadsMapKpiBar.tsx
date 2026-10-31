'use client';

import React from 'react';
import { LeadsMapSummaryDTO } from '@/lib/api/sales/types';
import { MapPin, AlertCircle, TrendingUp, Layers } from 'lucide-react';

interface LeadsMapKpiBarProps {
  summary: LeadsMapSummaryDTO;
  municipalitiesCount: number;
  className?: string;
}

export const LeadsMapKpiBar: React.FC<LeadsMapKpiBarProps> = ({
  summary,
  municipalitiesCount,
  className = '',
}) => {
  const formatBrl = (cents: number) => {
    return `R$ ${(cents / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const coveragePercent =
    summary.total_filtered > 0
      ? Math.round((summary.mappable / summary.total_filtered) * 100)
      : 0;

  return (
    <div
      className={`grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 ${className}`}
      data-testid="leads-map-kpi-bar"
    >
      {/* 1. Total Filtrado */}
      <div className="flex flex-col justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Total Filtrado</span>
          <Layers className="h-4 w-4 text-slate-400" />
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-1">
          <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {summary.total_filtered}
          </span>
          <span className="text-xs font-semibold text-slate-500 truncate" title="Valor total do funil">
            {formatBrl(summary.total_value_cents)}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 mt-0.5">Leads elegíveis no filtro atual</span>
      </div>

      {/* 2. No Mapa */}
      <div className="flex flex-col justify-between p-3 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 shadow-2xs">
        <div className="flex items-center justify-between text-blue-900 dark:text-blue-300">
          <span className="text-[11px] font-semibold uppercase tracking-wider">No Mapa</span>
          <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-1">
          <span className="text-xl sm:text-2xl font-extrabold text-blue-950 dark:text-blue-100">
            {summary.mappable}
          </span>
          <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 truncate" title="Valor georreferenciado">
            {formatBrl(summary.mapped_value_cents)}
          </span>
        </div>
        <span className="text-[10px] text-blue-700/80 dark:text-blue-400/80 mt-0.5">
          Em {municipalitiesCount} {municipalitiesCount === 1 ? 'município' : 'municípios'}
        </span>
      </div>

      {/* 3. Sem Localização */}
      <div className="flex flex-col justify-between p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20 shadow-2xs">
        <div className="flex items-center justify-between text-amber-900 dark:text-amber-300">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Sem Posição</span>
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-1">
          <span className="text-xl sm:text-2xl font-extrabold text-amber-950 dark:text-amber-100">
            {summary.unmapped}
          </span>
          <span className="text-xs font-medium text-amber-800 dark:text-amber-300">
            {summary.total_filtered > 0
              ? `${Math.round((summary.unmapped / summary.total_filtered) * 100)}%`
              : '0%'}
          </span>
        </div>
        <span className="text-[10px] text-amber-700/90 dark:text-amber-400/80 mt-0.5 truncate" title={`${summary.missing_city_state} sem cidade/UF | ${summary.unsupported_municipality} fora do catálogo`}>
          {summary.missing_city_state} sem dados · {summary.unsupported_municipality} fora catálogo
        </span>
      </div>

      {/* 4. Taxa de Cobertura */}
      <div className="flex flex-col justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Cobertura</span>
          <TrendingUp className="h-4 w-4 text-slate-400" />
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-1">
          <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {coveragePercent}%
          </span>
          <span className="text-xs font-semibold text-slate-500">Mapeabilidade</span>
        </div>
        <span className="text-[10px] text-slate-400 mt-0.5">Centroides offline calculados</span>
      </div>
    </div>
  );
};

