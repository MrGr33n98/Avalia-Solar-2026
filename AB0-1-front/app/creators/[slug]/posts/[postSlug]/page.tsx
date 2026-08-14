import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildApiUrl, getApiRequestHeaders } from '@/lib/api-config';
import Link from 'next/link';
import { PublicationComments } from '@/components/creator/PublicationComments';

type Post = {
  title: string;
  excerpt?: string;
  body: string;
  published_at?: string;
  updated_at?: string;
  publication_type?: string;
  category?: string;
  cover_image?: string | null;
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
      <h1 className="mt-3 text-4xl font-bold text-slate-900">{post.title}</h1>
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
      <article className="mx-auto mt-10 max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 whitespace-pre-wrap text-lg leading-relaxed text-slate-700 shadow-sm">
        {post.body}
      </article>
    </main>
  );
}
