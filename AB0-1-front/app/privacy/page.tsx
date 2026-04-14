import type { Metadata } from 'next';

import { Card, CardContent } from '@/components/ui/card';
import PageViewTracker from '@/components/PageViewTracker';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacidade | Avalia Solar',
  description:
    'Entenda como a Avalia Solar coleta, usa e protege dados pessoais e quais são os canais oficiais para solicitações de privacidade.',
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    title: 'Privacidade | Avalia Solar',
    description:
      'Entenda como a Avalia Solar coleta, usa e protege dados pessoais e quais são os canais oficiais para solicitações de privacidade.',
    url: '/privacy',
    images: [SITE.ogImagePath],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacidade | Avalia Solar',
    description:
      'Entenda como a Avalia Solar coleta, usa e protege dados pessoais e quais são os canais oficiais para solicitações de privacidade.',
    images: [SITE.ogImagePath],
  },
};

const privacySections = [
  {
    title: 'Dados que podemos coletar',
    items: [
      'Dados fornecidos em formulários, cadastros e mensagens enviadas pelos canais oficiais.',
      'Informações de navegação, eventos de uso e métricas de desempenho da plataforma.',
      'Dados técnicos como endereço IP, navegador, idioma e informações de dispositivo.',
    ],
  },
  {
    title: 'Como usamos os dados',
    items: [
      'Para atender solicitações, melhorar conteúdo e oferecer comparação mais útil.',
      'Para operar recursos de segurança, prevenção a fraude e análise de uso.',
      'Para cumprir obrigações legais, responder contatos e manter a plataforma estável.',
    ],
  },
  {
    title: 'Com quem compartilhamos',
    items: [
      'Prestadores necessários para operação, hospedagem, analytics e suporte técnico.',
      'Autoridades competentes quando houver obrigação legal ou solicitação formal.',
      'Parceiros apenas quando isso for necessário para entregar um serviço solicitado.',
    ],
  },
  {
    title: 'Seus direitos',
    items: [
      'Solicitar acesso, correção, atualização ou exclusão de dados pessoais.',
      'Saber como tratamos dados e contestar usos que considere inadequados.',
      'Revogar consentimentos quando eles forem a base do tratamento.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="bg-slate-50">
      <PageViewTracker type="other" title="Privacidade - Avalia Solar" />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
        <Card className="border-slate-200 bg-white/90 shadow-sm">
          <CardContent className="space-y-6 p-8">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Última atualização: 14 de abril de 2026
              </p>
              <h1 className="text-4xl font-black tracking-tight text-slate-950">
                Política de Privacidade
              </h1>
              <p className="text-lg leading-8 text-slate-600">
                Esta política descreve, em linguagem simples, como tratamos dados pessoais na
                Avalia Solar. Se você tiver uma solicitação específica, use o canal da equipe.
              </p>
            </div>

            <div className="space-y-3 text-sm leading-7 text-slate-600">
              <p>
                A Avalia Solar trabalha com dados para operar a comparação de empresas, responder
                contatos e manter a plataforma segura. Não vendemos dados pessoais e não usamos
                informação além do necessário para a operação do serviço.
              </p>
              <p>
                Nossos canais oficiais de privacidade e suporte são Fale com a equipe e Fale com
                Felipe. O telefone comercial segue o horário informado nas páginas de contato e
                ajuda.
              </p>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-6 md:grid-cols-2">
          {privacySections.map((section) => (
            <Card key={section.title} className="border-slate-200 bg-white/90 shadow-sm">
              <CardContent className="space-y-4 p-6">
                <h2 className="text-2xl font-bold text-slate-950">{section.title}</h2>
                <ul className="space-y-3 text-sm leading-6 text-slate-600">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card className="border-slate-200 bg-slate-950 text-white shadow-xl shadow-slate-900/10">
          <CardContent className="space-y-4 p-8">
            <h2 className="text-2xl font-bold">Como falar sobre seus dados</h2>
            <p className="text-sm leading-7 text-slate-300">
              Se você quiser acessar, corrigir ou excluir dados pessoais tratados pela Avalia
              Solar, use Fale com a equipe. Se o assunto estiver ligado à marca ou contexto
              editorial, use Fale com Felipe.
            </p>
            <p className="text-sm leading-7 text-slate-300">
              Podemos pedir informações adicionais para confirmar identidade e proteger sua conta.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
