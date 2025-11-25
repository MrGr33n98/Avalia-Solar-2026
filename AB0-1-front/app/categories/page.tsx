import { Suspense } from 'react';
import CategoriesClient from './CategoriesClient';

export default function CategoriesPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Carregando categorias...</div>}>
      <CategoriesClient />
    </Suspense>
  );
}
