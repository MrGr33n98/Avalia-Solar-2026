import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { buildApiUrl, getApiRequestHeaders } from '@/lib/api-config';
import { getFullImageUrl } from '@/utils/image';
import { Article } from '@/types/article';
import { ReadingProgress } from '@/components/blog/ReadingProgress';
import { BlogTimeTracker } from '@/components/blog/BlogTimeTracker';
import { ArticleEngagementTracker } from '@/components/blog/ArticleEngagementTracker';
import { BlogIntentTracker } from '@/components/blog/BlogIntentTracker';
import { PostHeader } from '@/components/blog/PostHeader';
import { PostSidebar } from '@/components/blog/PostSidebar';
import { AuthorCardWithStats } from '@/components/blog/AuthorCardWithStats';
import { RelatedPostsGrid } from '@/components/blog/RelatedPostsGrid';
import { StickyMobileCTA } from '@/components/blog/StickyMobileCTA';
import { StickyShareBar } from '@/components/blog/StickyShareBar';
import { ArticleComments } from '@/components/blog/ArticleComments';
import { NewsletterPopup } from '@/components/blog/NewsletterPopup';
import ArticleConversionSection from '@/components/ArticleConversionSection';
import { PostTOC } from '@/components/blog/PostTOC';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { List } from 'lucide-react';
import { fixArticleContent } from '@/lib/content-fixer';

