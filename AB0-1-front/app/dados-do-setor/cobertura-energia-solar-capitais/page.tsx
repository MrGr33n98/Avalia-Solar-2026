import type { Metadata } from 'next';
import Link from 'next/link';

import PageViewTracker from '@/components/PageViewTracker';
import AnswerBlock from '@/components/seo/AnswerBlock';
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema';
import {
  CAPITAL_COVERAGE_REPORT,
  CAPITAL_COVERAGE_ROWS,
  CAPITAL_COVERAGE_SUMMARY,
} from '@/lib/seo/sector-reports';
import { SITE, absoluteUrl } from '@/lib/site';

export const revalidate = 86400;

const pageUrl = absoluteUrl(CAPITAL_COVERAGE_REPORT.path);
const csvUrl = absoluteUrl(CAPITAL_COVERAGE_REPORT.csvPath);

export const metadata: Metadata = {
  title: `${CAPITAL_COVERAGE_REPORT.title} | Avalia Solar`,
  description: CAPITAL_COVERAGE_REPORT.description,
  alternates: { canonical: pageUrl },
  openGraph: {
    title: CAPITAL_COVERAGE_REPORT.title,
    description: CAPITAL_COVERAGE_REPORT.description,
    url: pageUrl,
    images: [SITE.ogImagePath],
  },
  twitter: {
    card: 'summary_large_image',
    title: CAPITAL_COVERAGE_REPORT.title,
    description: CAPITAL_COVERAGE_REPORT.description,
    images: [SITE.ogImagePath],
  },
};

export default function CapitalCoverageReportPage() {
  const datasetJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': `${pageUrl}#dataset`,
    name: CAPITAL_COVERAGE_REPORT.title,
    description: CAPITAL_COVERAGE_REPORT.description,
    url: pageUrl,
    dateModified: CAPITAL_COVERAGE_REPORT.updatedAt,
    inLanguage: 'pt-BR',
    creator: {
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
    },
    spatialCoverage: {
      '@type': 'Country',
      name: 'Brasil',
    },
    distribution: {
      '@type': 'DataDownload',
      encodingFormat: 'text/csv',
      contentUrl: csvUrl,
    },
  };

  return (
    <main className="bg-slate-50">
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: '/' },
          { name: 'Dados do setor', item: '/dados-do-setor' },
          { name: CAPITAL_COVERAGE_REPORT.shortTitle, item: CAPITAL_COVERAGE_REPORT.path },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetJsonLd) }}
      />
      <PageViewTracker type="other" title={`${CAPITAL_COVERAGE_REPORT.title} - Avalia Solar`} />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-14 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-700">
            Dados do setor
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            {CAPITAL_COVERAGE_REPORT.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            {CAPITAL_COVERAGE_REPORT.description}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={CAPITAL_COVERAGE_REPORT.csvPath}
              className="rounded-xl border border-blue-200 bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
            >
              Baixar CSV
            </Link>
            <Link
              href="/dados-do-setor"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
            >
              Ver dados do setor
            </Link>
          </div>
        </section>

        <AnswerBlock
          tone="slate"
          question="O que este relatorio mostra?"
          answer={`O relatorio lista ${CAPITAL_COVERAGE_SUMMARY.capitals} capitais brasileiras com paginas locais de comparacao de empresas de energia solar no Avalia Solar. A base cobre ${CAPITAL_COVERAGE_SUMMARY.states} UFs e usa URLs canonicas publicas com foco em descoberta local.`}
          facts={[
            `${CAPITAL_COVERAGE_SUMMARY.capitals} capitais`,
            `${CAPITAL_COVERAGE_SUMMARY.states} UFs`,
            CAPITAL_COVERAGE_SUMMARY.category,
          ]}
        />

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">Capitais mapeadas</p>
            <p className="mt-2 text-4xl font-black text-slate-950">
              {CAPITAL_COVERAGE_SUMMARY.capitals}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">UFs cobertas</p>
            <p className="mt-2 text-4xl font-black text-slate-950">
              {CAPITAL_COVERAGE_SUMMARY.states}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">Atualizacao</p>
            <p className="mt-2 text-4xl font-black text-slate-950">
              {CAPITAL_COVERAGE_REPORT.updatedAt}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <h2 className="text-2xl font-black text-slate-950">Metodologia</h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-700 md:text-base">
            {CAPITAL_COVERAGE_REPORT.methodology}
          </p>
          <p className="mt-3 text-sm font-semibold text-slate-500">
            {CAPITAL_COVERAGE_REPORT.source}
          </p>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-2xl font-black text-slate-950">Tabela de cobertura</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              As URLs abaixo sao publicas, canonicas e podem ser usadas para validacao de
              crawling, sitemap e links internos.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">UF</th>
                  <th className="px-4 py-3">Capital</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">URL local</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {CAPITAL_COVERAGE_ROWS.map((row) => (
                  <tr key={`${row.state}-${row.citySlug}`} className="align-top">
                    <td className="px-4 py-3 font-black text-slate-950">{row.state}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{row.city}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{row.citySlug}</td>
                    <td className="px-4 py-3">
                      <Link href={row.localUrl} className="font-semibold text-blue-700 hover:text-blue-900">
                        {row.localUrl}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

