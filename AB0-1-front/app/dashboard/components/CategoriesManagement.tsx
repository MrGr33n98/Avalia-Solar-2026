'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  ExternalLink,
  Grid2X2,
  Loader2,
  Search,
  SlidersHorizontal,
  Sun,
  Trash2,
  Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useCategories, type Category } from '../hooks/useCategories';

interface CategoriesManagementProps {
  companyId: string;
}

const ALL_GROUPS = 'all';
const GROUP_SOLAR = 'Energia Solar';
const GROUP_MOBILITY = 'Mobilidade Elétrica';
const GROUP_OTHER = 'Outras categorias';

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function resolveGroup(category: Category) {
  const value = normalizeText(`${category.name} ${category.seo_url || ''}`);

  if (
    value.includes('mobilidade') ||
    value.includes('eletrica') ||
    value.includes('carregador') ||
    value.includes('veiculo') ||
    value.includes('ev ')
  ) {
    return GROUP_MOBILITY;
  }

  if (
    value.includes('solar') ||
    value.includes('fotovolta') ||
    value.includes('energia') ||
    value.includes('geracao')
  ) {
    return GROUP_SOLAR;
  }

  return GROUP_OTHER;
}

function groupAccent(group: string) {
  if (group === GROUP_MOBILITY) {
    return {
      border: 'border-emerald-200',
      selectedBorder: 'border-emerald-400',
      selectedBg: 'bg-emerald-50/70',
      iconBg: 'bg-emerald-50 text-emerald-600',
      checkbox: 'data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500',
    };
  }

  if (group === GROUP_SOLAR) {
    return {
      border: 'border-blue-200',
      selectedBorder: 'border-blue-500',
      selectedBg: 'bg-blue-50/70',
      iconBg: 'bg-amber-50 text-amber-500',
      checkbox: 'data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600',
    };
  }

  return {
    border: 'border-slate-200',
    selectedBorder: 'border-slate-400',
    selectedBg: 'bg-slate-50',
    iconBg: 'bg-slate-100 text-slate-500',
    checkbox: 'data-[state=checked]:bg-slate-700 data-[state=checked]:border-slate-700',
  };
}

function CategoryGlyph({ group }: { group: string }) {
  const accent = groupAccent(group);
  const Icon = group === GROUP_MOBILITY ? Zap : group === GROUP_SOLAR ? Sun : Grid2X2;

  return (
    <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-lg', accent.iconBg)}>
      <Icon className="h-5 w-5" aria-hidden="true" />
    </span>
  );
}

