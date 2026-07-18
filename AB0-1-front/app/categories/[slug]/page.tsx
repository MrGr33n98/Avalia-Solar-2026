import { Suspense } from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import CategoryPageServer from './CategoryPageServer';
import { publicCategoriesApi } from '@/lib/api-public';
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema';
import { absoluteUrl } from '@/lib/site';
import { shouldNoindexSearchParams } from '@/lib/seo/search-params';

export const revalidate = 1800; // ISR - 30 minutos

interface CategorySlugPageProps {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

async function BreadcrumbsWrapper({ slug }: { slug: string }) {
  try {
    const category = await publicCategoriesApi.getBySlug(slug, { revalidate: 3600 });
    if (!category) return null;

    return (
      <BreadcrumbSchema
        items={[
          { name: 'Início', item: '/' },
          { name: 'Categorias', item: '/categories' },
          { name: category.name, item: `/categories/${category.slug}` }
        ]}
      />
    );
  } catch {
    return null;
  }
}

export async function generateMetadata({ params, searchParams }: CategorySlugPageProps): Promise<Metadata> {
  try {
    const category = await publicCategoriesApi.getBySlug(params.slug, { revalidate: 3600 });
    
    if (!category) {
      return {
        title: 'Categoria não encontrada | Avalia Solar',
        robots: { index: false, follow: false },
      };
    }

    const city = typeof searchParams?.city === 'string' ? searchParams.city : '';
    const state = typeof searchParams?.state === 'string' ? searchParams.state.toUpperCase() : '';

    let locationSuffix = '';
    if (city) {
      const formattedCity = city.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      locationSuffix = ` em ${formattedCity}${state ? ` - ${state}` : ''}`;
    } else if (state) {
      locationSuffix = ` em ${state}`;
    }

    const baseTitle = category.seo_title || category.name;
    const title = `${baseTitle}${locationSuffix} | Avalia Solar`;
    const description = [
      category.seo_description || category.short_description || category.description || `Encontre as melhores empresas e orçamentos de ${category.name} no Avalia Solar.`,
      locationSuffix ? `Atendendo na região de ${locationSuffix.replace(' em ', '')}.` : '',
    ].filter(Boolean).join(' ').slice(0, 160);
    const keywords = category.seo_keywords || ['energia solar', category.name, 'melhores empresas'].join(', ');
    const noindex = shouldNoindexSearchParams(searchParams);

    return {
      title,
      description,
      keywords,
      robots: noindex ? { index: false, follow: true } : undefined,
      alternates: {
        canonical: absoluteUrl(`/categories/${params.slug}`),
      },
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
  } catch {
    return {
      title: 'Avalia Solar',
      robots: { index: false, follow: true },
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

import { Skeleton } from '@/components/ui/skeleton';

function CategoryLoadingFallback() {
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Fallback */}
      <div className="md:hidden">
        <div className="p-4 space-y-6">
          <Skeleton className="h-48 w-full rounded-2xl" /> {/* Hero */}
          <div className="grid grid-cols-5 gap-2"> {/* Quick Actions */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-2 w-full mx-auto" />
              </div>
            ))}
          </div>
          <div className="space-y-4"> {/* Companies */}
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
        <Skeleton className="h-4 w-48 mb-6" /> {/* Breadcrumb */}
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
            <Skeleton className="h-[500px] w-full rounded-xl" /> {/* Filters */}
          </aside>
          <main className="space-y-8">
            <Skeleton className="h-48 w-full rounded-xl" /> {/* Banner */}
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

export default function CategorySlugPage({ params, searchParams }: CategorySlugPageProps) {
  // mesma lógica: se slug for “especial”, redireciona
  if (REDIRECT_SLUGS.has(params.slug)) redirect('/signup');

  return (
    <>
      <Suspense fallback={null}>
        <BreadcrumbsWrapper slug={params.slug} />
      </Suspense>
      <Suspense fallback={<CategoryLoadingFallback />}>
        {/* Mantive wrapper simples; z-index 800 costuma ser desnecessário aqui */}
        <div className="relative">
          <CategoryPageServer params={params} searchParams={searchParams} />
        </div>
      </Suspense>
    </>
  );
}
