'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  ChevronRight,
  Database,
  FileSpreadsheet,
  Filter,
  Mail,
  MessageSquare,
  Plus,
  Search,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/app/dashboard/components/DashboardLayout';
import SolarRoiCalculator from '@/components/sales/SolarRoiCalculator';
import SolarSalesBattlecards from '@/components/sales/SolarSalesBattlecards';

type Account = {
  id: number;
  name: string;
  domain?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: string | null;
};

export default function AccountList() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/sales/accounts?q=${encodeURIComponent(query)}`, { credentials: 'include' })
      .then((response) => {
        if (!response.ok) throw new Error('accounts');
        return response.json();
      })
      .then((data) => setAccounts(data.accounts ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <DashboardLayout className="bg-slate-50/70">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="border-0 bg-blue-900 font-bold text-white">Avalia Solar CRM</Badge>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Diretório de Prospects</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Contas & Prospects B2B</h1>
            <p className="mt-1 text-sm text-slate-600">
              Diretório central de empresas, usinas e parceiros em prospecção pela Avalia Solar.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <SolarRoiCalculator />
            <SolarSalesBattlecards />

            <Link href="/dashboard/sales/import">
              <Button variant="outline" className="min-h-11 border-slate-300 bg-white font-semibold shadow-xs hover:bg-slate-50">
                <FileSpreadsheet className="mr-2 h-4 w-4 text-blue-800" />
                Importar Arquivo (.CSV)
              </Button>
            </Link>

            <Link href="/dashboard/sales">
              <Button className="min-h-11 bg-blue-900 font-bold text-white shadow-sm hover:bg-blue-950">
                <Plus className="mr-2 h-4 w-4" /> Ir para o Pipeline
              </Button>
            </Link>
          </div>
        </header>

        {/* Search and Filters */}
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-sm font-bold text-slate-900">Empresas e Leads Cadastrados</CardTitle>
              <div className="relative min-w-[280px]">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="min-h-10 border-slate-300 pl-9"
                  placeholder="Buscar por nome, cidade ou estado..."
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {loading ? (
              <p className="py-8 text-center text-sm text-slate-500">Carregando diretório de contas...</p>
            ) : error ? (
              <p className="py-8 text-center text-sm text-red-700">Não foi possível carregar o CRM. Verifique sua conexão.</p>
            ) : accounts.length === 0 ? (
              <div className="py-12 text-center">
                <Building2 className="mx-auto h-10 w-10 text-slate-400" />
                <p className="mt-3 font-semibold text-slate-900">Nenhum prospect encontrado.</p>
                <p className="mt-1 text-xs text-slate-500">Suba um arquivo .CSV para popular sua lista de prospecção.</p>
                <Link href="/dashboard/sales/import">
                  <Button className="mt-4 bg-blue-900 font-semibold hover:bg-blue-950">
                    Importar Primeiros Leads
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Empresa / Prospect</th>
                      <th className="p-3">Domínio</th>
                      <th className="p-3">Localização</th>
                      <th className="p-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {accounts.map((account) => (
                      <tr key={account.id} className="hover:bg-blue-50/50 transition">
                        <td className="p-3 font-bold text-slate-900">{account.name}</td>
                        <td className="p-3 text-slate-600">{account.domain || '—'}</td>
                        <td className="p-3 text-slate-600">
                          {[account.city, account.state].filter(Boolean).join(' / ') || 'Não especificado'}
                        </td>
                        <td className="p-3 text-right">
                          <Link href={`/dashboard/sales/accounts/${account.id}`}>
                            <Button variant="outline" size="sm" className="border-slate-300 text-blue-900 font-semibold hover:bg-blue-50">
                              Detalhes <ChevronRight className="ml-1 h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
