'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export interface QuotaAttainmentProps {
  quota?: {
    has_quota: boolean;
    target_cents: number;
    actual_cents: number;
    target_deals: number;
    actual_deals: number;
    attainment_percent: number;
    ideal_pace_percent: number;
    pace_status: 'on_track' | 'behind_pace' | 'no_quota';
    reps: Array<{
      user_id: number;
      user_name: string;
      target_cents: number;
      actual_cents: number;
      attainment_percent: number;
      target_deals: number;
      actual_deals: number;
    }>;
  };
  formatCurrency: (cents: number) => string;
}

export const QuotaAttainmentCard: React.FC<QuotaAttainmentProps> = ({ quota, formatCurrency }) => {
  if (!quota || !quota.has_quota) {
    return (
      <Card className="border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs rounded-xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-400">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Atingimento de Metas (Sales Quota)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Acompanhamento de metas de receita e ritmo ideal da equipe comercial
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 text-center text-xs text-slate-500">
          Nenhuma meta cadastrada para o período atual. Cadastre cotas em configurações para monitorar o ritmo ideal.
        </CardContent>
      </Card>
    );
  }

  const isOnTrack = quota.pace_status === 'on_track';

  return (
    <Card className="border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs rounded-xl overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-400">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Atingimento de Metas (Sales Quota)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Realizado vs. Meta da equipe com ritmo ideal (Ideal Pace)
              </CardDescription>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            isOnTrack ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
          }`}>
            {isOnTrack ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
            <span>{isOnTrack ? 'No Ritmo Ideal' : 'Abaixo do Ritmo'}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl">
            <span className="text-[11px] font-medium text-slate-500">Meta da Equipe</span>
            <p className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {formatCurrency(quota.target_cents)}
            </p>
          </div>
          <div className="p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl">
            <span className="text-[11px] font-medium text-slate-500">Receita Fechada</span>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {formatCurrency(quota.actual_cents)}
            </p>
          </div>
          <div className="p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl">
            <span className="text-[11px] font-medium text-slate-500">Atingimento Real</span>
            <p className="text-base font-bold text-blue-900 dark:text-blue-400 mt-0.5">
              {quota.attainment_percent}%
            </p>
          </div>
          <div className="p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl">
            <span className="text-[11px] font-medium text-slate-500">Ritmo Ideal (Ideal Pace)</span>
            <p className="text-base font-bold text-slate-700 dark:text-slate-300 mt-0.5">
              {quota.ideal_pace_percent}%
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
            <span>Progresso da Meta</span>
            <span>{quota.attainment_percent}% concluído</span>
          </div>
          <Progress value={Math.min(quota.attainment_percent, 100)} className="h-2.5 bg-slate-100 dark:bg-slate-800" />
        </div>
      </CardContent>
    </Card>
  );
};
