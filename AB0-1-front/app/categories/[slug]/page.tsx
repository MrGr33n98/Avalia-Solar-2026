import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import CategoryPageServer from './CategoryPageServer';
import type { Category } from '@/lib/api';
import { getCachedPublicCategory } from '@/lib/server/category-discovery/get-public-category';
import {
  buildCategoryPageMetadata,
  resolveCategoryCanonicalPath,
  resolveCategoryCanonicalSlug,
} from '@/lib/seo/category-metadata';
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema';
import { Skeleton } from '@/components/ui/skeleton';

export const revalidate = 1800; // ISR - 30 minutos

interface CategorySlugPageProps {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

/**
 * Slugs que não são categorias e devem redirecionar para cadastro.
 */
const REDIRECT_SLUGS = new Set([
  'register-user',
  'register',
  'cadastro-usuario',
  'signup',
]);

function BreadcrumbsWrapper({ category, fallbackSlug }: { category: Category; fallbackSlug: string }) {
  const canonicalSlug = resolveCategoryCanonicalSlug(category, fallbackSlug);
  const parentCanonicalSlug = category.parent?.seo_url || category.parent?.slug;
  return (
    <BreadcrumbSchema
      items={[
        { name: 'Início', item: '/' },
        { name: 'Categorias', item: '/categories' },
        ...(category.parent?.name && parentCanonicalSlug
          ? [
              {
                name: category.parent.name,
                item: `/categories/${parentCanonicalSlug}`,
              },
            ]
          : []),
        { name: category.name, item: `/categories/${canonicalSlug}` },
      ]}
    />
  );
}

export async function generateMetadata({ params, searchParams }: CategorySlugPageProps): Promise<Metadata> {
  if (REDIRECT_SLUGS.has(params.slug)) {
    return {
      title: 'Cadastro | Avalia Solar',
      robots: { index: false, follow: false },
    };
  }

  const result = await getCachedPublicCategory(params.slug, { revalidate: 3600 });

  if (result.status === 'not_found') {
    return {
      title: 'Categoria não encontrada | Avalia Solar',
      robots: { index: false, follow: false },
    };
  }

  return buildCategoryPageMetadata({
    category: result.category,
    requestedSlug: params.slug,
    searchParams,
  });
}

function CategoryLoadingFallback() {
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Fallback */}
      <div className="md:hidden">
        <div className="p-4 space-y-6">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <div className="grid grid-cols-5 gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-2 w-full mx-auto" />
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-5 w-10" />
            </div>
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Fallback */}
      <div className="hidden md:block container mx-auto px-4 py-8">
        <Skeleton className="h-4 w-48 mb-6" />
        <div className="flex justify-between items-start mb-12">
          <div className="space-y-4 w-full max-w-2xl">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <Skeleton className="h-12 w-48 rounded-xl" />
        </div>

        <div className="grid grid-cols-[280px_1fr] gap-8">
          <aside className="space-y-6">
            <Skeleton className="h-[500px] w-full rounded-xl" />
          </aside>
          <main className="space-y-8">
            <Skeleton className="h-48 w-full rounded-xl" />
            <div className="space-y-6">
              <div className="flex justify-between items-end pb-4 border-b border-gray-100">
                <div className="space-y-2">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-80 w-full rounded-xl" />
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default async function CategorySlugPage({ params, searchParams }: CategorySlugPageProps) {
  if (REDIRECT_SLUGS.has(params.slug)) redirect('/signup');

  // CDSI-012 / CDSI-013 / CDSI-046: Resolve existência e redirect canônico ANTES do Suspense.
  // - 404 legítimo -> notFound() imediato (HTTP 404 nos headers iniciais).
  // - slug antigo (histórico) -> permanentRedirect (HTTP 308 em 1 hop para canonical_path).
  // - 5xx / timeout -> propaga exceção para error.tsx (HTTP 500, nunca soft 404).
  const result = await getCachedPublicCategory(params.slug, { revalidate: 3600 });
  if (result.status === 'not_found') {
    notFound();
  }

  if (result.status === 'redirect') {
    permanentRedirect(result.destinationPath);
  }

  const { category } = result;
  const canonicalPath = resolveCategoryCanonicalPath(category, params.slug);
  if (params.slug.trim().toLowerCase() !== resolveCategoryCanonicalSlug(category, params.slug)) {
    permanentRedirect(canonicalPath);
  }

  return (
    <>
      <BreadcrumbsWrapper category={category} fallbackSlug={params.slug} />
      <Suspense fallback={<CategoryLoadingFallback />}>
        <div className="relative">
          <CategoryPageServer
            params={params}
            searchParams={searchParams}
            initialCategory={category}
          />
        </div>
      </Suspense>
    </>
  );
}
