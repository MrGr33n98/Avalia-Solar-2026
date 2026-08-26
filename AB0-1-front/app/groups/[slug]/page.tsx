import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { GroupHero } from '@/components/groups/GroupHero';
import { GroupMembersPreview } from '@/components/groups/GroupMembersPreview';
import { GroupsSidebar } from '@/components/groups/GroupsSidebar';
import { GroupRules } from '@/components/groups/GroupRules';
import { GroupTopics } from '@/components/groups/GroupTopics';
import { GroupFeed } from '@/components/groups/GroupFeed';
import { getGroup, getMembers, getRules, getTopics } from '@/lib/api/groups';
import { getGroupsServerHeaders } from '@/lib/api/groups-server';
import { isGroupsEnabled } from '@/lib/features/groups';

import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema';
import { SITE, absoluteUrl } from '@/lib/site';

type GroupPageProps = {
  params: { slug: string };
};

export async function generateMetadata({ params }: GroupPageProps): Promise<Metadata> {
  if (!isGroupsEnabled()) return {};
  try {
    const group = await getGroup(params.slug, getGroupsServerHeaders());
    const isPublic = group.visibility === 'public';
    const isActive = group.status === 'active';
    const isIndexable = isPublic && isActive;

    const title = `${group.name} | Comunidades Avalia Solar`;
    const description = group.short_description || group.description || 'Participe da discussão na comunidade de energia solar.';
    const canonical = absoluteUrl(`/groups/${group.slug}`);

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
        type: 'website',
        title,
        description,
        url: canonical,
        siteName: SITE.name,
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
      title: 'Comunidade | Avalia Solar',
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

export default async function GroupDetailPage({ params }: GroupPageProps) {
  if (!isGroupsEnabled()) notFound();

  let group;
  try {
    group = await getGroup(params.slug, getGroupsServerHeaders());
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status?: number }).status === 404) notFound();
    return <GroupDetailError />;
  }

  const [membersResult, topicsResult, rulesResult] = await Promise.allSettled([
    getMembers(params.slug, getGroupsServerHeaders()),
    getTopics(params.slug, getGroupsServerHeaders()),
    getRules(params.slug, getGroupsServerHeaders()),
  ]);
  const members = membersResult.status === 'fulfilled' ? membersResult.value : [];
  const topics = topicsResult.status === 'fulfilled' ? topicsResult.value : [];
  const rules = rulesResult.status === 'fulfilled' ? rulesResult.value : [];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:py-10">
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: '/' },
          { name: 'Comunidades', item: '/groups' },
          { name: group.name, item: `/groups/${group.slug}` }
        ]}
      />
      <div className="mx-auto max-w-[1320px]">
        <div className="mb-5 text-sm">
          <Link href="/groups" className="font-semibold text-blue-700 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
            Comunidades
          </Link>
          <span className="mx-2 text-slate-400">/</span>
          <span className="text-slate-500 font-medium">{group.name}</span>
        </div>

        <GroupHero group={group} />

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-6">
            <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm no-scrollbar scrollbar-none" aria-label="Seções da comunidade">
              <a href="#discussions" className="min-h-11 whitespace-nowrap rounded-xl bg-blue-50/80 px-4 py-2.5 text-sm font-semibold text-blue-700 border border-blue-100/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                Discussões
              </a>
              {topics.length > 0 && (
                <a href="#topics" className="min-h-11 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                  Assuntos
                </a>
              )}
              <a href="#members" className="min-h-11 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                Membros
              </a>
              {rules.length > 0 && (
                <a href="#rules" className="min-h-11 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                  Regras
                </a>
              )}
            </nav>

            <GroupFeed group={group} topics={topics} />
            
            {topics.length > 0 && <GroupTopics topics={topics} />}
            
            <GroupMembersPreview members={members} />
            
            {rules.length > 0 && <GroupRules rules={rules} />}
          </div>
          <GroupsSidebar group={group} />
        </div>
      </div>
    </main>
  );
}

function GroupDetailError() {
  return <main className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4"><div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><h1 className="text-xl font-bold text-slate-950">Não foi possível carregar esta comunidade</h1><p className="mt-2 text-sm text-slate-600">Tente novamente em alguns instantes.</p><a href="/groups" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">Voltar para comunidades</a></div></main>;
}