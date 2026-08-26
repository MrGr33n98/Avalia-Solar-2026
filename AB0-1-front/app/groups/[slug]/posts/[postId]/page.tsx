import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { GroupPostCard } from '@/components/groups/GroupPostCard';
import { getGroup, getGroupPost } from '@/lib/api/groups';
import { getGroupsServerHeaders } from '@/lib/api/groups-server';
import { isGroupsEnabled } from '@/lib/features/groups';
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema';
import { SITE, absoluteUrl } from '@/lib/site';

type GroupPostPageProps = {
  params: {
    slug: string;
    postId: string;
  };
};

export async function generateMetadata({ params }: GroupPostPageProps): Promise<Metadata> {
  if (!isGroupsEnabled()) return {};

  try {
    const headers = getGroupsServerHeaders();
    const group = await getGroup(params.slug, headers);
    const post = await getGroupPost(params.slug, params.postId, headers);

    const isPublic = group.visibility === 'public';
    const isActive = group.status === 'active';
    const isPublished = post.status === 'published';
    const isIndexable = isPublic && isActive && isPublished;

    const title = post.title
      ? `${post.title} | ${group.name} — Avalia Solar`
      : `Discussão em ${group.name} — Avalia Solar`;

    // Strip markdown or basic tags if any, limit description to ~150-160 chars
    const description = post.body
      ? post.body.replace(/[#*`_\-\[\]()]/g, '').substring(0, 155).trim() + (post.body.length > 155 ? '...' : '')
      : 'Participe da discussão na comunidade de energia solar.';

    const canonical = absoluteUrl(`/groups/${group.slug}/posts/${post.id}`);

    const ogImages = [];
    if (group.hero_preview_url) {
      ogImages.push({ url: group.hero_preview_url });
    } else if (group.avatar_url) {
      ogImages.push({ url: group.avatar_url });
    } else {
      ogImages.push({ url: absoluteUrl(SITE.ogImagePath) });
    }

    return {
      title,
      description,
      alternates: {
        canonical,
      },
      robots: {
        index: isIndexable,
        follow: isIndexable,
      },
      openGraph: {
        type: 'article',
        title,
        description,
        url: canonical,
        siteName: SITE.name,
        publishedTime: post.created_at,
        modifiedTime: post.updated_at,
        images: ogImages,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: ogImages.map((img) => img.url),
      },
    };
  } catch {
    return {
      title: 'Discussão | Avalia Solar',
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

export default async function GroupPostDetailPage({ params }: GroupPostPageProps) {
  if (!isGroupsEnabled()) notFound();

  let group;
  let post;

  try {
    const headers = getGroupsServerHeaders();
    group = await getGroup(params.slug, headers);
    post = await getGroupPost(params.slug, params.postId, headers);
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status?: number }).status === 404) {
      notFound();
    }
    return <GroupPostDetailError groupSlug={params.slug} />;
  }

  const date = new Date(post.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Safe structured data payload construction
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    'headline': post.title || `Discussão em ${group.name}`,
    'text': post.body,
    'datePublished': post.created_at,
    'dateModified': post.updated_at,
    'url': absoluteUrl(`/groups/${group.slug}/posts/${post.id}`),
    'author': {
      '@type': 'Person',
      'name': post.author.name || 'Membro da comunidade',
    },
    'commentCount': post.stats?.comments_count || 0,
    'isPartOf': {
      '@type': 'WebPage',
      'url': absoluteUrl(`/groups/${group.slug}`),
    },
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:py-10">
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: '/' },
          { name: 'Comunidades', item: '/groups' },
          { name: group.name, item: `/groups/${group.slug}` },
          { name: post.title || 'Discussão', item: `/groups/${group.slug}/posts/${post.id}` },
        ]}
      />
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <div className="mx-auto max-w-4xl">
        <nav className="mb-5 text-sm" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-slate-500">
            <li>
              <Link href="/groups" className="font-semibold text-blue-700 hover:text-blue-800">
                Comunidades
              </Link>
            </li>
            <li><span className="text-slate-400">/</span></li>
            <li>
              <Link href={`/groups/${group.slug}`} className="font-semibold text-blue-700 hover:text-blue-800">
                {group.name}
              </Link>
            </li>
            <li><span className="text-slate-400">/</span></li>
            <li className="font-medium text-slate-600 truncate max-w-[200px]" aria-current="page">
              {post.title || 'Discussão'}
            </li>
          </ol>
        </nav>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <header className="border-b border-slate-100 pb-4">
            {post.title && (
              <h1 className="text-2xl font-bold text-slate-950 mb-2">
                {post.title}
              </h1>
            )}
            <div className="flex items-center space-x-3 text-sm text-slate-500">
              <span>Por <strong>{post.author.name || 'Membro'}</strong></span>
              <span>•</span>
              <time dateTime={post.created_at}>{date}</time>
              {post.topic && (
                <>
                  <span>•</span>
                  <span className="font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full text-xs">
                    {post.topic.name}
                  </span>
                </>
              )}
            </div>
          </header>

          <section className="prose max-w-none text-slate-800 leading-relaxed">
            <p className="whitespace-pre-wrap">{post.body}</p>
          </section>

          <div className="pt-4 border-t border-slate-100">
            <GroupPostCard post={post} />
          </div>
        </article>

        <div className="mt-5 text-sm">
          <Link href={`/groups/${group.slug}`} className="font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1.5">
            ← Voltar para {group.name}
          </Link>
        </div>
      </div>
    </main>
  );
}

function GroupPostDetailError({ groupSlug }: { groupSlug: string }) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-950">Não foi possível carregar esta discussão</h1>
        <p className="mt-2 text-sm text-slate-600">Tente novamente em alguns instantes.</p>
        <Link
          href={`/groups/${groupSlug}`}
          className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Voltar para a comunidade
        </Link>
      </div>
    </main>
  );
}
