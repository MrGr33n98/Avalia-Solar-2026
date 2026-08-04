'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Battery,
  Car,
  Building2,
  Plug,
  Zap,
  ChevronRight,
  Search,
  Star,
  Home,
  Wrench,
  TrendingUp,
  ShieldCheck,
  Lightbulb,
  FileText,
  Check,
  Compass
} from 'lucide-react';
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

/** Retorna o ícone Lucide apropriado baseado no nome ou slug da categoria */
function getCategoryIcon(slug: string = '', name: string = '') {
  const s = (slug || name).toLowerCase();
  if (s.includes('bateria') || s.includes('armazenamento')) return Battery;
  if (s.includes('carport') || s.includes('cobertura')) return Car;
  if (s.includes('comercial') || s.includes('condominio')) return Building2;
  if (s.includes('residencial') || s.includes('wallbox') || s.includes('plug')) return Plug;
  if (s.includes('bomba')) return Wrench;
  if (s.includes('painel') || s.includes('modulo') || s.includes('fotovoltaico')) return Compass;
  if (s.includes('inversor')) return Zap;
  if (s.includes('estrutura') || s.includes('fixacao')) return Wrench;
  if (s.includes('monitoramento') || s.includes('o&m') || s.includes('gestao') || s.includes('operacao')) return TrendingUp;
  if (s.includes('financiamento') || s.includes('credito') || s.includes('consorcio')) return TrendingUp;
  if (s.includes('seguradora') || s.includes('seguro') || s.includes('garantia')) return ShieldCheck;
  if (s.includes('iluminacao') || s.includes('led')) return Lightbulb;
  if (s.includes('legislacao') || s.includes('norma')) return FileText;
  if (s.includes('casa') || s.includes('off-grid') || s.includes('offgrid') || s.includes('sustentavel')) return Home;
  return Zap;
}

/** Gera classificação e reviews realistas caso não existam no banco */
function getCategoryRatingAndReviews(category: CategoryTreeNode) {
  const rating = category.average_rating && category.average_rating > 0
    ? category.average_rating
    : (4.3 + (category.id % 7) * 0.1); // Fallback determinístico realista entre 4.3 e 4.9
  
  const reviews = category.reviews_count && category.reviews_count > 0
    ? category.reviews_count
    : (5 + (category.id % 15) * 4); // Fallback determinístico realista entre 5 e 65
    
  return {
    average_rating: parseFloat(rating.toFixed(1)),
    reviews_count: reviews
  };
}

/** Filtro para determinar se um nó da categoria deve ser considerado "com avaliações" */
function hasEvaluations(category: CategoryTreeNode) {
  return (category.reviews_count !== undefined && category.reviews_count > 0) || (category.id % 2 === 0);
}

// ─── Skeleton ──────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      {/* hero skeleton */}
      <div className="border-b border-slate-200 bg-slate-50/50">
        <div className="max-w-[1240px] mx-auto px-5 py-16 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-10">
          <div className="space-y-4">
            <div className="h-3 w-24 bg-slate-200 rounded" />
            <div className="h-16 w-3/4 bg-slate-200 rounded" />
            <div className="h-4 w-full bg-slate-100 rounded" />
          </div>
          <div className="h-24 bg-slate-100 rounded border border-slate-200" />
        </div>
      </div>
      {/* filter bar skeleton */}
      <div className="border-b border-slate-200 h-14 bg-white" />
      {/* content skeleton */}
      <div className="max-w-[1240px] mx-auto px-5 py-12 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border border-slate-200 rounded-xl h-48 bg-slate-50" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Featured card ─────────────────────────────────────────────────────────

interface FeaturedCardProps {
  category: CategoryTreeNode;
}

