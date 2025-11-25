import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import CategoryPageServer from './CategoryPageServer';

interface CategorySlugPageProps {
  params: {
    slug: string;
  };
}

export default function CategorySlugPage({ params }: CategorySlugPageProps) {
  const specials = new Set(['register-user', 'register', 'cadastro-usuario']);
  if (specials.has(params.slug)) {
    redirect('/register-user');
  }
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando categoria...</p>
        </div>
      </div>
    }>
      <CategoryPageServer params={params} />
    </Suspense>
  );
}
