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

  const hasFilters = Boolean(
    searchParams.q || searchParams.category
  );

  const showFeatured = !hasFilters && page === 1;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      {/* =========================================================
          SEO / STRUCTURED DATA
      ========================================================== */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />

      {/* =========================================================
          HERO
          
          Segunda passada:
          - menos altura
          - menos containers aninhados
          - categorias integradas ao hero
          - maior densidade editorial
      ========================================================== */}

      <section className="bg-white">
        <div
          className="
            mx-auto
            max-w-[1400px]
            px-4
            pb-5
            pt-5
            sm:px-6
            sm:pb-6
            sm:pt-6
            lg:px-8
            lg:pb-7
            lg:pt-7
          "
        >
          <div
            className="
              relative
              overflow-hidden
              rounded-[26px]
              border
              border-slate-200/80
              bg-white
              shadow-[0_18px_55px_rgba(15,23,42,0.045)]
            "
          >
            {/* Decorative glow */}

            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                -right-32
                -top-32
                h-72
                w-72
                rounded-full
                bg-blue-100/35
                blur-3xl
              "
            />

            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                -bottom-40
                -left-24
                h-72
                w-72
                rounded-full
                bg-amber-50/70
                blur-3xl
              "
            />

            {/* Hero content */}

            <div
              className="
                relative
                px-5
                pb-5
                pt-5
                sm:px-7
                sm:pb-6
                sm:pt-6
                lg:px-8
                lg:pb-7
                lg:pt-7
                xl:px-9
              "
            >
              <BlogHero />
            </div>

            {/* Integrated category navigation */}

            <div
              className="
                relative
                border-t
                border-slate-200/70
                bg-slate-50/65
                px-3
                py-3
                sm:px-4
                lg:px-5
              "
            >
              <CategoryHighlights />
            </div>
          </div>
        </div>
      </section>

      {/* Subtle separator */}

      <div className="border-t border-slate-200/60" />

      {/* =========================================================
          MAIN
      ========================================================== */}

      <main
        className="
          mx-auto
          max-w-[1400px]
          px-4
          py-7
          sm:px-6
          sm:py-8
          lg:px-8
          lg:py-9
        "
      >
        {/* =======================================================
            FEATURED POSTS
        ======================================================== */}

        {showFeatured && (
          <section className="mb-9 lg:mb-11">
            <div
              className="
                rounded-[24px]
                border
                border-slate-200/80
                bg-white
                p-4
                shadow-[0_12px_36px_rgba(15,23,42,0.035)]
                sm:p-5
                lg:p-6
              "
            >
              <FeaturedPostsSection posts={featuredPosts} />
            </div>
          </section>
        )}

        {/* =======================================================
            CONTENT + SIDEBAR
        ======================================================== */}

        <div
          className="
            grid
            grid-cols-1
            items-start
            gap-8
            lg:grid-cols-12
            lg:gap-8
            xl:gap-10
          "
        >
          {/* =====================================================
              EDITORIAL CONTENT
          ====================================================== */}

          <section
            className="
              min-w-0
              lg:col-span-8
              xl:col-span-9
            "
          >
            {/* Section heading */}

            <header className="mb-5 lg:mb-6">
              <div
                className="
                  flex
                  flex-col
                  gap-4
                  xl:flex-row
                  xl:items-end
                  xl:justify-between
                "
              >
                <div>
                  <div
                    className="
                      mb-2
                      inline-flex
                      items-center
                      gap-2
                      rounded-full
                      border
                      border-blue-100
                      bg-blue-50/80
                      px-3
                      py-1
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-[0.14em]
                      text-blue-700
                    "
                  >
                    <Sparkles
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    />

                    Conteúdo Avalia Solar
                  </div>

                  <h2
                    className="
                      text-[28px]
                      font-black
                      tracking-[-0.04em]
                      text-slate-950
                      sm:text-[32px]
                      lg:text-[34px]
                    "
                  >
                    Últimos Artigos
                  </h2>

                  <p
                    className="
                      mt-1
                      max-w-2xl
                      text-sm
                      leading-6
                      text-slate-500
                    "
                  >
                    Guias, análises e conteúdos para decisões
                    melhores em energia solar e mobilidade.
                  </p>
                </div>
              </div>
            </header>

            {/* ===================================================
                FILTER TOOLBAR
            ==================================================== */}

            <div
              className="
                mb-6
                rounded-[20px]
                border
                border-slate-200/80
                bg-white
                p-2.5
                shadow-[0_8px_28px_rgba(15,23,42,0.03)]
                sm:p-3
              "
            >
              <Suspense
                fallback={
                  <div
                    className="
                      h-14
                      w-full
                      animate-pulse
                      rounded-2xl
                      bg-slate-100
                    "
                  />
                }
              >
                <BlogFiltersBar categories={categories} />
              </Suspense>
            </div>

            {/* ===================================================
                POSTS
            ==================================================== */}

            {posts.length > 0 ? (
              <div className="space-y-8">
                <div
                  className="
                    grid
                    grid-cols-1
                    gap-5
                    md:grid-cols-2
                    xl:gap-6
                  "
                >
                  {posts.map((post, index) => (
                    <div
                      key={post.id}
                      className="
                        group
                        min-w-0
                        overflow-hidden
                        rounded-[22px]
                        transition
                        duration-300
                        ease-out
                        hover:-translate-y-1
                        hover:shadow-[0_18px_42px_rgba(15,23,42,0.07)]
                      "
                    >
                      <PostCard
                        post={post}
                        position={index + 1}
                      />
                    </div>
                  ))}
                </div>

                {/* =================================================
                    PAGINATION
                ================================================== */}

                {meta.total_pages > 1 && (
                  <nav
                    aria-label="Paginação do blog"
                    className="
                      flex
                      flex-col
                      items-center
                      justify-between
                      gap-3
                      rounded-[18px]
                      border
                      border-slate-200/80
                      bg-white
                      p-3
                      shadow-[0_8px_24px_rgba(15,23,42,0.025)]
                      sm:flex-row
                      sm:px-4
                    "
                  >
                    <div
                      className="
                        text-xs
                        font-medium
                        text-slate-500
                      "
                    >
                      Página{' '}
                      <span className="font-bold text-slate-900">
                        {page}
                      </span>{' '}
                      de {meta.total_pages}
                    </div>

                    <div className="flex items-center gap-2">
                      {page > 1 && (
                        <Button
                          variant="outline"
                          asChild
                          className="
                            h-10
                            rounded-xl
                            border-slate-200
                            bg-white
                            px-4
                            text-xs
                            font-bold
                            text-slate-700
                            shadow-sm
                            transition-colors
                            hover:border-blue-200
                            hover:bg-blue-50
                            hover:text-blue-700
                          "
                        >
                          <a href={`/blog?page=${page - 1}`}>
                            Anterior
                          </a>
                        </Button>
                      )}

                      {page < meta.total_pages && (
                        <Button
                          variant="outline"
                          asChild
                          className="
                            h-10
                            rounded-xl
                            border-blue-200
                            bg-blue-50/60
                            px-4
                            text-xs
                            font-bold
                            text-blue-700
                            shadow-sm
                            transition-colors
                            hover:border-blue-300
                            hover:bg-blue-100
                          "
                        >
                          <a href={`/blog?page=${page + 1}`}>
                            Próxima
                          </a>
                        </Button>
                      )}
                    </div>
                  </nav>
                )}
              </div>
            ) : (
              /* ===================================================
                  EMPTY STATE
              ==================================================== */

              <div
                className="
                  flex
                  min-h-[320px]
                  flex-col
                  items-center
                  justify-center
                  rounded-[24px]
                  border
                  border-slate-200/80
                  bg-white
                  px-6
                  py-14
                  text-center
                  shadow-[0_12px_34px_rgba(15,23,42,0.03)]
                "
              >
                <div
                  className="
                    mb-4
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-slate-200
                    bg-slate-50
                    text-slate-400
                    shadow-sm
                  "
                >
                  <SearchX
                    className="h-6 w-6"
                    aria-hidden="true"
                  />
                </div>

                <h3
                  className="
                    text-xl
                    font-black
                    tracking-[-0.025em]
                    text-slate-950
                  "
                >
                  Nenhum artigo encontrado
                </h3>

                <p
                  className="
                    mx-auto
                    mt-2
                    max-w-md
                    text-sm
                    leading-6
                    text-slate-500
                  "
                >
                  Tente ajustar seus filtros ou busca para
                  encontrar o que procura.
                </p>

                <Button
                  variant="outline"
                  asChild
                  className="
                    mt-5
                    h-10
                    rounded-xl
                    border-blue-200
                    bg-blue-50
                    px-4
                    text-xs
                    font-bold
                    text-blue-700
                    shadow-sm
                    hover:bg-blue-100
                  "
                >
                  <a href="/blog">
                    Limpar filtros
                  </a>
                </Button>
              </div>
            )}
          </section>

          {/* =====================================================
              SIDEBAR
          ====================================================== */}

          <aside
            className="
              min-w-0
              lg:col-span-4
              xl:col-span-3
            "
          >
            <div
              className="
                space-y-5
                lg:sticky
                lg:top-24
              "
            >
              <div
                className="
                  overflow-hidden
                  rounded-[24px]
                  border
                  border-slate-200/80
                  bg-white
                  p-3
                  shadow-[0_12px_38px_rgba(15,23,42,0.04)]
                  sm:p-4
                "
              >
                <BlogSidebar
                  verifiedCompanies={verifiedCompanies}
                />
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* =========================================================
          MOBILE / ENGAGEMENT
      ========================================================== */}

      <StickyMobileCTA />

      <NewsletterPopup />

      {/* Intent Tracking
          exit intent
          share intent
          idle return
      */}

      <Suspense fallback={null}>
        <BlogIntentTracker />
      </Suspense>
    </div>
  );
}