'use client';

import React, { useMemo } from 'react';
import { CategoryTreeNode } from '@/hooks/useCategoriesTree';
import { CategoryColumn } from './CategoryColumn';

interface CategoriesGridProps {
  categories: CategoryTreeNode[];
}

export const CategoriesGrid: React.FC<CategoriesGridProps> = ({ categories }) => {
  // Pegar top 5 populares para destaque visual opcional
  const popularIds = useMemo(() => {
    return categories
      .slice()
      .sort((a, b) => b.companies_count - a.companies_count)
      .slice(0, 5)
      .map(c => c.id);
  }, [categories]);

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <p className="text-sm">Nenhuma categoria encontrada.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-x-6 gap-y-8">
      {categories.map((category) => (
        <CategoryColumn 
          key={category.id} 
          category={category} 
          isPopular={popularIds.includes(category.id)}
        />
      ))}
    </div>
  );
};
