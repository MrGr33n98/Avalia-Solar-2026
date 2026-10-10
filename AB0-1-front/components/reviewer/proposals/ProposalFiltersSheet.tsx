'use client';

import React, { useEffect } from 'react';
import { X, SlidersHorizontal, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ProposalFilter } from './ProposalStatusSummary';

export type SortOption = 'recent' | 'oldest' | 'highest' | 'lowest';

export interface ProposalFiltersSheetProps {
  open: boolean;
  onClose: () => void;
  currentFilter: ProposalFilter;
  onFilterChange: (filter: ProposalFilter) => void;
  regionFilter: string;
  onRegionFilterChange: (region: string) => void;
  companyFilter: string;
  onCompanyFilterChange: (company: string) => void;
  sortBy: SortOption;
  onSortByChange: (sort: SortOption) => void;
  companiesList: string[];
  regionsList?: { id: string; label: string }[];
  onReset: () => void;
  hasActiveFilters: boolean;
}

const defaultRegions = [
  { id: 'all', label: 'Todas as regiões' },
  { id: 'sp', label: 'São Paulo, SP' },
  { id: 'sc', label: 'Santa Catarina, SC' },
  { id: 'mg', label: 'Minas Gerais, MG' },
  { id: 'rj', label: 'Rio de Janeiro, RJ' },
  { id: 'pr', label: 'Paraná, PR' },
  { id: 'rs', label: 'Rio Grande do Sul, RS' },
  { id: 'ba', label: 'Bahia, BA' },
  { id: 'go', label: 'Goiás, GO' },
];

const statusOptions: { id: ProposalFilter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'active', label: 'Em andamento' },
  { id: 'received', label: 'Recebidas' },
  { id: 'awaiting', label: 'Aguardando retorno' },
  { id: 'completed', label: 'Concluídas' },
];

export function ProposalFiltersSheet({
  open,
  onClose,
  currentFilter,
  onFilterChange,
  regionFilter,
  onRegionFilterChange,
  companyFilter,
  onCompanyFilterChange,
  sortBy,
  onSortByChange,
  companiesList,
  regionsList = defaultRegions,
  onReset,
  hasActiveFilters,
}: ProposalFiltersSheetProps) {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="filters-sheet-title"
      className="fixed inset-0 z-[70] flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Content Container */}
      <div className="relative z-10 w-full max-w-lg rounded-t-3xl sm:rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-blue-600" />
            <h2 id="filters-sheet-title" className="text-base sm:text-lg font-bold text-slate-900">
              Filtros de propostas
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar filtros"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-4 py-4">
          {/* Status Segmented Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Status da proposta
            </label>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {statusOptions.map((st) => {
                const isSelected = currentFilter === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => onFilterChange(st.id)}
                    className={cn(
                      'flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all border text-left',
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <span className="truncate">{st.label}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-blue-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Região Select */}
          <div>
            <label htmlFor="filter-region-select" className="block text-xs font-bold text-slate-700 mb-1.5">
              Região
            </label>
            <select
              id="filter-region-select"
              value={regionFilter}
              onChange={(e) => onRegionFilterChange(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm font-medium text-slate-700 focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              {regionsList.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Empresa Select */}
          <div>
            <label htmlFor="filter-company-select" className="block text-xs font-bold text-slate-700 mb-1.5">
              Empresa
            </label>
            <select
              id="filter-company-select"
              value={companyFilter}
              onChange={(e) => onCompanyFilterChange(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm font-medium text-slate-700 focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="all">Todas as empresas</option>
              {companiesList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Ordenação Select */}
          <div>
            <label htmlFor="filter-sort-select" className="block text-xs font-bold text-slate-700 mb-1.5">
              Ordenar por
            </label>
            <select
              id="filter-sort-select"
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as SortOption)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm font-medium text-slate-700 focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="recent">Mais recentes</option>
              <option value="oldest">Mais antigas</option>
              <option value="highest">Maior valor</option>
              <option value="lowest">Menor valor</option>
            </select>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Limpar filtros
            </Button>
          ) : (
            <div />
          )}

          <Button
            type="button"
            size="sm"
            onClick={onClose}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-5"
          >
            Aplicar
          </Button>
        </div>
      </div>
    </div>
  );
}
