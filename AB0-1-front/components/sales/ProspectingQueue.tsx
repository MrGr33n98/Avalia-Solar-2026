'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Building2,
  ChevronRight,
  Filter,
  Flame,
  Globe,
  MapPin,
  MessageSquare,
  PhoneCall,
  Plus,
  RotateCw,
  Search,
  Sparkles,
  Target,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import CallLoggerModal from '@/components/sales/CallLoggerModal';
import Company360View from '@/components/sales/Company360View';
import { buildWhatsAppUrl } from '@/lib/phone';

type ProspectAccount = {
  id: number;
  name: string;
  domain?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: string | null;
  segment?: string | null;
  fit_score?: {
    score: number;
    breakdown: Array<{ points: number; text: string }>;
  };
  data_quality?: {
    score: number;
    missing_fields: string[];
  };
  next_best_action?: {
    action_type: string;
    priority: string;
    title: string;
    reason: string;
  };
};

export default function ProspectingQueue() {
  const [prospects, setProspects] = useState<ProspectAccount[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickModeIndex, setQuickModeIndex] = useState<number | null>(null);

  const fetchProspects = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/v1/sales/accounts?q=${encodeURIComponent(query)}`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Não foi possível carregar a Fila de Prospecção.');
        return res.json();
      })
      .then((data) => {
        setProspects(data.accounts ?? []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Erro ao conectar à API.');
      })
      .finally(() => setLoading(false));
  }, [query]);

  useEffect(() => {
    fetchProspects();
  }, [fetchProspects]);

  const activeProspect = quickModeIndex !== null ? prospects[quickModeIndex] : null;

  return (
    <SalesLayoutWrapper>
      <div className="mx-auto w-full max-w-7xl space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="border-0 bg-blue-900 font-bold text-white">Avalia Solar CRM</Badge>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Prospecting Engine</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Fila de Prospecção B2B
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Cadência ativa de prospecção com Fit Score determinístico e Next Best Action.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              onClick={() => setQuickModeIndex(prospects.length > 0 ? 0 : null)}
              disabled={prospects.length === 0}
              className="min-h-11 bg-emerald-600 font-bold text-white shadow-xs hover:bg-emerald-700"
            >
              <Zap className="mr-2 h-4 w-4" /> Modo Prospecção Rápida (Sequential)
            </Button>
          </div>
        </header>

        {/* Sequential Quick Mode Dialog */}
        {activeProspect && (
          <Card className="border-2 border-emerald-500 bg-emerald-50/20 shadow-md">
            <CardHeader className="p-4 border-b border-emerald-200 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="border-0 bg-emerald-600 font-bold text-white text-[11px]">
                  Modo Sequencial · Item {quickModeIndex! + 1} de {prospects.length}
                </Badge>
                <CardTitle className="text-base font-bold text-slate-900">{activeProspect.name}</CardTitle>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setQuickModeIndex(null)}>
                Sair do Modo Rápido
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-slate-500 font-semibold">Localização: <strong className="text-slate-900">{activeProspect.city}/{activeProspect.state}</strong></p>
                  <p className="text-slate-500 font-semibold">Telefone: <strong className="text-slate-900">{activeProspect.phone || '—'}</strong></p>
                  <p className="text-slate-500 font-semibold">E-mail: <strong className="text-slate-900">{activeProspect.email || '—'}</strong></p>
                </div>

                <div className="rounded-lg bg-white p-3 border border-slate-200 space-y-1">
                  <p className="font-bold text-blue-950 flex items-center gap-1 text-xs">
                    <Zap className="h-3.5 w-3.5 text-blue-700" /> Próxima Melhor Ação:
                  </p>
                   {activeProspect.next_best_action?.title ? (
                     <p className="text-slate-700 text-[11px]">{activeProspect.next_best_action.title}</p>
                   ) : (
                     <p className="text-[11px] italic text-slate-400">Defina a próxima ação no perfil da conta.</p>
                   )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-emerald-200 pt-3">
                <div className="flex items-center gap-2">
                  <CallLoggerModal contactName={activeProspect.name} phone={activeProspect.phone || undefined} />
                  {activeProspect.phone && (
                    <Button
                      size="sm"
                      onClick={() => window.open(buildWhatsAppUrl(activeProspect.phone), '_blank')}
                      className="bg-emerald-600 font-bold text-white hover:bg-emerald-700 text-xs"
                    >
                      <MessageSquare className="mr-1 h-3.5 w-3.5" /> WhatsApp
                    </Button>
                  )}
                  <Company360View accountId={activeProspect.id} companyName={activeProspect.name} />
                </div>

                <Button
                  size="sm"
                  onClick={() => setQuickModeIndex((prev) => (prev !== null && prev < prospects.length - 1 ? prev + 1 : 0))}
                  className="bg-blue-900 font-bold text-white hover:bg-blue-950"
                >
                  Próximo Prospect <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Directory Table */}
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-sm font-bold text-slate-900">Lista de Empresas em Prospecção ({prospects.length})</CardTitle>
              <div className="relative min-w-[280px]">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="min-h-10 border-slate-300 pl-9"
                  placeholder="Buscar por nome, cidade ou segmento..."
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {loading ? (
              <p className="py-8 text-center text-sm text-slate-500">Carregando fila de prospecção...</p>
            ) : error ? (
              <div className="py-8 text-center space-y-3">
                <AlertCircle className="mx-auto h-8 w-8 text-red-600" />
                <p className="text-sm font-semibold text-slate-900">{error}</p>
                <Button onClick={fetchProspects} variant="outline" size="sm" className="font-semibold">
                  <RotateCw className="mr-1.5 h-3.5 w-3.5" /> Tentar Novamente
                </Button>
              </div>
            ) : prospects.length === 0 ? (
              <div className="py-12 text-center">
                <Building2 className="mx-auto h-10 w-10 text-slate-400" />
                <p className="mt-3 font-semibold text-slate-900">Nenhum prospect encontrado na fila.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Empresa / Prospect</th>
                      <th className="p-3">Localização</th>
                      <th className="p-3">Fit Score</th>
                      <th className="p-3">Data Quality</th>
                      <th className="p-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {prospects.map((prospect) => (
                      <tr key={prospect.id} className="hover:bg-blue-50/50 transition">
                        <td className="p-3 font-bold text-slate-900">{prospect.name}</td>
                        <td className="p-3 text-slate-600">{prospect.city || '—'} / {prospect.state || '—'}</td>
                        <td className="p-3 font-bold text-blue-900">
                          {prospect.fit_score?.score != null ? (
                            <Badge className="border-0 bg-blue-900 text-white font-bold text-[10px]">
                              Fit {prospect.fit_score.score}/100
                            </Badge>
                          ) : (
                            <span className="text-[11px] italic text-slate-400">Não calculado</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-600">
                          {prospect.data_quality?.score != null ? (
                            <span className="font-semibold text-slate-800">{prospect.data_quality.score}%</span>
                          ) : (
                            <span className="italic text-slate-400">—</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <CallLoggerModal contactName={prospect.name} phone={prospect.phone || undefined} />
                            <Company360View accountId={prospect.id} companyName={prospect.name} />
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
    </SalesLayoutWrapper>
  );
}
