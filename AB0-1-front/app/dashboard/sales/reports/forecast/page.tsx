'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  CircleDollarSign,
  Download,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';

type Forecast = { month: string; pipeline_cents: number; weighted_cents: number };

function fmtBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  });
}

export default function SalesForecastPage() {
  const [rows, setRows] = useState<Forecast[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    fetch('/api/v1/sales/forecast', { credentials: 'include' })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => {
        setRows(data.forecast ?? []);
        setState('ready');
      })
      .catch(() => setState('error'));
  }, []);

  const totalPipeline = rows.reduce((acc, r) => acc + (r.pipeline_cents || 0), 0);
  const totalWeighted = rows.reduce((acc, r) => acc + (r.weighted_cents || 0), 0);

  const exportCSV = () => {
    if (rows.length === 0) return;
    const lines: string[] = [];
    lines.push('Relatório de Forecast Comercial - Avalia Solar');
    lines.push('');
    lines.push('Mês,Pipeline Aberto (R$),Previsão Ponderada (R$)');
    rows.forEach((row) => {
      const monthLabel = new Date(row.month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      lines.push(`"${monthLabel}",${fmtBRL(row.pipeline_cents)},${fmtBRL(row.weighted_cents)}`);
    });

    const csvContent = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'forecast-comercial.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = rows.map((r) => ({
    month: new Date(r.month).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    pipeline: Math.round(r.pipeline_cents / 100),
    weighted: Math.round(r.weighted_cents / 100),
  }));

  return (
    <SalesLayoutWrapper>
      <main className="mx-auto w-full max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-800">Reports</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Forecast Comercial</h1>
            <p className="mt-1 text-sm text-slate-600">
              Projeção de fechamento do pipeline aberto com ponderação de probabilidade.
            </p>
          </div>

          <Button
            onClick={exportCSV}
            variant="outline"
            className="border-slate-300 bg-white font-semibold text-slate-700 min-h-11"
            disabled={state !== 'ready' || rows.length === 0}
          >
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
        </header>

        {/* Summary Metric Cards */}
        {state === 'ready' && rows.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-slate-200 bg-white shadow-xs">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-lg bg-blue-100 p-3 text-blue-900">
                  <CircleDollarSign className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total em Pipeline Futuro
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{fmtBRL(totalPipeline)}</p>
                  <p className="text-xs text-slate-500">Soma bruta de oportunidades abertas</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50 shadow-xs">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-lg bg-blue-900 p-3 text-white">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-950">
                    Receita Ponderada Estimada
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{fmtBRL(totalWeighted)}</p>
                  <p className="text-xs text-slate-600">Considerando taxa de probabilidade por estágio</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Chart & Table Section */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-6">
          {state === 'loading' && (
            <div className="flex items-center justify-center py-12 gap-3 text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin text-blue-700" />
              <p className="text-sm">Carregando forecast comercial…</p>
            </div>
          )}

          {state === 'error' && (
            <div className="py-12 text-center text-red-700">
              <p className="font-semibold">Não foi possível carregar o forecast.</p>
              <p className="text-xs text-slate-500 mt-1">Verifique sua conexão e tente novamente.</p>
            </div>
          )}

          {state === 'ready' && rows.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              <BarChart3 className="mx-auto h-10 w-10 text-slate-300 mb-2" />
              <p className="font-semibold">Nenhuma oportunidade com fechamento previsto.</p>
              <p className="text-xs text-slate-400 mt-1">
                Adicione a data de fechamento esperada nas oportunidades do pipeline.
              </p>
            </div>
          )}

          {state === 'ready' && rows.length > 0 && (
            <>
              <Card className="border-slate-100 shadow-none bg-slate-50/50">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold text-slate-800">
                    Projeção de Receita Mensal
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorWeighted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#6B7280' }}
                        tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip formatter={(v: number) => fmtBRL(v * 100)} />
                      <Area
                        type="monotone"
                        dataKey="weighted"
                        name="Receita Ponderada"
                        stroke="#1E3A8A"
                        strokeWidth={2.5}
                        fill="url(#colorWeighted)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">Detalhamento por Mês</h3>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                        <th className="p-3.5">Mês de Fechamento</th>
                        <th className="p-3.5 text-right">Pipeline Bruto</th>
                        <th className="p-3.5 text-right">Receita Ponderada</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.month} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-3.5 font-bold text-slate-900">
                            {new Date(row.month).toLocaleDateString('pt-BR', {
                              month: 'long',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="p-3.5 text-right font-medium text-slate-600">
                            {fmtBRL(row.pipeline_cents)}
                          </td>
                          <td className="p-3.5 text-right font-bold text-blue-900">
                            {fmtBRL(row.weighted_cents)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </SalesLayoutWrapper>
  );
}
