'use client';

import React, { useState, useMemo } from 'react';
import { useCategoriesTree } from '@/hooks/useCategoriesTree';
import { CategorySearch } from './CategorySearch';
import { CategoriesGrid } from './CategoriesGrid';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, ArrowRight, Zap } from 'lucide-react';
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-6">
          {[...Array(14)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-5 w-32 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full rounded-sm" />
                <Skeleton className="h-3 w-3/4 rounded-sm" />
                <Skeleton className="h-3 w-1/2 rounded-sm" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error && categories.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-amber-50 text-amber-600 p-3 rounded-full mb-4">
            <Zap className="h-6 w-6" />
          </div>
          <h3 className="text-slate-900 font-semibold mb-1">Menu Temporariamente Indisponível</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6 px-4">
            Estamos com dificuldades para carregar as categorias. Você ainda pode pesquisar ou ver a listagem completa.
          </p>
          <Link 
            href="/categories" 
            onClick={onClose}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Acessar Todas as Categorias
          </Link>
        </div>
      );
    }

    return <CategoriesGrid categories={filteredTree} />;
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
