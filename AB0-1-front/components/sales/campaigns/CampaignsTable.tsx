'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Pause, RotateCcw, ChevronRight, AlertCircle, Megaphone, CheckCircle2, RotateCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CampaignSummary } from '@/lib/api-campaigns';

interface CampaignsTableProps {
  campaigns: CampaignSummary[];
  loading: boolean;
  error: string | null;
  onSnapshot: (id: number) => void;
  onDispatch: (id: number) => void;
  onPause: (id: number) => void;
  onResume: (id: number) => void;
  onRetryFailed: (id: number) => void;
}

const statusBadge = (status: CampaignSummary['status']) => {
  switch (status) {
    case 'draft':
      return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 font-medium">Rascunho</Badge>;
    case 'scheduled':
      return <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 font-medium">Agendado</Badge>;
    case 'dispatching':
      return <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 font-semibold animate-pulse">Disparando...</Badge>;
    case 'paused':
      return <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200 font-medium">Pausado</Badge>;
    case 'completed':
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 font-bold">Concluído</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200 font-medium">Cancelado</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function CampaignsTable({
  campaigns,
  loading,
  error,
  onSnapshot,
  onDispatch,
  onPause,
  onResume,
  onRetryFailed,
}: CampaignsTableProps) {
  if (loading) {
    return (
      <div className="py-16 text-center space-y-3 bg-white rounded-lg border border-slate-200">
        <RotateCw className="mx-auto h-7 w-7 animate-spin text-indigo-600" />
        <p className="text-xs text-slate-500 font-medium">Carregando lista de campanhas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center space-y-3 bg-white rounded-lg border border-slate-200">
        <AlertCircle className="mx-auto h-8 w-8 text-red-600" />
        <p className="text-xs font-semibold text-slate-900">{error}</p>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="py-16 text-center bg-white rounded-lg border border-slate-200 shadow-2xs">
        <Megaphone className="mx-auto h-12 w-12 text-slate-300" />
        <p className="mt-3 text-base font-bold text-slate-900">Nenhuma campanha cadastrada.</p>
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
          Crie campanhas de e-mail marketing e outbound para se comunicar com seus contatos e clientes.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden font-sans">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-semibold select-none">
            <tr>
              <th className="p-3">Campanha</th>
              <th className="p-3">Status</th>
              <th className="p-3">Progresso Destinatários</th>
              <th className="p-3">Enviados / Entregues</th>
              <th className="p-3">Abertura / Clique</th>
              <th className="p-3">Receita Atribuída</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {campaigns.map((c) => {
              const processed = c.processed_recipients || 0;
              const total = c.total_recipients || 0;
              const progressPct = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;
              const openRate = c.delivered_count > 0 ? ((c.opened_count / c.delivered_count) * 100).toFixed(1) : '0.0';
              const clickRate = c.opened_count > 0 ? ((c.clicked_count / c.opened_count) * 100).toFixed(1) : '0.0';
              const revenueFormatted = (c.revenue_attributed_cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

              return (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-semibold text-slate-900">
                    <Link href={`/dashboard/sales/campaigns/${c.id}`} className="hover:text-indigo-600 flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-indigo-700 shrink-0" />
                      <div>
                        <span className="block font-bold">{c.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono font-normal">{c.campaign_key}</span>
                      </div>
                    </Link>
                  </td>

                  <td className="p-3">
                    {statusBadge(c.status)}
                  </td>

                  <td className="p-3 min-w-44">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
                        <span>{processed} / {total}</span>
                        <span>{progressPct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="p-3 text-slate-600">
                    <span className="font-semibold text-slate-800">{c.sent_count}</span> s. / <span className="font-semibold text-emerald-700">{c.delivered_count}</span> d.
                  </td>

                  <td className="p-3">
                    <span className="text-indigo-800 font-semibold">{openRate}%</span> ab. / <span className="text-amber-800 font-semibold">{clickRate}%</span> clq.
                  </td>

                  <td className="p-3 font-bold text-slate-900">
                    {revenueFormatted}
                  </td>

                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {c.status === 'draft' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSnapshot(c.id)}
                          className="h-7 text-xs px-2 border-slate-300 text-slate-700"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1 text-blue-600" /> Snapshot
                        </Button>
                      )}

                      {(c.status === 'scheduled' || c.status === 'draft') && (
                        <Button
                          size="sm"
                          onClick={() => onDispatch(c.id)}
                          className="h-7 text-xs px-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                        >
                          <Play className="w-3 h-3 mr-1 fill-white" /> Disparar
                        </Button>
                      )}

                      {c.status === 'dispatching' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onPause(c.id)}
                          className="h-7 text-xs px-2 border-purple-300 text-purple-800 bg-purple-50"
                        >
                          <Pause className="w-3 h-3 mr-1 fill-purple-800" /> Pausar
                        </Button>
                      )}

                      {c.status === 'paused' && (
                        <Button
                          size="sm"
                          onClick={() => onResume(c.id)}
                          className="h-7 text-xs px-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold"
                        >
                          <Play className="w-3 h-3 mr-1 fill-white" /> Retomar
                        </Button>
                      )}

                      {c.bounced_count > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onRetryFailed(c.id)}
                          className="h-7 text-xs px-2 text-amber-700 hover:bg-amber-50"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" /> Re-tentar
                        </Button>
                      )}

                      <Link href={`/dashboard/sales/campaigns/${c.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-600 hover:text-indigo-800 px-2">
                          Detalhes <ChevronRight className="w-3 h-3 ml-0.5" />
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
