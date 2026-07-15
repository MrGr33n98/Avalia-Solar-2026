import Link from 'next/link';

import PageViewTracker from '@/components/PageViewTracker';
import AnswerBlock from '@/components/seo/AnswerBlock';
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TRUST_PAGES, type TrustPageDefinition } from '@/lib/seo/trust-pages';
import { SITE, absoluteUrl } from '@/lib/site';

type TrustPageProps = {
  page: TrustPageDefinition;
};

const relatedPages = Object.values(TRUST_PAGES);

export default function TrustPage({ page }: TrustPageProps) {
  const pageUrl = absoluteUrl(`/${page.slug}`);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${pageUrl}#webpage`,
    name: page.title,
    description: page.description,
    url: pageUrl,
    dateModified: page.updatedAt,
    reviewedBy: {
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
    },
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${SITE.url}/#website`,
      name: SITE.name,
      url: SITE.url,
    },
  };

  return (
    <div className="bg-slate-50">
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: '/' },
          { name: page.shortTitle, item: `/${page.slug}` },
        ]}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageViewTracker type="other" title={`${page.title} - Avalia Solar`} />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-14 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-700">
            {page.eyebrow}
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            {page.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            {page.description}
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              Atualizado em {page.updatedAt}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              Responsavel: {page.owner}
            </span>
          </div>
        </section>

        <AnswerBlock
          question={`Resposta direta: ${page.shortTitle}`}
          answer={page.quickAnswer}
          facts={page.facts}
          href="/help"
          linkLabel="Tirar dúvidas na central de ajuda"
        />

        <section className="grid gap-5">
          {page.sections.map((section) => (
            <Card key={section.heading} className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl text-slate-950">{section.heading}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-base leading-8 text-slate-700">{section.body}</p>
                {section.bullets && section.bullets.length > 0 ? (
                  <ul className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-semibold">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </section>

        {page.relatedLinks && page.relatedLinks.length > 0 ? (
          <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
              Relatórios publicados
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Dados citáveis</h2>
            <div className="mt-5 grid gap-3">
              {page.relatedLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <p className="font-black text-slate-950">{item.label}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white md:p-8">
          <h2 className="text-2xl font-black">Páginas relacionadas</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {relatedPages
              .filter((item) => item.slug !== page.slug)
              .map((item) => (
                <Link
                  key={item.slug}
                  href={`/${item.slug}`}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                >
                  <p className="font-bold text-white">{item.shortTitle}</p>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-300">
                    {item.description}
                  </p>
                </Link>
              ))}
          </div>
        </section>
      </main>
    </div>
  );
}
