import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { cache } from 'react';
import { buildApiUrl, getApiRequestHeaders } from '@/lib/api-config';
import Image from 'next/image';
import { CreatorStickyContact } from '@/components/creator/CreatorStickyContact';

type CreatorData = { creator: { name: string; public_headline?: string; public_bio?: string; city?: string; state?: string; avatar_url?: string }; stats: Record<string, number | null>; recent_publications: Array<{ id: number; title: string; slug: string; excerpt?: string }>; recent_reviews: Array<{ id: number; title?: string; excerpt?: string; rating?: number; company?: string }>; solutions: Array<{ id: string; name: string; category?: string }>; achievements: Array<{ id: string; title: string }> };

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
  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <section className="rounded-3xl bg-slate-900 p-6 text-white sm:p-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        {creator.avatar_url ? <Image src={creator.avatar_url} alt={creator.name} width={96} height={96} className="h-24 w-24 rounded-full object-cover" unoptimized /> : <div className="flex h-24 w-24 items-center justify-center rounded-full bg-amber-400 text-3xl font-bold text-slate-900">{creator.name.slice(0, 1)}</div>}
        <div><h1 className="text-3xl font-bold">{creator.name}</h1><p className="mt-1 text-lg text-slate-200">{creator.public_headline || 'Especialista em Energia Solar'}</p><p className="text-slate-300">{[creator.city, creator.state].filter(Boolean).join(', ')}</p></div>
      </div>
    </section>
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
      <div className="space-y-8">
        <section><h2 className="text-2xl font-bold text-slate-900">Sobre</h2><p className="mt-3 whitespace-pre-line text-slate-600">{creator.public_bio || 'Perfil público do avaliador Avalia Solar.'}</p></section>
        <section><h2 className="text-2xl font-bold text-slate-900">Publicações</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">{data.recent_publications.map((post) => <article key={post.id} className="rounded-2xl border border-slate-200 p-5"><h3 className="font-semibold text-slate-900">{post.title}</h3><p className="mt-2 text-sm text-slate-600">{post.excerpt}</p></article>)}</div></section>
        <section><h2 className="text-2xl font-bold text-slate-900">Avaliações</h2><div className="mt-4 space-y-3">{data.recent_reviews.map((review) => <article key={review.id} className="rounded-2xl border border-slate-200 p-4"><p>{'★'.repeat(review.rating || 0)}</p><p className="font-medium">{review.title || 'Avaliação publicada'}</p><p className="text-sm text-slate-600">{review.excerpt}</p></article>)}</div></section>
      </div>
      <aside id="contato" className="space-y-5"><section className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-4 text-center">{[['Green Score', stats.green_score], ['Avaliações', stats.review_count], ['Conquistas', stats.achievement_count]].map(([label, value]) => <div key={String(label)}><strong className="block text-xl text-slate-900">{value ?? '—'}</strong><span className="text-xs text-slate-500">{label}</span></div>)}</section><section><h2 className="font-bold text-slate-900">Soluções</h2>{data.solutions.map((solution) => <p key={solution.id} className="mt-2 text-sm text-slate-600">☀ {solution.name}</p>)}</section><a href="#contato" className="block rounded-xl bg-amber-400 px-4 py-3 text-center font-semibold text-slate-900">Entrar em contato</a></aside>
    </div>
  <CreatorStickyContact /></main>;
}
