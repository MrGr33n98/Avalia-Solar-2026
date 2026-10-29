'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import CampaignPreflightModal from '@/components/sales/campaigns/CampaignPreflightModal';
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
import { Megaphone, ArrowLeft, Play, Pause, RotateCcw, RotateCw, CheckCircle2, Send, Eye } from 'lucide-react';
import CampaignFunnelChart from '@/components/sales/campaigns/CampaignFunnelChart';

export default function Campaign360DetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const campaignId = typeof rawId === 'string' && /^\d+$/.test(rawId) ? Number(rawId) : NaN;
  const validCampaignId = Number.isSafeInteger(campaignId) && campaignId > 0;

  const [data, setData] = useState<{
    campaign: CampaignDetailed;
    metrics: CampaignMetrics;
    recipients: CampaignRecipientLog[];
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [preflightOpen, setPreflightOpen] = useState(false);

  const loadData = useCallback(() => {
    if (!validCampaignId) {
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);

    fetchCampaign(campaignId)
      .then(setData)
      .catch((err) => setError(err.message || 'Erro ao carregar detalhes da campanha.'))
      .finally(() => setLoading(false));
  }, [campaignId, validCampaignId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!validCampaignId) {
    return (
      <SalesLayoutWrapper>
        <h1>Campanha não encontrada</h1>
        <p>O identificador da campanha deve ser um número inteiro positivo.</p>
        <Link href="/dashboard/sales/campaigns">Voltar para Campanhas</Link>
      </SalesLayoutWrapper>
    );
  }

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
          <Button onClick={loadData} variant="outline">Tentar novamente</Button>
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

  const handleExecuteDispatch = async (id: number) => {
    await dispatchCampaign(id);
    loadData();
  };

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
                  onClick={() => setPreflightOpen(true)}
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
              <span className="text-xs font-semibold">Taxa Cliques</span>
              <span className="text-xs text-amber-600 font-bold">CTR</span>
            </div>
            <div className="text-xl font-bold text-amber-700">{metrics.click_rate}%</div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Rejeições (Bounce)</span>
              <span className="text-xs text-rose-500 font-bold">Bounce</span>
            </div>
            <div className="text-xl font-bold text-rose-700">{metrics.bounce_rate}%</div>
          </div>
        </div>

        {/* Funnel & Recipients */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-12">
            <CampaignFunnelChart metrics={metrics} />
          </div>
        </div>

        {preflightOpen && (
          <CampaignPreflightModal
            open={preflightOpen}
            campaignId={campaign.id}
            campaignName={campaign.name}
            onClose={() => setPreflightOpen(false)}
            onConfirmDispatch={handleExecuteDispatch}
          />
        )}
      </div>
    </SalesLayoutWrapper>
  );
}
