'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  BatteryCharging,
  Building2,
  Car,
  ChevronRight,
  Factory,
  Grid2X2,
  HardHat,
  Home,
  Leaf,
  MonitorCog,
  Search,
  X,
  Zap,
  RefreshCw,
} from 'lucide-react';

import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategoriesTree, type CategoryTreeNode } from '@/hooks/useCategoriesTree';
import { getPreferredCategoryIcon } from '@/components/categories/categoryIcons';

interface MobileCategoriesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUBCATEGORY_ICONS = [
  { match: ['residencial'], icon: Home },
  { match: ['comercial', 'industrial'], icon: Factory },
  { match: ['rural', 'agronegócio', 'agronegocio'], icon: Leaf },
  { match: ['bateria', 'armazenamento'], icon: BatteryCharging },
  { match: ['carport', 'cobertura'], icon: Car },
  { match: ['instalador'], icon: HardHat },
  { match: ['monitoramento', 'o&m'], icon: MonitorCog },
];

function getCategoryHref(category: CategoryTreeNode) {
  return `/categories/${category.seo_url || category.slug}`;
}

function formatCount(count: number) {
  return `${count} ${count === 1 ? 'empresa' : 'empresas'}`;
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getSubcategoryIcon(name: string) {
  const normalized = normalizeText(name);
  return (
    SUBCATEGORY_ICONS.find((entry) => entry.match.some((term) => normalized.includes(term)))
      ?.icon || Building2
  );
}

function filterMainCategories(categories: CategoryTreeNode[], query: string) {
  const normalizedQuery = normalizeText(query.trim());
  if (!normalizedQuery) return categories;

  return categories.filter((category) => {
    const categoryMatches = normalizeText(category.name).includes(normalizedQuery);
    const childMatches = category.children?.some((child) =>
      normalizeText(child.name).includes(normalizedQuery)
    );
    return categoryMatches || childMatches;
  });
}

function filterSubcategories(category: CategoryTreeNode, query: string) {
  const normalizedQuery = normalizeText(query.trim());
  const children = category.children || [];
  if (!normalizedQuery) return children;

  return children.filter((child) => normalizeText(child.name).includes(normalizedQuery));
}

export const MobileCategoriesDrawer: React.FC<MobileCategoriesDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const { categories, loading, error } = useCategoriesTree();
  const [selectedCategory, setSelectedCategory] = useState<CategoryTreeNode | null>(null);
  const [query, setQuery] = useState('');

  const visibleCategories = useMemo(
    () => filterMainCategories(categories, query),
    [categories, query]
  );

  const visibleSubcategories = useMemo(
    () => (selectedCategory ? filterSubcategories(selectedCategory, query) : []),
    [selectedCategory, query]
  );

  const closeDrawer = () => {
    onClose();
    setSelectedCategory(null);
    setQuery('');
  };

  const openCategory = (category: CategoryTreeNode) => {
    setSelectedCategory(category);
    setQuery('');
  };

  const goBack = () => {
    setSelectedCategory(null);
    setQuery('');
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent
        side="left"
        className="flex h-full w-[92vw] max-w-[430px] flex-col gap-0 rounded-r-[28px] border-r border-slate-200 bg-white p-0 shadow-2xl sm:w-[420px] [&>button]:hidden"
      >
        <div className="mx-auto mt-4 h-1 w-14 rounded-full bg-slate-300" />

        <header className="px-5 pb-3 pt-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {selectedCategory && (
                <button
                  type="button"
                  onClick={goBack}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-950 transition-colors hover:bg-slate-100"
                  aria-label="Voltar"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <h2 className="truncate text-2xl font-black tracking-tight text-slate-950">
                {selectedCategory ? selectedCategory.name : 'Categorias'}
              </h2>
            </div>

            <button
              type="button"
              onClick={closeDrawer}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-950 transition-colors hover:bg-slate-200"
              aria-label="Fechar categorias"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <label className="mt-5 flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-slate-500 shadow-sm">
            <Search className="h-5 w-5 shrink-0 text-slate-950" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                selectedCategory ? `Buscar em ${selectedCategory.name}` : 'Buscar categorias'
              }
              className="min-w-0 flex-1 bg-transparent text-base font-medium text-slate-950 outline-none placeholder:text-slate-400"
            />
          </label>
        </header>

        <div className="flex-1 overflow-y-auto px-5 pb-28 pt-2">
          {loading ? (
            <LoadingList />
          ) : error && categories.length === 0 ? (
            <ErrorState />
          ) : selectedCategory ? (
            <SubcategoryView
              category={selectedCategory}
              subcategories={visibleSubcategories}
              onClose={closeDrawer}
            />
          ) : (
            <MainCategoriesView
              categories={visibleCategories}
              onOpenCategory={openCategory}
              onClose={closeDrawer}
            />
          )}
        </div>

        <div className="border-t border-slate-100 bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+18px)] pt-4">
          <Link
            href="/categories"
            onClick={closeDrawer}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-blue-700 text-base font-black text-white shadow-[0_16px_30px_-18px_rgba(29,78,216,0.85)] transition-colors hover:bg-blue-800"
          >
            <Grid2X2 className="h-5 w-5" />
            Ver todas as categorias
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
};

