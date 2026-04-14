import type { Metadata } from 'next';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageViewTracker from '@/components/PageViewTracker';
import { CONTACT, FOOTER_TRUST_LINKS, PUBLIC_CONTACT_CHANNELS, SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contato | Avalia Solar',
  description:
    'Fale com Felipe, com a equipe da Avalia Solar ou use nossos canais oficiais para suporte, parcerias, imprensa e dúvidas operacionais.',
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contato | Avalia Solar',
    description:
      'Fale com Felipe, com a equipe da Avalia Solar ou use nossos canais oficiais para suporte, parcerias e imprensa.',
    url: '/contact',
    images: [SITE.ogImagePath],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contato | Avalia Solar',
    description:
      'Fale com Felipe, com a equipe da Avalia Solar ou use nossos canais oficiais para suporte, parcerias e imprensa.',
    images: [SITE.ogImagePath],
  },
};

export default function ContactPage() {
  return (
    <div className="bg-slate-50">
      <PageViewTracker type="other" title="Contato - Avalia Solar" />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 py-16 sm:px-6 lg:px-8">
        <section className="max-w-3xl space-y-5">
          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            Contato oficial
          </span>
          <div className="space-y-4">
            <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Fale com a Avalia Solar
            </h1>
            <p className="text-lg leading-8 text-slate-600 sm:text-xl">
              Se você precisa de suporte, imprensa, parceria ou apenas quer entender melhor como
              a plataforma funciona, escolha o canal certo e fale com quem realmente resolve.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="rounded-full px-6">
              <a href={`mailto:${CONTACT.founder.email}`}>Fale com Felipe</a>
            </Button>
            <Button asChild variant="outline" className="rounded-full px-6">
              <a href={`mailto:${CONTACT.team.email}`}>Fale com a equipe</a>
            </Button>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {PUBLIC_CONTACT_CHANNELS.map((channel) => (
            <Card key={channel.label} className="border-slate-200 bg-white/90 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl text-slate-950">{channel.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-6 text-slate-600">{channel.description}</p>
                <a
                  href={channel.href}
                  className="block text-lg font-semibold text-slate-950 transition-colors hover:text-emerald-600"
                >
                  {channel.href.startsWith('mailto:') ? channel.label : channel.display}
                </a>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-8 lg:grid-cols-[1fr_0.92fr]">
          <Card className="border-slate-200 bg-white/90 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl text-slate-950">O que acontece depois do contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-slate-600">
              <p>
                Mensagens enviadas por email são triadas por assunto para reduzir o tempo de
                resposta. Parcerias e imprensa vão para o canal editorial; dúvidas operacionais
                ficam com a equipe.
              </p>
              <p>
                Quando necessário, encaminhamos para páginas de ajuda, privacidade ou carreiras
                para evitar mensagens repetidas e manter o atendimento objetivo.
              </p>
              <p>
                O telefone é um canal comercial de apoio e segue o horário de atendimento listado
                nesta página.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-slate-950 text-white shadow-xl shadow-slate-900/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl text-white">Atendimento e localização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 text-sm leading-6 text-slate-300">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                  Horário
                </p>
                <p className="mt-2 text-lg font-semibold text-white">{CONTACT.hours}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                  Cobertura
                </p>
                <p className="mt-2 text-lg font-semibold text-white">{CONTACT.coverage}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                  Telefone
                </p>
                <a
                  href={CONTACT.phone.href}
                  className="mt-2 block text-lg font-semibold text-white hover:text-emerald-300"
                >
                  {CONTACT.phone.display}
                </a>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-950">Quer seguir por um caminho direto?</h2>
              <p className="text-slate-600">
                Use os atalhos abaixo para chegar mais rápido à página certa.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {FOOTER_TRUST_LINKS.map((link) => (
                <Button key={link.href} asChild variant="outline" className="rounded-full">
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
