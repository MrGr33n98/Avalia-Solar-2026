'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  Mail,
  MousePointer,
  RotateCw,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/app/dashboard/components/DashboardLayout';

type EmailItem = {
  id: number;
  subject: string;
  from_email: string;
  to_email: string;
  status: string;
  sent_at?: string;
  delivered_at?: string;
  open_count: number;
  click_count: number;
  account_name?: string;
  contact_name?: string;
  created_at: string;
};

export default function EmailCenter() {
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmails = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch('/api/v1/sales/emails', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Não foi possível carregar a lista de e-mails enviados.');
        return res.json();
      })
      .then((data) => {
        setEmails(data.emails ?? []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Erro ao conectar à API de e-mail.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const filtered = emails.filter(
    (e) =>
      e.subject.toLowerCase().includes(query.toLowerCase()) ||
      (e.account_name && e.account_name.toLowerCase().includes(query.toLowerCase())) ||
      (e.contact_name && e.contact_name.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <DashboardLayout className="bg-slate-50/70">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="border-0 bg-blue-900 font-bold text-white">Avalia Solar CRM</Badge>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email Center</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Central de Engajamento de E-mail
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Histórico unificado de entregas (SES), aberturas, cliques e bounces de e-mails comerciais.
            </p>
          </div>

          <Button onClick={fetchEmails} variant="outline" className="min-h-11 border-slate-300 bg-white font-semibold text-slate-700">
            <RotateCw className="mr-2 h-4 w-4 text-blue-900" /> Atualizar E-mails
          </Button>
        </header>

        {/* Directory Card */}
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-sm font-bold text-slate-900">E-mails Enviados ({filtered.length})</CardTitle>
              <div className="relative min-w-[280px]">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="min-h-10 border-slate-300 pl-9"
                  placeholder="Buscar por assunto, empresa ou contato..."
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {loading ? (
              <p className="py-8 text-center text-sm text-slate-500">Carregando e-mails enviados...</p>
            ) : error ? (
              <div className="py-8 text-center space-y-3">
                <AlertCircle className="mx-auto h-8 w-8 text-red-600" />
                <p className="text-sm font-semibold text-slate-900">{error}</p>
                <Button onClick={fetchEmails} variant="outline" size="sm" className="font-semibold">
                  <RotateCw className="mr-1.5 h-3.5 w-3.5" /> Tentar Novamente
                </Button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center">
                <Mail className="mx-auto h-10 w-10 text-slate-400" />
                <p className="mt-3 font-semibold text-slate-900">Nenhum e-mail comercial enviado ainda.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Destinatário / Empresa</th>
                      <th className="p-3">Assunto</th>
                      <th className="p-3">Status Delivery</th>
                      <th className="p-3 text-center">Aberturas</th>
                      <th className="p-3 text-center">Cliques</th>
                      <th className="p-3 text-right">Data de Envio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((e) => (
                      <tr key={e.id} className="hover:bg-blue-50/50 transition">
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{e.contact_name || e.to_email}</p>
                          <p className="text-slate-500">{e.account_name || '—'}</p>
                        </td>
                        <td className="p-3 font-semibold text-slate-800">{e.subject}</td>
                        <td className="p-3">
                          <Badge
                            className={`border-0 font-bold text-[10px] uppercase ${
                              e.status === 'delivered'
                                ? 'bg-emerald-600 text-white'
                                : e.status === 'bounced'
                                ? 'bg-red-600 text-white'
                                : 'bg-blue-900 text-white'
                            }`}
                          >
                            {e.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-800">
                          <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                            <Eye className="h-3 w-3 text-blue-700" /> {e.open_count}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-800">
                          <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                            <MousePointer className="h-3 w-3 text-indigo-700" /> {e.click_count}
                          </span>
                        </td>
                        <td className="p-3 text-right text-slate-500">
                          {new Date(e.created_at).toLocaleDateString('pt-BR')}
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
