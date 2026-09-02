'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Bookmark,
  Building2,
  ChevronDown,
  ChevronRight,
  Columns,
  Copy,
  Download,
  Filter,
  Mail,
  Plus,
  RotateCw,
  Search,
  Share2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import Company360View from '@/components/sales/Company360View';
import SolarRoiCalculator from '@/components/sales/SolarRoiCalculator';

type Account = {
  id: number;
  name: string;
  domain?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: string | null;
  company_type?: string | null;
  last_activity_at?: string | null;
};

export default function AccountList() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/v1/sales/accounts?q=${encodeURIComponent(query)}`, { credentials: 'include' })
      .then((response) => {
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error('Acesso não autorizado ao CRM de Vendas.');
          }
          throw new Error('Não foi possível carregar as contas do CRM.');
        }
        return response.json();
      })
      .then((data) => {
        setAccounts(data.accounts ?? []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Erro ao conectar à API do CRM.');
      })
      .finally(() => setLoading(false));
  }, [query]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return (
    <SalesLayoutWrapper>
      <div className="space-y-6">
        {/* Nutshell Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <span>All companies</span>
                <Bookmark className="w-5 h-5 text-sky-500 fill-sky-500 cursor-pointer" />
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">Accounts and organizations you do business with</p>
          </div>

          {/* Actions Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <SolarRoiCalculator />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs bg-white border-slate-200 text-slate-700">
                  <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> Export <ChevronDown className="w-3 h-3 ml-1 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs">
                <DropdownMenuItem className="cursor-pointer">Export to CSV</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">Export to Excel</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" className="h-8 text-xs bg-white border-slate-200 text-slate-700">
              <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> Email
            </Button>

            <Button variant="outline" size="sm" className="h-8 text-xs bg-white border-slate-200 text-slate-700">
              <Copy className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> Manage duplicates
            </Button>

            <Button variant="outline" size="sm" className="h-8 text-xs bg-white border-slate-200 text-slate-700">
              <Share2 className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> Share
            </Button>
          </div>
        </header>

        {/* Filter Bar (Chips dropdowns & search) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" className="h-7 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200">
              <Filter className="w-3 h-3 mr-1.5 text-sky-600 fill-sky-600" />
              <span>Assigned to</span>
              <ChevronDown className="w-3 h-3 ml-1 text-slate-400" />
            </Button>

            <Button variant="secondary" size="sm" className="h-7 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200">
              <span>Company type</span>
              <ChevronDown className="w-3 h-3 ml-1 text-slate-400" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-7 pl-8 text-xs border-slate-200 bg-slate-50/50"
                placeholder="Search companies..."
              />
            </div>
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">{accounts.length} companies</span>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-600 px-2">
              <Columns className="w-3.5 h-3.5 mr-1 text-slate-400" /> Change columns
            </Button>
          </div>
        </div>

        {/* Companies Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <p className="py-12 text-center text-xs text-slate-500">Loading companies...</p>
          ) : error ? (
            <div className="py-10 text-center space-y-3">
              <AlertCircle className="mx-auto h-7 w-7 text-red-600" />
              <p className="text-xs font-semibold text-slate-900">{error}</p>
              <Button onClick={fetchAccounts} variant="outline" size="sm" className="h-7 text-xs">
                <RotateCw className="mr-1.5 h-3 w-3" /> Retry
              </Button>
            </div>
          ) : accounts.length === 0 ? (
            <div className="py-16 text-center">
              <Building2 className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-900">No companies found.</p>
              <p className="mt-1 text-xs text-slate-500">Keep track of the companies you work with by importing or adding a company.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-semibold select-none">
                  <tr>
                    <th className="p-3 w-8">
                      <input type="checkbox" className="rounded border-slate-300 text-sky-600" />
                    </th>
                    <th className="p-3">Company name</th>
                    <th className="p-3">People</th>
                    <th className="p-3">Last contact</th>
                    <th className="p-3">Address</th>
                    <th className="p-3">Company type</th>
                    <th className="p-3">Tags</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {accounts.map((account) => (
                    <tr key={account.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="p-3">
                        <input type="checkbox" className="rounded border-slate-300 text-sky-600" />
                      </td>
                      <td className="p-3 font-semibold text-slate-900">
                        <Link href={`/dashboard/sales/accounts/${account.id}`} className="hover:text-sky-600">
                          {account.name}
                        </Link>
                      </td>
                      <td className="p-3 text-slate-600">{account.email || '—'}</td>
                      <td className="p-3 text-slate-500">
                        {account.last_activity_at ? new Date(account.last_activity_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-3 text-slate-600">
                        {[account.city, account.state].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td className="p-3 text-slate-600">
                        <Badge variant="outline" className="text-[11px] font-normal border-slate-200 bg-slate-50">
                          {account.company_type || 'Standard Account'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span className="text-[11px] text-slate-400">—</span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Company360View
                            accountId={account.id}
                            companyName={account.name}
                            city={account.city || '—'}
                            state={account.state || '—'}
                            domain={account.domain || undefined}
                          />
                          <Link href={`/dashboard/sales/accounts/${account.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-sky-600 hover:text-sky-700 px-2">
                              Details <ChevronRight className="ml-1 h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Nutshell Bottom Onboarding Banner */}
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 bg-amber-50 border border-amber-200 text-amber-500 rounded-full flex items-center justify-center mx-auto">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Keep track of the companies you work with</h3>
            <p className="text-xs text-slate-500 mt-1">Add companies to organize contacts, track leads, and view relationship histories.</p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link href="/dashboard/sales/accounts/new">
              <Button size="sm" className="h-8 text-xs bg-sky-600 hover:bg-sky-700 text-white font-medium">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add a new company
              </Button>
            </Link>
            <Link href="/dashboard/sales/import">
              <Button variant="outline" size="sm" className="h-8 text-xs border-sky-300 text-sky-700 bg-sky-50/50 hover:bg-sky-100/60 font-medium">
                Import your contacts
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </SalesLayoutWrapper>
  );
}
