'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  ChevronRight,
  RotateCcw,
  Check,
  Calendar,
  DollarSign,
  Clock,
  Building2,
  Users,
  Tag,
  Share2,
  Trophy,
  Layers,
  MapPin,
  Radio,
  FileQuestion,
  LucideIcon,
} from 'lucide-react';
import { salesApi } from '@/lib/api/sales/client';
import type {
  ApiFilterOptions,
  FilterOptionItem,
  FilterOperator,
  NutshellFilterCriteria,
  CriterionSelection,
  RangeCriterion,
} from '@/lib/api/sales/types';

interface NutshellFilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: NutshellFilterCriteria;
  onChange: (filters: NutshellFilterCriteria) => void;
  className?: string;
}

interface FilterDefinition {
  key: keyof NutshellFilterCriteria;
  label: string;
  icon: LucideIcon;
  type: 'select' | 'range' | 'date_range' | 'days';
  optionsKey?: keyof ApiFilterOptions;
}

const FILTER_DEFINITIONS: FilterDefinition[] = [
  { key: 'assignee', label: 'Assignee', icon: Users, type: 'select', optionsKey: 'assignees' },
  { key: 'closeDate', label: 'Close date', icon: Calendar, type: 'date_range' },
  { key: 'lastContacted', label: 'Last contacted', icon: Clock, type: 'days' },
  { key: 'outcome', label: 'Outcome', icon: Trophy, type: 'select', optionsKey: 'outcomes' },
  { key: 'pipeline', label: 'Pipeline', icon: Layers, type: 'select', optionsKey: 'pipelines' },
  { key: 'products', label: 'Products', icon: Layers, type: 'select', optionsKey: 'products' },
  { key: 'sources', label: 'Sources', icon: Share2, type: 'select', optionsKey: 'sources' },
  { key: 'tags', label: 'Tags', icon: Tag, type: 'select', optionsKey: 'tags' },
  { key: 'value', label: 'Value', icon: DollarSign, type: 'range' },
  { key: 'tickets', label: '# Tickets', icon: FileQuestion, type: 'range' },
  { key: 'address', label: 'Address (UF)', icon: MapPin, type: 'select', optionsKey: 'states' },
  { key: 'age', label: 'Age', icon: Clock, type: 'range' },
  { key: 'channels', label: 'Channels', icon: Radio, type: 'select', optionsKey: 'channels' },
  { key: 'companies', label: 'Companies', icon: Building2, type: 'select' },
  { key: 'competitors', label: 'Competitors', icon: Trophy, type: 'select', optionsKey: 'competitors' },
];

