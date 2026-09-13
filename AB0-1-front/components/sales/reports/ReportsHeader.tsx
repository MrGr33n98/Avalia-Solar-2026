'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Download, RotateCw, BarChart2, TrendingUp, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface ReportsHeaderProps {
  period: string;
  onPeriodChange: (newPeriod: string) => void;
  onExportCSV: () => void;
  onRefresh: () => void;
  loading?: boolean;
  exportDisabled?: boolean;
}

export const ReportsHeader: React.FC<ReportsHeaderProps> = ({
  period,
  onPeriodChange,
  onExportCSV,
  onRefresh,
  loading = false,
  exportDisabled = false,
}) => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Visão Geral', href: '/dashboard/sales/reports', icon: BarChart2 },
    { label: 'Previsão (Forecast)', href: '/dashboard/sales/reports/forecast', icon: TrendingUp },
    { label: 'Atribuição', href: '/dashboard/sales/reports/attribution', icon: Compass },
  ];

  return (
    <div className="flex flex-col gap-5 border-b border-slate-200/80 pb-6 dark:border-slate-800">
      {/* Linha Superior: Título e Controles */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="border-0 bg-blue-900 px-2 py-0.5 font-bold text-white text-[11px] tracking-wide">
              Avalia Solar CRM
            </Badge>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Executive Intelligence
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl dark:text-slate-100">
            Analytics & Performance Comercial
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
            Dados reais do pipeline comercial, previsão de receita e engajamento. Tome decisões
            estratégicas com base no histórico consolidado.
          </p>
        </div>

        {/* Controles: Período, Exportar e Atualizar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Select value={period} onValueChange={onPeriodChange}>
            <SelectTrigger
              className="h-10 w-[170px] border-slate-300 bg-white text-xs font-semibold text-slate-700 shadow-2xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              aria-label="Selecionar período do relatório"
            >
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_week">Esta Semana</SelectItem>
              <SelectItem value="this_month">Este Mês</SelectItem>
              <SelectItem value="last_month">Mês Passado</SelectItem>
              <SelectItem value="this_quarter">Este Trimestre</SelectItem>
              <SelectItem value="last_quarter">Último Trimestre</SelectItem>
              <SelectItem value="ytd">Acumulado do Ano</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={onExportCSV}
            variant="outline"
            size="sm"
            className="h-10 border-slate-300 bg-white text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            disabled={exportDisabled || loading}
          >
            <Download className="mr-1.5 h-3.5 w-3.5 text-blue-700 dark:text-blue-400" />
            Exportar CSV
          </Button>

          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            className="h-10 border-slate-300 bg-white text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            disabled={loading}
          >
            <RotateCw className={`mr-1.5 h-3.5 w-3.5 text-slate-600 dark:text-slate-300 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </div>
      </div>

      {/* Linha Inferior: Subnavegação entre Relatórios */}
      <div className="flex items-center gap-1.5 border-t border-slate-100 pt-3 dark:border-slate-800/80 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors shrink-0 ${
                isActive
                  ? 'bg-blue-50 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-slate-400'}`} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
