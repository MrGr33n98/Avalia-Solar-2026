import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildApiUrl, getApiRequestHeaders } from '@/lib/api-config';

type Post = { title: string; excerpt?: string; body: string; published_at?: string };
async function getPost(creator: string, slug: string): Promise<Post | null> {
  const response = await fetch(buildApiUrl(`creators/${encodeURIComponent(creator)}/publications/${encodeURIComponent(slug)}`), { headers: getApiRequestHeaders(), next: { revalidate: 300 } });
  return response.ok ? response.json() : null;
}
export async function generateMetadata({ params }: { params: { slug: string; postSlug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug, params.postSlug);
  if (!post) return { title: 'Publicação não encontrada | Avalia Solar', robots: { index: false } };
  return { title: `${post.title} | Avalia Solar`, description: post.excerpt, alternates: { canonical: `/creators/${params.slug}/posts/${params.postSlug}` }, openGraph: { type: 'article', title: post.title, description: post.excerpt } };
}
export default async function CreatorPostPage({ params }: { params: { slug: string; postSlug: string } }) {
  const post = await getPost(params.slug, params.postSlug);
  if (!post) notFound();
  return <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6"><p className="text-sm text-slate-500">Creator / Publicação</p><h1 className="mt-3 text-4xl font-bold text-slate-900">{post.title}</h1>{post.excerpt && <p className="mt-4 text-xl text-slate-600">{post.excerpt}</p>}<p className="mt-3 text-sm text-slate-500">{post.published_at ? new Date(post.published_at).toLocaleDateString('pt-BR') : ''}</p><article className="mt-10 whitespace-pre-wrap text-lg leading-relaxed text-slate-700">{post.body}</article></main>;
}
