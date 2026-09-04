'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  Download,
  Globe,
  Loader2,
  Share2,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';

type Session = { source?: string; medium?: string; campaign?: string; sessions: number };

export default function SalesAttributionPage() {
  const [rows, setRows] = useState<Session[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    fetch('/api/v1/sales/attribution', { credentials: 'include' })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => {
        const items: Session[] = data.sessions || data.attribution || [];
        setRows(items);
        setState('ready');
      })
      .catch(() => setState('error'));
  }, []);

  const totalSessions = rows.reduce((acc, r) => acc + (r.sessions || 0), 0);
  const topSource = rows.length > 0 ? rows[0].source || 'Direto' : '—';

  const exportCSV = () => {
    if (rows.length === 0) return;
    const lines: string[] = [];
    lines.push('Relatório de Atribuição de Campanhas - Avalia Solar');
    lines.push('');
    lines.push('Source,Medium,Campaign,Sessões');
    rows.forEach((row) => {
      lines.push(
        `"${row.source || 'direct'}","${row.medium || 'none'}","${row.campaign || 'none'}",${row.sessions}`
      );
    });

    const csvContent = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'atribuicao-campanhas.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <SalesLayoutWrapper>
      <main className="mx-auto w-full max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-800">Reports</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Atribuição de Campanhas</h1>
            <p className="mt-1 text-sm text-slate-600">
              Sessões de navegação agrupadas por UTM, usando dados reais de tracking do produto.
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
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-slate-200 bg-white shadow-xs">
              <CardContent className="flex items-center gap-3.5 p-4">
                <div className="rounded-lg bg-blue-100 p-2.5 text-blue-900">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total de Sessões
                  </p>
                  <p className="mt-0.5 text-2xl font-bold text-slate-900">{totalSessions}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-xs">
              <CardContent className="flex items-center gap-3.5 p-4">
                <div className="rounded-lg bg-emerald-100 p-2.5 text-emerald-800">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Principal Origem (Source)
                  </p>
                  <p className="mt-0.5 text-2xl font-bold text-slate-900">{topSource}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-xs">
              <CardContent className="flex items-center gap-3.5 p-4">
                <div className="rounded-lg bg-amber-100 p-2.5 text-amber-900">
                  <Share2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Combinações Únicas
                  </p>
                  <p className="mt-0.5 text-2xl font-bold text-slate-900">{rows.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          {state === 'loading' && (
            <div className="flex items-center justify-center py-12 gap-3 text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin text-blue-700" />
              <p className="text-sm">Carregando relatório de atribuição…</p>
            </div>
          )}

          {state === 'error' && (
            <div className="py-12 text-center text-red-700">
              <p className="font-semibold">Não foi possível carregar o relatório.</p>
              <p className="text-xs text-slate-500 mt-1">Verifique a conexão e tente novamente.</p>
            </div>
          )}

          {state === 'ready' && rows.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              <BarChart3 className="mx-auto h-10 w-10 text-slate-300 mb-2" />
              <p className="font-semibold">Nenhuma sessão rastreada no período.</p>
              <p className="text-xs text-slate-400 mt-1">
                As sessões serão registradas automaticamente conforme usuários acessarem com parâmetros UTM.
              </p>
            </div>
          )}

          {state === 'ready' && rows.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                    <th className="p-3.5">Source (Origem)</th>
                    <th className="p-3.5">Medium (Mídia)</th>
                    <th className="p-3.5">Campaign (Campanha)</th>
                    <th className="p-3.5 text-right">Sessões</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr
                      key={`${row.source}-${row.medium}-${row.campaign}-${index}`}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="p-3.5 font-bold text-slate-900">
                        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-900 font-semibold">
                          {row.source || 'direct'}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-slate-700">{row.medium || 'none'}</td>
                      <td className="p-3.5 text-slate-600 font-mono text-xs">{row.campaign || 'none'}</td>
                      <td className="p-3.5 text-right font-bold text-slate-900">{row.sessions}</td>
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
