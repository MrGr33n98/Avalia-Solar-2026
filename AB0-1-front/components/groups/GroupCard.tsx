import Link from 'next/link';
import { ArrowUpRight, BadgeCheck, Users } from 'lucide-react';

import type { Group } from '@/types/groups';
import { GroupMembershipButton } from './GroupMembershipButton';

type GroupCardProps = {
  group: Group;
};

export function GroupCard({ group }: GroupCardProps) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg font-bold text-blue-700">
            {group.name.trim().charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <Link
              href={`/groups/${group.slug}`}
              className="line-clamp-2 text-base font-bold text-slate-950 outline-none hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              {group.name}
            </Link>
            {(group.verified || group.official) && (
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-blue-700">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                {group.official ? 'Oficial' : 'Verificada'}
              </span>
            )}
          </div>
        </div>
        {group.featured && (
          <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800">
            Destaque
          </span>
        )}
      </div>

      <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-600">
        {group.short_description || 'Descrição não informada.'}
      </p>

      <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
        <Users className="h-4 w-4" aria-hidden="true" />
        <span>{group.stats.members.toLocaleString('pt-BR')} membros</span>
      </div>

      <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4">
        <GroupMembershipButton group={group} compact />
        <Link
          href={`/groups/${group.slug}`}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          Ver grupo
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

export function GroupCardSkeleton() {
  return (
    <div className="h-[280px] animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex gap-3">
        <div className="h-11 w-11 rounded-xl bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-slate-200" />
          <div className="h-3 w-1/3 rounded bg-slate-100" />
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <div className="h-3 rounded bg-slate-100" />
        <div className="h-3 w-5/6 rounded bg-slate-100" />
        <div className="h-3 w-2/3 rounded bg-slate-100" />
      </div>
      <div className="mt-10 h-11 rounded-xl bg-slate-100" />
    </div>
  );
}