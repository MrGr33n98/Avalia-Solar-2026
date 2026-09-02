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
  Download,
  Filter,
  Mail,
  Plus,
  RotateCw,
  Search,
  Share2,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import CallLoggerModal from '@/components/sales/CallLoggerModal';
import Contact360View from '@/components/sales/Contact360View';
import { buildWhatsAppUrl } from '@/lib/phone';

type Person = {
  id: number;
  first_name: string;
  last_name?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  job_title?: string | null;
  linkedin_url?: string | null;
  decision_role?: string | null;
  is_primary?: boolean;
  account_name?: string | null;
};

export default function PeopleList() {
  const [people, setPeople] = useState<Person[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPeople = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/v1/sales/contacts?q=${encodeURIComponent(query)}`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            throw new Error('Acesso não autorizado ao módulo de Pessoas do CRM.');
          }
          throw new Error('Não foi possível carregar a lista de contatos.');
        }
        return res.json();
      })
      .then((data) => {
        setPeople(data.contacts ?? []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Erro ao conectar à API.');
      })
      .finally(() => setLoading(false));
  }, [query]);

  useEffect(() => {
    fetchPeople();
  }, [fetchPeople]);

  return (
    <SalesLayoutWrapper>
      <div className="space-y-6">
        {/* Nutshell Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <span>All people</span>
                <Bookmark className="w-5 h-5 text-sky-500 fill-sky-500 cursor-pointer" />
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">Executivos, decisores, champions e contatos das empresas</p>
          </div>

          {/* Actions Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs bg-white border-slate-200 text-slate-700">
                  <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> Export <ChevronDown className="w-3 h-3 ml-1 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs">
                <DropdownMenuItem className="cursor-pointer">Export to CSV</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" className="h-8 text-xs bg-white border-slate-200 text-slate-700">
              <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> Email
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
              <span>Role</span>
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
                placeholder="Search people..."
              />
            </div>
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">{people.length} people</span>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-600 px-2">
              <Columns className="w-3.5 h-3.5 mr-1 text-slate-400" /> Change columns
            </Button>
          </div>
        </div>

        {/* People Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <p className="py-12 text-center text-xs text-slate-500">Loading people...</p>
          ) : error ? (
            <div className="py-10 text-center space-y-3">
              <AlertCircle className="mx-auto h-7 w-7 text-red-600" />
              <p className="text-xs font-semibold text-slate-900">{error}</p>
              <Button onClick={fetchPeople} variant="outline" size="sm" className="h-7 text-xs">
                <RotateCw className="mr-1.5 h-3 w-3" /> Retry
              </Button>
            </div>
          ) : people.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-900">No contacts found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-semibold select-none">
                  <tr>
                    <th className="p-3 w-8">
                      <input type="checkbox" className="rounded border-slate-300 text-sky-600" />
                    </th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Job title & Company</th>
                    <th className="p-3">Decision Role</th>
                    <th className="p-3">Contact info</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {people.map((person) => (
                    <tr key={person.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <input type="checkbox" className="rounded border-slate-300 text-sky-600" />
                      </td>
                      <td className="p-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{person.name}</span>
                          {person.is_primary && (
                            <Badge className="border-0 bg-blue-900 text-[9px] font-bold text-white">Primary</Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-slate-600">
                        <div>
                          <span className="font-semibold text-slate-800">{person.job_title || '—'}</span>
                          {person.account_name && <p className="text-[11px] text-slate-500">at {person.account_name}</p>}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[11px] font-normal border-slate-200 bg-slate-50">
                          {person.decision_role || 'Decision Maker'}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-600">
                        <div className="flex items-center gap-2 text-[11px]">
                          {person.whatsapp && (
                            <a
                              href={buildWhatsAppUrl(person.whatsapp)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-700 font-semibold hover:underline"
                            >
                              WhatsApp
                            </a>
                          )}
                          {person.email && (
                            <a href={`mailto:${person.email}`} className="text-slate-600 hover:underline truncate max-w-[140px]">
                              {person.email}
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <CallLoggerModal
                            contactId={person.id}
                            contactName={person.name}
                            phone={person.phone || person.whatsapp || undefined}
                            onSuccess={fetchPeople}
                          />
                          <Contact360View
                            contactId={person.id}
                            contactName={person.name}
                            jobTitle={person.job_title || undefined}
                            accountName={person.account_name || undefined}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </SalesLayoutWrapper>
  );
}
