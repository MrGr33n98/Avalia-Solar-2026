'use client';

import { useEffect, useState } from 'react';
import {
  CircleDollarSign,
  TrendingUp,
  Download,
  Loader2,
  Calendar,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import { NutshellReportCanvas } from '@/components/sales/reports/nutshell/NutshellReportCanvas';
import { salesApi } from '@/lib/api/sales/client';

type ForecastRow = {
  month: string;
  pipeline_cents: number;
  weighted_cents: number;
};

function fmtBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  });
}

export default function SalesForecastPage() {
  const [rows, setRows] = useState<ForecastRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    salesApi
      .getForecast()
      .then((data) => {
        setRows(data.forecast ?? data.periods ?? []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.message || 'Falha ao carregar detalhamento de forecast.');
        setLoading(false);
      });
  }, []);

  const totalPipeline = rows.reduce((acc, r) => acc + (r.pipeline_cents || 0), 0);
  const totalWeighted = rows.reduce((acc, r) => acc + (r.weighted_cents || 0), 0);

  const exportTableCSV = () => {
    if (rows.length === 0) return;
    const lines: string[] = [];
    lines.push('Relatório de Forecast Comercial por Mês - Avalia Solar CRM');
    lines.push('');
    lines.push('Mês,Pipeline Aberto (R$),Previsão Ponderada (R$)');
    rows.forEach((row) => {
      const monthLabel = new Date(row.month).toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      });
      lines.push(
        `"${monthLabel}",${(row.pipeline_cents / 100).toFixed(2)},${(
          row.weighted_cents / 100
        ).toFixed(2)}`
      );
    });

    const csvContent = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'forecast-comercial-mensal.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <SalesLayoutWrapper>
      <main className="mx-auto w-full max-w-7xl space-y-6 pb-12">
        {/* 1. Canvas Analítico Oficial no Padrão Nutshell (100% Dados Reais) */}
        <NutshellReportCanvas
          initialReportType="forecast"
          titleOverride="Forecast"
          subtitleOverride="How are we tracking towards our goals and quotas?"
        />

        {/* 2. Resumo de Pipeline Futuro */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-lg bg-blue-50 p-3 text-blue-800">
                <CircleDollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total em Pipeline Futuro
                </p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">
                  {fmtBRL(totalPipeline)}
                </p>
                <p className="text-xs text-slate-500">Soma bruta de oportunidades abertas com data</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/40 shadow-xs">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-lg bg-emerald-800 p-3 text-white">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-950">
                  Receita Ponderada Estimada
                </p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">
                  {fmtBRL(totalWeighted)}
                </p>
                <p className="text-xs text-emerald-700">
                  Calculada pela taxa de probabilidade real de cada estágio
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3. Tabela Detalhada por Mês de Fechamento */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Detalhamento por Mês Previsto</h3>
              <p className="text-xs text-slate-500">
                Oportunidades agrupadas pela data esperada de fechamento real registrada pelos vendedores.
              </p>
            </div>

            <Button
              onClick={exportTableCSV}
              variant="outline"
              size="sm"
              className="border-slate-300 text-slate-700"
              disabled={loading || rows.length === 0}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" /> Exportar Tabela
            </Button>
          </div>

          {loading && (
            <div className="py-8 flex items-center justify-center gap-2 text-slate-500 text-sm">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              Carregando detalhamento...
            </div>
          )}

          {error && (
            <div className="py-4 text-center text-sm text-red-600">
              <AlertCircle className="w-5 h-5 mx-auto mb-1 text-red-500" />
              {error}
            </div>
          )}

          {!loading && !error && rows.length === 0 && (
            <div className="py-8 text-center text-slate-500">
              <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">
                Nenhuma oportunidade aberta com data de fechamento prevista.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Ao cadastrar ou editar oportunidades no CRM, preencha a &quot;Data Prevista de Fechamento&quot;.
              </p>
            </div>
          )}

          {!loading && !error && rows.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                    <th className="p-3.5">Mês de Fechamento</th>
                    <th className="p-3.5 text-right">Pipeline Bruto</th>
                    <th className="p-3.5 text-right">Receita Ponderada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => (
                    <tr key={row.month} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900 capitalize">
                        {new Date(row.month).toLocaleDateString('pt-BR', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="p-3.5 text-right font-medium text-slate-600">
                        {fmtBRL(row.pipeline_cents)}
                      </td>
                      <td className="p-3.5 text-right font-bold text-emerald-700">
                        {fmtBRL(row.weighted_cents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </SalesLayoutWrapper>
  );
}
