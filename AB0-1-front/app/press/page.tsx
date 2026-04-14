import type { Metadata } from 'next';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageViewTracker from '@/components/PageViewTracker';
import { CONTACT, SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Sala de imprensa | Avalia Solar',
  description:
    'Acesse informações institucionais, pontos de contato editorial e o posicionamento da Avalia Solar para imprensa e parceiros.',
  alternates: {
    canonical: '/press',
  },
  openGraph: {
    title: 'Sala de imprensa | Avalia Solar',
    description:
      'Acesse informações institucionais, pontos de contato editorial e o posicionamento da Avalia Solar para imprensa e parceiros.',
    url: '/press',
    images: [SITE.ogImagePath],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sala de imprensa | Avalia Solar',
    description:
      'Acesse informações institucionais, pontos de contato editorial e o posicionamento da Avalia Solar para imprensa e parceiros.',
    images: [SITE.ogImagePath],
  },
};

export default function PressPage() {
  return (
    <div className="bg-slate-50">
      <PageViewTracker type="other" title="Sala de imprensa - Avalia Solar" />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 py-16 sm:px-6 lg:px-8">
        <section className="max-w-3xl space-y-5">
          <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
            Imprensa e marca
          </span>
          <div className="space-y-4">
            <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Sala de imprensa
            </h1>
            <p className="text-lg leading-8 text-slate-600 sm:text-xl">
              Se você precisa de contexto de marca, entrevista ou material institucional, fale
              com o canal editorial. Mantemos o contato direto, sem formulário desnecessário.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="rounded-full px-6">
              <a href={`mailto:${CONTACT.founder.email}`}>Fale com Felipe</a>
            </Button>
            <Button asChild variant="outline" className="rounded-full px-6">
              <Link href="/about">Sobre a marca</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr_0.9fr]">
          <Card className="border-slate-200 bg-white/90 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl text-slate-950">Posicionamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
              <p>
                A Avalia Solar é uma plataforma focada em confiança, comparação e contato com
                empresas verificadas de energia solar.
              </p>
              <p>
                Nosso objetivo é reduzir ruído, destacar sinais públicos de credibilidade e
                facilitar a decisão de consumidores e empresas.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/90 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl text-slate-950">Material editorial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
              <ul className="list-disc space-y-2 pl-5">
                <li>Logo da marca em alta resolução</li>
                <li>Foto do fundador para uso editorial</li>
                <li>Capturas da plataforma e contexto institucional</li>
                <li>Dados de marca e mensagens-chave</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-slate-950 text-white shadow-xl shadow-slate-900/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl text-white">Contato editorial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-slate-300">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Felipe
                </p>
                <a
                  href={`mailto:${CONTACT.founder.email}`}
                  className="mt-1 block text-lg font-semibold text-white hover:text-sky-300"
                >
                  Fale com Felipe
                </a>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Horário
                </p>
                <p className="mt-1 text-lg font-semibold text-white">{CONTACT.hours}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Telefone
                </p>
                <a
                  href={CONTACT.phone.href}
                  className="mt-1 block text-lg font-semibold text-white hover:text-sky-300"
                >
                  {CONTACT.phone.display}
                </a>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-950">Para quem é esta página?</h2>
              <p className="text-slate-600">
                Jornalistas, parceiros de conteúdo e investidores podem usar este canal para
                pedir informações institucionais ou marcar entrevistas.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <Button asChild className="rounded-full px-6">
                <a href={`mailto:${CONTACT.founder.email}`}>Solicitar contato</a>
              </Button>
              <Button asChild variant="outline" className="rounded-full px-6">
                <Link href="/contact">Contato geral</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
