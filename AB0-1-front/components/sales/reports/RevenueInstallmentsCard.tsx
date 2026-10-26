'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

export interface RevenueInstallmentsData {
  has_installments: boolean;
  total_installments_count: number;
  collected_cents: number;
  planned_cents: number;
  overdue_cents: number;
  due_next_30d_cents: number;
  due_next_90d_cents: number;
}

export interface RevenueInstallmentsCardProps {
  installments?: RevenueInstallmentsData;
  formatCurrency: (cents: number) => string;
}

export const RevenueInstallmentsCard: React.FC<RevenueInstallmentsCardProps> = ({
  installments,
  formatCurrency,
}) => {
  if (!installments || !installments.has_installments) {
    return (
      <Card className="border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs rounded-xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-400">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Fluxo de Receita Parcelada (Revenue Installments)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Previsão de caixa de contratos parcelados e marcos de recebimento
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 text-center text-xs text-slate-400 italic">
          Nenhuma parcela de contrato cadastrada para o período.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs rounded-xl overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-400">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Fluxo de Receita Parcelada (Revenue Installments)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Parcelas de contratos divididas por status e previsão futura
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-3.5 rounded-xl border border-slate-100 bg-emerald-50/70 dark:border-slate-800 dark:bg-emerald-950/30">
            <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
              Receita Coletada
            </span>
            <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">
              {formatCurrency(installments.collected_cents)}
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-100 bg-blue-50/70 dark:border-slate-800 dark:bg-blue-950/30">
            <span className="text-[11px] font-semibold text-blue-800 dark:text-blue-300">
              Receita Planejada
            </span>
            <p className="text-lg font-extrabold text-blue-700 dark:text-blue-400 mt-1">
              {formatCurrency(installments.planned_cents)}
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-100 bg-rose-50/70 dark:border-slate-800 dark:bg-rose-950/30">
            <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-300">
              Parcelas em Atraso
            </span>
            <p className="text-lg font-extrabold text-rose-700 dark:text-rose-400 mt-1">
              {formatCurrency(installments.overdue_cents)}
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              Previsão Próx. 30 Dias
            </span>
            <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-1">
              {formatCurrency(installments.due_next_30d_cents)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
