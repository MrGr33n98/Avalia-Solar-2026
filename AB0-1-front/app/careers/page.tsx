import type { Metadata } from 'next';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageViewTracker from '@/components/PageViewTracker';
import { CONTACT, SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Carreiras | Avalia Solar',
  description:
    'Conheça a cultura da Avalia Solar e envie sua apresentação para oportunidades, parcerias e colaboração com o time.',
  alternates: {
    canonical: '/careers',
  },
  openGraph: {
    title: 'Carreiras | Avalia Solar',
    description:
      'Conheça a cultura da Avalia Solar e envie sua apresentação para oportunidades, parcerias e colaboração com o time.',
    url: '/careers',
    images: [SITE.ogImagePath],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Carreiras | Avalia Solar',
    description:
      'Conheça a cultura da Avalia Solar e envie sua apresentação para oportunidades, parcerias e colaboração com o time.',
    images: [SITE.ogImagePath],
  },
};

const teamValues = [
  {
    title: 'Clareza',
    description:
      'Falamos com objetividade, documentamos decisões e reduzimos ruído entre produto, operação e marca.',
  },
  {
    title: 'Autonomia',
    description:
      'Valorizamos pessoas que conseguem assumir problemas, testar saídas e entregar com responsabilidade.',
  },
  {
    title: 'Confiança',
    description:
      'Trabalhamos com transparência, confiança no processo e respeito ao usuário final em cada detalhe.',
  },
];

export default function CareersPage() {
  return (
    <div className="bg-slate-50">
      <PageViewTracker type="other" title="Carreiras - Avalia Solar" />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 py-16 sm:px-6 lg:px-8">
        <section className="max-w-3xl space-y-5">
          <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700">
            Trabalho e cultura
          </span>
          <div className="space-y-4">
            <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Carreiras na Avalia Solar
            </h1>
            <p className="text-lg leading-8 text-slate-600 sm:text-xl">
              Estamos construindo uma marca que precisa de gente cuidadosa, objetiva e muito boa
              em resolver problemas reais. Se isso parece com você, queremos conversar.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="rounded-full px-6">
              <a href={`mailto:${CONTACT.team.email}`}>Enviar apresentação</a>
            </Button>
            <Button asChild variant="outline" className="rounded-full px-6">
              <Link href="/about">Conhecer a empresa</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {teamValues.map((value) => (
            <Card key={value.title} className="border-slate-200 bg-white/90 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl text-slate-950">{value.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-slate-600">{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-8 lg:grid-cols-[1fr_0.92fr]">
          <Card className="border-slate-200 bg-white/90 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl text-slate-950">Como pensamos o time</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-slate-600">
              <p>
                Não temos vagas abertas no momento, mas recebemos apresentações de pessoas
                interessadas em produto, conteúdo, operação, vendas e tecnologia.
              </p>
              <p>
                Se você quer construir uma experiência de confiança para consumidores e empresas,
                mande uma mensagem objetiva com seu foco, portfólio e disponibilidade.
              </p>
              <p>
                O melhor primeiro contato é o email da equipe. Se a conversa for sobre marca,
                imprensa ou parceria estratégica, Felipe também recebe diretamente.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-slate-950 text-white shadow-xl shadow-slate-900/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl text-white">Canais para falar com a gente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-slate-300">
              <a
                href={`mailto:${CONTACT.team.email}`}
                className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white transition-colors hover:bg-white/10"
              >
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Equipe
                </span>
                <span className="mt-1 block text-lg font-semibold">Fale com a equipe</span>
              </a>
              <a
                href={`mailto:${CONTACT.founder.email}`}
                className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white transition-colors hover:bg-white/10"
              >
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Liderança
                </span>
                <span className="mt-1 block text-lg font-semibold">Fale com Felipe</span>
              </a>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Horário
                </p>
                <p className="mt-1 text-lg font-semibold text-white">{CONTACT.hours}</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
