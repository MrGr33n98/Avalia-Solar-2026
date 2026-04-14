import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageViewTracker from '@/components/PageViewTracker';
import { CONTACT, SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Sobre a Avalia Solar',
  description:
    'Somos uma camada de confiança para energia solar: verificamos empresas, organizamos a demanda e conectamos clientes à operação certa.',
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'Sobre a Avalia Solar',
    description:
      'A Avalia Solar é a trust layer da energia solar: verificamos empresas, filtramos ruído e conectamos clientes à operação certa.',
    url: '/about',
    images: [SITE.ogImagePath],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sobre a Avalia Solar',
    description:
      'A Avalia Solar é a trust layer da energia solar: verificamos empresas, filtramos ruído e conectamos clientes à operação certa.',
    images: [SITE.ogImagePath],
  },
};

const trustPrinciples = [
  {
    title: 'Verificação',
    description:
      'Curamos sinais públicos e consistência de dados antes de destacar uma empresa.',
  },
  {
    title: 'Moderação',
    description:
      'Filtramos ruído e mantemos só o que acelera a decisão.',
  },
  {
    title: 'Transparência',
    description:
      'Mostramos quem está por trás do contato e para onde cada conversa deve ir.',
  },
  {
    title: 'Operação comercial',
    description:
      'Felipe conecta intenção, follow-up e proposta para transformar confiança em pipeline.',
  },
];

const teamMembers = [
  {
    name: 'Felipe',
    role: 'Comercial e operações',
    image: '/images/felipe-ceo-avalia-solar.png',
    accent: 'from-emerald-500 to-cyan-400',
  },
  {
    name: 'Vinicius',
    role: 'Jurídico e governança',
    image: '/images/vinicius-morais-avalia-solar-team.PNG',
    accent: 'from-sky-500 to-cyan-400',
  },
  {
    name: 'Time jurídico',
    role: 'Compliance e contratos',
    initials: 'TJ',
    accent: 'from-slate-700 via-slate-800 to-slate-950',
  },
] as const;

export default function AboutPage() {
  return (
    <div className="bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <PageViewTracker type="other" title="Sobre a Avalia Solar" />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 py-16 sm:px-6 lg:px-8">
        <section className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              Confiança e comparação
            </span>
            <div className="space-y-4">
              <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Sobre a Avalia Solar
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                Somos a trust layer da energia solar: verificamos empresas, filtramos ruído
                comercial e conectamos cada cliente à operação certa.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild className="rounded-full px-6">
                <Link href="/contact">Fale com Felipe</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full px-6">
                <Link href="/help">Ver como ajudamos</Link>
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden border-slate-200/80 bg-slate-950 text-white shadow-xl shadow-slate-900/10">
            <CardContent className="space-y-6 p-6 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                    Time enxuto
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-white">Build trust, close solar.</h2>
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                  Startup tech
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {teamMembers.map((member) => (
                  <div
                    key={member.name}
                    className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-center"
                  >
                    <div
                      className={`relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-gradient-to-br ${member.accent} shadow-lg shadow-slate-950/20`}
                    >
                      {'image' in member ? (
                        <Image
                          src={member.image}
                          alt={`${member.name}, ${member.role} da Avalia Solar`}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <span className="text-xl font-black tracking-[0.28em] text-white">
                          {member.initials}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white">{member.name}</p>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        {member.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-sm leading-6 text-slate-300">
                Uma operação pequena, rápida e confiável, com jurídico, comercial e operações
                trabalhando como uma única máquina de conversão.
              </p>
              <p className="text-sm leading-6 text-slate-300">
                {CONTACT.phone.display} · {CONTACT.hours}
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {trustPrinciples.map((item) => (
            <Card key={item.title} className="border-slate-200 bg-white/90 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl text-slate-950">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-slate-600">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-slate-200 bg-slate-950 text-white shadow-xl shadow-slate-900/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl text-white">Como trabalhamos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-slate-300">
              <p>
                Operamos como uma camada de confiança: verificamos, moderamos e direcionamos cada
                contato para o time certo.
              </p>
              <p>
                Quando o lead entra, ele segue direto para quem responde com velocidade,
                contexto e clareza.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/90 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl text-slate-950">Canais oficiais</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  Editorial
                </p>
                <a
                  href={`mailto:${CONTACT.founder.email}`}
                  className="mt-2 block text-lg font-semibold text-slate-950 hover:text-emerald-600"
                >
                  Fale com Felipe
                </a>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Parcerias, imprensa e alinhamento da marca.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  Suporte
                </p>
                <a
                  href={`mailto:${CONTACT.team.email}`}
                  className="mt-2 block text-lg font-semibold text-slate-950 hover:text-emerald-600"
                >
                  Fale com a equipe
                </a>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Cadastros, dúvidas operacionais e solicitações gerais.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  Atendimento
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{CONTACT.phone.display}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {CONTACT.hours} · {CONTACT.coverage}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="flex flex-col items-start justify-between gap-4 rounded-3xl bg-emerald-600 px-6 py-8 text-white shadow-lg shadow-emerald-600/20 sm:flex-row sm:items-center sm:px-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Precisa falar com alguém agora?</h2>
            <p className="text-emerald-50">
              O caminho mais rápido é usar os canais oficiais ou visitar a central de ajuda.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="rounded-full bg-white text-emerald-700 hover:bg-emerald-50">
              <Link href="/contact">Contato</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-white/30 text-white hover:bg-white/10">
              <Link href="/help">Ajuda</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
