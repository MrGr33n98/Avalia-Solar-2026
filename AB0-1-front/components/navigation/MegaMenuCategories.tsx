'use client';

import React from 'react';
import { useCategoriesTree } from '@/hooks/useCategoriesTree';
import { CategoryColumn } from './CategoryColumn';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

interface MegaMenuCategoriesProps {
  isOpen: boolean;
}

export const MegaMenuCategories: React.FC<MegaMenuCategoriesProps> = ({ isOpen }) => {
  const { categories, loading, error } = useCategoriesTree();

  if (error) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="absolute top-full left-0 w-full bg-white shadow-2xl border-t border-slate-100 z-50 overflow-hidden rounded-b-3xl"
        >
          <div className="container mx-auto py-10 px-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-10">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-6 w-32" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-10">
                {categories.map((category) => (
                  <CategoryColumn key={category.id} category={category} />
                ))}
              </div>
            )}
          </div>
          
          <div className="bg-slate-50 py-4 px-6 text-center border-t border-slate-100">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              Encontre os melhores fornecedores de energia solar do Brasil
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