function uniqueCategories(categories: Category[]) {
  const byId = new Map<string, Category>();
  categories.forEach((category) => {
    byId.set(String(category.id), category);
  });
  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export default function CategoriesManagement({ companyId }: CategoriesManagementProps) {
  const {
    loading,
    categories,
    availableCategories,
    addCategories,
    removeCategory,
  } = useCategories(companyId);

  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [groupFilter, setGroupFilter] = useState(ALL_GROUPS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pendingSelectionKey, setPendingSelectionKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const currentIds = useMemo(() => categories.map((category) => String(category.id)), [categories]);
  const currentSet = useMemo(() => new Set(currentIds), [currentIds]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const allCategories = useMemo(
    () => uniqueCategories([...categories, ...availableCategories]),
    [availableCategories, categories]
  );

  const groupedCounts = useMemo(() => {
    return selectedIds.reduce<Record<string, number>>((acc, categoryId) => {
      const category = allCategories.find((item) => String(item.id) === categoryId);
      if (!category) return acc;

      const group = resolveGroup(category);
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {});
  }, [allCategories, selectedIds]);

  const groupOptions = useMemo(() => {
    const groups = new Set<string>(allCategories.map(resolveGroup));
    return [ALL_GROUPS, GROUP_SOLAR, GROUP_MOBILITY, GROUP_OTHER].filter(
      (group) => group === ALL_GROUPS || groups.has(group)
    );
  }, [allCategories]);

  const filteredCategories = useMemo(() => {
    const normalizedQuery = normalizeText(deferredQuery.trim());

    return allCategories.filter((category) => {
      const group = resolveGroup(category);
      const matchesGroup = groupFilter === ALL_GROUPS || group === groupFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        normalizeText(`${category.name} ${category.seo_url || ''}`).includes(normalizedQuery);

      return matchesGroup && matchesQuery;
    });
  }, [allCategories, deferredQuery, groupFilter]);

  const categoriesByGroup = useMemo(() => {
    return filteredCategories.reduce<Record<string, Category[]>>((acc, category) => {
      const group = resolveGroup(category);
      acc[group] = acc[group] || [];
      acc[group].push(category);
      return acc;
    }, {});
  }, [filteredCategories]);

  const selectionChanged = useMemo(() => {
    const selectedKey = [...selectedIds].sort().join('|');
    const currentKey = [...currentIds].sort().join('|');

    return selectedKey !== currentKey && selectedKey !== pendingSelectionKey;
  }, [currentIds, pendingSelectionKey, selectedIds]);

  useEffect(() => {
    const currentKey = [...currentIds].sort().join('|');

    if (pendingSelectionKey === currentKey) {
      setPendingSelectionKey(null);
    }

    if (!pendingSelectionKey) {
      setSelectedIds(currentIds);
    }
  }, [currentIds, pendingSelectionKey]);

  const toggleCategory = (categoryId: string) => {
    setSelectedIds((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId]
    );
  };

  const clearSelection = () => setSelectedIds([]);

  const resetSelection = () => {
    setPendingSelectionKey(null);
    setSelectedIds(currentIds);
  };

  const submitSelection = async () => {
    if (!selectionChanged || submitting) return;

    const targetIds = selectedIds;
    const targetKey = [...targetIds].sort().join('|');
    const toAdd = selectedIds.filter((id) => !currentSet.has(id));
    const toRemove = currentIds.filter((id) => !selectedSet.has(id));

    setSubmitting(true);
    try {
      if (toAdd.length > 0) {
        await addCategories(toAdd);
      }

      for (const categoryId of toRemove) {
        await removeCategory(categoryId);
      }

      setSelectedIds(targetIds);
      setPendingSelectionKey(targetKey);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-[420px]" />
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6 text-slate-950">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Dashboard / Categorias
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Categorias da sua empresa
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Selecione as categorias que melhor representam os serviços oferecidos. Alterações são
            enviadas para aprovação antes de aparecerem publicamente.
          </p>
          {pendingSelectionKey ? (
            <p className="mt-2 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
              Solicitação enviada para aprovação
            </p>
          ) : null}
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-11 w-full justify-center gap-2 rounded-lg border-slate-200 bg-white text-blue-700 hover:bg-blue-50 lg:w-auto"
          onClick={() => window.open(`/companies/${companyId}`, '_blank', 'noopener,noreferrer')}
        >
          Ver como aparece no site
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
              <Grid2X2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-950">Resumo da seleção</h3>
              <p className="mt-1 text-sm font-semibold text-slate-700">
                {selectedIds.length} {selectedIds.length === 1 ? 'categoria selecionada' : 'categorias selecionadas'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Badge className="h-8 rounded-full bg-amber-50 px-3 text-amber-700 hover:bg-amber-50">
              <Sun className="mr-2 h-4 w-4" aria-hidden="true" />
              {groupedCounts[GROUP_SOLAR] || 0} Energia Solar
            </Badge>
            <Badge className="h-8 rounded-full bg-emerald-50 px-3 text-emerald-700 hover:bg-emerald-50">
              <Zap className="mr-2 h-4 w-4" aria-hidden="true" />
              {groupedCounts[GROUP_MOBILITY] || 0} Mobilidade Elétrica
            </Badge>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-lg border-slate-200 bg-white text-blue-700"
            onClick={clearSelection}
            disabled={selectedIds.length === 0 || submitting}
          >
            Limpar seleção
            <Trash2 className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
        <label className="relative">
          <span className="sr-only">Buscar categorias</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar categorias..."
            className="h-12 rounded-lg border-slate-200 bg-white pl-11 text-sm shadow-sm"
          />
        </label>

        <Select value={groupFilter} onValueChange={setGroupFilter}>
          <SelectTrigger className="h-12 rounded-lg border-slate-200 bg-white shadow-sm">
            <div className="flex min-w-0 items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
              <SelectValue placeholder="Filtrar por grupo" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {groupOptions.map((group) => (
              <SelectItem key={group} value={group}>
                {group === ALL_GROUPS ? 'Todos os grupos' : group}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="h-[520px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="space-y-8 pr-3">
          {[GROUP_SOLAR, GROUP_MOBILITY, GROUP_OTHER].map((group) => {
            const items = categoriesByGroup[group] || [];
            if (items.length === 0) return null;

            const accent = groupAccent(group);
            const GroupIcon = group === GROUP_MOBILITY ? Zap : group === GROUP_SOLAR ? Sun : Grid2X2;

            return (
              <div key={group} className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className={cn('flex h-8 w-8 items-center justify-center rounded-full', accent.iconBg)}>
                    <GroupIcon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <h3 className="text-lg font-black text-slate-950">{group}</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {items.map((category) => {
                    const categoryId = String(category.id);
                    const selected = selectedSet.has(categoryId);
                    const alreadyVisible = currentSet.has(categoryId);
                    const categoryAccent = groupAccent(resolveGroup(category));

                    return (
                      <button
                        key={categoryId}
                        type="button"
                        onClick={() => toggleCategory(categoryId)}
                        className={cn(
                          'flex min-h-20 w-full items-center gap-3 rounded-lg border bg-white p-3 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-md',
                          categoryAccent.border,
                          selected && categoryAccent.selectedBorder,
                          selected && categoryAccent.selectedBg
                        )}
                        aria-pressed={selected}
                      >
                        <CategoryGlyph group={resolveGroup(category)} />

                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 text-sm font-black leading-5 text-slate-950">
                            {category.name}
                          </span>
                          <span className="mt-1 flex flex-wrap gap-1">
                            {alreadyVisible ? (
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                Visível hoje
                              </span>
                            ) : null}
                            {category.featured ? (
                              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                Destaque
                              </span>
                            ) : null}
                          </span>
                        </span>

                        <Checkbox
                          checked={selected}
                          onCheckedChange={() => toggleCategory(categoryId)}
                          onClick={(event) => event.stopPropagation()}
                          aria-label={`Selecionar ${category.name}`}
                          className={cn('h-5 w-5 rounded-md border-slate-300', categoryAccent.checkbox)}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filteredCategories.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
              <Search className="h-8 w-8 text-slate-400" aria-hidden="true" />
              <h3 className="mt-3 text-sm font-black text-slate-950">Nenhuma categoria encontrada</h3>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                Ajuste a busca ou o filtro de grupo para visualizar outras categorias.
              </p>
            </div>
          ) : null}
        </div>
      </ScrollArea>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-black text-slate-950">
          {selectedIds.length} {selectedIds.length === 1 ? 'categoria selecionada' : 'categorias selecionadas'}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-lg border-slate-200 bg-white px-6"
            onClick={resetSelection}
            disabled={!selectionChanged || submitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="h-11 rounded-lg bg-blue-600 px-6 font-bold text-white hover:bg-blue-700"
            onClick={submitSelection}
            disabled={!selectionChanged || submitting}
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : selectionChanged ? (
              <Check className="mr-2 h-4 w-4" aria-hidden="true" />
            ) : null}
            Revisar seleção
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  );
}
