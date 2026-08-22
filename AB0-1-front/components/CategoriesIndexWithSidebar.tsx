'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
} from 'lucide-react';

import {
  useCategoriesTree,
  type CategoryTreeNode,
} from '@/hooks/useCategoriesTree';
import { useFeaturedCategoriesQuery } from '@/hooks/useCategoriesQuery';
import CategoryVisualAsset from '@/components/categories/CategoryVisualAsset';
import BannerByLocation from '@/components/BannerByLocation';

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

function getCategoryHref(
  seo_url: string | undefined,
  slug: string,
) {
  return `/categories/${seo_url || slug}`;
}

/** Letras do alfabeto para nomear grupos: A, B, C... */
function groupLabel(index: number) {
  return String.fromCharCode(65 + index);
}

function useDebounce<T>(
  value: T,
  delay: number,
): T {
  const [debouncedValue, setDebouncedValue] =
    useState(value);

  useEffect(() => {
    const handler = setTimeout(
      () => setDebouncedValue(value),
      delay,
    );

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/** Determina se uma categoria possui avaliações */
function hasEvaluations(
  category: CategoryTreeNode,
) {
  return Number(category.reviews_count || 0) > 0;
}

/* -------------------------------------------------------------------------- */
/*                                  SKELETON                                  */
/* -------------------------------------------------------------------------- */

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[#f8fafc] animate-pulse">
      <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-5 md:py-12">
        <div className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.45fr_.8fr]">
            <div className="space-y-5">
              <div className="h-3 w-32 rounded-full bg-slate-200" />
              <div className="h-20 w-3/4 rounded-2xl bg-slate-200" />
              <div className="h-14 w-full max-w-2xl rounded-2xl bg-slate-100" />
            </div>

            <div className="h-40 rounded-[22px] bg-slate-100" />
          </div>
        </div>

        <div className="mt-5 h-16 rounded-2xl border border-slate-200 bg-white" />

        <div className="mt-10">
          <div className="mb-5 h-8 w-64 rounded-lg bg-slate-200" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-[310px] rounded-[22px] border border-slate-200 bg-white"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              FEATURED CARD                                 */
/* -------------------------------------------------------------------------- */

interface FeaturedCardProps {
  category: CategoryTreeNode;
}

function FeaturedCard({
  category,
}: FeaturedCardProps) {
  const href = getCategoryHref(
    category.seo_url,
    category.slug,
  );

  const averageRating = Number(
    category.average_rating || 0,
  );

  const reviewsCount = Number(
    category.reviews_count || 0,
  );

  return (
    <Link
      href={href}
      className="
        group/card
        relative
        flex
        h-full
        min-h-[292px]
        flex-col
        overflow-hidden
        rounded-[22px]
        border
        border-slate-200/80
        bg-white
        shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)]
        outline-none
        transition-[transform,border-color,box-shadow]
        duration-300
        ease-out
        hover:-translate-y-1
        hover:border-blue-200
        hover:shadow-[0_18px_42px_rgba(15,23,42,0.09)]
        focus-visible:ring-2
        focus-visible:ring-blue-500
        focus-visible:ring-offset-2
      "
    >
      {/* VISUAL */}

      <div className="relative h-[132px] shrink-0 overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100/80 sm:h-[140px]">
        <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover/card:scale-[1.035]">
          <CategoryVisualAsset
            category={category}
            priority
          />
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-slate-950/[0.025]"
        />
      </div>

      {/* BODY */}

      <div className="flex flex-1 flex-col px-4 pb-0 pt-4 sm:px-[18px]">
        <h3 className="line-clamp-2 text-[14px] font-bold leading-[1.25rem] tracking-[-0.015em] text-slate-950 transition-colors group-hover/card:text-blue-700">
          {category.name}
        </h3>

        <p className="mt-1.5 line-clamp-2 min-h-[34px] text-[12px] leading-[1.08rem] text-slate-500">
          Compare as melhores empresas de{' '}
          {category.name.toLowerCase()} e veja
          avaliações do mercado.
        </p>

        {/* REVIEW */}

        <div className="mt-3 flex min-h-6 items-center gap-1.5 text-[11.5px] font-medium text-slate-600">
          {reviewsCount > 0 &&
          averageRating > 0 ? (
            <>
              <Star
                className="h-3.5 w-3.5 fill-amber-400 stroke-amber-400"
                aria-hidden="true"
              />

              <span className="font-bold text-slate-800">
                {averageRating.toFixed(1)}
              </span>

              <span className="text-slate-300">
                •
              </span>

              <span>
                {reviewsCount}{' '}
                {reviewsCount === 1
                  ? 'avaliação'
                  : 'avaliações'}
              </span>
            </>
          ) : (
            <span className="text-slate-400">
              Sem avaliações ainda
            </span>
          )}
        </div>

        {/* FOOTER */}

        <div className="mt-auto flex min-h-[50px] items-center justify-between gap-2 border-t border-slate-100">
          <span className="inline-flex min-w-0 items-center gap-2 text-[11px] font-semibold text-slate-600">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover/card:bg-blue-100">
              <Building2
                className="h-3.5 w-3.5"
                aria-hidden="true"
              />
            </span>

            <span className="truncate">
              {category.companies_count ?? 0}{' '}
              {category.companies_count === 1
                ? 'empresa'
                : 'empresas'}
            </span>
          </span>

          <span className="inline-flex shrink-0 items-center text-[11px] font-bold text-blue-700">
            Explorar

            <ArrowRight
              className="ml-1.5 h-3.5 w-3.5 transition-transform duration-300 group-hover/card:translate-x-1"
              aria-hidden="true"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*                                CATEGORY ROW                                */
/* -------------------------------------------------------------------------- */

function CategoryRow({
  category,
}: {
  category: CategoryTreeNode;
}) {
  const href = getCategoryHref(
    category.seo_url,
    category.slug,
  );

  return (
    <Link
      href={href}
      className="
        group/row
        flex
        min-h-[70px]
        items-center
        justify-between
        gap-3
        px-3
        py-3
        outline-none
        transition-colors
        duration-200
        hover:bg-blue-50/30
        focus-visible:bg-blue-50/50
        sm:px-4
        md:min-h-[76px]
      "
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        {/* ICON */}

        <div
          className="
            relative
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            overflow-hidden
            rounded-xl
            border
            border-slate-100
            bg-slate-50
            transition-all
            duration-200
            group-hover/row:border-blue-100
            group-hover/row:bg-blue-50/60
            sm:h-12
            sm:w-12
            [&_img]:!p-1.5
          "
        >
          <CategoryVisualAsset
            category={category}
          />
        </div>

        {/* TEXT */}

        <div className="min-w-0">
          <h3 className="truncate text-[13px] font-bold leading-tight tracking-[-0.01em] text-slate-900 transition-colors group-hover/row:text-blue-700 sm:text-[14px]">
            {category.name}
          </h3>

          <p className="mt-1 line-clamp-1 text-[11.5px] leading-relaxed text-slate-500 sm:text-[12px]">
            Compare as melhores empresas de{' '}
            {category.name.toLowerCase()} no
            Brasil.
          </p>
        </div>
      </div>

      {/* ARROW */}

      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-300 transition-all duration-200 group-hover/row:bg-white group-hover/row:text-blue-600 group-hover/row:shadow-sm">
        <ChevronRight
          className="h-4 w-4 transition-transform duration-200 group-hover/row:translate-x-0.5"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

export default function CategoriesIndexWithSidebar() {
  /* ------------------------------------------------------------------------ */
  /* STATE — PRESERVADO                                                      */
  /* ------------------------------------------------------------------------ */

  const [searchTerm, setSearchTerm] =
    useState('');

  const [kindFilter, setKindFilter] =
    useState('');

  const [sortBy, setSortBy] = useState<
    'companies_desc' | 'name_asc'
  >('companies_desc');

  const [onlyReviewed, setOnlyReviewed] =
    useState(false);

  const [page, setPage] = useState(1);

  const PER_PAGE = 10;

  const debouncedSearch = useDebounce(
    searchTerm,
    350,
  );

  /* ------------------------------------------------------------------------ */
  /* DATA — PRESERVADO                                                       */
  /* ------------------------------------------------------------------------ */

  const {
    categories: tree,
    loading: treeLoading,
    dataSource,
  } = useCategoriesTree();

  const {
    data: featuredData,
    isLoading: featuredLoading,
  } = useFeaturedCategoriesQuery(4);

  const featuredCategories =
    featuredData?.data ?? [];

  /* ------------------------------------------------------------------------ */
  /* FILTERING / SORTING — PRESERVADO                                        */
  /* ------------------------------------------------------------------------ */

  const filteredGroups = useMemo(() => {
    let groups = tree;

    /* SEARCH */

    if (debouncedSearch.trim()) {
      const q =
        debouncedSearch.toLowerCase();

      groups = groups
        .map((g) => {
          const gMatches = g.name
            .toLowerCase()
            .includes(q);

          const filteredChildren = (
            g.children ?? []
          ).filter((c) =>
            c.name
              .toLowerCase()
              .includes(q),
          );

          if (gMatches) {
            return { ...g };
          }

          if (
            filteredChildren.length > 0
          ) {
            return {
              ...g,
              children:
                filteredChildren,
            };
          }

          return null;
        })
        .filter(
          Boolean,
        ) as CategoryTreeNode[];
    }

    /* TYPE */

    if (kindFilter) {
      groups = groups
        .map((g) => {
          const matchesKind =
            (kindFilter === 'solar' &&
              !g.slug.includes(
                'mobilidade',
              )) ||
            (kindFilter ===
              'mobility' &&
              g.slug.includes(
                'mobilidade',
              ));

          const filteredChildren = (
            g.children ?? []
          ).filter((c) => {
            return (
              (kindFilter === 'solar' &&
                !c.slug.includes(
                  'mobilidade',
                )) ||
              (kindFilter ===
                'mobility' &&
                c.slug.includes(
                  'mobilidade',
                ))
            );
          });

          if (matchesKind) {
            return { ...g };
          }

          if (
            filteredChildren.length > 0
          ) {
            return {
              ...g,
              children:
                filteredChildren,
            };
          }

          return null;
        })
        .filter(
          Boolean,
        ) as CategoryTreeNode[];
    }

    /* ONLY REVIEWED */

    if (onlyReviewed) {
      groups = groups
        .map((g) => {
          const gHasReview =
            hasEvaluations(g);

          const filteredChildren = (
            g.children ?? []
          ).filter(hasEvaluations);

          if (
            filteredChildren.length > 0
          ) {
            return {
              ...g,
              children:
                filteredChildren,
            };
          }

          if (gHasReview) {
            return {
              ...g,
              children: [],
            };
          }

          return null;
        })
        .filter(
          Boolean,
        ) as CategoryTreeNode[];
    }

    /* SORT */

    if (sortBy === 'name_asc') {
      groups = [...groups].sort(
        (a, b) =>
          a.name.localeCompare(
            b.name,
            'pt-BR',
          ),
      );
    } else {
      groups = [...groups].sort(
        (a, b) =>
          (b.companies_count ?? 0) -
          (a.companies_count ?? 0),
      );
    }

    return groups;
  }, [
    tree,
    debouncedSearch,
    kindFilter,
    onlyReviewed,
    sortBy,
  ]);

  /* ------------------------------------------------------------------------ */
  /* PAGINATION — PRESERVADO                                                 */
  /* ------------------------------------------------------------------------ */

  const totalGroups =
    filteredGroups.length;

  const totalPages = Math.max(
    1,
    Math.ceil(totalGroups / PER_PAGE),
  );

  const paginatedGroups =
    filteredGroups.slice(
      (page - 1) * PER_PAGE,
      page * PER_PAGE,
    );

  const totalResults = useMemo(
    () =>
      filteredGroups.reduce(
        (acc, g) =>
          acc +
          1 +
          (g.children?.length ?? 0),
        0,
      ),
    [filteredGroups],
  );

  if (
    treeLoading &&
    tree.length === 0
  ) {
    return <PageSkeleton />;
  }

  const showSearch =
    debouncedSearch.trim().length > 0;

  /* ------------------------------------------------------------------------ */
  /* RENDER                                                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 antialiased">
      {/* ================================================================== */}
      {/* HERO                                                               */}
      {/* ================================================================== */}

      <section className="px-4 pb-4 pt-5 sm:px-5 md:pb-6 md:pt-8">
        <div className="mx-auto max-w-[1240px]">
          <div
            className="
              relative
              overflow-hidden
              rounded-[24px]
              border
              border-slate-200/70
              bg-white
              shadow-[0_1px_2px_rgba(15,23,42,0.02),0_12px_38px_rgba(15,23,42,0.035)]
              sm:rounded-[28px]
            "
          >
            {/* decorative glow */}

            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-32 -top-40 h-[380px] w-[380px] rounded-full bg-blue-50/80 blur-3xl"
            />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-48 -left-40 h-[360px] w-[360px] rounded-full bg-slate-100/80 blur-3xl"
            />

            <div className="relative grid grid-cols-1 gap-6 p-5 sm:p-7 md:p-9 lg:grid-cols-[1.45fr_.8fr] lg:gap-10 lg:p-10">
              {/* LEFT */}

              <div>
                <div className="mb-4 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 sm:text-[11px]">
                  <span>Início</span>

                  <ChevronRight className="h-3 w-3" />

                  <span>Avalia Solar</span>

                  <ChevronRight className="h-3 w-3" />

                  <span className="text-blue-600">
                    Categorias
                  </span>
                </div>

                <h1 className="max-w-[680px] text-[36px] font-black leading-[0.98] tracking-[-0.045em] text-slate-950 sm:text-[46px] md:text-[54px] lg:text-[58px]">
                  Energia solar e
                  <br className="hidden sm:block" />{' '}
                  mobilidade elétrica.
                </h1>

                <p className="mt-4 max-w-[600px] text-[14px] leading-6 text-slate-500 sm:text-[15px]">
                  Encontre soluções, compare
                  empresas e tome decisões com
                  mais segurança e confiança.
                </p>

                {/* SEARCH */}

                <div
                  className="
                    mt-6
                    flex
                    min-h-[52px]
                    w-full
                    max-w-[700px]
                    overflow-hidden
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    shadow-[0_4px_18px_rgba(15,23,42,0.04)]
                    transition-all
                    focus-within:border-blue-400
                    focus-within:ring-4
                    focus-within:ring-blue-500/10
                  "
                >
                  <div className="flex items-center pl-4 text-slate-400">
                    <Search
                      className="h-[18px] w-[18px]"
                      aria-hidden="true"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Buscar categorias — ex.: baterias, wallbox, energia rural"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(
                        e.target.value,
                      );
                      setPage(1);
                    }}
                    className="
                      min-w-0
                      flex-1
                      bg-transparent
                      px-3
                      py-3.5
                      text-[13px]
                      text-slate-800
                      outline-none
                      placeholder:text-slate-400
                      sm:text-[14px]
                    "
                  />

                  <button
                    type="button"
                    className="
                      m-1.5
                      hidden
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-blue-600
                      px-6
                      text-[12px]
                      font-bold
                      text-white
                      shadow-sm
                      transition-all
                      hover:bg-blue-700
                      hover:shadow-md
                      active:scale-[0.98]
                      sm:flex
                    "
                  >
                    Buscar
                  </button>
                </div>
              </div>

              {/* RIGHT / TRUST */}

              <div className="flex h-full items-center">
                <div
                  className="
                    w-full
                    rounded-[20px]
                    border
                    border-slate-200/70
                    bg-slate-50/70
                    p-5
                    sm:p-6
                    lg:p-7
                  "
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                    <Sparkles
                      className="h-[18px] w-[18px]"
                      aria-hidden="true"
                    />
                  </div>

                  <p className="text-[13px] leading-6 text-slate-600 sm:text-[14px]">
                    De painéis e inversores a
                    wallbox, eletropostos e
                    frotas elétricas. Compare
                    empresas verificadas e
                    avaliações reais em cada
                    segmento.
                  </p>

                  <div
                    className="
                      mt-5
                      inline-flex
                      max-w-full
                      items-center
                      gap-2
                      rounded-xl
                      border
                      border-emerald-100
                      bg-emerald-50/80
                      px-3
                      py-2.5
                      text-[11px]
                      font-semibold
                      leading-4
                      text-emerald-800
                      sm:text-[12px]
                    "
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <Check
                        className="h-3 w-3 text-emerald-700"
                        aria-hidden="true"
                      />
                    </span>

                    <span>
                      Todas as empresas passam
                      por verificação documental
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FILTER TOOLBAR                                                     */}
      {/* ================================================================== */}

      <section className="px-4 py-2 sm:px-5">
        <div className="mx-auto max-w-[1240px]">
          <div
            className="
              flex
              flex-col
              gap-3
              rounded-2xl
              border
              border-slate-200/80
              bg-white
              p-3
              shadow-[0_4px_18px_rgba(15,23,42,0.025)]
              md:flex-row
              md:items-center
              md:justify-between
            "
          >
            <div className="flex flex-wrap items-center gap-2">
              {/* FILTER LABEL */}

              <div className="hidden h-10 items-center gap-2 px-2 text-[12px] font-bold text-slate-700 sm:flex">
                <SlidersHorizontal
                  className="h-4 w-4 text-blue-600"
                  aria-hidden="true"
                />

                Filtros
              </div>

              {/* TYPE */}

              <div className="flex min-h-10 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 sm:flex-none">
                <span className="hidden text-[9px] font-bold uppercase tracking-[.14em] text-slate-400 lg:inline">
                  Tipo
                </span>

                <select
                  value={kindFilter}
                  onChange={(e) => {
                    setKindFilter(
                      e.target.value,
                    );
                    setPage(1);
                  }}
                  className="min-w-0 cursor-pointer bg-transparent text-[12px] font-bold text-slate-700 outline-none"
                >
                  <option value="">
                    Qualquer solução
                  </option>

                  <option value="solar">
                    Energia solar
                  </option>

                  <option value="mobility">
                    Mobilidade elétrica
                  </option>
                </select>
              </div>

              {/* SORT */}

              <div className="flex min-h-10 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 sm:flex-none">
                <span className="hidden text-[9px] font-bold uppercase tracking-[.14em] text-slate-400 lg:inline">
                  Ordenar
                </span>

                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target
                        .value as typeof sortBy,
                    )
                  }
                  className="min-w-0 cursor-pointer bg-transparent text-[12px] font-bold text-slate-700 outline-none"
                >
                  <option value="companies_desc">
                    Mais empresas
                  </option>

                  <option value="name_asc">
                    Nome (A–Z)
                  </option>
                </select>
              </div>

              {/* REVIEW SWITCH */}

              <label
                className="
                  flex
                  min-h-10
                  cursor-pointer
                  select-none
                  items-center
                  gap-2.5
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50/60
                  px-3
                "
              >
                <input
                  type="checkbox"
                  checked={onlyReviewed}
                  onChange={(e) => {
                    setOnlyReviewed(
                      e.target.checked,
                    );
                    setPage(1);
                  }}
                  className="peer sr-only"
                />

                <span className="text-[10px] font-bold text-slate-600 sm:text-[11px]">
                  Somente com avaliações
                </span>

                <div
                  className="
                    relative
                    h-[18px]
                    w-9
                    rounded-full
                    bg-slate-200
                    transition-colors
                    after:absolute
                    after:left-[2px]
                    after:top-[2px]
                    after:h-[14px]
                    after:w-[14px]
                    after:rounded-full
                    after:border
                    after:border-slate-200
                    after:bg-white
                    after:shadow-sm
                    after:transition-transform
                    after:content-['']
                    peer-checked:bg-blue-600
                    peer-checked:after:translate-x-[18px]
                  "
                />
              </label>
            </div>

            {/* RESULTS */}

            <div className="flex items-center justify-between border-t border-slate-100 px-1 pt-3 text-[12px] font-medium text-slate-500 md:border-0 md:px-3 md:pt-0">
              <span className="md:hidden">
                Resultados encontrados
              </span>

              <span>
                <strong className="font-black text-blue-600">
                  {totalResults}
                </strong>{' '}
                {totalResults === 1
                  ? 'resultado'
                  : 'resultados'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* STATIC DATA WARNING                                                */}
      {/* ================================================================== */}

      {dataSource === 'static' && (
        <div className="mx-auto mt-3 max-w-[1240px] px-4 sm:px-5">
          <div
            role="status"
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-[11px] font-medium text-amber-900"
          >
            Não foi possível atualizar o
            catálogo agora. Exibindo a última
            estrutura disponível; tente
            novamente em instantes.
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* MAIN CONTENT                                                       */}
      {/* ================================================================== */}

      <main className="mx-auto max-w-[1240px] px-4 pb-8 sm:px-5">
        {/* BANNER */}

        <div className="pt-6">
          <div className="overflow-hidden rounded-2xl">
            <BannerByLocation
              location="categories_top"
              limit={1}
            />
          </div>
        </div>

        {/* ================================================================ */}
        {/* FEATURED                                                        */}
        {/* ================================================================ */}

        {!showSearch &&
          featuredCategories.length > 0 && (
            <section className="pt-10 md:pt-12">
              <div className="mb-5 flex flex-col gap-1 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[.15em] text-blue-600">
                    Seleção Avalia Solar
                  </span>

                  <h2 className="mt-1 text-[22px] font-black tracking-[-0.025em] text-slate-950 sm:text-[25px]">
                    Categorias em destaque
                  </h2>
                </div>

                <p className="text-[11.5px] text-slate-500 sm:text-[12px]">
                  Os segmentos mais procurados
                  da plataforma
                </p>
              </div>

              <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4 lg:gap-5">
                {featuredLoading
                  ? [1, 2, 3, 4].map(
                      (i) => (
                        <div
                          key={i}
                          className="h-[292px] min-w-[82vw] snap-start rounded-[22px] border border-slate-200 bg-white animate-pulse sm:min-w-0"
                        />
                      ),
                    )
                  : featuredCategories
                      .slice(0, 4)
                      .map((cat) => {
                        const node: CategoryTreeNode =
                          {
                            id: cat.id,
                            name: cat.name,
                            slug:
                              cat.seo_url ||
                              cat.slug ||
                              '',
                            seo_url:
                              cat.seo_url,
                            parent_id: null,
                            companies_count:
                              cat.companies_count ??
                              0,
                            products_count:
                              cat.products_count ??
                              0,
                            icon_url:
                              cat.icon_url ??
                              undefined,
                            children: [],
                          };

                        return (
                          <div
                            key={cat.id}
                            className="min-w-[82vw] snap-start sm:min-w-0"
                          >
                            <FeaturedCard
                              category={
                                node
                              }
                            />
                          </div>
                        );
                      })}
              </div>
            </section>
          )}

        {/* ================================================================ */}
        {/* SOLUTIONS                                                        */}
        {/* ================================================================ */}

        <section className="pt-10 md:pt-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[.15em] text-blue-600">
                Catálogo completo
              </span>

              <h2 className="mt-1 text-[22px] font-black tracking-[-0.025em] text-slate-950 sm:text-[25px]">
                {showSearch
                  ? `Resultados para "${debouncedSearch}"`
                  : 'Soluções por categoria'}
              </h2>
            </div>

            <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10.5px] font-semibold text-slate-500 shadow-sm">
              Página {page} de{' '}
              {totalPages}
            </span>
          </div>

          {/* EMPTY */}

          {paginatedGroups.length ===
          0 ? (
            <div className="my-4 rounded-[24px] border border-slate-200 bg-white px-5 py-16 text-center shadow-sm sm:py-20">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <Search className="h-5 w-5" />
              </div>

              <p className="mt-4 text-[14px] font-bold text-slate-700">
                Nenhuma categoria encontrada
                para &quot;
                {debouncedSearch}&quot;
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setPage(1);
                }}
                className="mt-4 rounded-xl bg-blue-50 px-4 py-2 text-[12px] font-bold text-blue-700 transition-colors hover:bg-blue-100"
              >
                Limpar busca
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedGroups.map(
                (group, gi) => {
                  const letter =
                    groupLabel(
                      gi +
                        (page - 1) *
                          PER_PAGE,
                    );

                  const children: CategoryTreeNode[] =
                    group.children
                      ?.length
                      ? group.children
                      : [group];

                  return (
                    <section
                      key={group.id}
                      className="
                        overflow-hidden
                        rounded-[20px]
                        border
                        border-slate-200/80
                        bg-white
                        shadow-[0_4px_20px_rgba(15,23,42,0.025)]
                        sm:rounded-[22px]
                      "
                    >
                      {/* GROUP HEADER */}

                      <div
                        className="
                          flex
                          min-h-[56px]
                          items-center
                          justify-between
                          gap-4
                          border-b
                          border-slate-200/70
                          bg-slate-50/70
                          px-4
                          py-3
                          sm:px-5
                        "
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-[10px] font-black text-blue-700">
                            {letter}
                          </span>

                          <h3 className="truncate text-[11px] font-black uppercase tracking-[.11em] text-slate-800 sm:text-[12px]">
                            {group.name}
                          </h3>
                        </div>

                        <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[9.5px] font-semibold text-slate-500 sm:text-[10px]">
                          {children.length}{' '}
                          {children.length === 1
                            ? 'categoria'
                            : 'categorias'}
                        </span>
                      </div>

                      {/* ROWS */}

                      <div className="divide-y divide-slate-100">
                        {children.map(
                          (child) => (
                            <CategoryRow
                              key={child.id}
                              category={
                                child
                              }
                            />
                          ),
                        )}
                      </div>
                    </section>
                  );
                },
              )}
            </div>
          )}
        </section>

        {/* ================================================================ */}
        {/* PAGINATION                                                       */}
        {/* ================================================================ */}

        {totalPages > 1 && (
          <nav
            aria-label="Paginação de categorias"
            className="
              mt-8
              flex
              items-center
              justify-between
              gap-3
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-3
              shadow-sm
              sm:p-4
            "
          >
            <button
              type="button"
              disabled={page === 1}
              onClick={() =>
                setPage((p) =>
                  Math.max(1, p - 1),
                )
              }
              className="
                inline-flex
                min-h-10
                items-center
                gap-2
                rounded-xl
                border
                border-slate-200
                bg-white
                px-3
                text-[11px]
                font-bold
                text-slate-700
                transition-all
                hover:border-blue-200
                hover:bg-blue-50
                hover:text-blue-700
                disabled:pointer-events-none
                disabled:opacity-30
                sm:px-4
                sm:text-[12px]
              "
            >
              <ArrowLeft className="h-3.5 w-3.5" />

              <span className="hidden sm:inline">
                Anterior
              </span>
            </button>

            <span className="text-[11px] font-medium text-slate-500 sm:text-[12px]">
              Página{' '}
              <strong className="font-black text-slate-900">
                {page}
              </strong>{' '}
              de {totalPages}
            </span>

            <button
              type="button"
              disabled={
                page === totalPages
              }
              onClick={() =>
                setPage((p) =>
                  Math.min(
                    totalPages,
                    p + 1,
                  ),
                )
              }
              className="
                inline-flex
                min-h-10
                items-center
                gap-2
                rounded-xl
                border
                border-slate-200
                bg-white
                px-3
                text-[11px]
                font-bold
                text-slate-700
                transition-all
                hover:border-blue-200
                hover:bg-blue-50
                hover:text-blue-700
                disabled:pointer-events-none
                disabled:opacity-30
                sm:px-4
                sm:text-[12px]
              "
            >
              <span className="hidden sm:inline">
                Próxima
              </span>

              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </nav>
        )}

        {/* ================================================================ */}
        {/* CTA                                                              */}
        {/* ================================================================ */}

        <section className="my-10 sm:my-14 md:my-16">
          <div
            className="
              relative
              overflow-hidden
              rounded-[24px]
              border
              border-blue-100
              bg-gradient-to-r
              from-blue-50/80
              via-white
              to-white
              p-5
              shadow-[0_8px_30px_rgba(15,23,42,0.035)]
              sm:p-7
              md:flex
              md:items-center
              md:justify-between
              md:gap-8
              md:p-8
            "
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full bg-blue-100/60 blur-3xl"
            />

            <div className="relative flex items-start gap-4">
              <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-white text-blue-600 shadow-sm sm:flex">
                <Sparkles className="h-5 w-5" />
              </div>

              <div>
                <h3 className="text-[17px] font-black tracking-[-0.02em] text-slate-950 sm:text-[19px]">
                  Não encontrou o que procura?
                </h3>

                <p className="mt-2 max-w-[540px] text-[12.5px] leading-5 text-slate-500 sm:text-[13.5px] sm:leading-6">
                  Conte com a nossa equipe para
                  te ajudar a encontrar a
                  solução ideal para o seu
                  projeto de energia solar ou
                  mobilidade.
                </p>
              </div>
            </div>

            <Link
              href="/quote-wizard"
              className="
                relative
                mt-5
                inline-flex
                min-h-12
                w-full
                shrink-0
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-blue-600
                px-5
                text-[12px]
                font-bold
                text-white
                shadow-[0_6px_18px_rgba(37,99,235,0.22)]
                transition-all
                hover:-translate-y-0.5
                hover:bg-blue-700
                hover:shadow-[0_10px_24px_rgba(37,99,235,0.28)]
                active:translate-y-0
                md:mt-0
                md:w-auto
              "
            >
              Pedir orçamentos gratuitos

              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}