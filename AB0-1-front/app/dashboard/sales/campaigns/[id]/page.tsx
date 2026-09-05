'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import {
  fetchCampaign,
  snapshotCampaign,
  dispatchCampaign,
  pauseCampaign,
  resumeCampaign,
  retryFailedCampaign,
  CampaignDetailed,
  CampaignMetrics,
  CampaignRecipientLog,
} from '@/lib/api-campaigns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Megaphone, ArrowLeft, Play, Pause, RotateCcw, RotateCw, CheckCircle2, DollarSign, Send, Eye, MousePointerClick } from 'lucide-react';

export default function Campaign360DetailPage() {
  const params = useParams();
  const campaignId = Number(params?.id);

  const [data, setData] = useState<{
    campaign: CampaignDetailed;
    metrics: CampaignMetrics;
    recipients: CampaignRecipientLog[];
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(() => {
    if (!campaignId) return;
    setLoading(true);

    fetchCampaign(campaignId)
      .then(setData)
      .catch((err) => setError(err.message || 'Erro ao carregar detalhes da campanha.'))
      .finally(() => setLoading(false));
  }, [campaignId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <SalesLayoutWrapper>
        <div className="py-20 text-center space-y-3 bg-white rounded-lg border border-slate-200">
          <RotateCw className="mx-auto h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-xs text-slate-500 font-medium">Carregando detalhes da campanha #{campaignId}...</p>
        </div>
      </SalesLayoutWrapper>
    );
  }

  if (error || !data) {
    return (
      <SalesLayoutWrapper>
        <div className="py-16 text-center space-y-3 bg-white rounded-lg border border-slate-200">
          <p className="text-xs font-semibold text-red-600">{error || 'Campanha não encontrada.'}</p>
          <Link href="/dashboard/sales/campaigns">
            <Button variant="outline" size="sm" className="h-8 text-xs">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Voltar para Campanhas
            </Button>
          </Link>
        </div>
      </SalesLayoutWrapper>
    );
  }

  const { campaign, metrics, recipients } = data;
  const processed = metrics.processed_recipients || 0;
  const total = metrics.total_recipients || 0;
  const progressPct = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;
  const formattedRevenue = (metrics.attributed_revenue_cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <SalesLayoutWrapper>
      <div className="space-y-6 font-sans pb-16">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard/sales/campaigns">
            <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-600 hover:text-slate-900">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Voltar para Campanhas
            </Button>
          </Link>
        </div>

        {/* Campaign Header Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-indigo-100 rounded-xl text-indigo-700">
                <Megaphone className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900">{campaign.name}</h1>
                  <Badge variant="outline" className="bg-slate-100 text-slate-700 text-xs">
                    {campaign.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Chave: <span className="font-mono">{campaign.campaign_key}</span> | Tipo: <span className="font-semibold">{campaign.campaign_type}</span>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {campaign.status === 'draft' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await snapshotCampaign(campaign.id);
                    loadData();
                  }}
                  className="h-8 text-xs border-slate-300"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-blue-600" /> Snapshot Audiência
                </Button>
              )}

              {(campaign.status === 'scheduled' || campaign.status === 'draft') && (
                <Button
                  size="sm"
                  onClick={async () => {
                    await dispatchCampaign(campaign.id);
                    loadData();
                  }}
                  className="h-8 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                >
                  <Play className="w-3.5 h-3.5 mr-1 fill-white" /> Disparar Agora
                </Button>
              )}

              {campaign.status === 'dispatching' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await pauseCampaign(campaign.id);
                    loadData();
                  }}
                  className="h-8 text-xs border-purple-300 text-purple-800 bg-purple-50"
                >
                  <Pause className="w-3.5 h-3.5 mr-1 fill-purple-800" /> Pausar Envio
                </Button>
              )}

              {campaign.status === 'paused' && (
                <Button
                  size="sm"
                  onClick={async () => {
                    await resumeCampaign(campaign.id);
                    loadData();
                  }}
                  className="h-8 text-xs bg-indigo-700 hover:bg-indigo-800 text-white font-bold"
                >
                  <Play className="w-3.5 h-3.5 mr-1 fill-white" /> Retomar Envio
                </Button>
              )}

              {metrics.bounced_count > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    await retryFailedCampaign(campaign.id);
                    loadData();
                  }}
                  className="h-8 text-xs text-amber-700 hover:bg-amber-50"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Re-tentar Falhas
                </Button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Progresso de Envio</span>
              <span>{processed} / {total} destinatários ({progressPct}%)</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Real-time KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Enviados</span>
              <Send className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-bold text-slate-900">{metrics.sent_count}</div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Taxa Entrega</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-bold text-emerald-700">{metrics.delivery_rate}%</div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Taxa Abertura</span>
              <Eye className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-xl font-bold text-indigo-800">{metrics.open_rate}%</div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Taxa Clique</span>
              <MousePointerClick className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-bold text-amber-800">{metrics.click_rate}%</div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Receita Atribuída</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-bold text-slate-900">{formattedRevenue}</div>
          </div>
        </div>

        {/* Recipients Log Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-900">
            Log Recente de Destinatários ({recipients.length})
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="p-3">Destinatário</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Enviado em</th>
                  <th className="p-3">Entregue em</th>
                  <th className="p-3">Aberto em</th>
                  <th className="p-3">Erro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recipients.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <span className="font-semibold text-slate-900 block">{r.first_name || 'Contato'}</span>
                      <span className="text-slate-500 text-[11px] block">{r.email}</span>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-[10px]">
                        {r.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-500">{r.sent_at ? new Date(r.sent_at).toLocaleString('pt-BR') : '—'}</td>
                    <td className="p-3 text-slate-500">{r.delivered_at ? new Date(r.delivered_at).toLocaleString('pt-BR') : '—'}</td>
                    <td className="p-3 text-indigo-700">{r.opened_at ? new Date(r.opened_at).toLocaleString('pt-BR') : '—'}</td>
                    <td className="p-3 text-red-600 max-w-xs truncate">{r.error_message || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SalesLayoutWrapper>
  );
}
