'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  X,
  LayoutGrid,
  Table as TableIcon,
  MapPin,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { salesApi } from '@/lib/api/sales/client';
import type {
  ApiFilterOptions,
  NutshellFilterCriteria,
} from '@/lib/api/sales/types';
import { NutshellFilterDropdownMenu } from './NutshellFilterDropdownMenu';

interface NutshellFilterBarProps {
  filters: NutshellFilterCriteria;
  onChange: (filters: NutshellFilterCriteria) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalCount?: number;
  view: 'list' | 'kanban' | 'map' | 'analytics';
  onViewChange: (view: 'list' | 'kanban' | 'map' | 'analytics') => void;
  activePipelineName?: string;
  dateFilterLabel?: string;
  onClearAll: () => void;
}

export function NutshellFilterBar({
  filters,
  onChange,
  searchQuery,
  onSearchChange,
  totalCount,
  view,
  onViewChange,
  activePipelineName = 'Default Pipeline',
  dateFilterLabel = 'Current month',
  onClearAll,
}: NutshellFilterBarProps) {
  const [options, setOptions] = useState<ApiFilterOptions | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  useEffect(() => {
    let mounted = true;
    setIsLoadingOptions(true);
    salesApi
      .getFilterOptions()
      .then((res) => {
        if (mounted && res?.options) setOptions(res.options);
      })
      .catch((err) => console.error('Erro ao buscar opções de filtro:', err))
      .finally(() => {
        if (mounted) setIsLoadingOptions(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Remover um filtro específico por chave
  const handleRemoveChip = (key: keyof NutshellFilterCriteria) => {
    const copy = { ...filters };
    delete copy[key];
    onChange(copy);
  };

  // Extrair chips ativos formatados
  const activeChips = Object.entries(filters).filter(([, val]) => {
    if (!val) return false;
    if ('selectedIds' in val) return (val.selectedIds || []).length > 0;
    if ('min' in val || 'max' in val || 'from' in val || 'to' in val || 'days' in val) return true;
    return false;
  });

  const hasAnyFilter = activeChips.length > 0 || Boolean(searchQuery.trim());

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden font-sans">
      {/* Linha 1: Barra Principal de Ferramentas (IBM Style) */}
      <div className="px-3 py-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800">
        {/* Esquerda: Botão [+ Add filter] + Busca + Contagem + Link Remover Filtros */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0 flex-wrap sm:flex-nowrap">
          {/* Botão + Add filter */}
          <NutshellFilterDropdownMenu
            filters={filters}
            onChange={onChange}
            options={options}
            isLoadingOptions={isLoadingOptions}
          >
            <Button
              size="sm"
              className="h-8 gap-1.5 px-3 bg-[#0F62FE] hover:bg-[#0043CE] text-white text-xs font-semibold rounded-md shadow-2xs shrink-0 transition-colors"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Add filter</span>
            </Button>
          </NutshellFilterDropdownMenu>

          {/* Input de busca */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-8 pl-8 pr-2.5 text-xs bg-slate-50/80 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-md focus:bg-white focus:border-[#0F62FE]"
            />
          </div>

          {/* Contagem e Link Remove filters */}
          <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
            <span className="font-medium">
              {totalCount !== undefined ? `${totalCount} leads found` : 'Carregando leads...'}
            </span>
            {hasAnyFilter && (
              <>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={onClearAll}
                  className="text-[#0F62FE] hover:text-[#0043CE] hover:underline font-semibold cursor-pointer transition-colors"
                >
                  Remove filters
                </button>
              </>
            )}
          </div>
        </div>

        {/* Direita: 4 Modos de Visualização (Cards, Tabela, Mapa, Estatísticas) */}
        <div className="flex items-center gap-0.5 rounded-md border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800/80 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => onViewChange('kanban')}
            className={`p-1.5 rounded transition-colors ${
              view === 'kanban'
                ? 'bg-white dark:bg-slate-700 text-[#0F62FE] shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
            title="Visualização em Cards / Kanban"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewChange('list')}
            className={`p-1.5 rounded transition-colors ${
              view === 'list'
                ? 'bg-white dark:bg-slate-700 text-[#0F62FE] shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
            title="Visualização em Tabela"
          >
            <TableIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewChange('map')}
            className={`p-1.5 rounded transition-colors ${
              view === 'map'
                ? 'bg-white dark:bg-slate-700 text-[#0F62FE] shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
            title="Visualização no Mapa"
          >
            <MapPin className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewChange('analytics')}
            className={`p-1.5 rounded transition-colors ${
              view === 'analytics'
                ? 'bg-white dark:bg-slate-700 text-[#0F62FE] shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
            title="Visualização Estatística / Analytics"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Linha 2: Barra Horizontal de Chips Ativos + Botão [+] Tracejado */}
      <div className="px-3 py-2 bg-[#F4F7FB]/70 dark:bg-slate-950/40 flex items-center gap-2 flex-wrap min-h-[44px]">
        {/* Chip 1: Período do Funil */}
        <div className="h-7 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs flex items-center gap-1.5 shadow-3xs">
          <span className="text-slate-400 font-normal">Funnel report dates:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{dateFilterLabel}</span>
        </div>

        {/* Chip 2: Pipeline */}
        <div className="h-7 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs flex items-center gap-1.5 shadow-3xs">
          <span className="text-slate-400 font-normal">Pipeline:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{activePipelineName}</span>
        </div>

        {/* Chips Dinâmicos dos Filtros Ativos */}
        {activeChips.map(([key, val]) => {
          let label = key;
          let displayVal = '';

          if ('selectedIds' in val) {
            label = key.charAt(0).toUpperCase() + key.slice(1);
            displayVal = val.selectedIds.join(', ');
          } else if ('min' in val || 'max' in val) {
            label = key.charAt(0).toUpperCase() + key.slice(1);
            displayVal = `${val.min ?? 0} - ${val.max ?? '∞'}`;
          } else if ('from' in val || 'to' in val) {
            label = key.charAt(0).toUpperCase() + key.slice(1);
            displayVal = `${val.from || ''} até ${val.to || ''}`;
          } else if ('days' in val) {
            label = key.charAt(0).toUpperCase() + key.slice(1);
            displayVal = `Últimos ${val.days} dias`;
          }

          return (
            <div
              key={key}
              className="h-7 pl-2.5 pr-1.5 rounded-md border border-blue-200 dark:border-blue-900 bg-blue-50/80 dark:bg-blue-950/40 text-xs flex items-center gap-1.5 shadow-3xs transition-all animate-in fade-in"
            >
              <span className="text-blue-700 dark:text-blue-300 font-medium">{label}:</span>
              <span className="font-bold text-blue-950 dark:text-blue-100 max-w-[150px] truncate">
                {displayVal}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveChip(key as keyof NutshellFilterCriteria)}
                className="p-0.5 rounded text-blue-400 hover:text-blue-700 dark:hover:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                title={`Remover filtro ${label}`}
              >
                <X className="w-3 h-3 stroke-[2.5]" />
              </button>
            </div>
          );
        })}

        {/* O BOTÃO [+] TRACEJADO OFICIAL DO BENCHMARK NUTSHELL */}
        <NutshellFilterDropdownMenu
          filters={filters}
          onChange={onChange}
          options={options}
          isLoadingOptions={isLoadingOptions}
        >
          <button
            type="button"
            className="h-7 w-7 rounded-md border border-dashed border-[#0F62FE] bg-white hover:bg-blue-50/80 dark:bg-slate-800 dark:hover:bg-blue-950/40 text-[#0F62FE] flex items-center justify-center transition-all cursor-pointer shadow-3xs"
            title="Adicionar filtro"
            aria-label="Adicionar filtro"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
        </NutshellFilterDropdownMenu>
      </div>
    </div>
  );
}

export default NutshellFilterBar;
