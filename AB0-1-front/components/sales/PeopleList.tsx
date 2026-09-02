'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Briefcase,
  Building2,
  ChevronRight,
  Database,
  FileSpreadsheet,
  Linkedin,
  Mail,
  MessageSquare,
  Phone,
  PhoneCall,
  Plus,
  RotateCw,
  Search,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/app/dashboard/components/DashboardLayout';
import { buildWhatsAppUrl } from '@/lib/phone';
import CallLoggerModal from '@/components/sales/CallLoggerModal';
import Contact360View from '@/components/sales/Contact360View';

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
    <DashboardLayout className="bg-slate-50/70">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="border-0 bg-blue-900 font-bold text-white">Avalia Solar CRM</Badge>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">People Graph & Decisores</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Pessoas & Comitê de Compra</h1>
            <p className="mt-1 text-sm text-slate-600">
              Diretório central de executivos, decisores, champions e contatos das empresas prospectadas.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/dashboard/sales/accounts">
              <Button variant="outline" className="min-h-11 border-slate-300 bg-white font-semibold shadow-xs hover:bg-slate-50">
                <Building2 className="mr-2 h-4 w-4 text-blue-900" />
                Ver Diretório de Contas
              </Button>
            </Link>
          </div>
        </header>

        {/* Search Bar */}
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-sm font-bold text-slate-900">Decisores Mapeados ({people.length})</CardTitle>
              <div className="relative min-w-[280px]">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="min-h-10 border-slate-300 pl-9"
                  placeholder="Buscar por nome, cargo, e-mail ou empresa..."
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {loading ? (
              <p className="py-8 text-center text-sm text-slate-500">Carregando diretório de pessoas...</p>
            ) : error ? (
              <div className="py-8 text-center space-y-3">
                <AlertCircle className="mx-auto h-8 w-8 text-red-600" />
                <p className="text-sm font-semibold text-slate-900">{error}</p>
                <Button onClick={fetchPeople} variant="outline" size="sm" className="font-semibold">
                  <RotateCw className="mr-1.5 h-3.5 w-3.5" /> Tentar Novamente
                </Button>
              </div>
            ) : people.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="mx-auto h-10 w-10 text-slate-400" />
                <p className="mt-3 font-semibold text-slate-900">Nenhum decisor encontrado.</p>
                <p className="mt-1 text-xs text-slate-500">Cadastre os decisores dentro da Ficha Company 360 de cada conta.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Nome / Pessoa</th>
                      <th className="p-3">Cargo & Empresa</th>
                      <th className="p-3">Papel no Comitê</th>
                      <th className="p-3">Pontos de Contato</th>
                      <th className="p-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {people.map((person) => (
                      <tr key={person.id} className="hover:bg-blue-50/50 transition">
                        <td className="p-3 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>{person.name}</span>
                            {person.is_primary && (
                              <Badge className="border-0 bg-blue-900 text-[9px] font-bold text-white">Principal</Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-slate-600">
                          <div>
                            <span className="font-semibold text-slate-800">{person.job_title || 'Cargo não informado'}</span>
                            {person.account_name && (
                              <p className="text-[11px] text-slate-500">na {person.account_name}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="border-slate-300 bg-slate-50 font-bold text-slate-800 text-[10px]">
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
                                className="text-emerald-700 font-bold hover:underline"
                              >
                                Whats
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
                          <div className="flex items-center justify-end gap-2">
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
