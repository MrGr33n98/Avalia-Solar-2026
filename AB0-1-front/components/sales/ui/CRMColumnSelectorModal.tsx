'use client';

import React, { useMemo, useState } from 'react';
import { Columns, RotateCcw, Search, Building2, TrendingUp, Mail, Calendar, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CRMModal from '@/components/sales/ui/CRMModal';

export interface ColumnDefinition<T extends string = string> {
  id: T;
  label: string;
  category: 'companies' | 'leads' | 'email' | 'engagement' | 'custom';
  description?: string;
  required?: boolean;
}

export interface ColumnCategory {
  id: 'companies' | 'leads' | 'email' | 'engagement' | 'custom';
  label: string;
  icon: React.ReactNode;
}

const CATEGORIES: ColumnCategory[] = [
  { id: 'companies', label: 'Empresas (Companies)', icon: <Building2 className="w-4 h-4 text-blue-600" /> },
  { id: 'leads', label: 'Leads & Funil', icon: <TrendingUp className="w-4 h-4 text-emerald-600" /> },
  { id: 'email', label: 'E-mails & Automação', icon: <Mail className="w-4 h-4 text-indigo-600" /> },
  { id: 'engagement', label: 'Engajamento & Atividades', icon: <Calendar className="w-4 h-4 text-amber-600" /> },
  { id: 'custom', label: 'Tags & Atributos', icon: <Tag className="w-4 h-4 text-purple-600" /> },
];

interface CRMColumnSelectorModalProps<T extends string = string> {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  availableColumns: ColumnDefinition<T>[];
  selectedColumns: Record<T, boolean>;
  onChange: (columns: Record<T, boolean>) => void;
  onRestoreDefaults?: () => void;
}

export default function CRMColumnSelectorModal<T extends string = string>({
  open,
  onClose,
  title = 'Configurar Colunas Exibidas',
  description = 'Personalize as colunas visíveis na tabela com os campos do CRM.',
  availableColumns,
  selectedColumns,
  onChange,
  onRestoreDefaults,
}: CRMColumnSelectorModalProps<T>) {
  const [activeCategory, setActiveCategory] = useState<string>('companies');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categoryCounts = useMemo(() => {
    const counts: Record<string, { active: number; total: number }> = {};
    CATEGORIES.forEach((cat) => {
      counts[cat.id] = { active: 0, total: 0 };
    });

    availableColumns.forEach((col) => {
      if (counts[col.category]) {
        counts[col.category].total += 1;
        if (selectedColumns[col.id]) {
          counts[col.category].active += 1;
        }
      }
    });

    return counts;
  }, [availableColumns, selectedColumns]);

  const filteredColumns = useMemo(() => {
    return availableColumns.filter((col) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        col.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        col.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        col.id.toLowerCase().includes(searchQuery.toLowerCase());

      if (searchQuery.trim() !== '') {
        return matchesSearch;
      }

      return col.category === activeCategory;
    });
  }, [availableColumns, activeCategory, searchQuery]);

  const toggleColumn = (id: T, required?: boolean) => {
    if (required) return;
    onChange({
      ...selectedColumns,
      [id]: !selectedColumns[id],
    });
  };

  const handleSelectAllCategory = (catId: string) => {
    const next = { ...selectedColumns };
    const catCols = availableColumns.filter((col) => col.category === catId && !col.required);
    const allSelected = catCols.every((col) => next[col.id]);

    catCols.forEach((col) => {
      next[col.id] = !allSelected;
    });

    onChange(next);
  };

  return (
    <CRMModal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      icon={<Columns className="w-5 h-5 text-indigo-700" />}
      size="md"
      footer={
        <div className="w-full flex items-center justify-between">
          {onRestoreDefaults ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onRestoreDefaults}
              className="h-8 px-3 text-xs text-slate-600 hover:text-slate-900 border-slate-300"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Restaurar colunas padrão
            </Button>
          ) : (
            <div />
          )}
          <Button
            size="sm"
            onClick={onClose}
            className="h-8 px-5 bg-indigo-900 text-white hover:bg-indigo-950 font-bold rounded-lg shadow-xs text-xs"
          >
            Concluir
          </Button>
        </div>
      }
    >
      <div className="space-y-3 font-sans">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a column... (Buscar coluna)"
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Nutshell Split Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 min-h-[340px] max-h-[420px]">
          {/* Left Category Sidebar */}
          <div className="md:col-span-4 space-y-1 pr-1 border-r border-slate-100 overflow-y-auto">
            {CATEGORIES.map((category) => {
              const count = categoryCounts[category.id] || { active: 0, total: 0 };
              const isActive = activeCategory === category.id && !searchQuery;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(category.id);
                    setSearchQuery('');
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs transition-all text-left ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-950 font-bold shadow-2xs border border-indigo-200/60'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {category.icon}
                    <span className="truncate">{category.label}</span>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      count.active > 0
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count.active}/{count.total}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Column Checkboxes */}
          <div className="md:col-span-8 flex flex-col justify-between overflow-y-auto pr-1">
            <div className="space-y-2">
              {!searchQuery && (
                <div className="flex items-center justify-between pb-1 border-b border-slate-100 mb-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    {CATEGORIES.find((c) => c.id === activeCategory)?.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSelectAllCategory(activeCategory)}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    Marcar/Desmarcar todas
                  </button>
                </div>
              )}

              {filteredColumns.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Nenhuma coluna encontrada para &quot;{searchQuery}&quot;
                </div>
              ) : (
                filteredColumns.map((col) => {
                  const isChecked = Boolean(selectedColumns[col.id]);
                  return (
                    <label
                      key={col.id}
                      className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-indigo-200 bg-indigo-50/30'
                          : 'border-slate-200 hover:bg-slate-50/80'
                      } ${col.required ? 'opacity-90 cursor-not-allowed bg-slate-50' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={col.required}
                        onChange={() => toggleColumn(col.id, col.required)}
                        className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs font-semibold ${isChecked ? 'text-indigo-950 font-bold' : 'text-slate-800'}`}>
                            {col.label}
                          </span>
                          {col.required && (
                            <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                              Obrigatório
                            </span>
                          )}
                        </div>
                        {col.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            {col.description}
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </CRMModal>
  );
}
