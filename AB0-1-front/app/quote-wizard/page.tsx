import type { Metadata } from 'next';
import Link from 'next/link';

import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema';
import { SITE, absoluteUrl } from '@/lib/site';

import QuoteWizardLauncher from './QuoteWizardLauncher';

export const metadata: Metadata = {
  title: 'Diagnóstico Solar | Avalia Solar',
  description:
    'Fluxo utilitario para iniciar um diagnostico solar no Avalia Solar. Esta pagina existe para preservar links antigos e nao deve ser indexada.',
  alternates: { canonical: absoluteUrl('/quote-wizard') },
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  },
  openGraph: {
    title: 'Diagnóstico Solar | Avalia Solar',
    description: SITE.description,
    url: absoluteUrl('/quote-wizard'),
    images: [SITE.ogImagePath],
  },
};

export default function QuoteWizardPage() {
  return (
    <main className="bg-slate-50">
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: '/' },
          { name: 'Diagnóstico Solar', item: '/quote-wizard' },
        ]}
      />
      <section className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-700">
          Diagnóstico Solar
        </p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
          Vamos abrir seu diagnóstico solar
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
          Esta rota preserva links antigos do fluxo de orçamento. O assistente deve abrir
          automaticamente; se isso não acontecer, use o botão abaixo.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <QuoteWizardLauncher />
          <Link
            href="/"
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
          >
            Voltar para a home
          </Link>
        </div>
      </section>
    </main>
  );
}

