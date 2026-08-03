'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCategoriesTree, type CategoryTreeNode } from '@/hooks/useCategoriesTree';
import { useFeaturedCategoriesQuery } from '@/hooks/useCategoriesQuery';

// ─── Helpers ───────────────────────────────────────────────────────────────

function getCategoryHref(seo_url: string | undefined, slug: string) {
  return `/categories/${seo_url || slug}`;
}

/** Letras do alfabeto para nomear grupos: A, B, C... */
function groupLabel(index: number) {
  return String.fromCharCode(65 + index); // A=65
}

/** Índice dentro do grupo: A.01, A.02... */
function rowIndex(groupLetter: string, i: number) {
  return `${groupLetter}.${String(i + 1).padStart(2, '0')}`;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}


// ─── Skeleton ──────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      {/* hero skeleton */}
      <div className="border-b border-black">
        <div className="max-w-[1240px] mx-auto px-5 py-16 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-10">
          <div className="space-y-4">
            <div className="h-3 w-24 bg-slate-200 rounded" />
            <div className="h-16 w-3/4 bg-slate-200 rounded" />
            <div className="h-4 w-full bg-slate-100 rounded" />
            <div className="h-4 w-2/3 bg-slate-100 rounded" />
          </div>
          <div className="h-32 bg-slate-100 rounded border border-slate-200" />
        </div>
      </div>
      {/* filter bar skeleton */}
      <div className="border-b border-black h-14 bg-slate-50" />
      {/* content skeleton */}
      <div className="max-w-[1240px] mx-auto px-5 py-12 space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border-l border-black">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border-r border-b border-black aspect-[3/2] bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Featured card ─────────────────────────────────────────────────────────

interface FeaturedCardProps {
  category: CategoryTreeNode;
  index: number;
}

const GRADIENT_PALETTE = [
  'from-slate-700 to-slate-900',
  'from-blue-700 to-blue-900',
  'from-emerald-700 to-emerald-900',
  'from-violet-700 to-violet-900',
  'from-amber-700 to-amber-900',
  'from-rose-700 to-rose-900',
];

