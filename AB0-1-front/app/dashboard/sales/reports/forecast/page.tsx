'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/app/dashboard/components/DashboardLayout';

type Forecast = { month: string; pipeline_cents: number; weighted_cents: number };

export default function SalesForecastPage() {
  const [rows, setRows] = useState<Forecast[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  useEffect(() => {
    fetch('/api/v1/sales/forecast', { credentials: 'include' })
      .then((response) => { if (!response.ok) throw new Error(); return response.json(); })
      .then((data) => { setRows(data.forecast ?? []); setState('ready'); })
      .catch(() => setState('error'));
  }, []);
  return <DashboardLayout className="bg-slate-50/70"><main className="mx-auto w-full max-w-6xl space-y-6 p-6"><header><p className="text-xs font-bold uppercase tracking-wider text-blue-800">Reports</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Forecast comercial</h1><p className="mt-1 text-sm text-slate-600">Pipeline aberto e receita ponderada por mês.</p></header><section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">{state === 'loading' && <p className="text-sm text-slate-500">Carregando forecast…</p>}{state === 'error' && <p className="text-sm text-red-700">Não foi possível carregar forecast.</p>}{state === 'ready' && rows.length === 0 && <p className="text-sm text-slate-500">Nenhuma oportunidade futura.</p>}{state === 'ready' && rows.length > 0 && <div className="space-y-3">{rows.map((row) => <div key={row.month} className="grid gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-3"><strong>{new Date(row.month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</strong><span>Pipeline: R$ {(row.pipeline_cents / 100).toLocaleString('pt-BR')}</span><span>Ponderado: R$ {(row.weighted_cents / 100).toLocaleString('pt-BR')}</span></div>)}</div>}</section></main></DashboardLayout>;
}
