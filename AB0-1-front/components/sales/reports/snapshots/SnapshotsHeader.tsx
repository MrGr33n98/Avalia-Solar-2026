'use client';

import React from 'react';
import { Download, RotateCw, Calendar, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SnapshotsHeaderProps {
  periodDays: number;
  onPeriodChange: (days: number) => void;
  granularity: 'day' | 'week' | 'month';
  onGranularityChange: (g: 'day' | 'week' | 'month') => void;
  onRefresh: () => void;
  onExportCSV: () => void;
  loading: boolean;
}

export function SnapshotsHeader({
  periodDays,
  onPeriodChange,
  granularity,
  onGranularityChange,
  onRefresh,
  onExportCSV,
  loading,
}: SnapshotsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-800 font-sans">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="border-0 bg-slate-900 px-2 py-0.5 font-bold text-white text-[10px] tracking-wide">
              CRM Interno
            </Badge>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pipeline & Win Rate Intelligence
            </span>
          </div>

          <h1 className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Snapshots
          </h1>
          <p className="mt-1 text-xs text-slate-500 max-w-xl">
            Evolução histórica do tamanho do pipeline aberto e taxa de conversão real dos negócios encerrados.
          </p>
        </div>

        {/* Action Controls: Period, Granularity, Export, Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Selector */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <Select
              value={String(periodDays)}
              onValueChange={(val) => onPeriodChange(Number(val))}
            >
              <SelectTrigger className="h-8 border-0 shadow-none text-xs font-semibold text-slate-700 dark:text-slate-200 w-[130px] focus:ring-0">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent align="end" className="text-xs">
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="60">Últimos 60 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="180">Últimos 180 dias</SelectItem>
                <SelectItem value="365">Último 1 ano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Granularity Selector */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1 shadow-2xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <Select
              value={granularity}
              onValueChange={(val) => onGranularityChange(val as 'day' | 'week' | 'month')}
            >
              <SelectTrigger className="h-8 border-0 shadow-none text-xs font-semibold text-slate-700 dark:text-slate-200 w-[110px] focus:ring-0">
                <SelectValue placeholder="Escala" />
              </SelectTrigger>
              <SelectContent align="end" className="text-xs">
                <SelectItem value="day">Diário</SelectItem>
                <SelectItem value="week">Semanal</SelectItem>
                <SelectItem value="month">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-9 px-2.5 bg-white border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs"
            title="Atualizar dados"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-600' : 'text-slate-500'}`} />
          </Button>

          {/* Export CSV Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onExportCSV}
            className="h-9 px-3 bg-white border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Exportar CSV
          </Button>
        </div>
      </div>
    </div>
  );
}
