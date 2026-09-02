'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  Clock3,
  Flame,
  MessageSquare,
  PhoneCall,
  Plus,
  RotateCw,
  Search,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardLayout from '@/app/dashboard/components/DashboardLayout';
import CRMCommandPalette from '@/components/sales/CRMCommandPalette';
import SalesOutreachTemplates from '@/components/sales/SalesOutreachTemplates';
import CallLoggerModal from '@/components/sales/CallLoggerModal';
import Company360View from '@/components/sales/Company360View';
import { buildWhatsAppUrl } from '@/lib/phone';

type TodayData = {
  overdue: Array<{
    id: number;
    title: string;
    description?: string;
    due_at?: string;
    priority?: string;
    account_id?: number;
    account_name?: string;
    contact_id?: number;
    contact_name?: string;
  }>;
  today: Array<{
    id: number;
    title: string;
    description?: string;
    due_at?: string;
    priority?: string;
    account_id?: number;
    account_name?: string;
    contact_id?: number;
    contact_name?: string;
  }>;
  no_next_action: Array<{
    id: number;
    name: string;
    account_id?: number;
    account_name?: string;
    value_cents?: number;
    primary_contact_name?: string;
  }>;
  stale: Array<{
    id: number;
    name: string;
    account_id?: number;
    account_name?: string;
    value_cents?: number;
    last_activity_at?: string;
    primary_contact_name?: string;
  }>;
  upcoming: Array<{
    id: number;
    title: string;
    due_at?: string;
    account_name?: string;
  }>;
};

export default function SalesTodayWorkQueuePage() {
  const [data, setData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTodayData = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch('/api/v1/sales/today', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Não foi possível carregar a Fila Diária do CRM.');
        return res.json();
      })
      .then((resData) => {
        setData(resData);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Erro ao conectar à API.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchTodayData();
  }, [fetchTodayData]);

  const overdue = data?.overdue ?? [];
  const today = data?.today ?? [];
  const noNextAction = data?.no_next_action ?? [];
  const stale = data?.stale ?? [];

  return (
    <DashboardLayout className="bg-slate-50/70">
      <CRMCommandPalette />
      <div className="mx-auto w-full max-w-7xl space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="border-0 bg-blue-900 font-bold text-white">Avalia Solar CRM</Badge>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Daily Work Queue
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Fila Diária de Vendas (Today)
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Central de execução diária do vendedor: tarefas pendentes, stale deals e contas sem próxima ação.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={fetchTodayData}
              className="min-h-11 border-slate-300 bg-white shadow-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RotateCw className="mr-2 h-4 w-4 text-blue-900" /> Atualizar Fila
            </Button>
            <Link href="/dashboard/sales/pipeline">
              <Button className="min-h-11 bg-blue-900 font-bold text-white shadow-xs hover:bg-blue-950">
                Ir para Pipeline Kanban
              </Button>
            </Link>
          </div>
        </header>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RotateCw className="mx-auto h-8 w-8 animate-spin text-blue-900" />
            <p className="text-sm font-semibold text-slate-600">Carregando fila diária do CRM...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center space-y-3">
            <AlertCircle className="mx-auto h-8 w-8 text-red-600" />
            <p className="text-sm font-semibold text-slate-900">{error}</p>
            <Button onClick={fetchTodayData} variant="outline" size="sm" className="font-semibold">
              <RotateCw className="mr-1.5 h-3.5 w-3.5" /> Tentar Novamente
            </Button>
          </div>
        ) : (
          <>
            {/* Executive Metric Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-slate-200 bg-white shadow-xs">
                <CardContent className="flex items-center gap-3.5 p-4">
                  <div className="rounded-lg bg-red-100 p-2.5 text-red-700">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tarefas Atrasadas</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-red-700">{overdue.length}</p>
                    <p className="mt-0.5 text-xs text-slate-500">Exigem ação imediata</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white shadow-xs">
                <CardContent className="flex items-center gap-3.5 p-4">
                  <div className="rounded-lg bg-amber-100 p-2.5 text-amber-800">
                    <Clock3 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sem Próxima Ação</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-amber-800">{noNextAction.length}</p>
                    <p className="mt-0.5 text-xs text-slate-500">Oportunidades no escuro</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white shadow-xs">
                <CardContent className="flex items-center gap-3.5 p-4">
                  <div className="rounded-lg bg-indigo-100 p-2.5 text-indigo-800">
                    <CalendarClock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Stale Deals (&gt;5d)</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-indigo-900">{stale.length}</p>
                    <p className="mt-0.5 text-xs text-slate-500">Oportunidades esfriando</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white shadow-xs">
                <CardContent className="flex items-center gap-3.5 p-4">
                  <div className="rounded-lg bg-emerald-100 p-2.5 text-emerald-800">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Para Hoje</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-900">{today.length}</p>
                    <p className="mt-0.5 text-xs text-slate-500">Tarefas agendadas</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Overdue Section */}
            {overdue.length > 0 && (
              <Card className="border-red-200 bg-red-50/30 shadow-xs">
                <CardHeader className="p-4 border-b border-red-100 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <CardTitle className="text-sm font-bold text-red-950">Tarefas Atrasadas ({overdue.length})</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-2 text-xs">
                  {overdue.map((t) => (
                    <div key={t.id} className="rounded-lg border border-red-200 bg-white p-3 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{t.title}</p>
                        <p className="text-slate-500">{t.account_name || 'Conta Comercial'} · Decisor: {t.contact_name || '—'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <CallLoggerModal contactId={t.contact_id} contactName={t.contact_name} onSuccess={fetchTodayData} />
                        {t.account_id && <Company360View accountId={t.account_id} companyName={t.account_name} />}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* No Next Action Section */}
            {noNextAction.length > 0 && (
              <Card className="border-amber-200 bg-amber-50/30 shadow-xs">
                <CardHeader className="p-4 border-b border-amber-100 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-amber-700" />
                    <CardTitle className="text-sm font-bold text-amber-950">Oportunidades sem Próxima Ação ({noNextAction.length})</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-2 text-xs">
                  {noNextAction.map((o) => (
                    <div key={o.id} className="rounded-lg border border-amber-200 bg-white p-3 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{o.name}</p>
                        <p className="text-slate-500">Empresa: {o.account_name || '—'} · R$ {((o.value_cents ?? 0) / 100).toLocaleString('pt-BR')}</p>
                      </div>
                      {o.account_id && <Company360View accountId={o.account_id} companyName={o.account_name} />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
