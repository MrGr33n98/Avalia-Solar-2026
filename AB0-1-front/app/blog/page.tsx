import { Metadata } from 'next';
import { Suspense } from 'react';
import { blogApi } from '@/lib/api/blog';
import { BlogHero } from '@/components/blog/BlogHero';
import { CategoryHighlights } from '@/components/blog/CategoryHighlights';
import { FeaturedPostsSection } from '@/components/blog/FeaturedPostsSection';
import { BlogFiltersBar } from '@/components/blog/BlogFiltersBar';
import { PostCard } from '@/components/blog/PostCard';
import { BlogSidebar } from '@/components/blog/BlogSidebar';
import { StickyMobileCTA } from '@/components/blog/StickyMobileCTA';
import { NewsletterPopup } from '@/components/blog/NewsletterPopup';
import { BlogIntentTracker } from '@/components/blog/BlogIntentTracker';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Blog Avalia Solar - Dicas e Guias de Energia Solar',
  description: 'Confira os melhores artigos, notícias e guias sobre energia solar fotovoltaica. Economize na conta de luz com conhecimento.',
};

export default async function BlogIndexPage({ 
  searchParams 
}: { 
  searchParams: { page?: string; q?: string; category?: string; sort?: string } 
}) {
  const page = Number(searchParams.page) || 1;
  const { data: posts, meta } = await blogApi.fetchPosts({
    page,
    per_page: 9,
    q: searchParams.q,
    category: searchParams.category,
    sort: searchParams.sort
  });
  
  const categories = await blogApi.fetchCategories();
  const featuredPosts = await blogApi.fetchFeatured();
  const verifiedCompanies = await blogApi.fetchVerifiedCompanies();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Blog Avalia Solar',
    description: 'Confira os melhores artigos, notícias e guias sobre energia solar fotovoltaica.',
    publisher: {
      '@type': 'Organization',
      name: 'Avalia Solar',
      logo: {
        '@type': 'ImageObject',
        url: 'https://avaliasolar.com.br/images/avalia-solar-logo-horizontal.svg'
      }
    }
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://avaliasolar.com.br'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: 'https://avaliasolar.com.br/blog'
      }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* Hero Section - Full Width */}
      <div className="bg-white pb-8 pt-6 border-b border-slate-100">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BlogHero />
          <CategoryHighlights />
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Posts (Only on first page and no filters) */}
        {!searchParams.q && !searchParams.category && page === 1 && (
          <FeaturedPostsSection posts={featuredPosts} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Main Content */}
          <main className="lg:col-span-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Últimos Artigos</h2>
              <Suspense fallback={<div className="h-20 w-full animate-pulse bg-slate-100 rounded-xl" />}>
                <BlogFiltersBar categories={categories} />
              </Suspense>
            </div>

            {posts.length > 0 ? (
              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {posts.map((post, index) => (
                    <PostCard key={post.id} post={post} position={index + 1} />
                  ))}
                </div>

                {/* Simple Pagination */}
                {meta.total_pages > 1 && (
                  <div className="flex justify-center gap-2 pt-4">
                     {page > 1 && (
                       <Button variant="outline" asChild>
                         <a href={`/blog?page=${page - 1}`}>Anterior</a>
                       </Button>
                     )}
                     <div className="flex items-center px-4 text-sm font-medium text-slate-600">
                       Página {page} de {meta.total_pages}
                     </div>
                     {page < meta.total_pages && (
                       <Button variant="outline" asChild>
                         <a href={`/blog?page=${page + 1}`}>Próxima</a>
                       </Button>
                     )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-200">
                <div className="text-slate-400 mb-4 text-6xl">🔍</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhum artigo encontrado</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  Tente ajustar seus filtros ou busca para encontrar o que procura.
                </p>
                <Button variant="link" className="mt-4 text-primary" asChild>
                  <a href="/blog">Limpar filtros</a>
                </Button>
              </div>
            )}
          </main>

          {/* Sidebar */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-8">
            <BlogSidebar verifiedCompanies={verifiedCompanies} />
          </aside>
        </div>
      </div>
      
      <StickyMobileCTA />
      <NewsletterPopup />

      {/* Intent Tracking — exit intent, share intent, idle return para listagem */}
      <Suspense fallback={null}>
        <BlogIntentTracker />
      </Suspense>
    </div>
  );
}
