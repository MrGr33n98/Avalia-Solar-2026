'use client';

import React, { useState, useMemo } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Users,
  CheckCircle2,
  Layers,
  Flame,
  Calendar,
  Megaphone,
  Clock,
  Flag,
  Share2,
  Tag,
  DollarSign,
  Ticket,
  Crosshair,
  Percent,
  UserPlus,
  FileText,
  Globe,
  Hash,
  Package,
  Eye,
  Check,
  Star,
  XCircle,
  Clock3,
  Circle,
  LucideIcon,
} from 'lucide-react';
import type {
  ApiFilterOptions,
  CriterionSelection,
  FilterOptionItem,
  NutshellFilterCriteria,
  RangeCriterion,
} from '@/lib/api/sales/types';

interface NutshellFilterDropdownMenuProps {
  filters: NutshellFilterCriteria;
  onChange: (filters: NutshellFilterCriteria) => void;
  options: ApiFilterOptions | null;
  isLoadingOptions?: boolean;
  children: React.ReactNode;
}

interface FilterItemDef {
  key: keyof NutshellFilterCriteria;
  label: string;
  icon: LucideIcon;
  section: 'main' | 'details' | 'dates';
  type: 'select' | 'range' | 'date_range' | 'days';
  optionsKey?: keyof ApiFilterOptions;
}

const ALL_FILTER_DEFS: FilterItemDef[] = [
  // Section 1: Main (Benchmark Nutshell Top List)
  { key: 'assignee', label: 'Assignee', icon: Users, section: 'main', type: 'select', optionsKey: 'assignees' },
  { key: 'status', label: 'Status', icon: CheckCircle2, section: 'main', type: 'select', optionsKey: 'outcomes' },
  { key: 'pipeline', label: 'Pipeline', icon: Layers, section: 'main', type: 'select', optionsKey: 'pipelines' },
  { key: 'priority', label: 'Priority', icon: Flame, section: 'main', type: 'select' },
  { key: 'closeDate', label: 'Close date', icon: Calendar, section: 'main', type: 'date_range' },
  { key: 'createdVia', label: 'Created via', icon: Megaphone, section: 'main', type: 'select' },
  { key: 'lastContacted', label: 'Last contact', icon: Clock, section: 'main', type: 'days' },
  { key: 'openDate', label: 'Open date', icon: Calendar, section: 'main', type: 'date_range' },
  { key: 'outcome', label: 'Outcome', icon: Flag, section: 'main', type: 'select', optionsKey: 'outcomes' },
  { key: 'sources', label: 'Sources', icon: Share2, section: 'main', type: 'select', optionsKey: 'sources' },
  { key: 'stage', label: 'Stage', icon: Layers, section: 'main', type: 'select', optionsKey: 'stages' },
  { key: 'tags', label: 'Tags', icon: Tag, section: 'main', type: 'select', optionsKey: 'tags' },
  { key: 'value', label: 'Value', icon: DollarSign, section: 'main', type: 'range' },

  // Section 2: Details (Benchmark Nutshell Details Group)
  { key: 'tickets', label: '# Tickets', icon: Ticket, section: 'details', type: 'range' },
  { key: 'competitors', label: 'Competitors', icon: Crosshair, section: 'details', type: 'select', optionsKey: 'competitors' },
  { key: 'confidence', label: '# Confidence', icon: Percent, section: 'details', type: 'range' },
  { key: 'createdBy', label: 'Created by', icon: UserPlus, section: 'details', type: 'select', optionsKey: 'assignees' },
  { key: 'leadName', label: 'Lead name', icon: FileText, section: 'details', type: 'select' },
  { key: 'market', label: 'Market', icon: Globe, section: 'details', type: 'select' },
  { key: 'number', label: '# Number', icon: Hash, section: 'details', type: 'range' },
  { key: 'products', label: 'Products', icon: Package, section: 'details', type: 'select', optionsKey: 'products' },
  { key: 'watchedBy', label: 'Watched by', icon: Eye, section: 'details', type: 'select', optionsKey: 'assignees' },
];

