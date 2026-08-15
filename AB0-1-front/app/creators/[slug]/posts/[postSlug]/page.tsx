import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildApiUrl, getApiRequestHeaders } from '@/lib/api-config';
import Link from 'next/link';
import { PublicationComments } from '@/components/creator/PublicationComments';
import { CreatorShareButton } from '@/components/creator/CreatorShareButton';

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
  return {
    title: `${post.title} | Avalia Solar`,
    description: post.excerpt,
    alternates: { canonical: `/creators/${params.slug}/posts/${params.postSlug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      images: post.cover_image ? [post.cover_image] : undefined,
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
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-sm text-slate-500">
        <Link href={`/creators/${params.slug}`} className="hover:text-blue-600">
          Creator
        </Link>{' '}
        / Publicação
      </p>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4"><h1 className="text-4xl font-bold text-slate-900">{post.title}</h1><CreatorShareButton endpoint={`/api/v1/creators/${params.slug}/publications/${params.postSlug}/share`} /></div>
      {post.excerpt && <p className="mt-4 text-xl text-slate-600">{post.excerpt}</p>}
      <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-500">
        <span>
          {post.published_at ? new Date(post.published_at).toLocaleDateString('pt-BR') : ''}
        </span>
        {post.publication_type && <span>• {post.publication_type}</span>}
      </div>
      {post.cover_image && (
        <img
          src={post.cover_image}
          alt=""
          className="mt-8 max-h-[420px] w-full rounded-2xl object-cover"
        />
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
