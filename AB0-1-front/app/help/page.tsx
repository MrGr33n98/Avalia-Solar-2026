import type { Metadata } from 'next';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageViewTracker from '@/components/PageViewTracker';
import { CONTACT, SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Central de ajuda | Avalia Solar',
  description:
    'Encontre respostas sobre cadastro, verificação, avaliação de empresas e como falar com a equipe da Avalia Solar.',
  alternates: {
    canonical: '/help',
  },
  openGraph: {
    title: 'Central de ajuda | Avalia Solar',
    description:
      'Encontre respostas sobre cadastro, verificação, avaliação de empresas e contato com a equipe.',
    url: '/help',
    images: [SITE.ogImagePath],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Central de ajuda | Avalia Solar',
    description:
      'Encontre respostas sobre cadastro, verificação, avaliação de empresas e contato com a equipe.',
    images: [SITE.ogImagePath],
  },
};

const helpTopics = [
  {
    title: 'Como escolher uma empresa',
    description:
      'Compare sinais públicos de confiança, histórico de atendimento, conteúdo publicado e clareza dos canais oficiais.',
  },
  {
    title: 'Como a verificação funciona',
    description:
      'Revisamos consistência de dados, presença digital e indicadores de transparência antes de destacar uma empresa.',
  },
  {
    title: 'Como falar com a equipe',
    description:
      'Para suporte, use Fale com a equipe. Para imprensa e parcerias, use Fale com Felipe.',
  },
];

export default function HelpPage() {
  return (
    <div className="bg-slate-50">
      <PageViewTracker type="other" title="Central de ajuda - Avalia Solar" />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 py-16 sm:px-6 lg:px-8">
        <section className="max-w-3xl space-y-5">
          <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700">
            Suporte e orientações
          </span>
          <div className="space-y-4">
            <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Central de ajuda
            </h1>
            <p className="text-lg leading-8 text-slate-600 sm:text-xl">
              A central existe para reduzir ida e volta desnecessária. Antes de enviar uma
              mensagem, veja se a resposta mais rápida não está aqui.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="rounded-full px-6">
              <Link href="/contact">Fale com a equipe</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full px-6">
              <a href={`mailto:${CONTACT.founder.email}`}>Fale com Felipe</a>
            </Button>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {helpTopics.map((topic) => (
            <Card key={topic.title} className="border-slate-200 bg-white/90 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl text-slate-950">{topic.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-slate-600">{topic.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-8 lg:grid-cols-[1fr_0.92fr]">
          <Card className="border-slate-200 bg-white/90 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl text-slate-950">Perguntas frequentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 text-sm leading-6 text-slate-600">
              <div>
                <h2 className="font-semibold text-slate-950">A avaliação substitui orçamento?</h2>
                <p className="mt-1">
                  Não. A avaliação ajuda a orientar a decisão; o orçamento e o contrato continuam
                  sendo responsabilidade da empresa escolhida.
                </p>
              </div>
              <div>
                <h2 className="font-semibold text-slate-950">Posso falar com a marca sem usar formulário?</h2>
                <p className="mt-1">
                  Sim. Os canais oficiais estão sempre visíveis no footer, na página de contato e
                  nesta central.
                </p>
              </div>
              <div>
                <h2 className="font-semibold text-slate-950">Quem responde a imprensa e parcerias?</h2>
                <p className="mt-1">
                  O canal editorial é o email de Felipe. O canal operacional é o email da equipe.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-slate-950 text-white shadow-xl shadow-slate-900/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl text-white">Atendimento rápido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-slate-300">
              <p>
                {CONTACT.hours} · {CONTACT.coverage}
              </p>
              <div className="space-y-3">
                <a
                  href={`mailto:${CONTACT.team.email}`}
                  className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white transition-colors hover:bg-white/10"
                >
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Suporte
                  </span>
                  <span className="mt-1 block text-lg font-semibold">Fale com a equipe</span>
                </a>
                <a
                  href={`mailto:${CONTACT.founder.email}`}
                  className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white transition-colors hover:bg-white/10"
                >
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Editorial
                  </span>
                  <span className="mt-1 block text-lg font-semibold">Fale com Felipe</span>
                </a>
                <a
                  href={CONTACT.phone.href}
                  className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white transition-colors hover:bg-white/10"
                >
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Telefone
                  </span>
                  <span className="mt-1 block text-lg font-semibold">{CONTACT.phone.display}</span>
                </a>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
