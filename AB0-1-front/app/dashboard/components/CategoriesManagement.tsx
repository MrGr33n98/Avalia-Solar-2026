'use client';

import Image from 'next/image';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
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
import { useToast } from '@/hooks/use-toast';
import type { FeatureAccessEntry } from '@/lib/api';
import { cn } from '@/lib/utils';
import { buildCompanyPath } from '@/lib/slug';
import { getFullImageUrl } from '@/utils/image';
import { useCategories, type Category } from '../hooks/useCategories';

interface CategoriesManagementProps {
  companyId: string;
  company?: {
    id?: string | number | null;
    slug?: string | null;
    name?: string | null;
    plan_tier?: string | null;
    feature_access?: Record<string, FeatureAccessEntry> | null;
  } | null;
}

const ALL_GROUPS = 'all';
const GROUP_SOLAR = 'Energia Solar';
const GROUP_MOBILITY = 'Mobilidade Elétrica';
const GROUP_OTHER = 'Outras categorias';
const GROUP_ORDER = [GROUP_SOLAR, GROUP_MOBILITY, GROUP_OTHER];
const CATEGORY_LIMIT_FEATURE_KEYS = [
  'company_categories_limit',
  'category_limit',
  'categories_limit',
  'profile_categories_limit',
];
const CATEGORY_LIMIT_BY_PLAN: Record<string, number> = {
  free: 3,
  essential: 6,
  pro: 12,
  enterprise: 999,
};

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

function getCategoryImage(category: Category) {
  return category.banner_url || category.icon_url || category.logo?.url || null;
}

