'use client';

import React, { useState, useMemo } from 'react';
import { useCategoriesTree } from '@/hooks/useCategoriesTree';
import { CategorySearch } from './CategorySearch';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Headphones, Zap } from 'lucide-react';
import Link from 'next/link';

interface CategoriesMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CategoriesMegaMenu: React.FC<CategoriesMegaMenuProps> = ({ isOpen, onClose }) => {
  const { categories, loading, error, filterCategories } = useCategoriesTree();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTree = useMemo(() => {
    return filterCategories(categories, searchQuery);
  }, [categories, searchQuery, filterCategories]);

  // Fallback state if the menu is open but categories failed to load
  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 divide-y divide-slate-200 md:grid-cols-4 md:divide-x md:divide-y-0">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col gap-3 animate-pulse">
              <div className="flex items-center gap-3 px-6 py-5">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2 ml-13">
                <div className="h-3 bg-slate-50 rounded w-full" />
                <div className="h-3 bg-slate-50 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error && categories.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center border border-slate-200 bg-white py-12 text-center rounded-none">
          <div className="mb-5 border border-amber-200 bg-amber-50 p-4 text-amber-500 rounded-none">
            <Zap className="h-8 w-8" />
          </div>
          <h3 className="text-slate-900 text-lg font-bold mb-2">Menu em Manutenção</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
            Estamos otimizando a árvore de categorias para você. Enquanto isso, explore nossa
            listagem completa.
          </p>
          <Link
            href="/categories"
            onClick={onClose}
            className="inline-flex items-center rounded-none bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Acessar Todas as Categorias
          </Link>
        </div>
      );
    }

    return (
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.05,
            },
          },
        }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 divide-y divide-slate-200 md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-4"
      >
        {filteredTree.slice(0, 4).map((category) => (
            <motion.div
              key={category.id}
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: { opacity: 1, y: 0 },
              }}
              className="group flex min-w-0 flex-col px-6 py-5"
            >
              {/* Categoria Pai */}
              <Link
                href={`/categories/${category.slug}`}
                onClick={onClose}
                className="group/parent flex min-w-0 flex-col"
              >
                <div className="flex flex-col min-w-0">
                  <span className="truncate text-[15px] font-semibold leading-tight text-slate-950 transition-colors group-hover/parent:text-blue-600">
                    {category.name}
                  </span>
                  <span className="mt-1 text-xs font-medium text-slate-500">
                    {category.companies_count} Empresas
                  </span>
                </div>
              </Link>

              {/* Subcategorias (Filhos) */}
              {category.children && category.children.length > 0 && (
                <div className="mt-5 flex flex-col gap-3">
                  {category.children.slice(0, 4).map((child) => {
                    return (
                      <Link
                        key={child.id}
                        href={`/categories/${child.slug}`}
                        onClick={onClose}
                        className="group/child flex items-center gap-2 text-[13px] font-normal text-slate-600 transition-colors hover:text-blue-600"
                      >
                        <ArrowRight className="h-3 w-3 shrink-0 text-slate-400 transition-transform group-hover/child:translate-x-0.5 group-hover/child:text-blue-600" />
                        <span className="truncate">{child.name}</span>
                      </Link>
                    );
                  })}
                  {category.children.length > 4 && (
                    <Link
                      href={`/categories/${category.slug}`}
                      onClick={onClose}
                      className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Ver todas ({category.children.length})
                    </Link>
                  )}
                </div>
              )}
            </motion.div>
        ))}
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop para fechar ao clicar fora */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-950/10"
          />

          {/* Menu Container */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute left-0 top-full z-50 w-full overflow-hidden border-y border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
          >
            <div className="mx-auto flex max-h-[min(620px,calc(100vh-80px))] max-w-7xl flex-col overflow-y-auto border-x border-slate-200 bg-white">
              {/* Sticky Header dentro do Menu */}
              <div className="sticky top-0 z-10 flex items-center justify-between gap-6 border-b border-slate-200 bg-white px-6 py-4">
                <p className="text-sm font-semibold text-slate-950">Explorar categorias</p>
                <div className="w-full max-w-sm"><CategorySearch value={searchQuery} onChange={setSearchQuery} /></div>
              </div>

              <div className="grid lg:grid-cols-[245px_1fr]">
                <aside className="border-b border-slate-200 p-6 lg:border-b-0 lg:border-r">
                  <h2 className="text-lg font-semibold tracking-tight text-slate-950">Explorar categorias</h2>
                  <p className="mt-3 text-sm font-normal leading-6 text-slate-600">Encontre empresas especializadas no que você precisa.</p>
                  <Link href="/categories" onClick={onClose} className="mt-5 flex h-11 items-center justify-between rounded-none border border-slate-300 px-4 text-sm font-medium text-slate-950 hover:bg-slate-50">Ver todas as categorias <ArrowRight className="h-4 w-4" /></Link>
                  <div className="mt-6 border border-blue-100 bg-blue-50/60 p-4">
                    <Headphones className="h-5 w-5 text-blue-600" />
                    <p className="mt-3 text-sm font-medium text-slate-950">Precisa de ajuda?</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">Peça orientações e compare propostas verificadas.</p>
                    <Link href="/compare" onClick={onClose} className="mt-3 flex items-center gap-2 text-xs font-semibold text-blue-600">Comparar gratuitamente <ArrowRight className="h-3 w-3" /></Link>
                  </div>
                </aside>
                <div className="min-w-0">{renderContent()}</div>
              </div>

              {/* Footer / Destaque Rápido (apenas se houver categorias) */}
              {categories.length > 0 && (
                <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-medium text-slate-500">
                      Populares agora:
                    </span>
                    <div className="flex gap-2">
                      {categories.slice(0, 3).map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/categories/${cat.slug}`}
                          onClick={onClose}
                          className="flex items-center gap-1.5 rounded-none border border-slate-300 bg-white px-3 py-1.5 text-[11px] text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-600"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <Link href="/categories" onClick={onClose} className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-blue-600">Mais de {categories.length} categorias <ArrowRight className="h-3 w-3" /></Link>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
