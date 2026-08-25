import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { GroupHero } from '@/components/groups/GroupHero';
import { GroupMembersPreview } from '@/components/groups/GroupMembersPreview';
import { GroupsSidebar } from '@/components/groups/GroupsSidebar';
import { GroupRules } from '@/components/groups/GroupRules';
import { GroupTopics } from '@/components/groups/GroupTopics';
import { getGroup, getMembers, getRules, getTopics } from '@/lib/api/groups';

type GroupPageProps = {
  params: { slug: string };
};

function groupsEnabled() {
  return process.env.NEXT_PUBLIC_FEATURE_GROUPS !== 'false' && process.env.NEXT_PUBLIC_GROUPS_ENABLED !== 'false';
}

export async function generateMetadata({ params }: GroupPageProps): Promise<Metadata> {
  if (!groupsEnabled()) return {};
  try {
    const group = await getGroup(params.slug);
    return { title: `${group.name} | Comunidades Avalia Solar`, description: group.short_description || group.description || undefined };
  } catch {
    return { title: 'Comunidade | Avalia Solar' };
  }
}

export default async function GroupDetailPage({ params }: GroupPageProps) {
  if (!groupsEnabled()) notFound();

  let group;
  try {
    group = await getGroup(params.slug);
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status?: number }).status === 404) notFound();
    return <GroupDetailError />;
  }

  const [membersResult, topicsResult, rulesResult] = await Promise.allSettled([
    getMembers(params.slug),
    getTopics(params.slug),
    getRules(params.slug),
  ]);
  const members = membersResult.status === 'fulfilled' ? membersResult.value : [];
  const topics = topicsResult.status === 'fulfilled' ? topicsResult.value : [];
  const rules = rulesResult.status === 'fulfilled' ? rulesResult.value : [];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 text-sm"><a href="/groups" className="font-semibold text-blue-700 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">Comunidades</a><span className="mx-2 text-slate-400">/</span><span className="text-slate-500">{group.name}</span></div>
        <GroupHero group={group} />
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0 space-y-6">
            <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm" aria-label="Seções da comunidade">
              <a href="#topics" className="min-h-11 whitespace-nowrap rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">Visão geral</a>
              <a href="#members" className="min-h-11 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">Membros</a>
              <a href="#rules" className="min-h-11 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">Regras</a>
            </nav>
            <GroupTopics topics={topics} />
            <GroupMembersPreview members={members} />
            <GroupRules rules={rules} />
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