'use client';

import React from 'react';
import { CalendarDays } from 'lucide-react';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';

export default function SchedulerReportPage() {
  return (
    <SalesLayoutWrapper>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <CalendarDays className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Scheduler
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Agendamentos de reuniões comerciais, vistorias técnicas e links de auto-agendamento.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Reuniões Realizadas
            </span>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">24</p>
            <span className="text-[11px] text-emerald-600 mt-0.5 block font-semibold">+18% vs mês anterior</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Vistorias Agendadas
            </span>
            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">9</p>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Para os próximos 7 dias</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Taxa de Comparecimento
            </span>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">91.6%</p>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Show-up rate dos leads</span>
          </div>
        </div>
      </div>
    </SalesLayoutWrapper>
  );
}
