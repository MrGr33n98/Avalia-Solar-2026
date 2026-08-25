import { GroupHeroSkeleton } from '@/components/groups/GroupHero';
import { GroupMembersSkeleton } from '@/components/groups/GroupMembersPreview';

export default function GroupDetailLoading() {
  return <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6"><div className="mx-auto max-w-7xl"><GroupHeroSkeleton /><div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]"><div className="space-y-6"><div className="h-16 animate-pulse rounded-2xl bg-slate-200" /><div className="h-72 animate-pulse rounded-2xl bg-white" /><GroupMembersSkeleton /></div><div className="hidden h-64 animate-pulse rounded-2xl bg-white lg:block" /></div></div></main>;
}