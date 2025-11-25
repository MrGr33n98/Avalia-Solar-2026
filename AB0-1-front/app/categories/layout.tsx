'use client';

import { ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { CategoryProvider } from './CategoryContext';
import { useCategory } from '@/hooks/useCategory';

export default function CategoryLayout({ children }: { children: ReactNode }) {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const identifier = slug || (id ? Number(id) : null);
  const { category, loading } = useCategory(identifier || 0);

  return (
    <CategoryProvider category={category}>
      {loading ? <div>Loading...</div> : children}
    </CategoryProvider>
  );
}