export function NutshellFilterDropdownMenu({
  filters,
  onChange,
  options,
  isLoadingOptions,
  children,
}: NutshellFilterDropdownMenuProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [subSearchQuery, setSubSearchQuery] = useState('');

  const filteredDefs = useMemo(() => {
    if (!searchQuery.trim()) return ALL_FILTER_DEFS;
    const q = searchQuery.toLowerCase();
    return ALL_FILTER_DEFS.filter((d) => d.label.toLowerCase().includes(q));
  }, [searchQuery]);

  const mainDefs = useMemo(() => filteredDefs.filter((d) => d.section === 'main'), [filteredDefs]);
  const detailsDefs = useMemo(() => filteredDefs.filter((d) => d.section === 'details'), [filteredDefs]);

  // Manipulador de multi-seleção
  const handleToggleOption = (key: keyof NutshellFilterCriteria, optionId: number | string) => {
    const current = (filters[key] as CriterionSelection) || { operator: 'is', selectedIds: [] };
    const currentIds = current.selectedIds || [];
    const isSelected = currentIds.includes(optionId);

    const nextIds = isSelected
      ? currentIds.filter((id) => id !== optionId)
      : [...currentIds, optionId];

    const copy = { ...filters };
    if (nextIds.length === 0) {
      delete copy[key];
    } else {
      (copy as Record<string, unknown>)[key] = {
        operator: current.operator || 'is',
        selectedIds: nextIds,
      };
    }
    onChange(copy);
  };

  // Manipulador de range
  const handleRangeChange = (key: keyof NutshellFilterCriteria, patch: Partial<RangeCriterion>) => {
    const current = (filters[key] as RangeCriterion) || {};
    const updated = { ...current, ...patch };

    const copy = { ...filters };
    const hasValues =
      updated.min !== undefined ||
      updated.max !== undefined ||
      updated.from !== undefined ||
      updated.to !== undefined ||
      updated.days !== undefined;

    if (!hasValues) {
      delete copy[key];
    } else {
      (copy as Record<string, unknown>)[key] = updated;
    }
    onChange(copy);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="w-64 max-h-[460px] overflow-y-auto rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 font-sans text-xs shadow-lg ring-1 ring-black/5 [scrollbar-width:thin]"
      >
        {/* Search filters input */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 p-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search filters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-7.5 pl-8 pr-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm focus:outline-none focus:border-[#0F62FE] focus:ring-1 focus:ring-[#0F62FE] placeholder-slate-400 transition-colors"
              autoFocus
            />
          </div>
        </div>

        {/* Section 1: Main */}
        <div className="py-1">
          {mainDefs.map((def) => {
            const Icon = def.icon;
            const currentSelection = filters[def.key] as CriterionSelection | undefined;
            const hasActive =
              Boolean(currentSelection?.selectedIds?.length) ||
              Boolean((filters[def.key] as RangeCriterion)?.min !== undefined) ||
              Boolean((filters[def.key] as RangeCriterion)?.from);

            return (
              <DropdownMenuSub key={def.key}>
                <DropdownMenuSubTrigger className="h-8 px-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-sm data-[state=open]:bg-blue-50/70 dark:data-[state=open]:bg-blue-950/40">
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`h-3.5 w-3.5 ${hasActive ? 'text-[#0F62FE]' : 'text-slate-400'}`} />
                    <span className={`truncate ${hasActive ? 'font-semibold text-[#0F62FE]' : ''}`}>
                      {def.label}
                    </span>
                  </div>
                </DropdownMenuSubTrigger>

                <DropdownMenuSubContent
                  sideOffset={4}
                  className="w-64 max-h-80 overflow-y-auto rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 font-sans text-xs shadow-xl ring-1 ring-black/5"
                >
                  {renderSubmenuContent(
                    def,
                    filters,
                    options,
                    isLoadingOptions,
                    subSearchQuery,
                    setSubSearchQuery,
                    handleToggleOption,
                    handleRangeChange
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            );
          })}
        </div>

        {/* Section 2: Details Header & Items */}
        {detailsDefs.length > 0 && (
          <>
            <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Details
            </div>
            <div className="py-0.5">
              {detailsDefs.map((def) => {
                const Icon = def.icon;
                const currentSelection = filters[def.key] as CriterionSelection | undefined;
                const hasActive = Boolean(currentSelection?.selectedIds?.length);

                return (
                  <DropdownMenuSub key={def.key}>
                    <DropdownMenuSubTrigger className="h-8 px-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-sm">
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className="h-3.5 w-3.5 text-slate-400" />
                        <span className={`truncate ${hasActive ? 'font-semibold text-[#0F62FE]' : ''}`}>
                          {def.label}
                        </span>
                      </div>
                    </DropdownMenuSubTrigger>

                    <DropdownMenuSubContent
                      sideOffset={4}
                      className="w-64 max-h-80 overflow-y-auto rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 font-sans text-xs shadow-xl ring-1 ring-black/5"
                    >
                      {renderSubmenuContent(
                        def,
                        filters,
                        options,
                        isLoadingOptions,
                        subSearchQuery,
                        setSubSearchQuery,
                        handleToggleOption,
                        handleRangeChange
                      )}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                );
              })}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function renderSubmenuContent(
  def: FilterItemDef,
  filters: NutshellFilterCriteria,
  options: ApiFilterOptions | null,
  isLoadingOptions: boolean | undefined,
  subSearchQuery: string,
  setSubSearchQuery: (s: string) => void,
  handleToggleOption: (key: keyof NutshellFilterCriteria, id: number | string) => void,
  handleRangeChange: (key: keyof NutshellFilterCriteria, patch: Partial<RangeCriterion>) => void
) {
  // 1. Status Custom Submenu
  if (def.key === 'status') {
    const selected = (filters.status?.selectedIds as string[]) || [];
    const statusItems = [
      { id: 'open', label: 'Open', icon: Circle, color: '#0F62FE' },
      { id: 'won', label: 'Won', icon: Star, color: '#16A34A' },
      { id: 'lost', label: 'Lost', icon: XCircle, color: '#DC2626' },
      { id: 'cancelled', label: 'Cancelled', icon: XCircle, color: '#64748B' },
      { id: 'pending', label: 'Pending', icon: Clock3, color: '#F59E0B' },
    ];

    return (
      <div className="space-y-1">
        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Filtrar por Status
        </div>
        {statusItems.map((item) => {
          const isChecked = selected.includes(item.id);
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleToggleOption('status', item.id)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-sm hover:bg-slate-50 dark:hover:bg-slate-800 text-xs transition-colors"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors ${
                    isChecked
                      ? 'bg-[#0F62FE] border-[#0F62FE] text-white'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                  }`}
                >
                  {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                <span className="text-slate-800 dark:text-slate-200 font-medium">{item.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // 2. Selectable Lists (Assignee, Pipeline, Sources, Tags, Competitors, Products)
  if (def.type === 'select') {
    const list: FilterOptionItem[] = def.optionsKey && options ? (options[def.optionsKey] || []) : [];
    const selected = (filters[def.key] as CriterionSelection)?.selectedIds || [];

    // Assignee especial: incluir "Unassigned"
    const items: FilterOptionItem[] =
      def.key === 'assignee'
        ? [{ id: 'unassigned', name: 'Unassigned' }, ...list]
        : list;

    return (
      <div className="space-y-1">
        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {def.label}
        </div>
        {isLoadingOptions && items.length === 0 ? (
          <div className="p-3 text-center text-xs text-slate-400">Carregando opções...</div>
        ) : items.length === 0 ? (
          <div className="p-3 text-center text-xs text-slate-400 italic">Nenhum item disponível</div>
        ) : (
          items.map((item: FilterOptionItem) => {
            const isChecked = selected.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleToggleOption(def.key, item.id)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-sm hover:bg-slate-50 dark:hover:bg-slate-800 text-xs transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <div
                    className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${
                      isChecked
                        ? 'bg-[#0F62FE] border-[#0F62FE] text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                  <span className="truncate text-slate-800 dark:text-slate-200">{item.name}</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    );
  }

  // 3. Numeric Range (Value, Tickets, Confidence, Age)
  if (def.type === 'range') {
    const current = (filters[def.key] as RangeCriterion) || {};
    return (
      <div className="p-2 space-y-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {def.label} Range
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-slate-500 font-medium">Mínimo</label>
            <input
              type="number"
              placeholder="0"
              value={current.min ?? ''}
              onChange={(e) =>
                handleRangeChange(def.key, {
                  min: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
              className="w-full h-7 px-2 text-xs border border-slate-200 dark:border-slate-700 rounded-sm bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-[#0F62FE]"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-medium">Máximo</label>
            <input
              type="number"
              placeholder="Sem limite"
              value={current.max ?? ''}
              onChange={(e) =>
                handleRangeChange(def.key, {
                  max: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
              className="w-full h-7 px-2 text-xs border border-slate-200 dark:border-slate-700 rounded-sm bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-[#0F62FE]"
            />
          </div>
        </div>
      </div>
    );
  }

  // 4. Date Range
  if (def.type === 'date_range') {
    const current = (filters[def.key] as RangeCriterion) || {};
    return (
      <div className="p-2 space-y-2.5">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Período ({def.label})
        </div>
        <div className="space-y-2">
          <div>
            <label className="text-[10px] text-slate-500 font-medium">De</label>
            <input
              type="date"
              value={current.from ?? ''}
              onChange={(e) => handleRangeChange(def.key, { from: e.target.value || undefined })}
              className="w-full h-7 px-2 text-xs border border-slate-200 dark:border-slate-700 rounded-sm bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-[#0F62FE]"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-medium">Até</label>
            <input
              type="date"
              value={current.to ?? ''}
              onChange={(e) => handleRangeChange(def.key, { to: e.target.value || undefined })}
              className="w-full h-7 px-2 text-xs border border-slate-200 dark:border-slate-700 rounded-sm bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-[#0F62FE]"
            />
          </div>
        </div>
      </div>
    );
  }

  // 5. Days
  if (def.type === 'days') {
    const currentDays = (filters[def.key] as RangeCriterion)?.days;
    return (
      <div className="p-1 space-y-1">
        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Último contato
        </div>
        {[7, 15, 30, 60, 90].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => handleRangeChange(def.key, { days: currentDays === d ? undefined : d })}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-sm text-xs transition-colors ${
              currentDays === d
                ? 'bg-blue-50 text-[#0F62FE] font-bold'
                : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <span>Últimos {d} dias</span>
            {currentDays === d && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
          </button>
        ))}
      </div>
    );
  }

  return null;
}

export default NutshellFilterDropdownMenu;
