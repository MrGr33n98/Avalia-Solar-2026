'use client';

import Image from 'next/image';
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Grid2X2,
  Loader2,
  Search,
  SlidersHorizontal,
  Sparkles,
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

import {
  useCategories,
  type Category,
} from '../hooks/useCategories';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface CategoriesManagementProps {
  companyId: string;
  company?: {
    id?: string | number | null;
    slug?: string | null;
    name?: string | null;
    plan_tier?: string | null;
    feature_access?: Record<
      string,
      FeatureAccessEntry
    > | null;
  } | null;
}

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

const ALL_GROUPS = 'all';
const GROUP_SOLAR = 'Energia Solar';
const GROUP_MOBILITY = 'Mobilidade Elétrica';
const GROUP_OTHER = 'Outras categorias';

const GROUP_ORDER = [
  GROUP_SOLAR,
  GROUP_MOBILITY,
  GROUP_OTHER,
];

const CATEGORY_LIMIT_FEATURE_KEYS = [
  'company_categories_limit',
  'category_limit',
  'categories_limit',
  'profile_categories_limit',
];

const CATEGORY_LIMIT_BY_PLAN: Record<
  string,
  number
> = {
  free: 3,
  essential: 6,
  pro: 12,
  enterprise: 999,
};

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function resolveGroup(category: Category) {
  const value = normalizeText(
    `${category.name} ${category.seo_url || ''}`,
  );

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
      border:
        'border-slate-200 hover:border-emerald-300',
      selectedBorder:
        'border-emerald-400 ring-1 ring-emerald-200',
      selectedBg:
        'bg-gradient-to-br from-white to-emerald-50/60',
      iconBg:
        'border-emerald-100 bg-emerald-50 text-emerald-600',
      checkbox:
        'data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500',
      badge:
        'border-emerald-100 bg-emerald-50 text-emerald-700',
    };
  }

  if (group === GROUP_SOLAR) {
    return {
      border:
        'border-slate-200 hover:border-blue-300',
      selectedBorder:
        'border-blue-500 ring-1 ring-blue-200',
      selectedBg:
        'bg-gradient-to-br from-white to-blue-50/70',
      iconBg:
        'border-amber-100 bg-amber-50 text-amber-500',
      checkbox:
        'data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600',
      badge:
        'border-amber-100 bg-amber-50 text-amber-700',
    };
  }

  return {
    border:
      'border-slate-200 hover:border-slate-300',
    selectedBorder:
      'border-slate-400 ring-1 ring-slate-200',
    selectedBg:
      'bg-gradient-to-br from-white to-slate-50',
    iconBg:
      'border-slate-200 bg-slate-100 text-slate-500',
    checkbox:
      'data-[state=checked]:border-slate-700 data-[state=checked]:bg-slate-700',
    badge:
      'border-slate-200 bg-slate-100 text-slate-600',
  };
}

function getCategoryImage(
  category: Category,
) {
  return (
    category.banner_url ||
    category.icon_url ||
    category.logo?.url ||
    null
  );
}

function CategoryThumbnail({
  category,
  group,
}: {
  category: Category;
  group: string;
}) {
  const imageUrl =
    getCategoryImage(category);

  const accent =
    groupAccent(group);

  const Icon =
    group === GROUP_MOBILITY
      ? Zap
      : group === GROUP_SOLAR
        ? Sun
        : Grid2X2;

  if (imageUrl) {
    return (
      <span className="relative h-[58px] w-[76px] shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm">
        <Image
          src={getFullImageUrl(
            imageUrl,
          )}
          alt=""
          fill
          sizes="76px"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        'flex h-[58px] w-[76px] shrink-0 items-center justify-center rounded-xl border shadow-sm',
        accent.iconBg,
      )}
    >
      <Icon
        className="h-5 w-5"
        aria-hidden="true"
      />
    </span>
  );
}

function uniqueCategories(
  categories: Category[],
) {
  const byId =
    new Map<string, Category>();

  categories.forEach(
    (category) => {
      byId.set(
        String(category.id),
        category,
      );
    },
  );

  return Array.from(
    byId.values(),
  ).sort((a, b) =>
    a.name.localeCompare(
      b.name,
      'pt-BR',
    ),
  );
}

function numericLimitFromEntry(
  entry?: FeatureAccessEntry | null,
) {
  if (!entry) return null;

  const rawValue =
    entry.value ??
    entry.limit?.max ??
    null;

  if (
    typeof rawValue !== 'number' &&
    typeof rawValue !== 'string'
  ) {
    return null;
  }

  const parsed =
    typeof rawValue === 'number'
      ? rawValue
      : Number(rawValue);

  return Number.isFinite(parsed) &&
    parsed > 0
    ? parsed
    : null;
}

