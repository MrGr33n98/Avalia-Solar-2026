import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import { Calendar, User, Eye, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ArticleBanner from '@/components/ArticleBanner';
import ArticleConversionSection from '@/components/ArticleConversionSection';
import { buildApiUrl, getApiRequestHeaders } from '@/lib/api-config';
import { getFullImageUrl } from '@/utils/image';
import AuthorAvatarFloating from '@/components/AuthorAvatarFloating';

async function getArticle(slug: string) {
  try {
    const res = await fetch(buildApiUrl(`articles/${slug}`), {
      headers: getApiRequestHeaders(),
      next: { revalidate: 1800 } // refresh every 30m
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('Failed to fetch article:', error);
    return null;
  }
}

async function getRelatedArticles(slug: string) {
  try {
    const res = await fetch(buildApiUrl(`articles/${slug}/related`), {
      headers: getApiRequestHeaders(),
      next: { revalidate: 1800 }
    });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    return [];
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await getArticle(params.slug);

  if (!article) {
    return { title: 'Artigo nao encontrado' };
  }

  return {
    title: article.meta_title || article.title,
    description: article.meta_description || article.excerpt,
    openGraph: {
      title: article.meta_title || article.title,
      description: article.meta_description || article.excerpt,
      type: 'article',
      publishedTime: article.published_at,
      authors: [article.author_name || article.author?.name || 'Avalia Solar'],
      images: article.image_url ? [{ url: getFullImageUrl(article.image_url) || '' }] : [],
    },
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug);
  const relatedArticles = await getRelatedArticles(params.slug);

  if (!article) {
    notFound();
  }

  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('pt-BR', { dateStyle: 'long' })
    : 'Data indisponivel';
  const htmlContent = article.content?.trim()?.length
    ? article.content
    : (article.excerpt ? `<p>${article.excerpt}</p>` : `<p class="text-gray-600">Conteudo em breve.</p>`);
  const ogImage = article.image_url ? getFullImageUrl(article.image_url) : null;
  const categorySlug = article.category?.slug || article.category?.seo_url || article.category?.id;
  const sponsoredLabel = article.sponsored_label ? `Patrocinado · ${article.sponsored_label}` : 'Patrocinado';

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.meta_description || article.excerpt,
    image: ogImage ? [ogImage] : undefined,
    datePublished: article.published_at,
    dateModified: article.updated_at,
    author: {
      '@type': 'Person',
      name: article.author_name || article.author?.name || 'Avalia Solar',
      email: article.author_email || undefined
    },
    publisher: {
      '@type': 'Organization',
      name: 'Avalia Solar'
    },
    mainEntityOfPage: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/blog/${article.slug}`
  };

  const authorAvatarUrl = (article.author as any)?.avatar_photo_url
    ? getFullImageUrl((article.author as any).avatar_photo_url)
    : undefined;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <main>
        {article.image_url ? (
          <ArticleBanner
            title={article.title}
            category={article.category?.name || 'Geral'}
            imageUrl={getFullImageUrl(article.image_url) || undefined}
          />
        ) : (
          <header className="bg-white border-b">
            <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                <Link href="/blog" className="hover:text-primary">Blog</Link>
                <span>/</span>
                <Link href={`/blog/category/${categorySlug}`} className="hover:text-primary">
                  {article.category?.name || 'Geral'}
                </Link>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
                {article.title}
              </h1>
            </div>
          </header>
        )}

        <section className="bg-white border-b" aria-label="Detalhes do artigo">
          <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-4 text-sm text-gray-600 leading-relaxed">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {publishedDate}
                </span>
                <span className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  {article.author_name || article.author?.name || 'Equipe Avalia Solar'}
                </span>
                <span className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  {article.views_count ?? 0} visualizacoes
                </span>
                {article.sponsored && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                    {sponsoredLabel}
                  </Badge>
                )}
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" /> Compartilhar
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <article className="lg:col-span-8 bg-white rounded-lg shadow-sm p-6 sm:p-8" itemScope itemType="https://schema.org/Article">
            <div
              className="prose prose-lg max-w-none text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
              itemProp="articleBody"
            />
            {article.excerpt && (
              <p className="mt-6 text-gray-700 text-base leading-relaxed" itemProp="description">
                {article.excerpt}
              </p>
            )}

            {article.tags && article.tags.length > 0 && (
              <div className="mt-8 pt-8 border-t">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Tags:</h4>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag: any) => (
                    <Badge key={tag.id} variant="secondary">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </article>

          <aside className="lg:col-span-4 space-y-8" aria-label="Acoes do artigo">
            <div className="bg-primary/5 rounded-lg p-6 border border-primary/10">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Receba novidades</h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Inscreva-se para receber as ultimas noticias sobre energia solar.
              </p>
              <form className="space-y-2">
                <label className="sr-only" htmlFor="newsletter-email">E-mail</label>
                <input
                  id="newsletter-email"
                  type="email"
                  placeholder="Seu melhor e-mail"
                  className="w-full px-3 py-2 border rounded-md focus:ring-primary focus:border-primary text-base"
                />
                <Button className="w-full">Inscrever-se</Button>
              </form>
            </div>

            {relatedArticles.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Relacionados</h3>
                <div className="space-y-4">
                  {relatedArticles.map((related: any) => {
                    const relatedImage = getFullImageUrl(related.image_url) || undefined;
                    const relatedDate = related.published_at
                      ? new Date(related.published_at).toLocaleDateString('pt-BR')
                      : '';
                    return (
                      <Link key={related.id} href={`/blog/${related.slug}`} className="block group">
                        <div className="flex space-x-3">
                          <div className="relative w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                            {relatedImage && (
                              <Image
                                src={relatedImage}
                                alt={related.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                                sizes="80px"
                              />
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 group-hover:text-primary line-clamp-2">
                              {related.title}
                            </h4>
                            <span className="text-xs text-gray-500 mt-1 block">
                              {relatedDate}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>
        </section>

        <ArticleConversionSection article={article} />
      </main>

      <Script
        id="article-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <AuthorAvatarFloating
        name={article.author_name || article.author?.name || 'Avalia Solar'}
        avatarUrl={getFullImageUrl((article.author as any)?.avatar_photo_url) || undefined}
      />
    </div>
  );
}
