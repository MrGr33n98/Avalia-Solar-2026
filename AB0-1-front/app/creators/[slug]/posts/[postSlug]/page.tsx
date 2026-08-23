import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildApiUrl, getApiRequestHeaders } from '@/lib/api-config';
import Link from 'next/link';
import Image from 'next/image';
import { PublicationComments } from '@/components/creator/PublicationComments';
import { CreatorShareButton } from '@/components/creator/CreatorShareButton';
import { PublicationLikeButton } from '@/components/creator/PublicationLikeButton';
import { getPublicationTypeLabel } from '@/lib/publications/publicationTypes';

type Post = {
  title: string;
  excerpt?: string;
  body: string;
  published_at?: string;
  updated_at?: string;
  publication_type?: string;
  category?: string;
  cover_image?: string | null;
  comments_enabled?: boolean;
  author?: { id: number; name: string };
  attachments?: Array<{ id: number; filename: string; url: string }>;
  likes_count?: number;
  reading_time_minutes?: number;
};
async function getPost(creator: string, slug: string): Promise<Post | null> {
  const response = await fetch(
    buildApiUrl(`creators/${encodeURIComponent(creator)}/publications/${encodeURIComponent(slug)}`),
    { headers: getApiRequestHeaders(), next: { revalidate: 300 } }
  );
  return response.ok ? response.json() : null;
}
export async function generateMetadata({
  params,
}: {
  params: { slug: string; postSlug: string };
}): Promise<Metadata> {
  const post = await getPost(params.slug, params.postSlug);
  if (!post) return { title: 'Publicação não encontrada | Avalia Solar', robots: { index: false } };
  const desc = post.excerpt || 'Publicação de energia solar no Avalia Solar.';
  return {
    title: `${post.title} | Avalia Solar`,
    description: desc,
    alternates: { canonical: `/creators/${params.slug}/posts/${params.postSlug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: desc,
      images: post.cover_image ? [post.cover_image] : undefined,
      publishedTime: post.published_at,
      modifiedTime: post.updated_at || post.published_at,
      authors: post.author?.name ? [post.author.name] : undefined,
    },
  };
}
export default async function CreatorPostPage({
  params,
}: {
  params: { slug: string; postSlug: string };
}) {
  const post = await getPost(params.slug, params.postSlug);
  if (!post) notFound();
  const readingTime = post.reading_time_minutes ?? Math.max(1, Math.ceil(post.body.split(/\s+/).filter(Boolean).length / 200));
  const canonical = `https://www.avaliasolar.com.br/creators/${params.slug}/posts/${params.postSlug}`;
  // Tipos normalizados para Article: schema.org não possui tipo equivalente seguro para todos.
  const jsonLd = { '@context': 'https://schema.org', '@type': 'Article', headline: post.title, description: post.excerpt, articleBody: post.body, datePublished: post.published_at, dateModified: post.updated_at || post.published_at, author: { '@type': 'Person', name: post.author?.name }, mainEntityOfPage: canonical, ...(post.cover_image ? { image: post.cover_image } : {}) };
  const safeJsonLd = JSON.stringify(jsonLd).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd }} />
      <p className="text-sm text-slate-500">
        <Link href={`/creators/${params.slug}`} className="hover:text-blue-600">
          Creator
        </Link>{' '}
        / Publicação
      </p>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4"><h1 className="text-4xl font-bold text-slate-900">{post.title}</h1><div className="flex items-center gap-2"><PublicationLikeButton creatorSlug={params.slug} publicationSlug={params.postSlug} initialCount={post.likes_count ?? 0} /><CreatorShareButton endpoint={`/api/v1/creators/${params.slug}/publications/${params.postSlug}/share`} /></div></div>
      {post.excerpt && <p className="mt-4 text-xl text-slate-600">{post.excerpt}</p>}
      <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-500">
        <span>
          {post.published_at ? new Date(post.published_at).toLocaleDateString('pt-BR') : ''}
        </span>
        <span>• {getPublicationTypeLabel(post.publication_type, 'shortLabel')}</span><span>• {readingTime} min de leitura</span>
      </div>
      {post.cover_image && (
        <Image src={post.cover_image} alt={post.title} width={1200} height={630} className="mt-8 max-h-[420px] w-full rounded-2xl object-cover" priority sizes="(max-width: 768px) 100vw, 768px" />
      )}
      {post.author && <p className="mt-4 text-sm text-slate-500">Por {post.author.name}</p>}
      <article className="mx-auto mt-10 max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 whitespace-pre-wrap text-lg leading-relaxed text-slate-700 shadow-sm">
        {post.body}
      </article>
      {post.attachments?.length ? <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-semibold text-slate-900">Materiais complementares</h2><div className="mt-3 grid gap-2">{post.attachments.map((attachment) => <a key={attachment.id} href={attachment.url} target="_blank" rel="noreferrer" className="min-h-11 rounded-xl border border-slate-200 px-3 py-3 text-sm text-blue-700 hover:bg-slate-50">{attachment.filename}</a>)}</div></section> : null}
      <PublicationComments creatorSlug={params.slug} publicationSlug={params.postSlug} enabled={post.comments_enabled ?? false} />
    </main>
  );
}
