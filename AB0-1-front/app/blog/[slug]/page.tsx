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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { List } from 'lucide-react';
import { ArticleHtmlRenderer } from '@/components/blog/ArticleHtmlRenderer';
import { toCrawlableImageUrl } from '@/lib/seo/crawlable-image';
import { SITE, absoluteUrl } from '@/lib/site';

export const revalidate = 3600; // ISR - 1 hora
// force-dynamic: evita que o Next.js tente coletar dados estáticos durante o build Docker.
// O conteúdo é gerado na primeira requisição e re-validado a cada 3600s via ISR em runtime.
// Remove o "Failed to collect page data for /blog/[slug]" causado por dependências incompatíveis.
export const dynamic = 'force-dynamic';

async function getArticle(slug: string): Promise<Article | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  const safeSlug = decodeURIComponent(slug || '').trim();
  try {
    const res = await fetch(buildApiUrl(`articles/${safeSlug || slug}`), {
      headers: getApiRequestHeaders(),
      next: { revalidate: 3600 },
      signal: controller.signal,
    });
    if (res.ok) return res.json();

    if (safeSlug && safeSlug !== slug) {
      const fallbackController = new AbortController();
      const fallbackTimeout = setTimeout(() => fallbackController.abort(), 8_000);
      try {
        const fallbackRes = await fetch(buildApiUrl(`articles/${safeSlug}`), {
          headers: getApiRequestHeaders(),
          next: { revalidate: 3600 },
          signal: fallbackController.signal,
        });
        if (fallbackRes.ok) return fallbackRes.json();
      } finally {
        clearTimeout(fallbackTimeout);
      }
    }

    if (safeSlug === 'plano-founder-avalia-solar' || slug === 'plano-founder-avalia-solar') {
      return {
        id: 9999,
        title: 'Plano Founder Avalia Solar: Brand Page Empresarial e Programa de Lançamento',
        slug: 'plano-founder-avalia-solar',
        seo_title: 'Plano Founder Avalia Solar | Brand Page & Programa de Lançamento',
        seo_description:
          'Entenda como funciona o Plano Founder da Avalia Solar: dois meses gratuitos no lançamento, Brand Page oficial verificada, catálogo e contato direto.',
        excerpt:
          'O Plano Founder é a iniciativa de lançamento da Avalia Solar que concede dois meses gratuitos e estrutura a Brand Page oficial para empresas pioneiras do setor.',
        content: `
          <p>O <strong>Plano Founder da Avalia Solar</strong> é o programa de homologação e lançamento oficial voltado aos parceiros pioneiros do setor de energia solar e mobilidade elétrica no Brasil. Com ele, sua empresa assegura presença destacada em um diretório auditado com tecnologia de ponta.</p>
          
          <h2>O que é a Brand Page Oficial?</h2>
          <p>A Brand Page é o endereço corporativo oficial da sua empresa dentro da Avalia Solar. Desenvolvida sobre arquitetura moderna de alta performance, ela reúne:</p>
          <ul>
            <li><strong>Identidade institucional homologada:</strong> logotipo em alta resolução, histórico de mercado, especialidades de engenharia e endereço físico verificado.</li>
            <li><strong>Catálogo técnico de produtos:</strong> vitrine de inversores híbridos, bancos de baterias e módulos fotovoltaicos com fichas técnicas e manuais.</li>
            <li><strong>Reputação e avaliações autênticas:</strong> espaço auditado onde clientes reais relatam suas experiências com notas por critérios técnicos.</li>
            <li><strong>Canais de conversão direta:</strong> integração sem intermediários via WhatsApp corporativo, telefone e solicitação de orçamento sem cobrança de taxas por lead.</li>
          </ul>

          <h2>Como funcionam os 2 meses gratuitos de lançamento?</h2>
          <p>Durante a fase de inauguração da plataforma, as empresas qualificadas recebem <strong>dois meses de gratuidade completa</strong> de mensalidade para usufruir de todas as funcionalidades da Brand Page oficial. Antes do encerramento dos 60 dias, nossa equipe apresenta o balanço consolidado de métricas e acessos para você decidir se deseja prosseguir no plano comercial definitivo.</p>

          <p>Para conhecer todos os recursos na íntegra e explorar a simulação interativa da tela, visite a <a href="/founder">página oficial do Plano Founder da Avalia Solar</a> ou realize o seu <a href="https://zbooking.us/6shCH" target="_blank" rel="noopener noreferrer">agendamento de apresentação executiva</a>.</p>
        `,
        image_url: '/assets/founder-laptop.jpg',
        published_at: '2026-01-15T10:00:00.000Z',
        updated_at: '2026-11-03T18:00:00.000Z',
        author_name: 'Felipe Henrique Morais',
        author_bio:
          'Fundador da Avalia Solar. Conectando pessoas e empresas às melhores soluções de energia solar com transparência e dados reais.',
        author_avatar_url: '/images/felipe-morais-fundador.jpg',
        category: {
          id: 1,
          name: 'Energia Solar',
          slug: 'energia-solar',
        },
      } as Article;
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch article:', error);
    if (safeSlug === 'plano-founder-avalia-solar' || slug === 'plano-founder-avalia-solar') {
      return {
        id: 9999,
        title: 'Plano Founder Avalia Solar: Brand Page Empresarial e Programa de Lançamento',
        slug: 'plano-founder-avalia-solar',
        seo_title: 'Plano Founder Avalia Solar | Brand Page & Programa de Lançamento',
        seo_description:
          'Entenda como funciona o Plano Founder da Avalia Solar: dois meses gratuitos no lançamento, Brand Page oficial verificada, catálogo e contato direto.',
        excerpt:
          'O Plano Founder é a iniciativa de lançamento da Avalia Solar que concede dois meses gratuitos e estrutura a Brand Page oficial para empresas pioneiras do setor.',
        content: `
          <p>O <strong>Plano Founder da Avalia Solar</strong> é o programa de homologação e lançamento oficial voltado aos parceiros pioneiros do setor de energia solar e mobilidade elétrica no Brasil. Com ele, sua empresa assegura presença destacada em um diretório auditado com tecnologia de ponta.</p>
          
          <h2>O que é a Brand Page Oficial?</h2>
          <p>A Brand Page é o endereço corporativo oficial da sua empresa dentro da Avalia Solar. Desenvolvida sobre arquitetura moderna de alta performance, ela reúne:</p>
          <ul>
            <li><strong>Identidade institucional homologada:</strong> logotipo em alta resolução, histórico de mercado, especialidades de engenharia e endereço físico verificado.</li>
            <li><strong>Catálogo técnico de produtos:</strong> vitrine de inversores híbridos, bancos de baterias e módulos fotovoltaicos com fichas técnicas e manuais.</li>
            <li><strong>Reputação e avaliações autênticas:</strong> espaço auditado onde clientes reais relatam suas experiências com notas por critérios técnicos.</li>
            <li><strong>Canais de conversão direta:</strong> integração sem intermediários via WhatsApp corporativo, telefone e solicitação de orçamento sem cobrança de taxas por lead.</li>
          </ul>

          <h2>Como funcionam os 2 meses gratuitos de lançamento?</h2>
          <p>Durante a fase de inauguração da plataforma, as empresas qualificadas recebem <strong>dois meses de gratuidade completa</strong> de mensalidade para usufruir de todas as funcionalidades da Brand Page oficial. Antes do encerramento dos 60 dias, nossa equipe apresenta o balanço consolidado de métricas e acessos para você decidir se deseja prosseguir no plano comercial definitivo.</p>

          <p>Para conhecer todos os recursos na íntegra e explorar a simulação interativa da tela, visite a <a href="/founder">página oficial do Plano Founder da Avalia Solar</a> ou realize o seu <a href="https://zbooking.us/6shCH" target="_blank" rel="noopener noreferrer">agendamento de apresentação executiva</a>.</p>
        `,
        image_url: '/assets/founder-laptop.jpg',
        published_at: '2026-01-15T10:00:00.000Z',
        updated_at: '2026-11-03T18:00:00.000Z',
        author_name: 'Felipe Henrique Morais',
        author_bio:
          'Fundador da Avalia Solar. Conectando pessoas e empresas às melhores soluções de energia solar com transparência e dados reais.',
        author_avatar_url: '/images/felipe-morais-fundador.jpg',
        category: {
          id: 1,
          name: 'Energia Solar',
          slug: 'energia-solar',
        },
      } as Article;
    }

    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function getRelatedArticles(slug: string): Promise<Article[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);

  try {
    const res = await fetch(buildApiUrl(`articles/${slug}/related`), {
      headers: getApiRequestHeaders(),
      next: { revalidate: 3600 },
      signal: controller.signal,
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article = await getArticle(params.slug);

  if (!article) {
    return {
      title: 'Artigo não encontrado | Avalia Solar',
      robots: { index: false, follow: false },
    };
  }

  const ogImage = article.image_url
    ? toCrawlableImageUrl(getFullImageUrl(article.image_url))
    : undefined;
  const authorName = article.author_name || article.author?.name || 'Equipe Avalia Solar';
  const articleSlug = article.slug || String(article.id);
  const canonicalUrl = absoluteUrl(`/blog/${articleSlug}`);
  const seoTitle = article.seo_title || article.meta_title || article.title || undefined;
  const seoDescription =
    article.seo_description || article.meta_description || article.excerpt || undefined;
  const seoKeywords =
    article.seo_keywords ||
    ['energia solar', 'blog solar', article.category?.name, 'Avalia Solar']
      .filter(Boolean)
      .join(', ');

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: seoKeywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      type: 'article',
      publishedTime: article.published_at || undefined,
      authors: [authorName],
      images: ogImage ? [{ url: ogImage }] : [],
      siteName: 'Avalia Solar',
      locale: 'pt_BR',
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
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
  const isInstitutional = !article.author_name && !article.author?.name;
  const authorName = article.author_name || article.author?.name || 'Equipe Avalia Solar';
  const author = article.author as
    | (Article['author'] & { avatar_photo_url?: string | null })
    | undefined;
  const authorAvatarUrl = article.author_avatar_url
    ? getFullImageUrl(article.author_avatar_url)
    : author?.avatar_photo_url
      ? getFullImageUrl(author.avatar_photo_url)
      : '/images/felipe-ceo-avalia-solar.png';
  const schemaAuthorAvatarUrl = isInstitutional
    ? undefined
    : toCrawlableImageUrl(authorAvatarUrl) || absoluteUrl('/images/felipe-ceo-avalia-solar.png');
  const schemaArticleImage = article.image_url
    ? toCrawlableImageUrl(getFullImageUrl(article.image_url))
    : undefined;
  const authorBio = isInstitutional
    ? undefined
    : article.author_bio || article.author?.bio || undefined;
  const categoryName = article.category?.name;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.seo_description || article.meta_description || article.excerpt,
    image: schemaArticleImage ? [schemaArticleImage] : [],
    datePublished: article.published_at,
    dateModified: article.updated_at || article.published_at,
    author: {
      '@type': isInstitutional ? 'Organization' : 'Person',
      name: authorName,
      image: schemaAuthorAvatarUrl || undefined,
      url: isInstitutional
        ? absoluteUrl('/')
        : absoluteUrl(`/blog/autores/${article.author?.id || ''}`),
      '@id': isInstitutional
        ? absoluteUrl('#organization')
        : absoluteUrl(`#author-${article.author?.id || 'default'}`),
    },
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/images/avalia-solar-logo-horizontal.svg'),
      },
      '@id': absoluteUrl('#organization'),
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': absoluteUrl(`/blog/${articleSlug}`),
    },
  };

  const faqJsonLd =
    article.faqs && article.faqs.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: article.faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })),
        }
      : null;

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
      {
        '@type': 'ListItem',
        position: 3,
        name: article.title,
        item: absoluteUrl(`/blog/${articleSlug}`),
      },
    ],
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
            <article
              className="prose prose-lg prose-slate max-w-none leading-loose text-slate-700
              prose-headings:font-bold prose-headings:text-slate-900 prose-headings:tracking-tight prose-headings:mt-10 prose-headings:mb-6
              prose-p:text-slate-600 prose-p:leading-loose prose-p:mb-8
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium
              prose-strong:text-slate-900 prose-strong:font-bold
              prose-img:rounded-xl prose-img:shadow-md prose-img:my-10
              prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-slate-50 prose-blockquote:py-6 prose-blockquote:px-8 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-slate-700
              prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-8 prose-ul:text-slate-600 prose-ul:space-y-3
              prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-8 prose-ol:text-slate-600 prose-ol:space-y-3
              prose-li:leading-loose
              prose-hr:border-slate-200 prose-hr:my-12"
            >
              <ArticleHtmlRenderer content={article.content} articleSlug={articleSlug} />
            </article>

            {/* Conversion Section (Next Step) */}
            <ArticleConversionSection article={article} />

            {/* Author Bio */}
            <AuthorCardWithStats name={isInstitutional || authorName === 'Equipe Avalia Solar' ? 'Felipe Henrique Morais' : authorName} role="Fundador" bio={authorBio || 'Fundador da Avalia Solar. Conectando pessoas e empresas às melhores soluções de energia solar com transparência e dados reais.'} avatarUrl={authorAvatarUrl || '/images/felipe-morais-fundador.jpg'} bookingUrl="https://zbooking.us/6shCH" linkedinUrl="https://www.linkedin.com/in/felipe-morais-8bb61a7b/" />

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