async function getArticle(slug: string): Promise<Article | null> {
  try {
    const safeSlug = decodeURIComponent(slug || '').trim();
    const res = await fetch(buildApiUrl(`articles/${safeSlug || slug}`), {
      headers: getApiRequestHeaders(),
      next: { revalidate: 1800 }
    });
    if (res.ok) return res.json();

    if (safeSlug && safeSlug !== slug) {
      const fallbackRes = await fetch(buildApiUrl(`articles/${safeSlug}`), {
        headers: getApiRequestHeaders(),
        next: { revalidate: 1800 }
      });
      if (fallbackRes.ok) return fallbackRes.json();
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch article:', error);
    return null;
  }
}

async function getRelatedArticles(slug: string): Promise<Article[]> {
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
    return { title: 'Artigo não encontrado' };
  }

  const ogImage = article.image_url ? getFullImageUrl(article.image_url) : undefined;
  const authorName = article.author_name || article.author?.name || 'Avalia Solar';
  const articleSlug = article.slug || String(article.id);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://avaliasolar.com.br';
  const canonicalUrl = `${siteUrl}/blog/${articleSlug}`;

  return {
    title: article.meta_title || article.title || undefined,
    description: article.meta_description || article.excerpt || undefined,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: article.meta_title || article.title || undefined,
      description: article.meta_description || article.excerpt || undefined,
      type: 'article',
      publishedTime: article.published_at || undefined,
      authors: [authorName],
      images: ogImage ? [{ url: ogImage }] : [],
      siteName: 'Avalia Solar',
      locale: 'pt_BR',
    },
    twitter: {
      card: 'summary_large_image',
      title: article.meta_title || article.title || undefined,
      description: article.meta_description || article.excerpt || undefined,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug);
  const relatedArticles = await getRelatedArticles(params.slug);

  if (!article) {
    notFound();
  }

  const articleSlug = article.slug || String(article.id);
  const authorName = article.author_name || article.author?.name || 'Felipe Morais';
  const authorAvatarUrl = article.author_avatar_url 
    ? getFullImageUrl(article.author_avatar_url) 
    : (article.author as any)?.avatar_photo_url ? getFullImageUrl((article.author as any).avatar_photo_url) : '/images/felipe-ceo-avalia-solar.png';
  const authorBio = article.author_bio || article.author?.bio || undefined;
  const categoryName = article.category?.name;
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.excerpt || article.meta_description,
    image: article.image_url ? [getFullImageUrl(article.image_url)] : [],
    datePublished: article.published_at,
    dateModified: article.updated_at || article.published_at,
    author: {
      '@type': 'Person',
      name: authorName,
      image: authorAvatarUrl
    },
    publisher: {
      '@type': 'Organization',
      name: 'Avalia Solar',
      logo: {
        '@type': 'ImageObject',
        url: 'https://avaliasolar.com.br/images/avalia-solar-logo-horizontal.svg'
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://avaliasolar.com.br/blog/${articleSlug}`
    }
  };

  const faqJsonLd = article.faqs && article.faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: article.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  } : null;

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
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.title,
        item: `https://avaliasolar.com.br/blog/${articleSlug}`
      }
    ]
  };

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      
      <ReadingProgress
        articleId={article.id}
        articleSlug={articleSlug}
        articleTitle={article.title}
        categoryId={article.category?.id}
        categoryName={categoryName}
      />
      <BlogTimeTracker
        articleId={article.id}
        articleSlug={articleSlug}
        articleTitle={article.title}
        categoryId={article.category?.id}
        categoryName={categoryName}
      />
      <ArticleEngagementTracker
        articleId={article.id}
        articleSlug={articleSlug}
        articleTitle={article.title}
        categoryId={article.category?.id}
        categoryName={categoryName}
      />
      {/* Intent tracking: exit_intent, share_intent, idle_return por artigo */}
      <BlogIntentTracker articleId={article.id} articleSlug={articleSlug} />
      <StickyShareBar title={article.title} slug={articleSlug} />

      <main className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Main Content Column */}
          <div className="lg:col-span-8">
            <PostHeader article={article} />

            {/* Banner Image */}
            {article.image_url && (
              <div className="relative w-full mb-10 rounded-xl overflow-hidden shadow-sm aspect-[16/9] bg-slate-100">
                <Image
                  src={getFullImageUrl(article.image_url) || ''}
                  alt={article.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

            {/* Mobile TOC (Accordion) */}
            <div className="lg:hidden mb-8 border rounded-lg p-2 bg-slate-50">
              <Accordion type="single" collapsible>
                <AccordionItem value="toc" className="border-none">
                  <AccordionTrigger className="py-2 px-2 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900 uppercase tracking-wider">
                      <List className="w-4 h-4" />
                      Neste artigo
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-2 pb-4 px-2">
                      <PostTOC showOnMobile className="block" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Article Content */}
            <article className="prose prose-lg prose-slate max-w-none leading-loose text-slate-700
              prose-headings:font-bold prose-headings:text-slate-900 prose-headings:tracking-tight prose-headings:mt-10 prose-headings:mb-6
              prose-p:text-slate-600 prose-p:leading-loose prose-p:mb-8
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium
              prose-strong:text-slate-900 prose-strong:font-bold
              prose-img:rounded-xl prose-img:shadow-md prose-img:my-10
              prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-slate-50 prose-blockquote:py-6 prose-blockquote:px-8 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-slate-700
              prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-8 prose-ul:text-slate-600 prose-ul:space-y-3
              prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-8 prose-ol:text-slate-600 prose-ol:space-y-3
              prose-li:leading-loose
              prose-hr:border-slate-200 prose-hr:my-12">
              <div dangerouslySetInnerHTML={{ __html: fixArticleContent(article.content) }} />
            </article>

            {/* Conversion Section (Next Step) */}
            <ArticleConversionSection article={article} />

            {/* Author Bio */}
            <AuthorCardWithStats 
              name={authorName} 
              bio={authorBio} 
              avatarUrl={authorAvatarUrl}
            />

            {/* Related Posts */}
            <RelatedPostsGrid articles={relatedArticles} />

            {/* Comments */}
            <ArticleComments
              articleId={article.id}
              articleSlug={articleSlug}
              articleTitle={article.title}
            />
          </div>

          {/* Sidebar Column (Sticky) */}
          <div className="lg:col-span-4 relative hidden lg:block">
            <div className="sticky top-24">
              <div className="mb-8">
                 <PostTOC />
              </div>
              <PostSidebar />
            </div>
          </div>

        </div>
      </main>

      <StickyMobileCTA />
      <NewsletterPopup />
    </div>
  );
}
