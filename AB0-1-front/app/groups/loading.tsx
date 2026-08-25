import { GroupCardSkeleton } from '@/components/groups/GroupCard';

export default function GroupsLoading() {
  return <main className="min-h-screen bg-slate-50 px-4 py-10"><div className="mx-auto max-w-7xl"><div className="mb-8 h-24 w-full animate-pulse rounded-2xl bg-slate-200" /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <GroupCardSkeleton key={index} />)}</div></div></main>;
}