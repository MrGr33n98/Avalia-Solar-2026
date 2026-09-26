import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Award, CheckCircle2, ShieldCheck, Calendar, Tag, Building2, ArrowLeft, ExternalLink, Share2 } from 'lucide-react';
import { publicBadgesApi } from '@/lib/api-public';
import { absoluteUrl } from '@/lib/site';
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await publicBadgesApi.getBySlug(params.slug);
  if (!data?.badge) {
    return {
      title: 'Selo não encontrado | Avalia Solar',
      robots: { index: false, follow: false },
    };
  }

  const badge = data.badge;
  const canonicalUrl = absoluteUrl(`/badges/${badge.public_slug || params.slug}`);
  const title = `${badge.name} | Verificação Oficial Avalia Solar`;
  const description =
    badge.description ||
    `Registro oficial e verificação de autenticidade do selo ${badge.name} emitido pelo ecossistema Avalia Solar.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      siteName: 'Avalia Solar',
      images: badge.image_url ? [{ url: badge.image_url, alt: badge.name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: badge.image_url ? [badge.image_url] : undefined,
    },
  };
}

export default async function BadgeVerificationPage({ params }: Props) {
  const data = await publicBadgesApi.getBySlug(params.slug);

  if (!data?.badge) {
    notFound();
  }

  const { badge, featured_companies = [] } = data;
  const canonicalUrl = absoluteUrl(`/badges/${badge.public_slug || params.slug}`);
  const verificationDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': canonicalUrl,
        url: canonicalUrl,
        name: `${badge.name} - Verificação Oficial`,
        description: badge.description || `Selo oficial de distinção ${badge.name} emitido pelo Avalia Solar.`,
        isPartOf: {
          '@type': 'WebSite',
          '@id': absoluteUrl('/#website'),
          url: absoluteUrl('/'),
          name: 'Avalia Solar',
        },
      },
      {
        '@type': 'Organization',
        '@id': absoluteUrl('/#organization'),
        name: 'Avalia Solar',
        url: absoluteUrl('/'),
        logo: absoluteUrl('/images/logo.png'),
      },
    ],
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-4xl mx-auto space-y-8">
        <BreadcrumbSchema
          items={[
            { name: 'Início', item: '/' },
            { name: 'Selos de Autoridade', item: '/badges' },
            { name: badge.name, item: `/badges/${badge.public_slug || params.slug}` },
          ]}
        />

        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao ecossistema
          </Link>
          <Badge variant="outline" className="gap-1.5 py-1 px-3 border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wide">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Selo Válido & Ativo
          </Badge>
        </div>

        {/* Hero Card do Selo */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-8 sm:p-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              <div className="flex justify-center">
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 p-4 rounded-2xl bg-gradient-to-b from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-inner">
                  {badge.image_url ? (
                    <Image
                      src={badge.image_url}
                      alt={badge.name}
                      width={200}
                      height={200}
                      className="object-contain max-h-44 max-w-44 drop-shadow-md"
                      priority
                    />
                  ) : (
                    <Award className="h-24 w-24 text-primary" />
                  )}
                </div>
              </div>

              <div className="md:col-span-2 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span>Emissão Oficial Avalia Solar</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {badge.name}
                  </h1>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {badge.category && (
                    <Badge variant="secondary" className="gap-1 text-xs font-semibold">
                      <Tag className="h-3 w-3" />
                      {badge.category}
                    </Badge>
                  )}
                  {badge.year && (
                    <Badge variant="outline" className="gap-1 text-xs font-semibold">
                      <Calendar className="h-3 w-3" />
                      Ano {badge.year}
                    </Badge>
                  )}
                  {badge.edition && (
                    <Badge variant="outline" className="text-xs font-semibold">
                      Edição {badge.edition}
                    </Badge>
                  )}
                </div>

                <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed pt-2">
                  {badge.description ||
                    'Este selo atesta reconhecimento formal e destaque no setor de energia solar, validado conforme critérios de governança e auditoria técnica do Avalia Solar.'}
                </p>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <div>
                    Verificação auditada em: <strong className="text-slate-700 dark:text-slate-200">{verificationDate}</strong>
                  </div>
                  <div className="font-mono text-[11px] truncate max-w-xs">
                    ID: {badge.public_slug || badge.id}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Empresas Reconhecidas */}
        {featured_companies && featured_companies.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-slate-700 dark:text-slate-300" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Empresas Outorgadas com este Reconhecimento
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {featured_companies.map((company) => (
                <Card
                  key={company.id}
                  className="hover:border-primary/50 transition-colors border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60"
                >
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {company.logo_url ? (
                        <Image
                          src={company.logo_url}
                          alt={company.name}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-lg object-contain bg-slate-50 dark:bg-slate-800 p-1 border"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                          {company.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {company.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Empresa Certificada
                        </p>
                      </div>
                    </div>
                    <Button asChild size="sm" variant="ghost" className="shrink-0 h-8 w-8 p-0">
                      <Link href={`/companies/${company.slug}`} aria-label={`Ver perfil de ${company.name}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Rodapé de Governança */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/40 p-6 text-center space-y-2">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            A autenticidade deste selo pode ser auditada publicamente pela URL canônica permanente:
          </p>
          <p className="text-xs font-mono text-primary font-semibold select-all break-all">
            {canonicalUrl}
          </p>
        </div>
      </div>
    </main>
  );
}
