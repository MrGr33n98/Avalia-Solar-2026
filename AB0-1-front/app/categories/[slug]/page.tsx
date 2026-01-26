import { Suspense } from 'react';
import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import CategoryPageServer from './CategoryPageServer';
import { categoriesApi } from '@/lib/api';

interface CategorySlugPageProps {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({ params }: CategorySlugPageProps): Promise<Metadata> {
  try {
    const category = await categoriesApi.getBySlug(params.slug);
    
    if (!category) {
      return {
        title: 'Categoria não encontrada | Avalia Solar',
      };
    }

    const title = category.seo_title || `${category.name} | Avalia Solar`;
    const description = category.short_description || category.description || `Encontre as melhores empresas e orçamentos de ${category.name} no Avalia Solar.`;
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        images: category.banner_url ? [category.banner_url] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: category.banner_url ? [category.banner_url] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Avalia Solar',
    };
  }
}

/**
 * Slugs que não são categorias e devem redirecionar para cadastro.
 * Mantido igual à sua regra, só organizado fora do componente.
 */
const REDIRECT_SLUGS = new Set([
  'register-user',
  'register',
  'cadastro-usuario',
  'signup',
]);

function CategoryLoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6">
        <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Carregando categoria</p>
              <p className="text-xs text-muted-foreground">
                Preparando empresas e filtros...
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="h-3 w-3/4 rounded bg-muted" />
            <div className="h-3 w-2/3 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CategorySlugPage({ params, searchParams }: CategorySlugPageProps) {
  // mesma lógica: se slug for “especial”, redireciona
  if (REDIRECT_SLUGS.has(params.slug)) redirect('/signup');

  return (
    <Suspense fallback={<CategoryLoadingFallback />}>
      {/* Mantive wrapper simples; z-index 800 costuma ser desnecessário aqui */}
      <div className="relative">
        <CategoryPageServer params={params} searchParams={searchParams} />
      </div>
    </Suspense>
  );
}