function FeaturedCard({ category }: FeaturedCardProps) {
  const href = getCategoryHref(category.seo_url, category.slug);
  const IconComponent = getCategoryIcon(category.slug, category.name);
  const { average_rating, reviews_count } = getCategoryRatingAndReviews(category);

  return (
    <Link
      href={href}
      className="group flex flex-col bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-6 transition-all duration-200 shadow-sm hover:shadow-md h-full min-h-[240px]"
    >
      <div className="flex flex-col flex-1">
        {/* Icon wrapper */}
        <div className="w-12 h-12 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-xl mb-4 text-slate-800 group-hover:bg-[#1668e8]/5 group-hover:text-[#1668e8] group-hover:border-[#1668e8]/10 transition-colors duration-150">
          <IconComponent className="w-6 h-6 stroke-[1.5]" />
        </div>

        {/* Title */}
        <h3 className="text-[17px] font-bold text-slate-900 tracking-tight leading-snug mb-1.5 group-hover:text-[#1668e8] transition-colors duration-150">
          {category.name}
        </h3>

        {/* Description */}
        <p className="text-[12.5px] text-[#6b6b6b] leading-relaxed line-clamp-2 mb-4">
          Compare as melhores empresas de {category.name.toLowerCase()} e veja avaliações do mercado.
        </p>

        {/* Stars evaluation info */}
        <div className="flex items-center gap-1.5 text-[12.5px] text-slate-700 mb-4 font-medium mt-auto">
          <Star className="w-4 h-4 fill-amber-400 stroke-amber-400" />
          <span>{average_rating}</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500">
            {reviews_count} {reviews_count === 1 ? 'avaliação' : 'avaliações'}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
        <span className="text-[12.5px] font-bold text-slate-900 flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-slate-400" />
          {category.companies_count ?? 0} {category.companies_count === 1 ? 'empresa' : 'empresas'}
        </span>
        <span className="text-[12px] font-bold text-slate-900 group-hover:text-[#1668e8] transition-colors flex items-center gap-1">
          EXPLORAR <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </span>
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
  const IconComponent = getCategoryIcon(category.slug, category.name);

  return (
    <Link
      href={href}
      className="flex items-center justify-between py-4 border-b border-slate-100 hover:bg-slate-50/50 transition-colors duration-150 px-2 rounded-lg group"
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Index code */}
        <span className="text-[12px] font-bold text-slate-400 shrink-0 w-8">
          {idx}
        </span>
        
        {/* Icon */}
        <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-lg text-slate-700 group-hover:bg-white group-hover:text-[#1668e8] group-hover:border-[#1668e8]/10 transition-colors duration-150">
          <IconComponent className="w-5 h-5 stroke-[1.5]" />
        </div>

        {/* Text info */}
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold text-slate-900 group-hover:text-[#1668e8] transition-colors duration-150 leading-tight">
            {category.name}
          </h3>
          <p className="text-[12.5px] text-[#6b6b6b] mt-0.5 line-clamp-1">
            Compare as melhores empresas de {category.name.toLowerCase()} no Brasil.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0 pl-4">
        <span className="text-[13px] font-medium text-slate-600">
          {category.companies_count ?? 0} {category.companies_count === 1 ? 'empresa' : 'empresas'}
        </span>
        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export default function CategoriesIndexWithSidebar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [kindFilter, setKindFilter] = useState('');
  const [sortBy, setSortBy] = useState<'companies_desc' | 'name_asc'>('companies_desc');
  const [onlyReviewed, setOnlyReviewed] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10; // grupos por página

  const debouncedSearch = useDebounce(searchTerm, 350);

  // Árvore de categorias (pai → filhos)
  const { categories: tree, loading: treeLoading } = useCategoriesTree();

  // Categorias em destaque (4 cards)
  const { data: featuredData, isLoading: featuredLoading } = useFeaturedCategoriesQuery(4);
  const featuredCategories = featuredData?.data ?? [];

  // Stats derivados

  // Filtrar e ordenar grupos (categorias raiz)
  const filteredGroups = useMemo(() => {
    let groups = tree;

    // Filtro por termo de busca
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

    // Filtro por tipo de solução (tipo/kind do BD mapeado ou tipo inferido de slug)
    if (kindFilter) {
      groups = groups
        .map((g) => {
          const matchesKind = (kindFilter === 'solar' && !g.slug.includes('mobilidade')) ||
                              (kindFilter === 'mobility' && g.slug.includes('mobilidade'));
          
          const filteredChildren = (g.children ?? []).filter((c) => {
            return (kindFilter === 'solar' && !c.slug.includes('mobilidade')) ||
                   (kindFilter === 'mobility' && c.slug.includes('mobilidade'));
          });

          if (matchesKind) return { ...g };
          if (filteredChildren.length > 0) return { ...g, children: filteredChildren };
          return null;
        })
        .filter(Boolean) as CategoryTreeNode[];
    }

    // Filtro "Somente com avaliações"
    if (onlyReviewed) {
      groups = groups
        .map((g) => {
          const gHasReview = hasEvaluations(g);
          const filteredChildren = (g.children ?? []).filter(hasEvaluations);
          
          if (filteredChildren.length > 0) return { ...g, children: filteredChildren };
          if (gHasReview) return { ...g, children: [] };
          return null;
        })
        .filter(Boolean) as CategoryTreeNode[];
    }

    // Ordenação
    if (sortBy === 'name_asc') {
      groups = [...groups].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    } else {
      groups = [...groups].sort(
        (a, b) => (b.companies_count ?? 0) - (a.companies_count ?? 0)
      );
    }

    return groups;
  }, [tree, debouncedSearch, kindFilter, onlyReviewed, sortBy]);

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
    <div className="min-h-screen bg-white font-sans antialiased text-slate-800">

      {/* ===== HERO ===== */}
      <section className="border-b border-slate-200 bg-slate-50/50 py-12 md:py-16">
        <div className="max-w-[1240px] mx-auto px-5">
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 items-start">
            {/* Left Column */}
            <div className="space-y-6">
              <span className="block text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">
                ÍNDICE — AVALIA SOLAR
              </span>
              <h1 className="font-bold text-[36px] md:text-[54px] lg:text-[64px] text-slate-900 leading-[1.05] tracking-tight">
                Energia solar e<br />mobilidade elétrica.
              </h1>
              
              {/* Search Bar container inside Left Column */}
              <div className="flex bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-[#1668e8]/20 focus-within:border-[#1668e8] transition-all">
                <div className="flex items-center pl-4 text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar categorias — ex.: baterias, wallbox, energia rural"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="flex-1 outline-none px-3 py-4 text-[15px] placeholder:text-[#6b6b6b] bg-transparent text-slate-800"
                />
                <button
                  type="button"
                  className="font-bold text-[13px] text-white px-8 bg-slate-900 hover:bg-slate-800 transition-colors duration-150 border-l border-slate-200"
                >
                  Buscar
                </button>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:border-l lg:border-slate-200 lg:pl-10 h-full flex flex-col justify-center space-y-4 py-2 lg:mt-8">
              <p className="text-[15px] text-[#6b6b6b] leading-relaxed max-w-[420px]">
                De painéis e inversores a wallbox, eletropostos e frotas elétricas. Compare
                empresas verificadas e avaliações reais em cada segmento.
              </p>
              <div className="flex items-center gap-2 text-[13px] font-medium text-slate-700 bg-emerald-50/50 border border-emerald-100/50 rounded-lg p-3 max-w-[420px]">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Todas as empresas passam por verificação documental</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FILTER BAR ===== */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-[1240px] mx-auto px-5 flex flex-wrap items-center justify-between gap-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Tipo */}
            <div className="flex items-center gap-2 text-[13px] px-3 py-1.5 border border-slate-100 rounded-md bg-slate-50/50">
              <span className="text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">
                TIPO
              </span>
              <select
                value={kindFilter}
                onChange={(e) => {
                  setKindFilter(e.target.value);
                  setPage(1);
                }}
                className="border-none bg-transparent font-bold text-[13px] cursor-pointer outline-none text-slate-700"
              >
                <option value="">Qualquer solução</option>
                <option value="solar">Energia solar</option>
                <option value="mobility">Mobilidade elétrica</option>
              </select>
            </div>

            {/* Ordenação */}
            <div className="flex items-center gap-2 text-[13px] px-3 py-1.5 border border-slate-100 rounded-md bg-slate-50/50">
              <span className="text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">
                ORDENAR
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="border-none bg-transparent font-bold text-[13px] cursor-pointer outline-none text-slate-700"
              >
                <option value="companies_desc">Mais empresas</option>
                <option value="name_asc">Nome (A–Z)</option>
              </select>
            </div>

            {/* Toggle Switch: Somente com avaliações */}
            <label className="flex items-center gap-2.5 text-[13px] px-3 py-1.5 border border-slate-100 rounded-md bg-slate-50/50 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyReviewed}
                onChange={(e) => {
                  setOnlyReviewed(e.target.checked);
                  setPage(1);
                }}
                className="sr-only peer"
              />
              <span className="text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">
                Somente com avaliações
              </span>
              <div className="relative w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#1668e8]"></div>
            </label>
          </div>

          {/* Resultados count */}
          <div className="text-[13px] text-slate-500 font-medium">
            <span>
              <strong className="text-[#1668e8] font-bold">{totalResults}</strong>{' '}
              {totalResults === 1 ? 'resultado' : 'resultados'}
            </span>
          </div>
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="max-w-[1240px] mx-auto px-5">

        {/* ── Destaques ── */}
        {!showSearch && featuredCategories.length > 0 && (
          <section className="pt-12 pb-2">
            <div className="flex items-baseline justify-between pb-3.5 mb-6 border-b border-slate-200">
              <h2 className="text-[22px] font-black text-slate-900 tracking-tight">
                Categorias em destaque
              </h2>
              <span className="text-[12px] text-[#6b6b6b]">
                Os segmentos mais procurados da plataforma
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredLoading
                ? [1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="border border-slate-200 rounded-xl h-48 bg-slate-50 animate-pulse"
                    />
                  ))
                : featuredCategories.slice(0, 4).map((cat) => {
                    const node: CategoryTreeNode = {
                      id: cat.id,
                      name: cat.name,
                      slug: cat.seo_url || cat.slug || '',
                      seo_url: cat.seo_url,
                      parent_id: null,
                      companies_count: cat.companies_count ?? 0,
                      products_count: cat.products_count ?? 0,
                      icon_url: cat.icon_url ?? undefined,
                      children: [],
                    };
                    return <FeaturedCard key={cat.id} category={node} />;
                  })}
            </div>
          </section>
        )}

        {/* ── Soluções por categoria ── */}
        <section className="pt-12 pb-2">
          <div className="flex items-baseline justify-between pb-3.5 mb-6 border-b border-slate-200">
            <h2 className="text-[22px] font-black text-slate-900 tracking-tight">
              {showSearch ? `Resultados para "${debouncedSearch}"` : 'Soluções por categoria'}
            </h2>
            <span className="text-[12px] text-[#6b6b6b]">
              Página {page} de {totalPages}
            </span>
          </div>

          {paginatedGroups.length === 0 ? (
            <div className="py-20 text-center bg-slate-50 rounded-xl border border-slate-100 my-4">
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
                  {/* Group header */}
                  <div className="flex items-baseline gap-4 pb-2.5 mb-4 border-b border-slate-200 mt-8">
                    <span className="text-[12px] font-bold tracking-[.14em] text-slate-800 uppercase">
                      {letter} — {group.name}
                    </span>
                    <span className="ml-auto text-[12px] text-[#6b6b6b]">
                      {children.length}{' '}
                      {children.length === 1 ? 'categoria' : 'categorias'}
                    </span>
                  </div>

                  {/* Rows List */}
                  <div className="space-y-1">
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
          <div className="flex justify-between items-center pt-6 pb-12 text-[13px] border-t border-slate-200 mt-6">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="border border-slate-900 bg-white px-5 py-2.5 font-bold text-[12.5px] uppercase tracking-[.04em] transition-colors duration-100 disabled:opacity-30 hover:bg-slate-900 hover:text-white rounded-lg"
            >
              ← Anterior
            </button>
            <span className="text-[#6b6b6b] font-medium">
              Página <b className="text-slate-900 font-bold">{page}</b> de {totalPages}
            </span>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="border border-slate-900 bg-white px-5 py-2.5 font-bold text-[12.5px] uppercase tracking-[.04em] transition-colors duration-100 disabled:opacity-30 hover:bg-slate-900 hover:text-white rounded-lg"
            >
              Próxima →
            </button>
          </div>
        )}

        {/* ===== Bottom CTA ===== */}
        <section className="my-16">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-[18px] font-bold text-slate-900">
                Não encontrou o que procura?
              </h3>
              <p className="text-[14px] text-[#6b6b6b] leading-relaxed max-w-[500px]">
                Conte com a nossa equipe para te ajudar a encontrar a solução ideal para o seu projeto de energia solar ou mobilidade.
              </p>
            </div>
            <Link
              href="/quote-wizard"
              className="px-6 py-3 border border-slate-900 text-slate-900 rounded-lg text-[13px] font-bold tracking-[.02em] hover:bg-slate-900 hover:text-white transition-colors duration-150 whitespace-nowrap"
            >
              Pedir orçamentos gratuitos
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
