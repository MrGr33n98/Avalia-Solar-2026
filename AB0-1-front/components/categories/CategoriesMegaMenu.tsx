'use client';

import React, { useState, useMemo } from 'react';
import { useCategoriesTree } from '@/hooks/useCategoriesTree';
import { CategorySearch } from './CategorySearch';
import { CategoriesGrid } from './CategoriesGrid';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';
import { getPreferredCategoryIcon } from './categoryIcons';

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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-10">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex flex-col gap-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200" />
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
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="bg-amber-50 text-amber-500 p-4 rounded-2xl mb-5 ring-4 ring-amber-50/50">
            <Zap className="h-8 w-8" />
          </div>
          <h3 className="text-slate-900 text-lg font-bold mb-2">Menu em Manutenção</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
            Estamos otimizando a árvore de categorias para você. Enquanto isso, explore nossa listagem completa.
          </p>
          <Link 
            href="/categories" 
            onClick={onClose}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
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
              staggerChildren: 0.05
            }
          }
        }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-10 gap-y-12"
      >
        {filteredTree.map((category) => {
          const iconSrc = getPreferredCategoryIcon(category.slug, category.icon_url);
          return (
            <motion.div
            key={category.id}
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0 }
            }}
            className="group flex flex-col gap-4"
          >
            {/* Categoria Pai */}
            <Link
              href={`/categories/${category.slug}`}
              onClick={onClose}
              className="flex items-start gap-3.5 group/parent"
            >
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 group-hover/parent:bg-blue-600 group-hover/parent:text-white transition-all duration-300 shadow-sm group-hover/parent:shadow-blue-200 overflow-hidden">
                {iconSrc ? (
                  <img src={iconSrc} alt={category.name} className="w-full h-full object-contain" />
                ) : (
                  <SlidersHorizontal className="h-5 w-5" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[15px] font-bold text-slate-900 group-hover/parent:text-blue-600 transition-colors truncate leading-tight">
                  {category.name}
                </span>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-tight mt-0.5">
                  {category.companies_count} Empresas
                </span>
              </div>
            </Link>

            {/* Subcategorias (Filhos) */}
            {category.children && category.children.length > 0 && (
              <div className="flex flex-col gap-2.5 pl-1 pr-2 border-l-2 border-slate-50 ml-5">
                {category.children.slice(0, 4).map((child) => (
                  <Link
                    key={child.id}
                    href={`/categories/${child.slug}`}
                    onClick={onClose}
                    className="text-[13px] text-slate-500 hover:text-blue-600 hover:translate-x-1 transition-all font-medium flex items-center gap-2 group/child"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover/child:bg-blue-400 group-hover/child:scale-125 transition-all" />
                    <span className="truncate">{child.name}</span>
                  </Link>
                ))}
                {category.children.length > 4 && (
                  <Link
                    href={`/categories/${category.slug}`}
                    onClick={onClose}
                    className="text-[11px] font-bold text-blue-500/80 hover:text-blue-600 mt-1 pl-3.5"
                  >
                    + {category.children.length - 4} especialidades
                  </Link>
                )}
              </div>
            )}
          </motion.div>
          );
        })}
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
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
          />

          {/* Menu Container */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute top-full left-0 w-full bg-white shadow-2xl border-t border-slate-100 z-50 overflow-hidden"
          >
            <div className="container mx-auto max-w-7xl flex flex-col max-h-[420px]">
              
              {/* Sticky Header dentro do Menu */}
              <div className="sticky top-0 bg-white border-b border-slate-50 px-6 py-4 flex items-center justify-between gap-8 z-10">
                <div className="flex items-center gap-6 flex-1">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm shrink-0">
                    <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg">
                      <SlidersHorizontal className="h-4 w-4" />
                    </div>
                    Explorar Categorias
                  </div>
                  
                  <CategorySearch value={searchQuery} onChange={setSearchQuery} />
                </div>

                <div className="flex items-center gap-4">
                  <Link 
                    href="/categories" 
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors group"
                    onClick={onClose}
                  >
                    Ver todas as categorias
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Scrollable Grid Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/30">
                {renderContent()}
              </div>

              {/* Footer / Destaque Rápido (apenas se houver categorias) */}
              {categories.length > 0 && (
                <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Populares agora:</span>
                    <div className="flex gap-2">
                      {categories.slice(0, 3).map(cat => (
                        <Link 
                          key={cat.id}
                          href={`/categories/${cat.slug}`}
                          onClick={onClose}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white border border-slate-200 text-[11px] text-slate-600 hover:border-blue-200 hover:text-blue-600 transition-all shadow-sm"
                        >
                          <Zap className="h-3 w-3 text-amber-500" />
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Mais de {categories.length} categorias de energia solar
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
