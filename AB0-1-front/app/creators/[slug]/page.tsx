import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { cache } from 'react';
import { buildApiUrl, getApiRequestHeaders } from '@/lib/api-config';
import { CreatorHero } from '@/components/creator/CreatorHero';
import { CreatorStickyContact } from '@/components/creator/CreatorStickyContact';
import { CreatorContactForm } from '@/components/creator/CreatorContactForm';
import { CreatorReviewCard, type CreatorReview } from '@/components/creator/CreatorReviewCard';
import { CreatorFollowList } from '@/components/creator/CreatorFollowList';
import { getPublicationTypeLabel } from '@/lib/publications/publicationTypes';

type CreatorData = {
  creator: {
    name: string;
    public_headline?: string;
    public_bio?: string;
    city?: string;
    state?: string;
    avatar_url?: string;
    public_banner_url?: string;
    whatsapp_url?: string;
    website_url?: string;
    linkedin_url?: string;
    instagram_url?: string;
    youtube_url?: string;
    tree_enabled?: boolean;
    tree_url?: string | null;
  };
  stats: Record<string, number | null>;
  recent_publications: Array<{
    id: number;
    title: string;
    slug: string;
    excerpt?: string;
    publication_type?: string;
    published_at?: string;
  }>;
  recent_reviews: CreatorReview[];
  solutions: Array<{ id: string; name: string; category?: string }>;
  achievements: Array<{ id: string; title: string }>;
};

const getCreator = cache(async (slug: string): Promise<CreatorData | null> => {
  const response = await fetch(buildApiUrl(`creators/${encodeURIComponent(slug)}`), {
    headers: getApiRequestHeaders(),
    next: { revalidate: 300 },
  });
  if (response.status === 404) return null;

  if (!response.ok) {
    console.error('[CreatorPage] API error', { slug, status: response.status });
    throw new Error(`Creator API failed with status ${response.status}`);
  }

  return response.json();
});

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const data = await getCreator(params.slug);
  if (!data) return { title: 'Creator não encontrado | Avalia Solar', robots: { index: false } };
  const desc = data.creator.public_headline || data.creator.public_bio || 'Avaliador de energia solar no Avalia Solar.';
  return {
    title: `${data.creator.name} | Avalia Solar`,
    description: desc,
    alternates: { canonical: `/creators/${params.slug}` },
    openGraph: {
      type: 'profile',
      title: `${data.creator.name} | Avalia Solar`,
      description: desc,
      username: params.slug,
      images: data.creator.avatar_url ? [data.creator.avatar_url] : undefined,
    },
  };
}