function FeaturedCard({ category, index }: FeaturedCardProps) {
  const href = getCategoryHref(category.seo_url, category.slug);
  const gradient = GRADIENT_PALETTE[index % GRADIENT_PALETTE.length];

  return (
    <Link
      href={href}
      className="group relative flex flex-col border-r border-b border-black bg-white transition-colors duration-100 hover:bg-[#f6f8fc]"
    >
      {/* image */}
      <div className="relative aspect-[3/2] overflow-hidden border-b border-black bg-slate-900">
        {category.icon_url ? (
          <Image
            src={category.icon_url}
            alt={category.name}
            fill
            sizes="(max-width: 600px) 100vw, (max-width: 980px) 50vw, 25vw"
            className="object-cover filter grayscale contrast-105 transition-all duration-300 group-hover:grayscale-0 group-hover:scale-[1.04]"
            unoptimized
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <span className="text-white/20 text-6xl font-black">{groupLabel(index)}</span>
          </div>
        )}
        {/* index badge */}
        <span className="absolute top-3 left-3 bg-white border border-black text-[#1668e8] text-[11px] font-black px-2.5 py-1 leading-none tracking-wider">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      {/* body */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="text-[17px] font-bold tracking-tight leading-snug mb-2 group-hover:text-[#1668e8] transition-colors">
          {category.name}
        </h3>
        <p className="text-[12.5px] text-[#6b6b6b] flex-1 leading-relaxed line-clamp-2 mb-4">
          Compare empresas verificadas e avaliações reais em {category.name.toLowerCase()}.
        </p>
        <div className="flex justify-between items-center border-t border-[#dcdcdc] pt-3">
          <span className="text-[12px] font-bold">
            {category.companies_count ?? 0} {(category.companies_count ?? 0) === 1 ? 'empresa' : 'empresas'}
          </span>
          <span className="text-[11px] font-black uppercase tracking-[.06em] group-hover:text-[#1668e8] transition-colors">
            Explorar →
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Row item ──────────────────────────────────────────────────────────────

function CategoryRow({
  category,
  idx,
}: {
  category: CategoryTreeNode;
  idx: string;
}) {
  const href = getCategoryHref(category.seo_url, category.slug);
  return (
    <Link
      href={href}
      className="grid items-center gap-4 py-[17px] border-b border-[#dcdcdc] transition-colors duration-100 hover:bg-[#f6f8fc]"
      style={{ gridTemplateColumns: '56px 1.2fr 1.6fr auto 40px' }}
    >
      <span className="text-[12px] font-bold text-[#6b6b6b] pl-1">{idx}</span>
      <h3 className="text-[16.5px] font-bold tracking-tight leading-tight">
        {category.name}
      </h3>
      <p className="text-[12.5px] text-[#6b6b6b] hidden md:block">
        Compare as melhores empresas de {category.name.toLowerCase()} do Brasil.
      </p>
      <span className="text-[12px] font-bold text-[#1668e8] border border-[#1668e8] px-3 py-[4px] whitespace-nowrap">
        {category.companies_count ?? 0}
      </span>
      <span className="text-[17px] font-bold text-black text-right pr-1 transition-transform group-hover:translate-x-[3px]">
        →
      </span>
    </Link>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export default function CategoriesIndexWithSidebar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [kindFilter, setKindFilter] = useState('');
  const [sortBy, setSortBy] = useState<'companies_desc' | 'name_asc'>('companies_desc');
  const [page, setPage] = useState(1);
  const PER_PAGE = 10; // grupos por página

  const debouncedSearch = useDebounce(searchTerm, 350);

  // Árvore de categorias (pai → filhos)
  const { categories: tree, loading: treeLoading } = useCategoriesTree();

  // Categorias em destaque (4 cards)
  const { data: featuredData, isLoading: featuredLoading } = useFeaturedCategoriesQuery(4);
  const featuredCategories = featuredData?.data ?? [];

  // Stats derivados
  const totalCompanies = useMemo(
    () => tree.reduce((acc, c) => acc + (c.companies_count ?? 0), 0),
    [tree]
  );
  const totalCategories = tree.length;

  // Filtrar e ordenar grupos (categorias raiz)
  const filteredGroups = useMemo(() => {
    let groups = tree;

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      groups = groups
        .map((g) => {
          const gMatches = g.name.toLowerCase().includes(q);
          const filteredChildren = (g.children ?? []).filter((c) =>
            c.name.toLowerCase().includes(q)
          );
          if (gMatches) return { ...g }; // inclui o grupo inteiro
          if (filteredChildren.length > 0) return { ...g, children: filteredChildren };
          return null;
        })
        .filter(Boolean) as CategoryTreeNode[];
    }

    if (sortBy === 'name_asc') {
      groups = [...groups].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    } else {
      groups = [...groups].sort(
        (a, b) => (b.companies_count ?? 0) - (a.companies_count ?? 0)
      );
    }

    return groups;
  }, [tree, debouncedSearch, sortBy]);

  const totalGroups = filteredGroups.length;
  const totalPages = Math.max(1, Math.ceil(totalGroups / PER_PAGE));
  const paginatedGroups = filteredGroups.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Total de resultados (todas as sub-categorias filtradas)
  const totalResults = useMemo(
    () =>
      filteredGroups.reduce((acc, g) => acc + 1 + (g.children?.length ?? 0), 0),
    [filteredGroups]
  );

  if (treeLoading && tree.length === 0) return <PageSkeleton />;

  const showSearch = debouncedSearch.trim().length > 0;

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>

      {/* ===== HERO ===== */}
      <section style={{ borderBottom: '1px solid #111' }}>
        <div className="max-w-[1240px] mx-auto px-5">
          <div
            className="py-16 grid gap-10 items-end"
            style={{ gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)' }}
          >
            {/* left */}
            <div>
              <span
                className="block text-[11px] font-black uppercase tracking-[.14em] mb-4"
                style={{ color: '#1668e8' }}
              >
                Índice — Avalia Solar
              </span>
              <h1
                className="font-bold leading-[.98] tracking-[-0.03em]"
                style={{ fontSize: 'clamp(44px, 6vw, 76px)' }}
              >
                Energia solar
                <br />e{' '}
                <span style={{ color: '#1668e8' }}>
                  mobilidade
                  <br />
                  elétrica.
                </span>
              </h1>
              <p className="mt-5 text-[15px] text-[#6b6b6b] max-w-[460px] leading-relaxed">
                De painéis e inversores a wallbox, eletropostos e frotas elétricas. Compare
                empresas verificadas e avaliações reais em cada segmento — energia solar e
                mobilidade elétrica do Brasil, por categoria.
              </p>
            </div>

            {/* right — stats */}
            <div style={{ borderLeft: '1px solid #111', paddingLeft: '32px' }}>
              {treeLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-14 w-20 bg-slate-200 rounded" />
                  <div className="h-3 w-28 bg-slate-100 rounded" />
                  <div className="h-14 w-20 bg-slate-200 rounded mt-6" />
                  <div className="h-3 w-36 bg-slate-100 rounded" />
                </div>
              ) : (
                <>
                  <div
                    className="font-bold tracking-[-0.03em] leading-none"
                    style={{ fontSize: 'clamp(40px, 4vw, 56px)' }}
                  >
                    {totalCategories}
                  </div>
                  <span className="block text-[11px] font-black uppercase tracking-[.14em] text-[#6b6b6b] mt-1.5">
                    Categorias ativas
                  </span>
                  <div
                    className="font-bold tracking-[-0.03em] leading-none mt-7"
                    style={{ fontSize: 'clamp(40px, 4vw, 56px)' }}
                  >
                    {totalCompanies.toLocaleString('pt-BR')}
                  </div>
                  <span className="block text-[11px] font-black uppercase tracking-[.14em] text-[#6b6b6b] mt-1.5">
                    Empresas cadastradas
                  </span>
                </>
              )}
            </div>
          </div>

          {/* search bar */}
          <div
            className="flex mb-0"
            style={{ border: '1px solid #111', marginBottom: '-1px' }}
          >
            <input
              type="text"
              placeholder="Buscar categorias — ex.: baterias, wallbox, energia rural"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="flex-1 outline-none px-5 py-4 text-[15px] bg-transparent placeholder:text-[#6b6b6b]"
              style={{ fontFamily: 'inherit', border: 'none' }}
            />
            <button
              type="button"
              className="font-black text-[13px] tracking-[.02em] text-white px-6 transition-colors duration-100"
              style={{
                background: '#1668e8',
                borderLeft: '1px solid #111',
              }}
            >
              Buscar
            </button>
          </div>
        </div>
      </section>

      {/* ===== FILTER BAR ===== */}
      <div style={{ borderBottom: '1px solid #111' }}>
        <div
          className="max-w-[1240px] mx-auto px-5 flex flex-wrap items-center"
          style={{ gap: 0 }}
        >
          {/* Tipo */}
          <div
            className="flex items-center gap-2.5 text-[13px]"
            style={{
              padding: '14px 22px',
              borderRight: '1px solid #dcdcdc',
            }}
          >
            <span className="text-[11px] font-black uppercase tracking-[.14em] text-[#6b6b6b]">
              Tipo
            </span>
            <select
              value={kindFilter}
              onChange={(e) => {
                setKindFilter(e.target.value);
                setPage(1);
              }}
              className="border-none bg-transparent font-black text-[13px] cursor-pointer outline-none"
              style={{ fontFamily: 'inherit' }}
            >
              <option value="">Qualquer solução</option>
              <option value="solar">Energia solar</option>
              <option value="mobility">Mobilidade elétrica</option>
            </select>
          </div>

          {/* Ordenação */}
          <div
            className="flex items-center gap-2.5 text-[13px]"
            style={{ padding: '14px 22px', borderRight: '1px solid #dcdcdc' }}
          >
            <span className="text-[11px] font-black uppercase tracking-[.14em] text-[#6b6b6b]">
              Ordenar
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="border-none bg-transparent font-black text-[13px] cursor-pointer outline-none"
              style={{ fontFamily: 'inherit' }}
            >
              <option value="companies_desc">Mais empresas</option>
              <option value="name_asc">Nome (A–Z)</option>
            </select>
          </div>

          {/* Resultados */}
          <div
            className="ml-auto flex items-center text-[13px]"
            style={{
              padding: '14px 22px',
              borderLeft: '1px solid #dcdcdc',
            }}
          >
            <span>
              <b style={{ color: '#1668e8' }}>{totalResults}</b>{' '}
              {totalResults === 1 ? 'resultado' : 'resultados'} — ordenado por{' '}
              <b>{sortBy === 'name_asc' ? 'nome' : 'destaques'}</b>
            </span>
          </div>
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="max-w-[1240px] mx-auto px-5">

        {/* ── Destaques ── */}
        {!showSearch && featuredCategories.length > 0 && (
          <section className="pt-12 pb-2">
            <div
              className="flex items-baseline justify-between pb-3.5 mb-0"
              style={{ borderBottom: '2px solid #111' }}
            >
              <h2 className="text-[24px] font-black tracking-[-0.02em]">
                Categorias em destaque
              </h2>
              <span className="text-[12px] text-[#6b6b6b]">
                Os segmentos mais procurados da plataforma
              </span>
            </div>

            <div
              className="grid"
              style={{
                gridTemplateColumns: 'repeat(4, 1fr)',
                borderLeft: '1px solid #111',
              }}
            >
              {featuredLoading
                ? [1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="border-r border-b border-black animate-pulse"
                    >
                      <div className="aspect-[3/2] bg-slate-200" />
                      <div className="p-5 space-y-2">
                        <div className="h-4 w-2/3 bg-slate-200 rounded" />
                        <div className="h-3 w-full bg-slate-100 rounded" />
                      </div>
                    </div>
                  ))
                : featuredCategories.slice(0, 4).map((cat, i) => {
                    // Adapt CategoryCardData → CategoryTreeNode shape
                    const node: CategoryTreeNode = {
                      id: cat.id,
                      name: cat.name,
                      slug: cat.seo_url,
                      seo_url: cat.seo_url,
                      parent_id: null,
                      companies_count: cat.companies_count,
                      products_count: cat.products_count,
                      icon_url: cat.icon_url ?? undefined,
                      children: [],
                    };
                    return <FeaturedCard key={cat.id} category={node} index={i} />;
                  })}
            </div>
          </section>
        )}

        {/* ── Soluções por categoria ── */}
        <section className="pt-12 pb-2">
          <div
            className="flex items-baseline justify-between pb-3.5 mb-0"
            style={{ borderBottom: '2px solid #111' }}
          >
            <h2 className="text-[24px] font-black tracking-[-0.02em]">
              {showSearch ? `Resultados para "${debouncedSearch}"` : 'Soluções por categoria'}
            </h2>
            <span className="text-[12px] text-[#6b6b6b]">
              Página {page} de {totalPages}
            </span>
          </div>

          {paginatedGroups.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-[14px] font-bold text-[#6b6b6b]">
                Nenhuma categoria encontrada para &quot;{debouncedSearch}&quot;
              </p>
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setPage(1); }}
                className="mt-4 text-[13px] font-black underline text-[#1668e8]"
              >
                Limpar busca
              </button>
            </div>
          ) : (
            paginatedGroups.map((group, gi) => {
              const letter = groupLabel(gi + (page - 1) * PER_PAGE);
              const children: CategoryTreeNode[] = group.children?.length
                ? group.children
                : [group]; // se não tem filhos, trata o próprio como item

              return (
                <div key={group.id} className="mb-10">
                  {/* group header */}
                  <div
                    className="flex items-baseline gap-4 pb-2.5 mb-0"
                    style={{
                      marginTop: '34px',
                      borderBottom: '2px solid #111',
                    }}
                  >
                    <span className="text-[12px] font-black uppercase tracking-[.14em]">
                      {letter} — {group.name}
                    </span>
                    <span className="ml-auto text-[12px] text-[#6b6b6b]">
                      {children.length}{' '}
                      {children.length === 1 ? 'categoria' : 'categorias'}
                    </span>
                  </div>

                  {/* rows */}
                  <div>
                    {children.map((child, ci) => (
                      <CategoryRow
                        key={child.id}
                        category={child}
                        idx={rowIndex(letter, ci)}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* ===== PAGINATION ===== */}
        {totalPages > 1 && (
          <div
            className="flex justify-between items-center pt-4 pb-14 text-[13px]"
            style={{ borderTop: '1px solid #111', marginTop: '10px' }}
          >
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="border border-black bg-white px-5 py-2.5 font-black text-[12.5px] uppercase tracking-[.04em] transition-colors duration-100 disabled:opacity-30 hover:bg-black hover:text-white"
            >
              ← Anterior
            </button>
            <span className="text-[#6b6b6b]">
              Página <b className="text-black">{page}</b> de {totalPages}
            </span>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="border border-black bg-white px-5 py-2.5 font-black text-[12.5px] uppercase tracking-[.04em] transition-colors duration-100 disabled:opacity-30 hover:bg-black hover:text-white"
            >
              Próxima →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
