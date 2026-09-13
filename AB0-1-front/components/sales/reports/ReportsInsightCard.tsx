'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ReportIcon } from './ReportIcon';

export interface ReportsInsightProps {
  openDeals: number;
  pipelineValueFormatted: string;
  weightedValueFormatted: string;
  wonDeals: number;
  wonRevenueFormatted: string;
  lostDeals: number;
  conversionRatePercent: number;
}

export const ReportsInsightCard: React.FC<ReportsInsightProps> = ({
  openDeals,
  pipelineValueFormatted,
  weightedValueFormatted,
  wonDeals,
  wonRevenueFormatted,
  lostDeals,
  conversionRatePercent,
}) => {
  // Construção de insights estritamente derivados dos dados reais
  const hasActivity = openDeals > 0 || wonDeals > 0 || lostDeals > 0;
  if (!hasActivity) return null;

  return (
    <div className="grid gap-3.5 md:grid-cols-2">
      {/* Card 1: Inteligência de Pipeline & Conversão */}
      <Card className="border-blue-100 bg-blue-50/20 dark:border-blue-900/40 dark:bg-blue-950/20 shadow-2xs rounded-xl">
        <CardContent className="p-4 flex items-start gap-3.5">
          <ReportIcon
            src="/assets/avaliasolar_reports_icon_assets/01_kpi_metricas/insight_mes.png"
            tone="blue"
            size="md"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
              Insight do Período
            </h4>
            <p className="mt-1 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {openDeals > 0 ? (
                <>
                  Existem <strong>{openDeals} oportunidades abertas</strong> somando{' '}
                  <strong>{pipelineValueFormatted}</strong>, com expectativa ponderada de{' '}
                  <strong>{weightedValueFormatted}</strong>.
                </>
              ) : (
                <>Nenhuma oportunidade aberta no momento para este período.</>
              )}
              {wonDeals > 0 && (
                <>
                  {' '}
                  O pipeline converteu <strong>{wonDeals} negócios</strong> totalizando{' '}
                  <strong>{wonRevenueFormatted}</strong> em receita líquida.
                </>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Saúde do Pipeline & Atenção Operacional */}
      <Card className="border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/80 shadow-2xs rounded-xl">
        <CardContent className="p-4 flex items-start gap-3.5">
          <ReportIcon
            src="/assets/avaliasolar_reports_icon_assets/05_status_indicadores/atencao.png"
            tone={lostDeals > 0 || conversionRatePercent === 0 ? 'amber' : 'emerald'}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Saúde do Pipeline & Alertas
            </h4>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {lostDeals > 0 ? (
                <>
                  Foram marcadas <strong>{lostDeals} oportunidades como perdidas</strong> no período.
                  Consulte os motivos de perda abaixo para mitigar cancelamentos recorrentes.
                </>
              ) : wonDeals > 0 ? (
                <>
                  Excelente taxa de retenção: nenhum negócio perdido foi registrado no período
                  selecionado.
                </>
              ) : (
                <>
                  Taxa de conversão atual de <strong>{conversionRatePercent.toFixed(1)}%</strong>.
                  Mantenha a cadência de atividades e follow-ups para acelerar os fechamentos.
                </>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
