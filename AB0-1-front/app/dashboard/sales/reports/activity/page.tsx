'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  RotateCw,
  Download,
  Share2,
  Bookmark,
  CheckCircle2,
  Filter,
  ChevronDown,
  Layers,
  Phone,
  Video,
  MapPin,
  FileText,
  Mail,
  CheckSquare,
  MessageSquare,
  Clock,
  User as UserIcon,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { salesApi } from '@/lib/api/sales/client';
import { ApiActivityReportResponse } from '@/lib/api/sales/types';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import { cn } from '@/lib/utils';

const ACTIVITY_TYPE_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  call: { label: 'Ligações', color: '#f59e0b', icon: Phone },
  meeting: { label: 'Reuniões', color: '#8b5cf6', icon: Video },
  virtual_meeting: { label: 'Reunião Virtual', color: '#6366f1', icon: Video },
  visit: { label: 'Vistorias Técnicas', color: '#10b981', icon: MapPin },
  note: { label: 'Notas Comerciais', color: '#64748b', icon: FileText },
  email: { label: 'E-mails', color: '#3b82f6', icon: Mail },
  whatsapp: { label: 'WhatsApp B2B', color: '#059669', icon: MessageSquare },
  task: { label: 'Tarefas', color: '#ec4899', icon: CheckSquare },
};

