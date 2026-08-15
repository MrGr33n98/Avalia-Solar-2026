import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { cache } from 'react';
import { buildApiUrl, getApiRequestHeaders } from '@/lib/api-config';
import { CreatorHero } from '@/components/creator/CreatorHero';
import { CreatorStickyContact } from '@/components/creator/CreatorStickyContact';
import { CreatorContactForm } from '@/components/creator/CreatorContactForm';

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
  recent_reviews: Array<{
    id: number;
    title?: string;
    excerpt?: string;
    rating?: number;
    company?: string;
  }>;
  solutions: Array<{ id: string; name: string; category?: string }>;
  achievements: Array<{ id: string; title: string }>;
};

const getCreator = cache(async (slug: string): Promise<CreatorData | null> => {
  const response = await fetch(buildApiUrl(`creators/${encodeURIComponent(slug)}`), {
    headers: getApiRequestHeaders(),
    next: { revalidate: 300 },
  });
  return response.ok ? response.json() : null;
});

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const data = await getCreator(params.slug);
  if (!data) return { title: 'Creator não encontrado | Avalia Solar', robots: { index: false } };
  return {
    title: `${data.creator.name} | Avalia Solar`,
    description: data.creator.public_headline || data.creator.public_bio,
    alternates: { canonical: `/creators/${params.slug}` },
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
  return (
    <main className="min-h-screen bg-[#f8fafc] pb-20 text-[#0b1730]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <nav className="mb-4 text-sm text-[#718096]">
          Início <span className="mx-2">›</span> Reviews <span className="mx-2">›</span> Criadores{' '}
          <span className="mx-2">›</span>{' '}
          <span className="font-medium text-slate-700">{creator.name}</span>
        </nav>
        <CreatorHero
          creator={creator}
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
            <section className="grid grid-cols-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.03)] text-center">
              <div>
                <strong className="block text-2xl">{data.recent_publications.length}</strong>
                <span className="text-xs text-[#718096]">Publicações</span>
              </div>
              <div>
                <strong className="block text-2xl">{stats.review_count ?? 0}</strong>
                <span className="text-xs text-[#718096]">Avaliações</span>
              </div>
              <div>
                <strong className="block text-2xl">{stats.achievement_count ?? 0}</strong>
                <span className="text-xs text-[#718096]">Conquistas</span>
              </div>
            </section>
            <section
              id="publicacoes"
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_6px_24px_rgba(15,23,42,0.03)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold">Publicações mais recentes</h2>
                <Link href="/review-dashboard/publications/new" className="inline-flex min-h-10 items-center rounded-lg bg-[#1e5eff] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#174dcc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e5eff] focus-visible:ring-offset-2">Criar publicação</Link>
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
                        <span>{post.publication_type || 'Artigo'}</span>
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
                {data.recent_reviews.map((review) => (
                  <article key={review.id} className="border-b border-slate-200/70 pb-3">
                    <p className="text-amber-500">{'★'.repeat(review.rating || 0)}</p>
                    <p className="font-medium">{review.title || 'Avaliação publicada'}</p>
                    <p className="text-sm text-[#53627a]">{review.excerpt}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>
          <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <CreatorContactForm
              creatorSlug={params.slug}
              whatsappUrl={creator.whatsapp_url}
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
      <CreatorStickyContact />
    </main>
  );
}
