'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, Grid2X2, Search, X, Zap, RefreshCw } from 'lucide-react';

import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategoriesTree, type CategoryTreeNode } from '@/hooks/useCategoriesTree';
import {
  getCategoryIcon,
  getPreferredCategoryIcon,
  normalizeCategoryKey,
} from '@/lib/categoryIcons';

interface MobileCategoriesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

function getCategoryHref(category: CategoryTreeNode) {
  return `/categories/${category.seo_url || category.slug}`;
}

function formatCount(count: number) {
  return `${count} ${count === 1 ? 'empresa' : 'empresas'}`;
}

function normalizeText(value: string) {
  return normalizeCategoryKey(value).replace(/-/g, ' ');
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
        className="bottom-0 top-3 flex h-auto max-h-[calc(100dvh-0.75rem)] w-[92vw] max-w-[430px] flex-col gap-0 rounded-r-[24px] border-r border-slate-200 bg-white p-0 shadow-2xl sm:w-[420px] [&>button]:hidden"
      >
        <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-slate-300" />

        <header className="shrink-0 px-4 pb-2 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {selectedCategory && (
                <button
                  type="button"
                  onClick={goBack}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-950 transition-colors hover:bg-slate-100"
                  aria-label="Voltar"
                >
                  <ArrowLeft className="h-[18px] w-[18px]" />
                </button>
              )}
              <h2 className="truncate text-xl font-black tracking-tight text-slate-950">
                {selectedCategory ? selectedCategory.name : 'Categorias'}
              </h2>
            </div>

            <button
              type="button"
              onClick={closeDrawer}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-950 transition-colors hover:bg-slate-200"
              aria-label="Fechar categorias"
            >
              <X className="h-[18px] w-[18px]" />
            </button>
          </div>

          <label className="mt-3 flex h-[50px] items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 text-slate-500 shadow-sm">
            <Search className="h-[18px] w-[18px] shrink-0 text-slate-950" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                selectedCategory ? `Buscar em ${selectedCategory.name}` : 'Buscar categorias'
              }
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-950 outline-none placeholder:text-slate-400"
            />
          </label>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-24 pt-1">
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

        <div className="shrink-0 border-t border-slate-100 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3">
          <Link
            href="/categories"
            onClick={closeDrawer}
            className="flex h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl bg-blue-700 text-sm font-black text-white shadow-[0_14px_26px_-18px_rgba(29,78,216,0.85)] transition-colors hover:bg-blue-800"
          >
            <Grid2X2 className="h-[18px] w-[18px]" />
            Ver todas as categorias
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
};

function LoadingList() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex h-[68px] items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3"
        >
          <Skeleton className="h-11 w-11 rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-[18px] w-[18px] rounded-full" />
        </div>
      ))}
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      <div className="mb-4 rounded-3xl bg-amber-50 p-4 text-amber-500 ring-8 ring-amber-50/50">
        <Zap className="h-8 w-8" />
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
    <div className="space-y-2.5">
      {categories.map((category, index) => {
        const iconSrc = getPreferredCategoryIcon(
          category.slug || category.seo_url,
          category.icon_url,
          category.name
        );
        const hasChildren = category.children && category.children.length > 0;

        return (
          <button
            key={category.id}
            type="button"
            onClick={() => (hasChildren ? onOpenCategory(category) : undefined)}
            className={`flex min-h-[68px] w-full items-center gap-3 rounded-[18px] border px-3 text-left transition-colors ${
              index === 0
                ? 'border-blue-200 bg-blue-50/40'
                : 'border-slate-100 bg-white hover:border-blue-100 hover:bg-blue-50/30'
            }`}
          >
            <CategoryIcon iconSrc={iconSrc} name={category.name} highlighted={index === 0} />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[15px] font-bold leading-tight text-slate-950">
                {category.name}
              </p>
              <p className="mt-0.5 text-[13px] font-semibold text-slate-500">
                {formatCount(category.companies_count || 0)}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-blue-700" />
          </button>
        );
      })}

      <Link
        href="/categories"
        onClick={onClose}
        className="flex min-h-[68px] items-center gap-3 rounded-[18px] border border-slate-200 bg-white px-3 transition-colors hover:bg-blue-50/40"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <Grid2X2 className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-slate-950">Ver todas as categorias</p>
          <p className="mt-0.5 text-[13px] font-semibold text-slate-500">
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
    <div className="space-y-2.5">
      <Link
        href={getCategoryHref(category)}
        onClick={onClose}
        className="flex min-h-[64px] items-center gap-3 rounded-[18px] border border-blue-100 bg-blue-50/60 px-3 text-blue-700 transition-colors hover:bg-blue-50"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
          <Grid2X2 className="h-[18px] w-[18px]" />
        </span>
        <p className="min-w-0 flex-1 text-[15px] font-bold leading-tight">
          Ver tudo em {category.name}
        </p>
        <ChevronRight className="h-5 w-5 shrink-0" />
      </Link>

      {subcategories.map((subcategory) => {
        const iconSrc = getPreferredCategoryIcon(
          subcategory.slug || subcategory.seo_url,
          subcategory.icon_url,
          subcategory.name
        );
        return (
          <Link
            key={subcategory.id}
            href={getCategoryHref(subcategory)}
            onClick={onClose}
            className="flex min-h-[64px] items-center gap-3 rounded-2xl bg-white px-2.5 transition-colors hover:bg-slate-50"
          >
            <CategoryIcon iconSrc={iconSrc} name={subcategory.name} size="sm" />
            <p className="line-clamp-2 min-w-0 flex-1 text-[15px] font-bold leading-snug text-slate-950">
              {subcategory.name}
            </p>
            {subcategory.companies_count > 0 && (
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-500">
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
  size = 'md',
}: {
  iconSrc: string | null;
  name: string;
  highlighted?: boolean;
  size?: 'sm' | 'md';
}) {
  const fallbackIcon = iconSrc || getCategoryIcon(null, name);
  const dimensions = size === 'sm' ? 'h-10 w-10' : 'h-12 w-12';
  const imageSize = size === 'sm' ? '40px' : '48px';

  return (
    <span
      className={`relative flex ${dimensions} shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 shadow-sm ${
        highlighted ? 'bg-white' : 'bg-slate-50'
      }`}
    >
      {fallbackIcon ? (
        <Image
          src={fallbackIcon}
          alt={`Ícone de ${name}`}
          fill
          className="object-contain p-1"
          sizes={imageSize}
        />
      ) : (
        <Grid2X2 className="h-5 w-5 text-blue-700" />
      )}
    </span>
  );
}