function resolveCategoryLimit(
  company?: CategoriesManagementProps['company'],
) {
  for (
    const key of
      CATEGORY_LIMIT_FEATURE_KEYS
  ) {
    const limit =
      numericLimitFromEntry(
        company?.feature_access?.[
          key
        ],
      );

    if (limit) {
      return limit;
    }
  }

  const planTier = (
    company?.plan_tier || 'free'
  ).toLowerCase();

  return (
    CATEGORY_LIMIT_BY_PLAN[
      planTier
    ] ||
    CATEGORY_LIMIT_BY_PLAN.free
  );
}

/* -------------------------------------------------------------------------- */
/*                             MAIN COMPONENT                                 */
/* -------------------------------------------------------------------------- */

export default function CategoriesManagement({
  companyId,
  company,
}: CategoriesManagementProps) {
  const { toast } = useToast();

  const {
    loading,
    categories,
    availableCategories,
    allCategories:
      catalogCategories,
    addCategories,
    removeCategory,
  } = useCategories(companyId);

  const [query, setQuery] =
    useState('');

  const deferredQuery =
    useDeferredValue(query);

  const [
    groupFilter,
    setGroupFilter,
  ] = useState(ALL_GROUPS);

  const [
    selectedIds,
    setSelectedIds,
  ] = useState<string[]>([]);

  const [
    pendingSelectionKey,
    setPendingSelectionKey,
  ] = useState<string | null>(
    null,
  );

  const [
    openGroups,
    setOpenGroups,
  ] = useState<string[]>(
    GROUP_ORDER,
  );

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  /* ------------------------------------------------------------------------ */
  /*                                DERIVED DATA                              */
  /* ------------------------------------------------------------------------ */

  const currentIds =
    useMemo(
      () =>
        categories.map(
          (category) =>
            String(category.id),
        ),
      [categories],
    );

  const currentSet =
    useMemo(
      () =>
        new Set(currentIds),
      [currentIds],
    );

  const selectedSet =
    useMemo(
      () =>
        new Set(selectedIds),
      [selectedIds],
    );

  const categoryLimit =
    useMemo(
      () =>
        resolveCategoryLimit(
          company,
        ),
      [company],
    );

  const exceedsCategoryLimit =
    selectedIds.length >
    categoryLimit;

  const overLimitCount =
    Math.max(
      selectedIds.length -
        categoryLimit,
      0,
    );

  const categoryLimitLabel =
    categoryLimit >= 999
      ? 'ilimitado'
      : `${categoryLimit} categorias`;

  const categoryLimitBadgeText =
    categoryLimit >= 999
      ? 'Categorias ilimitadas'
      : `Até ${categoryLimitLabel}`;

  const publicCompanyPath =
    useMemo(
      () =>
        buildCompanyPath(
          company?.slug,
          company?.name,
          company?.id ||
            companyId,
        ),
      [
        company?.id,
        company?.name,
        company?.slug,
        companyId,
      ],
    );

  const allCategories =
    useMemo(
      () =>
        uniqueCategories([
          ...categories,
          ...availableCategories,
          ...catalogCategories,
        ]),
      [
        availableCategories,
        catalogCategories,
        categories,
      ],
    );

  const groupedCounts =
    useMemo(() => {
      return selectedIds.reduce<
        Record<string, number>
      >(
        (
          acc,
          categoryId,
        ) => {
          const category =
            allCategories.find(
              (item) =>
                String(
                  item.id,
                ) ===
                categoryId,
            );

          if (!category) {
            return acc;
          }

          const group =
            resolveGroup(
              category,
            );

          acc[group] =
            (acc[group] || 0) +
            1;

          return acc;
        },
        {},
      );
    }, [
      allCategories,
      selectedIds,
    ]);

  const groupOptions =
    useMemo(() => {
      const groups =
        new Set<string>(
          allCategories.map(
            resolveGroup,
          ),
        );

      return [
        ALL_GROUPS,
        GROUP_SOLAR,
        GROUP_MOBILITY,
        GROUP_OTHER,
      ].filter(
        (group) =>
          group === ALL_GROUPS ||
          groups.has(group),
      );
    }, [allCategories]);

  const filteredCategories =
    useMemo(() => {
      const normalizedQuery =
        normalizeText(
          deferredQuery.trim(),
        );

      return allCategories.filter(
        (category) => {
          const group =
            resolveGroup(
              category,
            );

          const matchesGroup =
            groupFilter ===
              ALL_GROUPS ||
            group === groupFilter;

          const matchesQuery =
            normalizedQuery.length ===
              0 ||
            normalizeText(
              `${category.name} ${
                category.seo_url ||
                ''
              }`,
            ).includes(
              normalizedQuery,
            );

          return (
            matchesGroup &&
            matchesQuery
          );
        },
      );
    }, [
      allCategories,
      deferredQuery,
      groupFilter,
    ]);

  const categoriesByGroup =
    useMemo(() => {
      return filteredCategories.reduce<
        Record<
          string,
          Category[]
        >
      >(
        (
          acc,
          category,
        ) => {
          const group =
            resolveGroup(
              category,
            );

          acc[group] =
            acc[group] || [];

          acc[group].push(
            category,
          );

          return acc;
        },
        {},
      );
    }, [filteredCategories]);

  const selectionChanged =
    useMemo(() => {
      const selectedKey =
        [...selectedIds]
          .sort()
          .join('|');

      const currentKey =
        [...currentIds]
          .sort()
          .join('|');

      return (
        selectedKey !==
          currentKey &&
        selectedKey !==
          pendingSelectionKey
      );
    }, [
      currentIds,
      pendingSelectionKey,
      selectedIds,
    ]);

  /* ------------------------------------------------------------------------ */
  /*                          ORIGINAL SELECTION SYNC                         */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const currentKey =
      [...currentIds]
        .sort()
        .join('|');

    if (
      pendingSelectionKey ===
      currentKey
    ) {
      setPendingSelectionKey(
        null,
      );
    }

    if (
      !pendingSelectionKey
    ) {
      setSelectedIds(
        currentIds,
      );
    }
  }, [
    currentIds,
    pendingSelectionKey,
  ]);

  /* ------------------------------------------------------------------------ */
  /*                                 ACTIONS                                  */
  /* ------------------------------------------------------------------------ */

  const toggleCategory = (
    categoryId: string,
  ) => {
    setSelectedIds(
      (current) => {
        if (
          current.includes(
            categoryId,
          )
        ) {
          return current.filter(
            (id) =>
              id !==
              categoryId,
          );
        }

        const next = [
          ...current,
          categoryId,
        ];

        if (
          next.length >
          categoryLimit
        ) {
          toast({
            title:
              'Limite do plano excedido',
            description: `Seu plano inclui ${categoryLimitLabel}. A seleção extra será enviada para aprovação comercial.`,
          });
        }

        return next;
      },
    );
  };

  const clearSelection =
    () =>
      setSelectedIds([]);

  const resetSelection =
    () => {
      setPendingSelectionKey(
        null,
      );

      setSelectedIds(
        currentIds,
      );
    };

  const toggleGroup = (
    group: string,
  ) => {
    setOpenGroups(
      (current) =>
        current.includes(
          group,
        )
          ? current.filter(
              (item) =>
                item !==
                group,
            )
          : [
              ...current,
              group,
            ],
    );
  };

  const submitSelection =
    async () => {
      if (
        !selectionChanged ||
        submitting
      ) {
        return;
      }

      const targetIds =
        selectedIds;

      const targetKey =
        [...targetIds]
          .sort()
          .join('|');

      const toAdd =
        selectedIds.filter(
          (id) =>
            !currentSet.has(
              id,
            ),
        );

      const toRemove =
        currentIds.filter(
          (id) =>
            !selectedSet.has(
              id,
            ),
        );

      setSubmitting(true);

      try {
        let isDirectUpdate =
          true;

        if (
          toAdd.length > 0
        ) {
          const res =
            await addCategories(
              toAdd,
            );

          if (
            res &&
            !res.direct_update
          ) {
            isDirectUpdate =
              false;
          }
        }

        for (
          const categoryId of
            toRemove
        ) {
          await removeCategory(
            categoryId,
          );
        }

        setSelectedIds(
          targetIds,
        );

        if (
          !isDirectUpdate
        ) {
          setPendingSelectionKey(
            targetKey,
          );

          toast({
            title:
              exceedsCategoryLimit
                ? 'Solicitação comercial enviada'
                : 'Solicitação enviada',
            description:
              exceedsCategoryLimit
                ? 'O admin precisa aprovar a exceção ou ajustar o plano antes da publicação.'
                : 'As categorias serão publicadas após aprovação do admin.',
          });
        } else {
          setPendingSelectionKey(
            null,
          );
        }
      } finally {
        setSubmitting(false);
      }
    };

  /* ------------------------------------------------------------------------ */
  /*                                  LOADING                                 */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="rounded-[26px] border border-slate-200 bg-white p-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-72 rounded-xl" />
            <Skeleton className="h-4 w-[420px] max-w-full rounded-lg" />
          </div>
        </div>

        <Skeleton className="h-28 w-full rounded-[26px]" />
        <Skeleton className="h-14 w-full rounded-2xl" />

        <div className="rounded-[26px] border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({
              length: 8,
            }).map(
              (_, index) => (
                <Skeleton
                  key={index}
                  className="h-[86px] rounded-2xl"
                />
              ),
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                                    VIEW                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <section className="space-y-5 text-slate-950">
      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                             */}
      {/* ------------------------------------------------------------------ */}

      <header className="relative overflow-hidden rounded-[26px] border border-slate-200/80 bg-white px-5 py-5 shadow-[0_10px_36px_rgba(15,23,42,0.035)] sm:px-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-100/50 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 shadow-sm sm:flex">
              <Grid2X2
                className="h-5 w-5"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Dashboard / Categorias
              </p>

              <h2 className="mt-1.5 text-[26px] font-bold tracking-[-0.035em] text-slate-950 sm:text-[30px]">
                Categorias da sua empresa
              </h2>

              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                Selecione as categorias que melhor
                representam os serviços oferecidos.
                Alterações são enviadas para aprovação
                antes de aparecerem publicamente.
              </p>

              {pendingSelectionKey ? (
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Solicitação enviada para aprovação
                </span>
              ) : null}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-10 w-full justify-center gap-2 rounded-xl border-slate-200 bg-white px-4 font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 lg:w-auto"
            onClick={() =>
              window.open(
                publicCompanyPath,
                '_blank',
                'noopener,noreferrer',
              )
            }
          >
            Ver como aparece no site
            <ExternalLink
              className="h-3.5 w-3.5"
              aria-hidden="true"
            />
          </Button>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* SUMMARY                                                            */}
      {/* ------------------------------------------------------------------ */}

      <div className="rounded-[26px] border border-slate-200/80 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.03)] sm:p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_8px_18px_rgba(37,99,235,0.18)]">
              <Grid2X2
                className="h-5 w-5"
                aria-hidden="true"
              />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-950">
                Resumo da seleção
              </h3>

              <p className="mt-1 text-sm font-semibold text-slate-700">
                {selectedIds.length}{' '}
                {selectedIds.length === 1
                  ? 'categoria selecionada'
                  : 'categorias selecionadas'}
              </p>

              <p className="mt-1 text-xs font-medium text-slate-500">
                Limite do plano: {categoryLimitLabel}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              className={cn(
                'h-8 rounded-full border px-3 font-bold',
                exceedsCategoryLimit
                  ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50'
                  : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-100',
              )}
            >
              {exceedsCategoryLimit
                ? `${overLimitCount} acima do limite`
                : categoryLimitBadgeText}
            </Badge>

            <Badge className="h-8 rounded-full border border-amber-100 bg-amber-50 px-3 font-bold text-amber-700 hover:bg-amber-50">
              <Sun
                className="mr-2 h-3.5 w-3.5"
                aria-hidden="true"
              />
              {groupedCounts[GROUP_SOLAR] || 0}{' '}
              Energia Solar
            </Badge>

            <Badge className="h-8 rounded-full border border-emerald-100 bg-emerald-50 px-3 font-bold text-emerald-700 hover:bg-emerald-50">
              <Zap
                className="mr-2 h-3.5 w-3.5"
                aria-hidden="true"
              />
              {groupedCounts[GROUP_MOBILITY] || 0}{' '}
              Mobilidade Elétrica
            </Badge>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl border-slate-200 bg-white px-4 font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
            onClick={clearSelection}
            disabled={
              selectedIds.length === 0 ||
              submitting
            }
          >
            Limpar seleção
            <Trash2
              className="ml-2 h-4 w-4"
              aria-hidden="true"
            />
          </Button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* LIMIT WARNING                                                      */}
      {/* ------------------------------------------------------------------ */}

      {exceedsCategoryLimit ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-900 shadow-sm">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <Sparkles className="h-4 w-4" />
          </span>

          <div>
            <p className="font-bold">
              Seleção acima do limite atual
            </p>

            <p className="mt-0.5 text-xs leading-5 text-amber-800">
              Seu plano permite {categoryLimitLabel}. As{' '}
              {overLimitCount}{' '}
              {overLimitCount === 1
                ? 'categoria extra ficará'
                : 'categorias extras ficarão'}{' '}
              pendente(s) de aprovação comercial no
              ActiveAdmin.
            </p>
          </div>
        </div>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* SEARCH / FILTER                                                    */}
      {/* ------------------------------------------------------------------ */}

      <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_6px_24px_rgba(15,23,42,0.025)]">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px]">
          <label className="relative">
            <span className="sr-only">
              Buscar categorias
            </span>

            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <Input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Buscar categorias..."
              className="h-11 rounded-xl border-slate-200 bg-slate-50/50 pl-10 text-sm shadow-none transition hover:border-slate-300 hover:bg-white focus-visible:border-blue-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-blue-500/10"
            />
          </label>

          <Select
            value={groupFilter}
            onValueChange={setGroupFilter}
          >
            <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white shadow-none focus:ring-4 focus:ring-blue-500/10">
              <div className="flex min-w-0 items-center gap-2">
                <SlidersHorizontal
                  className="h-4 w-4 shrink-0 text-slate-400"
                  aria-hidden="true"
                />

                <SelectValue placeholder="Filtrar por grupo" />
              </div>
            </SelectTrigger>

            <SelectContent>
              {groupOptions.map(
                (group) => (
                  <SelectItem
                    key={group}
                    value={group}
                  >
                    {group === ALL_GROUPS
                      ? 'Todos os grupos'
                      : group}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* CATEGORY AREA                                                      */}
      {/* ------------------------------------------------------------------ */}

      <ScrollArea className="h-[560px] rounded-[26px] border border-slate-200/80 bg-white p-4 shadow-[0_10px_36px_rgba(15,23,42,0.035)]">
        <div className="space-y-4 pr-3">
          {GROUP_ORDER.map(
            (group) => {
              const items =
                categoriesByGroup[
                  group
                ] || [];

              if (
                items.length === 0
              ) {
                return null;
              }

              const groupOpen =
                openGroups.includes(
                  group,
                );

              const GroupIcon =
                group ===
                GROUP_MOBILITY
                  ? Zap
                  : group ===
                      GROUP_SOLAR
                    ? Sun
                    : Grid2X2;

              const accent =
                groupAccent(group);

              return (
                <div
                  key={group}
                  className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/30"
                >
                  <button
                    type="button"
                    onClick={() =>
                      toggleGroup(
                        group,
                      )
                    }
                    className="flex w-full items-center justify-between gap-4 bg-white px-4 py-3.5 text-left transition-colors hover:bg-slate-50"
                    aria-expanded={
                      groupOpen
                    }
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border',
                          accent.iconBg,
                        )}
                      >
                        <GroupIcon className="h-4 w-4" />
                      </span>

                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-[15px] font-bold tracking-[-0.02em] text-slate-950">
                            {group}
                          </span>

                          <Badge
                            variant="secondary"
                            className="h-5 rounded-full border border-slate-200 bg-slate-100 px-2 text-[9px] font-bold text-slate-500 hover:bg-slate-100"
                          >
                            {items.length}{' '}
                            {items.length ===
                            1
                              ? 'categoria'
                              : 'categorias'}
                          </Badge>
                        </span>

                        <span className="mt-0.5 block text-[11px] font-medium text-slate-500">
                          {groupedCounts[
                            group
                          ] || 0}{' '}
                          selecionada(s)
                        </span>
                      </span>
                    </span>

                    <span className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      {groupOpen
                        ? 'Fechar'
                        : 'Abrir'}

                      <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 transition-transform duration-200',
                            groupOpen &&
                              'rotate-180',
                          )}
                          aria-hidden="true"
                        />
                      </span>
                    </span>
                  </button>

                  {groupOpen ? (
                    <div className="border-t border-slate-100 p-3 sm:p-4">
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {items.map(
                          (category) => {
                            const categoryId =
                              String(
                                category.id,
                              );

                            const selected =
                              selectedSet.has(
                                categoryId,
                              );

                            const alreadyVisible =
                              currentSet.has(
                                categoryId,
                              );

                            const categoryAccent =
                              groupAccent(
                                resolveGroup(
                                  category,
                                ),
                              );

                            return (
                              <div
                                key={
                                  categoryId
                                }
                                role="button"
                                tabIndex={0}
                                onClick={() =>
                                  toggleCategory(
                                    categoryId,
                                  )
                                }
                                onKeyDown={(
                                  event,
                                ) => {
                                  if (
                                    event.key ===
                                      'Enter' ||
                                    event.key ===
                                      ' '
                                  ) {
                                    event.preventDefault();

                                    toggleCategory(
                                      categoryId,
                                    );
                                  }
                                }}
                                className={cn(
                                  'group relative flex min-h-[86px] w-full cursor-pointer items-center gap-3 overflow-hidden rounded-2xl border bg-white p-3 text-left',
                                  'shadow-[0_1px_2px_rgba(15,23,42,0.02),0_6px_18px_rgba(15,23,42,0.025)]',
                                  'transition-all duration-200',
                                  'hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(15,23,42,0.07)]',
                                  categoryAccent.border,
                                  selected &&
                                    categoryAccent.selectedBorder,
                                  selected &&
                                    categoryAccent.selectedBg,
                                )}
                                aria-pressed={
                                  selected
                                }
                              >
                                {selected ? (
                                  <span className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-blue-600" />
                                ) : null}

                                <CategoryThumbnail
                                  category={
                                    category
                                  }
                                  group={resolveGroup(
                                    category,
                                  )}
                                />

                                <span className="min-w-0 flex-1">
                                  <span className="line-clamp-2 text-[13px] font-bold leading-[18px] tracking-[-0.01em] text-slate-950">
                                    {
                                      category.name
                                    }
                                  </span>

                                  <span className="mt-2 flex flex-wrap gap-1.5">
                                    {alreadyVisible ? (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        Visível hoje
                                      </span>
                                    ) : null}

                                    {category.featured ? (
                                      <span className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">
                                        Destaque
                                      </span>
                                    ) : null}
                                  </span>
                                </span>

                                <Checkbox
                                  checked={
                                    selected
                                  }
                                  onCheckedChange={() =>
                                    toggleCategory(
                                      categoryId,
                                    )
                                  }
                                  onClick={(
                                    event,
                                  ) =>
                                    event.stopPropagation()
                                  }
                                  aria-label={`Selecionar ${category.name}`}
                                  className={cn(
                                    'h-[18px] w-[18px] shrink-0 rounded-[5px] border-slate-300 shadow-none',
                                    categoryAccent.checkbox,
                                  )}
                                />
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            },
          )}

          {filteredCategories.length ===
          0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-sm">
                <Search
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </span>

              <h3 className="mt-3 text-sm font-bold text-slate-950">
                Nenhuma categoria encontrada
              </h3>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                Ajuste a busca ou o filtro de grupo
                para visualizar outras categorias.
              </p>
            </div>
          ) : null}
        </div>
      </ScrollArea>

      {/* ------------------------------------------------------------------ */}
      {/* ACTION BAR                                                         */}
      {/* ------------------------------------------------------------------ */}

      <div className="sticky bottom-4 z-20">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white/95 px-4 py-3.5 shadow-[0_18px_50px_rgba(15,23,42,0.13)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                selectionChanged
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-slate-100 text-slate-500',
              )}
            >
              {selectionChanged ? (
                <Sparkles className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
            </span>

            <div>
              <p className="text-sm font-bold text-slate-950">
                {selectedIds.length}{' '}
                {selectedIds.length === 1
                  ? 'categoria selecionada'
                  : 'categorias selecionadas'}
              </p>

              <p className="text-[11px] text-slate-500">
                {selectionChanged
                  ? 'Existem alterações ainda não enviadas.'
                  : pendingSelectionKey
                    ? 'Alterações aguardando aprovação.'
                    : 'Sua seleção está atualizada.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl border-slate-200 bg-white px-5 font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              onClick={resetSelection}
              disabled={
                !selectionChanged ||
                submitting
              }
            >
              Cancelar
            </Button>

            <Button
              type="button"
              className="h-10 rounded-xl bg-blue-600 px-5 font-bold text-white shadow-[0_8px_18px_rgba(37,99,235,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_10px_24px_rgba(37,99,235,0.23)]"
              onClick={submitSelection}
              disabled={
                !selectionChanged ||
                submitting
              }
            >
              {submitting ? (
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : selectionChanged ? (
                <Check
                  className="mr-2 h-4 w-4"
                  aria-hidden="true"
                />
              ) : null}

              {exceedsCategoryLimit
                ? 'Solicitar aprovação comercial'
                : 'Revisar seleção'}

              <ArrowRight
                className="ml-2 h-4 w-4"
                aria-hidden="true"
              />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}