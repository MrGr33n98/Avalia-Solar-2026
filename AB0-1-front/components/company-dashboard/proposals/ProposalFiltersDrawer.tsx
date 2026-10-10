'use client';

import React from 'react';
import { X, Sun, Zap, Wrench, Grid } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterState {
  status: string;
  category: string;
  dateFrom: string;
  dateTo: string;
}

interface ProposalFiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
  onReset: () => void;
}

export function ProposalFiltersDrawer({
  isOpen,
  onClose,
  filters,
  onApply,
  onReset,
}: ProposalFiltersDrawerProps) {
  const [localFilters, setLocalFilters] = React.useState<FilterState>(filters);

  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters, isOpen]);

  if (!isOpen) return null;

  const statuses = [
    { value: 'all', label: 'Todas' },
    { value: 'draft', label: 'Rascunho' },
    { value: 'sent', label: 'Enviada' },
    { value: 'negotiating', label: 'Em negociação' },
    { value: 'accepted', label: 'Aprovada' },
    { value: 'declined', label: 'Rejeitada' },
  ];

  const categories = [
    { value: 'all', label: 'Todas', icon: Grid },
    { value: 'solar', label: 'Solar', icon: Sun },
    { value: 'ev_mobility', label: 'Mobilidade elétrica', icon: Zap },
    { value: 'other', label: 'Outros', icon: Wrench },
  ];

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleClear = () => {
    const cleared: FilterState = {
      status: 'all',
      category: 'all',
      dateFrom: '',
      dateTo: '',
    };
    setLocalFilters(cleared);
    onReset();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="filters-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 id="filters-title" className="text-lg font-black text-slate-950">
              Filtros
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="text-sm font-semibold text-blue-600 hover:text-blue-800 px-2 py-1"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar filtros"
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 overflow-y-auto px-6 py-5">
          {/* Status */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Status da proposta
            </label>
            <div className="flex flex-wrap gap-2">
              {statuses.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    setLocalFilters((prev) => ({ ...prev, status: item.value }))
                  }
                  className={cn(
                    'min-h-11 rounded-xl px-4 text-sm font-bold transition-all',
                    localFilters.status === item.value
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Categoria do lead */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Categoria do lead
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = localFilters.category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() =>
                      setLocalFilters((prev) => ({ ...prev, category: cat.value }))
                    }
                    className={cn(
                      'flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 text-center transition-all',
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 text-blue-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    <Icon className={cn('h-5 w-5', isSelected ? 'text-blue-600' : 'text-slate-500')} />
                    <span className="text-xs font-bold">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Período de recebimento */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Período de recebimento
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="mb-1 block text-xs font-medium text-slate-600">De</span>
                <div className="relative">
                  <input
                    type="date"
                    value={localFilters.dateFrom}
                    onChange={(e) =>
                      setLocalFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
              <div>
                <span className="mb-1 block text-xs font-medium text-slate-600">Até</span>
                <div className="relative">
                  <input
                    type="date"
                    value={localFilters.dateTo}
                    onChange={(e) =>
                      setLocalFilters((prev) => ({ ...prev, dateTo: e.target.value }))
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-4 sm:p-5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
          <button
            type="button"
            onClick={handleApply}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-base font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            Aplicar filtros
          </button>
        </div>
      </div>
    </div>
  );
}
