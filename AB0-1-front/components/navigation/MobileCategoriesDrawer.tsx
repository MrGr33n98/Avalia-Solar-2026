'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, Grid2X2, Search, X, Zap, RefreshCw } from 'lucide-react';

import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useCategoriesTree, type CategoryTreeNode } from '@/hooks/useCategoriesTree';
import {
  getCategoryIcon,
  getPreferredCategoryIcon,
  normalizeCategoryKey,
} from '@/lib/categoryIcons';
import { useAuth } from '@/contexts/AuthContext';
import { openSignupGate } from '@/lib/signup-gate';

interface MobileCategoriesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  id?: string;
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
  id = 'mobile-categories-drawer',
}) => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { categories, loading, error } = useCategoriesTree();
  const [selectedCategory, setSelectedCategory] = useState<CategoryTreeNode | null>(null);
  const [query, setQuery] = useState('');

  const handleViewAllCategories = () => {
    closeDrawer();
    if (!isAuthenticated) {
      openSignupGate({
        source: 'search_results',
        returnTo: '/categories',
        title: 'Explore todas as categorias',
        description: 'Crie sua conta gratuita para ver e filtrar todas as categorias disponíveis.',
      });
    } else {
      router.push('/categories');
    }
  };

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
        id={id}
        side="left"
        className="bottom-0 top-0 flex h-dvh max-h-dvh w-[92vw] max-w-[430px] flex-col gap-0 rounded-2xl border-r border-neutral-200 bg-[#fafafa] p-0 shadow-[8px_0_24px_rgba(0,0,0,0.08)] sm:w-[420px] [&>button]:hidden"
      >
        <header className="shrink-0 border-b border-slate-200 px-4 pb-4 pt-[max(1rem,var(--safe-area-inset-top))]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {selectedCategory && (
                <button
                  type="button"
                  onClick={goBack}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-950 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500"
                  aria-label="Voltar para categorias principais"
                >
                  <ArrowLeft className="h-[18px] w-[18px]" aria-hidden="true" />
                </button>
              )}
              <h2 className="truncate text-xl font-semibold tracking-tight text-slate-950">
                {selectedCategory ? selectedCategory.name : 'Categorias'}
              </h2>
            </div>

            <button
              type="button"
              onClick={closeDrawer}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-900 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500"
              aria-label="Fechar menu de categorias"
            >
              <X className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
          </div>

          <label className="mt-4 flex h-11 items-center gap-2.5 rounded-2xl border border-neutral-300 bg-white px-3.5 text-neutral-500 shadow-[0_2px_8px_rgba(0,0,0,0.03)] focus-within:border-neutral-900 focus-within:ring-2 focus-within:ring-neutral-500/20">
            <Search className="h-[18px] w-[18px] shrink-0 text-slate-950" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                selectedCategory ? `Buscar em ${selectedCategory.name}` : 'Buscar categorias'
              }
              aria-label={selectedCategory ? `Buscar em ${selectedCategory.name}` : 'Buscar categorias'}
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-950 outline-none placeholder:text-slate-400"
            />
          </label>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-24 pt-4">
          {!isAuthenticated && !selectedCategory && (
            <div className="mb-4 flex flex-col gap-2.5 rounded-2xl border border-neutral-200 bg-[#f0f0f0] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
              <p className="text-xs font-semibold leading-relaxed text-slate-700">
                Acesse sua conta para comparar propostas e acompanhar avaliações.
              </p>
              <div className="flex gap-2 mt-1">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-9 flex-1 border-neutral-300 bg-white text-xs font-semibold text-neutral-900 shadow-none hover:bg-neutral-100"
                >
                  <Link href="/login" onClick={closeDrawer}>
                    Entrar
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="h-9 flex-1 bg-gradient-to-br from-neutral-900 to-neutral-700 text-xs font-semibold text-white shadow-[0_3px_10px_rgba(0,0,0,0.1)] hover:from-black hover:to-neutral-800"
                >
                  <Link href="/register" onClick={closeDrawer}>
                    Criar conta
                  </Link>
                </Button>
              </div>
            </div>
          )}

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

        <div className="shrink-0 border-t border-neutral-200 bg-[#fafafa] px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3">
          <button
            type="button"
            onClick={handleViewAllCategories}
            className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-700 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-colors hover:from-black hover:to-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500"
          >
            <Grid2X2 className="h-[18px] w-[18px]" aria-hidden="true" />
            {isAuthenticated ? 'Ver todas as categorias' : 'Entrar para ver categorias'}
          </button>
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
          className="flex h-[68px] items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-3 shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
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
      <div className="mb-4 rounded-2xl border border-neutral-200 bg-[#f0f0f0] p-4 text-neutral-700">
        <Zap className="h-8 w-8" aria-hidden="true" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-slate-950">Menu em manutenção</h3>
      <p className="mb-6 text-sm leading-relaxed text-slate-500">
        Estamos ajustando as categorias. Tente recarregar ou explore todas as opções.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-neutral-300 bg-white px-6 text-sm font-semibold text-neutral-700 transition-colors hover:bg-[#f0f0f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500"
      >
        <RefreshCw className="h-4 w-4 text-neutral-700" aria-hidden="true" />
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
    <div className="border-t border-slate-200">
      <nav aria-label="Navegação principal" className="grid grid-cols-2 gap-2 border-b border-slate-200 py-3">
        {[
          { href: '/companies', label: 'Empresas' },
          { href: '/categories', label: 'Categorias' },
          { href: '/#como-funciona', label: 'Como funciona' },
          { href: '/blog', label: 'Conteúdo' },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className="flex min-h-11 items-center rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition-colors hover:border-neutral-300 hover:bg-[#f0f0f0] hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {categories.map((category) => {
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
            className={`flex min-h-[68px] w-full items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-3 text-left shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-colors hover:border-neutral-300 hover:bg-[#f0f0f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500`}
          >
            <CategoryIcon iconSrc={iconSrc} name={category.name} />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[15px] font-medium leading-tight text-slate-950">
                {category.name}
              </p>
              <p className="mt-0.5 text-xs font-normal text-slate-500">
                {formatCount(category.companies_count || 0)}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-neutral-700" aria-hidden="true" />
          </button>
        );
      })}

      <Link
        href="/categories"
        onClick={onClose}
        className="flex min-h-[68px] items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-3 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-colors hover:border-neutral-300 hover:bg-[#f0f0f0]"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-neutral-200 bg-[#f0f0f0] text-neutral-700">
          <Grid2X2 className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium text-slate-950">Ver todas as categorias</p>
          <p className="mt-0.5 text-xs font-normal text-slate-500">
            Explore todas as opções disponíveis
          </p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
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
    <div className="border-t border-slate-200">
      <Link
        href={getCategoryHref(category)}
        onClick={onClose}
        className="flex min-h-[64px] items-center gap-3 rounded-2xl border border-neutral-200 bg-[#f0f0f0] px-3 text-neutral-900 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-colors hover:border-neutral-300 hover:bg-white"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-700 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <Grid2X2 className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
        <p className="min-w-0 flex-1 text-[15px] font-medium leading-tight">
          Ver tudo em {category.name}
        </p>
        <ChevronRight className="h-5 w-5 shrink-0" aria-hidden="true" />
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
            className="flex min-h-[64px] items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-colors hover:border-neutral-300 hover:bg-[#f0f0f0]"
          >
            <CategoryIcon iconSrc={iconSrc} name={subcategory.name} size="sm" />
            <p className="line-clamp-2 min-w-0 flex-1 text-[15px] font-medium leading-snug text-slate-950">
              {subcategory.name}
            </p>
            {subcategory.companies_count > 0 && (
              <span className="shrink-0 rounded-sm border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                {subcategory.companies_count}
              </span>
            )}
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
          </Link>
        );
      })}
    </div>
  );
}

function CategoryIcon({
  iconSrc,
  name,
  size = 'md',
}: {
  iconSrc: string | null;
  name: string;
  size?: 'sm' | 'md';
}) {
  const fallbackIcon = iconSrc || getCategoryIcon(null, name);
  const dimensions = size === 'sm' ? 'h-10 w-10' : 'h-12 w-12';
  const imageSize = size === 'sm' ? '40px' : '48px';

  return (
    <span
      className={`relative flex ${dimensions} shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 bg-[#f0f0f0] shadow-[0_2px_8px_rgba(0,0,0,0.03)]`}
    >
      {fallbackIcon ? (
        <Image
          src={fallbackIcon}
          alt=""
          fill
          className="object-contain p-1"
          sizes={imageSize}
        />
      ) : (
        <Grid2X2 className="h-5 w-5 text-neutral-700" aria-hidden="true" />
      )}
    </span>
  );
}
