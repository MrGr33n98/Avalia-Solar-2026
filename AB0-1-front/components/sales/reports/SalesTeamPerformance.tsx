'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportIcon } from './ReportIcon';

export interface TeamMemberPerformance {
  owner_id: number;
  name: string;
  email: string;
  total_deals: number;
  won_deals: number;
  lost_deals: number;
  won_revenue_cents: number;
  win_rate: number;
}

export interface SalesTeamPerformanceProps {
  team: TeamMemberPerformance[];
  formatCurrency: (cents: number) => string;
}

export const SalesTeamPerformance: React.FC<SalesTeamPerformanceProps> = ({
  team,
  formatCurrency,
}) => {
  if (!team || team.length === 0) {
    return (
      <Card className="border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs rounded-xl">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-5">
          <div className="flex items-center gap-2.5">
            <ReportIcon
              src="/assets/avaliasolar_reports_icon_assets/04_entidades_segmentos/vendedores.png"
              tone="blue"
              size="md"
            />
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Desempenho da Equipe de Vendas
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Nenhum vendedor com atividades registradas no período selecionado.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <div className="inline-flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
          <Image
            src="/assets/avaliasolar_reports_icon_assets/06_rankings_conquistas/primeiro_lugar.png"
            alt=""
            width={20}
            height={20}
            unoptimized
          />
          <span className="text-xs">1º</span>
        </div>
      );
    }
    if (index === 1) {
      return (
        <div className="inline-flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
          <Image
            src="/assets/avaliasolar_reports_icon_assets/06_rankings_conquistas/segundo_lugar.png"
            alt=""
            width={20}
            height={20}
            unoptimized
          />
          <span className="text-xs">2º</span>
        </div>
      );
    }
    if (index === 2) {
      return (
        <div className="inline-flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-400">
          <Image
            src="/assets/avaliasolar_reports_icon_assets/06_rankings_conquistas/terceiro_lugar.png"
            alt=""
            width={20}
            height={20}
            unoptimized
          />
          <span className="text-xs">3º</span>
        </div>
      );
    }
    return <span className="font-mono text-xs font-bold text-slate-400">{index + 1}º</span>;
  };

  return (
    <Card
      className="border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs rounded-xl overflow-hidden"
      data-testid="sales-team-performance"
    >
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-5">
        <div className="flex items-center gap-3">
          <ReportIcon
            src="/assets/avaliasolar_reports_icon_assets/04_entidades_segmentos/vendedores.png"
            tone="blue"
            size="md"
          />
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Desempenho da Equipe de Vendas
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Ranking de vendedores por receita realizada e taxa de conversão no período
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <th className="p-3.5 pl-5">#</th>
                <th className="p-3.5">Vendedor</th>
                <th className="p-3.5 text-center">Criados</th>
                <th className="p-3.5 text-center">Ganhos</th>
                <th className="p-3.5 text-center">Perdidos</th>
                <th className="p-3.5 text-right">Taxa de Conversão</th>
                <th className="p-3.5 text-right pr-5">Receita Won</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {team.map((rep, index) => {
                const initials = rep.name
                  ? rep.name
                      .split(' ')
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                  : 'V';

                return (
                  <tr
                    key={rep.owner_id || index}
                    className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
                  >
                    <td className="p-3.5 pl-5">{getRankBadge(index)}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-900 text-[10px] font-bold dark:bg-blue-950 dark:text-blue-200 shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {rep.name}
                          </div>
                          {rep.email && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate block">
                              {rep.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-center text-slate-600 dark:text-slate-300 font-medium">
                      {rep.total_deals}
                    </td>
                    <td className="p-3.5 text-center font-bold text-emerald-600 dark:text-emerald-400">
                      {rep.won_deals}
                    </td>
                    <td className="p-3.5 text-center font-medium text-rose-500 dark:text-rose-400">
                      {rep.lost_deals}
                    </td>
                    <td className="p-3.5 text-right font-bold text-slate-700 dark:text-slate-200">
                      {rep.win_rate}%
                    </td>
                    <td className="p-3.5 text-right pr-5 font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(rep.won_revenue_cents)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
