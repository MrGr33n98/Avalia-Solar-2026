'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  Clock3,
  Filter,
  Flame,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/app/dashboard/components/DashboardLayout';
import CRMCommandPalette from '@/components/sales/CRMCommandPalette';
import SalesOutreachTemplates from '@/components/sales/SalesOutreachTemplates';

type WorkItem = {
  id: number;
  company: string;
  contact: string;
  phone: string;
  city: string;
  stage: string;
  value: string;
  score: number;
  daysNoActivity: number;
  nextAction?: string;
  dueDate?: string;
  isOverdue?: boolean;
  done?: boolean;
};

export default function SalesTodayWorkQueuePage() {
  const [items, setItems] = useState<WorkItem[]>([
    {
      id: 1,
      company: 'Solar Tech Indústria',
      contact: 'Carlos Mendes',
      phone: '(11) 98877-6655',
      city: 'Campinas, SP',
      stage: 'Qualificação B2B',
      value: 'R$ 450.000',
      score: 88,
      daysNoActivity: 6,
      nextAction: 'Confirmar faturas de energia e alinhamento com diretoria',
      dueDate: 'Hoje, 14:00',
      isOverdue: true,
      done: false,
    },
    {
      id: 2,
      company: 'Hospital São Lucas',
      contact: 'Dr. Roberto',
      phone: '(21) 97654-3210',
      city: 'Niterói, RJ',
      stage: 'Proposta Comercial',
      value: 'R$ 280.000',
      score: 92,
      daysNoActivity: 2,
      nextAction: 'Enviar minuta do contrato de Usina Usufruída',
      dueDate: 'Hoje, 16:30',
      done: false,
    },
    {
      id: 3,
      company: 'Mercado Real LTDA',
      contact: 'Fernanda Lima',
      phone: '(31) 99123-4567',
      city: 'Belo Horizonte, MG',
      stage: 'Diagnóstico Solar',
      value: 'R$ 120.000',
      score: 75,
      daysNoActivity: 7,
      nextAction: undefined, // No Next Action Alert
      dueDate: undefined,
      done: false,
    },
    {
      id: 4,
      company: 'Engenharia Sol Nascente',
      contact: 'Eng. Ricardo',
      phone: '(65) 99988-7766',
      city: 'Cuiabá, MT',
      stage: 'Negociação Final',
      value: 'R$ 520.000',
      score: 95,
      daysNoActivity: 1,
      nextAction: 'Confirmar recebimento da proposta formal e taxa de comissão',
      dueDate: 'Amanhã, 10:00',
      done: false,
    },
  ]);

  const toggleDone = (id: number) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  };

  const overdueCount = items.filter((i) => i.isOverdue && !i.done).length;
  const noNextActionCount = items.filter((i) => !i.nextAction && !i.done).length;
  const staleCount = items.filter((i) => i.daysNoActivity >= 5 && !i.done).length;

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
              Sua central diária de prospecção ativa, follow-ups pendentes, stale deals e tarefas prioritárias.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
                window.dispatchEvent(event);
              }}
              className="min-h-11 border-slate-300 bg-white shadow-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Search className="mr-2 h-4 w-4 text-blue-900" /> Cmd+K Atalhos
            </Button>
            <Link href="/dashboard/sales/pipeline">
              <Button className="min-h-11 bg-blue-900 font-bold text-white shadow-xs hover:bg-blue-950">
                Ir para Pipeline Kanban
              </Button>
            </Link>
          </div>
        </header>

        {/* Executive Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardContent className="flex items-center gap-3.5 p-4">
              <div className="rounded-lg bg-red-100 p-2.5 text-red-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tarefas Atrasadas</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-red-700">{overdueCount}</p>
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
                <p className="mt-1 text-2xl font-bold tracking-tight text-amber-800">{noNextActionCount}</p>
                <p className="mt-0.5 text-xs text-slate-500">Agendar próximo passo</p>
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
                <p className="mt-1 text-2xl font-bold tracking-tight text-indigo-900">{staleCount}</p>
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
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Hot Deals (Score &gt;80)</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-900">
                  {items.filter((i) => i.score >= 80 && !i.done).length}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">Alta probabilidade de fechamento</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Work Queue Feed */}
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="border-b border-slate-100 p-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Fila Prioritária de Prospecção</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Execute ações diretamente, abra script de WhatsApp ou conclua tarefas.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-blue-200 bg-blue-50 font-bold text-blue-900">
              {items.filter((i) => !i.done).length} Itens em Fila
            </Badge>
          </CardHeader>

          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-col gap-3 p-4 transition md:flex-row md:items-center md:justify-between hover:bg-slate-50/80 ${
                    item.done ? 'opacity-50 bg-slate-50/40' : ''
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <button
                      onClick={() => toggleDone(item.id)}
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                        item.done
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-300 bg-white hover:border-blue-700'
                      }`}
                    >
                      {item.done && <CheckCircle2 className="h-4 w-4" />}
                    </button>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-slate-900">{item.company}</span>
                        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700">
                          {item.stage}
                        </Badge>
                        <span className="text-sm font-bold text-blue-950">{item.value}</span>
                        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">
                          Score {item.score}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600">
                        <strong>Contato:</strong> {item.contact} ({item.phone}) · <span>{item.city}</span>
                      </p>

                      {item.nextAction ? (
                        <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                          <Target className="h-3.5 w-3.5 text-blue-700 shrink-0" />
                          Próxima Ação: <span className="text-slate-700">{item.nextAction}</span>
                        </p>
                      ) : (
                        <p className="text-xs font-bold text-amber-700 flex items-center gap-1.5 bg-amber-50 px-2 py-1 rounded border border-amber-200 w-fit">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          ALERTA: Nenhuma Próxima Ação Agendada!
                        </p>
                      )}

                      {item.daysNoActivity >= 5 && (
                        <p className="text-[11px] font-semibold text-indigo-700 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {item.daysNoActivity} dias sem novas interações (Stale)
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
                    <SalesOutreachTemplates
                      companyName={item.company}
                      contactName={item.contact}
                      phone={item.phone}
                      city={item.city}
                    />

                    <Button
                      size="sm"
                      onClick={() => {
                        const clean = item.phone.replace(/\D/g, '');
                        window.open(`https://wa.me/55${clean}`, '_blank');
                      }}
                      className="h-8 bg-emerald-600 font-bold text-white hover:bg-emerald-700 text-xs"
                    >
                      <MessageSquare className="mr-1 h-3.5 w-3.5" /> WhatsApp
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
