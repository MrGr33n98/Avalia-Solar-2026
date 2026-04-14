import type { Metadata } from 'next';

import { Card, CardContent } from '@/components/ui/card';
import PageViewTracker from '@/components/PageViewTracker';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Termos de uso | Avalia Solar',
  description:
    'Leia os termos de uso da Avalia Solar para entender responsabilidades, limitações e regras de uso da plataforma.',
  alternates: {
    canonical: '/terms',
  },
  openGraph: {
    title: 'Termos de uso | Avalia Solar',
    description:
      'Leia os termos de uso da Avalia Solar para entender responsabilidades, limitações e regras de uso da plataforma.',
    url: '/terms',
    images: [SITE.ogImagePath],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Termos de uso | Avalia Solar',
    description:
      'Leia os termos de uso da Avalia Solar para entender responsabilidades, limitações e regras de uso da plataforma.',
    images: [SITE.ogImagePath],
  },
};

const termSections = [
  {
    title: 'Uso da plataforma',
    items: [
      'Use o site de forma lícita, respeitando a lei, os demais usuários e as regras da plataforma.',
      'Não publique informações falsas, ofensivas ou que comprometam a integridade das avaliações.',
      'Podemos suspender acesso em caso de abuso, fraude, automação indevida ou violação destes termos.',
    ],
  },
  {
    title: 'Conteúdo e responsabilidade',
    items: [
      'As avaliações e informações publicadas por terceiros refletem a experiência de quem enviou o conteúdo.',
      'A Avalia Solar organiza e apresenta a informação, mas não substitui orçamento, contrato ou análise técnica.',
      'Cada empresa é responsável pelas promessas comerciais, execução e atendimento que oferece.',
    ],
  },
  {
    title: 'Propriedade intelectual',
    items: [
      'Textos, identidade visual, marca e elementos do site pertencem à Avalia Solar ou a seus licenciantes.',
      'Uso não autorizado de marca, layout ou conteúdo pode ser removido ou contestado.',
      'Você pode compartilhar links públicos da plataforma, desde que não deturpe o contexto original.',
    ],
  },
  {
    title: 'Limitações',
    items: [
      'Não garantimos que toda informação de terceiros esteja completa, atualizada ou livre de erro.',
      'A decisão final de contratação é sempre do usuário e deve considerar múltiplas fontes.',
      'A plataforma pode passar por manutenção, atualizações e mudanças de recursos ao longo do tempo.',
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="bg-slate-50">
      <PageViewTracker type="other" title="Termos de uso - Avalia Solar" />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
        <Card className="border-slate-200 bg-white/90 shadow-sm">
          <CardContent className="space-y-6 p-8">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Última atualização: 14 de abril de 2026
              </p>
              <h1 className="text-4xl font-black tracking-tight text-slate-950">
                Termos de uso
              </h1>
              <p className="text-lg leading-8 text-slate-600">
                Estes termos descrevem as regras básicas de uso da Avalia Solar e ajudam a manter
                a experiência previsível, segura e útil para consumidores e empresas.
              </p>
            </div>

            <p className="text-sm leading-7 text-slate-600">
              Para dúvidas sobre estes termos, use Fale com a equipe. Se a questão for
              institucional ou editorial, use Fale com Felipe.
            </p>
          </CardContent>
        </Card>

        <section className="grid gap-6 md:grid-cols-2">
          {termSections.map((section) => (
            <Card key={section.title} className="border-slate-200 bg-white/90 shadow-sm">
              <CardContent className="space-y-4 p-6">
                <h2 className="text-2xl font-bold text-slate-950">{section.title}</h2>
                <ul className="space-y-3 text-sm leading-6 text-slate-600">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
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
            <h2 className="text-2xl font-bold">Contato para questões legais</h2>
            <p className="text-sm leading-7 text-slate-300">
              Se você identificar algo que precise de correção, use Fale com a equipe. Para
              assuntos editoriais e institucionais, use Fale com Felipe.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
