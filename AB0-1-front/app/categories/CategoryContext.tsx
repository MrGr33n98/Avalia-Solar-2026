'use client';

import { createContext, useContext, ReactNode } from 'react';
import { Category } from '@/lib/api';

interface CategoryContextType {
  category: Category | null;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export function CategoryProvider({ children, category }: { children: ReactNode; category: Category | null }) {
  return (
    <CategoryContext.Provider value={{ category }}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategory() {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategory must be used within a CategoryProvider');
  }
  return context;
}