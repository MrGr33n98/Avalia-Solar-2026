'use client';

import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/app/dashboard/components/DashboardLayout';

type Account = { id: number; name: string; domain?: string | null; city?: string | null; state?: string | null };

export default function AccountList() {
  const [accounts, setAccounts] = useState<Account[]>([]); const [query, setQuery] = useState(''); const [loading, setLoading] = useState(true); const [error, setError] = useState(false);
  useEffect(() => { fetch(`/api/v1/sales/accounts?q=${encodeURIComponent(query)}`, { credentials: 'include' }).then((response) => { if (!response.ok) throw new Error('accounts'); return response.json(); }).then((data) => setAccounts(data.accounts ?? [])).catch(() => setError(true)).finally(() => setLoading(false)); }, [query]);
  return <DashboardLayout className="bg-slate-50/70"><div className="mx-auto w-full max-w-6xl space-y-6"><header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">CRM / Vendas</p><h1 className="mt-2 text-2xl font-semibold text-slate-950">Accounts</h1><p className="mt-1 text-sm text-slate-500">Empresas em prospecção, sem duplicar Company.</p></div><Button className="min-h-11 bg-blue-700 hover:bg-blue-800"><Plus className="mr-2 h-4 w-4" />Nova account</Button></header><Card className="border-slate-200 shadow-sm"><CardHeader className="p-4"><CardTitle className="text-base">Empresas adicionadas ao CRM</CardTitle><div className="relative mt-3"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-11 pl-9" placeholder="Buscar por nome..." /></div></CardHeader><CardContent className="p-4 pt-0">{loading ? <p className="py-8 text-sm text-slate-500">Carregando accounts...</p> : error ? <p className="py-8 text-sm text-red-700">Não foi possível carregar CRM. Verifique sua permissão.</p> : accounts.length === 0 ? <p className="py-8 text-sm text-slate-500">Nenhuma account encontrada.</p> : <div className="divide-y divide-slate-100">{accounts.map((account) => <a key={account.id} href={`/dashboard/sales/accounts/${account.id}`} className="flex min-h-16 items-center justify-between gap-4 py-3 transition hover:bg-blue-50/50"><div><p className="font-medium text-slate-900">{account.name}</p><p className="text-xs text-slate-500">{account.domain ?? 'Domínio não informado'} · {[account.city, account.state].filter(Boolean).join(' / ') || 'Localização não informada'}</p></div><span className="text-xs font-medium text-blue-700">Abrir</span></a>)}</div>}</CardContent></Card></div></DashboardLayout>;
}
