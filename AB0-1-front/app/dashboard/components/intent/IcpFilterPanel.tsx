'use client';

import React, { useState } from 'react';
import {
  Filter,
  Calendar,
  Layers,
  Activity,
  Bookmark,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  type IcpFilterCriteria,
  type BuyingStage,
  type ActivityLevel,
  type SavedIcpFilter,
} from '@/lib/api/buyer-intent';

interface IcpFilterPanelProps {
  filters: IcpFilterCriteria;
  onFilterChange: (filters: IcpFilterCriteria) => void;
  onResetFilters: () => void;
}

const DEFAULT_SAVED_FILTERS: SavedIcpFilter[] = [
  {
    id: 'f-high-intent',
    name: '🎯 Contas Prontas para Fechamento (Decision + High)',
    criteria: { date_range: '30d', buying_stage: 'decision', activity_level: 'high' },
  },
  {
    id: 'f-active-consideration',
    name: '🔥 Em Comparação Ativa (Consideration)',
    criteria: { date_range: '30d', buying_stage: 'consideration' },
  },
  {
    id: 'f-all-signals',
    name: '🌐 Todos os Sinais Recentes (7 dias)',
    criteria: { date_range: '7d', buying_stage: 'all', activity_level: 'all' },
  },
];

export function IcpFilterPanel({
  filters,
  onFilterChange,
  onResetFilters,
}: IcpFilterPanelProps) {
  const [savedFilters, setSavedFilters] = useState<SavedIcpFilter[]>(DEFAULT_SAVED_FILTERS);
  const [selectedSavedFilterId, setSelectedSavedFilterId] = useState<string>('');
  const [isSavingCustom, setIsSavingCustom] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');

  const handleDateChange = (val: IcpFilterCriteria['date_range']) => {
    onFilterChange({ ...filters, date_range: val });
  };

  const handleStageChange = (val: BuyingStage | 'all') => {
    onFilterChange({ ...filters, buying_stage: val });
  };

  const handleActivityChange = (val: ActivityLevel | 'all') => {
    onFilterChange({ ...filters, activity_level: val });
  };

  const applySavedFilter = (saved: SavedIcpFilter) => {
    setSelectedSavedFilterId(saved.id);
    onFilterChange(saved.criteria);
  };

  const saveCurrentAsNewFilter = () => {
    if (!newFilterName.trim()) return;
    const newFilter: SavedIcpFilter = {
      id: `custom-${Date.now()}`,
      name: newFilterName.trim(),
      criteria: { ...filters },
    };
    setSavedFilters([newFilter, ...savedFilters]);
    setSelectedSavedFilterId(newFilter.id);
    setNewFilterName('');
    setIsSavingCustom(false);
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Título e Filtros Rápidos Salvos */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Filter className="h-4 w-4 text-amber-500" />
            <span>Perfil de Cliente Ideal (ICP):</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {savedFilters.map((sf) => (
              <button
                key={sf.id}
                onClick={() => applySavedFilter(sf)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  selectedSavedFilterId === sf.id
                    ? 'bg-amber-500 text-white shadow-sm dark:bg-amber-600'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                <Bookmark className="h-3 w-3" />
                <span>{sf.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Botão de Reset */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedSavedFilterId('');
              onResetFilters();
            }}
            className="h-8 gap-1 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Limpar Filtros
          </Button>
        </div>
      </div>

      <hr className="my-4 border-slate-100 dark:border-slate-800" />

      {/* Grid de Controles Interativos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* 1. Date Range */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <Calendar className="h-3.5 w-3.5 text-amber-500" />
            Janela de Tempo (Data)
          </label>
          <div className="grid grid-cols-4 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800/80">
            {[
              { id: '7d', label: '7 Dias' },
              { id: '30d', label: '30 Dias' },
              { id: '90d', label: '90 Dias' },
              { id: 'all', label: 'Tudo' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleDateChange(opt.id as any)}
                className={`rounded-md py-1 text-xs font-medium transition-colors ${
                  filters.date_range === opt.id
                    ? 'bg-white text-slate-900 shadow-xs font-bold dark:bg-slate-900 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Buying Stage (G2) */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <Layers className="h-3.5 w-3.5 text-blue-500" />
            Estágio de Compra (Buying Stage)
          </label>
          <div className="grid grid-cols-4 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800/80">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'awareness', label: 'Descoberta' },
              { id: 'consideration', label: 'Avaliação' },
              { id: 'decision', label: 'Decisão' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleStageChange(opt.id as any)}
                className={`rounded-md py-1 text-xs font-medium transition-colors ${
                  (filters.buying_stage || 'all') === opt.id
                    ? 'bg-white text-slate-900 shadow-xs font-bold dark:bg-slate-900 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Activity Level (G2) */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <Activity className="h-3.5 w-3.5 text-emerald-500" />
            Nível de Atividade (Activity Level)
          </label>
          <div className="grid grid-cols-4 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800/80">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'low', label: 'Baixa' },
              { id: 'medium', label: 'Média' },
              { id: 'high', label: 'Alta' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleActivityChange(opt.id as any)}
                className={`rounded-md py-1 text-xs font-medium transition-colors ${
                  (filters.activity_level || 'all') === opt.id
                    ? 'bg-white text-slate-900 shadow-xs font-bold dark:bg-slate-900 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
