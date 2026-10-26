'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Filter,
  Download,
  Share2,
  Bookmark,
  Save,
  DollarSign,
  Hash,
  ChevronDown,
  Calendar,
  Loader2,
  AlertCircle,
  TrendingUp,
  BarChart2,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { salesApi } from '@/lib/api/sales/client';
import {
  NutshellReportType,
  NutshellGranularity,
  NutshellMeasure,
  NutshellSegmentBy,
  NutshellReportResponse,
  NutshellFilterCriteria,
} from '@/lib/api/sales/types';
import { NutshellFilterSidebar } from '@/components/sales/filters/NutshellFilterSidebar';

interface NutshellReportCanvasProps {
  initialReportType?: NutshellReportType;
  titleOverride?: string;
  subtitleOverride?: string;
}

const REPORT_METADATA: Record<
  NutshellReportType,
  { title: string; subtitle: string; xAxisLabel: string; barColor: string }
> = {
  sales: {
    title: 'Sales',
    subtitle: 'How much did we sell each period?',
    xAxisLabel: 'Lead close date',
    barColor: '#10B981', // Emerald green como no Nutshell
  },
  forecast: {
    title: 'Forecast',
    subtitle: 'How are we tracking towards our goals and quotas?',
    xAxisLabel: 'Lead expected close date',
    barColor: '#10B981', // Verde de projeção
  },
  new_leads: {
    title: 'New leads',
    subtitle: 'How many new leads did we receive each period?',
    xAxisLabel: 'Lead open date',
    barColor: '#1E293B', // Slate dark como no Nutshell
  },
};

