import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import CategoryClientComponent from './CategoryClientComponent';
import CategoryBanner from '@/components/CategoryBanner';
import { fetchCategoryBySlug, categoriesApi } from '@/lib/api';
import { AlertCircle, Building2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface CategorySlugPageProps {
  params: {
    slug: string;
  };
}

// Enable Next.js ISR with 60 second revalidation
export const revalidate = 60;

async function CategoryPageServer({ params }: CategorySlugPageProps) {
  console.time(`[CategoryPage] Total load time for ${params.slug}`);
  const specialSlugs = new Set(['register-user', 'register', 'cadastro-usuario']);
  if (specialSlugs.has(params.slug)) {
    redirect('/register-user');
  }
  try {
    // Fetch category first to get the ID
    console.time(`[CategoryPage] Fetch category ${params.slug}`);
    const category = await fetchCategoryBySlug(params.slug);
    console.timeEnd(`[CategoryPage] Fetch category ${params.slug}`);
    
    // Fetch companies and banners in parallel to reduce total wait time
    console.time(`[CategoryPage] Fetch parallel data`);
    const [companies, banners] = await Promise.all([
      categoriesApi.getCompanies(category.id, { status: 'active' }),
      categoriesApi.getBanners(category.id, { limit: 5 }).catch(() => [])
    ]);
    console.timeEnd(`[CategoryPage] Fetch parallel data`);
    
    console.timeEnd(`[CategoryPage] Total load time for ${params.slug}`);

    // Pass the initial data to the client component
    return <CategoryClientComponent initialCategory={category} initialCompanies={companies || []} initialBanners={banners || []} />;
  } catch (error) {
    // Error state
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Categoria não encontrada
            </h1>
            <p className="text-gray-600 mb-6">
              A categoria &quot;{params.slug}&quot; não existe ou foi removida.
            </p>
            <div className="space-x-4">
              <Button asChild>
                <a href="/categories">Ver todas as categorias</a>
              </Button>
              <Button asChild variant="outline">
                <a href="/">Ir para Home</a>
              </Button>
            </div>
            <p className="mt-4 text-sm text-red-600">Erro: {(error as Error).message}</p>
          </div>
        </div>
      </div>
    );
  }
}

export default CategoryPageServer;