export const NutshellFilterSidebar: React.FC<NutshellFilterSidebarProps> = ({
  isOpen,
  onClose,
  filters,
  onChange,
  className = '',
}) => {
  const [filterSearch, setFilterSearch] = useState('');
  const [activeFilterKey, setActiveFilterKey] = useState<keyof NutshellFilterCriteria | null>(null);
  const [popoverSearch, setPopoverSearch] = useState('');
  const [options, setOptions] = useState<ApiFilterOptions | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Carregar opcoes reais da API
  useEffect(() => {
    let mounted = true;
    if (isOpen && !options) {
      setIsLoadingOptions(true);
      salesApi
        .getFilterOptions()
        .then((res) => {
          if (mounted && res?.options) {
            setOptions(res.options);
          }
        })
        .catch((err) => {
          console.error('Erro ao carregar opções de filtros reais:', err);
        })
        .finally(() => {
          if (mounted) setIsLoadingOptions(false);
        });
    }
    return () => {
      mounted = false;
    };
  }, [isOpen, options]);

  // Fechar popover ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setActiveFilterKey(null);
      }
    }
    if (activeFilterKey) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeFilterKey]);

  // Contagem de filtros ativos
  const activeCount = useMemo(() => {
    let count = 0;
    Object.entries(filters).forEach(([, value]) => {
      if (!value) return;
      if ('selectedIds' in value && Array.isArray(value.selectedIds) && value.selectedIds.length > 0) {
        count++;
      } else if ('min' in value && (value.min !== undefined || value.max !== undefined)) {
        count++;
      } else if ('from' in value && (value.from || value.to)) {
        count++;
      } else if ('days' in value && value.days) {
        count++;
      }
    });
    return count;
  }, [filters]);

  const filteredDefinitions = useMemo(() => {
    if (!filterSearch.trim()) return FILTER_DEFINITIONS;
    const q = filterSearch.toLowerCase().trim();
    return FILTER_DEFINITIONS.filter((def) => def.label.toLowerCase().includes(q));
  }, [filterSearch]);

  const handleClearAll = () => {
    onChange({});
    setActiveFilterKey(null);
  };

  const isFilterActive = (key: keyof NutshellFilterCriteria): boolean => {
    const val = filters[key];
    if (!val) return false;
    if ('selectedIds' in val) return Array.isArray(val.selectedIds) && val.selectedIds.length > 0;
    if ('min' in val || 'max' in val) return val.min !== undefined || val.max !== undefined;
    if ('from' in val || 'to' in val) return Boolean(val.from || val.to);
    if ('days' in val) return Boolean(val.days);
    return false;
  };

  const getActiveFilterLabelCount = (key: keyof NutshellFilterCriteria): number | null => {
    const val = filters[key];
    if (!val) return null;
    if ('selectedIds' in val && Array.isArray(val.selectedIds) && val.selectedIds.length > 0) {
      return val.selectedIds.length;
    }
    if (isFilterActive(key)) return 1;
    return null;
  };

  const activeDef = useMemo(
    () => FILTER_DEFINITIONS.find((d) => d.key === activeFilterKey),
    [activeFilterKey]
  );

  // Itens para o filtro selecionado
  const currentOptionsList: FilterOptionItem[] = useMemo(() => {
    if (!activeDef || !options) return [];
    if (activeDef.optionsKey && options[activeDef.optionsKey]) {
      const items = options[activeDef.optionsKey];
      if (!popoverSearch.trim()) return items;
      const q = popoverSearch.toLowerCase().trim();
      return items.filter((item) => item.name.toLowerCase().includes(q));
    }
    return [];
  }, [activeDef, options, popoverSearch]);

  const handleSelectToggle = (id: string | number) => {
    if (!activeFilterKey) return;
    const current = (filters[activeFilterKey] as CriterionSelection) || {
      operator: 'is',
      selectedIds: [],
    };
    const exists = current.selectedIds.includes(id);
    const newSelected = exists
      ? current.selectedIds.filter((item) => item !== id)
      : [...current.selectedIds, id];

    if (newSelected.length === 0) {
      const copy = { ...filters };
      delete copy[activeFilterKey];
      onChange(copy);
    } else {
      onChange({
        ...filters,
        [activeFilterKey]: {
          operator: current.operator || 'is',
          selectedIds: newSelected,
        },
      });
    }
  };

  const handleOperatorChange = (operator: FilterOperator) => {
    if (!activeFilterKey) return;
    const current = (filters[activeFilterKey] as CriterionSelection) || {
      operator: 'is',
      selectedIds: [],
    };
    onChange({
      ...filters,
      [activeFilterKey]: {
        ...current,
        operator,
      },
    });
  };

  const handleRangeChange = (partial: Partial<RangeCriterion>) => {
    if (!activeFilterKey) return;
    const current = (filters[activeFilterKey] as RangeCriterion) || {};
    const updated = { ...current, ...partial };

    const isEmpty =
      updated.min === undefined &&
      updated.max === undefined &&
      !updated.from &&
      !updated.to &&
      !updated.days;

    if (isEmpty) {
      const copy = { ...filters };
      delete copy[activeFilterKey];
      onChange(copy);
    } else {
      onChange({
        ...filters,
        [activeFilterKey]: updated,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 flex shadow-2xl transition-all duration-300 md:static md:z-20 ${className}`}
    >
      {/* Sidebar Panel Principal */}
      <div className="flex h-full w-72 flex-col border-r border-slate-200 bg-white font-sans text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
        {/* Cabeçalho da Sidebar */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Filters {activeCount > 0 && `(${activeCount})`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs font-medium text-sky-600 hover:text-sky-700 hover:underline dark:text-sky-400"
                title="Limpar todos os filtros"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Campo de Busca de Filtros */}
        <div className="p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search filters..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
            />
            {filterSearch && (
              <button
                onClick={() => setFilterSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Lista de Filtros com Checkbox */}
        <div className="flex-1 overflow-y-auto px-2 py-1">
          {filteredDefinitions.map((def) => {
            const active = isFilterActive(def.key);
            const count = getActiveFilterLabelCount(def.key);
            const isOpened = activeFilterKey === def.key;

            return (
              <div
                key={def.key}
                onClick={() => {
                  setActiveFilterKey(isOpened ? null : def.key);
                  setPopoverSearch('');
                }}
                className={`group flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-xs transition-colors ${
                  isOpened
                    ? 'bg-sky-50 font-semibold text-sky-900 dark:bg-sky-950/40 dark:text-sky-300'
                    : active
                    ? 'bg-slate-50 text-slate-900 dark:bg-slate-800/60 dark:text-slate-100'
                    : 'text-slate-700 hover:bg-slate-100/70 dark:text-slate-300 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                      active
                        ? 'border-sky-600 bg-sky-600 text-white'
                        : 'border-slate-300 bg-white group-hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800'
                    }`}
                  >
                    {active && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                  <span className="select-none">{def.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {count !== null && (
                    <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-700 dark:bg-sky-900/60 dark:text-sky-300">
                      {count}
                    </span>
                  )}
                  <ChevronRight
                    className={`h-3 w-3 text-slate-400 transition-transform ${
                      isOpened ? 'rotate-90 text-sky-600 dark:text-sky-400' : ''
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Popover / Condição Flutuante do Filtro Ativo */}
      {activeDef && (
        <div
          ref={popoverRef}
          className="absolute left-72 top-10 z-50 w-72 rounded-lg border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-800 md:ml-1"
        >
          {/* Header do Popover */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {activeDef.label}
            </span>
            <button
              onClick={() => setActiveFilterKey(null)}
              className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Conteudo: Select com Operador Is / Is not */}
          {activeDef.type === 'select' && (
            <div className="mt-2.5 flex flex-col gap-2">
              {/* Radio Is / Is not */}
              <div className="flex items-center gap-4 text-xs">
                <label className="flex cursor-pointer items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <input
                    type="radio"
                    name={`op-${activeDef.key}`}
                    checked={
                      ((filters[activeDef.key] as CriterionSelection)?.operator || 'is') === 'is'
                    }
                    onChange={() => handleOperatorChange('is')}
                    className="h-3.5 w-3.5 text-sky-600 focus:ring-sky-500"
                  />
                  <span>Is</span>
                </label>
                <label className="flex cursor-pointer items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <input
                    type="radio"
                    name={`op-${activeDef.key}`}
                    checked={
                      (filters[activeDef.key] as CriterionSelection)?.operator === 'is_not'
                    }
                    onChange={() => handleOperatorChange('is_not')}
                    className="h-3.5 w-3.5 text-sky-600 focus:ring-sky-500"
                  />
                  <span>Is not</span>
                </label>
              </div>

              {/* Type to search inside popover */}
              <div className="relative mt-1">
                <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Type to search..."
                  value={popoverSearch}
                  onChange={(e) => setPopoverSearch(e.target.value)}
                  className="w-full rounded border border-slate-200 bg-slate-50 py-1 pl-7 pr-2 text-xs text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Lista com Checkboxes */}
              <div className="mt-1 max-h-52 overflow-y-auto pr-1">
                {isLoadingOptions && currentOptionsList.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400">
                    Carregando opções reais...
                  </div>
                ) : currentOptionsList.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400">
                    Nenhum item encontrado
                  </div>
                ) : (
                  currentOptionsList.map((item) => {
                    const isSelected = (
                      (filters[activeDef.key] as CriterionSelection)?.selectedIds || []
                    ).includes(item.id);

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectToggle(item.id)}
                        className="flex cursor-pointer items-center justify-between rounded px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-3.5 w-3.5 items-center justify-center rounded border ${
                              isSelected
                                ? 'border-sky-600 bg-sky-600 text-white'
                                : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800'
                            }`}
                          >
                            {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                          </div>
                          {item.color && (
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                          )}
                          <span className="truncate">{item.name}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Conteúdo: Range Numérico (Value, Tickets, Age) */}
          {activeDef.type === 'range' && (
            <div className="mt-2.5 flex flex-col gap-2.5 text-xs">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-400">
                    Mínimo
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={(filters[activeDef.key] as RangeCriterion)?.min ?? ''}
                    onChange={(e) =>
                      handleRangeChange({
                        min: e.target.value === '' ? undefined : Number(e.target.value),
                      })
                    }
                    className="w-full rounded border border-slate-200 px-2 py-1 text-xs focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-400">
                    Máximo
                  </label>
                  <input
                    type="number"
                    placeholder="Sem limite"
                    value={(filters[activeDef.key] as RangeCriterion)?.max ?? ''}
                    onChange={(e) =>
                      handleRangeChange({
                        max: e.target.value === '' ? undefined : Number(e.target.value),
                      })
                    }
                    className="w-full rounded border border-slate-200 px-2 py-1 text-xs focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Conteúdo: Date Range (Close Date) */}
          {activeDef.type === 'date_range' && (
            <div className="mt-2.5 flex flex-col gap-2.5 text-xs">
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-400">
                  Data Início
                </label>
                <input
                  type="date"
                  value={(filters[activeDef.key] as RangeCriterion)?.from || ''}
                  onChange={(e) => handleRangeChange({ from: e.target.value || undefined })}
                  className="w-full rounded border border-slate-200 px-2 py-1 text-xs focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-400">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={(filters[activeDef.key] as RangeCriterion)?.to || ''}
                  onChange={(e) => handleRangeChange({ to: e.target.value || undefined })}
                  className="w-full rounded border border-slate-200 px-2 py-1 text-xs focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
            </div>
          )}

          {/* Conteúdo: Days (Last Contacted) */}
          {activeDef.type === 'days' && (
            <div className="mt-2.5 flex flex-col gap-2 text-xs">
              <label className="text-[11px] text-slate-600 dark:text-slate-400">
                Contactado nos últimos:
              </label>
              {[7, 15, 30, 60, 90].map((days) => {
                const currentDays = (filters[activeDef.key] as RangeCriterion)?.days;
                const isSelected = currentDays === days;
                return (
                  <button
                    key={days}
                    onClick={() => handleRangeChange({ days: isSelected ? undefined : days })}
                    className={`flex items-center justify-between rounded px-2 py-1.5 transition-colors ${
                      isSelected
                        ? 'bg-sky-100 font-semibold text-sky-800 dark:bg-sky-900/60 dark:text-sky-300'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{days} dias</span>
                    {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Rodapé do Popover com botão de limpar filtro deste campo */}
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] dark:border-slate-700">
            <button
              onClick={() => {
                const copy = { ...filters };
                delete copy[activeDef.key];
                onChange(copy);
              }}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Limpar</span>
            </button>
            <button
              onClick={() => setActiveFilterKey(null)}
              className="rounded bg-sky-600 px-2.5 py-1 font-semibold text-white hover:bg-sky-700"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NutshellFilterSidebar;
