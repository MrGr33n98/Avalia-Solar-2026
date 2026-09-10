'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, Eye, MousePointerClick, DollarSign, ChevronDown, ChevronUp, BarChart2 } from 'lucide-react';
import { CampaignSummary } from '@/lib/api-campaigns';
import CampaignFunnelChart from '@/components/sales/campaigns/CampaignFunnelChart';

interface CampaignAnalyticsCardsProps {
  campaigns: CampaignSummary[];
}

export default function CampaignAnalyticsCards({ campaigns }: CampaignAnalyticsCardsProps) {
  const [showFunnel, setShowFunnel] = useState<boolean>(false);

  const totalSent = campaigns.reduce((acc, c) => acc + (c.sent_count || 0), 0);
  const totalDelivered = campaigns.reduce((acc, c) => acc + (c.delivered_count || 0), 0);
  const totalOpened = campaigns.reduce((acc, c) => acc + (c.opened_count || 0), 0);
  const totalClicked = campaigns.reduce((acc, c) => acc + (c.clicked_count || 0), 0);
  const totalBounced = campaigns.reduce((acc, c) => acc + (c.bounced_count || 0), 0);
  const totalUnsub = campaigns.reduce((acc, c) => acc + (c.unsubscribed_count || 0), 0);
  const totalRevenueCents = campaigns.reduce((acc, c) => acc + (c.revenue_attributed_cents || 0), 0);

  const deliveryRate = totalSent > 0 ? `${((totalDelivered / totalSent) * 100).toFixed(1)}%` : '—';
  const openRate = totalDelivered > 0 ? `${((totalOpened / totalDelivered) * 100).toFixed(1)}%` : '—';
  const clickRate = totalOpened > 0 ? `${((totalClicked / totalOpened) * 100).toFixed(1)}%` : '—';
  const formattedRevenue = (totalRevenueCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const consolidatedMetrics = {
    sent_count: totalSent,
    delivered_count: totalDelivered,
    opened_count: totalOpened,
    clicked_count: totalClicked,
    bounced_count: totalBounced,
    unsubscribed_count: totalUnsub,
    delivery_rate: totalSent > 0 ? Number(((totalDelivered / totalSent) * 100).toFixed(1)) : 0,
    open_rate: totalDelivered > 0 ? Number(((totalOpened / totalDelivered) * 100).toFixed(1)) : 0,
    click_rate: totalOpened > 0 ? Number(((totalClicked / totalOpened) * 100).toFixed(1)) : 0,
    attributed_revenue_cents: totalRevenueCents,
  };

  return (
    <div className="space-y-3 font-sans">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Enviados */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Disparado</span>
            <Send className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{totalSent.toLocaleString('pt-BR')}</div>
          <div className="text-[11px] text-slate-500 mt-1">E-mails de campanhas</div>
        </div>

        {/* Taxa de Entrega */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Taxa de Entrega</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700">{deliveryRate}</div>
          <div className="text-[11px] text-slate-500 mt-1">{totalSent > 0 ? `${totalDelivered.toLocaleString('pt-BR')} entregues` : 'Sem disparos recentes'}</div>
        </div>

        {/* Taxa de Abertura */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Taxa de Abertura</span>
            <Eye className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-indigo-800">{openRate}</div>
          <div className="text-[11px] text-slate-500 mt-1">{totalDelivered > 0 ? `${totalOpened.toLocaleString('pt-BR')} aberturas` : 'Sem aberturas'}</div>
        </div>

        {/* Taxa de Clique */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Taxa de Clique</span>
            <MousePointerClick className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-800">{clickRate}</div>
          <div className="text-[11px] text-slate-500 mt-1">{totalOpened > 0 ? `${totalClicked.toLocaleString('pt-BR')} cliques` : 'Sem cliques'}</div>
        </div>

        {/* Receita Atribuída */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Receita Atribuída</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{totalRevenueCents > 0 ? formattedRevenue : '—'}</div>
          <div className="text-[11px] text-slate-500 mt-1">{totalRevenueCents > 0 ? 'Contratos pós-campanha' : 'Sem conversões'}</div>
        </div>
      </div>

      {/* Funnel Graph Toggle Button */}
      {totalSent > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowFunnel(!showFunnel)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50/70 hover:bg-indigo-100/70 px-3 py-1.5 rounded-lg border border-indigo-200/60 transition-colors"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            {showFunnel ? 'Ocultar Funil Gráfico' : 'Visualizar Funil Gráfico de Conversão'}
            {showFunnel ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
          </button>
        </div>
      )}

      {/* Expanded Funnel Chart */}
      {showFunnel && (
        <CampaignFunnelChart
          metrics={consolidatedMetrics}
          title="Funil Global Consolidado de Conversão (Todas as Campanhas)"
        />
      )}
    </div>
  );
}
