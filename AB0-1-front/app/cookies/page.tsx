import type { Metadata } from 'next';

import { Card, CardContent } from '@/components/ui/card';
import PageViewTracker from '@/components/PageViewTracker';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Cookies | Avalia Solar',
  description:
    'Saiba como a Avalia Solar usa cookies e tecnologias semelhantes para analytics, segurança e melhoria da experiência.',
  alternates: {
    canonical: '/cookies',
  },
  openGraph: {
    title: 'Cookies | Avalia Solar',
    description:
      'Saiba como a Avalia Solar usa cookies e tecnologias semelhantes para analytics, segurança e melhoria da experiência.',
    url: '/cookies',
    images: [SITE.ogImagePath],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cookies | Avalia Solar',
    description:
      'Saiba como a Avalia Solar usa cookies e tecnologias semelhantes para analytics, segurança e melhoria da experiência.',
    images: [SITE.ogImagePath],
  },
};

const cookieSections = [
  {
    title: 'Cookies essenciais',
    description:
      'Essenciais para autenticação, segurança, consentimento, navegação e funcionamento básico da plataforma.',
  },
  {
    title: 'Cookies de analytics',
    description:
      'Usados para medir tráfego, entender comportamento de uso e melhorar conteúdo, performance e jornada.',
  },
  {
    title: 'Preferências',
    description:
      'Guardam escolhas como tema, idioma e estados da interface para evitar que você precise refazer tudo a cada visita.',
  },
];

export default function CookiesPage() {
  return (
    <div className="bg-slate-50">
      <PageViewTracker type="other" title="Cookies - Avalia Solar" />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
        <Card className="border-slate-200 bg-white/90 shadow-sm">
          <CardContent className="space-y-6 p-8">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Última atualização: 14 de abril de 2026
              </p>
              <h1 className="text-4xl font-black tracking-tight text-slate-950">
                Política de cookies
              </h1>
              <p className="text-lg leading-8 text-slate-600">
                Usamos cookies e tecnologias semelhantes para lembrar preferências, analisar o uso
                da plataforma e manter a experiência segura e consistente.
              </p>
            </div>

            <p className="text-sm leading-7 text-slate-600">
              Quando o banner de consentimento estiver disponível, você pode ajustar preferências
              diretamente nele. Dúvidas sobre esta política podem ser enviadas para Fale com a
              equipe.
            </p>
          </CardContent>
        </Card>

        <section className="grid gap-6 md:grid-cols-3">
          {cookieSections.map((section) => (
            <Card key={section.title} className="border-slate-200 bg-white/90 shadow-sm">
              <CardContent className="space-y-3 p-6">
                <h2 className="text-2xl font-bold text-slate-950">{section.title}</h2>
                <p className="text-sm leading-6 text-slate-600">{section.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card className="border-slate-200 bg-slate-950 text-white shadow-xl shadow-slate-900/10">
          <CardContent className="space-y-4 p-8">
            <h2 className="text-2xl font-bold">Como gerenciar</h2>
            <p className="text-sm leading-7 text-slate-300">
              Você pode remover ou bloquear cookies nas configurações do navegador. Isso pode
              afetar recursos como login, persistência de tema, consentimento e medições de uso.
            </p>
            <p className="text-sm leading-7 text-slate-300">
              Para questões sobre analytics ou privacidade, use Fale com a equipe. Para
              alinhamento institucional, use Fale com Felipe.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
