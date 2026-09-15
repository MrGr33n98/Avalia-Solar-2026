'use client';

import React from 'react';
import {
  Send,
  CheckCircle2,
  Eye,
  MousePointerClick,
  TrendingUp,
  AlertTriangle,
  UserX,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

interface CampaignFunnelChartProps {
  metrics: {
    sent_count: number;
    delivered_count: number;
    opened_count: number;
    clicked_count: number;
    bounced_count?: number;
    unsubscribed_count?: number;
    delivery_rate: number;
    open_rate: number;
    click_rate: number;
    attributed_revenue_cents?: number;
    attributed_revenue_formatted?: number;
  };
  title?: string;
}

export default function CampaignFunnelChart({ metrics, title = 'Funil de Conversão & Engajamento' }: CampaignFunnelChartProps) {
  const sent = metrics.sent_count || 0;
  const delivered = metrics.delivered_count || 0;
  const opened = metrics.opened_count || 0;
  const clicked = metrics.clicked_count || 0;
  const bounced = metrics.bounced_count || 0;
  const unsubscribed = metrics.unsubscribed_count || 0;

  // Calculo percentual relativo ao total enviado
  const deliveredPct = sent > 0 ? ((delivered / sent) * 100).toFixed(1) : '0';
  const openPct = delivered > 0 ? ((opened / delivered) * 100).toFixed(1) : '0';
  const clickPct = opened > 0 ? ((clicked / opened) * 100).toFixed(1) : '0';

  const chartData = [
    { name: 'Disparados', count: sent, color: '#4f46e5' },
    { name: 'Entregues', count: delivered, color: '#059669' },
    { name: 'Abertos', count: opened, color: '#2563eb' },
    { name: 'Clicados', count: clicked, color: '#d97706' },
  ];

  const steps = [
    {
      label: 'Disparados',
      count: sent,
      pct: '100%',
      drop: null,
      icon: Send,
      color: 'bg-indigo-600',
      textColor: 'text-indigo-700',
      bgColor: 'bg-indigo-50',
    },
    {
      label: 'Entregues na Caixa',
      count: delivered,
      pct: `${deliveredPct}%`,
      drop: sent > 0 ? `${(100 - Number(deliveredPct)).toFixed(1)}% bounce` : null,
      icon: CheckCircle2,
      color: 'bg-emerald-600',
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'Abertos pelo Lead',
      count: opened,
      pct: `${openPct}%`,
      drop: delivered > 0 ? `${(100 - Number(openPct)).toFixed(1)}% sem abrir` : null,
      icon: Eye,
      color: 'bg-blue-600',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Cliques em Proposta',
      count: clicked,
      pct: `${clickPct}%`,
      drop: opened > 0 ? `${(100 - Number(clickPct)).toFixed(1)}% sem clicar` : null,
      icon: MousePointerClick,
      color: 'bg-amber-600',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-5 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-700" />
          <h3 className="font-bold text-sm text-slate-900">{title}</h3>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {bounced > 0 && (
            <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5" /> {bounced} Bounces
            </span>
          )}
          {unsubscribed > 0 && (
            <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              <UserX className="w-3.5 h-3.5" /> {unsubscribed} Descadastros
            </span>
          )}
        </div>
      </div>

      {/* Visual Step-by-Step Funnel Bars */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const barWidth = sent > 0 ? Math.max(8, Math.min(100, (step.count / sent) * 100)) : 0;

          return (
            <div
              key={step.label}
              className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-indigo-200 hover:shadow-xs transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Etapa {idx + 1}
                </span>
                <div className={`p-1.5 rounded-lg ${step.bgColor} ${step.textColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="text-xl font-bold text-slate-900 tracking-tight">
                  {step.count.toLocaleString('pt-BR')}
                </div>
                <div className="text-xs text-slate-600 font-medium">{step.label}</div>
              </div>

              {/* Progress Track */}
              <div className="space-y-1">
                <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${step.color}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                  <span>Taxa: <strong className="text-slate-800">{step.pct}</strong></span>
                  {step.drop && <span className="text-slate-400">{step.drop}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* BarChart Comparison */}
      {sent > 0 && (
        <div className="pt-2">
          <div className="text-xs font-semibold text-slate-700 mb-2">Volume Comparativo por Etapa</div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: number) => [`${value.toLocaleString('pt-BR')} destinatários`, 'Volume']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
