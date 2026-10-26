'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';

export interface StageDurationItem {
  stage_id: number;
  stage_name: string;
  count: number;
  avg_days: number;
  avg_hours: number;
}

export interface StageDurationCardProps {
  durations?: StageDurationItem[];
}

export const StageDurationCard: React.FC<StageDurationCardProps> = ({ durations = [] }) => {
  return (
    <Card className="border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs rounded-xl overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Tempo Médio por Estágio (Stage Duration)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Média de permanência das oportunidades antes de avançarem de fase
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        {durations.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-6">
            Nenhum histórico de transição registrado para o período.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {durations.map((item) => (
              <div
                key={item.stage_id}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <span className="text-[11px] font-semibold text-slate-500 truncate block">
                  {item.stage_name}
                </span>
                <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                  {item.avg_days > 0 ? `${item.avg_days}d` : `${item.avg_hours}h`}
                </p>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {item.count} {item.count === 1 ? 'passagem' : 'passagens'}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