export default async function CreatorPage({ params }: { params: { slug: string } }) {
  const data = await getCreator(params.slug);
  if (!data) notFound();
  const { creator, stats } = data;
  const socialLinks = [
    creator.linkedin_url
      ? { label: 'LinkedIn', value: creator.linkedin_url, icon: 'linkedin' as const }
      : null,
    creator.instagram_url
      ? { label: 'Instagram', value: creator.instagram_url, icon: 'instagram' as const }
      : null,
    creator.website_url
      ? { label: 'Site', value: creator.website_url, icon: 'website' as const }
      : null,
  ].filter(Boolean) as Array<{
    label: string;
    value: string;
    icon: 'linkedin' | 'instagram' | 'website';
  }>;
  const canonical = `https://www.avaliasolar.com.br/creators/${params.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    'mainEntity': {
      '@type': 'Person',
      'name': creator.name,
      'description': creator.public_bio || creator.public_headline,
      'image': creator.avatar_url,
      'jobTitle': creator.public_headline || 'Especialista Solar',
      'address': {
        '@type': 'PostalAddress',
        'addressLocality': creator.city,
        'addressRegion': creator.state,
        'addressCountry': 'BR'
      },
      'url': canonical
    }
  };
  const safeJsonLd = JSON.stringify(jsonLd)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
  return (
    <main className="min-h-screen bg-[#f8fafc] pb-20 text-[#0b1730]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd }} />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <nav className="mb-4 text-sm text-[#718096]">
          Início <span className="mx-2">›</span> Reviews <span className="mx-2">›</span> Criadores{' '}
          <span className="mx-2">›</span>{' '}
          <span className="font-medium text-slate-700">{creator.name}</span>
        </nav>
        <CreatorHero
          creator={creator}
          creatorSlug={params.slug}
          publicationCount={data.recent_publications.length}
          reviewCount={stats.review_count ?? 0}
        />
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_320px]">
          <div className="space-y-6">
            <section
              id="overview"
              aria-labelledby="sobre-heading"
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_6px_24px_rgba(15,23,42,0.03)]"
            >
              <h2 id="sobre-heading" className="text-xl font-bold">
                Sobre {creator.name.split(' ')[0]}
              </h2>
              <p className="mt-4 whitespace-pre-line leading-7 text-[#53627a]">
                {creator.public_bio || 'Perfil público do avaliador Avalia Solar.'}
              </p>
            </section>
            <p className="text-sm text-[#718096]">
              {data.recent_publications.length} publicações · {stats.review_count ?? 0} avaliações
              · {stats.achievement_count ?? 0} conquistas
            </p>
            <section
              id="publicacoes"
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_6px_24px_rgba(15,23,42,0.03)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold">Publicações mais recentes</h2>
              </div>
              <div className="mt-4 space-y-3">
                {data.recent_publications.length ? (
                  data.recent_publications.map((post) => (
                    <a
                      key={post.id}
                      href={`/creators/${params.slug}/posts/${post.slug}`}
                      className="group block border-b border-slate-200/70 pb-3 last:border-0"
                    >
                      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#1e5eff]">
                        <span>{getPublicationTypeLabel(post.publication_type, 'shortLabel')}</span>
                        {post.published_at && (
                          <span className="font-normal text-[#718096]">
                            {new Date(post.published_at).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1 font-semibold group-hover:text-[#1e5eff]">
                        {post.title}
                      </h3>
                      <p className="mt-1 text-sm text-[#53627a]">{post.excerpt}</p>
                    </a>
                  ))
                ) : (
                  <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-[#53627a]">
                    Este creator ainda não publicou conteúdo.
                  </p>
                )}
              </div>
            </section>
            <section
              id="avaliacoes"
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_6px_24px_rgba(15,23,42,0.03)]"
            >
              <h2 className="text-xl font-bold">
                Avaliações publicadas por {creator.name.split(' ')[0]}
              </h2>
              <div className="mt-4 space-y-3">
                {data.recent_reviews.length ? (
                  data.recent_reviews.map((review) => <CreatorReviewCard key={review.id} review={review} />)
                ) : (
                  <p className="rounded-lg bg-slate-50 p-4 text-sm text-[#53627a]">
                    Este creator ainda não publicou avaliações.
                  </p>
                )}
              </div>
            </section>
            <section id="seguidores" className="scroll-mt-6">
              <CreatorFollowList creatorSlug={params.slug} type="followers" />
            </section>
            <section id="seguindo" className="scroll-mt-6">
              <CreatorFollowList creatorSlug={params.slug} type="following" />
            </section>
          </div>
          <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <CreatorContactForm
              creatorSlug={params.slug}
              whatsappUrl={creator.whatsapp_url}
              treeUrl={creator.tree_enabled ? creator.tree_url || undefined : undefined}
              socialLinks={socialLinks}
            />
            <section
              id="solucoes"
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.03)]"
            >
              <h2 className="font-bold">Soluções</h2>
              {data.solutions.length ? (
                data.solutions.map((solution) => (
                  <div key={solution.id} className="mt-3 rounded-lg bg-slate-50 p-3">
                    <p className="font-medium">{solution.name}</p>
                    {solution.category && (
                      <p className="mt-1 text-xs text-[#718096]">{solution.category}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="mt-3 text-sm text-[#718096]">Nenhuma solução publicada ainda.</p>
              )}
            </section>
            <section
              id="conquistas"
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.03)]"
            >
              <h2 className="font-bold">Conquistas</h2>
              {data.achievements.map((achievement) => (
                <p key={achievement.id} className="mt-3 text-sm">
                  🏅 {achievement.title}
                </p>
              ))}
            </section>
          </aside>
        </div>
      </div>
      <CreatorStickyContact whatsappUrl={creator.whatsapp_url} />
    </main>
  );
}
