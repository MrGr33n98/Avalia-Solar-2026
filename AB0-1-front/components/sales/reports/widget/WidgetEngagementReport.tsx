'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  MessageSquare,
  Sparkles,
  UserCheck,
  Trophy,
  ArrowRight,
  RotateCw,
  Calendar,
  Share2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Settings,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { salesApi } from '@/lib/api/sales/client';
import { ApiWidgetEngagementReportResponse } from '@/lib/api/sales/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function WidgetEngagementReport() {
  const [periodPreset, setPeriodPreset] = useState('30d');
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ApiWidgetEngagementReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  const dateRange = useMemo(() => {
    const now = new Date();
    let from = new Date();
    const to = new Date();

    switch (periodPreset) {
      case '7d':
        from.setDate(now.getDate() - 7);
        break;
      case '30d':
        from.setDate(now.getDate() - 30);
        break;
      case '90d':
        from.setDate(now.getDate() - 90);
        break;
      case 'this_month':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        from.setDate(now.getDate() - 30);
    }

    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
    };
  }, [periodPreset]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await salesApi.getWidgetEngagementReport({
        from: dateRange.from,
        to: dateRange.to,
        granularity,
      });
      setReport(data);
    } catch (err: any) {
      console.error('[WidgetEngagementReport] Erro:', err);
      setError(err?.message || 'Falha ao carregar métricas do widget.');
    } finally {
      setLoading(false);
    }
  }, [dateRange, granularity]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const kpis = report?.kpis || {
    visitors: 0,
    opens: 0,
    actions: 0,
    contacts: 0,
    sales: 0,
    attributed_value_cents: 0,
  };

  const rates = report?.rates || {
    open_rate: 0,
    action_rate: 0,
    contact_rate: 0,
    sales_rate: 0,
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}${window.location.pathname}?tab=widget&preset=${periodPreset}&granularity=${granularity}`;
      navigator.clipboard?.writeText(url);
      setShareNotice('Link do relatório copiado!');
      setTimeout(() => setShareNotice(null), 3000);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const isWidgetEmpty = kpis.visitors === 0 && kpis.opens === 0;

  return (
    <div className="space-y-6">
      {/* 1. Header do Relatório */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Widget Engagement & Funnel
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Análise do funil do Chat Widget MobiVolt (Visitantes → Aberturas → Ações → Contatos → Vendas)
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 text-xs font-semibold">
          {shareNotice && (
            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-lg border border-emerald-200">
              {shareNotice}
            </span>
          )}

          <select
            value={periodPreset}
            onChange={(e) => setPeriodPreset(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg px-3 py-1.5 shadow-xs cursor-pointer"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="this_month">Este Mês</option>
          </select>

          {/* Granularity Tabs (Day / Week / Month) */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            {(['day', 'week', 'month'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={cn(
                  'px-2.5 py-1 rounded-md transition-colors capitalize',
                  granularity === g
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                )}
              >
                {g}
              </button>
            ))}
          </div>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
            Share
          </button>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 shadow-xs"
            title="Atualizar dados"
          >
            <RotateCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* 2. Empty State / Diagnostic Notice (Estilo Nutshell print 2) */}
      {isWidgetEmpty && !loading && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Nenhum evento registrado pelo widget de chat no período.</p>
              <p className="text-amber-700 dark:text-amber-300 text-[11px] mt-0.5">
                Para visualizar dados neste relatório, certifique-se de que o Chat MobiVolt está instalado e ativo em seu site.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/chat"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shrink-0 transition-colors shadow-xs"
          >
            <Settings className="w-3.5 h-3.5" />
            Configurações de Chat
          </Link>
        </div>
      )}

      {/* 3. 5-Step Funnel Visual (Padrão exato do print 1 do Nutshell) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">
          Funil de Conversão do Chat
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
          {/* 1. Visitors */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 relative">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              1. Visitors
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {kpis.visitors}
              </span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Sessões no site</p>
          </div>

          {/* 2. Opens */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                2. Opens
              </span>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded-full">
                {rates.open_rate}%
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {kpis.opens}
              </span>
              <MessageSquare className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Aberturas do widget</p>
          </div>

          {/* 3. Actions */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                3. Actions
              </span>
              <span className="text-[10px] font-bold text-sky-600 bg-sky-50 dark:bg-sky-950/60 px-1.5 py-0.5 rounded-full">
                {rates.action_rate}%
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-sky-600 dark:text-sky-400">
                {kpis.actions}
              </span>
              <Sparkles className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Interações no chat</p>
          </div>

          {/* 4. Contacts */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                4. Contacts
              </span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-full">
                {rates.contact_rate}%
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {kpis.contacts}
              </span>
              <UserCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Leads qualificados</p>
          </div>

          {/* 5. Sales */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                5. Sales
              </span>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-full">
                {rates.sales_rate}%
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {kpis.sales}
              </span>
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1" title={formatCurrency(kpis.attributed_value_cents)}>
              {kpis.attributed_value_cents > 0 ? formatCurrency(kpis.attributed_value_cents) : '0 ganhos'}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Gráficos de Tendência Diária (Padrão exato do print 3 do Nutshell) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visitors by day */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Visitors by {granularity}</h3>
              <p className="text-[11px] text-slate-500">Visitantes que visualizaram a página com o widget</p>
            </div>
            <span className="text-lg font-black text-slate-900 dark:text-slate-100">{kpis.visitors}</span>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={report?.series || []} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }} />
                <Area type="monotone" dataKey="visitors" name="Visitantes" stroke="#64748b" fill="#64748b" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Opens by day */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Widget opens by {granularity}</h3>
              <p className="text-[11px] text-slate-500">Aberturas iniciadas no chat MobiVolt</p>
            </div>
            <span className="text-lg font-black text-indigo-600">{kpis.opens}</span>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={report?.series || []} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }} />
                <Area type="monotone" dataKey="opens" name="Aberturas" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Actions by day */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Actions by {granularity}</h3>
              <p className="text-[11px] text-slate-500">Mensagens enviadas e seleções interativas</p>
            </div>
            <span className="text-lg font-black text-sky-600">{kpis.actions}</span>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={report?.series || []} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }} />
                <Area type="monotone" dataKey="actions" name="Ações" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Contacts by day */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Contacts by {granularity}</h3>
              <p className="text-[11px] text-slate-500">Leads capturados com dados de contato</p>
            </div>
            <span className="text-lg font-black text-emerald-600">{kpis.contacts}</span>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={report?.series || []} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }} />
                <Area type="monotone" dataKey="contacts" name="Contatos" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
