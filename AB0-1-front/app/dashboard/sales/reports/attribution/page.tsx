'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/app/dashboard/components/DashboardLayout';

type Attribution = { source?: string; medium?: string; campaign?: string; sessions: number };

export default function SalesAttributionReportPage() {
  const [rows, setRows] = useState<Attribution[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    fetch('/api/v1/sales/attribution', { credentials: 'include' })
      .then((response) => { if (!response.ok) throw new Error('Falha ao carregar atribuição.'); return response.json(); })
      .then((data) => { setRows(data.attribution ?? []); setState('ready'); })
      .catch(() => setState('error'));
  }, []);

  return <DashboardLayout className="bg-slate-50/70"><main className="mx-auto w-full max-w-6xl space-y-6 p-6"><header><p className="text-xs font-bold uppercase tracking-wider text-blue-800">Reports</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Atribuição de campanhas</h1><p className="mt-1 text-sm text-slate-600">Sessões agrupadas por UTM, usando dados reais de tracking.</p></header><section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">{state === 'loading' && <p className="text-sm text-slate-500">Carregando relatório…</p>}{state === 'error' && <p className="text-sm text-red-700">Não foi possível carregar relatório.</p>}{state === 'ready' && rows.length === 0 && <p className="text-sm text-slate-500">Nenhuma sessão atribuída.</p>}{state === 'ready' && rows.length > 0 && <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-xs uppercase text-slate-500"><th className="p-3">Source</th><th className="p-3">Medium</th><th className="p-3">Campaign</th><th className="p-3 text-right">Sessões</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.source}-${row.medium}-${row.campaign}-${index}`} className="border-b border-slate-100"><td className="p-3">{row.source || '—'}</td><td className="p-3">{row.medium || '—'}</td><td className="p-3">{row.campaign || '—'}</td><td className="p-3 text-right font-semibold">{row.sessions}</td></tr>)}</tbody></table></div>}</section></main></DashboardLayout>;
}
