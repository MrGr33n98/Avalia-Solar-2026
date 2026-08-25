'use client';

import { useQuery } from '@tanstack/react-query';
import { getGroupPosts } from '@/lib/api/groups';
import type { Group, GroupTopic } from '@/types/groups';
import { GroupPostCard, GroupPostEmptyState, GroupPostSkeleton } from './GroupPostCard';
import { GroupPostComposer } from './GroupPostComposer';

export function GroupFeed({ group, topics }: { group: Group; topics: GroupTopic[] }) {
  const postsQuery = useQuery({
    queryKey: ['group-posts', group.slug],
    queryFn: () => getGroupPosts(group.slug),
    enabled: Boolean(group.slug),
  });
  return <section id="discussions" className="space-y-5" aria-labelledby="discussions-title"><div className="flex items-center justify-between"><h2 id="discussions-title" className="text-xl font-bold text-slate-950">Discussões</h2>{postsQuery.data && <span className="text-sm text-slate-500">{postsQuery.data.length} publicações</span>}</div><GroupPostComposer group={group} topics={topics} />{postsQuery.isLoading ? <div className="space-y-4"><GroupPostSkeleton /><GroupPostSkeleton /></div> : postsQuery.isError ? <div className="rounded-2xl border border-red-200 bg-white p-6 text-center"><p className="font-semibold text-slate-900">Não foi possível carregar as discussões.</p><button type="button" onClick={() => postsQuery.refetch()} className="mt-4 min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-blue-700">Tentar novamente</button></div> : postsQuery.data?.length ? <div className="space-y-4">{postsQuery.data.map((post) => <GroupPostCard key={post.id} post={post} />)}</div> : <GroupPostEmptyState />}</section>;
}