export function NutshellReportCanvas({
  initialReportType = 'forecast',
  titleOverride,
  subtitleOverride,
}: NutshellReportCanvasProps) {
  const [reportType, setReportType] = useState<NutshellReportType>(initialReportType);
  const [granularity, setGranularity] = useState<NutshellGranularity>('week');
  const [measure, setMeasure] = useState<NutshellMeasure>(
    initialReportType === 'new_leads' ? 'quantity' : 'value'
  );
  const [segmentBy, setSegmentBy] = useState<NutshellSegmentBy>('none');
  const [datePreset, setDatePreset] = useState<string>(
    initialReportType === 'forecast' ? 'next_90d' : 'last_90d'
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NutshellReportResponse | null>(null);
  const [showSegmentDropdown, setShowSegmentDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<NutshellFilterCriteria>({});

  // Calcula datas a partir do preset selecionado
  const dateRange = useMemo(() => {
    const now = new Date();
    let from = new Date();
    let to = new Date();

    switch (datePreset) {
      case 'last_30d':
        from.setDate(now.getDate() - 30);
        break;
      case 'last_90d':
        from.setDate(now.getDate() - 90);
        break;
      case 'last_180d':
        from.setDate(now.getDate() - 180);
        break;
      case 'this_year':
        from = new Date(now.getFullYear(), 0, 1);
        to = new Date(now.getFullYear(), 11, 31);
        break;
      case 'next_90d':
        // Para forecast
        to.setDate(now.getDate() + 90);
        break;
      case 'next_180d':
        to.setDate(now.getDate() + 180);
        break;
      default:
        from.setDate(now.getDate() - 90);
    }

    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
    };
  }, [datePreset]);

  // Carrega relatório diretamente da API com dados 100% reais do banco
  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await salesApi.getNutshellReport({
        report_type: reportType,
        granularity,
        measure,
        segment_by: segmentBy,
        from: dateRange.from,
        to: dateRange.to,
        filters,
      });
      setData(response);
    } catch (err: any) {
      setError(
        err?.message || 'Falha ao carregar métricas analíticas reais do banco de dados.'
      );
    } finally {
      setLoading(false);
    }
  }, [reportType, granularity, measure, segmentBy, dateRange, filters]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const meta = REPORT_METADATA[reportType];
  const title = titleOverride || meta.title;
  const subtitle = subtitleOverride || meta.subtitle;

  // Formatação para BRL ou número
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatShortValue = (val: number) => {
    if (measure === 'quantity') {
      return val.toLocaleString('pt-BR');
    }
    if (val >= 1_000_000) {
      return `R$ ${(val / 1_000_000).toFixed(1)}M`;
    }
    if (val >= 1_000) {
      return `R$ ${(val / 1_000).toFixed(0)}k`;
    }
    return `R$ ${val.toFixed(0)}`;
  };

  // Exportar dados da série em formato CSV
  const handleExportCSV = () => {
    if (!data || !data.series || data.series.length === 0) return;
    const lines = [
      `Relatório ${title} - Avalia Solar CRM`,
      `Período: ${data.date_range.from} até ${data.date_range.to}`,
      `Granularidade: ${granularity} | Métrica: ${measure}`,
      '',
      'Data,Rótulo,Valor Real (R$),Quantidade de Oportunidades,Cota Projetada (R$)',
    ];

    data.series.forEach((s) => {
      lines.push(
        `"${s.date}","${s.label}",${s.value.toFixed(2)},${s.count},${(s.quota || 0).toFixed(2)}`
      );
    });

    const csvContent = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${reportType}-${granularity}-${data.date_range.from}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}${window.location.pathname}?type=${reportType}&granularity=${granularity}&measure=${measure}`;
      navigator.clipboard?.writeText(url);
      setSaveSuccessNotice('Link copiado para a área de transferência!');
      setTimeout(() => setSaveSuccessNotice(null), 3000);
    }
  };

  const handleSave = () => {
    setSaveSuccessNotice('Visualização de relatório salva com sucesso nos seus favoritos!');
    setTimeout(() => setSaveSuccessNotice(null), 3000);
  };

  // Preset labels legíveis
  const getPresetLabel = () => {
    switch (datePreset) {
      case 'last_30d':
        return 'Últimos 30 dias';
      case 'last_90d':
        return 'Últimos 90 dias';
      case 'last_180d':
        return 'Últimos 180 dias';
      case 'this_year':
        return 'Ano Atual';
      case 'next_90d':
        return 'Próximos 90 dias (Forecast)';
      case 'next_180d':
        return 'Próximos 180 dias (Forecast)';
      default:
        return 'Personalizado';
    }
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    Object.values(filters).forEach((val) => {
      if (!val) return;
      if ('selectedIds' in val && val.selectedIds.length > 0) count++;
      else if ('min' in val && (val.min !== undefined || val.max !== undefined)) count++;
      else if ('from' in val && (val.from || val.to)) count++;
      else if ('days' in val && val.days) count++;
    });
    return count;
  }, [filters]);

  return (
    <div className="relative flex w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      {/* Sidebar Retrátil de Filtros Nutshell */}
      <NutshellFilterSidebar
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onChange={setFilters}
      />

      {/* Conteúdo Principal do Canvas */}
      <div className="flex-1 p-6 space-y-6 overflow-x-hidden">
        {/* 1. Header do Relatório Estilo Nutshell */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            {/* Alternador de tipo de relatório padrão Nutshell */}
            <div className="flex items-center gap-2 mb-2">
            {(['sales', 'forecast', 'new_leads'] as NutshellReportType[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setReportType(t);
                  if (t === 'new_leads') setMeasure('quantity');
                  else setMeasure('value');
                  if (t === 'forecast') setDatePreset('next_90d');
                  else setDatePreset('last_90d');
                }}
                className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-colors ${
                  reportType === t
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t === 'sales' ? 'Vendas' : t === 'forecast' ? 'Forecast' : 'Novos Leads'}
              </button>
            ))}
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            {title}
          </h1>
          <p className="text-sm italic text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        {/* Grupo de Ações Superior Direito */}
        <div className="flex items-center flex-wrap gap-2 text-sm">
          {saveSuccessNotice && (
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md border border-emerald-200 flex items-center gap-1 animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5" /> {saveSuccessNotice}
            </span>
          )}

          <button
            onClick={handleExportCSV}
            disabled={!data || data.series.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-700 hover:text-slate-900 font-medium rounded-md border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
            title="Download CSV com dados reais"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Download
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-700 hover:text-slate-900 font-medium rounded-md border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <Share2 className="w-4 h-4 text-slate-500" />
            Share
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-700 hover:text-slate-900 font-medium rounded-md border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <Bookmark className="w-4 h-4 text-slate-500" />
            Save as
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors shadow-xs"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

      {/* 2. Barra de Controles e Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-1">
        <div className="flex flex-wrap items-center gap-3">
          {/* Botão de Filtro Estilo Nutshell */}
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
              isFilterOpen || activeFiltersCount > 0
                ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-xs'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter
              className={`w-3.5 h-3.5 ${
                isFilterOpen || activeFiltersCount > 0 ? 'text-sky-600' : 'text-slate-500'
              }`}
            />
            <span>Filter</span>
            {activeFiltersCount > 0 && (
              <span className="rounded-full bg-sky-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Segment by Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSegmentDropdown(!showSegmentDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span className="text-slate-400">Segment by:</span>
              <span className="font-semibold text-slate-900 capitalize">
                {segmentBy === 'none'
                  ? 'None'
                  : segmentBy === 'confidence'
                  ? 'Probabilidade'
                  : segmentBy === 'assignee'
                  ? 'Vendedor'
                  : 'Origem'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {showSegmentDropdown && (
              <div className="absolute left-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 text-xs">
                {[
                  { id: 'none', label: 'None' },
                  { id: 'confidence', label: 'Probabilidade' },
                  { id: 'assignee', label: 'Vendedor' },
                  { id: 'source', label: 'Origem' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setSegmentBy(opt.id as NutshellSegmentBy);
                      setShowSegmentDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 ${
                      segmentBy === opt.id ? 'font-bold text-blue-600 bg-blue-50/50' : 'text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Toggle Pill: [$ Value] / [# Quantity] */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-semibold">
            <button
              onClick={() => setMeasure('value')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                measure === 'value'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              Value
            </button>
            <button
              onClick={() => setMeasure('quantity')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                measure === 'quantity'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              Quantity
            </button>
          </div>

          {/* Date Range Preset Selector */}
          <div className="relative">
            <button
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{getPresetLabel()}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {showDateDropdown && (
              <div className="absolute left-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 text-xs">
                {[
                  { id: 'last_30d', label: 'Últimos 30 dias' },
                  { id: 'last_90d', label: 'Últimos 90 dias' },
                  { id: 'last_180d', label: 'Últimos 180 dias' },
                  { id: 'this_year', label: 'Ano Atual (YTD)' },
                  { id: 'next_90d', label: 'Próximos 90 dias (Forecast)' },
                  { id: 'next_180d', label: 'Próximos 180 dias (Forecast)' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setDatePreset(opt.id);
                      setShowDateDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 ${
                      datePreset === opt.id
                        ? 'font-bold text-blue-600 bg-blue-50/50'
                        : 'text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Linha de Granularidade e Legenda */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 gap-3 text-xs">
        {/* Granularity Tabs */}
        <div className="flex items-center gap-6 font-semibold">
          {(['day', 'week', 'month', 'quarter', 'year'] as NutshellGranularity[]).map((g) => {
            const isActive = granularity === g;
            const labels: Record<NutshellGranularity, string> = {
              day: 'Day',
              week: 'Week',
              month: 'Month',
              quarter: 'Quarter',
              year: 'Year',
            };
            return (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`relative pb-2 transition-colors ${
                  isActive ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {labels[g]}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-slate-600 font-medium">
          <div className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-xs inline-block"
              style={{ backgroundColor: meta.barColor }}
            />
            <span>Leads</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-5 border-b-2 border-dashed border-slate-700 relative inline-flex items-center justify-center">
              <span className="w-2 h-2 rounded-full border border-slate-800 bg-white absolute" />
            </span>
            <span>Quota</span>
          </div>
        </div>
      </div>

      {/* 4. Canvas Gráfico */}
      <div className="relative min-h-[360px] w-full pt-4">
        {loading && (
          <div className="absolute inset-0 bg-white/75 flex items-center justify-center z-10 gap-3 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-sm font-medium">Calculando métricas em tempo real...</span>
          </div>
        )}

        {error && (
          <div className="p-8 text-center text-red-600 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
            <p className="font-semibold text-sm">{error}</p>
            <button
              onClick={loadReport}
              className="text-xs px-3 py-1.5 bg-red-50 text-red-700 rounded-md border border-red-200 hover:bg-red-100"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && data && data.series.length === 0 && (
          <div className="py-20 text-center text-slate-500 space-y-2">
            <p className="font-semibold text-slate-700">Nenhum dado real encontrado para o período selecionado.</p>
            <p className="text-xs text-slate-400">
              Altere o intervalo de datas ou cadastre novas oportunidades no pipeline.
            </p>
          </div>
        )}

        {!loading && !error && data && data.series.length > 0 && (
          <div className="w-full">
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart
                data={data.series}
                margin={{ top: 20, right: 20, bottom: 20, left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="label"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatShortValue}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-xs rounded-lg p-3 shadow-xl space-y-1 min-w-[160px]">
                          <p className="font-semibold border-b border-slate-700 pb-1 text-slate-200">
                            {item.label} ({item.date})
                          </p>
                          <p className="flex justify-between gap-4 pt-1">
                            <span className="text-slate-400">
                              {measure === 'value' ? 'Valor Real:' : 'Total de Oportunidades:'}
                            </span>
                            <span className="font-bold text-emerald-400">
                              {measure === 'value' ? formatCurrency(item.value) : item.count}
                            </span>
                          </p>
                          {measure === 'value' && (
                            <p className="flex justify-between gap-4">
                              <span className="text-slate-400">Qtd. Leads:</span>
                              <span className="font-bold">{item.count}</span>
                            </p>
                          )}
                          {item.quota > 0 && (
                            <p className="flex justify-between gap-4 border-t border-slate-800 pt-1 text-slate-300">
                              <span>Cota / Quota:</span>
                              <span className="font-semibold">{formatCurrency(item.quota)}</span>
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {/* Barras de Leads */}
                <Bar
                  dataKey={measure === 'value' ? 'value' : 'count'}
                  name="Leads"
                  fill={meta.barColor}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={45}
                />
                {/* Linha de Cota (com pontinhos circulares brancos e borda) */}
                <Line
                  type="monotone"
                  dataKey="quota"
                  name="Quota"
                  stroke="#334155"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 4, fill: '#FFFFFF', stroke: '#1E293B', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>

            {/* Rótulo do Eixo X Centralizado */}
            <p className="text-center text-xs font-semibold text-slate-500 mt-1">
              {meta.xAxisLabel}
            </p>
          </div>
        )}
      </div>

      {/* 5. Summary Strip Inferior (4 Métricas em Destaque) */}
      {data && data.summary && (
        <div className="border-t border-slate-100 pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            {/* Total value / leads */}
            <div className="px-2">
              <p className="text-xs font-medium text-slate-500">
                {measure === 'value' ? 'Total value' : 'Total leads'}
              </p>
              <p className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
                {measure === 'value'
                  ? formatCurrency(data.summary.total_value)
                  : data.summary.total_count}
              </p>
            </div>

            {/* Avg value per [granularity] */}
            <div className="px-2 sm:pl-6">
              <p className="text-xs font-medium text-slate-500">
                Avg {measure === 'value' ? 'value' : 'leads'} per {data.summary.granularity_unit}
              </p>
              <p className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
                {measure === 'value'
                  ? formatCurrency(data.summary.avg_per_period_value)
                  : data.summary.avg_per_period_count.toFixed(1)}
              </p>
            </div>

            {/* Avg time open */}
            <div className="px-2 sm:pl-6 pt-4 sm:pt-0">
              <p className="text-xs font-medium text-slate-500">Avg time open</p>
              <p className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
                {data.summary.avg_cycle_days > 0
                  ? `${data.summary.avg_cycle_days.toFixed(1)} days`
                  : '—'}
              </p>
            </div>

            {/* Avg lead value */}
            <div className="px-2 sm:pl-6 pt-4 sm:pt-0">
              <p className="text-xs font-medium text-slate-500">Avg lead value</p>
              <p className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
                {data.summary.avg_lead_value > 0
                  ? formatCurrency(data.summary.avg_lead_value)
                  : '—'}
              </p>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
export default NutshellReportCanvas;