function LoadingList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex h-20 items-center gap-4 rounded-2xl border border-slate-100 bg-white px-4"
        >
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
      <div className="mb-5 rounded-3xl bg-amber-50 p-5 text-amber-500 ring-8 ring-amber-50/50">
        <Zap className="h-10 w-10" />
      </div>
      <h3 className="mb-2 text-lg font-black text-slate-950">Menu em manutenção</h3>
      <p className="mb-6 text-sm leading-relaxed text-slate-500">
        Estamos ajustando as categorias. Tente recarregar ou explore todas as opções.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
      >
        <RefreshCw className="h-4 w-4 text-blue-600" />
        Recarregar menu
      </button>
    </div>
  );
}

function MainCategoriesView({
  categories,
  onOpenCategory,
  onClose,
}: {
  categories: CategoryTreeNode[];
  onOpenCategory: (category: CategoryTreeNode) => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-3">
      {categories.map((category, index) => {
        const iconSrc = getPreferredCategoryIcon(category.slug, category.icon_url);
        const hasChildren = category.children && category.children.length > 0;

        return (
          <button
            key={category.id}
            type="button"
            onClick={() => (hasChildren ? onOpenCategory(category) : undefined)}
            className={`flex min-h-[76px] w-full items-center gap-4 rounded-2xl border px-4 text-left transition-colors ${
              index === 0
                ? 'border-blue-200 bg-blue-50/40'
                : 'border-slate-100 bg-white hover:border-blue-100 hover:bg-blue-50/30'
            }`}
          >
            <CategoryIcon iconSrc={iconSrc} name={category.name} highlighted={index === 0} />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-base font-black leading-tight text-slate-950">
                {category.name}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {formatCount(category.companies_count || 0)}
              </p>
            </div>
            <ChevronRight className="h-6 w-6 shrink-0 text-blue-700" />
          </button>
        );
      })}

      <Link
        href="/categories"
        onClick={onClose}
        className="flex min-h-[76px] items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 transition-colors hover:bg-blue-50/40"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <Grid2X2 className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-black text-slate-950">Ver todas as categorias</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Explore todas as opções disponíveis
          </p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-slate-500" />
      </Link>
    </div>
  );
}

function SubcategoryView({
  category,
  subcategories,
  onClose,
}: {
  category: CategoryTreeNode;
  subcategories: CategoryTreeNode[];
  onClose: () => void;
}) {
  return (
    <div className="space-y-3">
      <Link
        href={getCategoryHref(category)}
        onClick={onClose}
        className="flex min-h-[72px] items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 text-blue-700 transition-colors hover:bg-blue-50"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
          <Grid2X2 className="h-5 w-5" />
        </span>
        <p className="min-w-0 flex-1 text-base font-black">Ver tudo em {category.name}</p>
        <ChevronRight className="h-6 w-6 shrink-0" />
      </Link>

      {subcategories.map((subcategory) => {
        const Icon = getSubcategoryIcon(subcategory.name);
        return (
          <Link
            key={subcategory.id}
            href={getCategoryHref(subcategory)}
            onClick={onClose}
            className="flex min-h-[68px] items-center gap-4 rounded-2xl bg-white px-3 transition-colors hover:bg-slate-50"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-700 shadow-sm">
              <Icon className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <p className="line-clamp-2 min-w-0 flex-1 text-[15px] font-black leading-snug text-slate-950">
              {subcategory.name}
            </p>
            {subcategory.companies_count > 0 && (
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-500">
                {subcategory.companies_count}
              </span>
            )}
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-500" />
          </Link>
        );
      })}
    </div>
  );
}

function CategoryIcon({
  iconSrc,
  name,
  highlighted,
}: {
  iconSrc: string | null;
  name: string;
  highlighted: boolean;
}) {
  return (
    <span
      className={`relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl ${
        highlighted ? 'bg-white' : 'bg-slate-50'
      }`}
    >
      {iconSrc ? (
        <Image src={iconSrc} alt={name} fill className="object-contain p-1.5" sizes="56px" />
      ) : (
        <Grid2X2 className="h-6 w-6 text-blue-700" />
      )}
    </span>
  );
}
