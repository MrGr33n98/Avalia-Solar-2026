import { Metadata } from 'next';
import { Suspense } from 'react';
import { SearchX, Sparkles } from 'lucide-react';

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
import { SITE, absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Blog Avalia Solar - Dicas e Guias de Energia Solar',
  description:
    'Confira os melhores artigos, notícias e guias sobre energia solar fotovoltaica. Economize na conta de luz com conhecimento.',
  alternates: {
    canonical: absoluteUrl('/blog'),
  },
};

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: {
    page?: string;
    q?: string;
    category?: string;
    sort?: string;
  };
}) {
  const page = Number(searchParams.page) || 1;

  const { data: posts, meta } = await blogApi.fetchPosts({
    page,
    per_page: 9,
    q: searchParams.q,
    category: searchParams.category,
    sort: searchParams.sort,
  });

  const categories = await blogApi.fetchCategories();
  const featuredPosts = await blogApi.fetchFeatured();
  const verifiedCompanies = await blogApi.fetchVerifiedCompanies();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Blog Avalia Solar',
    description:
      'Confira os melhores artigos, notícias e guias sobre energia solar fotovoltaica.',
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/images/avalia-solar-logo-horizontal.svg'),
      },
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE.url,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: absoluteUrl('/blog'),
      },
    ],
  };

  const hasFilters = Boolean(searchParams.q || searchParams.category);
  const showFeatured = !hasFilters && page === 1;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <section className="border-b border-slate-200/70 bg-white">
        <div className="mx-auto max-w-[1400px] px-4 pb-8 pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
          <div className="relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-white px-5 py-6 shadow-[0_16px_50px_rgba(15,23,42,0.04)] sm:px-7 sm:py-8 lg:px-9">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-100/40 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-amber-100/30 blur-3xl"
            />

            <div className="relative space-y-6">
              <BlogHero />

              <div className="rounded-[20px] border border-slate-200/70 bg-slate-50/70 p-2.5 shadow-inner sm:p-3">
                <CategoryHighlights />
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {showFeatured && (
          <section className="mb-10 lg:mb-12">
            <div className="rounded-[28px] border border-slate-200/70 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.035)] sm:p-5 lg:p-6">
              <FeaturedPostsSection posts={featuredPosts} />
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
          <section className="lg:col-span-8 xl:col-span-9">
            <div className="mb-6 flex flex-col gap-4 lg:mb-7">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-blue-700">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    Conteúdo Avalia Solar
                  </div>

                  <h2 className="text-[30px] font-black tracking-[-0.04em] text-slate-950 sm:text-[34px]">
                    Últimos Artigos
                  </h2>

                  <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                    Guias, análises e conteúdos para decisões melhores em energia solar e mobilidade.
                  </p>
                </div>
              </div>

              <div className="rounded-[22px] border border-slate-200/80 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.035)] sm:p-4">
                <Suspense
                  fallback={<div className="h-16 w-full animate-pulse rounded-2xl bg-slate-100" />}
                >
                  <BlogFiltersBar categories={categories} />
                </Suspense>
              </div>
            </div>

            {posts.length > 0 ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:gap-6">
                  {posts.map((post, index) => (
                    <div
                      key={post.id}
                      className="min-w-0 rounded-[24px] transition-transform duration-300 hover:-translate-y-1"
                    >
                      <PostCard post={post} position={index + 1} />
                    </div>
                  ))}
                </div>

                {meta.total_pages > 1 && (
                  <nav
                    aria-label="Paginação do blog"
                    className="flex flex-col items-center justify-between gap-3 rounded-[20px] border border-slate-200/80 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.03)] sm:flex-row sm:px-4"
                  >
                    <div className="text-xs font-semibold text-slate-500">
                      Página <span className="font-black text-slate-900">{page}</span> de{' '}
                      {meta.total_pages}
                    </div>

                    <div className="flex items-center gap-2">
                      {page > 1 && (
                        <Button
                          variant="outline"
                          asChild
                          className="h-10 rounded-xl border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <a href={`/blog?page=${page - 1}`}>Anterior</a>
                        </Button>
                      )}

                      {page < meta.total_pages && (
                        <Button
                          variant="outline"
                          asChild
                          className="h-10 rounded-xl border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <a href={`/blog?page=${page + 1}`}>Próxima</a>
                        </Button>
                      )}
                    </div>
                  </nav>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-[28px] border border-slate-200/80 bg-white px-6 py-16 text-center shadow-[0_12px_34px_rgba(15,23,42,0.035)]">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                  <SearchX className="h-6 w-6" aria-hidden="true" />
                </div>

                <h3 className="text-xl font-black tracking-[-0.02em] text-slate-950">
                  Nenhum artigo encontrado
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Tente ajustar seus filtros ou busca para encontrar o que procura.
                </p>

                <Button
                  variant="outline"
                  asChild
                  className="mt-5 h-10 rounded-xl border-blue-200 bg-blue-50 px-4 text-xs font-bold text-blue-700 hover:bg-blue-100"
                >
                  <a href="/blog">Limpar filtros</a>
                </Button>
              </div>
            )}
          </section>

          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="space-y-6 lg:sticky lg:top-24">
              <div className="rounded-[26px] border border-slate-200/80 bg-white p-3 shadow-[0_14px_42px_rgba(15,23,42,0.04)] sm:p-4">
                <BlogSidebar verifiedCompanies={verifiedCompanies} />
              </div>
            </div>
          </aside>
        </div>
      </main>

      <StickyMobileCTA />
      <NewsletterPopup />

      <Suspense fallback={null}>
        <BlogIntentTracker />
      </Suspense>
    </div>
  );
}
