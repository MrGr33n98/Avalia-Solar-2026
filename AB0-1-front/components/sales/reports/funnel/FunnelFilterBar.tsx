'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  Search,
  User,
  Package,
  Share2,
  Tag,
  Swords,
  PhoneCall,
  Users,
  Calendar,
  Globe,
  Info,
  DollarSign,
  Hash,
  Download,
  RotateCw,
  Check,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface FunnelFilterState {
  pipelineId?: number;
  period: string;
  measure: 'value' | 'quantity';
  assigneeIds: number[];
  sources: string[];
  hasProduct?: boolean;
}

interface FunnelFilterBarProps {
  filters: FunnelFilterState;
  onFilterChange: (newFilters: Partial<FunnelFilterState>) => void;
  pipelines?: Array<{ id: number; name: string }>;
  totalLeads: number;
  totalValueCents: number;
  onRefresh: () => void;
  onExport: () => void;
  loading?: boolean;
}

const SOURCES_LIST = [
  { id: 'cold_call', label: 'Cold Call', icon: PhoneCall },
  { id: 'conference', label: 'Conference / Evento', icon: Users },
  { id: 'meeting', label: 'Reunião Presencial', icon: Calendar },
  { id: 'referral', label: 'Indicação (Referral)', icon: Share2 },
  { id: 'web_signup', label: 'Cadastro Web (Inbound)', icon: Globe },
];

export default function FunnelFilterBar({
  filters,
  onFilterChange,
  pipelines = [],
  totalLeads,
  totalValueCents,
  onRefresh,
  onExport,
  loading = false,
}: FunnelFilterBarProps) {
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [sourceSearch, setSourceSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [competitorSearch, setCompetitorSearch] = useState('');

  const formattedTotal = (totalValueCents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  });

  return (
    <div className="space-y-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xs p-3.5 shadow-2xs font-sans">
      {/* ─────────────────────────────────────────────────────────────
          LINHA 1: Pipeline Selector, Toggle Métrico & Ações Globais
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
        {/* Left: Pipeline Selector + Info Tooltip */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={filters.pipelineId || ''}
              onChange={(e) => onFilterChange({ pipelineId: Number(e.target.value) || undefined })}
              className="appearance-none bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xs pl-3 pr-8 py-1.5 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {pipelines.length === 0 ? (
                <option value="">Default Pipeline</option>
              ) : (
                pipelines.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          <div
            className="text-slate-400 hover:text-slate-600 transition-colors cursor-help"
            title="Funil de conversão de oportunidades e taxa de passagem entre etapas"
          >
            <Info className="w-3.5 h-3.5" />
          </div>

          {/* Toggle de Medição: Value vs Quantity (Nutshell pill) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xs border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => onFilterChange({ measure: 'value' })}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-xs text-[11px] font-semibold transition-all cursor-pointer',
                filters.measure === 'value'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <DollarSign className="w-3 h-3 text-emerald-600" />
              <span>R$ Valor</span>
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ measure: 'quantity' })}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-xs text-[11px] font-semibold transition-all cursor-pointer',
                filters.measure === 'quantity'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <Hash className="w-3 h-3 text-blue-600" />
              <span>Quantidade</span>
            </button>
          </div>
        </div>

        {/* Right: Quick actions & Refresh */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            title="Atualizar dados do funil"
          >
            <RotateCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          </button>
          <button
            type="button"
            onClick={onExport}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xs text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          LINHA 2: Barra de Popovers de Filtro Dinâmico
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* 1. Assignee Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 px-2.5 py-1 rounded-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:border-slate-300 transition-colors"
              >
                <User className="w-3 h-3 text-slate-400" />
                <span>Assignee</span>
                <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xs shadow-md">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Responsável / Assignee
              </div>
              <div className="relative mb-2">
                <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={assigneeSearch}
                  onChange={(e) => setAssigneeSearch(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-xs bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto pt-1">
                <div className="flex items-center gap-2 p-1.5 rounded-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                    FH
                  </div>
                  <span className="truncate">Felipe Henrique Morais Almeida</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* 2. Products Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 px-2.5 py-1 rounded-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:border-slate-300 transition-colors"
              >
                <Package className="w-3 h-3 text-slate-400" />
                <span>Products</span>
                <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xs shadow-md">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Produtos
              </div>
              <div className="relative mb-2">
                <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-xs bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={filters.hasProduct || false}
                  onChange={(e) => onFilterChange({ hasProduct: e.target.checked })}
                  className="rounded-xs border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Has any product</span>
              </label>
            </PopoverContent>
          </Popover>

          {/* 3. Sources Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-xs border text-xs font-medium transition-colors',
                  filters.sources.length > 0
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                )}
              >
                <Share2 className="w-3 h-3 text-slate-400" />
                <span>Sources {filters.sources.length > 0 && `(${filters.sources.length})`}</span>
                <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xs shadow-md">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Canais de Origem (Sources)
              </div>
              <div className="relative mb-2">
                <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                <input
                  type="text"
                  placeholder="Search sources..."
                  value={sourceSearch}
                  onChange={(e) => setSourceSearch(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-xs bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {SOURCES_LIST.filter((s) => s.label.toLowerCase().includes(sourceSearch.toLowerCase())).map((src) => {
                  const Icon = src.icon;
                  const isChecked = filters.sources.includes(src.id);
                  return (
                    <div
                      key={src.id}
                      onClick={() => {
                        const next = isChecked
                          ? filters.sources.filter((s) => s !== src.id)
                          : [...filters.sources, src.id];
                        onFilterChange({ sources: next });
                      }}
                      className="flex items-center justify-between p-1.5 rounded-xs hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-slate-400" />
                        <span>{src.label}</span>
                      </div>
                      {isChecked && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          {/* 4. Competitors Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 px-2.5 py-1 rounded-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:border-slate-300 transition-colors"
              >
                <Swords className="w-3 h-3 text-slate-400" />
                <span>Competitors</span>
                <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xs shadow-md">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Concorrentes
              </div>
              <div className="relative mb-3">
                <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={competitorSearch}
                  onChange={(e) => setCompetitorSearch(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-xs bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="text-center py-4 text-xs text-slate-400 font-mono">
                Nothing here
              </div>
            </PopoverContent>
          </Popover>

          {/* 5. Date Range Selector */}
          <div className="relative">
            <select
              value={filters.period}
              onChange={(e) => onFilterChange({ period: e.target.value })}
              className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-xs pl-2.5 pr-7 py-1 hover:border-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="this_month">Date range: Current month</option>
              <option value="30d">Date range: Last 30 days</option>
              <option value="90d">Date range: Last 90 days</option>
              <option value="this_year">Date range: This year</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
          </div>
        </div>

        {/* Right side KPI summary in Nutshell style: "4 leads valued at US$80.4k" */}
        <div className="text-xs text-slate-600 dark:text-slate-300 font-mono">
          <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {totalLeads} {totalLeads === 1 ? 'lead' : 'leads'}
          </span>{' '}
          valued at{' '}
          <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {formattedTotal}
          </span>
        </div>
      </div>
    </div>
  );
}
