'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportIcon } from './ReportIcon';

export interface EmailMetricsData {
  sent?: number;
  delivered?: number;
  open?: number;
  click?: number;
  replied?: number;
  bounce?: number;
  complaint?: number;
}

export interface EmailPerformanceProps {
  metrics?: EmailMetricsData;
}

export const EmailPerformance: React.FC<EmailPerformanceProps> = ({ metrics }) => {
  if (!metrics) return null;

  const items = [
    {
      label: 'Enviados',
      value: metrics.sent ?? 0,
      icon: '/assets/avaliasolar_reports_icon_assets/08_resultados_campanha_email/enviados.png',
      tone: 'blue' as const,
    },
    {
      label: 'Entregues',
      value: metrics.delivered ?? 0,
      icon: '/assets/avaliasolar_reports_icon_assets/08_resultados_campanha_email/entregues.png',
      tone: 'emerald' as const,
    },
    {
      label: 'Aberturas',
      value: metrics.open ?? 0,
      icon: '/assets/avaliasolar_reports_icon_assets/08_resultados_campanha_email/aberturas.png',
      tone: 'purple' as const,
    },
    {
      label: 'Cliques',
      value: metrics.click ?? 0,
      icon: '/assets/avaliasolar_reports_icon_assets/08_resultados_campanha_email/cliques.png',
      tone: 'blue' as const,
    },
    {
      label: 'Respostas',
      value: metrics.replied ?? 0,
      icon: '/assets/avaliasolar_reports_icon_assets/08_resultados_campanha_email/respostas.png',
      tone: 'emerald' as const,
    },
    {
      label: 'Bounces',
      value: metrics.bounce ?? 0,
      icon: '/assets/avaliasolar_reports_icon_assets/08_resultados_campanha_email/bounces.png',
      tone: 'amber' as const,
    },
    {
      label: 'Reclamações',
      value: metrics.complaint ?? 0,
      icon: '/assets/avaliasolar_reports_icon_assets/08_resultados_campanha_email/reclamacoes.png',
      tone: 'rose' as const,
    },
  ];

  return (
    <Card
      className="border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs rounded-xl overflow-hidden"
      data-testid="email-analytics"
    >
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-5">
        <div className="flex items-center gap-3">
          <ReportIcon
            src="/assets/avaliasolar_reports_icon_assets/04_entidades_segmentos/email.png"
            tone="blue"
            size="md"
          />
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Desempenho de E-mail
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Eventos de engajamento e entregabilidade registrados no período
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">
                  {item.label}
                </span>
                <ReportIcon src={item.icon} tone={item.tone} size="sm" />
              </div>
              <div className="mt-2 text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