export default function ActivityReportPage() {
  const [periodPreset, setPeriodPreset] = useState('30d');
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('day');
  const [segmentBy, setSegmentBy] = useState<'type' | 'actor' | 'status'>('type');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedActorIds, setSelectedActorIds] = useState<number[]>([]);
  const [includeEmails, setIncludeEmails] = useState(false);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showSegmentDropdown, setShowSegmentDropdown] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ApiActivityReportResponse | null>(null);

  // Calcula intervalo de datas a partir do preset
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
      case 'this_year':
        from = new Date(now.getFullYear(), 0, 1);
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
      const data = await salesApi.getActivityReport({
        from: dateRange.from,
        to: dateRange.to,
        granularity,
        segment_by: segmentBy,
        types: selectedTypes.length ? selectedTypes : undefined,
        actor_ids: selectedActorIds.length ? selectedActorIds : undefined,
        include_emails: includeEmails,
        include_notes: includeNotes,
      });
      setReport(data);
    } catch (err: any) {
      console.error('[ActivityReport] Erro ao carregar atividades:', err);
      setError(err?.message || 'Erro ao carregar métricas de atividades.');
    } finally {
      setLoading(false);
    }
  }, [dateRange, granularity, segmentBy, selectedTypes, selectedActorIds, includeEmails, includeNotes]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // KPIs
  const kpis = report?.kpis;
  const totalActivities = kpis?.total_activities ?? 0;
  const aiSummarized = kpis?.ai_summarized ?? 0;
  const withNote = kpis?.with_notes ?? 0;
  const avgDuration = kpis?.has_real_duration && kpis?.avg_duration_seconds != null
    ? `${Math.round(kpis.avg_duration_seconds / 60)}m`
    : 'N/D';
  const activitiesPerWeek = kpis?.avg_per_week != null ? kpis.avg_per_week.toFixed(1) : '0.0';
  const totalDuration = kpis?.has_real_duration && kpis?.total_duration_hours != null
    ? `${kpis.total_duration_hours}h`
    : 'N/D';

  // Exportação CSV
  const handleExportCSV = () => {
    const params = new URLSearchParams();
    params.set('from', dateRange.from);
    params.set('to', dateRange.to);
    params.set('granularity', granularity);
    params.set('segment_by', segmentBy);
    if (includeEmails) params.set('include_emails', 'true');
    if (includeNotes) params.set('include_notes', 'true');
    selectedTypes.forEach((t) => params.append('types[]', t));
    selectedActorIds.forEach((id) => params.append('actor_ids[]', id.toString()));

    window.open(`/api/v1/sales/reports/activity/export?${params.toString()}`, '_blank');
  };

  // Compartilhamento com filtros
  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams();
      params.set('preset', periodPreset);
      params.set('granularity', granularity);
      params.set('segment_by', segmentBy);
      if (selectedTypes.length) params.set('types', selectedTypes.join(','));
      if (includeEmails) params.set('emails', '1');
      if (includeNotes) params.set('notes', '1');

      const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
      navigator.clipboard?.writeText(url);
      setSaveNotice('Link do relatório copiado com filtros ativos!');
      setTimeout(() => setSaveNotice(null), 3000);
    }
  };

  // Salvar favoritos localmente
  const handleSave = () => {
    if (typeof window !== 'undefined') {
      const config = {
        periodPreset,
        granularity,
        segmentBy,
        selectedTypes,
        includeEmails,
        includeNotes,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem('saved_report_activity', JSON.stringify(config));
      setSaveNotice('Visualização de atividades salva localmente no navegador!');
      setTimeout(() => setSaveNotice(null), 3000);
    }
  };

  // Chaves dinâmicas do gráfico
  const chartKeys = useMemo(() => {
    if (!report?.series || report.series.length === 0) return [];
    const keysSet = new Set<string>();
    report.series.forEach((s) => {
      Object.keys(s).forEach((k) => {
        if (k !== 'date' && k !== 'total') {
          keysSet.add(k);
        }
      });
    });
    return Array.from(keysSet);
  }, [report?.series]);

  const activeFiltersCount = selectedTypes.length + (selectedActorIds.length ? 1 : 0) + (includeEmails ? 1 : 0);

  return (
    <SalesLayoutWrapper>
      <div className="space-y-6">
        {/* 1. Header do Relatório */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                <Calendar className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Activity
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Como a equipe de vendas está performando em reuniões, ligações, vistorias e contatos comerciais?
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2 text-xs font-semibold">
            {saveNotice && (
              <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {saveNotice}
              </span>
            )}

            <button
              onClick={handleExportCSV}
              disabled={loading || totalActivities === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 shadow-xs disabled:opacity-50"
              title="Download CSV com dados reais"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Download CSV
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-2 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              Share
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-2 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 shadow-xs"
            >
              <Bookmark className="w-3.5 h-3.5 text-slate-500" />
              Save
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

        {/* 2. Barra de Filtros Estilo Nutshell */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            {/* Botão de Filtro Multi-select */}
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                  isFilterOpen || activeFiltersCount > 0
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200'
                }`}
              >
                <Filter className="w-3.5 h-3.5 text-sky-600" />
                <span>Filter</span>
                {activeFiltersCount > 0 && (
                  <span className="rounded-full bg-sky-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {isFilterOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 p-4 space-y-4">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Tipos de Atividade
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {Object.entries(ACTIVITY_TYPE_LABELS).map(([k, meta]) => {
                        const checked = selectedTypes.includes(k);
                        return (
                          <label key={k} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedTypes([...selectedTypes, k]);
                                else setSelectedTypes(selectedTypes.filter((t) => t !== k));
                              }}
                              className="rounded-xs border-slate-300 text-sky-600 focus:ring-sky-500"
                            />
                            <span className="truncate">{meta.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Fontes Adicionais
                    </span>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeNotes}
                          onChange={(e) => setIncludeNotes(e.target.checked)}
                          className="rounded-xs border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                        <span>Incluir anotações de clientes</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeEmails}
                          onChange={(e) => setIncludeEmails(e.target.checked)}
                          className="rounded-xs border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                        <span>Incluir e-mails de outreach</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setSelectedTypes([]);
                        setSelectedActorIds([]);
                        setIncludeEmails(false);
                        setIncludeNotes(true);
                      }}
                      className="text-[11px] text-slate-500 hover:text-slate-800"
                    >
                      Limpar filtros
                    </button>
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="px-3 py-1 bg-slate-900 text-white rounded-md text-xs font-semibold"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Segment by Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSegmentDropdown(!showSegmentDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50"
              >
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400">Segment by:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 capitalize">
                  {segmentBy === 'type' ? 'Tipo' : segmentBy === 'actor' ? 'Consultor' : 'Status'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </button>

              {showSegmentDropdown && (
                <div className="absolute left-0 mt-1.5 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-20 py-1 text-xs">
                  {[
                    { id: 'type', label: 'Tipo de Atividade' },
                    { id: 'actor', label: 'Consultor Solar' },
                    { id: 'status', label: 'Status da Atividade' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setSegmentBy(opt.id as any);
                        setShowSegmentDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 ${
                        segmentBy === opt.id ? 'font-bold text-sky-600 bg-sky-50/50 dark:bg-sky-950/40' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Seletor de Período Preset */}
            <select
              value={periodPreset}
              onChange={(e) => setPeriodPreset(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg px-3 py-1.5 shadow-xs cursor-pointer"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
              <option value="this_month">Este Mês</option>
              <option value="this_year">Este Ano</option>
            </select>
          </div>

          {/* Granularity Tabs (Day / Week / Month / Quarter / Year) */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            {(['day', 'week', 'month', 'quarter', 'year'] as const).map((g) => (
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
                {g === 'day' ? 'Day' : g === 'week' ? 'Week' : g === 'month' ? 'Month' : g === 'quarter' ? 'Quarter' : 'Year'}
              </button>
            ))}
          </div>
        </div>

        {/* 3. 6 KPI Cards Reais (Padrão exato do Nutshell) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
              Total activities
            </span>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {totalActivities}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
              AI-summarized
            </span>
            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {aiSummarized}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
              With a note
            </span>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {withNote}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
              Avg duration
            </span>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1" title={kpis?.has_real_duration ? 'Média calculada' : 'Duração não persistida nas atividades atuais'}>
              {avgDuration}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
              Avg per week
            </span>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {activitiesPerWeek}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
              Total duration
            </span>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1" title={kpis?.has_real_duration ? 'Total calculado' : 'Duração não persistida nas atividades atuais'}>
              {totalDuration}
            </p>
          </div>
        </div>

        {/* 4. Gráfico Temporal Stacked (Volume de Atividades) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Volume de Atividades no Período
              </h2>
              <p className="text-xs text-slate-500">
                Evolução diária/periódica segmentada por {segmentBy === 'type' ? 'tipo' : segmentBy === 'actor' ? 'consultor' : 'status'}
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            {loading ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                <RotateCw className="w-5 h-5 animate-spin mr-2 text-sky-600" />
                Carregando séries temporais reais...
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full text-red-500 text-xs">
                <AlertCircle className="w-6 h-6 mb-1" />
                <p>{error}</p>
              </div>
            ) : report?.series && report.series.length > 0 && totalActivities > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  {chartKeys.map((key, idx) => {
                    const color = ACTIVITY_TYPE_LABELS[key]?.color || ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'][idx % 6];
                    const label = ACTIVITY_TYPE_LABELS[key]?.label || key;
                    return (
                      <Bar
                        key={key}
                        dataKey={key}
                        name={label}
                        stackId="a"
                        fill={color}
                        radius={idx === chartKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                      />
                    );
                  })}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
                <Calendar className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nenhuma atividade registrada no período</p>
                <p className="text-[11px] mt-1 text-slate-400">Tente selecionar outro intervalo ou remover os filtros aplicados.</p>
              </div>
            )}
          </div>
        </div>

        {/* 5. Grid com Mix de Tipos & Desempenho por Consultor */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mix por Tipo */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
              Mix de Tipos de Atividades
            </h2>
            <p className="text-xs text-slate-500 mb-4">Distribuição do esforço comercial por canal</p>

            <div className="space-y-3">
              {report?.by_type && report.by_type.length > 0 ? (
                report.by_type.map((t) => (
                  <div key={t.type} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                        {t.name}
                      </span>
                      <span className="text-slate-500 font-semibold">{t.count} ({t.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${t.percentage}%`, backgroundColor: t.color }} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">Nenhum tipo computado no período.</p>
              )}
            </div>
          </div>

          {/* Desempenho por Consultor Solar */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
              Atividades por Consultor Solar
            </h2>
            <p className="text-xs text-slate-500 mb-4">Volume de interações e contatos por vendedor</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Consultor Solar</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-3 text-right">Ligações</th>
                    <th className="py-2.5 px-3 text-right">Reuniões</th>
                    <th className="py-2.5 px-3 text-right">E-mails</th>
                    <th className="py-2.5 px-3 text-right">Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  {report?.by_actor && report.by_actor.length > 0 ? (
                    report.by_actor.map((rep) => (
                      <tr key={rep.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 flex items-center gap-2">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{rep.name}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-sky-600">{rep.total_activities}</td>
                        <td className="py-2.5 px-3 text-right">{rep.calls}</td>
                        <td className="py-2.5 px-3 text-right">{rep.meetings}</td>
                        <td className="py-2.5 px-3 text-right">{rep.emails}</td>
                        <td className="py-2.5 px-3 text-right">{rep.notes}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        Nenhuma atividade registrada por consultor.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 6. Histórico Recente de Atividades (Audit Trail) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
            Registro de Atividades Recentes
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Últimas interações reais registradas no CRM para auditoria
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Data & Hora</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Assunto</th>
                  <th className="py-2.5 px-3">Consultor</th>
                  <th className="py-2.5 px-3">Conta / Lead</th>
                  <th className="py-2.5 px-3">Duração</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                {report?.recent_activities && report.recent_activities.length > 0 ? (
                  report.recent_activities.map((act) => {
                    const typeMeta = ACTIVITY_TYPE_LABELS[act.activity_type] || { label: act.activity_type, color: '#64748b', icon: HelpCircle };
                    const Icon = typeMeta.icon;
                    return (
                      <tr key={act.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                          {new Date(act.occurred_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: `${typeMeta.color}15`, color: typeMeta.color }}>
                            <Icon className="w-3 h-3" />
                            {typeMeta.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 max-w-[200px] truncate" title={act.subject}>
                          {act.subject}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {act.actor?.name || '—'}
                        </td>
                        <td className="py-2.5 px-3 max-w-[180px] truncate">
                          {act.account?.name || act.opportunity?.name || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {act.duration_seconds != null ? `${Math.round(act.duration_seconds / 60)}m` : 'N/D'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-xs text-[10px] font-bold bg-slate-100 text-slate-700 capitalize">
                            {act.log_status || 'completed'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Nenhuma atividade recente encontrada com os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SalesLayoutWrapper>
  );
}
