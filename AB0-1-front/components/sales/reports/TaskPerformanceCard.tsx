'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

export interface TaskPerformanceData {
  total: number;
  completed: number;
  completed_on_time: number;
  completed_late: number;
  completed_without_due_date: number;
  pending: number;
  pending_on_time: number;
  pending_overdue: number;
  on_time_rate: number;
}

export interface TaskPerformanceCardProps {
  performance?: TaskPerformanceData;
}

export const TaskPerformanceCard: React.FC<TaskPerformanceCardProps> = ({ performance }) => {
  if (!performance || performance.total === 0) {
    return (
      <Card className="border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs rounded-xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Produtividade de Tarefas (Task Report)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Aderência a prazos e volume de atividades operacionais
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 text-center text-xs text-slate-400 italic">
          Nenhuma tarefa cadastrada no período selecionado.
        </CardContent>
      </Card>
    );
  }

  const items = [
    {
      label: 'Concluídas no Prazo',
      value: performance.completed_on_time,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    },
    {
      label: 'Concluídas com Atraso',
      value: performance.completed_late,
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
    },
    {
      label: 'Pendentes no Prazo',
      value: performance.pending_on_time,
      icon: CheckSquare,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
    },
    {
      label: 'Pendentes Atrasadas',
      value: performance.pending_overdue,
      icon: AlertCircle,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
    },
  ];

  return (
    <Card className="border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs rounded-xl overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Produtividade de Tarefas (Task Report)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Aderência aos prazos de execução das tarefas comerciais
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
            <span>{performance.on_time_rate}% no prazo</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 ${item.bg}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${item.color}`} />
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    {item.label}
                  </span>
                </div>
                <p className={`text-xl font-extrabold mt-1.5 ${item.color}`}>
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