function CategoryThumbnail({ category, group }: { category: Category; group: string }) {
  const imageUrl = getCategoryImage(category);
  const accent = groupAccent(group);
  const Icon = group === GROUP_MOBILITY ? Zap : group === GROUP_SOLAR ? Sun : Grid2X2;

  if (imageUrl) {
    return (
      <span className="relative h-16 w-24 shrink-0 overflow-hidden rounded-none bg-slate-100">
        <Image
          src={getFullImageUrl(imageUrl)}
          alt=""
          fill
          sizes="96px"
          className="object-cover"
        />
      </span>
    );
  }

  return (
    <span className={cn('flex h-16 w-24 shrink-0 items-center justify-center rounded-none', accent.iconBg)}>
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

function numericLimitFromEntry(entry?: FeatureAccessEntry | null) {
  if (!entry) return null;

  const rawValue = entry.value ?? entry.limit?.max ?? null;
  if (typeof rawValue !== 'number' && typeof rawValue !== 'string') return null;

  const parsed = typeof rawValue === 'number' ? rawValue : Number(rawValue);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function resolveCategoryLimit(company?: CategoriesManagementProps['company']) {
  for (const key of CATEGORY_LIMIT_FEATURE_KEYS) {
    const limit = numericLimitFromEntry(company?.feature_access?.[key]);
    if (limit) return limit;
  }

  const planTier = (company?.plan_tier || 'free').toLowerCase();
  return CATEGORY_LIMIT_BY_PLAN[planTier] || CATEGORY_LIMIT_BY_PLAN.free;
}

export default function CategoriesManagement({ companyId, company }: CategoriesManagementProps) {
  const { toast } = useToast();
  const {
    loading,
    categories,
    availableCategories,
    allCategories: catalogCategories,
    addCategories,
    removeCategory,
  } = useCategories(companyId);

  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [groupFilter, setGroupFilter] = useState(ALL_GROUPS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pendingSelectionKey, setPendingSelectionKey] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<string[]>(GROUP_ORDER);
  const [submitting, setSubmitting] = useState(false);

  const currentIds = useMemo(() => categories.map((category) => String(category.id)), [categories]);
  const currentSet = useMemo(() => new Set(currentIds), [currentIds]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const categoryLimit = useMemo(() => resolveCategoryLimit(company), [company]);
  const exceedsCategoryLimit = selectedIds.length > categoryLimit;
  const overLimitCount = Math.max(selectedIds.length - categoryLimit, 0);
  const categoryLimitLabel = categoryLimit >= 999 ? 'ilimitado' : `${categoryLimit} categorias`;
  const categoryLimitBadgeText = categoryLimit >= 999 ? 'Categorias ilimitadas' : `Até ${categoryLimitLabel}`;
  const publicCompanyPath = useMemo(
    () => buildCompanyPath(company?.slug, company?.name, company?.id || companyId),
    [company?.id, company?.name, company?.slug, companyId]
  );

  const allCategories = useMemo(
    () => uniqueCategories([...categories, ...availableCategories, ...catalogCategories]),
    [availableCategories, catalogCategories, categories]
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
    setSelectedIds((current) => {
      if (current.includes(categoryId)) {
        return current.filter((id) => id !== categoryId);
      }

      const next = [...current, categoryId];
      if (next.length > categoryLimit) {
        toast({
          title: 'Limite do plano excedido',
          description: `Seu plano inclui ${categoryLimitLabel}. A seleção extra será enviada para aprovação comercial.`,
        });
      }

      return next;
    });
  };

  const clearSelection = () => setSelectedIds([]);

  const resetSelection = () => {
    setPendingSelectionKey(null);
    setSelectedIds(currentIds);
  };

  const toggleGroup = (group: string) => {
    setOpenGroups((current) =>
      current.includes(group) ? current.filter((item) => item !== group) : [...current, group]
    );
  };

  const submitSelection = async () => {
    if (!selectionChanged || submitting) return;

    const targetIds = selectedIds;
    const targetKey = [...targetIds].sort().join('|');
    const toAdd = selectedIds.filter((id) => !currentSet.has(id));
    const toRemove = currentIds.filter((id) => !selectedSet.has(id));

    setSubmitting(true);
    try {
      let isDirectUpdate = true;
      if (toAdd.length > 0) {
        const res = await addCategories(toAdd);
        if (res && !res.direct_update) {
          isDirectUpdate = false;
        }
      }

      for (const categoryId of toRemove) {
        await removeCategory(categoryId);
      }

      setSelectedIds(targetIds);
      if (!isDirectUpdate) {
        setPendingSelectionKey(targetKey);
        toast({
          title: exceedsCategoryLimit ? 'Solicitação comercial enviada' : 'Solicitação enviada',
          description: exceedsCategoryLimit
            ? 'O admin precisa aprovar a exceção ou ajustar o plano antes da publicação.'
            : 'As categorias serão publicadas após aprovação do admin.',
        });
      } else {
        setPendingSelectionKey(null);
      }
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
        <Skeleton className="h-24 w-full rounded-none" />
        <Skeleton className="h-12 w-full rounded-none" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-none" />
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
            <p className="mt-2 inline-flex rounded-none bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
              Solicitação enviada para aprovação
            </p>
          ) : null}
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-11 w-full justify-center gap-2 rounded-none border-slate-200 bg-white text-blue-700 hover:bg-blue-50 lg:w-auto"
          onClick={() => window.open(publicCompanyPath, '_blank', 'noopener,noreferrer')}
        >
          Ver como aparece no site
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <div className="rounded-none border border-slate-200 bg-white p-4 shadow-none sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-none bg-blue-600 text-white">
              <Grid2X2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-950">Resumo da seleção</h3>
              <p className="mt-1 text-sm font-semibold text-slate-700">
                {selectedIds.length} {selectedIds.length === 1 ? 'categoria selecionada' : 'categorias selecionadas'}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Limite do plano: {categoryLimitLabel}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Badge
              className={cn(
                'h-8 rounded-none px-3',
                exceedsCategoryLimit
                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-100'
              )}
            >
              {exceedsCategoryLimit
                ? `${overLimitCount} acima do limite`
                : categoryLimitBadgeText}
            </Badge>
            <Badge className="h-8 rounded-none bg-amber-50 px-3 text-amber-700 hover:bg-amber-50">
              <Sun className="mr-2 h-4 w-4" aria-hidden="true" />
              {groupedCounts[GROUP_SOLAR] || 0} Energia Solar
            </Badge>
            <Badge className="h-8 rounded-none bg-emerald-50 px-3 text-emerald-700 hover:bg-emerald-50">
              <Zap className="mr-2 h-4 w-4" aria-hidden="true" />
              {groupedCounts[GROUP_MOBILITY] || 0} Mobilidade Elétrica
            </Badge>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-none border-slate-200 bg-white text-blue-700"
            onClick={clearSelection}
            disabled={selectedIds.length === 0 || submitting}
          >
            Limpar seleção
            <Trash2 className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {exceedsCategoryLimit ? (
        <div className="rounded-none border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          Seu plano permite {categoryLimitLabel}. As {overLimitCount}{' '}
          {overLimitCount === 1 ? 'categoria extra ficará' : 'categorias extras ficarão'} pendente(s)
          de aprovação comercial no ActiveAdmin.
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
        <label className="relative">
          <span className="sr-only">Buscar categorias</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar categorias..."
            className="h-12 rounded-none border-slate-200 bg-white pl-11 text-sm shadow-none"
          />
        </label>

        <Select value={groupFilter} onValueChange={setGroupFilter}>
          <SelectTrigger className="h-12 rounded-none border-slate-200 bg-white shadow-none">
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

      <ScrollArea className="h-[520px] rounded-none border border-slate-200 bg-white p-4 shadow-none">
        <div className="space-y-6 pr-3">
          {GROUP_ORDER.map((group) => {
            const items = categoriesByGroup[group] || [];
            if (items.length === 0) return null;

            const groupOpen = openGroups.includes(group);

            return (
              <div key={group} className="border-b border-slate-200 pb-6 last:border-b-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => toggleGroup(group)}
                  className="flex w-full items-center justify-between gap-4 border border-slate-200 bg-slate-50 px-3 py-3 text-left transition-colors hover:bg-slate-100"
                  aria-expanded={groupOpen}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="min-w-0">
                      <span className="block text-base font-black text-slate-950">{group}</span>
                      <span className="block text-xs font-semibold text-slate-500">
                        {items.length} {items.length === 1 ? 'categoria' : 'categorias'}
                      </span>
                    </span>
                  </span>
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                    {groupOpen ? 'Fechar' : 'Abrir'}
                    <ChevronDown
                      className={cn('h-4 w-4 transition-transform', groupOpen && 'rotate-180')}
                      aria-hidden="true"
                    />
                  </span>
                </button>

                {groupOpen ? (
                  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {items.map((category) => {
                      const categoryId = String(category.id);
                      const selected = selectedSet.has(categoryId);
                      const alreadyVisible = currentSet.has(categoryId);
                      const categoryAccent = groupAccent(resolveGroup(category));

                      return (
                        <div
                          key={categoryId}
                          role="button"
                          tabIndex={0}
                          onClick={() => toggleCategory(categoryId)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              toggleCategory(categoryId);
                            }
                          }}
                          className={cn(
                            'flex min-h-20 w-full cursor-pointer items-center gap-3 rounded-none border bg-white p-3 text-left shadow-none transition-colors hover:border-blue-300',
                            categoryAccent.border,
                            selected && categoryAccent.selectedBorder,
                            selected && categoryAccent.selectedBg
                          )}
                          aria-pressed={selected}
                        >
                          <CategoryThumbnail category={category} group={resolveGroup(category)} />

                          <span className="min-w-0 flex-1">
                            <span className="line-clamp-2 text-sm font-black leading-5 text-slate-950">
                              {category.name}
                            </span>
                            <span className="mt-1 flex flex-wrap gap-1">
                              {alreadyVisible ? (
                                <span className="inline-flex items-center rounded-none bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                  Visível hoje
                                </span>
                              ) : null}
                              {category.featured ? (
                                <span className="inline-flex items-center rounded-none bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
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
                            className={cn('h-5 w-5 rounded-none border-slate-300', categoryAccent.checkbox)}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}

          {filteredCategories.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-none border border-dashed border-slate-200 bg-slate-50 text-center">
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
            className="h-11 rounded-none border-slate-200 bg-white px-6"
            onClick={resetSelection}
            disabled={!selectionChanged || submitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="h-11 rounded-none bg-blue-600 px-6 font-bold text-white hover:bg-blue-700"
            onClick={submitSelection}
            disabled={!selectionChanged || submitting}
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : selectionChanged ? (
              <Check className="mr-2 h-4 w-4" aria-hidden="true" />
            ) : null}
            {exceedsCategoryLimit ? 'Solicitar aprovação comercial' : 'Revisar seleção'}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  );
}
