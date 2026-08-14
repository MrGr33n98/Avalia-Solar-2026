import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { cache } from 'react';
import { buildApiUrl, getApiRequestHeaders } from '@/lib/api-config';
import { CreatorHero } from '@/components/creator/CreatorHero';
import { CreatorStickyContact } from '@/components/creator/CreatorStickyContact';
import { CreatorContactForm } from '@/components/creator/CreatorContactForm';

type CreatorData = { creator: { name: string; public_headline?: string; public_bio?: string; city?: string; state?: string; avatar_url?: string; public_banner_url?: string; website_url?: string; linkedin_url?: string; instagram_url?: string; youtube_url?: string }; stats: Record<string, number | null>; recent_publications: Array<{ id: number; title: string; slug: string; excerpt?: string }>; recent_reviews: Array<{ id: number; title?: string; excerpt?: string; rating?: number; company?: string }>; solutions: Array<{ id: string; name: string; category?: string }>; achievements: Array<{ id: string; title: string }> };

const getCreator = cache(async (slug: string): Promise<CreatorData | null> => {
  const response = await fetch(buildApiUrl(`creators/${encodeURIComponent(slug)}`), { headers: getApiRequestHeaders(), next: { revalidate: 300 } });
  return response.ok ? response.json() : null;
});

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getCreator(params.slug);
  if (!data) return { title: 'Creator não encontrado | Avalia Solar', robots: { index: false } };
  return { title: `${data.creator.name} | Avalia Solar`, description: data.creator.public_headline || data.creator.public_bio, alternates: { canonical: `/creators/${params.slug}` } };
}

export default async function CreatorPage({ params }: { params: { slug: string } }) {
  const data = await getCreator(params.slug);
  if (!data) notFound();
  const { creator, stats } = data;
  return <main className="min-h-screen bg-slate-50 pb-20 text-slate-900">
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <nav className="mb-4 text-sm text-slate-500">Início <span className="mx-2">›</span> Reviews <span className="mx-2">›</span> Criadores <span className="mx-2">›</span> <span className="font-medium text-slate-700">{creator.name}</span></nav>
      <CreatorHero creator={creator} publicationCount={data.recent_publications.length} reviewCount={stats.review_count ?? 0} />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_320px]">
        <div className="space-y-6"><section id="overview"
          aria-labelledby="sobre-heading" className="rounded-xl border border-slate-200 bg-white p-6"><h2 id="sobre-heading" className="text-xl font-bold">Sobre {creator.name.split(' ')[0]}</h2><p className="mt-4 whitespace-pre-line leading-7 text-slate-600">{creator.public_bio || 'Perfil público do avaliador Avalia Solar.'}</p><div className="mt-5 flex flex-wrap gap-2">{[creator.website_url, creator.linkedin_url, creator.instagram_url, creator.youtube_url].filter(Boolean).map((url) => <a key={url} href={url} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-blue-700">{url}</a>)}</div></section>
          <section className="grid grid-cols-3 rounded-xl border border-slate-200 bg-white p-5 text-center"><div><strong className="block text-2xl">{data.recent_publications.length}</strong><span className="text-xs text-slate-500">Publicações</span></div><div><strong className="block text-2xl">{stats.review_count ?? 0}</strong><span className="text-xs text-slate-500">Avaliações</span></div><div><strong className="block text-2xl">{stats.achievement_count ?? 0}</strong><span className="text-xs text-slate-500">Conquistas</span></div></section>
          <section id="publicacoes" className="rounded-xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-bold">Publicações mais recentes</h2><div className="mt-4 space-y-3">{data.recent_publications.length ? data.recent_publications.map((post) => <article key={post.id} className="border-b border-slate-100 pb-3"><h3 className="font-semibold">{post.title}</h3><p className="mt-1 text-sm text-slate-600">{post.excerpt}</p></article>) : <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">Este creator ainda não publicou conteúdo.</p>}</div></section>
          <section id="avaliacoes" className="rounded-xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-bold">Avaliações publicadas por {creator.name.split(' ')[0]}</h2><div className="mt-4 space-y-3">{data.recent_reviews.map((review) => <article key={review.id} className="border-b border-slate-100 pb-3"><p className="text-amber-500">{'★'.repeat(review.rating || 0)}</p><p className="font-medium">{review.title || 'Avaliação publicada'}</p><p className="text-sm text-slate-600">{review.excerpt}</p></article>)}</div></section></div>
        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start"><CreatorContactForm creatorSlug={params.slug} /><section id="solucoes" className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Soluções</h2>{data.solutions.length ? data.solutions.map((solution) => <div key={solution.id} className="mt-3 rounded-lg bg-slate-50 p-3"><p className="font-medium">{solution.name}</p>{solution.category && <p className="mt-1 text-xs text-slate-500">{solution.category}</p>}</div>) : <p className="mt-3 text-sm text-slate-500">Nenhuma solução publicada ainda.</p>}</section><section id="conquistas" className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Conquistas</h2>{data.achievements.map((achievement) => <p key={achievement.id} className="mt-3 text-sm">🏅 {achievement.title}</p>)}</section></aside>
      </div>
    </div><CreatorStickyContact /></main>;
}
